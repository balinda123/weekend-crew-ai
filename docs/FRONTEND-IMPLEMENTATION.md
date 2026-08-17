# 《馋猫局儿》前端实现说明

**版本：** v0.3
**目标端：** 微信小程序优先，Taro + React + TypeScript
**原型参考：** prototype/index.html

## 1. 技术基线

| 范围 | 选择 |
|---|---|
| 框架 | Taro + React + TypeScript（strict） |
| UI | NutUI React Taro + 业务组件 |
| 样式 | SCSS + CSS Variables，适配安全区 |
| 请求与缓存 | TanStack Query |
| 本地 UI 状态 | Zustand 或页面内 reducer |
| 表单与校验 | React Hook Form + Zod |
| 地图 | 小程序 Map 组件，后端返回高德业务数据 |
| 拖拽 | 小程序兼容的 touch gesture 封装 |
| 测试 | Vitest + Testing Library + 小程序端到端测试 |

## 2. 路由与页面

| 路由 | 页面 | 主要职责 |
|---|---|---|
| /pages/login/index | 首次登录 | 微信身份交换、协议确认、头像昵称确认、登录后路由恢复 |
| /pages/home/index | 首页 | 新建入口、进行中攻略、公开广场 |
| /pages/search/index | 搜索结果 | 关键词查询、瀑布流结果 |
| /pages/trip/index | 行程工作台 | 地图与行程、AA 账本 |
| /pages/profile/index | 我的 | 我创建的、我加入的、收藏、登录资料与发布状态 |
| /pages/public-trip/index | 公开攻略详情 | 脱敏预览、复制为新攻略 |

全局 TabBar 仅配置首页和我的。搜索与行程工作台使用页面栈返回，不出现在 TabBar。

## 3. 页面状态合同

### 3.1 新建攻略

~~~ts
type CreateTripForm = {
  name: string
  provinceCode: string
  cityCode: string
  districtCode: string
  startDate: string
  endDate: string
}
~~~

- 不包含 companionType 和 perCapitaBudget。
- 热门目的地只是三级选择器的快捷赋值，不是另一套状态。
- 行政区划展示名称和 code 分离存储。
- 创建成功后导航至 /pages/trip/index?id={tripId}。
- 客户端派生 `dayCount = endDate - startDate + 1`，渲染 Day 1…N；服务端返回值是最终真相。

### 3.2 AI 规划门槛

~~~ts
type PlanningGate =
  | { status: 'locked'; confirmedPlaceCount: 0 | 1 | 2; required: 3 }
  | { status: 'ready'; confirmedPlaceCount: number; required: 3 }
  | { status: 'generating'; taskId: string }
  | { status: 'failed'; reason: string; retryable: boolean }
  | { status: 'generated'; planVersion: string }
~~~

前端由 confirmedPlaceCount 计算按钮状态；后端创建 AI task 时再次校验。不能只依赖 disabled 属性。

### 3.3 AA 结算

~~~ts
type SettlementState =
  | { status: 'ledger_draft'; ledgerVersion: string }
  | { status: 'generating'; ledgerVersion: string; taskId: string }
  | { status: 'ready'; ledgerVersion: string; result: SettlementResult }
  | { status: 'stale'; ledgerVersion: string; previousVersion: string }
  | { status: 'error'; ledgerVersion: string; message: string }
~~~

任何账单 mutation 成功后：

1. 精准失效账本 query。
2. 将 ready 结算切换为 stale。
3. 从界面隐藏旧转账列表。
4. 禁止复制旧方案。
5. 用户重新点击生成后才进入 ready。

### 3.4 积分账户与配额

~~~ts
type CreditReason =
  | 'signup_grant'
  | 'ai_plan'
  | 'link_parse'
  | 'public_trip_reward'
  | 'refund'

type CreditLedgerEntry = {
  id: string
  userId: string
  delta: number
  balanceAfter: number
  reason: CreditReason
  ruleVersion: string
  idempotencyKey: string
  taskId?: string
  createdAt: string
}

type AiQuota = {
  creditBalance: number
  monthlyPlanUsed: number
  monthlyPlanLimit: number
  dailyTaskUsed: number
  dailyTaskLimit: number
}
~~~

- 前端只消费服务端余额与流水，不做权威扣减。
- AI 任务采用 reserve → confirm / release：创建任务先预占，成功确认，失败或取消释放。
- 按钮禁用条件同时包含业务门槛、积分余额和限频状态。
- 同一个 idempotencyKey 不得产生两笔扣分。
- 公开攻略奖励必须来自审核事件，不能由客户端点击直接领取。

### 3.5 链接解析任务

~~~ts
type LinkParseTask =
  | { status: 'validating' }
  | { status: 'queued'; taskId: string }
  | { status: 'extracting'; progress: number }
  | { status: 'needs_fallback'; fallback: 'paste_text' | 'upload_screenshot' }
  | { status: 'ready'; candidates: ExtractedPlaceCandidate[] }
  | { status: 'failed'; code: string; charged: false }

type ExtractedPlaceCandidate = {
  localId: string
  name: string
  category: string
  areaText?: string
  note?: string
  confidence: number
  poiCandidates: PoiCandidate[]
  selectedPoiId?: string
}
~~~

处理链路：

1. 客户端校验链接格式并提交，不在 WebView 内抓页面。
2. 后端规范化 URL，检查缓存和域名白名单。
3. 优先读取允许使用的开放接口或公开分享元信息。
4. 内容不可访问时返回 needs_fallback，引导复制文字或上传截图。
5. OCR/视觉模型/LLM 提取地点实体，随后调用地图 POI 检索。
6. 用户多选候选，并在写入前确认名称和 POI。
7. 只有 ready 成功态确认扣除积分。

### 3.6 登录、资料与攻略可见性

~~~ts
type AuthState =
  | { status: 'guest' }
  | { status: 'exchanging_code' }
  | { status: 'authenticated'; user: UserProfile; profileComplete: boolean }
  | { status: 'failed'; message: string; retryable: boolean }

type TripVisibility = 'private' | 'reviewing' | 'published'

type ProfileTripScope = 'owned' | 'joined' | 'saved'
~~~

- App 根节点使用统一 AuthGate；未建立业务会话时只渲染首次登录页，首页、公开广场、公开详情和业务页都不进入页面栈。
- 登录先调用平台登录能力取得一次性 code，再请求服务端换取业务会话；code 不写入日志或持久化。
- 开发时以微信官方 `wx.login` 与用户信息能力文档为准：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html、https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html。
- 头像使用小程序头像选择能力，昵称使用用户可编辑输入；两者由用户确认后 PATCH 到资料接口，不能假设静默读取。
- 首次登录将身份交换和资料确认拆成两步；资料确认完成后 AuthGate 才放行。后续资料更新失败不得销毁已建立会话。
- 新建攻略成功态默认为 private；只有创建者和成员使用私密 trip API。
- 发布确认页展示公开字段 allow-list，提交后为 reviewing；只有服务端返回 published 才在公开列表出现。
- `TripVisibility = 'private' | 'reviewing' | 'published'`；`reviewing` 表示已提交审核、尚未生成公开快照，前端在个人列表与卡片标签中明确区分三种状态。
- 行程工作台（ItineraryPanel）标题区新增“发布”按钮，满足 `itineraryGenerated || stops.length >= 3` 时启用，否则禁用并显示门槛提示；点击后复用 PublishGuideSheet。

## 4. 组件边界

### 首页

- CreateTripHero：将新建攻略作为首页第一视觉层级，展示“新建 → 收藏 3 地 → AI 规划”的短流程和唯一主 CTA。
- CreateTripSheet：名称、热门目的地、三级联动、日期。
- ActiveTripPreview：最近进行中攻略。
- PublicTripSearchEntry：跳转搜索页，不承载语音。
- PublicTripMasonry / PublicTripCard：瀑布流与卡片。
- PublicTripDetailPage：只消费 PublicGuideSnapshot DTO，复用地图工作台骨架，上方渲染公开路线地图，下方渲染只读抽屉；组件树中不引入 AA 模块。
- PublicTripDrawer：包含 PlaceOverviewPanel 与按 Day 1…N 分组的 PublicItineraryPanel，支持 default/expanded 高度。
- PublicPrivacyNotice：首屏提示账单、成员和来源链接不公开。

### 行程工作台

- TripWorkspaceHeader：返回、标题、元信息、成员头像、一级页签。
- TripMapCanvas：markers、polyline、viewport 和地图事件，不请求业务 API。
- TripMapDrawer：负责抽屉高度和二级标签。
- PlaceCollectionPanel：成员共享地点列表、投票、评论和添加入口。
- PlaceCard：单地点信息与操作。
- ItineraryPanel：依据 startDate/endDate 固定渲染 Day 1…N，包含空白日、方案版本和每日日程。
- EditableStopCard：编辑、删除和拖拽手柄。
- StopEditorSheet：AI 节点与手动节点共用，必填 dayIndex、localStartTime 和地点；支持改到其他日期。
- PlanningGateBar：地点门槛文案与 AI 生成按钮；门槛不得禁用手动创建入口。
- ItineraryPanelHeader：在行程列表标签旁暴露“发布”操作，受行程节点数 ≥3（或已生成 AI 行程）控制，未满足时展示禁用态与提示文案。
- AiPlanningProgress：轮询、取消、失败和重试。

### AA

- LedgerPanel：汇总、明细和新增账单。
- ExpenseEditorSheet：付款人、参与人、金额和份额。
- SettlementStageTabs：记账/结算方案两阶段导航。
- SettlementPlaceholder：未生成或已失效状态。
- SettlementResultPanel：只渲染服务端确定性结果。
- CatGuide：芝士/奶糖的状态化提示，不充当全局聊天框。


### 添加地点、我的与设置

- AddPlaceHubSheet：仅保留搜索地点、链接识别两个横向分段模式，不渲染地图选点入口；固定搜索输入和候选操作列尺寸，窄屏不得溢出。
- PlaceSearchPanel：最近搜索、POI 候选和空状态。
- LinkImportPanel：链接输入、成本提示、异步解析与合规降级。
- ExtractedPlaceList：候选勾选、置信度、全选和批量导入。
- PlaceEditorSheet：统一编辑搜索与链接产生的地点草稿。
- ProfileHeaderCard：将头像、等级、微信资料、设置、积分余额、预计可生成次数和本月用量合并为一个紧凑资料区。
- ProfileTripTabs：我创建的、我加入的、收藏。
- ProfileTripCard：与首页卡片共享圆角、内边距和元信息规范；展示 private/reviewing/published。
- PublishGuideSheet：展示公开 allow-list、继续私密字段和确认复选框。
- FirstLoginPage：协议确认、微信快捷登录主操作、基础积分说明。
- WechatProfileConfirmSheet：身份交换完成后选择头像和确认昵称；首次确认成功再进入首页。

- ThemePicker：四套原型主题即时切换并本地持久化；正式品牌主题由产品配置确定。
- SettingsPage：配色候选、积分规则、流水入口、授权、隐私、通知与存储。
- QuotaGate：统一计算积分不足、次数超限和业务数据不足。

## 5. 地图与抽屉交互

抽屉状态：

~~~ts
type DrawerSnap = 'collapsed' | 'default' | 'expanded'
type DrawerTab = 'places' | 'itinerary'
~~~

- 页面打开：default + places。
- 点击 marker：选中对应实体；若抽屉为 collapsed，恢复 default。
- 点击二级标签：切换面板并保持当前 snap。
- AI 生成完成：切换为 expanded + itinerary。
- 地图手势开始：可选择降至 collapsed，避免抽屉抢占地图操作。
- 地图不可用：抽屉扩展为全屏列表，所有非地图功能保留。

列表与地图共享 selectedPlaceId。marker 和列表项不得各自维护选中状态。

## 6. 行程编辑与拖拽

- 拖拽只从显式手柄开始，避免与抽屉滚动冲突。
- 拖拽中冻结对应日期分组的高度。
- 乐观更新顺序，失败时回滚并提示。
- 每次修改携带 planVersion；冲突时不静默覆盖。
- 编辑字段：所属 dayIndex、该天开始时间、建议时长、地点、备注；手动新增使用同一字段合同。
- 手动改动后显示“已手动调整”，重新规划前给出影响范围。
- 原型允许跨日拖拽并更新 dayIndex；生产环境提交后端事务，重新计算来源日与目标日的交通段，失败时整体回滚。

## 7. 搜索与瀑布流

~~~ts
type PublicTripSearchParams = {
  keyword: string
  cursor?: string
  tags?: string[]
}
~~~

- 输入提交后更新页面标题与 query，不在每次按键时请求。
- 若做联想，最少输入 2 个字符，300 至 500ms 防抖。
- 瀑布流使用稳定卡片宽度与图片比例，加载前预留高度，避免布局跳动。
- 搜索结果只返回公开快照，严禁复用私密 trip API。
- 无结果、加载中、网络失败分别设计状态。

## 8. AA 计算边界

客户端仅负责编辑和展示，服务端是结算真相来源。

~~~ts
type MoneyFen = number

type ExpenseInput = {
  title: string
  amountFen: MoneyFen
  payerId: string
  participantIds: string[]
  splitMode: 'equal' | 'shares' | 'custom'
  shares?: Record<string, number>
  placeId?: string
}

type Transfer = {
  fromMemberId: string
  toMemberId: string
  amountFen: MoneyFen
}
~~~

- 金额全程使用整数分。
- 自定义分摊提交前校验合计。
- 结算结果校验所有成员净额之和为 0。
- 生成接口必须接收 ledgerVersion，过期版本返回明确冲突错误。
- 复制内容包含攻略名、结算版本和转账列表，不包含敏感支付账号。

## 9. API 建议

~~~text
POST   /trips
GET    /trips/:tripId
GET    /trips/:tripId/places
POST   /trips/:tripId/places
POST   /trips/:tripId/places/:placeId/votes
POST   /trips/:tripId/planning-tasks
GET    /planning-tasks/:taskId
PATCH  /trips/:tripId/plans/:planId/stops/:stopId
PUT    /trips/:tripId/plans/:planId/order
GET    /public-trips/search
GET    /public-trips/:snapshotId
GET    /trips/:tripId/expenses
POST   /trips/:tripId/expenses
POST   /trips/:tripId/settlements
GET    /trips/:tripId/settlements/:settlementId
GET    /me/credits
GET    /me/credits/ledger
GET    /me/ai-quota
POST   /trips/:tripId/link-parse-tasks
GET    /link-parse-tasks/:taskId
POST   /trips/:tripId/places/batch
DELETE /me/link-parse-records/:recordId
POST   /auth/wechat/session
PATCH  /me/profile
GET    /me/trips?scope=owned|joined|saved
POST   /trips/:tripId/publication-submissions
~~~

AI 行程只有在 task 状态为 ready 且 schema 校验成功后才能写入正式 plan。AA 结算不使用 LLM，由确定性算法完成。

## 10. 视觉与适配

原型配色候选：

| 主题 | 主色 | 辅色 | 状态色 | 定位 |
|---|---|---|---|---|
| 日光橘（默认） | #FF643D | #FFD45A | #248FB4 | 最接近现有品牌，活泼但稳定 |
| 珊瑚汽水 | #F95772 | #55C6EB | #168B73 | 更年轻、清爽 |
| 青柚森林 | #1EAA78 | #FFD45A | #297F9E | 户外感更强 |
| 莓果晴空 | #EE5688 | #7B72EE | #159783 | 更可爱，需避免紫色占比过高 |

共享中性色保持 `#17212B` 主文字、`#6C7887` 次文字、`#F7F8F8` 背景、`#E8E9E7` 边框。渐变只用于主 CTA、关键品牌卡和目的地封面，不用于大面积页面背景。正式开发前从四套候选中固化一套；原型 ThemePicker 仅用于方向比较。

字体层级：

| 层级 | 字号 | 字重 | 用途 |
|---|---:|---:|---|
| Display | 24–26px | 800 | 首页主视觉 |
| H1 | 18–20px | 700–800 | 页面标题 |
| H2 | 15–17px | 700 | 区块和弹窗标题 |
| Body | 12–14px | 400–600 | 正文、列表 |
| Meta | 9–11px | 400–700 | 标签、说明 |

- 全局内容卡默认圆角 18px、内边距 12–16px、1px 浅边框和轻阴影；卡片不互相嵌套。
- 首页瀑布流卡和我的攻略卡共享文字边距、元信息间距、封面色与状态标签规范。
- 主操作放在单手拇指舒适区。
- 适配 375×812、390×844 和安全区。
- 长攻略名、长地点名必须省略或换行，不能挤压头像和按钮。
- 尊重 prefers-reduced-motion。

## 11. 测试门槛

单元测试：

- 三级地区联动和热门目的地同步。
- 积分预占、确认、释放和幂等流水。
- 链接解析成功扣分、失败不扣、缓存命中策略。
- 批量导入去重、低置信度确认和 POI 必选。
- 规划门槛 0/1/2/3/4 个地点。
- 金额转分、分摊合计和账本版本失效。
- 搜索参数序列化。
- 行程排序乐观更新与回滚。

端到端：

1. 新建攻略，确认没有同伴和预算字段。
2. 依次添加 3 个地点，验证按钮从禁用变为可用。
3. 生成行程，编辑节点并拖拽排序。
4. 从广场进入搜索页并返回。
5. 进入 AA，初始无结果；生成后出现 2 笔转账。
6. 新增账单后旧结算消失，再生成后恢复。
7. 375px 和 390px 宽度无横向滚动与遮挡。
8. 从地点搜索进入编辑页，修改后保存到地点合集。
9. 解析分享链接，验证成功扣分、候选多选和批量去重。
10. AI 任务成功后扣分；取消、失败和重复回调不重复扣分。
11. 从浅色个人中心进入设置页，积分余额与使用次数保持一致。
12. 添加地点面板只存在搜索地点和链接识别，不出现地图选点或对应空状态文案。
13. 我的页面分别加载 owned、joined、saved；私密卡可提交发布，发布中与已发布状态不可混淆。
14. 首次启动只显示登录页；同意协议、完成微信身份交换和头像昵称确认后进入首页，分享深链恢复目标详情。
15. 四套主题切换后 CTA、卡片强调色和状态色同步变化，刷新后仍保留当前原型选择。
16. 首页、搜索和收藏卡片进入同一公开详情；网络响应和组件树均不存在 expense、split、transfer、member 或 sourceLink 字段。
17. 发布确认显著展示“AA 账单与转账关系永不公开”；套用公开攻略后创建 private 攻略且账本为空。
18. 添加地点面板在 375px/390px 下无横向滚动，搜索按钮和候选编辑按钮尺寸稳定。
19. 个人页积分指标合并进 ProfileHeaderCard，390×844 下第一张攻略卡主要信息完整可见。
20. 公开详情使用地图 + 只读抽屉，地点总览与按天行程标签可切换、展开和返回。
21. 选择 9 月 12 日至 9 月 15 日创建 4 个日期分组；AI 节点、手动节点和跨天编辑都不超出 Day 1…4；只有 1–2 个已确认地点时仍能手动创建。
22. 公开攻略套用后保留 startDate/endDate/dayIndex，创建 private 攻略且 expenses 为空。

## 12. 原型与生产差异

当前 HTML 原型使用本地数据和视觉地图，用于验证交互与信息架构。生产实现需要替换为：

- 完整全国行政区划数据源。
- 服务端积分账本、AI 配额与任务预占。
- 受控的分享链接解析、OCR 降级与 POI 校验。
- 真实地图 SDK、POI 搜索和路线计算。
- 服务端协同、权限和版本冲突处理。
- AI 异步任务与可恢复轮询。
- 确定性 AA 结算 API。
- 微信 code 换取会话、头像/昵称确认与统一 AuthGate。
- 私密攻略查询、我创建/我加入/收藏列表、发布审核状态机。
- 公开内容审核和搜索索引。
- 原型另含 `prototype/admin.html`，仅作为审核后台的独立交互预览，不是生产路由或管理权限入口。
