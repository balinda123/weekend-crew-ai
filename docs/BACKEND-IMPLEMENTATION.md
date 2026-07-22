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
| `/auth` | 开发期模拟登录；后续替换为微信 code 换取身份。 |
| `/crews` | 创建、查看、编辑、归档；访问权限校验。 |
| `/crews/{id}/members` | 邀请、加入、成员列表。 |
| `/crews/{id}/places` | 手动地点、确认候选、投票、状态变更。 |
| `/poi/search` | 代理高德搜索；缓存、限流、标准化结果。 |
| `/uploads` 与 `/ocr-jobs` | 私有上传、任务状态、候选确认。 |
| `/crews/{id}/itineraries` | 生成任务、计划版本、选择与重排。 |
| `/crews/{id}/expenses` | 账目 CRUD、分摊、审计事件、结算建议。 |
| `/guides` | 脱敏预览、发布快照、token 查看、复刻。 |

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

禁止下载、解析或镜像抖音、小红书等来源链接正文；链接仅作用户溯源字段。

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
- 同一组局版本和同一指令做幂等缓存；每局每日限制 3 次行程生成。

## 7. AA 账本：不可交给 LLM

- `Expense.amount_cents` 与每个 `ExpenseShare.amount_cents` 均为整数分。
- 创建/修改账单在事务内重算分摊；校验分摊和等于消费额。
- 结算算法输入每人净额（实付 - 应付），输出债务人到债权人的最少或近似最少转账集合。
- 关键性质测试：净额总和为 0；输出转账应用后每人余额为 0；重复计算幂等。
- 对账单修改和删除记录审计事件，不删除结算历史快照。

## 8. 发布、隐私和安全

- 发布攻略前构建 allow-list 快照，只将局主明确勾选的地点、路线、备注、预算区间和图片写入 `GuideSnapshot`。
- 默认排除成员昵称/头像、账单、分摊、转账、原始截图、OCR 文本、来源链接和未授权备注。
- 私密链接 token 只存哈希；查看/复刻需要校验 token 有效性和发布状态。
- 保存用户图片、位置信息和模型输入的保留期限；提供局主归档后的清理任务。

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
