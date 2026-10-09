# QPilot Code Agent — 面试备战材料

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 3      | 🧩 |
| architecture  | 3 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 0 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

面向企业的 AI 编程平台，把设计稿和自然语言需求实时转成可预览、可部署的多框架前端代码。

### 标准（30–60 秒）

QPilot Code Agent 是一个面向企业的 AI 编程平台，仓库已迁到 backagent 和 web。后端用 Express 加 Claude Agent SDK 加 MCP，对外暴露 SSE 流式接口；前端是 React 18 加 Zustand 加 Sandpack。每个 session 一个隔离沙箱，执行层使用 OpenSandbox SDK。进程内预热池已改成空实现，预热交给 OpenSandbox 服务端。跨 Pod 的状态权威源放在 Redis，DB 做兜底，读取时用 OpenSandbox getInfo 校准沙箱是否还活着。预览产物仍由 deploy-proxy 挂到子域名。上传在解析 body 前校验 Origin，部署前只在 isEphemeralStorage 为 true 时确认数据丢失风险。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

QPilot Code Agent 把 AI 编程从 demo 推到可灰度运营的产品。前端用 fetch-event-source 订阅 SSE，按 tool_use 和 tool_result 分片渲染；nginx 反代关掉了 proxy_buffering 并设置 X-Accel-Buffering: no，否则首字节会被缓住。后端用 Claude Agent SDK 加 MCP，工具——git、沙箱命令、文件 IO、deploy——通过一个 MCP catalog 注册，每个工具自带名字、输入 schema 和 handler，启动时一次性注册，schema 也直接传给 LLM 做能力发现。沙箱执行层已经收口到 OpenSandbox SDK。查询和续期带超时，元数据会先清洗长度和字符。e2b 只剩注释，不能再讲成可选后端。sandbox-warm-pool.service.ts 还在，但是空实现，acquireWarmSandbox 固定返回 null，预热交给 OpenSandbox 服务端，这份仓库不再按白天黑夜扩缩本地池。Git 接口仍把多次 sandbox.exec 合并成一条 set -e 复合命令，用分隔标记切片解析，减少跨沙箱往返。SSE 而非 WebSocket：事件几乎都是 server→client，HTTP 兼容、Last-Event-ID 续接简单，nginx 和 k8s ingress 不需要特殊配置；Redis 主加 DB 兜底而非单 DB：sandbox 状态读写极高频，DB 单点撑不住，Redis 命中亚毫秒，DB 在故障或重建时承压，重启后状态可以从 DB 重建。可观测性把 W3C Trace Context 注入 LLM 调用层，prompt 文本和 token 用量这种大字段写 Langfuse，OTel 这边只记 model_name、prompt_tokens、completion_tokens、duration 这类标量，两边共享 trace_id，排查时一条链路串得起来。

</details>

## ✨ 项目亮点

- **SSE + MCP 的实时 AI Agent 链路（前后端协同）**（architecture · fullstack）
  AI Agent 体验依赖流式响应。后端用 Claude Agent SDK 加 MCP 暴露 SSE，前端用 fetch-event-source 接收，按 tool_use 和 tool_result 分片渲染。nginx 反代默认会 buffer 流，所以关掉 proxy_buffering 并设置 X-Accel-Buffering: no。最终首字节稳定在亚秒级，工具调用展开和文件 diff 都是边出边渲染。
  > 关键词：`SSE` · `MCP` · `Claude Agent SDK` · `fetch-event-source` · `nginx`
- **用户级沙箱与跨 Pod 状态权威源（Redis + DB 兜底）**（reliability · backend）
  每个 session 一个隔离沙箱，执行层使用 OpenSandbox。Redis 仍是运行状态的权威源，读取时用 OpenSandbox getInfo 校准沙箱是否真的存活。进程内 SandboxWarmPoolService 已是空实现，acquireWarmSandbox 固定返回 null，预热不再发生在这个 Node 进程里。
  > 关键词：`OpenSandbox` · `Redis` · `getInfo` · `warm-pool stub` · `DB fallback`
- **Git 接口性能优化：合并沙箱命令减少 RTT**（performance · backend）
  原来 git 接口在沙箱内串行跑多个子命令，每步付一次跨网络 RTT。重构后用 set -e 加分隔标记把子命令拼成一条复合命令，一次 sandbox.exec 完成，stdout 按分隔标记切片解析回 service 层。7 个 git 端点（包括 checkpoint）共用同一套合并逻辑。中间修了一个一致性 bug：untracked 文件原来会让 pull 误报冲突。
  > 关键词：`git` · `RTT` · `batch` · `sandbox` · `consistency`
- **H5 预览生命周期与 console 协议演进**（reliability · frontend）
  iframe 预览原来是轮询「能不能访问」，逻辑分散在多个 setInterval 和 useEffect 里，刷新时偶尔出现「老 iframe 未销毁、新 iframe 已启动」的并发问题。重写为显式状态机：idle → starting → ready / error → refreshing → ready，所有转移过 store。并发启动用 inflight token 加 AbortController，新启动 abort 老的。postMessage 严格校验 origin 防注入。HMR 失败才升级到 full reload。
  > 关键词：`iframe` · `state-machine` · `postMessage` · `HMR` · `console`
- **上传门禁与部署前易失存储确认**（security · fullstack）
  上传路由在解析最大 1GB 的 JSON body 之前校验 Origin，避免不被允许的来源先把大请求读进内存。部署前读取 isEphemeralStorage，只有为 true 才弹出确认并展示 ephemeralReason。2026-09-02 去掉了 readError 也拦截的判断，预检读取失败不再单独挡住部署。旧的 feature-whitelist.ts 已不在当前仓库。
  > 关键词：`Origin` · `上传` · `isEphemeralStorage` · `ephemeralReason`
- **可观测性：OpenTelemetry + Langfuse 串联 LLM 调用**（observability · backend）
  排查 LLM 链路原来是黑箱。用 OTel Node SDK 在 Express handler、SSE streamManager、MCP 工具调用处都开 span，通过 W3C Trace Context 把 LLM 调用 span 挂到主 trace 上；Langfuse 作为 LLM 维度的后端记录 prompt 文本、token 用量、cost，与 OTel 共享 trace_id。OTel attribute 只记 model_name、prompt_tokens、completion_tokens、duration 等标量，prompt 这类大字段写 Langfuse 避免 exporter 流量过载。
  > 关键词：`OpenTelemetry` · `Langfuse` · `Trace Context` · `LLM trace`


## 🏗️ 架构（architecture）— 3 题

### Q1. 你们 SSE 流式接口断线之后是怎么续接的？前后端各承担什么？

> 来源：`tp-001` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| SSE 协议规范 | 必须掌握 | 讲不清 Last-Event-ID 与重连，可恢复性故事就塌了 |
| fetch-event-source | 必须掌握 | 面试官会问为什么不用原生 EventSource |
| WebSocket vs SSE | 加分项 | 讲清 trade-off 才能撑住中级以上的追问 |

#### 三档回答

**🟢 一句话**：前端用 Last-Event-ID header 带上最后一次收到的 ID 重连，后端从那之后续推。

**🔵 标准**（默认）：

LLM 流通常跑几十秒，中间网络抖一下连接就断了，所以需要做断点续传。后端有两个服务：streamManager 按 session 维护活跃流，resumableStreamService 给每条事件分配单调递增的 ID 并缓存最近一段窗口。前端用 fetch-event-source 监听，断开后用最后收到的 ID 放在 Last-Event-ID header 里重连，服务端从那之后续推。tool_use 和 tool_result 的次序由 ID 在生产侧分配保证；前端不用原生 EventSource 是因为它带不了自定义 header，鉴权过不去。

<details><summary>🔴 深挖（点击展开）</summary>

核心思路是把可恢复性放进 SSE 协议本身，不在 SSE 上再叠一层应用协议。streamManager 按 session 维护当前活跃流，resumableStreamService 给事件打单调递增 ID，并保留一个 ring buffer 作为重传窗口，窗口大小按一次会话最差网络抖动场景能覆盖来定，覆盖不到的就退化成重发整段。前端没用浏览器原生 EventSource——它带不了自定义 header，鉴权过不去；fetch-event-source 支持自定义 header、Last-Event-ID 续接和 abort。重连时前端把最后一个 ID 放在 Last-Event-ID header 里，服务端从那之后续推，已经渲染过的事件不会重发；服务端找不到这个 ID 时回一个明确的事件让前端清空状态重发起。SSE 而不是 WebSocket：事件几乎都是 server→client，SSE 单向、HTTP 兼容，走 nginx 和 k8s ingress 不需要特殊配置；恢复模型也比 WebSocket 简单，不用自己写心跳和重连协议。WebSocket 还要业务层处理 backpressure。代价：服务重启后 ring buffer 会失效，最坏情况退化成重新发起整段流，业务层能接受这个语义，前端会拿到新的 trace 重新走完一遍。前端配合 abort：组件 unmount 或重连前先 abort 老的 fetch-event-source 实例，避免事件落到旧 handler 上；同一个 session 上同时只允许一个活跃流，新流启动会顺手 abort 老的。整体上这套机制没有引入新的状态存储；ring buffer 只在内存里，重连状态完全由前端持有的 Last-Event-ID 决定，扩容缩容也不用改协议。

</details>

#### 补齐方案

- 📚 必读
  - [ ] WHATWG HTML Living Standard - Server-Sent Events
  - [ ] MDN: Using Server-Sent Events
- 🛠️ 动手
  - [ ] 用 Express 写 30 行 SSE demo，支持 Last-Event-ID 续接
  - [ ] demo 接到本地 nginx 反代后面，验证 X-Accel-Buffering 关闭后流式首字节
- ⚠️ 常见踩坑
  - nginx 默认开启 buffer 导致流不动 → 加 X-Accel-Buffering: no
  - 原生 EventSource 不支持自定义 header（带不了 Authorization）
  - Last-Event-ID 必须服务端分配且单调递增，前端不能自己生成
- 🤔 自测题（合上文档自答）
  - [ ] 客户端断了 5 分钟再回来，buffer 已被驱逐，怎么办？
  - [ ] SSE 在 HTTP/2 下有什么注意点？
  - [ ] 为什么不直接用 WebSocket？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么选 SSE 而不是 WebSocket？**（trade-off）
  > SSE 单向、HTTP 兼容、天然支持 Last-Event-ID；事件几乎都是 server→client，WebSocket 反而引入心跳和 backpressure 自管的成本。


#### Evidence

- `backagent/src/services/resumableStreamService.ts`
- `backagent/src/services/streamManager.ts`
- `web/src/hooks/useAgent.ts`

---

### Q2. 当前沙箱执行层接的是什么？e2b 还能不能当成一个可选后端？

> 来源：`tp-003` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 适配器模式 | 必须掌握 | 讲不清接口与实现分离面试官就会怀疑设计能力 |
| Linux 容器隔离 | 必须掌握 | 沙箱底层都基于 cgroup/namespace，要能讲清边界 |
| 供应商可替换性 | 加分项 | 讲清商业 trade-off 是高级方向的加分点 |

#### 三档回答

**🟢 一句话**：执行层只接 OpenSandbox SDK。e2b 只剩历史注释，不能再讲成当前双后端。

**🔵 标准**（默认）：

sandbox-manager 从 OpenSandbox SDK 创建管理器。getSandboxInfo、listSandboxInfos 和 renew 都包了超时。写入元数据前会清洗长度和非法字符。Redis 仍保存运行状态，读取时调用 OpenSandbox getInfo，用平台返回的真实过期时间校正。仓库里已经没有 e2b SDK 导入，只有错误分类注释和旧端口字段说明。面试时我会说执行层已经收口，不再画两套后端切换图。

<details><summary>🔴 深挖（点击展开）</summary>

当前执行层只接 OpenSandbox。sandbox-manager 用 SDK 创建管理器，getSandboxInfo、listSandboxInfos 和 renew 都有超时，避免一次查询把请求挂死。写入前会清洗元数据的长度和字符。Redis 里的过期时间可能落后于平台，所以读取时用 getInfo 拿真实状态再校正。e2b 只出现在 sandbox-errors.ts 的注释里，以及 schema 里遗留的 e2b.dev 端口示例。这两处都不能当成现在还能切到 e2b。进程内预热也不再参与这条链路，acquireWarmSandbox 固定返回 null。如果被追问以前为什么抽象两个后端，把它讲成已经下线的历史。

</details>

#### 补齐方案

- 📚 必读
  - [ ] e2b 官方文档 - Sandbox 概念与生命周期
  - [ ] Linux man-pages: namespaces(7) 与 cgroups(7)
- 🛠️ 动手
  - [ ] 用 docker exec 包一个最小沙箱接口，支持 exec / read / write 三件事
  - [ ] 把同一段业务代码挂到两个 docker 实例上，跑一遍灰度切换
- ⚠️ 常见踩坑
  - 抽象接口塞太多（试图统一所有后端的奇异能力），结果哪边都不舒服
  - 忘了 destroy 资源，长跑后实例数爆炸
  - exec 没有限制并发，用户可以轻松打满后端
- 🤔 自测题（合上文档自答）
  - [ ] 如果有一天必须支持第三个沙箱后端，你的接口能不能扛住？
  - [ ] 怎么处理两个后端实现行为细微不一致（比如 exit code 语义）？
  - [ ] Coordinator 路由策略怎么避免雪崩？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不直接用 Docker 而要做这层抽象？**（trade-off）
  > Docker 是单机概念，当前执行层交给 OpenSandbox 做跨机沙箱。这份仓库不再包一层 e2b 适配，也不再由本进程维护热池。


#### Evidence

- `backagent/src/services/sandbox-manager.service.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q3. useAgent 和 useFileSync 是怎么分工的？为什么要拆成两个 hook 而不是一个？

> 来源：`tp-010` · scope: frontend · web · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Hook 单一职责 | 必须掌握 | 面试官一定会问拆分依据 |
| Zustand selector / slice | 必须掌握 | store 隔离的具体落地 |
| 依赖方向设计 | 加分项 | 讲清单向依赖能体现架构思维 |

#### 三档回答

**🟢 一句话**：useAgent 管 SSE 订阅和消息流，useFileSync 管文件状态和编辑器同步——按数据生命周期拆。

**🔵 标准**（默认）：

拆开的依据是数据生命周期不一样。useAgent 负责一次会话里的 SSE 订阅、消息累积、tool_use / tool_result 分发，是「事件流」语义；useFileSync 负责把 tool 改的文件同步到本地编辑器、做差异对比、协调多个文件的并发更新，是「持久状态」语义。两者通过 store 解耦——useAgent 把文件相关事件写进 store，useFileSync 订阅 store 变化做后续编辑器操作。这样 useAgent 跟编辑器实现没关系，useFileSync 跟 SSE 协议没关系，单测都能各自跑，迭代时改一边不会拖另一边。

<details><summary>🔴 深挖（点击展开）</summary>

拆 hook 的关键标准是「依赖方向是不是单向」。useAgent 依赖 SSE 协议和事件解析，useFileSync 依赖编辑器 API 和文件比较，两个直接合并就会出现「修一个 hook 必须懂另一边」的耦合。所以共享数据放 Zustand store——messages、files、active session——两个 hook 各自只读自己关心的 slice，写的时候也只写自己负责的字段。具体好处：后端把 SSE 事件协议升级（比如 tool_result 字段调整），只改 useAgent 的解析逻辑，useFileSync 完全不用动；反过来，编辑器从 CodeMirror 5 升 6 时，只 useFileSync 受影响，store schema 也不用改。代价是——拆开后 store schema 就变成了隐式契约，得有 TypeScript 类型守住，schema 演进时两边都要按类型改，删字段要走 deprecated 周期不能直接删。好处是单测、调试、并行修改都方便：useAgent 的单测可以直接 mock SSE 事件，useFileSync 的单测可以直接 mock store。早期 useAgent 直接调编辑器 API，结果切 codemirror 版本时一个 hook 改了几百行，所以加了这层 store 隔离。整体思路是「按变化频率和依赖方向拆 hook」，不是「按代码长度拆」——前者能省下真实的维护成本，后者只是看着整齐。划分完之后两个 hook 各自的 commit 历史也能反映这个分工——useAgent 的改动主要发生在协议升级窗口，useFileSync 的改动集中在编辑器升级和并发文件场景，几乎不重叠。还有一个隐性好处是新人上手——只要分清自己改的是哪个 hook，就能把另一边当作稳定的 API 看。

</details>

#### 补齐方案

- 📚 必读
  - [ ] React 官方文档 - Custom Hooks 章节
  - [ ] Dan Abramov - 'Why Do React Hooks Rely on Call Order?'
- 🛠️ 动手
  - [ ] 把一个混做 fetch + 表单 + 校验的 hook 按数据生命周期拆成 3 个 hook
  - [ ] 用 Zustand 实现两个 hook 的 store 隔离，写最小单测
- ⚠️ 常见踩坑
  - 按文件长度拆 hook，但依赖方向是双向的，越拆越乱
  - store 不写类型，hook 之间靠默契传字段
  - useEffect 的依赖数组漏字段，state 切换时 hook 不重订阅
- 🤔 自测题（合上文档自答）
  - [ ] 如果 useAgent 和 useFileSync 共享一份 inflight 状态怎么办？
  - [ ] 怎么避免两个 hook 都触发同一个副作用？
  - [ ] 测 useAgent 时 SSE 怎么 mock？
- ⏱️ 预估学习时长：**半天**


#### Evidence

- `web/src/hooks/useAgent.ts`
- `web/src/hooks/useFileSync.ts`

---

## 🧩 功能（feature）— 3 题

### Q1. 你们怎么把工具能力暴露给 Claude Agent？MCP 在这个链路里起什么作用？

> 来源：`tp-002` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| MCP 协议核心 | 必须掌握 | 不懂 MCP 注册流程就讲不清工具如何被 LLM 看到 |
| Tool-use 协议 | 必须掌握 | 面试官会问 tool_use / tool_result 的事件结构 |
| 错误归一化模式 | 加分项 | 讲到错误层能体现工程化能力 |

#### 三档回答

**🟢 一句话**：工具——git、沙箱命令、文件 IO、deploy——通过 MCP catalog 注册给 Agent，Agent 输出 tool_use，框架转给 catalog 执行，结果以 tool_result 回流。

**🔵 标准**（默认）：

我们用 Claude Agent SDK 拿到 LLM 的调度能力，工具——git、沙箱命令、文件操作、deploy——通过 mcp-catalog.service 注册，每个工具暴露名字、JSON Schema 形式的输入参数和 handler。Agent 决定调谁时输出一个 tool_use 消息，框架按名字路由到 catalog 的 handler 执行，结果以 tool_result 消息回流。前端的 useAgent 监听 SSE，按 tool_use 和 tool_result 分片渲染，工具名、参数 diff、结果都能边出边显示。这层抽象的好处是工具能力跟 Agent 解耦：加新工具只需要在 catalog 注册，不用改 Agent 主流程。

<details><summary>🔴 深挖（点击展开）</summary>

MCP 在这个链路里相当于工具与 Agent 之间的统一注册总线。mcp-catalog.service 在启动时把所有工具注册进去，每个工具的 schema 直接暴露给 LLM，LLM 看到的是「我能调哪些工具、每个工具要什么参数」的清单，新增工具不用改 prompt，也不用改 Agent 的提示模板。Agent SDK 负责协议握手、消息序列化、tool_use 的路由。我们做的工作主要在两端：catalog 这边把每个工具的 handler 包装成符合 MCP 协议的 callable，输入按 JSON Schema 校验后再进 handler，校验失败直接拒绝并把错误结构化返回，不会污染 Agent 上下文；输出按统一格式回包成 tool_result。schema 演进有版本控制，向后兼容的字段加 optional，破坏性变更走显式版本号。前端的 useAgent 监听 SSE，把 tool_use 和 tool_result 分到独立的渲染分支——tool_use 显示工具名加参数 diff，tool_result 显示结构化结果，两个事件用同一个 tool_call_id 关联，乱序到达也能拼回去。为什么用 MCP 而不是直接函数调用：第一，工具列表对 LLM 可见，新增工具不用改 prompt；第二，schema 校验失败可以直接拒绝，不会污染 Agent 上下文；第三，同一个 catalog 可以服务多个 LLM 后端，未来切换不会动业务层。代价：每次工具调用要付一次序列化成本，对极高频工具会被注意到，但我们的工具调用频率受 LLM 思考速度限制，序列化代价可以忽略。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Anthropic - Model Context Protocol 官方文档
  - [ ] Anthropic - Tool use API reference
- 🛠️ 动手
  - [ ] 用 MCP SDK 写最小 server，暴露 read_file / write_file 两个工具，接到 Claude Desktop 验证
  - [ ] 在现有项目给 mcp-catalog 加一个新工具（如 list_dir），跑通 tool_use → tool_result
- ⚠️ 常见踩坑
  - 把内部错误堆栈直接丢回 LLM，LLM 会复述给用户
  - 工具 schema 漏字段，LLM 反复尝试错误参数浪费 token
  - 工具调用没加超时，长跑工具拖死整条 Agent
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不直接用 Anthropic 的 tool-use API，要加一层 MCP？
  - [ ] 如果一个工具调用要跑 30s，怎么把进度反馈给前端？
  - [ ] 工具的输入 schema 怎么和工具实现保持同步？
- ⏱️ 预估学习时长：**1–2 天**


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `web/src/hooks/useAgent.ts`

---

### Q2. 从沙箱里 build 出来的产物到用户能访问的子域名，中间链路是怎么打通的？

> 来源：`tp-008` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| vite base / publicPath | 必须掌握 | 子路径部署的 90% 故障都是这里 |
| 反向代理 host/path | 必须掌握 | 讲不清子域名映射就讲不清整条链路 |
| 构建产物路径无关性 | 加分项 | 理解为什么不能写死绝对路径 |

#### 三档回答

**🟢 一句话**：沙箱里 build 出 dist，deploy-proxy 把 dist 挂到一个由 user-id 加 project hash 拼成的子域名，反代对外暴露；deploy 时按子路径重写 vite base。

**🔵 标准**（默认）：

用户点 deploy 后，sandbox-deploy 在沙箱里跑构建，dist 留在沙箱里。deploy-proxy 把 dist 挂到一个由 user-id 加 project hash 拼成的子域名，反代对外暴露。这里有个坑：vite 默认 base 是 '/'，在子域名场景下大部分能跑，但根相对资源（比如 /assets/...）一旦反代路径不匹配就会 404。所以 deploy 时强制把 vite base 设成 '/' 或正确的子路径，并相应改写 HTML。前端 DeployTabPanel 负责显示 deploy 状态、错误面板，把最终的子域名链接给用户。

<details><summary>🔴 深挖（点击展开）</summary>

这条链路上比较麻烦的是跨边界的状态对齐——沙箱、deploy-proxy、前端 UI 三处要对同一组事实达成一致：这次 deploy 成没成、产物在哪、用户的 URL 是啥。我们把 deploy 拆成几个状态——building、built、proxied、served、failed——每个状态在 sandbox-state 里都有 record，前端订阅 SSE 实时拿状态变更。Vite base 修正这一步绕不开：build 的时候沙箱不知道未来要挂到哪个子域名，所以产物必须是路径无关的，要么用相对路径，要么后处理 HTML。一开始我们想全用相对路径，但 vite 生成的 chunk 引用都是 /assets/... 这种绝对形式，全相对化代价大、还容易出错；最后选了「构建时用绝对路径占位 → deploy 的时候按子路径重写 HTML 入口」。代价很清楚——重写要对 dist 做后处理，每次多花几百毫秒，但能保证任何子域名都能正确加载资源。错误展示上，早期没做错误面板，deploy 失败用户看到的就是一直转圈，定位很慢。后来 DeployTabPanel 直接展示 build 阶段 stderr 末尾几行，加一个 runtime 错误面板（iframe 里的 console.error 通过 postMessage 回传，origin 严格校验），定位成本就降下来了。子域名命名上 user-id 加 project hash 的好处是相同项目重复 deploy 命中同一个子域名，CDN 和浏览器缓存友好；不用纯随机子域名也是为了避免占用过多反代路由表项。安全上 postMessage 这条回传通道我们要求 origin 严格匹配子域名，避免 iframe 内的恶意脚本伪造错误信息影响主站。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Vite 官方文档 - Public Base Path
  - [ ] nginx proxy_pass 与 sub_filter 章节
- 🛠️ 动手
  - [ ] 用一个 vite 项目 build 出 dist，挂到 nginx 的子路径下，修复 /assets 加载问题
  - [ ] 给 deploy 加一个简单的 stderr tail 面板，故意制造 build 失败验证显示
- ⚠️ 常见踩坑
  - vite base 没设导致 /assets 404
  - HTML 入口没 rewrite，相对路径在某些子路径下错乱
  - deploy 状态没区分 build / proxy / serve，前端 UI 误显示成功
- 🤔 自测题（合上文档自答）
  - [ ] 如果用户的项目是 SPA + history 路由，deploy 之后刷新 404 怎么处理？
  - [ ] 怎么区分 build 失败和 runtime 失败？两边的错误面板有什么不同？
  - [ ] 子域名命名怎么避免冲突和被猜出来？
- ⏱️ 预估学习时长：**1–2 天**


#### Evidence

- `backagent/src/services/build-preview/sandbox-deploy.service.ts`
- `backagent/src/services/build-preview/deploy-proxy.service.ts`
- `web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

### Q3. 你们 Express 路由层暴露了哪些类型的端点？SSE 端点和普通 REST 在路由层有什么不同处理？

> 来源：`tp-012` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Express middleware 模型 | 必须掌握 | 讲不清 next() 和 res 生命周期就讲不清 SSE 处理 |
| HTTP 长连接 keepalive | 必须掌握 | 中间代理切断连接的根因都在这 |
| SSE 错误协议 | 加分项 | 讲清 statusCode 锁定后怎么报错是细节加分 |

#### 三档回答

**🟢 一句话**：REST 给会话、沙箱、git、部署用，SSE 给 Agent 流式响应；SSE 端点要禁缓冲、设 keepalive、注入 trace context。

**🔵 标准**（默认）：

routes.ts 大致分两类。第一类是普通 REST：会话 CRUD、沙箱启停、git 操作、deploy 触发，标准的 JSON 请求和响应。第二类是 SSE：Agent 主消息流、预览启动状态推送，要长连接和分片输出。SSE 端点这边专门做了几件事：设 Content-Type: text/event-stream 和 Cache-Control: no-cache，再加 X-Accel-Buffering: no（防 nginx 缓住），定期发 keepalive 注释行（防中间代理超时断连），handler 入口处手动 open 一个 OTel span 把 trace context 传给下游 streamManager。错误处理上 SSE 不能像 REST 那样直接 res.status(500)，得先发一条 error 事件再 close，前端才能区分「真错」和「网络断」。

<details><summary>🔴 深挖（点击展开）</summary>

SSE 在 Express 路由层有几个普通 REST 没有的细节。第一是 header：Content-Type: text/event-stream、Cache-Control: no-cache、X-Accel-Buffering: no（专门给 nginx）、Connection: keep-alive，一个都不能少。早期我们漏过 X-Accel-Buffering，生产 nginx 把整条流缓住了，前端要等十几秒才看到第一条事件，从那以后这个 header 我们写在 SSE handler 的初始化片段里固定下来。第二是 keepalive：每 15 秒左右发一条 `:` 注释行，不然 k8s ingress、nginx、客户端 proxy 这些中间层就会按空闲超时切断连接；keepalive 频率比所有中间层的 idle timeout 短一档。第三是 trace 注入：Express 中间件把 traceparent header 提进 OTel context，但 streamManager 是异步的，必须在 handler 同步阶段开一个 long-running span 把 context 显式传下去，不然 LLM 调用拿不到正确的 trace_id。第四是错误协议：SSE 的 statusCode 在第一字节发出后就锁死了，再 res.status(500) 也没用，错误必须按事件协议发一条 `event: error\ndata: {...}` 再 close，前端 useAgent 看到这种事件就能分清「真错」和「网络断」。trade-off 在哪：把 SSE 处理逻辑抽成中间件比较干净但会侵入响应对象 API，所以我们选了「routes.ts 里每个 SSE handler 显式开头几行处理 header 加 keepalive」这种重复但好读的写法；后期 SSE 端点超过十个再考虑抽中间件。SSE 端点是这套平台的协议核心，路由层把这些细节做对，下游业务才能专注流式逻辑。SSE 的写入也走 Express 自带的 res.write，所以背压由 Node 的 stream 模块处理；业务侧只要按事件协议拼字符串就行，不用自己写流控。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Express 官方文档 - Routing 与 Middleware
  - [ ] MDN: Server-Sent Events 与 Connection 头部
- 🛠️ 动手
  - [ ] 写一个 SSE 端点，故意挂在 nginx 后面观察 X-Accel-Buffering 的影响
  - [ ] 在 SSE 端点里手动注入 OTel span，验证下游 LLM 调用能拿到 trace_id
- ⚠️ 常见踩坑
  - 漏 X-Accel-Buffering: no 导致 nginx 缓住整条流
  - 没发 keepalive 导致中间代理空闲超时切断
  - 出错时直接 res.status(500)，前端拿到的不是 error 事件而是协议错位
- 🤔 自测题（合上文档自答）
  - [ ] 如果同一用户开两个 tab 都连了 SSE，后端怎么区分和管理？
  - [ ] SSE 端点压测时怎么模拟真实长连接？
  - [ ] Express 处理 SSE vs Fastify 有什么差异？
- ⏱️ 预估学习时长：**1–2 天**


#### Evidence

- `backagent/src/api/routes.ts`

---

## ⚡ 性能（performance）— 2 题

### Q1. 进程内预热池现在还负责冷启动吗？代码里那个 warm pool 类在做什么？

> 来源：`tp-004` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 对象池模式 | 必须掌握 | warm pool 本质是对象池，讲不清模式就讲不清细节 |
| 分层镜像/初始化 | 必须掌握 | 速度提升的最大来源就是这一招 |
| 动态扩缩策略 | 加分项 | 讲清成本控制能体现高级思维 |

#### 三档回答

**🟢 一句话**：SandboxWarmPoolService 已是空实现。acquireWarmSandbox 固定返回 null，预热改由 OpenSandbox 服务端负责。

**🔵 标准**（默认）：

sandbox-warm-pool.service.ts 的类注释写明它是 no-op stub。initialize 只记录预热池已关闭，acquireWarmSandbox 直接返回 null，getPoolStatus 给出的是空池。调用方仍能编译，但拿不到本地热实例。旧的 sandbox-proxy.service.ts 已经不在仓库里。健康检查 /health/warm-pool 读到的也是这个空状态。首次预览如果慢，要去看 OpenSandbox 的创建和 getInfo，不要沿用旧稿里“十几秒变成一秒”的数字，那个数字不在当前仓库里。

<details><summary>🔴 深挖（点击展开）</summary>

类注释写得很明确：Warm pooling is now handled server-side by OpenSandbox，这个类只是为了让旧调用方继续编译。initialize 打一行日志就返回，acquireWarmSandbox 不创建实例，getPoolStatus 的 enabled、poolSize、available 全是空值，hitRate 也是 0。所以不能再讲白天扩池、夜里缩池，也不能讲命中率。旧的 sandbox-proxy.service.ts 已删除。健康检查如果还挂着 /health/warm-pool，读到的就是这份空状态。冷启动慢的时候，只根据 OpenSandbox 的创建、getInfo 超时和 Redis 状态来查，不编造服务端池的命中率。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Apache Commons Pool - 设计文档（对象池经典实现）
  - [ ] Cloudflare 工程博客 - 关于 isolate 与 warm 实例的文章
- 🛠️ 动手
  - [ ] 本地用 docker 实现一个小型 warm pool（5 个实例），测对比冷启动 vs 池命中的耗时
  - [ ] 给池加「使用 N 次后销毁」策略，跑一晚上看资源是否不再上涨
- ⚠️ 常见踩坑
  - 实例不定期销毁导致系统资源（inode、句柄）累积
  - 池大小固定不随负载变化，要么浪费要么扛不住
  - 亲和性策略让同一坏实例反复服务同一用户，故障集中
- 🤔 自测题（合上文档自答）
  - [ ] 池子怎么探活？怎么判断实例已经不健康要销毁？
  - [ ] 如果突发流量翻倍，池没扩起来怎么办？
  - [ ] 池命中率多少算正常？太高代表什么问题？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **如果业务 99% 的请求池都能命中，那 1% 命中不到的怎么处理？**（reliability）
  > miss 时同步走完整冷启动并立刻补一个池实例，前端显示明确等待状态而不是假装已就绪；同时记录 miss 事件作为扩容信号。


#### Evidence

- `backagent/src/services/sandbox-warm-pool.service.ts`

---

### Q2. Git 接口合并子命令具体怎么做？同步 status + add + commit 之类的步骤是怎么变成一次调用的？

> 来源：`tp-006` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| git plumbing 命令 | 必须掌握 | 讲不清 plumbing/porcelain 区别就讲不清合并的可解析性 |
| shell set -e / pipefail | 必须掌握 | 复合命令的失败传播全靠这俩 |
| git stash -u 语义 | 加分项 | 失败教训对应的细节，能体现工程深度 |

#### 三档回答

**🟢 一句话**：用 set -e 加分隔标记把多个 git 子命令拼成一条复合命令一次执行，stdout 按标记切片解析。

**🔵 标准**（默认）：

原来每个 git 端点要在沙箱里串行跑 status、add、commit 这些子命令，每步付一次跨网络 RTT。重构后用 set -e 加 ASCII 分隔标记把子命令拼成一条复合命令，一次 sandbox.exec 完成，service 层按分隔标记把 stdout 切片，每段对应一个子命令的输出，错误分段也能精确定位是哪一步挂的。7 个 git 端点（包括 checkpoint）共用同一套合并逻辑。中间修了一个一致性 bug：untracked 文件原来会让 pull 误报冲突，改成 pull 前 stash -u、pull 后 stash pop，用户的临时文件不丢。

<details><summary>🔴 深挖（点击展开）</summary>

这个优化要做的就是把 N 次跨网络 RTT 收敛成 1 次。落地有几个细节。第一，shell 复合的可靠性——用 set -e 让任何子命令失败立刻中止，避免「前几步成功了但 commit 失败导致仓库半死不活」的状态。第二，输出可解析性——每一步之间打入 ASCII 分隔符（不可能在 git 输出里出现的字符），service 层按分隔符切片，每段对应一个子命令的输出，错误分段也能精确定位是哪一步挂的。第三，幂等性——合并命令前我们把每个步骤都梳理过一遍，确认重跑不会污染（比如允许空提交时要显式给 --allow-empty 还是直接报错）。代价方面，合并之后调试链路变长，没法在某一步 dry-run 看中间状态。所以我们配套加了「展开模式」，开发态可以拆回逐步执行。中间踩到一个一致性问题——untracked 文件触发 pull 假冲突。原来逻辑是 pull 前 git status 看脏，但 untracked 也算脏，所以被误判成冲突。修复是先 stash -u（包含 untracked），pull 完再 stash pop，确保用户的临时文件不丢。为什么不用 libgit2 在主进程内跑 git，省掉沙箱往返：因为沙箱里的工作区是用户的——文件、配置、凭据都在沙箱命名空间内，libgit2 跑在主进程会破坏隔离边界，而且没法用沙箱内的 git 凭据。这套优化让 git 操作的 P95 显著改善，分段解析做得严，错误定位反而比合并前更精确了。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Pro Git book - 第 10 章 Git Internals
  - [ ] git-stash(1) man page
- 🛠️ 动手
  - [ ] 写一个脚本，把 status + add + commit 合并成一条 set -e 命令，输出按分隔符切片
  - [ ] 构造一个有 untracked 文件的仓库跑 pull，复现 stash -u / pop 的修复
- ⚠️ 常见踩坑
  - 复合命令忘开 set -e，前面失败后续还在跑
  - 用 echo / printf 当分隔符不够安全，git 输出可能含同样字符
  - stash 的 -u 缺失，导致 untracked 文件被丢
- 🤔 自测题（合上文档自答）
  - [ ] 如果合并命令中的某一步偶发失败，你怎么定位是哪步？
  - [ ] 为什么不直接用 libgit2 而是 shell git？
  - [ ] checkpoint（保存点）功能是怎么基于 git 实现的？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不用 libgit2 直接在进程内跑 git，省掉沙箱往返？**（trade-off）
  > 沙箱里的工作区是用户的，文件、配置、凭据都在沙箱命名空间内；libgit2 跑在主进程会破坏隔离边界，且没法用沙箱内的 git 凭据，整体代价比省下的那次往返更高。


#### Evidence

- `backagent/src/services/git-sandbox.service.ts`
- `backagent/src/services/git-woa.service.ts`
- `backagent/src/services/checkpoint-git.service.ts`

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. Redis 主、DB 兜底的状态模型，Redis 挂了或者数据不一致时怎么办？

> 来源：`tp-005` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 缓存一致性模型 | 必须掌握 | Cache-aside / Write-through 的差异讲不清面试官会停手 |
| Redis 故障与降级 | 必须掌握 | 面试官一定会问 Redis 挂了怎么办 |
| 异步双写与队列 | 加分项 | 讲清 DB 异步路径的可靠性能加分 |

#### 三档回答

**🟢 一句话**：读写优先 Redis，失败就降级读 DB；写入异步双写到两边，重启时直接从 DB 重建 Redis。

**🔵 标准**（默认）：

状态模型是「热路径在 Redis、真相在 DB」。sandbox-state.repository 暴露统一的 get/set，内部先查 Redis，miss 或者 Redis 不可用就回退查 DB，命中了就把数据补回 Redis。写入路径同步写 Redis、异步落 DB（带重试），所以 Redis 永远是最新的。Coordinator 路由也走这层 repository，Redis 故障的时候降级路径自动触发，业务层不用感知，监控按降级标记单独看一条线。重启 Pod 不依赖 Redis 缓存——从 DB 直接重建，所以重启不是高风险操作。

<details><summary>🔴 深挖（点击展开）</summary>

「Redis 主」不是字面意义的「DB 没用」，意思是 Redis 是热路径上的权威源。一致性模型上，写入路径双写——Redis 同步、DB 异步带重试加队列；读取路径先 Redis 再 DB；缓存失效用 TTL 加主动失效双保险。Redis 一旦挂了会触发两个反应：repository 内部把读路径切到 DB 并打降级标记，告警同时触发；写路径仍然双写，但 Redis 写返回错误时不阻塞业务，DB 异步落地保证最终一致。最棘手的是 Redis 数据被错改这种场景——关键 key 我们带 schema 校验和版本号，发现 corrupt 直接 evict，回退查 DB 重建。选 Redis 主而不是 DB 主的原因很直接：sandbox 状态读写极高频，每个活跃 session 每秒都有心跳和进度更新，DB 单点扛不住这个延迟；Redis 主能命中亚毫秒读，DB 兜底只在故障或重建时承压，整体延迟和可靠性更划算。代价是要面对 Redis 故障的退化场景，所以 DB 必须真兜底，不能只是 cache 的备份；DB schema 设计上也对热字段做了索引，让重建路径不至于跑得太慢。Redis 主从切换出过一次脑裂，少量 session 状态错乱，事后我们在 Coordinator 层加了「读时校验」——比对 sandbox 实际状态和 Redis 记录，不一致就以实际状态为准重写。这套设计让我们既享受了 Redis 的延迟，又在故障时不丢业务连续性。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Redis 官方文档 - Persistence 与 Replication 章节
  - [ ] Martin Kleppmann《Designing Data-Intensive Applications》第 5 章 Replication
- 🛠️ 动手
  - [ ] 用 ioredis 写一个 cache-aside 包装器，实现 Redis miss 自动从 Postgres 回填
  - [ ] 故意 kill 掉 Redis 一段时间，看降级路径是否正确触发
- ⚠️ 常见踩坑
  - 把 Redis 当唯一存储，重启 / 故障数据全丢
  - DB 异步落地没有重试和死信，Redis 一直比 DB 新
  - 缓存失效只用 TTL，更新场景下脏读窗口很长
- 🤔 自测题（合上文档自答）
  - [ ] 怎么定义你的一致性级别？强一致还是最终一致？
  - [ ] Redis 主从切换时会有什么风险？
  - [ ] 为什么不直接 DB 主，把 Redis 当 cache？
- ⏱️ 预估学习时长：**1 周**

#### 追问（面试官深挖向）

- ⚖️ **为什么选 Redis 主 + DB 兜底，而不是简单的 DB 主 + Redis 缓存？**（trade-off）
  > sandbox 状态读写极高频，DB 单点扛不住延迟；Redis 主能命中亚毫秒读，DB 兜底只在故障/重建时承压，整体延迟 + 可靠性更划算。


#### Evidence

- `backagent/src/services/sandbox-state.repository.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q2. H5 预览从轮询重构成状态机，具体把哪些边界情况想清楚了？

> 来源：`tp-009` · scope: frontend · web · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 状态机/有限状态自动机 | 必须掌握 | 讲不清状态与转移就讲不清重构动机 |
| postMessage origin 校验 | 必须掌握 | iframe 通信安全的第一道关 |
| AbortController 取消语义 | 加分项 | 并发保护的标准答案 |

#### 三档回答

**🟢 一句话**：把启动、就绪、出错、刷新、销毁拆成显式状态；并发启动有保护；postMessage 严格校验 origin。

**🔵 标准**（默认）：

原来的 iframe 预览基本上就是「轮询能不能访问」，状态散在多个 setInterval 和 useEffect 里，刷新时偶尔会撞上「老 iframe 还没销毁、新 iframe 已经起来」的并发问题。重构之后 usePreviewStore 维护一个显式状态机：idle → starting → ready 或 error → refreshing → ready，所有转移都过 store。并发启动靠 inflight token 加 AbortController，新启动直接 abort 老的。postMessage 监听加了严格的 origin 校验防注入。HMR 这块 useH5PreviewRefresh 监听文件变化，能局部更新就不全量刷新；HMR 失败才升级到 full reload。改完之后预览启动的几类竞态基本不再出现。

<details><summary>🔴 深挖（点击展开）</summary>

状态机的价值是把「隐式时序」变成「显式转移」。具体边界情况几类。第一是并发启动：用户连点两次刷新，或者代码快速变化触发多次启动，老的 starting promise 还没 resolve 新的就来了——usePreviewStore 用 inflight token 加 AbortController，新启动直接 abort 老的，避免 ready 事件错位。第二是 origin 校验：iframe 加载的预览 URL 在用户的子域名下，postMessage 的来源必须严格匹配那个子域名，不能用 `*` 也不能用 `parent.origin` 这种宽松配置，不然恶意页面就能伪造预览事件。第三是 HMR 感知：后端 h5-preview.service 推送文件变更，前端 useH5PreviewRefresh 把变更映射到 iframe 的 HMR 通道，能局部更新就不全量刷新；HMR 失败（比如改了入口文件结构）才升级到 full reload。第四是错误回流：iframe 内的 runtime 错误通过 postMessage 回主控台，要带 frame id 和 origin，避免不同 session 的错误串台。代价方面，状态机让代码量增加，但调试成本下降，有问题直接看 store 当前状态，不用从一堆 setInterval 反推。早期没做 inflight 保护时，用户连点两次「重新启动」会出现「显示 ready 但其实是老 iframe」的不一致状态，所以现在所有异步交互都按「最近一次 win」的语义统一处理。状态机也让单测变直观——按状态转移列举测试用例，覆盖率比原来散在 useEffect 里的逻辑容易做。每条转移的入口和出口都加了一行 console.debug，需要排查时直接 grep 时序，不用再插临时日志。

</details>

#### 补齐方案

- 📚 必读
  - [ ] MDN: Window.postMessage 与 origin 安全部分
  - [ ] XState 文档 - Statecharts in 15 Minutes（状态机思维入门）
- 🛠️ 动手
  - [ ] 把一个含三个 setInterval + 多 useEffect 的小组件重构成 useReducer 状态机
  - [ ] 写一个 iframe 预览 demo，加 origin 校验和 inflight token 保护
- ⚠️ 常见踩坑
  - postMessage 用 `*` 或不校验 origin，等于把 iframe 当不可信源
  - 并发启动没有取消老任务，老的 ready 事件覆盖新状态
  - HMR 失败时不降级到 full reload，预览静默不更新
- 🤔 自测题（合上文档自答）
  - [ ] 如果 HMR 频繁失败，你怎么定位是 vite 还是网络的问题？
  - [ ] 状态机的转移用 reducer 还是单独的 action 函数？为什么？
  - [ ] iframe 内的 console.error 是怎么收集回主控台的？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不用 XState 这类状态机库，而是自己在 store 里实现？**（trade-off）
  > 状态就 5 个、转移也简单，上 XState 反而多一份 bundle 和心智负担；真要是状态超过十个、或者开始需要平行状态，我们再回头考虑。


#### Evidence

- `web/src/pages/Chat/components/preview/H5Preview.tsx`
- `web/src/hooks/useH5PreviewRefresh.ts`
- `web/src/stores/usePreviewStore.ts`
- `backagent/src/services/h5-preview.service.ts`

---

## 📈 可观测性（observability）— 1 题

### Q1. OpenTelemetry + Langfuse 怎么把 LLM 调用串到分布式 trace 里？token 用量这种 LLM 特有指标怎么落地？

> 来源：`tp-011` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| W3C Trace Context | 必须掌握 | 讲不清 trace_id / span_id 传播就讲不清串联 |
| OTel Span / Attribute | 必须掌握 | 为什么 prompt 不该进 attribute 是关键 trade-off |
| LLM 可观测性指标 | 加分项 | 讲清 token / cost / latency 三件套是 LLM 工程加分点 |

#### 三档回答

**🟢 一句话**：OTel 用 W3C Trace Context 把 LLM 调用挂到主 trace 上，Langfuse 接住 prompt 和 token 这些 LLM 特有的细节。

**🔵 标准**（默认）：

通用 trace 系统对 LLM 调用没有原生概念，prompt、token、tool 调用在它眼里都是黑盒。我们用 OTel Node SDK 在 Express handler、SSE streamManager、MCP 工具调用这几处都开 span，再通过 W3C Trace Context 把 LLM 调用 span 挂上去；Langfuse 单独作为 LLM 维度的后端，记录 prompt 文本、token 用量、cost，同样用 trace_id 跟 OTel 那条 trace 关联。这样一次用户请求从点击到 LLM token，能在 OTel UI 看到完整时序；要 prompt 细节就直接跳到 Langfuse 用同一个 trace_id 找。两边的 trace_id 共享是排查链路能串起来的关键。

<details><summary>🔴 深挖（点击展开）</summary>

把 LLM 纳入分布式 trace 难在两件事：一是 LLM 调用属于哪条 span，二是 prompt、token 这些非标准字段放哪。我们的做法分四步。第一，所有入口——Express handler、SSE 长连接、tool handler——都开 OTel span，进 LLM 调用前从当前 context 取 trace_id 透传给 Langfuse 客户端，让两边的 trace_id 一致。第二，prompt 文本、token 用量、cost 这些 LLM 特有维度不塞 OTel attribute（attribute 长度有限，也不适合大段文本），而是写到 Langfuse；OTel 这边只记关键标量——model_name、prompt_tokens、completion_tokens、duration——方便聚合告警。第三，密钥脱敏放在写 Langfuse 之前做，免得 prompt 里把 API key 漏出去；脱敏规则用一份正则表，匹配到的 token 直接替换成占位符，规则随系统增加新的密钥源持续更新。第四，OTel collector 临时不可达时 SDK 自己有内存缓冲和重试，Langfuse 客户端也有本地队列，避免数据点直接丢。代价方面，双后端意味着维护两套 SDK、两份成本，但好处是 OTel 解决「全链路定位」，Langfuse 解决「LLM 特有可观测」，让一个系统兼顾两边都得凑合。早期 OTel attribute 里塞了完整 prompt，导致后端导出超大、采样率被迫拉低；后来把大文本剥离到 Langfuse、OTel 只留标量，导出量回到健康水平。现在排障路径是「先看 OTel 哪步慢或出错，再到 Langfuse 看 prompt 细节」。代价是两边的告警规则要分别维护，OTel 那边告慢、告错率，Langfuse 那边告 token 暴涨、cost 异常，做一致的服务概念视图需要在仪表盘层做关联。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OpenTelemetry 官方文档 - Trace Context Propagation
  - [ ] Langfuse 官方文档 - Tracing 与 OpenTelemetry 集成
- 🛠️ 动手
  - [ ] 在一个 Express + Anthropic SDK 的小项目里接入 OTel + Langfuse，验证两边 trace_id 一致
  - [ ] 故意让某次 LLM 调用超时，从 trace 里定位卡在哪一步
- ⚠️ 常见踩坑
  - 把整段 prompt 塞 OTel attribute，导致 exporter 流量爆炸
  - trace_id 透传断在某一层，导致 LLM span 不在主 trace 下
  - prompt 落 Langfuse 前忘了脱敏，API key / token 被记录
- 🤔 自测题（合上文档自答）
  - [ ] 如果 OTel collector 暂时不可达，trace 数据怎么办？
  - [ ] 怎么决定哪些字段进 OTel、哪些进 Langfuse？
  - [ ] 采样率怎么设？高流量场景怎么不丢关键 trace？
- ⏱️ 预估学习时长：**1–2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不直接把 Langfuse 当 trace 后端，省掉 OTel？**（trade-off）
  > Langfuse 是专门给 LLM 设计的，对非 LLM 的 span（DB、Redis、沙箱）支持很薄；OTel 是行业标准，能接所有现有基础设施——两边各管一摊更划算。


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `backagent/src/services/streamManager.ts`

---

## 🔒 安全（security）— 1 题

### Q1. 上传和部署这两条入口，你怎么避免大请求白占内存，以及带易失数据的项目被直接发出去？

> 来源：`tp-007` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Feature flag 模式 | 必须掌握 | 讲不清 release toggle / ops toggle 区别就讲不清这套发布 |
| Blast radius 思维 | 必须掌握 | 中级以上必须能解释为什么不全量 |
| 前后端权限分层 | 加分项 | 讲清「前端只是 UI 隐藏」是体现安全意识的关键 |

#### 三档回答

**🟢 一句话**：上传先校验 Origin 再解析 body。部署只在 isEphemeralStorage 为 true 时要求确认丢失原因。

**🔵 标准**（默认）：

user-upload.routes.ts 把 Origin 校验放在 express.json 前面。当前 body 上限是 1GB，如果先解析再拒绝，不被允许的来源也会先占内存。DeployTabPanel 在发起部署前调用存储预检，只有 isEphemeralStorage 为 true 才打开确认框并展示 ephemeralReason。2026-09-02 去掉了 readError 也拦截的判断，预检读取失败不再单独挡住部署。feature-whitelist.ts 和 Pod 内存双态展示已经不在当前仓库，不能再讲成现状。

<details><summary>🔴 深挖（点击展开）</summary>

上传这条要先挡住，再解析。user-upload.routes.ts 的注释写明 Origin 校验必须在 body 解析之前，否则任意不被允许的 Origin 也能先触发巨量 JSON 解析。中间件先调 assertUploadOriginAllowed，通过后才挂 express.json，limit 是 1GB。没有 Origin 头时按集群内网直连放行。部署这边，executeAgentDeploy 先调 getStoragePreflight。确认框只在 isEphemeralStorage === true 时打开，并把 ephemeralReason 放进提示。注释里还留着 readError 也要拦截的旧说法，但判断条件已经只剩这一条。feature-whitelist.ts 不在当前仓库，Pod 内存双态也不要再讲。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Martin Fowler - Feature Toggles 文章
  - [ ] OWASP Cheat Sheet - Authorization 章节
- 🛠️ 动手
  - [ ] 在小 Express 项目里实现「白名单 + feature flag」双闸门，前端按 flag 隐藏入口、后端按白名单拒绝请求
  - [ ] 为某个表单字段做双态 UI，对比改造前后用户的困惑度
- ⚠️ 常见踩坑
  - 只在前端做 flag 判断，浏览器一改就绕过
  - feature flag 上线后没清理，长期堆成几百个开关
  - 灰度数据没采集，发布完不知道效果
- 🤔 自测题（合上文档自答）
  - [ ] 如果用户改 flag 绕过前端，你怎么防？
  - [ ] 灰度发布到一定比例之后下一步怎么走？
  - [ ] feature flag 怎么不变成屎山？
- ⏱️ 预估学习时长：**半天**

#### 追问（面试官深挖向）

- ⚖️ **为什么确认框只看 isEphemeralStorage，预检读取失败不再拦截？**（trade-off）
  > 2026-09-02 的提交把拦截条件收成 isEphemeralStorage === true。读取失败不再单独弹框，避免预检异常把正常部署挡住。注释还留着旧说法，以判断条件为准。


#### Evidence

- `backagent/src/api/routes/user-upload.routes.ts`
- `web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

