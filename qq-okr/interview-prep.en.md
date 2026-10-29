# QQ OKR（qq-okr） — Interview Preparation

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 0      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 6| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

QQ OKR is Tencent's internal OKR platform. I wired Claude Agent SDK calls into Langfuse, sharing one trace_id with Galileo, so every AI call is searchable by user and project for tokens and cost.

### Standard (30–60 seconds)

QQ OKR is an internal OKR and performance platform: a Next.js workbench in front, and behind it a NestJS, Prisma and BullMQ monorepo running an agent engine on the Claude Agent SDK for advisor chat, weekly reports and review drafts. I owned observability for that AI path and chose Langfuse. Rather than a second instrumentation stack, I attach a LangfuseSpanProcessor to the TracerProvider Galileo already owns and instrument the Agent SDK through OpenInference, so one call carries one trace_id across both platforms. Three problems did the real work: bridging the OpenTelemetry v1 fields Galileo pins to the v2 fields @langfuse/otel reads; detecting the Abandoned marker on spans whose tool was denied by canUseTool and downgrading them from ERROR to WARNING so healthy flows stop polluting the error rate; and re-adding cache tokens the instrumentation drops, plus fixing the cost split. Reporting is a bypass: missing config or failed init degrades, and shutdown flushes first.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

Architecturally I wanted two views over the same AI path: Galileo for service-level traces, logs and HTTP calls, Langfuse for prompts, outputs, tokens, cost, the tool-call tree and aggregation by user and project. The key decision is that both reporting branches hang off one TracerProvider, so each AI span is exported twice and the trace_id matches by construction; a single id is enough to pivot between platforms, which is the biggest win over writing a bespoke tracing SDK. The first constraint was ordering: main.ts must load dotenv, then initGalileo to create the provider, then initLangfuse to attach the processor and instrument the Agent SDK, and only then dynamically import NestJS startServer, because instrumentation has to be in place before business modules load. The second was version mismatch: Galileo pins OpenTelemetry sdk-trace-base 1.30 where a Span only has instrumentationLibrary and parentSpanId, while @langfuse/otel reads the v2 fields instrumentationScope and parentSpanContext. Missing the first makes the processor read undefined and crash; missing the second makes markAppRootCandidate treat every span as an app root and the parent-child tree disappears. I bridged both with read-only Proxy mappings and documented loudly that this combination is outside official peer support, so any dependency bump requires a real end-to-end reporting smoke test. The third was data semantics: intercepted tools never execute, so the SDK emits neither PostToolUse nor PostToolUseFailure and the span sits in flight until endAllInFlight closes it with an Abandoned marker. My first version matched a tool-name whitelist plus eleven Chinese strings; I collapsed it to the single Abandoned marker, which is semantically about not executing, so any new wait-for-user tool needs no reporting change. On a hit I set status to UNSET, drop exception events and write langfuse.observation.level as WARNING, so it neither counts as an error nor pretends to succeed. Dimensions come next: user.id and langfuse.trace.metadata.projectId must be broadcast to every span because trace-level attributes placed only on the root have no effect. In HTTP flows the controller merges dto.projectId into AsyncLocalStorage; workers have no request at all, so the caller must pass projectId explicitly or the trace is not searchable by project. Cost accounting closes the loop: instrumentation v0.3.4 does not map cache fields, so the runner writes cache read and write into the context at result time and the reporting layer re-adds them on the AGENT span; because Anthropic input_tokens excludes cache hits, handing it straight to prompt makes Langfuse derive a negative uncached input, so prompt and total are recomputed cache-inclusive and the SDK-supplied llm.cost.total is deleted so Langfuse re-derives the split from its cache-aware price table. On reliability, initLangfuse is wrapped in try/catch, any missing variable skips reporting, graceful shutdown flushes before closing; runtime export failures are logged.

</details>

## ✨ Highlights

- **与伽利略共用同一 trace_id 的双平台可观测** (observability · backend)
  Context: Galileo already covered traces and logs, but nothing showed prompts, tokens, cost or the tool tree. Task: make AI calls observable without building a second instrumentation stack. Action: instead of creating a new TracerProvider, attach a LangfuseSpanProcessor to the provider Galileo already owns so each AI span is exported twice. Result: one agent call carries one trace_id across both platforms, searchable by a single id, with no extra propagation code.
  > Keywords: `OpenTelemetry` · `TracerProvider` · `SpanProcessor` · `trace_id 对齐` · `伽利略`
- **ESM 下手动插桩 Claude Agent SDK 并接住返回值** (observability · backend)
  Context: the OpenInference instrumentation package cannot patch an ESM namespace object in place because it is read-only. Task: make query() calls emit AGENT, LLM and TOOL spans automatically. Action: shallow-copy the SDK object, call manuallyInstrument, and crucially keep the returned patched object, exposing it to the runner through getInstrumentedClaudeAgentSDK(). Result: ignoring the return value yields zero spans, while keeping it produces a complete tool tree; the runner always goes through this function and falls back to the raw SDK when reporting is off, so business code is untouched.
  > Keywords: `OpenInference` · `manuallyInstrument` · `ESM` · `Claude Agent SDK`
- **OTel v1/v2 字段兼容层** (observability · backend)
  Context: Galileo pins OpenTelemetry v1 while @langfuse/otel targets v2, a combination outside official peer support. Task: share one provider without crashing. Action: map v1 instrumentationLibrary to instrumentationScope with a Proxy, and synthesise a parentSpanContext object from parentSpanId. Result: no crash and a correct parent-child tree; without the latter every span is misclassified as an app root and the Is Root filter still lists every child. The doc states plainly that any dependency bump needs a real reporting smoke test.
  > Keywords: `OTel v1/v2` · `Proxy 兼容层` · `parentSpanContext` · `unmet peer`
- **业务拦截不再污染错误率** (observability · backend)
  Context: publish confirmation, follow-up answers and Gongfeng event proxying all return canUseTool deny and feed the answer back to the model, so the tool never runs and the span is force-closed with ERROR and an Abandoned message; Langfuse takes the highest child level, so healthy flows turned the whole trace red. Task: separate neutral intercepts from real failures. Action: collapse detection to one rule, a TOOL span with ERROR status whose message contains Abandoned, then set status to UNSET, filter exception events and write langfuse.observation.level as WARNING. Result: cancelling a publish no longer counts as an error while genuine failures still travel through PostToolUseFailure untouched, and the rule is decoupled from tool names and copy, so new waiting tools need no reporting change.
  > Keywords: `canUseTool deny` · `Abandoned` · `UNSET vs OK vs ERROR` · `observation level`
- **trace 维度：userId 与 projectId 的注入与广播** (observability · backend)
  Context: the Langfuse console needs filters by person and by project, but the HTTP context only carries userId and userName, and workers have no request at all. Task: stamp every trace with user and project. Action: at span onEnd, read userName and projectId from the request-scoped AsyncLocalStorage and inject user.id plus langfuse.trace.metadata.projectId, broadcasting to every span because trace-level attributes set only on the root have no effect; workers pass projectId explicitly into runQuery and get a synthetic system user. Result: the console can aggregate and debug across user, project and environment.
  > Keywords: `AsyncLocalStorage` · `user.id` · `metadata.projectId` · `trace 级属性广播`
- **cache token 补报与成本拆分修正** (observability · backend)
  Context: instrumentation v0.3.4 maps only input, output and total, so cache fields are gone by the time spans reach the reporting layer; Anthropic input_tokens counts only the portion that missed cache, unlike OpenInference's total-input notion, so feeding it straight into prompt makes Langfuse derive a negative uncached input that gets clamped to zero and understates total; on top of that the SDK-supplied llm.cost.total makes Langfuse adopt it wholesale, leaving input and output cost empty. Task: make usage and cost trustworthy. Action: the runner writes cache read and write into the context at result time, the reporting layer re-adds them on the AGENT span and recomputes prompt and total cache-inclusive, and llm.cost.total is deleted so Langfuse re-derives the split from its cache-aware price table. Result: usage is never negative and the cost breakdown shows input, output and total.
  > Keywords: `prompt caching` · `token 口径` · `llm.cost.total` · `cost attribution`


## 🏗️ Architecture (architecture) — 2 Q&A

### Q1. Why is the order of initGalileo, initLangfuse and startServer in main.ts fixed?

> Source: `tp-07` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| ESM 静态 import 与动态 import 的求值时机 | 必须掌握 | 解释为什么必须动态 import startServer |
| monkey patch 与模块引用绑定的冲突 | 必须掌握 | 解释覆盖不到的根因，而不是只背顺序 |
| dotenv 与 Nest ConfigModule 的加载时机差 | 加分项 | 解释为什么 init 阶段读不到 env |

#### Tiered answers

**🟢 Elevator**: Instrumentation must finish before business modules load. Order: dotenv, initGalileo for the provider, initLangfuse for the processor and SDK patch, then a dynamic import of startServer. initLangfuse degrades; initGalileo does not.

**🔵 Standard** (default):

The order is dictated by dependencies. First, dotenv must run before both inits because Nest's ConfigModule only loads env at NestFactory.create, far too late, while the init phase already needs the three LANGFUSE variables. Second, initGalileo must precede initLangfuse because Langfuse does not build its own provider and needs Galileo's global TracerProvider to attach a processor. Third, both inits must run before any business module loads, because instrumentation works by swapping SDK function references or registering a processor; if business modules already imported and cached the original references, later instrumentation would not affect those calls. That is why startServer is imported dynamically rather than statically at the top. Fault handling differs deliberately: initLangfuse is wrapped in try/catch and degrades to a logged skip because it is an observability bypass and must never block startup, whereas initGalileo is not wrapped because the provider is foundational and its failure must be visible. After degrading, getInstrumentedClaudeAgentSDK falls back to the raw SDK and behaviour is unchanged.

<details><summary>🔴 Deep dive (click to expand)</summary>

One layer deeper, this is the classic clash between Node module evaluation timing and monkey patching. ESM imports are bound before module execution, so a static import at the top of the file causes the entire dependency graph to evaluate before any of this file's own code runs; if startServer were static, the whole NestJS tree would load before initGalileo and initLangfuse, business modules would already hold references to the original SDK functions, and later instrumentation would only affect references created afterwards. The symptom is partial span coverage, which is notoriously hard to debug. A dynamic import defers loading to the call site, guaranteeing instrumentation is ready first. A second detail is dotenv placement: Nest's ConfigModule also supports envFilePath but only once the app is created, whereas instrumentation runs earlier, so we load dotenv ourselves and mirror ConfigModule's precedence of .env.local over .env. Third is the granularity of fault tolerance: the comment spells out that the try/catch around initLangfuse does not cover a Langfuse outage, because building a processor makes no network call and an outage never reaches the catch; what it covers is initialisation code itself breaking, such as a dependency bump or an instrumentation version mismatch, so a version conflict cannot take the service down. That distinction matters, because otherwise you might assume a Langfuse outage is auto-skipped, when in fact runtime export failures take a different path: the batch processor catches internally, hands the error to globalErrorHandler and returns ok false rather than throwing, so the process stays alive.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Node.js ESM 模块生命周期文档（linking 与 evaluation）
  - [ ] NestJS ConfigModule envFilePath 的加载时机说明
- 🛠️ Hands-on
  - [ ] 把 startServer 改成顶部静态 import，观察是否出现部分调用无 span 的现象并定位原因
  - [ ] 把 dotenv 那两行删掉，确认 LANGFUSE_* 读不到时走的是跳过分支而不是报错
- ⚠️ Common pitfalls
  - 把动态 import 当优化手段，其实它是插桩正确性的必要条件
  - 以为初始化失败会自动覆盖 Langfuse 宕机，实际两者路径不同
  - 把 initGalileo 也包上 try/catch，把基础链路故障藏起来
- 🤔 Self-check questions (answer without notes)
  - [ ] 改成静态 import 后会出现什么现象？为什么难排查？
  - [ ] Langfuse 服务宕机时，你的服务启动和运行分别会发生什么？
- ⏱️ Estimated time: **2.5 小时**


#### Evidence

- `apps/server/src/main.ts`
- `apps/server/src/start-server.ts`

---

### Q2. Do all spans go to Langfuse? How did you draw the data boundary between the two platforms?

> Source: `tp-08` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| instrumentation scope 作为过滤判据 | 必须掌握 | 说明边界为什么稳定、可维护 |
| Langfuse environment 分环境 | 加分项 | 多环境共实例时的必备隔离手段 |
| AI 可观测的数据量与统计口径影响 | 加分项 | 体现对存储成本与指标失真的判断 |

#### Tiered answers

**🟢 Elevator**: No. shouldExportSpan admits only spans whose scope starts with @arizeai/openinference, filtering out Galileo's HTTP and trpc spans. APP_ENV is passed as environment so the console can split by environment.

**🔵 Standard** (default):

The boundary is drawn on the span's instrumentation scope. When constructing LangfuseSpanProcessor I pass shouldExportSpan, whose predicate admits a span only when its scope name starts with @arizeai/openinference; everything else is dropped. Galileo's own HTTP and trpc spans therefore never reach Langfuse, keeping service-level noise out of an AI analytics platform, saving storage and leaving a clean trace structure of AGENT, LLM and TOOL observations only. The same processor receives environment from APP_ENV, whose values are development, test and formal, so the console can filter per environment. The reasoning is plain: who cares about which data. Service-level tracing belongs to Galileo, AI semantics to Langfuse, the two are joined by one trace_id, and when you need the other view you pivot by id instead of piling both datasets into one place.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why filter on scope rather than span kind or name: scope is an identity declared by the instrumentation library itself, stable and independent of business naming, whereas span names change with refactors and would eventually break the predicate. The OpenInference package consistently uses the @arizeai/openinference scope prefix, which makes a clean single-cut rule; the cost is that swapping the instrumentation package requires updating the prefix, which is why I extracted it as a named constant with a comment. The second consideration is data cost: LLM span payloads are far larger than ordinary HTTP spans, so without filtering Langfuse fills up with AI-irrelevant short spans that inflate storage and distort statistics, since trace counts and average latency would be diluted by service-level calls. The third is environment isolation: with several environments sharing one Langfuse instance, omitting environment lets test data pollute production stats, so I reuse the APP_ENV Galileo already honours and keep the two platforms consistent. One side effect is worth knowing: because only AI spans pass, a Langfuse trace usually lacks the outermost HTTP server span and its hierarchy starts at the AGENT span, so read the tree with that origin in mind; for cross-system debugging you still go back to Galileo for the full path, which again shows the platforms complement rather than replace each other. Verification is a real reporting smoke test after every dependency bump.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] @langfuse/otel 文档关于 shouldExportSpan 与 environment 的说明
  - [ ] OpenInference 语义约定中关于 span kind（AGENT / LLM / TOOL）的定义
- 🛠️ Hands-on
  - [ ] 把 shouldExportSpan 临时改成全部放行，跑一次请求后在 Langfuse 里数一数混入了多少 HTTP span
  - [ ] 把 environment 写死成 development 再跑测试环境请求，确认后台环境过滤失效的样子
- ⚠️ Common pitfalls
  - 用 span 名做判据，重构后静默失效
  - 漏配 environment，测试数据污染正式统计
  - 以为 Langfuse 里有完整 HTTP 入口 span，实际层级从 AGENT 开始
- 🤔 Self-check questions (answer without notes)
  - [ ] 换成另一个插桩库时，上报侧要改哪些地方？
  - [ ] 为什么不让所有 span 都进 Langfuse？
- ⏱️ Estimated time: **2 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第四节`

---

## ⚡ Performance (performance) — 1 Q&A

### Q1. Does reporting slow down AI calls? What performance trade-offs did you make?

> Source: `tp-12` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| BatchSpanProcessor 的异步导出语义 | 必须掌握 | 说明为什么上报不阻塞主链路 |
| span 属性体积与采样策略 | 加分项 | 体现真正的性能风险判断 |
| Proxy 与深拷贝在热路径上的取舍 | 加分项 | 解释为什么兼容层这样写 |

#### Tiered answers

**🟢 Elevator**: Export is async and batched, so requests never wait. Cost sits in onEnd: read-only Proxies and upstream filtering of non-AI spans. The real risk is span count and payload size, not mapping.

**🔵 Standard** (default):

Start with the path: span creation and ending happen synchronously during the agent call, but export is asynchronous in a batch processor that flushes on size or timer, so the request path never waits on the network. Everything I added sits in onEnd, including field compatibility, attribute injection, intercept rewriting and cache conversion, and that is synchronous cost. I control it three ways: all rewrites use a Proxy returning read-only mappings rather than deep-copying the span or rebuilding anything beyond the attribute object; checks come first so non-matching spans return untouched, for example anything that is not a TOOL or AGENT span takes the shortest path; and filtering happens upstream, since shouldExportSpan already rejects non-AI spans, so the volume entering the rewrite logic is small. There is no synchronous retry on the failure path either: export failures are handled inside the batch processor, which returns ok false and never blocks business. The real risk is not micro-optimisation but volume: long conversations and many tool calls produce large spans, so filtering and environment isolation matter for bandwidth too.

<details><summary>🔴 Deep dive (click to expand)</summary>

Quantitatively I split the cost into three segments. The first is the span lifecycle itself, brought by the instrumentation package and independent of my code, dominated by serialising inputs and outputs into attributes, most expensive with long prompts and multi-turn conversations; the available mitigation is sampling or truncation, which we have not enabled because debugging AI quality wants full coverage. The second segment is my own onEnd work: a few attribute reads and at most four Proxy wrappers per span, microseconds to tens of microseconds, negligible against a multi-second LLM call; I still avoid deep copies because a span carries events and internal references, where copying risks losing semantics and grows more expensive as spans grow. The third segment is export, asynchronous in the batch processor, never blocking on retry, with data loss as the worst case. What I watch more closely is tail risk: without a flush on graceful shutdown the last batch disappears, which in frequently restarted canary environments looks like missing data, so forceFlush is mandatory, bounded by the ten-second graceful-shutdown cap and unable to wait forever. One more easily missed point: if span volume grows a lot, the cost of reading AsyncLocalStorage and doing string matching in onEnd scales up, and the optimisation then is to move predicates earlier into shouldExportSpan or reduce volume by sampling, rather than micro-tuning the Proxy. None of that is built yet because the volume does not justify it, and I do not want to design for hypothetical load.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenTelemetry BatchSpanProcessor 配置说明（队列大小、定时、最大导出批量）
  - [ ] Langfuse 关于采样与数据量控制的文档
- 🛠️ Hands-on
  - [ ] 用压测脚本连打 50 次对话，观察进程 CPU 与内存、Langfuse 收到的 span 数量与导出延迟
  - [ ] 在 onEnd 里加一个计数与耗时打印，量化自己那段逻辑的实际开销
- ⚠️ Common pitfalls
  - 以为上报同步阻塞请求，实际是异步批量
  - 为假想负载提前做采样和复杂优化
  - 忽略优雅退出时最后一批数据的丢失
- 🤔 Self-check questions (answer without notes)
  - [ ] 上报延迟主要由什么决定？
  - [ ] span 量涨十倍时，你第一件事会改什么？
- ⏱️ Estimated time: **2.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第九节`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. Could the reporting itself take the service down? What degradation and shutdown handling did you build?

> Source: `tp-09` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 旁路依赖的降级分层（配置 / 初始化 / 运行期） | 必须掌握 | 体现可观测不影响可用性的设计意识 |
| BatchSpanProcessor 缓冲与 forceFlush 的必要性 | 必须掌握 | 解释为什么优雅退出必须显式 flush，否则丢最后一批数据 |
| 优雅退出的超时与失败容忍 | 加分项 | 退出阶段的异常处理容易被忽略 |

#### Tiered answers

**🟢 Elevator**: Three layers: missing env skips reporting, init failure degrades to no reporting, export failures are caught internally. On shutdown we forceFlush then shutdown, both tolerating failure.

**🔵 Standard** (default):

The principle is that observability must never be a single point of failure. Layer one is configuration: all three LANGFUSE variables are optional and missing any one of them logs a single line and returns, so local development needs nothing. Layer two is initialisation: initLangfuse is wrapped in try/catch inside main.ts, logs the error and continues booting because it is a bypass; after degrading, getInstrumentedClaudeAgentSDK falls back to the raw SDK and the runner behaves identically. Note that this catch does not cover a Langfuse outage, since building a processor makes no network call; it covers initialisation code breaking, such as dependency bumps or instrumentation version mismatches. Layer three is runtime: the batch processor's periodic flush path catches internally and routes to globalErrorHandler, and the Langfuse SDK fetch returns ok false rather than throwing, so export failures never crash the process. On the exit path, start-server registers installGracefulShutdown with shutdownLangfuse as beforeClose, so SIGTERM or SIGINT first forceFlush pending spans and then shutdown, each step in its own try/catch that only warns, never blocking the shutdown sequence.

<details><summary>🔴 Deep dive (click to expand)</summary>

I classify failures into three kinds and treat each differently. Missing configuration is an expected state, handled by a silent skip with one log line, no alert and no boot impact, because local development and some environments legitimately should not report. Initialisation failure is an exceptional state: it must log an error for operators to see but must not block startup, and the key judgement is being explicit about what the catch covers; my comment states it does not cover a Langfuse outage, because without that note a maintainer might assume a platform outage degrades automatically and misread a real incident. Runtime export failure is a persistent state and gets the most conservative handling: the batch processor already catches internally, so adding another layer would risk swallowing its own retry semantics, and the Langfuse SDK is designed to return ok false rather than throw, keeping business error monitoring clean. The exit path is the commonly missed piece: OTel batch processors buffer, so if a SIGTERM kills the process without a flush the last batch is lost, which shows up as a request that demonstrably happened but has no data, most visibly with short jobs or during canary restarts. So forceFlush is wired into beforeClose, ahead of the NestJS lifecycle teardown, and both steps are wrapped in try/catch because an uncaught exception during shutdown can produce a bad container exit code or blow the graceful-shutdown budget, which is itself capped at ten seconds and cannot wait forever. Together these three layers plus the exit handling guarantee that the worst case loses observability data, never service availability.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenTelemetry BatchSpanProcessor 关于缓冲、flush 与 shutdown 的说明
  - [ ] NestJS 生命周期钩子与优雅退出官方指南
- 🛠️ Hands-on
  - [ ] 本地发一次请求后立刻 kill 进程，对比有无 forceFlush 时 Langfuse 里最后一批 span 是否丢失
  - [ ] 把 LANGFUSE_BASE_URL 故意写错，观察运行期导出失败时进程是否存活、日志长什么样
- ⚠️ Common pitfalls
  - 以为初始化 try/catch 能兜住 Langfuse 宕机
  - 退出时不 flush，丢掉最后一批 span
  - 在退出路径抛出异常导致容器退出码异常
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么运行期导出失败不能抛异常？
  - [ ] 容器重启时最后几秒的请求数据为什么经常查不到？
- ⏱️ Estimated time: **3 小时**


#### Evidence

- `apps/server/src/main.ts`
- `apps/server/src/start-server.ts`
- `apps/server/src/config/env.schema.ts`
- `docs/Langfuse 上报接入说明.md 第九节`

---

### Q2. Background jobs like the weekly-report worker have no HTTP request. How is the reporting context built, and what bit you?

> Source: `tp-10` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 请求上下文与后台任务上下文的统一收敛 | 必须掌握 | 决定补建逻辑放在哪里，以及新调用点如何不漏 |
| 必填维度与可兜底维度的区分 | 必须掌握 | 体现宁可缺失也不造假的数据态度 |
| AsyncLocalStorage 的上下文继承边界 | 加分项 | 解释偶发丢维度的根因 |

#### Tiered answers

**🟢 Elevator**: Background jobs have no HTTP context, so runQuery builds one with a system user. userId can default, projectId cannot, since it differs per job; pass nothing and the trace is not found by project.

**🔵 Standard** (default):

Background jobs have no HTTP request, so RequestContextInterceptor never runs and requestLogContext is empty, leaving the reporting layer without user or project. The fix lives in runQuery: read the existing context and, if present, merge projectId into it before running the inner logic; if absent, build one with userId and userName both system plus projectId. HTTP flows thereby reuse the request context and worker flows still deliver a userId to Langfuse. The trap is that projectId cannot be inferred: in HTTP flows the controller passes dto.projectId, which can be empty in some scenarios, while workers have no request at all and the project id differs per job, so unlike the system user it cannot be hard-coded and must come from the caller. The code writes the field only when a value exists, so forgetting it produces no error, just a trace that cannot be found by project, a silent degradation that is hard to notice. The doc tabulates the three call sites, so every new worker is checked against it.

<details><summary>🔴 Deep dive (click to expand)</summary>

The essence is that context has more than one source and must converge at a single entry. I put the construction inside the runner's runQuery rather than scattering it across workers, because the runner is the only entry point for agent calls, so one place guarantees no new call site silently loses reporting dimensions; the remaining cost is that callers must still pass projectId, a constraint I pinned down with a parameter comment and a doc table. The second consideration is separating what can be defaulted from what cannot: userId can default to system because a background job has no person behind it, which is honest and also lets the console separate machine-initiated from human-initiated calls; projectId cannot be defaulted, because inventing a fake project id is worse than omitting it, producing data that looks complete but is wrong, so I chose absence over fabrication. The third is how to detect silent degradation: nothing errors, so you can only audit, which is why the doc keeps a call-site inventory that a new worker is checked against, plus one console verification filtering by project during integration. One more easily missed point: AsyncLocalStorage inheritance depends on the async context, so if a worker re-dispatches a task onto another queue or thread the inheritance can break and you get sporadic traces with no userId; the runner enters the run callback synchronously without cross-context dispatch, and any future cross-queue path would need to rebuild the context on the new side.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] BullMQ worker 与 NestJS 请求上下文的关系说明
  - [ ] docs/Langfuse 上报接入说明.md 第八节
- 🛠️ Hands-on
  - [ ] 在周报 worker 里去掉 projectId 跑一次，到后台按项目过滤确认搜不到，再补回对比
  - [ ] 新写一个最小 worker 调 runQuery，验证不传 projectId 时 trace 里 userId 是否仍为 system
- ⚠️ Common pitfalls
  - 给 projectId 填默认值，制造看起来完整但错误的数据
  - 把补建逻辑写在每个 worker 里，新增调用点容易漏
  - 跨队列调度导致上下文继承断裂，偶发丢 userId
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不给 projectId 一个默认值？
  - [ ] 新增一个 AI 调用入口时，你要改哪些地方才能保证上报维度完整？
- ⏱️ Estimated time: **2.5 小时**


#### Evidence

- `apps/server/src/modules/sandbox/services/local-runner.service.ts`
- `apps/server/src/modules/report-scheduler/weekly-report.worker.ts`
- `docs/Langfuse 上报接入说明.md 第八节`

---

## 📈 Observability (observability) — 6 Q&A

### Q1. You run both Galileo and Langfuse. Why not pick one, and how do the two platforms end up with the same trace_id?

> Source: `tp-01` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| OpenTelemetry SpanProcessor 与 TracerProvider 的关系 | 必须掌握 | 本方案成立的前提，讲不清就讲不清为什么 trace_id 会一致 |
| shouldExportSpan 的职责过滤 | 必须掌握 | 区分 AI span 与服务级 span，决定 Langfuse 里有没有噪声 |
| ProxyTracerProvider 与 getDelegate | 加分项 | 挂 processor 时最容易踩的实现细节 |

#### Tiered answers

**🟢 Elevator**: Galileo covers service traces and logs; Langfuse covers prompts, tokens, cost and tool trees. I attach a Langfuse processor to Galileo's provider, so one span exports twice and the trace_id matches.

**🔵 Standard** (default):

Two platforms because their views are complementary, not overlapping: Galileo owns service-level traces, logs and HTTP calls, while Langfuse owns AI-specific prompts and outputs, tokens, cost, the tool-call tree and aggregation by user and project. Choosing one would mean debugging AI quality without the full request trace, or tracing a request without tokens and cost. The trick for identical trace ids is never creating a second TracerProvider: initGalileo builds the global provider first and initLangfuse only calls addSpanProcessor on it, so OpenInference AI spans flow into both export branches and one agent call carries one trace_id in both systems. Debugging then pivots on a single id with no manual id propagation in logs. The price is that the Langfuse processor has to tolerate Galileo's pinned OpenTelemetry v1 shape, which is exactly why I had to write a compatibility layer.

<details><summary>🔴 Deep dive (click to expand)</summary>

Working backwards from the need, I required two kinds of data: what happened to the request on the server, meaning which endpoints were hit, which queries ran and where time went; and what happened inside the AI call, meaning the prompt, the model output, tokens consumed, money spent, which tools ran and with what arguments and results. Galileo is the first, Langfuse the second, and missing either breaks the debugging loop. The crucial implementation decision is that Langfuse never builds its own provider. If it did, its spans would live in a different id space and business code would have to pull the trace id out of the OTel context and pass it into Langfuse explicitly, which is invasive and easy to forget. Instead Langfuse is a parasite on Galileo's provider: LangfuseSpanProcessor is just a SpanProcessor, and once registered every span from every tracer hits its onStart and onEnd. I then filter with shouldExportSpan so only OpenInference AI spans go to Langfuse and Galileo's native HTTP and trpc spans stay out, keeping service-level noise away from an AI analytics platform. One span, two consumers, identical ids. There are two costs: the provider belongs to Galileo, so its OpenTelemetry version dictates the Span shape while @langfuse/otel expects v2, which forces the compatibility layer and puts the combination outside official peer support; and addSpanProcessor must be called on the real provider, since trace.getTracerProvider() returns a ProxyTracerProvider whose delegate holds the truth, so the code duck-types the lookup and, if it fails, only logs a warning instead of enabling reporting, never letting observability kill the service.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenTelemetry 官方概念文档 TracerProvider / SpanProcessor / Span Exporter
  - [ ] @langfuse/otel README 中 LangfuseSpanProcessor 的用法与配置项
- 🛠️ Hands-on
  - [ ] 本地起一个最小 Node 服务，先建一个 TracerProvider 再挂两个 processor，打印两边收到的 span 是否同 trace_id
  - [ ] 把 shouldExportSpan 改成全放行，观察 Langfuse 里混入的 HTTP span，再改回按 scope 前缀过滤
- ⚠️ Common pitfalls
  - 以为要自己传 trace id，实际上同一个 provider 天然一致
  - 直接对 trace.getTracerProvider() 调 addSpanProcessor，忽略 Proxy 委托导致静默不生效
  - 不过滤 span，把服务级噪声倒进 AI 分析平台
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果伽利略换成另一个 OTel 版本，你的上报会哪里先坏？
  - [ ] 为什么不让 Langfuse 自建 provider？两套 id 空间会带来什么问题？
- ⏱️ Estimated time: **3 小时**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If Galileo is retired one day, does your Langfuse reporting still work?** (trade-off)
  > Yes, but the premise changes. Today the provider belongs to Galileo and Langfuse is just one processor on it; retiring Galileo means creating a TracerProvider ourselves and attaching the processor, which is a localised change because the code is written against the provider abstraction. What must be re-validated is the compatibility layer: the v1 bridging exists because Galileo pins 1.30, so on mainstream v2 the toCompatSpan and withParentSpanContext wrappers should be removable, but a real reporting smoke test is mandatory to confirm trace ids, parent-child links and scopes survived.


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/main.ts`
- `docs/Langfuse 上报接入说明.md 第二节`

---

### Q2. How is the Claude Agent SDK instrumented, and why does everyone keep saying you must keep the return value of manuallyInstrument?

> Source: `tp-02` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| ESM 命名空间对象只读与 monkeypatch 限制 | 必须掌握 | 决定为什么必须走手动插桩并接住返回值 |
| OpenInference 手动插桩 API 语义 | 必须掌握 | 面试常问怎么落地，答出返回值语义是分水岭 |
| 降级回落到原始 SDK 的边界设计 | 加分项 | 体现可观测不侵入业务的意识 |

#### Tiered answers

**🟢 Elevator**: ESM namespace objects are read-only, so I shallow-copy the SDK and instrument that copy. The catch: manuallyInstrument returns a patched object; ignore it and query stays original, producing zero spans.

**🔵 Standard** (default):

Auto-instrumentation does not work here because the Claude Agent SDK ships as ESM and its namespace object is read-only, so the instrumentation package cannot swap the query function in place. I therefore instrument manually: await import the module, shallow-copy it into a plain object, construct ClaudeAgentSDKInstrumentation and call its manuallyInstrument with that copy. The catch is that under ESM manuallyInstrument returns a new patched object instead of mutating the input, so the return value must be captured; otherwise sdkCopy.query is still the unpatched function and the call produces no spans at all, silently, which is painful to debug. Once captured, the patched object is stored in a module-level variable and exposed to the runner via getInstrumentedClaudeAgentSDK; when Langfuse is not enabled that function simply returns the original module, so the runner needs no change and the business layer is unaware.

<details><summary>🔴 Deep dive (click to expand)</summary>

Instrumentation works by wrapping the target function: the wrapper opens a span, records inputs, outputs and tokens, calls the original, then closes the span and writes its status. With CommonJS the exports object is writable so the package can assign over it; with ESM the export bindings are immutable and assignment either fails silently or throws, so the package can only return a fresh object and let the caller decide. That is why I shallow-copy before passing it in: the copy is a plain object the package can modify, but to avoid depending on in-place mutation I always use the returned value. The nasty part is that failure is silent: query still works, the agent still runs, and both Galileo and Langfuse stay empty with nothing in the service logs, so only reading the instrumentation source reveals the return-value semantics. To prevent a repeat I funnel every call through getInstrumentedClaudeAgentSDK and state in both docs and code comments that importing the raw SDK directly yields an uninstrumented export. The other design point is degradation: when Langfuse is unconfigured or init fails, the getter returns the original module and the runner behaves identically, so turning observability off never changes business behaviour, which is a useful bisect signal when deciding whether a problem lives in reporting or in the agent itself. Keeping that return value is the entire trick.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] @arizeai/openinference-instrumentation-claude-agent-sdk 的 README 与 manuallyInstrument 源码
  - [ ] MDN 关于 ES module namespace object 不可变的说明
- 🛠️ Hands-on
  - [ ] 写一个小脚本：分别用直接 patch 与接住返回值两种方式调用 query，对比 span 数量差异
  - [ ] 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界
- ⚠️ Common pitfalls
  - 忽略返回值，导致零 span 且不报错
  - 业务代码里直接 import 原始 SDK，绕过插桩入口
  - 以为插桩是原地修改，在副本上做断言却发现副本没变
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么插桩失败时服务和 Agent 都正常，却一条数据都没有？
  - [ ] 如果插桩包升级后改成原地修改，你的代码需要怎么改？
- ⏱️ Estimated time: **2.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/services/local-runner.service.ts`

---

### Q3. Galileo is pinned to OpenTelemetry v1 while @langfuse/otel targets v2. How did you make them share one provider?

> Source: `tp-03` · scope: backend · server · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| OTel v1 与 v2 的 Span 字段差异 | 必须掌握 | 本方案最核心的技术难点，答不出具体字段名基本等于没做过 |
| Proxy 做只读字段映射的手法 | 必须掌握 | 解释为什么不深拷贝，体现对 span 生命周期的理解 |
| Langfuse markAppRootCandidate 的 root 判定 | 加分项 | 解释父子关系丢失的根因 |

#### Tiered answers

**🟢 Elevator**: Galileo pins OTel v1 while @langfuse/otel expects v2, and only two fields differ. A Proxy maps instrumentationLibrary to instrumentationScope and parentSpanId to parentSpanContext; v2 spans pass through.

**🔵 Standard** (default):

Once the provider is shared, spans from Galileo and from OpenInference both reach the Langfuse processor, but the former are v1-shaped while the processor reads v2, which breaks. In practice only two fields differ: instrumentationScope and parentSpanContext. Without the first the processor touches undefined.name and crashes; without the second, Langfuse's markAppRootCandidate cannot see a parent and marks every span as an app root, so the Is Root Observation filter still lists all children and the tree is lost. My fix wraps the processor: onStart and onEnd first run toCompatSpan to map instrumentationLibrary onto instrumentationScope, then withParentSpanContext to turn the parentSpanId string into an object with traceId and spanId. Both use a read-only Proxy rather than copying or mutating the span, and spans that already carry v2 fields pass through untouched. Worth stating out loud: this pairing is outside official peer support and pnpm install reports an unmet peer, so the doc insists that after bumping either @opentelemetry or @langfuse you run a real reporting smoke test to confirm trace ids, parent-child links and scopes are intact.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why the mismatch exists: the Galileo SDK depends on sdk-trace-base 1.30, an OpenTelemetry v1 implementation whose Span carries instrumentationLibrary and parentSpanId; OpenTelemetry 2.x renamed and reshaped both, turning instrumentationLibrary into instrumentationScope and the parentSpanId string into a parentSpanContext object. @langfuse/otel is written against the new spec and the OpenInference instrumentation emits new-shaped spans, so the real collision only happens when Galileo's native spans reach the Langfuse processor. My compatibility layer does three things: it only fills gaps, returning the span untouched when the field already exists so real values are never overwritten; it uses a Proxy rather than a deep copy, because a Span holds references and methods that a copy would lose while the Proxy only intercepts the two specific reads and forwards everything else through Reflect; and it sits at the processor boundary instead of patching an SDK, so when either side is upgraded this layer is the single place to regression-test. The risk is explicit: this pairing is outside official peer support and the otlp-transformer currently reads v1 field names, so working today is partly luck, which is why the doc makes a real reporting smoke test a hard requirement after any dependency bump rather than trusting unit tests. Practically, if traces suddenly show every span as a root with no hierarchy, suspect the parentSpanContext mapping; if the processor throws something about undefined, suspect instrumentationScope.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenTelemetry 2.0 升级说明中关于 instrumentationScope 与 parentSpanContext 的变更
  - [ ] @langfuse/otel 源码里 markAppRootCandidate 的实现
- 🛠️ Hands-on
  - [ ] 构造一个只有 v1 字段的假 span，分别在有、无兼容层的情况下喂给 processor，观察崩溃与 root 误标两种现象
  - [ ] 把 parentSpanContext 映射临时删掉，在 Langfuse 后台勾 Is Root Observation，复现一堆子节点的画面并截图留存
- ⚠️ Common pitfalls
  - 只补 instrumentationScope 忘了 parentSpanContext，表现为父子关系丢失而非报错
  - 用深拷贝代替 Proxy，丢掉 span 内部方法
  - 升级依赖后只跑单测，跳过真实上报冒烟
- 🤔 Self-check questions (answer without notes)
  - [ ] 升级 OTel 到 2.x 后，你的兼容层哪些代码可以删？哪些必须保留？
  - [ ] 为什么字段缺失导致的父子关系丢失不会报错，只能通过 UI 发现？
- ⏱️ Estimated time: **4 小时**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Could you skip the Proxy and just normalise the span into a plain object in onStart?** (trade-off)
  > I would not. A Span is not plain data: it carries spanContext, status, events and possibly references the SDK relies on later, so flattening it risks dropping things the processor reads downstream, and copying every span adds cost on a hot path. The Proxy only intercepts those two field reads and forwards everything else through Reflect, so it is copy-free and preserves the original semantics. The only caveat is that the Proxy itself runs once per span, which is cheap but not free at high volume, which is another reason I keep it at the processor boundary where it can be swapped out wholesale.


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第五节`

---

### Q4. Intercepted tools never actually ran, yet they were reported as ERROR and turned healthy traces red. How did you handle it?

> Source: `tp-04` · scope: backend · server · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Langfuse trace 等级取子 span 最高值的规则 | 必须掌握 | 解释为什么一个 span 会让整条 trace 标红 |
| observation 级属性与 trace 级属性的区别 | 必须掌握 | 决定 level 与 userId 分别写在哪里 |
| Claude Agent SDK 的 PostToolUse / PostToolUseFailure 事件语义 | 加分项 | 解释为什么被拦截的工具不会有正常收尾事件 |

#### Tiered answers

**🟢 Elevator**: A denied tool never runs; its span is closed with ERROR and Abandoned, turning the trace red. I detect Abandoned, set UNSET status and a WARNING level.

**🔵 Standard** (default):

Start from the root cause. Publish confirmation, follow-up answers and Gongfeng event proxying are implemented as canUseTool returning behavior deny with the answer fed back to the model, so the tool never executes; the SDK therefore emits neither PostToolUse nor PostToolUseFailure, the TOOL span stays in inFlightSpans, and at the end of the turn the instrumentation package's endAllInFlight closes it with status ERROR and an Abandoned message. Langfuse takes the highest child level for the trace, so a single cancel-publish click turns the whole trace red and pollutes the error rate, making dashboards meaningless. My fix collapses detection to one rule: a TOOL span whose status is ERROR and whose message contains Abandoned. On a hit I do three things: flip status to UNSET rather than OK, because the tool genuinely did not run and I refuse to claim success; filter out exception events; and stamp langfuse.observation.level as WARNING with status_message business-intercept. The level is written explicitly because Langfuse prioritises that attribute over the OTel status code. My first version used a tool-name whitelist plus string matching, which was expensive.

<details><summary>🔴 Deep dive (click to expand)</summary>

The value of this pitfall is that it exposes a metrics-semantics problem: observability is not finished when spans arrive, because levels and statuses must match business meaning or the dashboard emits false signals and the team makes decisions on a bogus error rate. I worked in three layers. Detection: candidate signals were tool names, deny copy and error codes, and I rejected all of them because they are surface features that break whenever a tool is added or copy changes; Abandoned survived because it is produced by the instrumentation package itself, stable and business-agnostic, and means the call never executed. Expression: status can only be UNSET, since OK would disguise non-execution as success and ERROR would be mapped back to an error by Langfuse; the real level lives in langfuse.observation.level because Langfuse prioritises that attribute over the status code, so the board shows a WARNING that is visible but excluded from the error rate. Layering: level and status_message are observation-level and land only on that one intercepted TOOL span, while user.id and projectId are trace-level and must be broadcast to every span; mixing the two either makes attributes ineffective or pollutes unrelated spans. There is a known limitation: status_message is hard-coded to business-intercept because Abandoned only tells us the tool did not run and cannot distinguish cancel-publish, follow-up and Gongfeng proxying. Making it precise requires threading a reason kind from the deny site through controller, runner and the reporting layer, three hops I have not built yet; the doc records both the limitation and the extension path, and volunteering it in an interview is a plus. I also checked for false positives: a tool that really runs and fails goes through PostToolUseFailure, closes normally with a concrete error message rather than Abandoned, and is never downgraded.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Langfuse 文档关于 observation level 与 status message 的映射规则
  - [ ] docs/Langfuse 上报接入说明.md 第七节
- 🛠️ Hands-on
  - [ ] 在测试环境点一次取消发布，先在改前版本看整条 trace 是否标红，再在改后版本确认变成 Warning 且 statusMessage 为 business-intercept
  - [ ] 构造一个工具真的执行失败的场景，确认它的 span 仍是 ERROR 且没被降级，验证不误伤
- ⚠️ Common pitfalls
  - 把 status 改成 OK，把未执行伪装成成功
  - 只写 status 不写 level，被 Langfuse 按 status code 映射回 ERROR
  - 把 observation 级属性当 trace 级用，只在 root span 上写导致不生效
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么判据不用工具名白名单？新增工具时会发生什么？
  - [ ] 怎么证明你的降级没有把真实故障也一起吃掉？
- ⏱️ Estimated time: **3.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/controllers/okr-direct-chat.controller.ts`
- `docs/Langfuse 上报接入说明.md 第七节`

---

### Q5. How do userId and projectId get into Langfuse, and why must workers pass projectId explicitly?

> Source: `tp-05` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| AsyncLocalStorage 在请求级上下文中的作用与边界 | 必须掌握 | 解释为什么不用参数透传，以及读不到时怎么兜底 |
| Langfuse trace 级属性的合并规则与 broadcast 必要性 | 必须掌握 | 决定注入点放在 onEnd 且每个 span 都写 |
| metadata 的落库形态（顶层 key 而非 attributes 平铺） | 加分项 | 排查时最常见的找不到字段的原因 |

#### Tiered answers

**🟢 Elevator**: At span onEnd I read userName and projectId from request-scoped AsyncLocalStorage and inject user.id plus metadata.projectId into every span. Workers have no request, so the caller must pass projectId.

**🔵 Standard** (default):

Injection happens at span onEnd from requestLogContext, a request-scoped AsyncLocalStorage holding userId, userName, projectId and cache usage. Two attributes are written: user.id, which Langfuse maps to the trace userId, and langfuse.trace.metadata.projectId, which lands as a top-level key in the trace metadata for filtering and aggregation by user and project. Two traps matter here. First, it must be broadcast to every span: Langfuse merges trace-level attributes from whichever span carries them, so writing them only on the root has no effect, which is why I inject on every span's onEnd rather than once. Second, workers must pass projectId explicitly: an incoming HTTP request gets a context from RequestContextInterceptor, but it only carries userId and userName, so the controller fills projectId from the dto; a background job such as the weekly-report worker has no request at all, so runQuery can only synthesise a fixed system user, and because the project id differs per job it cannot be hard-coded the way a user name can. The field is written only when a value exists, so an empty projectId makes the trace unsearchable.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why AsyncLocalStorage instead of threading parameters: the agent call path is deep, running from controller to runner into SDK callbacks with streaming chunks and tool hooks in between, so passing user and project as arguments would mean changing nearly every signature, and third-party SDK callbacks are not ours to change. AsyncLocalStorage shares data across one async context, so writing once at the entry makes it readable at any depth, and the reporting layer as the final consumer naturally sees it. The cost is sensitivity to async boundaries: if code schedules work outside the inherited context, for example dropping a task onto a queue that does not propagate it, the read returns empty, which is why the runner has a fallback that synthesises a system user when no context exists so at least userId is present. The doc tabulates the three call sites: the HTTP chat controller passes dto.projectId, which can be empty in some flows; the weekly-report worker passes job.data.projectId, always present; the review-draft worker was still on a test branch and pending. Adding a call site is one extra line, projectId inside runQuery. One debugging note: in the Langfuse console projectId appears as a top-level metadata key holding a string, not as a flattened attributes.langfuse.trace.metadata.projectId path, and searching the latter finds nothing. Observation-level attributes such as level and status_message should never be mixed with these trace-level ones, or they either fail to apply or pollute a single span's semantics. For debugging, look for projectId as a top-level metadata key, not a flattened attribute path.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Node.js 官方 AsyncLocalStorage 文档与 AsyncResource 的边界说明
  - [ ] Langfuse 文档关于 user.id 与 langfuse.trace.metadata 命名空间的约定
- 🛠️ Hands-on
  - [ ] 在周报 worker 里故意去掉 projectId，跑到 Langfuse 后台按项目过滤，确认搜不到后再补回来对比
  - [ ] 写一个最小 AsyncLocalStorage 示例，验证在 setTimeout 与 Promise 链里是否都能读到
- ⚠️ Common pitfalls
  - 只在 root span 注入 trace 级属性导致不生效
  - worker 场景忘记传 projectId，后台搜不到项目
  - 在后台按 attributes.langfuse.trace.metadata.projectId 去搜，实际应看 metadata 顶层
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果某个 worker 忘了传 projectId，你怎么快速发现？
  - [ ] AsyncLocalStorage 在哪些情况下会读不到？你的兜底是什么？
- ⏱️ Estimated time: **3 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/common/logger/request-log-context.storage.ts`
- `apps/server/src/modules/report-scheduler/weekly-report.worker.ts`
- `docs/Langfuse 上报接入说明.md 第六、八节`

---

### Q6. Token usage and cost on Langfuse were wrong at first. How did you fix the cache accounting?

> Source: `tp-06` · scope: backend · server · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Anthropic prompt caching 的 usage 字段语义 | 必须掌握 | 不知道 cache 读写与 input 的关系就讲不清口径差异 |
| OpenInference / Langfuse 的 prompt 与 cost 口径 | 必须掌握 | 决定换算方向，答反了会越改越错 |
| LLM 成本归因（usage 明细 × 模型价目表） | 加分项 | 解释为什么要删掉 SDK 给的总成本 |

#### Tiered answers

**🟢 Elevator**: The instrumentation skips cache, and Anthropic input counts only misses, so prompt goes negative. I re-add cache read and write on the AGENT span, recompute totals and drop the SDK cost.

**🔵 Standard** (default):

The first problem is data loss. Claude reports cache_creation_input_tokens and cache_read_input_tokens as siblings of input and output, but instrumentation v0.3.4 maps only input, output and total, so by the time a span reaches my layer the cache numbers are gone; the only fix is to have the runner write them into requestLogContext at result time and let the reporting layer re-add llm.token_count.prompt_details.cache_read and cache_write on the AGENT span's onEnd. The second is a mismatch of definitions. Anthropic input_tokens counts only the portion that missed cache, so total input equals input_tokens plus cache read plus cache write, while OpenInference and Langfuse treat prompt as total input with cache reads and writes as its children. The instrumentation hands Anthropic input_tokens straight to prompt and total, so as soon as caching appears Langfuse's derived uncached input goes negative, gets clamped to zero, and total comes out too small. I therefore recompute prompt as the cache-inclusive total and total as that plus completion. The third is cost. I also delete the SDK-supplied llm.cost.total, which leaves input and output cost empty if kept.

<details><summary>🔴 Deep dive (click to expand)</summary>

At heart this is a semantic alignment problem rather than a code bug: two parties define the same concept differently. Anthropic reports cache hits and misses separately because they are billed at different rates, cache reads roughly an order of magnitude cheaper and cache writes more expensive, while OpenInference as a neutral spec defines prompt as total input with cache read and write as its detail children. When the instrumentation assigns Anthropic input_tokens straight to the OpenInference prompt, part of the input is presented as the whole, so every derivation that assumes additive consistency breaks: Langfuse subtracts cache detail from prompt to derive uncached input, gets a negative number, clamps it to zero or shows nonsense, and cost is understated accordingly. My order of operations is add the data first, then unify the accounting: make sure cache read and write actually appear on the span, which requires the runner to write them back at result time because usage arrives incrementally with streamed messages and is only complete at the result stage; then recompute prompt and total cache-inclusive so the subtraction is self-consistent. The cost fix was a separate discovery: with llm.cost.total present, Langfuse assumes the caller supplied an authoritative total and skips its price table, so the breakdown shows only total with input and output empty; deleting it forces per-item computation from usage, and because we now supply cache detail it can apply cache-aware pricing for a more accurate figure. Verification is a side-by-side in the Langfuse console on a call with a cache hit: before the fix the observation shows no cache detail and only a total cost, after it shows cache read and write and all three cost components. One caveat remains: these conversions depend on the instrumentation package's current behaviour, so if a future version maps cache itself my re-adding logic would double count, which is another reason to re-check on upgrade.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Anthropic 官方文档 prompt caching 章节关于 usage 字段的说明
  - [ ] Langfuse 文档关于 token 与 cost 计算、模型价格表的说明
- 🛠️ Hands-on
  - [ ] 跑一次长对话触发 cache 命中，对比修改前后 Langfuse 中 cache read / write 明细与 cost 拆分的变化
  - [ ] 临时保留 llm.cost.total，观察 Langfuse 成本拆分里 input 与 output 是否为空，再删掉对比
- ⚠️ Common pitfalls
  - 只补 cache 明细却不改 prompt 口径，导致倒推为负
  - 把换算应用到所有 span，污染 TOOL span 的属性
  - 插桩包升级后自己支持 cache 造成重复计数
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么 cache 命中会让 Langfuse 里的非缓存 input 变成负数？
  - [ ] 如果调用方已经给了总成本，你为什么还要删掉它？
- ⏱️ Estimated time: **3.5 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/src/modules/sandbox/services/local-runner.service.ts`

---

## 🔒 Security (security) — 1 Q&A

### Q1. You ship prompts and model outputs to Langfuse. How do you handle data egress and key management?

> Source: `tp-13` · scope: backend · server · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 密钥通过环境变量注入与 zod 校验 | 必须掌握 | 基础但必答，说明默认关闭即安全边界 |
| LLM 可观测的数据出网与合规边界 | 必须掌握 | 体现对 prompt 落库风险的正视 |
| 上报属性的最小化原则 | 加分项 | 说明为什么不额外塞敏感字段 |

#### Tiered answers

**🟢 Elevator**: Keys come from env and are zod-validated; missing config means no reporting, so the default is no egress. The instance is self-hosted internally and I add only user and project dimensions, by account name.

**🔵 Standard** (default):

On keys, LANGFUSE_PUBLIC_KEY, SECRET_KEY and BASE_URL are injected as env variables, declared optional in a zod schema, kept out of the repo in a local .env.local and never hard-coded. At runtime, missing configuration means no reporting at all, which serves local development and doubles as a security boundary: any environment that must not export data simply does not hold the keys. On data, Langfuse is a self-hosted internal instance rather than a public cloud, but it still stores prompts and model outputs in full, which here means OKR text and weekly-report content, internal business data. On the reporting side I add only two business attributes, user.id being the account name that matches the user info endpoint, enough to filter by person without introducing new sensitive fields; no phone numbers, emails or tokens are written into spans. Residual risk is documented honestly: reporting means prompts and outputs persist on the platform, so sensitive scenarios need a masking decision first.

<details><summary>🔴 Deep dive (click to expand)</summary>

I think about the security boundary as three things. First, the destination: choosing a self-hosted internal Langfuse over the public cloud is because exporting prompts and outputs outside the company network is hard to justify in compliance terms, and self-hosting at least keeps data internal, a precondition of the choice rather than a retrofit. Second, fail-safe: making all three variables optional and treating absence as off sets the default state to no egress, so any new environment, branch or local debug run is safe by default and reporting must be explicitly enabled, which is more robust than defaulting on and relying on configuration to turn it off. Third, minimisation: the instrumentation package decides that inputs and outputs are recorded, which is the core value of AI observability and not something I intend to change, but I control what I add on top, so I add only the person and project dimensions using the account name rather than real names, phone numbers or similar, keeping per-person aggregation independent of sensitive data. One commonly missed detail is logging and configuration: the successful-init log prints the base URL but never keys, and the debugging doc warns against probing read endpoints to verify, since this instance runs in events_only mode where they are unavailable anyway. Finally, residual risk is written into the doc rather than hidden: when a new scenario arrives, such as an agent capability handling personal or confidential content, the decision to report or mask belongs in requirements review, before data lands on the platform, not as a cleanup afterwards.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Langfuse 自托管部署与数据留存相关文档
  - [ ] 公司关于内部数据出网与敏感字段的规范（以团队实际规范为准）
- 🛠️ Hands-on
  - [ ] 检查一次真实上报的 trace 内容，列出都落了哪些字段，确认没有密钥或敏感信息
  - [ ] 把三个环境变量清空后重启，确认服务正常启动且没有任何数据流出
- ⚠️ Common pitfalls
  - 把密钥写进代码或日志
  - 为了排查方便把姓名、手机号等字段塞进 span
  - 默认开启上报，靠配置关闭，新环境容易漏
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果业务方要求某些对话完全不上报，你怎么实现？
  - [ ] 默认开启还是默认关闭上报？为什么？
- ⏱️ Estimated time: **2 小时**


#### Evidence

- `apps/server/src/config/env.schema.ts`
- `apps/server/src/integrations/langfuse/index.ts`
- `docs/Langfuse 上报接入说明.md 第十节`

---

## ⚖️ Trade-off (trade-off) — 1 Q&A

### Q1. Why ride on the OTel ecosystem instead of writing your own instrumentation, and what is the risk of that choice?

> Source: `tp-11` · scope: backend · server · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 侵入式埋点与 OTel 插桩的取舍 | 必须掌握 | 面试官最想听的是为什么这么选、放弃了什么 |
| unmet peer 组合的风险管理 | 必须掌握 | 体现对依赖风险的识别与收敛手段 |
| 冒烟验证在可观测链路中的不可替代性 | 加分项 | 说明为什么单测覆盖不了这类问题 |

#### Tiered answers

**🟢 Elevator**: I ride on OTel: zero intrusion, shared trace_id with Galileo, upstream-maintained instrumentation. The cost is a pairing outside official peer support, so adaptation sits in one file and every bump needs a smoke test.

**🔵 Standard** (default):

There were two candidates. One was bespoke instrumentation: create traces and observations by hand in the runner and write prompt, output and tokens field by field. It is fully controllable but intrudes into business code, repeats for every call site, and cannot share a trace_id with Galileo, so pivoting needs manual id propagation. The other was riding on OTel: OpenInference emits spans and Langfuse acts only as a processor. It costs nothing in business code, shares trace ids by construction and gets instrumentation maintained upstream, at the price of being squeezed between two version constraints. I chose the latter because my core requirements were cross-platform correlation and cheap coverage of every agent call, exactly where the OTel ecosystem is strongest. The risk is explicit: Galileo pins sdk-trace-base 1.30, a v1 implementation, while @langfuse/otel targets v2, a pairing outside official peer support that makes pnpm install report an unmet peer; the compatibility layer came from reading both codebases and works partly because the serialiser still reads v1 field names. Mitigation: confine adaptation to one file and smoke test after every bump.

<details><summary>🔴 Deep dive (click to expand)</summary>

If I did it again I would still ride on OTel, but I would front-load the risk earlier. In hindsight the real cost was not writing the compatibility layer but verifying it: version mismatches like this never surface in type checks, unit tests or even integration tests, because fake span objects do not have the same shape as spans emitted by the real SDK; only a genuine export inspected in the UI reveals broken hierarchy or missing fields. That is why the smoke test became a hard requirement in the doc, with three things to confirm: trace ids align, parent-child links are correct and scopes survive. The second lesson is the value of confinement: every adaptation lives in one compatibility processor with a clear boundary, so the regression surface on upgrade is small; scattering field patches through business code would have meant global searches on every bump. The third is to record uncertainty openly; the file header says plainly that the pairing is outside official peer support and that working at all is partly luck, which helps the next maintainer far more than elegant-looking code. Conversely, if a project values observability stability over coverage speed, or forbids unmet peers, bespoke instrumentation is the safer choice, accepting business intrusion and manual id correlation; I would decide by team stage, parasitic while AI features iterate fast and more controlled once call sites stabilise. Known gaps are documented honestly too, for instance that intercepted traces can only carry a generic business-intercept status message, and making it precise would require threading the deny reason kind from controller through runner to the reporting layer, a three-hop change not yet built.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenInference 项目关于 instrumentation 与 semconv 的设计说明
  - [ ] @langfuse/otel 的 peerDependencies 声明与 OTel 版本要求
- 🛠️ Hands-on
  - [ ] 在测试环境升级一个 @opentelemetry 包的小版本，按文档跑一遍冒烟，记录哪些字段先出问题
  - [ ] 写一个最小 demo 对比自建埋点与插桩方案在新增调用点时的改动量
- ⚠️ Common pitfalls
  - 只看单测通过就升级依赖，跳过真实上报冒烟
  - 把兼容逻辑散落到业务代码，升级时回归范围失控
  - 在文档里不写不确定性，后来人按理想假设改动
- 🤔 Self-check questions (answer without notes)
  - [ ] 什么情况下你会放弃寄生方案改回自建埋点？
  - [ ] 升级依赖后你怎么验证上报仍然正确？
- ⏱️ Estimated time: **3 小时**


#### Evidence

- `apps/server/src/integrations/langfuse/index.ts`
- `apps/server/package.json`
- `docs/Langfuse 上报接入说明.md 第五节`

---

