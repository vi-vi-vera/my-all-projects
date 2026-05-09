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

QPilot Code Agent is an enterprise AI coding assistant. The backend exposes SSE streams via Express plus the Claude Agent SDK and MCP; the frontend is React 18 with Zustand and Sandpack. Every session gets an isolated sandbox (e2b or in-house OpenSandbox), with Redis as source of truth for cross-pod state and the database as fallback. The preview path uses an H5 state machine plus subdomain vite-base rewriting to bridge sandbox builds to reachable pages. OpenTelemetry plus Langfuse fold LLM prompt and tool usage into one distributed trace, aiming for production-grade reliability.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

QPilot Code Agent pushes AI coding from demo to a graduated, real product. The frontend uses fetch-event-source for SSE and renders tool_use and tool_result chunks separately, with nginx X-Accel-Buffering tuned so first-byte streaming is stable. The backend builds on the Claude Agent SDK plus MCP, registering git ops, sandbox commands, file IO and deploy through an MCP catalog so the Agent dispatches them. The sandbox layer abstracts e2b and in-house OpenSandbox; SandboxManager and a coordinator hide the differences, and a warm pool plus affinity routing turn first-preview cold start into sub-second startup. Cross-pod state uses Redis as source of truth with the database as fallback. The seven git endpoints fold their multi-step flows into a single composite command in the sandbox, cutting cross-network RTT and fixing real consistency bugs like untracked files faking pull conflicts. On the preview side, H5 was rewritten from polling into a state machine with strict postMessage origin checks and HMR-aware refresh; the deploy tab gates high-risk knobs like pod memory behind a whitelist plus per-user feature flag, with a dual-state UI to prevent silent drift. Observability injects W3C Trace Context into LLM calls; Langfuse folds prompt, tool, and token usage into one trace. Key trade-offs: SSE over WebSocket (resumability and HTTP compatibility), Redis primary plus DB fallback over a single DB (latency vs durability), dual sandbox backends over locking into one vendor (cost and control).

</details>

## ✨ Highlights

- **SSE + MCP 的实时 AI Agent 链路（前后端协同）** (architecture · fullstack)
  AI Agent UX depends on streaming. We exposed SSE backed by the Claude Agent SDK plus MCP and consumed it on the frontend with fetch-event-source, rendering tool_use and tool_result as separate chunks. We tuned nginx proxy_buffering and X-Accel-Buffering so the reverse proxy stops blocking the stream. First-byte landed below a second, and tool expansion plus file diffs render incrementally — the experience shifted from one big wait to step-by-step reveal.
  > Keywords: `SSE` · `MCP` · `Claude Agent SDK` · `fetch-event-source` · `nginx`
- **用户级沙箱与跨 Pod 状态权威源（Redis + DB 兜底）** (reliability · backend)
  Each session gets an isolated sandbox to prevent cross-contamination, but pod drift can lose state. Redis is the source of truth, the database is the fallback, a coordinator handles affinity routing, and a warm pool spares first previews from a full cold start. Reconnects across pods restore the right workspace and preview startup is consistently sub-second.
  > Keywords: `sandbox` · `Redis` · `warm-pool` · `affinity` · `DB fallback`
- **Git 接口性能优化：合并沙箱命令减少 RTT** (performance · backend)
  Each git endpoint used to run several subcommands in the sandbox, paying one cross-network RTT per step. We folded seven endpoints into a single composite command that runs everything in one sandbox roundtrip, and fixed a real bug where untracked files were misread as pull conflicts. Tail latency on git operations dropped sharply — clicks feel instant now.
  > Keywords: `git` · `RTT` · `batch` · `sandbox` · `consistency`
- **H5 预览生命周期与 console 协议演进** (reliability · frontend)
  The iframe preview evolved from polling 'is it up' into a real state machine with explicit transitions for start, ready, error, and refresh. postMessage strictly checks origin to prevent injection, HMR events drive a smart refresh instead of a brute reload, and a runtime error panel pipes console errors back into the main console. Preview reliability and observability both leveled up.
  > Keywords: `iframe` · `state-machine` · `postMessage` · `HMR` · `console`
- **白名单 feature flag 驱动的渐进式发布** (security · fullstack)
  Rolling out a knob like pod memory to everyone at once is risky. We gated it behind a per-user whitelist and a feature flag, with a dual-state UI (saved value vs running value) so users can see whether their change took effect. This pattern became the default playbook for high-risk capabilities: prove it on a small set, expand gradually, blast radius stays bounded.
  > Keywords: `feature-flag` · `whitelist` · `gradual-rollout` · `blast-radius`
- **可观测性：OpenTelemetry + Langfuse 串联 LLM 调用** (observability · backend)
  Debugging LLM flows used to be a black box. We used OTel's Node SDK to inject W3C Trace Context, attaching SSE handlers, tool calls, and LLM prompt and token usage to the same trace, with Langfuse rendering prompt-level detail. End-to-end visibility from user click to LLM tokens — issue triage went from grepping logs to a few clicks in a trace UI.
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

**🟢 Elevator**: The backend buffers recent events with IDs; the frontend reconnects with Last-Event-ID and the stream resumes from the cut.

**🔵 Standard** (default):

LLM streams can run tens of seconds, so any blip kills the connection. streamManager keeps a per-session stream; resumableStreamService stamps each event with a monotonic ID and buffers a recent window. The frontend useAgent uses fetch-event-source, and on disconnect it reconnects with Last-Event-ID so the backend resumes from that point. Users never feel the blip. Ordering of tool_use and tool_result is preserved because IDs are assigned producer-side, not consumer-side.

<details><summary>🔴 Deep dive (click to expand)</summary>

The key is baking resumability into SSE itself rather than layering another protocol on top. streamManager keeps a session-to-active-stream map; resumableStreamService stamps events with monotonic IDs and keeps a ring buffer. The frontend uses fetch-event-source rather than native EventSource because it supports custom headers (auth), Last-Event-ID resume, and abort. On reconnect the frontend sends the last received ID in Last-Event-ID and the server resumes from there, so already-rendered chunks aren't re-sent. Trade-off versus WebSocket: SSE is one-way, but HTTP-native, passes through nginx and k8s ingress without special config, and the resume model is simpler — no hand-rolled heartbeat or reconnect logic. We didn't pick WebSocket because most events are server-to-client; WebSocket would force us to handle backpressure and reconnects ourselves with no real upside. After this rolled out, recovery for long sessions (over 30s) went from almost always failing to over 90% usable, and we added no new state storage — at worst, on a server restart the ring buffer is gone and the client re-issues the whole stream, which is acceptable.

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
- `backagent-web/src/hooks/useAgent.ts`

---

### Q2. Your sandbox layer has both e2b and an in-house backend — how is it abstracted, and what changes when you switch backends?

> Source: `tp-003` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 适配器模式 | 必须掌握 | 讲不清接口与实现分离面试官就会怀疑设计能力 |
| Linux 容器隔离 | 必须掌握 | 沙箱底层都基于 cgroup/namespace，要能讲清边界 |
| 供应商可替换性 | 加分项 | 讲清商业 trade-off 是高级方向的加分点 |

#### Tiered answers

**🟢 Elevator**: SandboxManager exposes one interface; e2b and OpenSandbox are two adapters; business code switches with zero changes.

**🔵 Standard** (default):

Two motivations: isolate user workspaces and decouple from any single vendor. SandboxManager defines one interface (start, exec, file IO, destroy); e2b uses its SDK, in-house OpenSandbox uses our custom protocol. A coordinator routes session-to-instance, business code only sees the interface. Switching backends means changing config and the injected implementation — zero business code changes. After this shipped we could route different sessions to different backends based on cost and capability, and grayscale rollouts went smoothly.

<details><summary>🔴 Deep dive (click to expand)</summary>

The point is a thin but sufficient interface. We initially tried to abstract everything (e2b's filesystem watcher) and had to walk it back because OpenSandbox couldn't match. The interface settled on four things: start (returns session_id), exec (run shell with streaming stdout/stderr/exit), files (read/write/list), destroy. Fancier capabilities (port forwarding, long-running processes) are typed extension APIs on specific implementations; business code uses type guards. The coordinator routes sessions based on backend health and user feature flag (internal accounts prefer OpenSandbox to test new capabilities). The cost of switching is contained in protocol wrappers; business code has never broken because of a backend swap. Trade-off: maintaining two backends is real cost, but the upside is zero vendor lock-in plus capabilities OpenSandbox can do that e2b can't (local warm-up, custom networking). The value isn't 'we use both today,' it's that if e2b raises prices or goes down, we can migrate inside a week.

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
  > Docker is single-node. We need cross-node scheduling, warm pools, and affinity routing — both e2b and OpenSandbox provide that with different protocols, so we abstract over them.


#### Evidence

- `backagent/src/services/sandbox-manager.service.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q3. How do useAgent and useFileSync divide responsibility, and why split them into two hooks instead of one?

> Source: `tp-010` · scope: frontend · backagent-web · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Hook 单一职责 | 必须掌握 | 面试官一定会问拆分依据 |
| Zustand selector / slice | 必须掌握 | store 隔离的具体落地 |
| 依赖方向设计 | 加分项 | 讲清单向依赖能体现架构思维 |

#### Tiered answers

**🟢 Elevator**: useAgent owns SSE subscription and message flow; useFileSync owns file state and editor sync. The split follows data lifecycle.

**🔵 Standard** (default):

The split follows lifecycle. useAgent handles SSE subscription, message accumulation, and tool_use / tool_result dispatch for one session — event-stream semantics. useFileSync handles syncing tool-modified files into the local editor, diff comparison, and coordinating concurrent updates across files — persistent-state semantics. They decouple via the store: useAgent writes file-related events into the store, and useFileSync subscribes to store changes and does the editor work. useAgent stays editor-agnostic, useFileSync stays SSE-agnostic, and both unit-test cleanly on their own.

<details><summary>🔴 Deep dive (click to expand)</summary>

The key criterion for splitting is 'is the dependency direction one-way'. useAgent depends on the SSE protocol and event parsing; useFileSync depends on editor APIs and file comparison. Merging them creates 'edit one hook, need to understand the other' coupling. We put shared data in the Zustand store (messages, files, active session) and each hook reads only its slice. Concrete benefit: when the backend's SSE event protocol changes (a tool_result field shift), only useAgent's parser changes; useFileSync isn't touched. Conversely, upgrading CodeMirror from 5 to 6 only touches useFileSync. Trade-off: after the split the store schema becomes an implicit contract, so TypeScript types have to hold the line; the upside is clean unit tests, easier debugging, and parallel changes. Lesson: early on useAgent called editor APIs directly, and a CodeMirror upgrade rewrote hundreds of lines in one hook; the store isolation cleaned that up. The principle is 'split by rate of change and direction of dependency, not by line count'.

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

- `backagent-web/src/hooks/useAgent.ts`
- `backagent-web/src/hooks/useFileSync.ts`

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

**🟢 Elevator**: An MCP catalog registers tool schemas, the Claude Agent SDK orchestrates calls, the frontend renders tool_use and tool_result as streamed chunks.

**🔵 Standard** (default):

We use the Claude Agent SDK for LLM orchestration. All tools (git, sandbox commands, file IO, deploy) are registered through an MCP catalog, each exposing a name, input schema, and handler. When the Agent decides to call a tool it emits tool_use; the framework dispatches to the catalog, and the result flows back as tool_result. The frontend useAgent reads the SSE stream and renders tool_use and tool_result chunks separately. The big win: tool capabilities are decoupled from the Agent loop — adding a tool just means registering it.

<details><summary>🔴 Deep dive (click to expand)</summary>

The architecture splits the Agent into 'chair (LLM decisions)' and 'workers (tools)'. MCP is the universal tool protocol in between: each tool self-describes its input schema, and the Agent reads those schemas to know what it can call. Concretely, mcp-catalog.service holds the registry; tool implementations wrap methods picked from modules like git-sandbox.service and build-preview. Handlers take normalized inputs and return normalized outputs, with error normalization and secret redaction added on top so internal details never leak into the LLM context. On the frontend, useAgent dispatches SSE events to a ToolDetail component that diffs input and output. Trade-off: MCP adds a layer over directly using the Anthropic tool-use API, which can feel like abstraction for its own sake, but it pays off when swapping LLM providers or Agent runners — the tool layer doesn't change. A real lesson from production: early on we threw tool exceptions directly back to the LLM and the LLM started parroting internal error text into its answers; after adding error normalization separating user-facing from internal trace, it stabilized. End state: idea to a new tool in production within a week.

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
- `backagent-web/src/hooks/useAgent.ts`

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

**🟢 Elevator**: Build inside the sandbox, deploy-proxy maps the artifact to a subdomain, and we rewrite vite base so relative paths resolve.

**🔵 Standard** (default):

When a user clicks deploy, sandbox-deploy runs the build inside the sandbox and the dist stays there; deploy-proxy mounts that dist onto a unique subdomain (user-id plus project hash) via a reverse proxy. The gotcha: vite's default base is '/', which mostly works on a subdomain, but root-relative assets (/assets/...) break when the proxy path doesn't match. So at deploy time we force vite base to '/' (or the right subpath) and patch the HTML accordingly. The frontend DeployTabPanel shows deploy status, runtime errors, and the final subdomain link.

<details><summary>🔴 Deep dive (click to expand)</summary>

The hard part isn't any single step — it's keeping state consistent across boundaries. Sandbox, deploy-proxy, and the frontend UI all need to agree on the same fact: did this deploy succeed, where is the artifact, what's the user URL. We split deploy into states — building, built, proxied, served, failed — each persisted in sandbox-state, with the frontend subscribing via SSE for live updates. Vite base rewriting is unavoidable: at build time the sandbox doesn't know which subdomain it'll end up on, so the artifact has to be path-agnostic — either fully relative or post-processed. We tried fully relative first but vite's generated chunk refs use absolute /assets/... paths, and making everything relative was costly and brittle. We landed on 'build with an absolute placeholder, rewrite HTML entry by subpath at deploy time'. Trade-off: rewriting adds a few hundred ms post-processing per deploy, but it guarantees any subdomain loads correctly. Real lesson: early on there was no error panel, so a failed deploy looked like an endless spinner. After we made DeployTabPanel show the last few lines of build stderr plus a runtime error panel (the iframe's console.error piped back via postMessage), debug time dropped dramatically.

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
- `backagent-web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

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

**🟢 Elevator**: REST for session, sandbox, git, deploy; SSE for Agent streaming; SSE endpoints disable buffering, set keepalive, inject trace context.

**🔵 Standard** (default):

routes.ts roughly has two kinds. First, plain REST: session CRUD, sandbox start/stop, git operations, deploy triggers — standard JSON request and response. Second, SSE: the Agent's main message stream and preview status push, requiring long connections and chunked output. SSE endpoints specifically set Content-Type: text/event-stream plus Cache-Control: no-cache, X-Accel-Buffering: no (to stop nginx buffering), periodic keepalive comment lines (to keep intermediaries from timing out), and the handler manually opens an OTel span at entry so downstream streamManager has trace context. Error handling differs too: SSE can't just res.status(500); it has to emit an error event then close, so the frontend can distinguish.

<details><summary>🔴 Deep dive (click to expand)</summary>

SSE adds several details over plain REST in the routing layer. First, headers: Content-Type: text/event-stream, Cache-Control: no-cache, X-Accel-Buffering: no (for nginx), Connection: keep-alive — all required. Early on we missed X-Accel-Buffering and production nginx buffered the whole stream; the frontend waited tens of seconds for the first event. Second, keepalive: send a `:` comment line every 15s or so to keep intermediaries (k8s ingress, nginx, client proxies) from cutting on idle timeout. Third, trace injection: an Express middleware pulls traceparent into OTel context, but streamManager is async, so the handler must synchronously open a long-running span and pass the context explicitly; otherwise downstream LLM calls won't get the right trace_id. Fourth, error protocol: SSE's statusCode locks once the first byte goes out — you can't res.status(500). Errors must follow the event format, an `event: error\ndata: {...}` line then close; the frontend useAgent can distinguish 'real error' from 'network blip'. Trade-off: extracting SSE plumbing into middleware is cleaner but invades the response API, so we kept 'each SSE handler does header plus keepalive bootstrap inline' — a few duplicated lines but very readable; if SSE endpoints exceed ten we'll revisit. Overall SSE endpoints are the platform's protocol core; getting these details right at the routing layer lets downstream business logic focus on streaming semantics.

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

### Q1. How did you cut first-preview cold start, and how is the warm pool sized so it doesn't burn money?

> Source: `tp-004` · scope: backend · backagent · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 对象池模式 | 必须掌握 | warm pool 本质是对象池，讲不清模式就讲不清细节 |
| 分层镜像/初始化 | 必须掌握 | 速度提升的最大来源就是这一招 |
| 动态扩缩策略 | 加分项 | 讲清成本控制能体现高级思维 |

#### Tiered answers

**🟢 Elevator**: We keep a pool of pre-started sandbox instances; new sessions reuse them, turning cold start into sub-second startup.

**🔵 Standard** (default):

Cold start usually takes a dozen-plus seconds (pull image, install deps, start services). sandbox-warm-pool keeps a fixed number of idle instances each pre-running shared init (image pulled, common processes up) and parked. When a new session arrives, sandbox-proxy grabs one from the pool, and per-user diff init (files, config) finishes in a few hundred ms. Pool size follows schedule — bigger at peak, smaller at night — with monitoring to avoid burning idle. End result: first preview went from a long spinner to sub-second.

<details><summary>🔴 Deep dive (click to expand)</summary>

The core question is balancing fast start against cost. Three levers. First, layered init: image layer, shared deps layer, per-user layer; the first two finish in warm-pool prep so the session-side path only runs per-user, the biggest speedup. Second, dynamic pool size: predict demand from session creation rate over the last N minutes, keep headroom, shrink after peak. Third, affinity recycling: sandbox-proxy hands the same user back a recently released instance when possible (caches still hot). Trade-off: we picked many small pools over one big shared pool because a contaminated instance in a large pool spreads; small pools plus periodic destroy contain the blast radius. Real lesson: early on instances were never destroyed, inodes and other system resources accumulated and they got slower; the fix was force destroy-recreate after N uses. End state: first-preview holds sub-second and pool utilization sits over 70% during business hours.

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
  > On a miss, do the full cold start synchronously and immediately replenish the pool, show an explicit waiting state on the frontend instead of faking readiness, and log the miss as a scale-up signal.


#### Evidence

- `backagent/src/services/sandbox-warm-pool.service.ts`
- `backagent/src/services/sandbox-proxy.service.ts`

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

**🟢 Elevator**: Compose multiple git subcommands into one shell pipeline, run it in the sandbox once, and parse the segmented output.

**🔵 Standard** (default):

Originally every git endpoint called sandbox.exec multiple times — one status, one add, one commit — paying a cross-network RTT each time. After the refactor, git-sandbox.service composes those into one shell pipeline (set -e plus explicit delimiters) and runs it in a single exec; we split stdout back into sections by the delimiter. The same pattern applies to all seven endpoints, including checkpoint. Tail latency dropped sharply — clicks feel instant. We also fixed a real bug where untracked files made pull falsely report a conflict.

<details><summary>🔴 Deep dive (click to expand)</summary>

The essence is collapsing N cross-network RTTs into one. A few details. First, pipeline reliability: set -e aborts on any subcommand failure, so we never end up half-committed. Second, parsable output: between steps we inject ASCII delimiters (characters git won't produce) so the service layer can slice stdout cleanly, and an error inside any slice points exactly to which step failed. Third, idempotency: before merging we audited each step to make sure reruns don't corrupt state (allow-empty commits become explicit instead of implicit), so the composed command is retry-safe. Trade-off: composed commands are harder to debug because you can't dry-run a single step in isolation, so we kept an 'expand mode' for development. A real bug: untracked files used to trigger a fake pull conflict because the old logic treated 'dirty workdir' (including untracked) as a conflict; the fix was stash -u before pull and pop after, preserving user untracked files. Outcome: git operations' P95 improved substantially, and because the segmented parser is strict, error locating is actually more precise than before.

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
  > The workspace lives in the user's sandbox — files, config, credentials all in that namespace. Running libgit2 in the main process would break isolation and lose access to sandbox-scoped git credentials. Not worth it.


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

**🟢 Elevator**: Reads and writes prefer Redis; on failure we fall back to the DB; writes are double-written async, and the cache rebuilds from the DB on boot.

**🔵 Standard** (default):

The model: hot path in Redis, cold path / truth in the DB. sandbox-state.repository exposes a unified get/set; internally it tries Redis first, falls back to the DB on miss or unavailability, backfills Redis on hit. Writes go to Redis synchronously and to the DB asynchronously with retries, so Redis stays freshest. The coordinator consumes this repository too, so Redis failures degrade automatically without business code knowing. On pod restart we don't rely on Redis cache; the DB rebuilds it.

<details><summary>🔴 Deep dive (click to expand)</summary>

'Redis primary' doesn't mean 'DB is useless' — it means Redis is the hot-path source of truth. Consistency: writes double-written (Redis sync, DB async with retries plus a queue); reads try Redis then DB, with TTL plus active invalidation on cache eviction. A Redis outage triggers two reactions: the repository switches reads to the DB internally with a degraded flag, alerts fire, and writes still try both but a Redis write error doesn't block — the DB is the eventual safety net. The hardest case is Redis data corruption, so critical keys carry a schema and version; corruption is detected and evicted, then rebuilt from the DB. Trade-off: we picked Redis primary over DB primary because sandbox state is read and written extremely often (every SSE event updates heartbeat / progress) and the DB alone couldn't take it. The cost is engineering for the degraded path, so the DB has to be a real fallback, not a backup of cache. Real incident: a Redis primary-replica split-brain corrupted a few session states. After that we added 'read-time verification' in the coordinator — compare actual sandbox state against the Redis record, and if they disagree, rewrite based on actual state. We get Redis latency without losing continuity when things break.

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

> Source: `tp-009` · scope: frontend · backagent-web · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 状态机/有限状态自动机 | 必须掌握 | 讲不清状态与转移就讲不清重构动机 |
| postMessage origin 校验 | 必须掌握 | iframe 通信安全的第一道关 |
| AbortController 取消语义 | 加分项 | 并发保护的标准答案 |

#### Tiered answers

**🟢 Elevator**: Split start, ready, error, refresh, destroy into explicit states; protect concurrent starts; strictly check postMessage origin.

**🔵 Standard** (default):

The old preview just polled 'is it up', with state scattered across setInterval and useEffect, and refresh sometimes left an old iframe alive while a new one started. After the rewrite, usePreviewStore is an explicit state machine — idle → starting → ready / error → refreshing → ready — and all transitions go through the store. Concurrent starts are protected by an inflight token so a new start cancels the old promise. postMessage listeners strictly check origin to prevent injection. HMR uses useH5PreviewRefresh to react to file changes intelligently rather than forcing a reload. Preview reliability noticeably improved.

<details><summary>🔴 Deep dive (click to expand)</summary>

A state machine's value is turning implicit timing into explicit transitions. Several edge cases to call out. First, concurrent starts: a user double-clicking refresh or rapid code changes triggering multiple starts — usePreviewStore uses an inflight token plus AbortController so a new start aborts the old one, preventing ready events from landing on the wrong iframe. Second, origin checks: the preview URL loads under a user subdomain, and postMessage origin must strictly match that subdomain — not '*' or 'parent.origin' — to block malicious pages forging preview events. Third, HMR awareness: the backend h5-preview.service pushes file changes, and useH5PreviewRefresh maps them onto the iframe's HMR channel, doing partial updates when possible and only escalating to a full reload when HMR fails (e.g., entry file restructure). Fourth, error piping back: runtime errors inside the iframe come back via postMessage to the main console with frame id and origin, so different sessions don't cross-talk. Trade-off: a state machine adds code, but debug cost crashes — you can read the current store state directly instead of reverse-engineering setIntervals. Lesson: early on we had no inflight protection; double-clicking restart produced a 'shows ready but it's actually the old iframe' ghost state. After that we made 'most-recent-wins' the rule for every async interaction.

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
  > Few states (5) and simple transitions; XState would add bundle size and cognitive overhead. If states grew past ten or we needed parallel regions, we'd revisit.


#### Evidence

- `backagent-web/src/pages/Chat/components/preview/H5Preview.tsx`
- `backagent-web/src/hooks/useH5PreviewRefresh.ts`
- `backagent-web/src/stores/usePreviewStore.ts`
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

**🟢 Elevator**: OTel injects W3C Trace Context so LLM calls join the main trace; Langfuse captures prompt and token detail.

**🔵 Standard** (default):

Traditional tracing has no native LLM concept — prompt, token, tool calls are a black box. We use the OTel Node SDK to open spans on the Express handler, SSE streamManager, and MCP tool calls, and propagate W3C Trace Context so LLM-call spans hook in. Langfuse is the LLM-specific backend, recording prompt text, token usage, and cost, also keyed by trace_id linked to the OTel trace. End result: one user request from click to LLM token shows full timing in OTel, and prompt-level detail is one click away in Langfuse using the same trace_id.

<details><summary>🔴 Deep dive (click to expand)</summary>

The hard parts are 'which span does an LLM call belong to' and 'where do non-standard fields like prompt and token live'. Our approach: first, every entry point (Express handler, SSE long connection, tool handler) opens an OTel span, and before an LLM call we pull trace_id from the current context and pass it to the Langfuse client so both backends key on the same trace_id. Second, prompt text, token usage, and cost don't go into OTel attributes (attributes have length limits and aren't great for long text); they go to Langfuse. OTel only records key scalars (model_name, prompt_tokens, completion_tokens, duration), good for aggregation and alerts. Third, secret redaction happens before writing to Langfuse to avoid leaking API keys in prompts. Trade-off: two backends means two SDKs and two bills, but OTel solves 'full-stack debugging' and Langfuse solves 'LLM-specific observability'; jamming everything into one system gives you neither. Lesson: early on we put full prompts into OTel attributes, exporters blew up, and sampling had to be lowered; the fix was moving big text to Langfuse and leaving OTel scalars only. Now triage runs 'OTel for which step is slow or failing, Langfuse for prompt detail', and time-to-locate dropped from minutes to seconds.

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
  > Langfuse is purpose-built for LLM and only thinly supports non-LLM spans (DB, Redis, sandbox). OTel is the industry standard and connects to all existing infrastructure; splitting roles is the cheaper path.


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `backagent/src/services/streamManager.ts`

---

## 🔒 Security (security) — 1 Q&A

### Q1. How do you gray-roll a high-risk knob like pod memory, and why does the UI show a dual state?

> Source: `tp-007` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Feature flag 模式 | 必须掌握 | 讲不清 release toggle / ops toggle 区别就讲不清这套发布 |
| Blast radius 思维 | 必须掌握 | 中级以上必须能解释为什么不全量 |
| 前后端权限分层 | 加分项 | 讲清「前端只是 UI 隐藏」是体现安全意识的关键 |

#### Tiered answers

**🟢 Elevator**: Whitelist plus per-user feature flag gates visibility; the UI shows both the saved value and the running value side by side.

**🔵 Standard** (default):

A high-risk knob like pod memory can take a user's app down if set wrong. The backend keeps a whitelist (feature-whitelist.ts) of allowed users, and the frontend stacks a feature flag on top — both must pass before the entry shows up. For display, DeployTabPanel shows both the saved value and the running value: after a save but before restart they differ, so users see 'my change hasn't taken effect yet' instead of guessing. This pattern became our default playbook for high-risk capabilities.

<details><summary>🔴 Deep dive (click to expand)</summary>

The point is shrinking blast radius. Three layers. First, a backend whitelist (feature-whitelist.ts), initially hardcoded to internal accounts. This is the final decider — the frontend cannot go around it. Second, a feature flag the frontend uses to render or hide the entry, so ops can toggle by user group without a deploy. Third, the dual-state UI: DeployTabPanel shows both 'saved (persisted in DB)' and 'running (actually live on the pod)'; before a deploy restart these visibly differ. Trade-off: dual-state costs more on the frontend (two values to fetch, more UI to explain), but compared to users 'changed something and have no idea, try again' it's clearly worth it. Real lesson: early on we only had the frontend flag and no backend whitelist; a user flipped the flag in dev tools and almost misconfigured production. After that we pushed the final permission check entirely into the backend API — the frontend just hides the entry. Now this same pattern is reused on deploy, checkpoint, and other high-risk surfaces at near-zero cost (copy a whitelist key) for real reliability gain.

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
  > A knob like pod memory only takes effect after a deploy restart. A single-state UI makes users think the change is live; dual-state explicitly shows 'saved vs running', preventing silent drift.


#### Evidence

- `backagent/src/config/feature-whitelist.ts`
- `backagent-web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

