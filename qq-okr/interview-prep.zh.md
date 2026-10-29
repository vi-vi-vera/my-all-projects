# QQ OKR（qq-okr） — 面试备战材料

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 0      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 6| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

QQ OKR 是内部 OKR 与绩效平台。我负责把 Claude Agent SDK 的调用链接入 Langfuse，与伽利略共用同一个 trace_id，让每次 AI 调用都能按人、按项目查到 token、成本和工具调用树。

### 标准（30–60 秒）

QQ OKR 是内部 OKR 与绩效协作平台，后端是 NestJS 加 Prisma 加 BullMQ 的 monorepo，跑着基于 Claude Agent SDK 的 Agent 引擎，负责顾问对话、周报和阶段回顾生成。我负责这条 AI 调用链的可观测接入，选型 Langfuse：不另起埋点，而是把 LangfuseSpanProcessor 挂到伽利略已建立的 TracerProvider 上，再用 OpenInference 手动插桩 SDK，同一次调用在两个平台是同一个 trace_id。过程中处理三件事：兼容伽利略锁定的 OTel v1 与 @langfuse/otel 的 v2 字段差异；识别被 canUseTool deny 的工具 span 上的 Abandoned 标记，把它从 ERROR 降级为 WARNING，避免正常流程污染错误率；补回插桩包丢失的 cache token 并修正成本拆分。上报是旁路设计：未配置或初始化失败就降级，退出前先 flush。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

从架构上看，我的目标是让 AI 调用链同时拥有两类视角：伽利略看服务级链路、日志和 HTTP 调用，Langfuse 看 prompt、输出、token、成本、工具调用树和按用户、项目的聚合。关键设计是两条上报分支挂在同一个 TracerProvider 上，AI span 一份两发，trace_id 天然一致，因此跨平台排查时拿一个 id 就能两边都搜到，这是相比自建埋点 SDK 最大的收益。落地时第一个约束是初始化时序：main.ts 里必须先 dotenv 加载环境变量，再 initGalileo 建立 provider，然后 initLangfuse 挂 processor 并对 Agent SDK 做插桩，最后才动态 import NestJS 的 startServer，顺序错了插桩就覆盖不到业务代码。第二个约束是版本错配：伽利略锁 OTel sdk-trace-base 1.30，Span 只有 instrumentationLibrary 和 parentSpanId，而 @langfuse/otel 读的是 v2 的 instrumentationScope 和 parentSpanContext，缺任意一个前者会访问 undefined 崩，后者会让 markAppRootCandidate 把每个 span 都当成 root，父子关系全丢；我用两个 Proxy 做只读映射补平，并且明确写进文档：这个组合不受官方 peer 支持，升级依赖后必须跑真实上报冒烟。第三个是数据口径：业务拦截类的工具根本没执行，SDK 既不发 PostToolUse 也不发 PostToolUseFailure，span 一直挂在 inFlight 里直到整轮结束被兜底关闭并打 Abandoned；我最初按工具名白名单加中文文案去反推，后来收敛成只看 Abandoned 这一个语义标志，新增任何等待用户的工具都不用改上报侧，同时把 status 置为 UNSET、过滤 exception 事件、写 langfuse.observation.level 为 WARNING，既不计入错误率也不谎报成功。再往上是维度：user.id 和 langfuse.trace.metadata.projectId 必须广播到每个 span，因为 trace 级属性只放 root 不生效；HTTP 场景由 controller 把 dto.projectId 合并进 AsyncLocalStorage，worker 场景没有 HTTP 请求，只能由调用方显式传，否则这条 trace 在后台搜不到项目。最后是成本口径：插桩包 v0.3.4 没映射 cache 字段，到上报层时 cache 数据已经不在 span 上，我让 runner 在 result 阶段写入上下文再补回；同时 Anthropic 的 input_tokens 只含未命中 cache 的部分，直接塞给 prompt 会让 Langfuse 倒推出负数，所以我把 prompt 和 total 换算成含 cache 的口径，并删掉 SDK 透传的 llm.cost.total，让 Langfuse 用缓存感知的价目表重新拆分。可靠性上，initLangfuse 包了 try/catch，三个环境变量任一缺失直接跳过，优雅退出时先 forceFlush 再 shutdown，运行期导出失败只记日志不崩进程。

</details>

## ✨ 项目亮点

- **与伽利略共用同一 trace_id 的双平台可观测**（observability · backend）
  背景：服务已经在用伽利略做链路和日志，但 AI 视角的 prompt、token、成本、工具树都没有。任务：让 AI 调用可观测，又不重复建设一套埋点。行动：不新建 TracerProvider，把 LangfuseSpanProcessor 挂到伽利略已建立的 provider 上，AI span 一份两发。结果：同一次 Agent 调用在两个平台是同一个 trace_id，排查时一个 id 两边都能搜，且没有额外透传代码。
  > 关键词：`OpenTelemetry` · `TracerProvider` · `SpanProcessor` · `trace_id 对齐` · `伽利略`
- **ESM 下手动插桩 Claude Agent SDK 并接住返回值**（observability · backend）
  背景：OpenInference 的插桩包在 ESM 下无法直接 patch，因为命名空间对象是只读的。任务：让 query() 调用自动产出 AGENT / LLM / TOOL span。行动：先浅拷贝 SDK 对象再 manuallyInstrument，并且必须接住返回的 patched 对象，通过 getInstrumentedClaudeAgentSDK() 暴露给 runner。结果：漏接返回值时一条 span 都不会有，接住后工具调用树完整；runner 侧始终走这个函数，未启用时自动回落原始 SDK，业务零改动。
  > 关键词：`OpenInference` · `manuallyInstrument` · `ESM` · `Claude Agent SDK`
- **OTel v1/v2 字段兼容层**（observability · backend）
  背景：伽利略锁 OTel v1，@langfuse/otel 按 v2 写，这个组合不受官方 peer 支持。任务：让两家共用同一个 provider 而不崩。行动：用 Proxy 把 v1 的 instrumentationLibrary 映射成 instrumentationScope，把 parentSpanId 补成 parentSpanContext 对象。结果：不崩、父子关系正确；缺后者时每个 span 都被误判成 app root，勾了 Is Root 仍看到一堆子节点。文档里明确写了升级依赖必须跑真实上报冒烟。
  > 关键词：`OTel v1/v2` · `Proxy 兼容层` · `parentSpanContext` · `unmet peer`
- **业务拦截不再污染错误率**（observability · backend）
  背景：发布确认、用户追问、工蜂事件代理都用 canUseTool 返回 deny 把信息塞回模型，工具压根没执行，span 被兜底关闭打上 ERROR 与 Abandoned，Langfuse 取子 span 最高等级，于是正常业务流程整条 trace 标红。任务：把这类中性事件和真实故障区分开。行动：识别判据收敛为一条，即 TOOL span 且 status 是 ERROR 且 message 含 Abandoned，命中后 status 改 UNSET、过滤 exception 事件、写 langfuse.observation.level 为 WARNING。结果：用户点取消发布不再计入错误率，真实失败走 PostToolUseFailure 不受影响；判据与工具名和文案解耦，新增等待类工具零改动。
  > 关键词：`canUseTool deny` · `Abandoned` · `UNSET vs OK vs ERROR` · `observation level`
- **trace 维度：userId 与 projectId 的注入与广播**（observability · backend）
  背景：Langfuse 后台要能按人和按项目过滤，但 HTTP 上下文里只有 userId 和 userName，worker 里连请求都没有。任务：让每条 trace 都带上人和项目。行动：在 span 的 onEnd 时从请求级 AsyncLocalStorage 读 userName 与 projectId，注入 user.id 和 langfuse.trace.metadata.projectId，并且广播到每个 span，因为 trace 级属性只放 root 不生效；worker 侧由 runQuery 显式传 projectId 并补建 system 用户。结果：后台可按用户、项目、环境三个维度聚合排查。
  > 关键词：`AsyncLocalStorage` · `user.id` · `metadata.projectId` · `trace 级属性广播`
- **cache token 补报与成本拆分修正**（observability · backend）
  背景：插桩包 v0.3.4 只映射 input、output、total，cache 字段到上报层时已经丢失；且 Anthropic 的 input_tokens 只含未命中 cache 的部分，与 OpenInference 的总输入口径不同，直接塞给 prompt 会让 Langfuse 倒推出负数被清零，total 也偏小；另外 SDK 透传的 llm.cost.total 会让 Langfuse 直接采用总成本，成本拆分里 input 与 output 为空。任务：让用量和成本准确。行动：runner 在 result 阶段把 cache 读写写进上下文，上报层在 AGENT span 上补回 cache 读写并把 prompt 与 total 换算成含 cache 的口径，同时删掉 llm.cost.total 让 Langfuse 按缓存感知的价目表重算。结果：用量不再为负，成本拆分出 input、output、total 三项。
  > 关键词：`prompt caching` · `token 口径` · `llm.cost.total` · `cost attribution`


## 🏗️ 架构（architecture）— 2 题

### Q1. main.ts 里 initGalileo、initLangfuse、startServer 的顺序为什么不能变？

> 来源：`tp-07` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| ESM 静态 import 与动态 import 的求值时机 | 必须掌握 | 解释为什么必须动态 import startServer |
| monkey patch 与模块引用绑定的冲突 | 必须掌握 | 解释覆盖不到的根因，而不是只背顺序 |
| dotenv 与 Nest ConfigModule 的加载时机差 | 加分项 | 解释为什么 init 阶段读不到 env |

#### 三档回答

**🟢 一句话**：插桩必须在业务模块加载前完成，否则覆盖不到。顺序是 dotenv、initGalileo 建 provider、initLangfuse 挂 processor 并插桩，最后动态 import startServer。initLangfuse 包 try/catch 降级，initGalileo 不包。

**🔵 标准**（默认）：

顺序由依赖决定。第一，dotenv 必须在两个 init 之前，因为 Nest 的 ConfigModule 要等 NestFactory.create 才加载 env，太晚，而 init 阶段就要读 LANGFUSE 的三个变量。第二，initGalileo 必须在 initLangfuse 之前，因为 Langfuse 不自建 provider，它要拿到伽利略已经建立的全局 TracerProvider 才能挂 processor。第三，两个 init 都必须在业务模块加载之前，因为插桩的原理是替换 SDK 的函数引用或注册 processor，如果业务模块已经 import 并持有了原始函数引用，之后再插桩就覆盖不到那些调用。所以 startServer 用的是动态 import，而不是顶部静态 import，这样能保证它执行时插桩已经就绪。容错上做了区分：initLangfuse 包了 try/catch，失败只打日志并跳过上报，因为它是可观测旁路，不能让服务起不来；initGalileo 不包，因为 provider 是链路基础，它失败必须暴露。降级后 getInstrumentedClaudeAgentSDK 会自动回落原始 SDK，业务行为不变。

<details><summary>🔴 深挖（点击展开）</summary>

更深一层看，这其实是 Node 模块加载时机与 monkey patch 的经典冲突。ESM 的 import 会在模块执行前完成绑定，静态 import 写在文件顶部时，被 import 的模块会在当前模块代码执行前就全部求值完毕；如果 startServer 是静态 import，它拉起的整棵 NestJS 依赖树会在 initGalileo 和 initLangfuse 之前就完成加载，业务模块里对 Claude Agent SDK 的引用已经被解析成原始函数，此时再插桩就只影响之后新建的引用，对已持有的引用无效，表现是部分调用有 span、部分没有，极难排查。动态 import 把加载时机推迟到运行时调用点，因此能保证插桩先就绪。第二个细节是 dotenv 的位置：Nest 的 ConfigModule 也支持 envFilePath，但它要等 Nest 应用创建才生效，而插桩初始化在应用创建之前，所以必须自己提前 dotenv，并且加载顺序要和 ConfigModule 保持一致，即 .env.local 优先于 .env。第三是容错的粒度：我在注释里写清楚了 initLangfuse 里的 try/catch 兜的不是 Langfuse 服务不可用，因为构造 processor 本身不发网络请求，服务挂了也走不到 catch，这里兜的是依赖升级、插桩版本错配这类初始化代码自身出错的情况，避免一次版本冲突就让整个服务起不来。这个区分很重要，否则容易误以为 Langfuse 宕机时会自动跳过，实际上运行时导出失败走的是另一条路径，由批量处理器内部 catch 后交给 globalErrorHandler，返回 ok false 而不是抛错，也不会崩进程。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Node.js ESM 模块生命周期文档（linking 与 evaluation）
  - [ ] NestJS ConfigModule envFilePath 的加载时机说明
- 🛠️ 动手
  - [ ] 把 startServer 改成顶部静态 import，观察是否出现部分调用无 span 的现象并定位原因
  - [ ] 把 dotenv 那两行删掉，确认 LANGFUSE_* 读不到时走的是跳过分支而不是报错
- ⚠️ 常见踩坑
  - 把动态 import 当优化手段，其实它是插桩正确性的必要条件
  - 以为初始化失败会自动覆盖 Langfuse 宕机，实际两者路径不同
  - 把 initGalileo 也包上 try/catch，把基础链路故障藏起来
- 🤔 自测题（合上文档自答）
  - [ ] 改成静态 import 后会出现什么现象？为什么难排查？
  - [ ] Langfuse 服务宕机时，你的服务启动和运行分别会发生什么？
- ⏱️ 预估学习时长：**2.5 小时**


#### Evidence

- `apps/server/src/main.ts`
- `apps/server/src/start-server.ts`

---

### Q2. 所有 span 都会发到 Langfuse 吗？你是怎么划分两个平台的数据边界的？

> 来源：`tp-08` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| instrumentation scope 作为过滤判据 | 必须掌握 | 说明边界为什么稳定、可维护 |
| Langfuse environment 分环境 | 加分项 | 多环境共实例时的必备隔离手段 |
| AI 可观测的数据量与统计口径影响 | 加分项 | 体现对存储成本与指标失真的判断 |

#### 三档回答

**🟢 一句话**：不会。shouldExportSpan 只放行 scope 以 @arizeai/openinference 开头的 AI span，伽利略的 HTTP 和 trpc span 被过滤掉。另外用 APP_ENV 作为 environment，让后台能分环境查看。

**🔵 标准**（默认）：

边界是按 span 的 instrumentation scope 划分的。LangfuseSpanProcessor 构造时传了 shouldExportSpan，判断条件是 scope 名以 @arizeai/openinference 开头，命中才导出。这样伽利略自己产的 HTTP 和 trpc span 不会进 Langfuse，避免把服务级噪声倒进 AI 分析平台，既省存储也让 Langfuse 里的 trace 结构干净，只剩 AGENT、LLM、TOOL 这三类。同一个 processor 还传了 environment，取的是 APP_ENV，取值是 development、test、formal，Langfuse 后台据此分环境过滤。划分依据其实很朴素：谁关心什么数据。服务级链路归伽利略，AI 语义归 Langfuse，两边用同一个 trace_id 关联，需要跨视角时拿 id 去另一边查，而不是把两份数据都堆到一处。

<details><summary>🔴 深挖（点击展开）</summary>

为什么用 scope 而不是 span 类型或名字去过滤：scope 是插桩库自己声明的身份，稳定且不受业务命名影响；业务侧的 span 名会随重构变化，用作判据迟早失效。OpenInference 的插桩包统一以 @arizeai/openinference 作为 scope 前缀，正好是一刀切的判据，代价是把插桩包换掉时要同步改这个前缀，所以我在代码里把它抽成了常量并写了注释。第二层考虑是数据成本：LLM span 的输入输出体积远大于普通 HTTP span，如果不过滤，Langfuse 里会混入大量与 AI 无关的短 span，既增加存储也让统计口径失真，比如 trace 数量、平均耗时都会被服务级调用稀释。第三层是环境隔离：多套环境共用一个 Langfuse 实例时，如果不带 environment，测试数据会混进正式统计，我直接复用伽利略已经在用的 APP_ENV，保证两边分环境口径一致。还有一个副作用需要知道：因为只放行 AI span，Langfuse 里的 trace 通常没有最外层那个 HTTP server span，父子关系是从 AGENT span 开始的，看层级时要清楚起点不是请求入口；排查跨系统问题时，还是要回到伽利略看完整链路，这也再次说明两个平台是互补而不是替代关系。因此每次升级依赖后，我都会按文档要求重跑一次真实上报冒烟，确认这三点没有退化。

</details>

#### 补齐方案

- 📚 必读
  - [ ] @langfuse/otel 文档关于 shouldExportSpan 与 environment 的说明
  - [ ] OpenInference 语义约定中关于 span kind（AGENT / LLM / TOOL）的定义
- 🛠️ 动手
  - [ ] 把 shouldExportSpan 临时改成全部放行，跑一次请求后在 Langfuse 里数一数混入了多少 HTTP span
  - [ ] 把 environment 写死成 development 再跑测试环境请求，确认后台环境过滤失效的样子
- ⚠️ 常见踩坑
  - 用 span 名做判据，重构后静默失效
  - 漏配 environment，测试数据污染正式统计
  - 以为 Langfuse 里有完整 HTTP 入口 span，实际层级从 AGENT 开始
- 🤔 自测题（合上文档自答）
  - [ ] 换成另一个插桩库时，上报侧要改哪些地方？
  - [ ] 为什么不让所有 span 都进 Langfuse？
- ⏱️ 预估学习时长：**2 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第四节`

---

## ⚡ 性能（performance）— 1 题

### Q1. 上报会不会拖慢 AI 调用？你在性能上做了哪些权衡？

> 来源：`tp-12` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| BatchSpanProcessor 的异步导出语义 | 必须掌握 | 说明为什么上报不阻塞主链路 |
| span 属性体积与采样策略 | 加分项 | 体现真正的性能风险判断 |
| Proxy 与深拷贝在热路径上的取舍 | 加分项 | 解释为什么兼容层这样写 |

#### 三档回答

**🟢 一句话**：导出是批量异步的，请求路径不等网络。开销在 onEnd：只读 Proxy、判断前置、上游先过滤非 AI span。真正的风险是 span 数量与体积，不是单次映射。

**🔵 标准**（默认）：

先说链路：span 的创建和结束是同步发生在 Agent 调用过程中的，但导出是批量处理器异步做的，攒够一批或到时间才发，所以请求路径上不会等网络。我在上报层加的处理都在 onEnd 里，包括字段兼容、属性注入、业务拦截改写和 cache 换算，这些是同步开销。为了控制它，我用了三个手段：一是所有改写都用 Proxy 返回只读映射，不深拷贝 span，也不重新构造属性对象之外的东西；二是判断前置，不满足条件就原样返回，比如不是 TOOL span 或不是 AGENT span 就直接返回，绝大多数 span 走的是最短路径；三是过滤在上游做，shouldExportSpan 已经把非 AI span 挡掉了，进入改写逻辑的量本身就小。失败路径上也不做同步重试，导出失败由批量处理器内部处理，返回 ok false，不阻塞业务。我认为真正的性能风险不在微优化而在数据量：长对话和多工具调用会产生大量大体积 span，所以过滤非 AI span 和按环境隔离同样有性能意义。

<details><summary>🔴 深挖（点击展开）</summary>

如果要量化，我会把开销分成三段。第一段是 span 生命周期本身，这是插桩包带来的，与我的代码无关，主要成本是把输入输出序列化进 attribute，长 prompt 和多轮对话时这部分最贵；可行的缓解是采样或截断，但我们目前没有开采样，因为排查 AI 质量问题时希望全量。第二段是我加的 onEnd 处理，每次调用会走几次属性读取和最多四层 Proxy 包装，量级是微秒到几十微秒，相对一次 LLM 调用的秒级耗时可以忽略；不过我仍然避免深拷贝，因为 span 上带着 events 和内部引用，复制既可能丢语义也会随 span 变大而变贵。第三段是导出，批量处理器异步发送，失败不重试阻塞，最坏情况是丢数据。我更关注的是尾部风险：优雅退出时如果不 flush，最后一批 span 丢失，这在频繁重启的灰度环境里表现为数据缺失，因此 forceFlush 是必须的，但它也受优雅退出十秒上限约束，不能无限等待。还有个容易忽略的点：如果将来 span 量涨到很大，onEnd 里读 AsyncLocalStorage 和做字符串匹配的成本会被放大，届时的优化方向是把判据提前到 shouldExportSpan，甚至用采样降低总量，而不是继续优化单个 Proxy。目前没有做这些，因为量还没到那个规模，我也不想为假想负载提前设计。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenTelemetry BatchSpanProcessor 配置说明（队列大小、定时、最大导出批量）
  - [ ] Langfuse 关于采样与数据量控制的文档
- 🛠️ 动手
  - [ ] 用压测脚本连打 50 次对话，观察进程 CPU 与内存、Langfuse 收到的 span 数量与导出延迟
  - [ ] 在 onEnd 里加一个计数与耗时打印，量化自己那段逻辑的实际开销
- ⚠️ 常见踩坑
  - 以为上报同步阻塞请求，实际是异步批量
  - 为假想负载提前做采样和复杂优化
  - 忽略优雅退出时最后一批数据的丢失
- 🤔 自测题（合上文档自答）
  - [ ] 上报延迟主要由什么决定？
  - [ ] span 量涨十倍时，你第一件事会改什么？
- ⏱️ 预估学习时长：**2.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第九节`

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. 可观测上报本身会不会把服务拖垮？你做了哪些降级和退出处理？

> 来源：`tp-09` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 旁路依赖的降级分层（配置 / 初始化 / 运行期） | 必须掌握 | 体现可观测不影响可用性的设计意识 |
| BatchSpanProcessor 缓冲与 forceFlush 的必要性 | 必须掌握 | 解释为什么优雅退出必须显式 flush，否则丢最后一批数据 |
| 优雅退出的超时与失败容忍 | 加分项 | 退出阶段的异常处理容易被忽略 |

#### 三档回答

**🟢 一句话**：三层降级：缺环境变量直接跳过；初始化失败降级为不上报；导出失败内部 catch 不抛错。退出时先 forceFlush 再 shutdown，两步都容忍失败。

**🔵 标准**（默认）：

原则是可观测永远不能成为单点故障。第一层是配置层：三个 LANGFUSE 环境变量都是 optional，缺任意一个就打一行日志返回，本地开发不需要任何配置。第二层是初始化层：initLangfuse 在 main.ts 里包了 try/catch，失败只打印错误并继续启动，因为它是旁路；降级后 getInstrumentedClaudeAgentSDK 会回落原始 SDK，runner 行为完全不变。需要说明这个 catch 兜的不是 Langfuse 服务不可用，构造 processor 本身不发网络请求，它兜的是依赖升级和插桩版本错配这类初始化代码自身出错。第三层是运行期：批量处理器定时 flush 的路径内部有 catch 交给 globalErrorHandler，Langfuse SDK 的 fetch 失败返回 ok false 而不是抛错，所以导出失败不会让进程崩溃。退出路径上，start-server 里注册了 installGracefulShutdown，beforeClose 传入 shutdownLangfuse，收到 SIGTERM 或 SIGINT 时先 forceFlush 把批量处理器里积压的 span 发出去再 shutdown，两步各自 try/catch，失败只打 warning，不阻断退出。

<details><summary>🔴 深挖（点击展开）</summary>

设计上我把失败分成三类分别处理。第一类是配置缺失，属于预期状态，处理方式是无声跳过，只留一行日志，不要报警也不要影响启动，因为本地开发和部分环境本来就不该上报。第二类是初始化失败，属于异常状态，要打 error 日志让运维看见，但不能阻断启动；这里的关键判断是区分它兜的是什么，我在注释里写清楚了它不覆盖 Langfuse 服务不可用，这一点如果不写清楚，后人会以为上报平台挂了也能自动降级，从而在真实故障时误判。第三类是运行期导出失败，属于持续状态，处理要最保守：批量处理器内部已经 catch 了，我不需要再加一层，加了反而可能吞掉它自己的重试语义；Langfuse SDK 的设计是返回 ok false，所以不会污染业务的错误监控。退出路径是另一个容易漏的点：OTel 的批量处理器有缓冲，进程被 SIGTERM 杀掉时如果不 flush，最后一批 span 会直接丢，排查时表现为请求明明发生了却没有数据，尤其是短任务或灰度重启时最明显。所以我把 forceFlush 挂在 NestJS 生命周期清理之前的 beforeClose，并且强制它先于应用关闭执行；两步都包了 try/catch，因为退出阶段任何未捕获异常都可能导致容器退出码异常或优雅退出超时，而优雅退出本身还有十秒上限，flush 不能无限等待。这三层加上退出处理，保证的是最坏情况下损失可观测数据，而不是损失服务可用性。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenTelemetry BatchSpanProcessor 关于缓冲、flush 与 shutdown 的说明
  - [ ] NestJS 生命周期钩子与优雅退出官方指南
- 🛠️ 动手
  - [ ] 本地发一次请求后立刻 kill 进程，对比有无 forceFlush 时 Langfuse 里最后一批 span 是否丢失
  - [ ] 把 LANGFUSE_BASE_URL 故意写错，观察运行期导出失败时进程是否存活、日志长什么样
- ⚠️ 常见踩坑
  - 以为初始化 try/catch 能兜住 Langfuse 宕机
  - 退出时不 flush，丢掉最后一批 span
  - 在退出路径抛出异常导致容器退出码异常
- 🤔 自测题（合上文档自答）
  - [ ] 为什么运行期导出失败不能抛异常？
  - [ ] 容器重启时最后几秒的请求数据为什么经常查不到？
- ⏱️ 预估学习时长：**3 小时**


#### Evidence

- `apps/server/src/main.ts`
- `apps/server/src/start-server.ts`
- `apps/server/src/config/env.schema.ts`
- `docs/Langfuse 上报接入说明.md 第九节`

---

### Q2. 周报 worker 这类后台任务没有 HTTP 请求，上报的上下文是怎么补的？踩过什么坑？

> 来源：`tp-10` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 请求上下文与后台任务上下文的统一收敛 | 必须掌握 | 决定补建逻辑放在哪里，以及新调用点如何不漏 |
| 必填维度与可兜底维度的区分 | 必须掌握 | 体现宁可缺失也不造假的数据态度 |
| AsyncLocalStorage 的上下文继承边界 | 加分项 | 解释偶发丢维度的根因 |

#### 三档回答

**🟢 一句话**：后台任务没有 HTTP 上下文，runQuery 会用 system 用户补建一个。userId 可以兜底，projectId 不行，它每个任务都不同，只能由 worker 显式传，传空只是后台按项目搜不到。

**🔵 标准**（默认）：

后台任务没有 HTTP 请求，RequestContextInterceptor 不会介入，requestLogContext 是空的，上报层读不到用户和项目。处理放在 runQuery 里：先取现有上下文，存在就用展开合并 projectId 后再跑内部逻辑，不存在就新建一个 userId 和 userName 都是 system、带 projectId 的上下文。这样 HTTP 场景复用请求上下文，worker 场景也能让 Langfuse 收到 userId。踩过的坑是 projectId 不能自动推断：HTTP 场景里 controller 传的是 dto.projectId，某些场景可能为空；worker 场景根本没有请求，而项目 id 每个任务都不同，不像 system 用户那样可以写死，只能由调用方显式传。代码里是有值才写这个字段，所以忘了传的表现不是报错，而是这条 trace 在后台按项目搜不到，属于静默降级，很难发现。我在文档里列了三个调用点的现状表，HTTP 对话和周报 worker 已传，阶段回顾 worker 当时还在 test 分支待补，新增调用点只要在 runQuery 里加一行。

<details><summary>🔴 深挖（点击展开）</summary>

这类问题的本质是上下文来源不唯一，需要在入口统一收敛。我的做法是把补建逻辑放在 runner 的 runQuery，而不是散在每个 worker 里，原因是 runner 是所有 Agent 调用的唯一入口，收敛在一处能保证任何新调用点都不会漏掉上报维度，代价是调用方仍然要显式传 projectId，这个约束我用参数注释和文档表格固化下来。第二个考虑是区分必填与可兜底：userId 可以兜底成 system，因为后台任务本来就没有人，写 system 是诚实的，也便于在后台把机器发起的调用和人发起的调用区分开；projectId 不能兜底，因为随便填一个假项目 id 比不填更糟，会让数据看起来完整但其实是错的，所以我的选择是不填就没有这个字段，宁可缺失也不造假。第三个是静默降级的发现手段：这类问题不会报错，只能靠核对，我的做法是在文档里维护调用点清单，加新 worker 时对照清单检查，并在联调时到后台按项目过滤验证一次。还有个容易被忽略的点：AsyncLocalStorage 的继承依赖异步上下文，worker 里如果把任务再丢进另一个队列或线程，继承可能断掉，表现为偶发的无 userId trace；我在 runner 里做的是同步进入 run 回调，不做跨上下文调度，如果需要跨队列，要在新上下文里重新补建。

</details>

#### 补齐方案

- 📚 必读
  - [ ] BullMQ worker 与 NestJS 请求上下文的关系说明
  - [ ] docs/Langfuse 上报接入说明.md 第八节
- 🛠️ 动手
  - [ ] 在周报 worker 里去掉 projectId 跑一次，到后台按项目过滤确认搜不到，再补回对比
  - [ ] 新写一个最小 worker 调 runQuery，验证不传 projectId 时 trace 里 userId 是否仍为 system
- ⚠️ 常见踩坑
  - 给 projectId 填默认值，制造看起来完整但错误的数据
  - 把补建逻辑写在每个 worker 里，新增调用点容易漏
  - 跨队列调度导致上下文继承断裂，偶发丢 userId
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不给 projectId 一个默认值？
  - [ ] 新增一个 AI 调用入口时，你要改哪些地方才能保证上报维度完整？
- ⏱️ 预估学习时长：**2.5 小时**


#### Evidence

- `apps/server/src/modules/sandbox/services/local-runner.service.ts`
- `apps/server/src/modules/report-scheduler/weekly-report.worker.ts`
- `docs/Langfuse 上报接入说明.md 第八节`

---

## 📈 可观测性（observability）— 6 题

### Q1. 你们同时接了伽利略和 Langfuse，为什么不二选一？两个平台的 trace_id 是怎么对齐的？

> 来源：`tp-01` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| OpenTelemetry SpanProcessor 与 TracerProvider 的关系 | 必须掌握 | 本方案成立的前提，讲不清就讲不清为什么 trace_id 会一致 |
| shouldExportSpan 的职责过滤 | 必须掌握 | 区分 AI span 与服务级 span，决定 Langfuse 里有没有噪声 |
| ProxyTracerProvider 与 getDelegate | 加分项 | 挂 processor 时最容易踩的实现细节 |

#### 三档回答

**🟢 一句话**：伽利略看服务级链路和日志，Langfuse 看 prompt、token、成本和工具树。我把 Langfuse processor 挂到伽利略已有的 provider 上，同一条 span 发两份，trace_id 天然一致。

**🔵 标准**（默认）：

选两个平台是因为它们的视角互补而不是重叠：伽利略负责服务级链路、日志和 HTTP 调用，Langfuse 负责 AI 专属的 prompt 与输出、token、成本、工具调用树，以及按用户和项目聚合。如果二选一，要么排查 AI 质量问题时看不到完整链路，要么查链路时看不到 token 和成本。对齐 trace_id 的做法是不新建 TracerProvider：initGalileo 先建立全局 provider，initLangfuse 只是往这个 provider 上 addSpanProcessor，于是 OpenInference 产出的 AI span 会同时进入伽利略和 Langfuse 两条导出分支，同一次 Agent 调用在两边拿到的是同一个 trace_id。这样排查时一个 id 就能在两个平台跳，也不需要自己在日志里传 id。代价是 Langfuse processor 必须兼容伽利略锁定的 OTel v1 字段，这是我后面要补兼容层的原因。

<details><summary>🔴 深挖（点击展开）</summary>

从需求反推，我需要两类数据：一类回答这次请求在服务端到底发生了什么，包括进了哪些接口、查了哪些库、耗时在哪；另一类回答这次 AI 调用到底发生了什么，包括用了什么 prompt、模型输出了什么、消耗多少 token、花了多少钱、调了哪些工具、工具参数和返回是什么。伽利略是前者，Langfuse 是后者，两者缺一类都会让排查断掉。实现上最关键的一点是我没有让 Langfuse 自己建 provider。如果 Langfuse SDK 自己建一个 TracerProvider，那么它的 span 会有另一套 id 空间，两个平台必须靠业务代码把 trace id 从 OTel 上下文里取出来再塞进 Langfuse 的 trace 参数，这种透传既侵入业务又容易漏。我的做法是让 Langfuse 寄生在伽利略的 provider 上：LangfuseSpanProcessor 本质只是一个 SpanProcessor，把它注册到已有 provider 后，所有 tracer 产出的 span 都会走它的 onStart 和 onEnd，我再用 shouldExportSpan 做过滤，只放行 OpenInference 产出的 AI span，伽利略原生的 HTTP 和 trpc span 不发往 Langfuse，避免把服务级噪声倒进 AI 分析平台。这样一份 span 两处消费，id 天然一致。代价有两个：一是 provider 归伽利略所有，它的 OTel 版本决定了 Span 的字段形状，而 @langfuse/otel 按 v2 写，字段对不上要靠兼容层补平，且这个组合不在官方 peer 支持范围内；二是 addSpanProcessor 必须用真实 provider，trace.getTracerProvider() 返回的是 ProxyTracerProvider，真实对象在 getDelegate() 上，代码里做了鸭子类型判断，取不到就只打 warning 不启用上报，绝不让可观测把服务拖死。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenTelemetry 官方概念文档 TracerProvider / SpanProcessor / Span Exporter
  - [ ] @langfuse/otel README 中 LangfuseSpanProcessor 的用法与配置项
- 🛠️ 动手
  - [ ] 本地起一个最小 Node 服务，先建一个 TracerProvider 再挂两个 processor，打印两边收到的 span 是否同 trace_id
  - [ ] 把 shouldExportSpan 改成全放行，观察 Langfuse 里混入的 HTTP span，再改回按 scope 前缀过滤
- ⚠️ 常见踩坑
  - 以为要自己传 trace id，实际上同一个 provider 天然一致
  - 直接对 trace.getTracerProvider() 调 addSpanProcessor，忽略 Proxy 委托导致静默不生效
  - 不过滤 span，把服务级噪声倒进 AI 分析平台
- 🤔 自测题（合上文档自答）
  - [ ] 如果伽利略换成另一个 OTel 版本，你的上报会哪里先坏？
  - [ ] 为什么不让 Langfuse 自建 provider？两套 id 空间会带来什么问题？
- ⏱️ 预估学习时长：**3 小时**

#### 追问（面试官深挖向）

- ⚖️ **如果哪天要下线伽利略，你这套 Langfuse 上报还能用吗？**（trade-off）
  > 能跑，但前提变了。现在 provider 是伽利略建的，Langfuse 只是它的一个 processor；下线伽利略就要自己建一个 TracerProvider 并把 processor 挂上去，这部分代码本来就是按 provider 抽象写的，改动集中在初始化。真正要重验的是兼容层：v1 字段兼容是为伽利略锁的 1.30 写的，换成主流 v2 后 toCompatSpan 和 withParentSpanContext 应该可以删掉，但必须按文档要求跑一次真实上报冒烟，确认 trace_id、父子关系和 scope 都没丢。


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/main.ts`
- `docs/Langfuse 上报接入说明.md 第二节`

---

### Q2. Claude Agent SDK 是怎么被插桩的？为什么强调 manuallyInstrument 的返回值必须接住？

> 来源：`tp-02` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| ESM 命名空间对象只读与 monkeypatch 限制 | 必须掌握 | 决定为什么必须走手动插桩并接住返回值 |
| OpenInference 手动插桩 API 语义 | 必须掌握 | 面试常问怎么落地，答出返回值语义是分水岭 |
| 降级回落到原始 SDK 的边界设计 | 加分项 | 体现可观测不侵入业务的意识 |

#### 三档回答

**🟢 一句话**：ESM 的命名空间对象只读，不能直接 patch，所以先浅拷贝再手动插桩。关键是必须接住 manuallyInstrument 的返回值，否则 query 还是原函数，一条 span 都不会有。

**🔵 标准**（默认）：

自动插桩在这个场景不可用，因为 Claude Agent SDK 是 ESM，模块的命名空间对象只读，插桩包没法原地替换 query 函数。所以走手动插桩：先 await import 拿到原始模块，用展开运算符浅拷贝成一个普通对象，再 new 出 ClaudeAgentSDKInstrumentation 并调用它的 manuallyInstrument，把拷贝传进去。关键点是 ESM 场景下 manuallyInstrument 不会原地改对象，而是返回一个新的 patched 对象，必须接住返回值，否则 sdkCopy.query 依然是未 patch 的函数，调用链上一条 span 都不会产生，而且不会报错，非常难排查。拿到 patched 对象后我存进模块级变量，通过 getInstrumentedClaudeAgentSDK 暴露给 runner；未启用 Langfuse 时这个函数直接返回原始模块，runner 代码一行都不用改，业务侧零感知。

<details><summary>🔴 深挖（点击展开）</summary>

插桩的原理是把目标函数的实现替换成一层包装：包装里先开一个 span，记录输入输出和 token，再调用原函数，最后在结束时关 span 并写状态。对 CommonJS 模块，导出对象是可写的，插桩包可以直接赋值替换；对 ESM，导出绑定是不可变的，运行时赋值会静默失败或直接抛错，所以插桩包只能返回一个新的对象，由调用方决定用哪个。这就是我要浅拷贝再传入的原因：我传进去的是一个普通对象，插桩包可以在副本上做替换，但为了不依赖它的原地修改行为，我统一使用返回值。这个坑的隐蔽之处在于失败是静默的：query 仍然是能用的函数，Agent 照常跑，只是 Langfuse 和伽利略里都空空如也，从服务日志看不出任何异常，只有对照插桩包源码才能发现返回值语义。为了避免再犯，我把入口收敛成一个函数 getInstrumentedClaudeAgentSDK，并在文档和代码注释里写明不要再直接 import 原始 SDK，否则会拿到未插桩的导出。另一个设计是降级：Langfuse 未配置或初始化失败时，这个 getter 返回原始模块，runner 行为完全不变，也就是说可观测关掉后业务功能不受影响，这一点在排查时很有用，能快速区分是可观测问题还是 Agent 本身的问题。

</details>

#### 补齐方案

- 📚 必读
  - [ ] @arizeai/openinference-instrumentation-claude-agent-sdk 的 README 与 manuallyInstrument 源码
  - [ ] MDN 关于 ES module namespace object 不可变的说明
- 🛠️ 动手
  - [ ] 写一个小脚本：分别用直接 patch 与接住返回值两种方式调用 query，对比 span 数量差异
  - [ ] 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界
- ⚠️ 常见踩坑
  - 忽略返回值，导致零 span 且不报错
  - 业务代码里直接 import 原始 SDK，绕过插桩入口
  - 以为插桩是原地修改，在副本上做断言却发现副本没变
- 🤔 自测题（合上文档自答）
  - [ ] 为什么插桩失败时服务和 Agent 都正常，却一条数据都没有？
  - [ ] 如果插桩包升级后改成原地修改，你的代码需要怎么改？
- ⏱️ 预估学习时长：**2.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/services/local-runner.service.ts`

---

### Q3. 伽利略锁的是 OTel v1，@langfuse/otel 按 v2 写，你是怎么让它们共用同一个 provider 的？

> 来源：`tp-03` · scope: backend · server · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| OTel v1 与 v2 的 Span 字段差异 | 必须掌握 | 本方案最核心的技术难点，答不出具体字段名基本等于没做过 |
| Proxy 做只读字段映射的手法 | 必须掌握 | 解释为什么不深拷贝，体现对 span 生命周期的理解 |
| Langfuse markAppRootCandidate 的 root 判定 | 加分项 | 解释父子关系丢失的根因 |

#### 三档回答

**🟢 一句话**：伽利略锁 OTel v1，@langfuse/otel 按 v2 写，差异只有两个字段。我用 Proxy 把 instrumentationLibrary 映射成 instrumentationScope、把 parentSpanId 补成 parentSpanContext，已有 v2 字段就原样透传。

**🔵 标准**（默认）：

共用 provider 后，伽利略产的 span 和 OpenInference 产的 span 都会流进 Langfuse processor，前者是 v1 形状，后者是 v2 形状，processor 按 v2 读就会出错。我实际遇到的差异只有两个字段：instrumentationScope 与 parentSpanContext。第一个不补会让 processor 访问 undefined.name 直接崩；第二个不补，Langfuse 的 markAppRootCandidate 读不到父 span，会把每个 span 都标成 app root，勾了 Is Root Observation 仍然看到一堆子节点，父子关系全丢。处理方式是在 processor 外面套一层：onStart 和 onEnd 拿到 span 后先用 toCompatSpan 把 instrumentationLibrary 映射成 instrumentationScope，再用 withParentSpanContext 把 parentSpanId 字符串补成带 traceId 和 spanId 的对象，两个都用 Proxy 做只读映射，不复制 span、不改原对象，已经带 v2 字段的 span 原样返回。需要说明的是这个组合不在官方 peer 支持范围内，pnpm install 会报 unmet peer，我在文档里明确写了升级 @opentelemetry 或 @langfuse 任一依赖后必须跑一次真实上报冒烟，确认 trace_id、父子关系、scope 都没丢。

<details><summary>🔴 深挖（点击展开）</summary>

为什么会有这种错配：伽利略 SDK 内部依赖 sdk-trace-base 1.30，属于 OTel v1 时代的实现，Span 对象上挂的是 instrumentationLibrary 和 parentSpanId；OpenTelemetry 在 2.x 里把这两个字段重命名并改了形状，instrumentationLibrary 变成 instrumentationScope，parentSpanId 这个字符串变成 parentSpanContext 对象。@langfuse/otel 是按新规范写的，@arizeai/openinference 的插桩包产出的 span 也是新形状，所以真正的冲突只发生在伽利略原生 span 流进 Langfuse processor 的时候。我的兼容层做了三件事：一是只补不猜，字段存在就原样返回，只有缺失才补，避免覆盖真实值；二是用 Proxy 而不是深拷贝，span 对象内部还有很多引用和方法，复制一份容易丢行为，Proxy 只在读取特定属性时返回新值，其余走 Reflect 透传；三是放在 processor 边界而不是改 SDK，这样升级任何一侧依赖时，兼容层是唯一需要回归的地方。风险也很清楚：这个组合不受官方 peer 支持，序列化器 otlp-transformer 现在读的其实是 v1 字段名，能跑通有一半是运气，所以文档里把升级依赖后必须做真实上报冒烟写成了硬要求，不能只看单元测试。排查经验上，如果升级后看到 trace 全是 root 没有层级，第一反应就是 parentSpanContext 映射失效；如果 processor 抛 undefined 相关错误，就是 instrumentationScope 没补上。验证方式也很直接：升级后跑一次真实上报，在后台比对层级与字段是否完整。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenTelemetry 2.0 升级说明中关于 instrumentationScope 与 parentSpanContext 的变更
  - [ ] @langfuse/otel 源码里 markAppRootCandidate 的实现
- 🛠️ 动手
  - [ ] 构造一个只有 v1 字段的假 span，分别在有、无兼容层的情况下喂给 processor，观察崩溃与 root 误标两种现象
  - [ ] 把 parentSpanContext 映射临时删掉，在 Langfuse 后台勾 Is Root Observation，复现一堆子节点的画面并截图留存
- ⚠️ 常见踩坑
  - 只补 instrumentationScope 忘了 parentSpanContext，表现为父子关系丢失而非报错
  - 用深拷贝代替 Proxy，丢掉 span 内部方法
  - 升级依赖后只跑单测，跳过真实上报冒烟
- 🤔 自测题（合上文档自答）
  - [ ] 升级 OTel 到 2.x 后，你的兼容层哪些代码可以删？哪些必须保留？
  - [ ] 为什么字段缺失导致的父子关系丢失不会报错，只能通过 UI 发现？
- ⏱️ 预估学习时长：**4 小时**

#### 追问（面试官深挖向）

- ⚖️ **不用 Proxy，改成在 onStart 里把 span 序列化成普通对象再补字段行不行？**（trade-off）
  > 不推荐。Span 不是纯数据对象，它带着 spanContext、status、events 以及 SDK 内部可能依赖的引用和方法，序列化成普通对象很容易丢掉 processor 后续要读的东西，而且每来一个 span 就拷一份，热路径上有额外开销。用 Proxy 只在读取那两个字段时返回映射值，其余走 Reflect 透传，既零拷贝又保持原对象语义。真正需要注意的只是 Proxy 的开销本身很小但每个 span 都会走一次，量很大时要留意，这也是我把它放在 processor 边界、方便整体替换的原因。


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第五节`

---

### Q4. 业务拦截类工具根本没执行，却被上报成 ERROR，把正常流程的整条 trace 标红了，你怎么处理？

> 来源：`tp-04` · scope: backend · server · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Langfuse trace 等级取子 span 最高值的规则 | 必须掌握 | 解释为什么一个 span 会让整条 trace 标红 |
| observation 级属性与 trace 级属性的区别 | 必须掌握 | 决定 level 与 userId 分别写在哪里 |
| Claude Agent SDK 的 PostToolUse / PostToolUseFailure 事件语义 | 加分项 | 解释为什么被拦截的工具不会有正常收尾事件 |

#### 三档回答

**🟢 一句话**：被 deny 的工具没执行，span 会被兜底关掉并打上 ERROR 和 Abandoned，整条 trace 跟着标红。我按 Abandoned 识别，把 status 改成 UNSET、写 WARNING 级别的 level，既不算错误也不装成功。

**🔵 标准**（默认）：

先看根因。发布确认、用户追问、工蜂事件代理这几类操作，实现方式是 canUseTool 返回 behavior 为 deny，把答案直接塞回模型。工具压根没执行，SDK 因此既不发 PostToolUse 也不发 PostToolUseFailure，对应的 TOOL span 一直挂在 inFlightSpans 里，直到整轮结束被插桩包的 endAllInFlight 兜底关闭，并打上 status 为 ERROR、message 为 Abandoned。Langfuse 的 trace 等级取子 span 最高值，于是用户点一次取消发布，整条 trace 就被标红，混进错误率里，看板完全失去意义。处理上我把识别判据收敛成一条：span 是 TOOL 类型、status 是 ERROR、message 含 Abandoned。命中后做三件事：status 从 ERROR 改成 UNSET，不是 OK，因为工具确实没执行成功，不能谎报；过滤掉 exception 事件；打上 langfuse.observation.level 为 WARNING 和 status_message 为 business-intercept。之所以显式写 level，是因为 Langfuse 对 level 的映射优先级是 attribute 高于 OTel status code。我最早的实现是工具名白名单加十几条中文文案反推，维护成本很高，现在判据只依赖 Abandoned 这个语义标志，新增任何等待用户的工具都不需要改上报侧。

<details><summary>🔴 深挖（点击展开）</summary>

这个坑的价值在于它暴露了指标口径问题：可观测数据不是把 span 收上来就完事，等级和状态的语义必须和业务语义对齐，否则看板会给出错误信号，团队会按错误的错误率做决策。我在处理时分了三层。第一层是识别：候选判据有工具名、deny 文案、错误码，我全部放弃了，因为它们都是表面特征，每加一个工具就要改一次上报，而且文案一改就失效；最终只用 Abandoned，因为它的语义是调用未执行，由插桩包自己产生，稳定且与业务无关。第二层是表达：status 只能取 UNSET，取 OK 会把未执行伪装成成功，取 ERROR 会被 Langfuse 映射回错误，两头都不对；真正的等级表达放在 langfuse.observation.level，因为 Langfuse 的优先级是 attribute 高于 status code，这样看板上它是 WARNING，既醒目又不计入错误率。第三层是层级：level 和 status_message 是 observation 级，只落在被拦截的那一个 TOOL span 上，而 user.id 和 projectId 是 trace 级，必须广播到每个 span，两者不能混，否则要么属性不生效要么污染了别的 span。还有个已知的局限：status_message 目前写死 business-intercept，因为 Abandoned 只能告诉我们工具没执行，区分不了发布取消、用户追问、工蜂代理三种场景。要做到精确，需要把 deny 现场的原因 kind 从 controller 经 runner 传到上报层，一共三层，目前没做，我在文档里把这个局限和扩展路径都写清楚了，面试时主动说出来反而加分。误伤方面也验证过：工具真的执行并失败时走 PostToolUseFailure，span 正常关闭，message 是具体错误信息而不是 Abandoned，不会被降级。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Langfuse 文档关于 observation level 与 status message 的映射规则
  - [ ] docs/Langfuse 上报接入说明.md 第七节
- 🛠️ 动手
  - [ ] 在测试环境点一次取消发布，先在改前版本看整条 trace 是否标红，再在改后版本确认变成 Warning 且 statusMessage 为 business-intercept
  - [ ] 构造一个工具真的执行失败的场景，确认它的 span 仍是 ERROR 且没被降级，验证不误伤
- ⚠️ 常见踩坑
  - 把 status 改成 OK，把未执行伪装成成功
  - 只写 status 不写 level，被 Langfuse 按 status code 映射回 ERROR
  - 把 observation 级属性当 trace 级用，只在 root span 上写导致不生效
- 🤔 自测题（合上文档自答）
  - [ ] 为什么判据不用工具名白名单？新增工具时会发生什么？
  - [ ] 怎么证明你的降级没有把真实故障也一起吃掉？
- ⏱️ 预估学习时长：**3.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/controllers/okr-direct-chat.controller.ts`
- `docs/Langfuse 上报接入说明.md 第七节`

---

### Q5. Langfuse 里要能按用户和项目过滤，userId 和 projectId 是怎么注入的？为什么 worker 必须显式传 projectId？

> 来源：`tp-05` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| AsyncLocalStorage 在请求级上下文中的作用与边界 | 必须掌握 | 解释为什么不用参数透传，以及读不到时怎么兜底 |
| Langfuse trace 级属性的合并规则与 broadcast 必要性 | 必须掌握 | 决定注入点放在 onEnd 且每个 span 都写 |
| metadata 的落库形态（顶层 key 而非 attributes 平铺） | 加分项 | 排查时最常见的找不到字段的原因 |

#### 三档回答

**🟢 一句话**：在 span 的 onEnd 从请求级 AsyncLocalStorage 读 userName 和 projectId，注入 user.id 与 metadata.projectId，且必须广播到每个 span。worker 没有请求上下文，projectId 只能由调用方显式传。

**🔵 标准**（默认）：

注入点在 span 的 onEnd，来源是 requestLogContext 这个请求级 AsyncLocalStorage，里面存了 userId、userName、projectId 以及 cache 用量。写进 span 的是两个 attribute：user.id 会被 Langfuse 映射成 trace 的 userId，langfuse.trace.metadata.projectId 会落到 trace 的 metadata 顶层，后台据此按用户和项目过滤聚合。这里有两个容易踩的点。第一是必须广播到每个 span：Langfuse 的 trace 级属性是从任意一个 span 上读取再合并的，只写在 root span 上不生效，所以我是在每个 span 的 onEnd 都注入，而不是只在根 span 注入。第二是 worker 场景必须显式传 projectId：HTTP 请求进来时 RequestContextInterceptor 会建立上下文，但里面只有 userId 和 userName，projectId 要由 controller 从 dto 里补；而周报 worker 这类后台任务根本没有 HTTP 请求，runQuery 只能补一个固定的 system 用户，项目 id 每个任务都不同，没法像用户那样写死，只能由调用方显式传。代码里的判断是有值才写，传空就没有这个字段，后台就搜不到项目。

<details><summary>🔴 深挖（点击展开）</summary>

为什么用 AsyncLocalStorage 而不是把参数一路透传：Agent 调用链很深，从 controller 到 runner 再到 SDK 回调，中间还有流式 chunk 和工具钩子，如果靠函数参数传 user 和 project，几乎每个签名都要改，而且第三方 SDK 的回调根本不受控。AsyncLocalStorage 能在同一个异步上下文里共享数据，只要入口处写入，链路上任意深度都能读到，上报层作为最后一个消费者自然也能读到。代价是它对异步边界敏感：如果代码里出现脱离上下文的调度，比如把任务丢进另一个不继承上下文的队列或用非异步的方式跨上下文调用，就读不到；所以我在 runner 里做了一个兜底，上下文不存在时用 system 用户补建一个，保证最少也有 userId。三个调用点的现状我在文档里列了表：HTTP 对话 controller 传的是 dto.projectId，某些场景可能为空；周报 worker 传 job.data.projectId，必有；阶段回顾 worker 当时还在 test 分支待补。新增调用点只要在 runQuery 里加一行 projectId 即可。还有一个排查经验：落到 Langfuse 后台后 projectId 是 metadata 顶层的 key，值是字符串，不是 attributes 里平铺的 langfuse.trace.metadata.projectId，很多人按后者去搜会搜不到。level 和 status_message 这类 observation 级属性与这些 trace 级属性不要混写，否则要么不生效要么污染单个 span 的语义。排查时先在后台 metadata 顶层找 projectId，再按 userId 过滤，比在 attributes 里翻找快得多。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Node.js 官方 AsyncLocalStorage 文档与 AsyncResource 的边界说明
  - [ ] Langfuse 文档关于 user.id 与 langfuse.trace.metadata 命名空间的约定
- 🛠️ 动手
  - [ ] 在周报 worker 里故意去掉 projectId，跑到 Langfuse 后台按项目过滤，确认搜不到后再补回来对比
  - [ ] 写一个最小 AsyncLocalStorage 示例，验证在 setTimeout 与 Promise 链里是否都能读到
- ⚠️ 常见踩坑
  - 只在 root span 注入 trace 级属性导致不生效
  - worker 场景忘记传 projectId，后台搜不到项目
  - 在后台按 attributes.langfuse.trace.metadata.projectId 去搜，实际应看 metadata 顶层
- 🤔 自测题（合上文档自答）
  - [ ] 如果某个 worker 忘了传 projectId，你怎么快速发现？
  - [ ] AsyncLocalStorage 在哪些情况下会读不到？你的兜底是什么？
- ⏱️ 预估学习时长：**3 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/common/logger/request-log-context.storage.ts`
- `apps/server/src/modules/report-scheduler/weekly-report.worker.ts`
- `docs/Langfuse 上报接入说明.md 第六、八节`

---

### Q6. Langfuse 上的 token 用量和成本一开始不准，cache 相关的口径是怎么修正的？

> 来源：`tp-06` · scope: backend · server · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Anthropic prompt caching 的 usage 字段语义 | 必须掌握 | 不知道 cache 读写与 input 的关系就讲不清口径差异 |
| OpenInference / Langfuse 的 prompt 与 cost 口径 | 必须掌握 | 决定换算方向，答反了会越改越错 |
| LLM 成本归因（usage 明细 × 模型价目表） | 加分项 | 解释为什么要删掉 SDK 给的总成本 |

#### 三档回答

**🟢 一句话**：插桩包不映射 cache，且 Anthropic 的 input 只含未命中部分，直接当 prompt 会倒推出负数。我在 AGENT span 补回 cache 读写并换算 prompt 与 total，再删掉 SDK 的总成本让平台重算。

**🔵 标准**（默认）：

第一层问题是数据丢失。Claude 的 usage 里 cache_creation_input_tokens 和 cache_read_input_tokens 是与 input、output 并列的独立字段，但插桩包 v0.3.4 只映射了 input、output、total，cache 到我们这一层时已经不在 span 上了，只能由 runner 在 result 阶段把这两个值写进 requestLogContext，上报层在 AGENT span 的 onEnd 时补回 llm.token_count.prompt_details.cache_read 和 cache_write。第二层是口径不一致。Anthropic 的 input_tokens 只含未命中 cache 的部分，总输入等于 input_tokens 加 cache 读加 cache 写；而 OpenInference 和 Langfuse 的 prompt 是总输入，cache 读写是它的子项。插桩包直接把 Anthropic 的 input_tokens 塞给 prompt 和 total，一旦出现 cache，Langfuse 倒推的非缓存 input 就变成负数被清零，total 也偏小。所以我把 prompt 换算成加回 cache 的总输入，total 等于新的 prompt 加 completion。第三层是成本。SDK 透传的 llm.cost.total 会让 Langfuse 直接采用为总成本、不再按模型价目拆分，成本拆分里 input 和 output 都是空；删掉这个 attribute 后，Langfuse 用自己的价格表乘以含 cache 的用量明细重新计算，三项都出来了。这三处改动都只作用于 AGENT span，因为用量和成本落在这里，不污染 TOOL span。

<details><summary>🔴 深挖（点击展开）</summary>

这类问题的本质是两家对同一个概念的定义不同，属于语义对齐问题而不是代码 bug。Anthropic 把 cache 命中与未命中的输入分开报，是为了让用户按不同单价计费，cache 读通常便宜一个数量级，cache 写更贵；OpenInference 作为中立规范，把 prompt 定义为总输入，cache 读写作为它的明细子项。当插桩包把 Anthropic 的 input_tokens 直接赋给 OpenInference 的 prompt 时，等于把部分输入当成了全部输入，于是所有依赖加法一致性的推导都会出错：Langfuse 用 prompt 减去 cache 明细去反推未缓存输入，结果减出负数，界面上要么清零要么显示异常，成本也随之偏小。我的处理顺序是先补数据再统口径：先确保 cache 读写这两个数字确实出现在 span 上，这要靠 runner 在 result 阶段写回上下文，因为在 SDK 的流式事件里，usage 是随 message 增量累加的，最终值只在 result 阶段完整；然后把 prompt 和 total 重算成含 cache 的口径，让减法是自洽的。成本那一步是独立发现的问题：有 llm.cost.total 时 Langfuse 认为调用方已经给了权威总成本，就跳过价格表计算，于是拆分表里 input 和 output 为空，只有 total；删掉之后它才会按用量明细逐项算，并且因为我们补了 cache 明细，它能用缓存感知的定价算出更准的数。验证方式是在 Langfuse 后台对比一次带 cache 命中的调用：修之前 observation 里看不到 cache 明细且 cost 只有总数，修之后能看到 cache read 与 cache write，且 input、output、total 三项都有值。这里也留了个注意点：这些换算依赖插桩包当前的行为，如果它以后自己映射了 cache，我这段补数逻辑就会重复计数，所以升级插桩包时要重新核一遍。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Anthropic 官方文档 prompt caching 章节关于 usage 字段的说明
  - [ ] Langfuse 文档关于 token 与 cost 计算、模型价格表的说明
- 🛠️ 动手
  - [ ] 跑一次长对话触发 cache 命中，对比修改前后 Langfuse 中 cache read / write 明细与 cost 拆分的变化
  - [ ] 临时保留 llm.cost.total，观察 Langfuse 成本拆分里 input 与 output 是否为空，再删掉对比
- ⚠️ 常见踩坑
  - 只补 cache 明细却不改 prompt 口径，导致倒推为负
  - 把换算应用到所有 span，污染 TOOL span 的属性
  - 插桩包升级后自己支持 cache 造成重复计数
- 🤔 自测题（合上文档自答）
  - [ ] 为什么 cache 命中会让 Langfuse 里的非缓存 input 变成负数？
  - [ ] 如果调用方已经给了总成本，你为什么还要删掉它？
- ⏱️ 预估学习时长：**3.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/services/local-runner.service.ts`

---

## 🔒 安全（security）— 1 题

### Q1. 把 prompt 和模型输出发到 Langfuse，数据出网和密钥管理你怎么处理？

> 来源：`tp-13` · scope: backend · server · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 密钥通过环境变量注入与 zod 校验 | 必须掌握 | 基础但必答，说明默认关闭即安全边界 |
| LLM 可观测的数据出网与合规边界 | 必须掌握 | 体现对 prompt 落库风险的正视 |
| 上报属性的最小化原则 | 加分项 | 说明为什么不额外塞敏感字段 |

#### 三档回答

**🟢 一句话**：密钥走环境变量且不配就不上报，默认不出网；实例是内网自建，我额外只加人和项目维度。prompt 落库的风险如实写进文档。

**🔵 标准**（默认）：

密钥层面，LANGFUSE_PUBLIC_KEY、SECRET_KEY、BASE_URL 都通过环境变量注入，env.schema.ts 用 zod 声明为 optional，本地 .env.local 不入库，也从未写进代码。运行层面，未配置就完全不上报，这既是为了本地开发便利，也是一条安全边界：任何不该出网的环境只要不配密钥就不会有数据流出。数据层面，Langfuse 用的是内网自建实例，不是公有云，但仍然要清楚它会完整保存 prompt 和模型输出，这类数据在当前场景里主要是 OKR 文本和周报内容，属于内部业务数据。我在上报侧只补了两个业务属性，user.id 取的是英文账号名，与用户信息接口返回的字段一致，便于按人过滤又不引入新的敏感字段；没有把手机号、邮箱、token 之类写进 span。剩下的是如实记录风险：文档里写明上报即意味着 prompt 和输出留在平台上，如果将来接入涉及个人敏感信息或保密项目的 Agent 能力，需要先评估是否上报或做脱敏，这不是当前代码能自动解决的问题。

<details><summary>🔴 深挖（点击展开）</summary>

安全边界我按三件事来想。第一是出网目的地：选内网自建而不是公有云 Langfuse，是因为 prompt 和输出这类数据出公司网络在合规上很难讲清楚，自建至少把数据留在内部，这也是当时选型的重要前提，不是事后补的。第二是失效安全：把三个变量设计成 optional 并且缺失即关闭，等于把默认状态设成不出网，任何新环境、新分支、本地调试默认都是安全的，需要上报时才显式开启，这比默认开启再靠配置关闭要稳。第三是最小化：上报内容由插桩包决定，它记录输入输出是 AI 可观测的核心价值，我不打算改，但我能控制的是自己额外加了什么，所以我只加了人和项目两个维度，而且用账号名而不是姓名、手机号之类的字段，保证按人聚合的能力不依赖敏感信息。还有一个容易被忽略的点是日志与配置：初始化成功时会打印一行 base 地址，我没有打印密钥；排查文档里也提醒不要为了验证去调读接口，因为当前实例是 events_only 模式，读接口本来就不可用。最后是遗留风险，我把它明确写进文档而不是藏着：一旦接入新场景，比如接入含个人隐私或保密内容的 Agent 能力，上报前需要评估或做脱敏，这个决策应该在需求评审阶段做，而不是等数据已经落到平台再补救。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Langfuse 自托管部署与数据留存相关文档
  - [ ] 公司关于内部数据出网与敏感字段的规范（以团队实际规范为准）
- 🛠️ 动手
  - [ ] 检查一次真实上报的 trace 内容，列出都落了哪些字段，确认没有密钥或敏感信息
  - [ ] 把三个环境变量清空后重启，确认服务正常启动且没有任何数据流出
- ⚠️ 常见踩坑
  - 把密钥写进代码或日志
  - 为了排查方便把姓名、手机号等字段塞进 span
  - 默认开启上报，靠配置关闭，新环境容易漏
- 🤔 自测题（合上文档自答）
  - [ ] 如果业务方要求某些对话完全不上报，你怎么实现？
  - [ ] 默认开启还是默认关闭上报？为什么？
- ⏱️ 预估学习时长：**2 小时**


#### Evidence

- `apps/server/src/config/env.schema.ts`
- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第十节`

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. 为什么选择寄生在 OTel 生态上，而不是自己写埋点？这个选择的风险是什么？

> 来源：`tp-11` · scope: backend · server · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 侵入式埋点与 OTel 插桩的取舍 | 必须掌握 | 面试官最想听的是为什么这么选、放弃了什么 |
| unmet peer 组合的风险管理 | 必须掌握 | 体现对依赖风险的识别与收敛手段 |
| 冒烟验证在可观测链路中的不可替代性 | 加分项 | 说明为什么单测覆盖不了这类问题 |

#### 三档回答

**🟢 一句话**：我选寄生在 OTel：零侵入、与伽利略同 trace_id、插桩由上游维护。代价是版本组合不受官方 peer 支持，适配收敛到一处，升级后必须冒烟。

**🔵 标准**（默认）：

候选方案有两个。一是自己写埋点，在 runner 里手动创建 trace 和 observation，把 prompt、输出、token 逐项写进去；好处是完全可控、没有版本问题，坏处是侵入业务代码，每加一个调用点都要写一遍，而且拿不到与伽利略一致的 trace_id，跨平台排查要自己做 id 透传。二是寄生在 OTel 上，用 OpenInference 自动产出 span，Langfuse 只做 processor；好处是业务零改动、trace_id 天然一致、插桩能力由社区维护，坏处是被两边的版本约束夹住。我选了后者，因为我的核心诉求是跨平台关联和低成本覆盖所有 Agent 调用，这两点恰好是 OTel 生态的强项。风险是明确的：伽利略锁 sdk-trace-base 1.30 属于 v1，@langfuse/otel 按 v2 写，这个组合不在官方 peer 范围内，pnpm install 会报 unmet peer，兼容层是我读两边源码后补出来的，能跑通有一半依赖序列化器当前读的是 v1 字段名。应对措施是把版本适配收敛到 integrations/langfuse 一个文件，并在注释和接入文档里写明：升级依赖后必须跑真实上报冒烟。

<details><summary>🔴 深挖（点击展开）</summary>

如果重做一次，我仍然会选寄生方案，但会把风险前置得更早。回头看，真正的成本不在写兼容层，而在验证成本：这类版本错配的问题不会在类型检查、单测甚至集成测试里暴露，因为假的 span 对象和真实 SDK 产出的 span 形状不同，只有真实上报到平台、在 UI 上看层级和字段才能发现。所以我后来把冒烟步骤写成了文档里的硬要求，并列出要确认的三件事：trace_id 一致、父子关系正确、scope 没丢。第二点收获是收敛的价值：所有适配逻辑集中在一个兼容 processor 里，边界清晰，升级时回归范围可控；如果当时图省事把字段补齐散落在业务代码里，后续每次升级都要全局搜索。第三是要敢于记录不确定性，我在文件头注释里直接写了这个组合不受官方 peer 支持、能跑通有一半是运气，这种记录对后来接手的人比一段看起来很优雅的代码更有价值。反过来说，如果项目对可观测的稳定性要求高于覆盖速度，或者不允许依赖 unmet peer，那么自建埋点是更稳的选择，只是要接受侵入业务和自己做 id 关联的代价；这个取舍我会按团队阶段来判断：AI 能力还在快速迭代时选寄生，能力稳定、调用点收敛后可以考虑收敛成更可控的方案。目前的已知缺口也如实写在了文档里，比如业务拦截的 statusMessage 只能笼统写 business-intercept，要精确到具体原因需要把 deny 的 reason kind 从 controller 经 runner 传到上报层，三层改动，尚未做。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenInference 项目关于 instrumentation 与 semconv 的设计说明
  - [ ] @langfuse/otel 的 peerDependencies 声明与 OTel 版本要求
- 🛠️ 动手
  - [ ] 在测试环境升级一个 @opentelemetry 包的小版本，按文档跑一遍冒烟，记录哪些字段先出问题
  - [ ] 写一个最小 demo 对比自建埋点与插桩方案在新增调用点时的改动量
- ⚠️ 常见踩坑
  - 只看单测通过就升级依赖，跳过真实上报冒烟
  - 把兼容逻辑散落到业务代码，升级时回归范围失控
  - 在文档里不写不确定性，后来人按理想假设改动
- 🤔 自测题（合上文档自答）
  - [ ] 什么情况下你会放弃寄生方案改回自建埋点？
  - [ ] 升级依赖后你怎么验证上报仍然正确？
- ⏱️ 预估学习时长：**3 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/package.json`
- `docs/Langfuse 上报接入说明.md 第五节`

---

