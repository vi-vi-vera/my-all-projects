# QPilot Code Agent — Interview Preparation

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 3      | 🧩 |
| architecture  | 3 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 0 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

An enterprise AI coding platform that turns design drafts and natural-language requirements into previewable, deployable multi-framework frontend code in real time.

### Standard (30–60 seconds)

QPilot Code Agent is an enterprise AI coding platform. The backend is Express plus the Claude Agent SDK plus MCP, exposing SSE streaming endpoints; the frontend is React 18 plus Zustand plus Sandpack. Every session gets an isolated sandbox backed by the OpenSandbox SDK. The in-process warm pool is a no-op. Cross-pod state has Redis as the source of truth, and reads call OpenSandbox getInfo. For the preview path, the build artifact in the sandbox is mounted onto a subdomain by deploy-proxy, and vite base is rewritten by subpath at deploy time. For observability we use OpenTelemetry plus Langfuse, attaching SSE handlers, tool calls, and LLM prompt and token usage to the same trace with a shared trace_id.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

QPilot Code Agent moves AI coding from demo to a graduated product. The frontend uses fetch-event-source for SSE and renders tool_use and tool_result as separate chunks; the nginx reverse proxy has proxy_buffering off and X-Accel-Buffering: no, otherwise first-byte gets buffered. The backend is built on the Claude Agent SDK plus MCP, with tools — git, sandbox commands, file IO, deploy — registered through an MCP catalog, each tool exposing a name, input schema, and handler. The sandbox runtime is the OpenSandbox SDK only. e2b remains in comments. sandbox-warm-pool.service.ts is a no-op and acquireWarmSandbox always returns null. The git endpoints fold multiple sandbox.exec calls into a single set -e composite command parsed back via delimiter markers, with seven endpoints sharing the same merge logic. SSE over WebSocket: almost all events are server-to-client, SSE is HTTP-compatible and Last-Event-ID resume is simpler; Redis primary plus DB fallback over a single DB: sandbox state has very high read/write frequency, a single DB cannot keep up, Redis hits in sub-millisecond and the DB carries load only on failure or rebuild. For observability we inject W3C Trace Context into LLM call sites, large fields like prompt text and token usage are written to Langfuse, while OTel only records scalars — model_name, prompt_tokens, completion_tokens, duration.

</details>

## ✨ Highlights

- **SSE + MCP 的实时 AI Agent 链路（前后端协同）** (architecture · fullstack)
  AI Agent UX depends on streaming. The backend exposes SSE backed by the Claude Agent SDK plus MCP, and the frontend consumes it with fetch-event-source, rendering tool_use and tool_result as separate chunks. The nginx reverse proxy buffers streams by default, so we turn off proxy_buffering and set X-Accel-Buffering: no. First-byte lands in the sub-second range, and tool expansion plus file diffs render incrementally.
  > Keywords: `SSE` · `MCP` · `Claude Agent SDK` · `fetch-event-source` · `nginx`
- **用户级沙箱与跨 Pod 状态权威源（Redis + DB 兜底）** (reliability · backend)
  Each session has an isolated sandbox backed by the OpenSandbox SDK. Redis is still the runtime source of truth, and reads call OpenSandbox getInfo to check the sandbox is actually alive. SandboxWarmPoolService is a no-op stub: acquireWarmSandbox always returns null.
  > Keywords: `OpenSandbox` · `Redis` · `getInfo` · `warm-pool stub` · `DB fallback`
- **Git 接口性能优化：合并沙箱命令减少 RTT** (performance · backend)
  Each git endpoint used to run multiple subcommands serially in the sandbox, paying one cross-network round-trip per step. After the rewrite we fold subcommands into one composite command using set -e plus delimiter markers, completed in a single sandbox.exec, with stdout sliced by markers and parsed back in the service layer. The seven git endpoints (including checkpoint) share the same merge logic. We also fixed a consistency bug along the way: untracked files used to make pull report false conflicts.
  > Keywords: `git` · `RTT` · `batch` · `sandbox` · `consistency`
- **H5 预览生命周期与 console 协议演进** (reliability · frontend)
  The iframe preview used to poll 'is it up', with logic scattered across multiple setIntervals and useEffects; on refresh it occasionally hit a race where the old iframe was still alive and a new one had already started. We rewrote it as an explicit state machine: idle → starting → ready / error → refreshing → ready, with all transitions going through the store. Concurrent starts use an inflight token plus AbortController, with a new start aborting the old. postMessage strictly validates origin to block injection. Only when HMR fails do we escalate to a full reload.
  > Keywords: `iframe` · `state-machine` · `postMessage` · `HMR` · `console`
- **上传门禁与部署前易失存储确认** (security · fullstack)
  The upload route checks Origin before parsing a JSON body of up to 1GB, so a disallowed origin cannot force the process to read a huge payload first. Before deploy, the panel reads isEphemeralStorage and opens a confirm dialog with ephemeralReason only when that flag is true. On 2026-09-02 the extra readError gate was removed. feature-whitelist.ts is gone from the current repo.
  > Keywords: `feature-flag` · `whitelist` · `gradual-rollout` · `blast-radius`
- **可观测性：OpenTelemetry + Langfuse 串联 LLM 调用** (observability · backend)
  Debugging LLM flows used to be a black box. We use the OTel Node SDK to open spans on the Express handler, the SSE streamManager, and MCP tool calls, and propagate W3C Trace Context so the LLM-call span attaches to the main trace; Langfuse is the LLM-side backend recording prompt text, token usage, and cost, sharing the trace_id with OTel. OTel attributes only hold scalars like model_name, prompt_tokens, completion_tokens, and duration; large fields such as prompt text go to Langfuse to keep the exporter from being overloaded.
  > Keywords: `OpenTelemetry` · `Langfuse` · `Trace Context` · `LLM trace`


## 🏗️ Architecture (architecture) — 3 Q&A

### Q1. How does your SSE stream resume after a disconnect, and what do the frontend and backend each handle?

> Source: `tp-001` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| SSE 协议规范 | 必须掌握 | 讲不清 Last-Event-ID 与重连，可恢复性故事就塌了 |
| fetch-event-source | 必须掌握 | 面试官会问为什么不用原生 EventSource |
| WebSocket vs SSE | 加分项 | 讲清 trade-off 才能撑住中级以上的追问 |

#### Tiered answers

**🟢 Elevator**: The frontend reconnects with the last seen event ID in the Last-Event-ID header, and the backend resumes from there.

**🔵 Standard** (default):

LLM streams typically run for tens of seconds, and a network blip is enough to drop the connection, so we needed resumable streaming. The backend has two services: streamManager keeps the active stream per session, and resumableStreamService assigns each event a monotonic ID and caches a recent window. The frontend uses fetch-event-source; on disconnect it sends the last seen ID in the Last-Event-ID header and the server resumes from there. The order between tool_use and tool_result is preserved because IDs are assigned producer-side; we did not use the native EventSource because it cannot send custom headers, so auth would not pass.

<details><summary>🔴 Deep dive (click to expand)</summary>

The core idea is to put resumability into the SSE protocol itself, not stack another application protocol on top. streamManager keeps the active stream per session, and resumableStreamService assigns monotonic IDs and keeps a ring buffer as the retransmit window. The frontend does not use the native EventSource — it cannot send custom headers, so auth would not pass. fetch-event-source supports custom headers, Last-Event-ID resume, and abort. On reconnect the frontend sends the last seen ID in the Last-Event-ID header, and the server resumes from there; already-rendered events are not resent. SSE over WebSocket: nearly all events are server-to-client, SSE is one-way and HTTP-compatible so nginx and k8s ingress need no special config, and the recovery model is simpler — no custom heartbeat or reconnect protocol to write. WebSocket would also push backpressure handling onto the application layer. The cost: when the service restarts the ring buffer is gone, and the worst case falls back to re-issuing the whole stream, which the business layer can accept. The frontend pairs this with explicit aborts: on component unmount or before reconnect we abort the old fetch-event-source instance, so stale events do not land on the previous handler. The whole mechanism does not introduce new state storage; the ring buffer is in-memory only, and reconnect state lives entirely in the Last-Event-ID held by the frontend.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] WHATWG HTML Living Standard - Server-Sent Events
  - [ ] MDN: Using Server-Sent Events
- 🛠️ Hands-on
  - [ ] 用 Express 写 30 行 SSE demo，支持 Last-Event-ID 续接
  - [ ] demo 接到本地 nginx 反代后面，验证 X-Accel-Buffering 关闭后流式首字节
- ⚠️ Common pitfalls
  - nginx 默认开启 buffer 导致流不动 → 加 X-Accel-Buffering: no
  - 原生 EventSource 不支持自定义 header（带不了 Authorization）
  - Last-Event-ID 必须服务端分配且单调递增，前端不能自己生成
- 🤔 Self-check questions (answer without notes)
  - [ ] 客户端断了 5 分钟再回来，buffer 已被驱逐，怎么办？
  - [ ] SSE 在 HTTP/2 下有什么注意点？
  - [ ] 为什么不直接用 WebSocket？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why pick SSE over WebSocket?** (trade-off)
  > SSE is one-way, HTTP-native, supports Last-Event-ID natively. Almost all events are server-to-client, so WebSocket would just add heartbeat and backpressure work we don't need.


#### Evidence

- `backagent/src/services/resumableStreamService.ts`
- `backagent/src/services/streamManager.ts`
- `web/src/hooks/useAgent.ts`

---

### Q2. What does the sandbox runtime call today, and is e2b still a selectable backend?

> Source: `tp-003` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 适配器模式 | 必须掌握 | 讲不清接口与实现分离面试官就会怀疑设计能力 |
| Linux 容器隔离 | 必须掌握 | 沙箱底层都基于 cgroup/namespace，要能讲清边界 |
| 供应商可替换性 | 加分项 | 讲清商业 trade-off 是高级方向的加分点 |

#### Tiered answers

**🟢 Elevator**: The runtime uses only the OpenSandbox SDK. e2b remains in comments and is not a second backend.

**🔵 Standard** (default):

sandbox-manager builds its client from the OpenSandbox SDK. getSandboxInfo, listSandboxInfos, and renew are wrapped with timeouts. Metadata is sanitized before write. Redis still stores runtime state, and reads call OpenSandbox getInfo to correct expiry. There is no e2b SDK import left, only comments in error classification and an old port-map field. Describe the runtime as already consolidated, not as a two-backend switch.

<details><summary>🔴 Deep dive (click to expand)</summary>

The runtime calls only OpenSandbox. sandbox-manager creates the client from the SDK. getSandboxInfo, listSandboxInfos, and renew have timeouts. Metadata is sanitized before write. Redis expiry can lag the platform, so reads call getInfo and correct it. e2b appears only in a comment in sandbox-errors.ts and in a leftover e2b.dev port example. Neither means e2b is still selectable. acquireWarmSandbox always returns null, so the in-process pool is also out of this path. If asked why there used to be two backends, describe that as retired history.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] e2b 官方文档 - Sandbox 概念与生命周期
  - [ ] Linux man-pages: namespaces(7) 与 cgroups(7)
- 🛠️ Hands-on
  - [ ] 用 docker exec 包一个最小沙箱接口，支持 exec / read / write 三件事
  - [ ] 把同一段业务代码挂到两个 docker 实例上，跑一遍灰度切换
- ⚠️ Common pitfalls
  - 抽象接口塞太多（试图统一所有后端的奇异能力），结果哪边都不舒服
  - 忘了 destroy 资源，长跑后实例数爆炸
  - exec 没有限制并发，用户可以轻松打满后端
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果有一天必须支持第三个沙箱后端，你的接口能不能扛住？
  - [ ] 怎么处理两个后端实现行为细微不一致（比如 exit code 语义）？
  - [ ] Coordinator 路由策略怎么避免雪崩？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not just use Docker directly instead of building this layer?** (trade-off)
  > Docker is single-node. The current runtime delegates cross-host sandboxes to OpenSandbox. This repo no longer wraps an e2b adapter, and this process no longer keeps a warm pool.


#### Evidence

- `backagent/src/services/sandbox-manager.service.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q3. How do useAgent and useFileSync divide responsibility, and why split them into two hooks instead of one?

> Source: `tp-010` · scope: frontend · web · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Hook 单一职责 | 必须掌握 | 面试官一定会问拆分依据 |
| Zustand selector / slice | 必须掌握 | store 隔离的具体落地 |
| 依赖方向设计 | 加分项 | 讲清单向依赖能体现架构思维 |

#### Tiered answers

**🟢 Elevator**: useAgent owns SSE subscription and the message flow; useFileSync owns file state and editor sync — split by data lifecycle.

**🔵 Standard** (default):

The split comes from different data lifecycles. useAgent handles SSE subscription, message accumulation, and tool_use / tool_result dispatch for a session — event-stream semantics. useFileSync handles syncing tool-modified files into the local editor, diff comparison, and coordinating concurrent file updates — persistent-state semantics. They decouple via the store: useAgent writes file-related events into the store, and useFileSync subscribes to store changes to drive editor operations. useAgent stays editor-agnostic, useFileSync stays SSE-agnostic, both unit-test cleanly on their own, and iterating on one does not drag the other along.

<details><summary>🔴 Deep dive (click to expand)</summary>

The key criterion for splitting is 'is the dependency direction one-way'. useAgent depends on the SSE protocol and event parsing; useFileSync depends on editor APIs and file diffing. Merging them produces 'edit one hook, need to understand the other' coupling. So shared data lives in the Zustand store — messages, files, active session — and each hook reads only the slice it cares about, and writes only the fields it owns. Concrete benefit: when the backend bumps the SSE event protocol (a tool_result field shift, for example), only useAgent's parser changes; useFileSync is untouched. The other direction, upgrading CodeMirror from 5 to 6, only touches useFileSync. The cost is that once you split, the store schema becomes an implicit contract, so TypeScript types have to hold the line and schema evolution requires type-driven changes on both sides. The upside is clean unit tests, easier debugging, and parallel changes — useAgent tests can mock SSE events directly, useFileSync tests can mock the store directly. Early on useAgent called editor APIs directly, and a CodeMirror version bump turned into a several-hundred-line change in one hook, which is why we introduced the store layer. The general principle is splitting by change frequency and dependency direction, not by line count — the former saves real maintenance cost, the latter just looks neat. After the split, the two hooks' commit histories also reflect the division: useAgent changes mostly land during protocol upgrade windows, useFileSync changes land around editor upgrades and concurrent file scenarios, with almost no overlap.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] React 官方文档 - Custom Hooks 章节
  - [ ] Dan Abramov - 'Why Do React Hooks Rely on Call Order?'
- 🛠️ Hands-on
  - [ ] 把一个混做 fetch + 表单 + 校验的 hook 按数据生命周期拆成 3 个 hook
  - [ ] 用 Zustand 实现两个 hook 的 store 隔离，写最小单测
- ⚠️ Common pitfalls
  - 按文件长度拆 hook，但依赖方向是双向的，越拆越乱
  - store 不写类型，hook 之间靠默契传字段
  - useEffect 的依赖数组漏字段，state 切换时 hook 不重订阅
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 useAgent 和 useFileSync 共享一份 inflight 状态怎么办？
  - [ ] 怎么避免两个 hook 都触发同一个副作用？
  - [ ] 测 useAgent 时 SSE 怎么 mock？
- ⏱️ Estimated time: **半天**


#### Evidence

- `web/src/hooks/useAgent.ts`
- `web/src/hooks/useFileSync.ts`

---

## 🧩 Feature (feature) — 3 Q&A

### Q1. How do you expose tool capabilities to the Claude Agent, and what role does MCP play in the loop?

> Source: `tp-002` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| MCP 协议核心 | 必须掌握 | 不懂 MCP 注册流程就讲不清工具如何被 LLM 看到 |
| Tool-use 协议 | 必须掌握 | 面试官会问 tool_use / tool_result 的事件结构 |
| 错误归一化模式 | 加分项 | 讲到错误层能体现工程化能力 |

#### Tiered answers

**🟢 Elevator**: Tools — git, sandbox commands, file IO, deploy — register with the Agent through an MCP catalog; the Agent emits tool_use, the framework dispatches to the catalog, and results come back as tool_result.

**🔵 Standard** (default):

We use the Claude Agent SDK for LLM orchestration, and tools — git, sandbox commands, file IO, deploy — register through mcp-catalog.service. Each tool exposes a name, an input schema in JSON Schema, and a handler. When the Agent decides which tool to call it emits a tool_use message; the framework routes by name to the handler in the catalog and the result comes back as a tool_result. On the frontend, useAgent listens on SSE and renders tool_use and tool_result as separate chunks, so tool name, argument diff, and result render incrementally. The benefit of this layer is decoupling tools from the Agent: adding a new tool only requires registering it in the catalog, with no changes to the Agent's main flow.

<details><summary>🔴 Deep dive (click to expand)</summary>

MCP acts as the unified registration bus between tools and the Agent. At startup mcp-catalog.service registers every tool, and each tool's schema is exposed directly to the LLM, so the LLM sees a clear catalog: 'these are the tools I can call, here is what each tool expects'. The Agent SDK handles protocol handshake, message serialization, and tool_use routing. Our work sits at the two ends: in the catalog, each tool's handler is wrapped as an MCP-compliant callable, with inputs validated against its JSON Schema before reaching the handler; the output is wrapped into a uniform tool_result. On the frontend, useAgent listens on SSE and splits tool_use and tool_result into separate render branches — tool_use shows the tool name plus the argument diff, tool_result shows the structured result, and the two events are linked by a shared tool_call_id. Why MCP rather than direct function calls: first, the tool list is visible to the LLM so adding a tool needs no prompt change; second, schema-validation failures can be rejected without polluting Agent context; third, one catalog can serve multiple LLM backends, so a future switch does not touch business code. The cost is one serialization round per tool call; for very high-frequency tools that would matter, but our tool call rate is bounded by LLM thinking speed, so the cost is negligible in practice.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Anthropic - Model Context Protocol 官方文档
  - [ ] Anthropic - Tool use API reference
- 🛠️ Hands-on
  - [ ] 用 MCP SDK 写最小 server，暴露 read_file / write_file 两个工具，接到 Claude Desktop 验证
  - [ ] 在现有项目给 mcp-catalog 加一个新工具（如 list_dir），跑通 tool_use → tool_result
- ⚠️ Common pitfalls
  - 把内部错误堆栈直接丢回 LLM，LLM 会复述给用户
  - 工具 schema 漏字段，LLM 反复尝试错误参数浪费 token
  - 工具调用没加超时，长跑工具拖死整条 Agent
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不直接用 Anthropic 的 tool-use API，要加一层 MCP？
  - [ ] 如果一个工具调用要跑 30s，怎么把进度反馈给前端？
  - [ ] 工具的输入 schema 怎么和工具实现保持同步？
- ⏱️ Estimated time: **1–2 天**


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `web/src/hooks/useAgent.ts`

---

### Q2. From the sandbox build artifact to a reachable subdomain — what does the path actually look like?

> Source: `tp-008` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| vite base / publicPath | 必须掌握 | 子路径部署的 90% 故障都是这里 |
| 反向代理 host/path | 必须掌握 | 讲不清子域名映射就讲不清整条链路 |
| 构建产物路径无关性 | 加分项 | 理解为什么不能写死绝对路径 |

#### Tiered answers

**🟢 Elevator**: The sandbox builds a dist, deploy-proxy mounts it onto a subdomain composed of user-id plus a project hash, a reverse proxy exposes it, and at deploy time vite base is rewritten by subpath.

**🔵 Standard** (default):

When the user clicks deploy, sandbox-deploy runs the build inside the sandbox and the dist sits there. Then deploy-proxy mounts that dist onto a subdomain — we build the subdomain from user-id plus a project hash — and a reverse proxy exposes it. The gotcha: vite's default base is '/', which mostly works on a subdomain, but root-relative assets (like /assets/...) break the moment the proxy path does not match. So at deploy time we force vite's base to '/' or the right subpath and patch the HTML accordingly. On the frontend, DeployTabPanel handles deploy status, the error panel, and hands the final subdomain link to the user.

<details><summary>🔴 Deep dive (click to expand)</summary>

The hard part on this path is cross-boundary state alignment — the sandbox, deploy-proxy, and frontend UI all need to agree on the same facts: did this deploy succeed, where is the artifact, what is the user URL. We split deploy into a few states — building, built, proxied, served, failed — each persisted in sandbox-state, with the frontend subscribing via SSE for live updates. Vite base rewriting is unavoidable: at build time the sandbox does not know which subdomain it will end up on, so the artifact has to be path-agnostic — either fully relative or post-processed. We tried fully relative first, but vite's generated chunk refs are absolute /assets/... and making everything relative was costly and error-prone, so we landed on 'build with an absolute placeholder, rewrite the HTML entry by subpath at deploy time'. The cost is clear — rewriting adds a few hundred ms post-processing per deploy, but any subdomain loads correctly. On error surfacing, an early version had no error panel, so a failed deploy looked like an endless spinner and debugging was slow. After we made DeployTabPanel show the last few lines of build stderr plus a runtime error panel (the iframe's console.error piped back via postMessage with strict origin check), debug time dropped immediately. On subdomain naming, user-id plus project hash means repeated deploys of the same project land on the same subdomain, which is CDN- and browser-cache-friendly, and avoids burning random reverse-proxy routing entries. On security, the postMessage channel requires origin to match the subdomain exactly, so a hostile script inside the iframe cannot fake error messages that affect the main app.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Vite 官方文档 - Public Base Path
  - [ ] nginx proxy_pass 与 sub_filter 章节
- 🛠️ Hands-on
  - [ ] 用一个 vite 项目 build 出 dist，挂到 nginx 的子路径下，修复 /assets 加载问题
  - [ ] 给 deploy 加一个简单的 stderr tail 面板，故意制造 build 失败验证显示
- ⚠️ Common pitfalls
  - vite base 没设导致 /assets 404
  - HTML 入口没 rewrite，相对路径在某些子路径下错乱
  - deploy 状态没区分 build / proxy / serve，前端 UI 误显示成功
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果用户的项目是 SPA + history 路由，deploy 之后刷新 404 怎么处理？
  - [ ] 怎么区分 build 失败和 runtime 失败？两边的错误面板有什么不同？
  - [ ] 子域名命名怎么避免冲突和被猜出来？
- ⏱️ Estimated time: **1–2 天**


#### Evidence

- `backagent/src/services/build-preview/sandbox-deploy.service.ts`
- `backagent/src/services/build-preview/deploy-proxy.service.ts`
- `web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

### Q3. What kinds of endpoints does your Express layer expose, and how does an SSE endpoint differ from a regular REST one at the routing layer?

> Source: `tp-012` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Express middleware 模型 | 必须掌握 | 讲不清 next() 和 res 生命周期就讲不清 SSE 处理 |
| HTTP 长连接 keepalive | 必须掌握 | 中间代理切断连接的根因都在这 |
| SSE 错误协议 | 加分项 | 讲清 statusCode 锁定后怎么报错是细节加分 |

#### Tiered answers

**🟢 Elevator**: REST handles session, sandbox, git, and deploy; SSE carries the Agent's streaming response; SSE endpoints disable buffering, set keepalive, and inject trace context.

**🔵 Standard** (default):

routes.ts roughly has two kinds. First, plain REST — session CRUD, sandbox start/stop, git ops, deploy triggers — standard JSON request and response. Second, SSE — the Agent's main message stream and preview status push — long connections, chunked output. SSE endpoints specifically do a few things: set Content-Type: text/event-stream plus Cache-Control: no-cache, add X-Accel-Buffering: no (so nginx does not buffer), send keepalive comment lines periodically (so intermediaries do not time out), and at handler entry manually open an OTel span so streamManager downstream gets the trace context. For errors, SSE cannot just res.status(500) like REST — it has to emit an error event then close, so the frontend can tell 'real error' from 'network blip'.

<details><summary>🔴 Deep dive (click to expand)</summary>

SSE adds several details over plain REST in the routing layer. First, headers — Content-Type: text/event-stream, Cache-Control: no-cache, X-Accel-Buffering: no (specifically for nginx), Connection: keep-alive — every one of those required. Early on we missed X-Accel-Buffering, production nginx buffered the whole stream, and the frontend waited tens of seconds for the first event; since then we keep this header fixed in the SSE handler init snippet. Second, keepalive — send a `:` comment line every 15s or so, otherwise intermediaries like k8s ingress, nginx, and client proxies cut the connection on idle timeout; the keepalive interval is set one tick below the shortest idle timeout among intermediaries. Third, trace injection — an Express middleware pulls traceparent into OTel context, but streamManager is async, so the handler has to synchronously open a long-running span and pass the context explicitly; otherwise downstream LLM calls do not get the right trace_id. Fourth, error protocol — SSE's statusCode locks the moment the first byte goes out, so res.status(500) does nothing afterward. Errors have to follow the event format, an `event: error\ndata: {...}` line then close, and the frontend useAgent can tell 'real error' from 'network blip'. Where is the trade-off: extracting SSE plumbing into middleware is cleaner but invades the response API, so we kept 'each SSE handler does header plus keepalive bootstrap inline' — a few duplicated lines, very readable. If SSE endpoints exceed ten we will revisit. SSE endpoints are the platform's protocol core; getting these details right at the routing layer lets downstream business logic focus on streaming semantics. The actual writes go through Express's res.write, so backpressure is handled by Node's stream module; business code just assembles the event-protocol strings and does not write its own flow control.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Express 官方文档 - Routing 与 Middleware
  - [ ] MDN: Server-Sent Events 与 Connection 头部
- 🛠️ Hands-on
  - [ ] 写一个 SSE 端点，故意挂在 nginx 后面观察 X-Accel-Buffering 的影响
  - [ ] 在 SSE 端点里手动注入 OTel span，验证下游 LLM 调用能拿到 trace_id
- ⚠️ Common pitfalls
  - 漏 X-Accel-Buffering: no 导致 nginx 缓住整条流
  - 没发 keepalive 导致中间代理空闲超时切断
  - 出错时直接 res.status(500)，前端拿到的不是 error 事件而是协议错位
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果同一用户开两个 tab 都连了 SSE，后端怎么区分和管理？
  - [ ] SSE 端点压测时怎么模拟真实长连接？
  - [ ] Express 处理 SSE vs Fastify 有什么差异？
- ⏱️ Estimated time: **1–2 天**


#### Evidence

- `backagent/src/api/routes.ts`

---

## ⚡ Performance (performance) — 2 Q&A

### Q1. Does the in-process warm pool still cut cold start, and what does that class do now?

> Source: `tp-004` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 对象池模式 | 必须掌握 | warm pool 本质是对象池，讲不清模式就讲不清细节 |
| 分层镜像/初始化 | 必须掌握 | 速度提升的最大来源就是这一招 |
| 动态扩缩策略 | 加分项 | 讲清成本控制能体现高级思维 |

#### Tiered answers

**🟢 Elevator**: SandboxWarmPoolService is a no-op. acquireWarmSandbox always returns null, and pooling is handled by OpenSandbox.

**🔵 Standard** (default):

The class comment in sandbox-warm-pool.service.ts says it is a no-op stub. initialize only logs that the pool is disabled, acquireWarmSandbox returns null, and getPoolStatus returns an empty pool. Callers still compile, but they never receive a local warm instance. sandbox-proxy.service.ts is gone. If first preview is slow, look at OpenSandbox create and getInfo. Do not reuse the old ten-seconds-to-one-second number.

<details><summary>🔴 Deep dive (click to expand)</summary>

The class comment says warm pooling is now handled server-side by OpenSandbox. This class only keeps the old API compiling. initialize logs and returns, acquireWarmSandbox creates nothing, and getPoolStatus reports enabled, poolSize, and available as empty, with hitRate 0. Do not describe daytime scale-up, nighttime scale-down, or a hit rate. sandbox-proxy.service.ts is deleted. If /health/warm-pool is still mounted, it reports this empty status. When cold start is slow, look at OpenSandbox create, getInfo timeouts, and Redis state. Do not invent a server-side pool hit rate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Apache Commons Pool - 设计文档（对象池经典实现）
  - [ ] Cloudflare 工程博客 - 关于 isolate 与 warm 实例的文章
- 🛠️ Hands-on
  - [ ] 本地用 docker 实现一个小型 warm pool（5 个实例），测对比冷启动 vs 池命中的耗时
  - [ ] 给池加「使用 N 次后销毁」策略，跑一晚上看资源是否不再上涨
- ⚠️ Common pitfalls
  - 实例不定期销毁导致系统资源（inode、句柄）累积
  - 池大小固定不随负载变化，要么浪费要么扛不住
  - 亲和性策略让同一坏实例反复服务同一用户，故障集中
- 🤔 Self-check questions (answer without notes)
  - [ ] 池子怎么探活？怎么判断实例已经不健康要销毁？
  - [ ] 如果突发流量翻倍，池没扩起来怎么办？
  - [ ] 池命中率多少算正常？太高代表什么问题？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If 99% of requests hit the pool, how do you handle the 1% that miss?** (reliability)
  > The in-process pool never hits. acquireWarmSandbox always returns null, and creation goes straight to OpenSandbox. Do not answer with the old hit-rate or refill story.


#### Evidence

- `backagent/src/services/sandbox-warm-pool.service.ts`

---

### Q2. How exactly did you batch the git subcommands? How does something like status + add + commit become a single call?

> Source: `tp-006` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| git plumbing 命令 | 必须掌握 | 讲不清 plumbing/porcelain 区别就讲不清合并的可解析性 |
| shell set -e / pipefail | 必须掌握 | 复合命令的失败传播全靠这俩 |
| git stash -u 语义 | 加分项 | 失败教训对应的细节，能体现工程深度 |

#### Tiered answers

**🟢 Elevator**: We fold multiple git subcommands into one composite command with set -e plus delimiter markers, run it in one call, and slice stdout by the markers.

**🔵 Standard** (default):

Each git endpoint used to run multiple subcommands serially in the sandbox — status, add, commit and so on — paying one cross-network round-trip per step. After the rewrite we fold subcommands into one composite command using set -e plus ASCII delimiter markers, completed in a single sandbox.exec, and the service slices stdout by the markers so each slice maps to one subcommand's output, with errors pointing precisely to which step failed. The seven git endpoints (including checkpoint) share the same merge logic. We also fixed a consistency bug: untracked files used to make pull report false conflicts, so we now stash -u before pull and stash pop after, keeping user-side temp files intact.

<details><summary>🔴 Deep dive (click to expand)</summary>

What this optimization does is collapse N cross-network round-trips into one. Several details matter on the way down. First, shell pipeline reliability — we use set -e so any subcommand failure aborts immediately, which keeps us out of states like 'the first few steps succeeded but the commit failed, leaving the repo half-dead.' Second, parsable output — between steps we inject ASCII delimiters (characters that will not show up in git output), the service slices stdout by them, and each slice maps to one subcommand's output, so errors point exactly to which step failed. Third, idempotency — before merging we audited each step to make sure reruns do not corrupt state (allow-empty commits become explicit, and so on). Trade-off, a real one: after merging, debugging gets harder, since you cannot dry-run an individual step in isolation. So we kept an 'expand mode' for development that runs the steps one at a time. We did hit a consistency issue along the way: untracked files faking pull conflicts. The old logic was, before pull, run git status to check dirtiness, but untracked counts as dirty, so it got misread as a conflict. The fix is stash -u (including untracked) before pull, then stash pop after, so user-side temp files do not get lost. Why not use libgit2 inside the main process and skip the sandbox round-trip entirely: the workspace lives inside the user's sandbox — files, config, credentials all in that namespace — and running libgit2 in the main process would break isolation and cut us off from sandbox-scoped git credentials. End result: git operation P95 improved substantially, and because the segmented parser is strict, error localization is actually more precise than before the merge.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Pro Git book - 第 10 章 Git Internals
  - [ ] git-stash(1) man page
- 🛠️ Hands-on
  - [ ] 写一个脚本，把 status + add + commit 合并成一条 set -e 命令，输出按分隔符切片
  - [ ] 构造一个有 untracked 文件的仓库跑 pull，复现 stash -u / pop 的修复
- ⚠️ Common pitfalls
  - 复合命令忘开 set -e，前面失败后续还在跑
  - 用 echo / printf 当分隔符不够安全，git 输出可能含同样字符
  - stash 的 -u 缺失，导致 untracked 文件被丢
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果合并命令中的某一步偶发失败，你怎么定位是哪步？
  - [ ] 为什么不直接用 libgit2 而是 shell git？
  - [ ] checkpoint（保存点）功能是怎么基于 git 实现的？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not use libgit2 inside the process to avoid the sandbox round-trip entirely?** (trade-off)
  > The workspace lives in the user's sandbox — files, config, and credentials all in that namespace. Running libgit2 in the main process would break isolation and cut us off from sandbox-scoped git credentials, with overall cost higher than the round-trip we would save.


#### Evidence

- `backagent/src/services/git-sandbox.service.ts`
- `backagent/src/services/git-woa.service.ts`
- `backagent/src/services/checkpoint-git.service.ts`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. With Redis as source of truth and DB as fallback, what happens when Redis goes down or the two diverge?

> Source: `tp-005` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 缓存一致性模型 | 必须掌握 | Cache-aside / Write-through 的差异讲不清面试官会停手 |
| Redis 故障与降级 | 必须掌握 | 面试官一定会问 Redis 挂了怎么办 |
| 异步双写与队列 | 加分项 | 讲清 DB 异步路径的可靠性能加分 |

#### Tiered answers

**🟢 Elevator**: Reads and writes prefer Redis; on failure we fall back to the DB; writes go to both async, and on restart we rebuild Redis from the DB.

**🔵 Standard** (default):

Our state model is 'hot path in Redis, truth in the DB'. sandbox-state.repository exposes a unified get/set; internally it tries Redis first, falls back to the DB on miss or unavailability, and backfills Redis on hit. Writes go to Redis synchronously and to the DB asynchronously with retries, so Redis is always the freshest. The coordinator consumes this repository too, so Redis failures degrade automatically without business code knowing. On a pod restart we do not rely on Redis cache; the DB rebuilds it, so restart is not a risky operation.

<details><summary>🔴 Deep dive (click to expand)</summary>

'Redis primary' does not mean 'the DB is useless'; it means Redis is the authoritative source on the hot path. The consistency model: writes are double-written (Redis sync, DB async with retries plus a queue); reads try Redis then DB; cache invalidation uses TTL plus active invalidation as a belt-and-suspenders. A Redis outage triggers two reactions: the repository switches reads to the DB internally with a degraded flag, alerts fire, and writes still try both — but a Redis write error does not block business; the DB async path is the eventual safety net. The trickiest case is Redis data being corrupted; for critical keys we attach a schema and a version, and on detection we evict immediately and rebuild from the DB. We picked Redis primary over DB primary because sandbox state has very high read and write frequency — every SSE event updates a heartbeat and progress — and a single DB cannot keep up; Redis hits in sub-millisecond reads while the DB only carries load on failure or rebuild, which is a better latency and reliability trade overall. The cost is that we have to handle Redis-failure degradation, so the DB has to be a real fallback, not just a cache backup. We did hit one Redis primary-replica split where a small number of sessions had mismatched state; after that we added a read-time check in the coordinator — compare actual sandbox state with the Redis record, and on disagreement rewrite from actual. The design lets us keep Redis latency while not losing business continuity on failures.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Redis 官方文档 - Persistence 与 Replication 章节
  - [ ] Martin Kleppmann《Designing Data-Intensive Applications》第 5 章 Replication
- 🛠️ Hands-on
  - [ ] 用 ioredis 写一个 cache-aside 包装器，实现 Redis miss 自动从 Postgres 回填
  - [ ] 故意 kill 掉 Redis 一段时间，看降级路径是否正确触发
- ⚠️ Common pitfalls
  - 把 Redis 当唯一存储，重启 / 故障数据全丢
  - DB 异步落地没有重试和死信，Redis 一直比 DB 新
  - 缓存失效只用 TTL，更新场景下脏读窗口很长
- 🤔 Self-check questions (answer without notes)
  - [ ] 怎么定义你的一致性级别？强一致还是最终一致？
  - [ ] Redis 主从切换时会有什么风险？
  - [ ] 为什么不直接 DB 主，把 Redis 当 cache？
- ⏱️ Estimated time: **1 周**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why Redis primary plus DB fallback rather than DB primary with Redis as a simple cache?** (trade-off)
  > Sandbox state is read and written constantly; the DB alone can't deliver the latency. Redis primary gives sub-millisecond reads, and the DB only takes load during failures or rebuilds — better latency and reliability per unit cost.


#### Evidence

- `backagent/src/services/sandbox-state.repository.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q2. When you rewrote the H5 preview from polling into a state machine, which edge cases did you nail down?

> Source: `tp-009` · scope: frontend · web · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 状态机/有限状态自动机 | 必须掌握 | 讲不清状态与转移就讲不清重构动机 |
| postMessage origin 校验 | 必须掌握 | iframe 通信安全的第一道关 |
| AbortController 取消语义 | 加分项 | 并发保护的标准答案 |

#### Tiered answers

**🟢 Elevator**: Split start, ready, error, refresh, and destroy into explicit states; protect concurrent starts; strictly check postMessage origin.

**🔵 Standard** (default):

The old iframe preview was basically polling 'is it up'. State was scattered across setInterval and useEffect, and on refresh you'd sometimes hit a race where the old iframe was still alive and a new one had already started. After the rewrite, usePreviewStore is an explicit state machine — idle → starting → ready / error → refreshing → ready — and every transition goes through the store. Concurrent starts are protected by an inflight token plus AbortController, with a new start aborting the old. The postMessage listener strictly checks origin to block injection. For HMR, useH5PreviewRefresh reacts to file changes and updates incrementally rather than forcing a full reload; full reload only happens when HMR fails. After the rewrite the preview-startup races stopped showing up.

<details><summary>🔴 Deep dive (click to expand)</summary>

A state machine's value is turning implicit timing into explicit transitions. A few edge cases worth calling out. First, concurrent starts: a user double-clicking refresh, or rapid code changes triggering multiple starts — the old starting promise has not resolved when a new one arrives. usePreviewStore uses an inflight token plus AbortController, so a new start aborts the old one, and ready events do not land on the wrong iframe. Second, origin checks: the preview URL loaded into the iframe is on the user's subdomain, and postMessage's source must match that subdomain exactly — not `*` and not `parent.origin` style loose config — otherwise a hostile page could forge preview events. Third, HMR awareness: the backend h5-preview.service pushes file changes, and the frontend useH5PreviewRefresh maps them onto the iframe's HMR channel; we update incrementally when possible, and escalate to full reload only when HMR fails (for example, the entry file structure changed). Fourth, error flow-back: runtime errors inside the iframe come back over postMessage, carrying frame id and origin so errors from different sessions do not get mixed up. Trade-off — a state machine adds code, but debugging cost drops; you read the store's current state rather than reverse-engineering it from a pile of setIntervals. Without the inflight guard early on, double-clicking 'restart' could leave 'displayed as ready but actually still the old iframe' in an inconsistent state, so all async interactions now follow a 'latest-wins' semantic uniformly. The state machine also makes unit tests cleaner — test cases enumerate transitions, which gives better coverage than the original logic spread across useEffects.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] MDN: Window.postMessage 与 origin 安全部分
  - [ ] XState 文档 - Statecharts in 15 Minutes（状态机思维入门）
- 🛠️ Hands-on
  - [ ] 把一个含三个 setInterval + 多 useEffect 的小组件重构成 useReducer 状态机
  - [ ] 写一个 iframe 预览 demo，加 origin 校验和 inflight token 保护
- ⚠️ Common pitfalls
  - postMessage 用 `*` 或不校验 origin，等于把 iframe 当不可信源
  - 并发启动没有取消老任务，老的 ready 事件覆盖新状态
  - HMR 失败时不降级到 full reload，预览静默不更新
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 HMR 频繁失败，你怎么定位是 vite 还是网络的问题？
  - [ ] 状态机的转移用 reducer 还是单独的 action 函数？为什么？
  - [ ] iframe 内的 console.error 是怎么收集回主控台的？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not use a library like XState instead of rolling your own in the store?** (trade-off)
  > Just 5 states and simple transitions — XState would add bundle size and mental overhead for no real gain. If states grew past ten or we needed parallel regions, we'd revisit.


#### Evidence

- `web/src/pages/Chat/components/preview/H5Preview.tsx`
- `web/src/hooks/useH5PreviewRefresh.ts`
- `web/src/stores/usePreviewStore.ts`
- `backagent/src/services/h5-preview.service.ts`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. How do OpenTelemetry and Langfuse stitch LLM calls into one distributed trace, and where do LLM-specific metrics like token usage land?

> Source: `tp-011` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| W3C Trace Context | 必须掌握 | 讲不清 trace_id / span_id 传播就讲不清串联 |
| OTel Span / Attribute | 必须掌握 | 为什么 prompt 不该进 attribute 是关键 trade-off |
| LLM 可观测性指标 | 加分项 | 讲清 token / cost / latency 三件套是 LLM 工程加分点 |

#### Tiered answers

**🟢 Elevator**: OTel uses W3C Trace Context to hook LLM calls onto the main trace; Langfuse catches the LLM-specific stuff like prompt and tokens.

**🔵 Standard** (default):

A general-purpose trace system has no native concept for LLM calls — prompt, token, tool calls all look like a black box. We use the OTel Node SDK to open spans on the Express handler, SSE streamManager, and MCP tool calls, and propagate W3C Trace Context so the LLM-call span hooks in too. Langfuse is a separate backend for LLM-specific signals, recording prompt text, token usage, and cost, also keyed by a trace_id linked to the OTel trace. End result: one user request from click to LLM token shows full timing in OTel, and if you want prompt-level detail it is one click away in Langfuse using the same trace_id. The shared trace_id between the two backends is what lets the debugging path connect across systems.

<details><summary>🔴 Deep dive (click to expand)</summary>

Hooking LLM into distributed tracing is hard for two reasons: which span does the LLM call belong to, and where do non-standard fields like prompt and tokens live. We do it in four steps. First, every entry point — Express handler, SSE long connection, tool handler — opens an OTel span, and before we make an LLM call we pull the trace_id from the current context and pass it to the Langfuse client, so both backends key on the same trace_id. Second, prompt text, token usage, and cost do not go into OTel attributes (attributes have length limits and are not built for long text); they go to Langfuse. OTel only records key scalars — model_name, prompt_tokens, completion_tokens, duration — good for aggregation and alerts. Third, secret redaction happens before writing to Langfuse, so we do not leak API keys via prompt; the redaction rules are a single regex table, matched tokens get replaced with placeholders, and the table is updated as new credential sources are added. Fourth, when the OTel collector is briefly unreachable the SDK has its own in-memory buffer and retry, and the Langfuse client has a local queue, so data points do not drop. About the trade-off — two backends mean two SDKs and two bills, but OTel handles full-stack debugging while Langfuse handles LLM-specific observability, and trying to make one system cover both gives you neither. Early on we put full prompts into OTel attributes, exporters got overloaded, and sampling had to be dropped; the fix was moving big text to Langfuse and leaving OTel scalars only, after which export volume returned to a healthy level. Now triage flows as 'OTel for which step is slow or failing, Langfuse for prompt detail'. The cost is that alert rules live on both sides — OTel for slowness and error rate, Langfuse for token-volume spikes and cost anomalies — and a unified service view has to be assembled at the dashboard layer.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OpenTelemetry 官方文档 - Trace Context Propagation
  - [ ] Langfuse 官方文档 - Tracing 与 OpenTelemetry 集成
- 🛠️ Hands-on
  - [ ] 在一个 Express + Anthropic SDK 的小项目里接入 OTel + Langfuse，验证两边 trace_id 一致
  - [ ] 故意让某次 LLM 调用超时，从 trace 里定位卡在哪一步
- ⚠️ Common pitfalls
  - 把整段 prompt 塞 OTel attribute，导致 exporter 流量爆炸
  - trace_id 透传断在某一层，导致 LLM span 不在主 trace 下
  - prompt 落 Langfuse 前忘了脱敏，API key / token 被记录
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 OTel collector 暂时不可达，trace 数据怎么办？
  - [ ] 怎么决定哪些字段进 OTel、哪些进 Langfuse？
  - [ ] 采样率怎么设？高流量场景怎么不丢关键 trace？
- ⏱️ Estimated time: **1–2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not just use Langfuse as the trace backend and skip OTel?** (trade-off)
  > Langfuse is purpose-built for LLM and only thinly supports non-LLM spans (DB, Redis, sandbox). OTel is the industry standard and connects to all existing infrastructure — letting each tool do what it's good at is the cheaper path.


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `backagent/src/services/streamManager.ts`

---

## 🔒 Security (security) — 1 Q&A

### Q1. On upload and deploy, how do you stop a huge request from occupying memory, and stop an ephemeral project from being published without a warning?

> Source: `tp-007` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Feature flag 模式 | 必须掌握 | 讲不清 release toggle / ops toggle 区别就讲不清这套发布 |
| Blast radius 思维 | 必须掌握 | 中级以上必须能解释为什么不全量 |
| 前后端权限分层 | 加分项 | 讲清「前端只是 UI 隐藏」是体现安全意识的关键 |

#### Tiered answers

**🟢 Elevator**: Upload checks Origin before parsing the body. Deploy asks for confirmation only when isEphemeralStorage is true.

**🔵 Standard** (default):

user-upload.routes.ts runs the Origin check before express.json. The body limit is 1GB, so parsing first would let a disallowed origin occupy memory. A missing Origin is treated as an in-cluster call and allowed. DeployTabPanel opens the confirm dialog with ephemeralReason only when isEphemeralStorage is true. On 2026-09-02 the extra readError gate was removed. feature-whitelist.ts and the pod-memory dual-state UI are gone.

<details><summary>🔴 Deep dive (click to expand)</summary>

Upload is rejected before the body is parsed. The comment in user-upload.routes.ts says the Origin check must run first, otherwise a disallowed origin can still force a huge JSON parse. The middleware calls assertUploadOriginAllowed, then express.json with a 1GB limit. A missing Origin is treated as an in-cluster call. On deploy, executeAgentDeploy calls getStoragePreflight. The dialog opens only when isEphemeralStorage === true and shows ephemeralReason. The comment still mentions readError, but the condition no longer does. feature-whitelist.ts is not in the current repo, and the pod-memory dual state should not be described as current.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Martin Fowler - Feature Toggles 文章
  - [ ] OWASP Cheat Sheet - Authorization 章节
- 🛠️ Hands-on
  - [ ] 在小 Express 项目里实现「白名单 + feature flag」双闸门，前端按 flag 隐藏入口、后端按白名单拒绝请求
  - [ ] 为某个表单字段做双态 UI，对比改造前后用户的困惑度
- ⚠️ Common pitfalls
  - 只在前端做 flag 判断，浏览器一改就绕过
  - feature flag 上线后没清理，长期堆成几百个开关
  - 灰度数据没采集，发布完不知道效果
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果用户改 flag 绕过前端，你怎么防？
  - [ ] 灰度发布到一定比例之后下一步怎么走？
  - [ ] feature flag 怎么不变成屎山？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why a dual-state UI instead of just showing the new value after save?** (trade-off)
  > A knob like pod memory only takes effect after a deploy restart. A single-state UI makes users think 'I changed it, done'; dual-state explicitly shows 'saved vs running', so users do not miss the case where the change has not taken effect yet.


#### Evidence

- `backagent/src/api/routes/user-upload.routes.ts`
- `web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

