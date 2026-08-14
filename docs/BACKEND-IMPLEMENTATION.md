# 《馋猫局儿》后端实施说明

**负责人：** LLM 应用 / 数据工程
**目标：** 用 FastAPI 交付可验证、可观测、可替换外部服务的 API，而不是将 AI 调用堆进接口函数。

本说明依赖 [共享技术设计](TECHNICAL-DESIGN.md)。字段和对外契约由 OpenAPI 发布，前端不得依赖内部表结构。

## 1. 后端技术基线

| 范围 | 选择 |
|---|---|
| Web API | FastAPI + Pydantic v2 |
| ORM/迁移 | SQLAlchemy 2.x + Alembic |
| 数据库 | PostgreSQL + PostGIS |
| 缓存/队列 | Redis；异步 Worker 与 Web 进程分离 |
| 空间能力 | PostGIS 距离查询 + `MapProvider` 线路/POI 能力 |
| 文件 | S3 兼容对象存储；截图私有访问 |
| 契约 | FastAPI OpenAPI 导出，CI 生成前端 TypeScript 类型 |
| 测试 | pytest、数据库集成测试、外部服务契约 mock、AI 评测集 |

## 2. 推荐模块划分

```text
apps/api/app/
├─ api/              # 路由、DTO、鉴权依赖
├─ domain/           # Crew / Place / Itinerary / Ledger 业务规则
├─ repositories/     # 数据持久化，不包含业务判断
├─ integrations/     # AmapProvider、OCR、LLM、对象存储
├─ workers/          # OCR、POI 匹配、AI 行程等异步任务
├─ schemas/          # Pydantic 请求、响应、LLM 结构化输出
├─ observability/    # 日志、指标、调用成本事件
└─ tests/
```

路由层只做鉴权、参数解析和调用应用服务；不得在路由中直连模型或拼接 SQL。

## 3. 必须先完成的 API 资源

| 资源 | 核心操作 |
|---|---|
| `/auth` | 微信一次性 code 换取业务会话；开发期使用协议一致的 fake provider。 |
| `/crews` | 创建、查看、编辑、归档；访问权限校验。 |
| `/crews/{id}/members` | 邀请、加入、成员列表。 |
| `/crews/{id}/places` | 手动地点、确认候选、投票、状态变更。 |
| `/poi/search` | 代理高德搜索；缓存、限流、标准化结果。 |
| `/uploads` 与 `/ocr-jobs` | 私有上传、任务状态、候选确认。 |
| `/crews/{id}/itineraries` | 生成任务、计划版本、选择与重排。 |
| `/crews/{id}/expenses` | 账目 CRUD、分摊、审计事件、结算建议。 |
| `/guides` | 发布提交、审核状态、公开脱敏快照、收藏与复刻。 |

所有写操作验证调用者是该局成员；局主专属操作（归档、发布攻略等）单独声明权限。

## 4. 高德适配器

定义协议而非在业务服务中调用 HTTP：

```python
class MapProvider(Protocol):
    async def search_poi(self, query: str, *, city: str | None, location: Point | None) -> list[PoiCandidate]: ...
    async def route(self, stops: list[Point], mode: TravelMode) -> RouteResult: ...
    async def distance_matrix(self, origins: list[Point], destinations: list[Point]) -> DistanceMatrix: ...
```

- `AmapProvider` 将高德响应转换成内部 DTO；业务层不暴露其字段名。
- 统一处理超时、重试、限流、可重试/不可重试错误和请求日志。
- Key 只在服务端环境变量中；限制出网访问与日志脱敏。
- 用 `FakeMapProvider` 为路线排序、POI 确认和 API 集成测试提供稳定样本。

## 5. OCR 与 POI 确认管道

1. 上传接口校验文件类型、大小和像素；保存私有对象并创建 `ocr_job`。
2. Worker 用优先 OCR 引擎提取文字，保存原始文本、模型/版本、置信度和耗时。
3. 从文本提取地点候选，调用 `MapProvider.search_poi` 返回最多 3 个 POI。
4. 客户端确认后，事务创建 `Place` 与 `PlaceSource`；未确认候选在过期后清理。
5. 低置信度可进入视觉模型回退；回退条件、输入图片数和成本必须记录。

不得绕过登录、验证码、反爬或权限抓取/镜像受限正文。对于用户主动提交的公开分享链接，按第 11 节的受控解析与降级流程处理。

## 6. 行程生成与 LLM 编排

### 6.1 确定性候选引擎

- 输入：出发/返程点、时间窗、已确认地点、类别、投票、营业时间、交通偏好、预算。
- 输出：可行与不可行地点、距离/时长矩阵、2–3 条候选顺序、硬约束冲突。
- 先从可解释的贪心规则开始：硬约束过滤 → 按距离/时间排序 → 插入用餐时段 → 返回评分原因；保留输入/输出快照。

### 6.2 LLM 责任

LLM 只能：理解自然语言约束、选择受控工具、基于候选计划生成解释、在用户修改后请求重新计算。它不能凭空创建店铺、营业时间、价格、金额或路线距离。

LLM 输出模型至少包含：

```text
plans[]: { title, stops[{ place_id, start_at, end_at }], reasons[], excluded_place_ids[] }
assumptions[]
warnings[]
```

输出通过 Pydantic 校验，并逐项验证 `place_id` 属于当前已确认地点、时间单调、行程不越界；失败时写失败事件，不更新正式行程。

### 6.3 AI 评测与成本

- 准备不少于 10 个匿名化固定场景：多人、地点冲突、营业时间缺失、返程时间紧、用户临时删点等。
- 对每次生成记录：场景、模型、输入长度、输出长度、耗时、工具调用、校验结果、缓存命中、估算成本。
- 同一组局版本和同一指令做幂等缓存；每用户每日最多 3 次、本月最多 5 次行程生成，并同时校验积分余额。

## 7. AA 账本：不可交给 LLM

- `Expense.amount_cents` 与每个 `ExpenseShare.amount_cents` 均为整数分。
- 创建/修改账单在事务内重算分摊；校验分摊和等于消费额。
- 结算算法输入每人净额（实付 - 应付），输出债务人到债权人的最少或近似最少转账集合。
- 关键性质测试：净额总和为 0；输出转账应用后每人余额为 0；重复计算幂等。
- 对账单修改和删除记录审计事件，不删除结算历史快照。

## 8. 发布、隐私和安全

- Crew 创建时 visibility 强制为 private；读取私密实体必须验证 owner 或 CrewMember。
- 创建者提交发布时构建 allow-list 候选快照，只将明确勾选的地点、路线、公开备注和图片写入 PublicationSubmission。
- reviewing 状态不写公开搜索索引；审核通过后事务生成 GuideSnapshot、切换 published、写索引并触发一次幂等积分奖励。
- 默认排除成员昵称/头像、账单、分摊、转账、原始截图、OCR 文本、来源链接和未授权备注。
- 审核拒绝或创建者撤回后恢复 private；已公开快照下架并使缓存失效，但保留审核审计。
- 保存用户图片、位置信息和模型输入的保留期限；提供创建者归档后的清理任务。

## 9. 测试、可观测性与部署

### 测试

- 单元：金额/分摊/债务化简、路线候选评分、权限规则、LLM 输出校验。
- 集成：PostGIS 查询、数据库迁移、组局到结算闭环、攻略脱敏。
- 契约：OpenAPI diff 阻止破坏性字段变更；`AmapProvider` 使用录制样本测试。
- 端到端：与前端共同维护“6 人徐州周末局”验收脚本。

### 指标和日志

至少记录 `request_id`、`crew_id`（可脱敏）、操作类型、耗时、错误码、第三方提供商、缓存命中与估算成本。面板重点看：API 错误率、OCR→POI 确认率、AI 校验失败率、AI 单局成本、地图调用量。

### 部署

本地使用 Docker Compose 启动 API、Postgres/PostGIS、Redis、Worker；开发/测试/生产使用独立密钥与数据库。先部署单一 API 与单一 Worker，出现明确的吞吐或隔离需求后再拆服务。

## 10. 你对象的第一阶段交付

1. 初始化 FastAPI、PostGIS、Alembic、Redis 和测试骨架。
2. 完成 Crew/Member/Place 数据模型、权限依赖和 OpenAPI 发布。
3. 完成 `AmapProvider`、POI 搜索缓存与错误映射；提供 fake 实现。
4. 完成账本分摊、结算算法及性质测试。
5. 建立 OCR/POI 任务状态机，再接入受控 AI 行程生成。

## 11. v0.2 增补：公开广场、链接解析与积分账本

### API 与模块

新增资源：

- GET /public-trips/search：仅搜索通过审核的公开攻略快照。
- GET /public-trips/{snapshot_id}：返回单个公开攻略 allow-list 详情，包含路线与公开媒体，不得包含 Expense、Settlement、CrewMember、PlaceSource 或内部评论字段。
- POST /crews/{id}/link-parse-jobs、GET /link-parse-jobs/{id}：提交公开分享链接并轮询候选。
- POST /crews/{id}/places/batch：批量确认 POI 后写入地点合集，按 provider + provider_poi_id 去重。
- GET /me/credits、GET /me/credits/ledger、GET /me/ai-quota：积分余额、流水与次数限频。
- GET/PATCH /me/settings：通知、隐私与存储偏好。
- POST /auth/wechat/session、PATCH /me/profile：code 换取会话及用户确认后的头像/昵称。
- GET /me/trips?scope=owned|joined|saved：个人攻略分组，严格按 owner/member/public snapshot 查询。
- POST /trips/{id}/publication-submissions、GET /publication-submissions/{id}：发布确认与审核状态。

新增模块：

- integrations/share_link：URL 规范化、域名白名单、允许使用的开放接口或公开分享元信息。
- domain/credits：积分账户、规则版本、预占、确认、释放和奖励防刷。
- workers/link_parse：文本/截图降级、地点实体提取、POI 匹配与成本记录。

### 链接解析边界

后端可以处理用户主动提交的公开分享信息，但不得绕过登录、验证码、反爬或访问权限。处理优先级为：

1. 缓存命中。
2. 平台允许的开放接口或公开分享元信息。
3. 用户复制的公开文字。
4. 用户上传截图，经 OCR/视觉模型提取。
5. MapProvider.search_poi 返回候选，用户确认后才创建 Place。

平台内容不可访问时返回 needs_fallback，而不是尝试规避限制。原始链接私有保存并设置保留期限；公开攻略不包含来源链接。

### 积分与 AI 配额

- 注册赠送 100 分；AI 行程成功一次扣 20 分；链接成功解析一次扣 5 分；公开攻略审核通过奖励 30 分。
- 公开奖励每月最多 3 次；AI 行程每月最多 5 次、每用户每日最多 3 次。
- 消耗使用 reserve → confirm/release 状态机。任务成功确认，失败、取消和超时释放。
- 每笔流水包含 rule_version 与 idempotency_key；重复回调不能重复扣分。
- 创建 AI 行程任务前同时校验：已确认地点不少于 3、积分余额充足、本月和今日配额未耗尽。
- 首版积分不可购买、转赠或提现。

建议数据表：credit_accounts、credit_ledger_entries、credit_reservations、ai_usage_counters、link_parse_jobs、link_parse_candidates、user_settings。

### 新增测试

- 链接域名与 URL 规范化、不可访问时降级、POI 确认后批量去重。
- 积分预占/确认/释放、重复回调幂等、并发余额不透支。
- 注册赠送和公开攻略奖励的唯一性与月度上限。
- 3 地点门槛、余额不足、月度/每日配额达到上限。
- 搜索与公开详情接口不返回私密行程、成员信息、AA 账单、分摊、转账和来源链接；使用响应 DTO allow-list 与序列化快照测试锁定字段。

## 12. v0.3 登录、个人列表与发布状态机

### 微信登录

1. `POST /auth/wechat/session` 接收一次性 code，使用 WechatAuthProvider 调用平台 code2Session。
2. 以 AppID + OpenID 唯一定位 User；UnionID 仅在合法可用时补充，不作为首版必需字段。
3. session_key 只用于服务端必要解密且不得下发、记录或长期明文保存。
4. 返回短期 access token 与可撤销 refresh token；refresh token 只保存哈希。
5. `PATCH /me/profile` 只接受用户确认后的 nickname 与受控上传 avatar；首次进入产品要求资料确认完成，后续资料修改失败不撤销已建立会话。
6. 客户端首次进入必须持有有效业务会话；分享深链在登录后恢复原目标。所有公开列表与详情 API 首版同样要求 access token。
7. HTML 原型仅模拟交互，正式实现前复核当期微信接口、隐私声明与类目审核要求。

### 个人攻略查询

- `scope=owned`：`Crew.owner_id = current_user`，返回 private/reviewing/published。
- `scope=joined`：存在 CrewMember 且 owner_id 不等于当前用户；仍按成员权限返回私密攻略。
- `scope=saved`：只返回用户收藏且当前可见的 GuideSnapshot。
- 三种 scope 使用不同 repository 查询，不能先拉取全部私密攻略再由客户端过滤。

### 发布状态机

~~~text
private --submit--> reviewing --approve--> published
   ^                    |                    |
   └------reject--------┘------withdraw------┘
~~~

状态转换使用事务和乐观版本。发布审核事件的幂等键为 crew_id + snapshot_version + review_event_id；只有首次 approve 发放 30 积分。下架或撤回不回收已合法获得的历史积分，但重复发布同版本不再次奖励。

### 新增测试

- 同一微信 code 不得重复消费；伪造 code、过期 code 和 provider 超时映射为稳定错误码。
- OpenID、session_key、访问令牌不进入业务日志。
- 首次头像昵称未确认时 `onboarding_complete=false` 且不能通过产品 AuthGate；资料修改保留审计和删除路径。
- owned/joined/saved 不串数据，非成员不能读取 private Crew。
- reviewing 不进入公开搜索；approve 只奖励一次；withdraw 后公共缓存和索引失效。
- 地点写入 API 只接受 POI 搜索确认或链接解析确认，不提供地图中心点建点接口。

## 13. v0.4 首次登录与公开详情合同

- `POST /auth/wechat/session` 成功只代表身份会话建立；首次用户完成 `PATCH /me/profile` 后才返回 `onboarding_complete=true`。
- 受保护接口对缺失、过期或撤销 token 统一返回 `AUTH_REQUIRED`；客户端保存 intended_route，登录完成后恢复。
- `GET /public-trips/{snapshot_id}` 只从 GuideSnapshot 读取。PublicGuideDetail DTO 采用字段 allow-list，返回 start_date、end_date、day_count、公开地点和含 day_index/local_date/order_in_day 的只读行程；禁止通过 ORM 自动序列化私密关系。
- PublicationSubmission 创建时服务端再次过滤公开字段；Expense、ExpenseSplit、Settlement、Transfer 和 CrewMember 永不进入 snapshot JSON。
- 套用接口复制公开路线的起止日期、地点与 day_index/order_in_day，创建 `private` Crew；账本为空，来源链接为空。
- 契约测试断言搜索、详情、分享卡片与套用响应均不包含 `expense`、`amount`、`split`、`transfer`、`member`、`source_url` 键。

### 按天行程校验

- Crew 创建时验证 end_date >= start_date，并按目的地时区计算首尾包含的 day_count。
- AI 结果与手动节点写入统一校验 `1 <= day_index <= day_count`；local_date 由服务端根据 start_date 派生。AI task 要求至少 3 个已确认地点，手动节点写入不使用该数量门槛。
- 同日排序使用 order_in_day；跨日移动在单事务内重排来源日和目标日，并将相邻交通段标记为 stale 后触发路线重算。
- AI 可以返回空白日；不得因为 day_count 大于地点数而虚构 Place。
- 契约和性质测试覆盖单日、跨月、跨年、闰日、空白日、越界 day_index、跨日移动回滚和公开套用日期保持。