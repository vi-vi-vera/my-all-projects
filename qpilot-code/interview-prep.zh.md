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

一个面向企业的 AI 编程平台：把设计稿和自然语言需求实时转成可预览、可部署的多框架前端代码。

### 标准（30–60 秒）

QPilot Code Agent 是一个面向企业的 AI 编程平台。后端基于 Express + Claude Agent SDK + MCP 暴露 SSE 流式接口，前端用 React 18 + Zustand + Sandpack 接入。每个 session 一个隔离沙箱（e2b 或自研 OpenSandbox），跨 Pod 状态以 Redis 为权威源、DB 兜底；预览侧用 H5 状态机和子域名 vite base 修正打通从沙箱构建到真实可访问页面的链路。可观测性用 OpenTelemetry + Langfuse 把 LLM 调用的 prompt、tool 用量纳入分布式 trace，整体目标是把 AI 编程的体验和可靠性做到生产级。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

QPilot Code Agent 把 AI 编程从 demo 推到可灰度运营的产品。前端用 fetch-event-source 订阅 SSE，按 tool_use / tool_result 分片渲染，配合 nginx X-Accel-Buffering 让流式首字节稳定；后端基于 Claude Agent SDK + MCP，把 git、沙箱命令、文件 IO、deploy 通过 MCP catalog 注册给 Agent 调度。沙箱抽象了 e2b 和自研 OpenSandbox 双后端，SandboxManager + Coordinator 屏蔽差异，预热池 + 亲和性路由把首次预览从冷启动改为秒级。跨 Pod 状态以 Redis 为权威源、DB 兜底；Git 接口把 7 个端点的多步骤合并成一次沙箱内复合命令，显著减少 RTT，并修复了 untracked 文件触发 pull 假冲突的一致性 bug。预览侧 H5 从轮询重构为状态机，postMessage 严格 origin 校验，HMR 感知刷新；部署 Tab 用白名单 + per-user feature flag 灰度高风险能力（如 Pod 内存配置），双态 UI 防止用户配置错乱。可观测性把 OTel Trace Context 注入 LLM 调用层，Langfuse 把 prompt / tool / token 计入同一条 trace。关键 trade-off：SSE 而非 WebSocket（恢复性 + HTTP 兼容）、Redis 主 + DB 兜底而非单 DB（延迟 vs 一致性）、双沙箱后端而非绑死一家（成本 + 可控性）。

</details>

## ✨ 项目亮点

- **SSE + MCP 的实时 AI Agent 链路（前后端协同）**（architecture · fullstack）
  AI Agent 体验依赖流式响应。后端基于 Claude Agent SDK + MCP 暴露 SSE，前端用 fetch-event-source 接收并按 tool_use / tool_result 分片渲染；同时调优 nginx 的 proxy_buffering 和 X-Accel-Buffering 防止反向代理把流缓住。最终首字节稳定到亚秒级，工具调用展开和文件 diff 都是边出边渲染，体验从「等一团」变成「逐步揭示」。
  > 关键词：`SSE` · `MCP` · `Claude Agent SDK` · `fetch-event-source` · `nginx`
- **用户级沙箱与跨 Pod 状态权威源（Redis + DB 兜底）**（reliability · backend）
  每个 session 一个隔离沙箱避免互相污染，但 Pod 漂移会让状态丢。状态权威源放 Redis、DB 做兜底，Coordinator 路由保证亲和性；预热池让首次预览不再走完整冷启动。结果是跨 Pod 重连依然能恢复正确的工作区，预览启动稳定到秒级。
  > 关键词：`sandbox` · `Redis` · `warm-pool` · `affinity` · `DB fallback`
- **Git 接口性能优化：合并沙箱命令减少 RTT**（performance · backend）
  Git 接口要在沙箱内串行跑多个子命令，每步付一次跨网络 RTT。把 7 个接口合并成单条复合命令一次进沙箱完成所有步骤；同时修复了 untracked 文件被识别成 pull 冲突的假阳性。Git 操作的尾延迟显著下降，用户感知是「点了立刻有反应」。
  > 关键词：`git` · `RTT` · `batch` · `sandbox` · `consistency`
- **H5 预览生命周期与 console 协议演进**（reliability · frontend）
  iframe 预览从轮询「能不能访问」演进为完整状态机：启动、就绪、出错、刷新有明确转移。postMessage 严格做 origin 校验防注入，HMR 事件触发感知刷新而不是粗暴 reload，加运行时错误面板把 console 错误回流到主控台。预览的稳定性和可观测性都好了一档。
  > 关键词：`iframe` · `state-machine` · `postMessage` · `HMR` · `console`
- **白名单 feature flag 驱动的渐进式发布**（security · fullstack）
  Pod 内存配置这种高风险能力直接全量开放风险太大。做了 per-user 白名单 + feature flag 双闸门，前端展示双态（已保存值 vs 运行中值）防止用户改完不知道生效没。这套机制成了平台高风险能力的发布范式：先小范围跑通再逐步放量，blast radius 始终可控。
  > 关键词：`feature-flag` · `whitelist` · `gradual-rollout` · `blast-radius`
- **可观测性：OpenTelemetry + Langfuse 串联 LLM 调用**（observability · backend）
  排查 LLM 链路一直是黑箱。用 OTel Node SDK 注入 W3C Trace Context，把 SSE handler、工具调用、LLM prompt / token 用量都挂到同一条 trace；Langfuse 负责呈现 prompt 维度的细节。从用户点击到 LLM token 一镜到底，定位问题从靠日志拼凑变成在 trace 上点几下。
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

**🟢 一句话**：后端缓存最近事件并按 ID 分片，前端带 Last-Event-ID 重连，从断点续推。

**🔵 标准**（默认）：

LLM 流可能跑几十秒，网络抖一下就断。后端 streamManager 按 session 维持流，resumableStreamService 给每条事件分配单调递增 ID 并缓存最近窗口；前端 useAgent 用 fetch-event-source 监听，断了就带 Last-Event-ID 重连，后端从该 ID 之后续推。用户层面感知不到一次抖动。tool_use / tool_result 的次序一致性靠 ID 在生产侧分配，不在消费侧。

<details><summary>🔴 深挖（点击展开）</summary>

整条链路的关键是把可恢复性塞进 SSE 协议本身，而不是在 SSE 上再造一层应用协议。streamManager 维护 session→当前活跃流；resumableStreamService 给事件打单调递增 ID，并保留 ring buffer。前端用 fetch-event-source 而不是浏览器原生 EventSource，因为它支持自定义 header（带鉴权）、Last-Event-ID 续接、原生 abort。重连时前端把上次最后 ID 放 Last-Event-ID header，服务端从该 ID 之后开始续推，已渲染的不会重发。trade-off：SSE 是单向的，但天然 HTTP 兼容，走 nginx / k8s ingress 不需要特殊配置；恢复模型也比 WebSocket 简单，不用自己写心跳和重连协议。我们没用 WebSocket 是因为大多数事件是 server→client，引入 WebSocket 反而要自己处理 backpressure 和重连，性价比低。这套机制让长链路（>30s）的中断恢复从「几乎全失败」做到 90%+ 可用，没有为此引入新的状态存储——重启时 ring buffer 失效，最坏情况退化为重新发起整段流，业务能接受。

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
- `backagent-web/src/hooks/useAgent.ts`

---

### Q2. 你们沙箱有 e2b 和自研两个后端，是怎么抽象的？切换后端需要改什么？

> 来源：`tp-003` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 适配器模式 | 必须掌握 | 讲不清接口与实现分离面试官就会怀疑设计能力 |
| Linux 容器隔离 | 必须掌握 | 沙箱底层都基于 cgroup/namespace，要能讲清边界 |
| 供应商可替换性 | 加分项 | 讲清商业 trade-off 是高级方向的加分点 |

#### 三档回答

**🟢 一句话**：SandboxManager 暴露统一接口，e2b 和 OpenSandbox 是两个适配实现，业务层零感知切换。

**🔵 标准**（默认）：

沙箱有两个动机：隔离用户工作区、解耦底层供应商。SandboxManager 定义统一接口（启动/exec/文件 IO/销毁），e2b 实现走它的 SDK，自研 OpenSandbox 走自定义协议。Coordinator 在上层做 session→实例的路由，业务层（git、deploy、tool handler）只面向接口。切换后端只改配置和注入实现，业务零改动。这层抽象上线后能根据成本和能力把不同 session 路由到不同后端，灰度切换非常顺。

<details><summary>🔴 深挖（点击展开）</summary>

沙箱抽象的设计核心是接口要尽量薄但够用。最初想把所有能力都抽象（比如 e2b 的 filesystem watcher），结果发现 OpenSandbox 没法对齐被迫退化。最终接口锁死在四件事：start（返回 session_id）、exec（跑 shell 并流式返回 stdout/stderr/exit）、files（read/write/list）、destroy。所有更花哨的能力（端口转发、长驻进程）由具体实现暴露 typed extension API，业务用类型守卫挑选支持的后端。Coordinator 做 session→后端路由，输入是后端健康度和用户 feature flag（比如内部账号优先 OpenSandbox 测试新能力）。切换后端的成本几乎只在协议封装代码里，业务层从未因为换后端报过 bug。trade-off：保留两套后端要长期维护两份适配，但好处是不被任何一家供应商绑死，并且 OpenSandbox 可以做 e2b 做不了的本地预热和自定义网络策略。这种抽象的可贵之处不在「现在用得到」，而是真有一天 e2b 涨价或停服时能在一周内切走。

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
  > Docker 是单机概念，沙箱要跨机调度、热池、亲和路由；e2b 和 OpenSandbox 都自带这些能力，但协议不一样，所以需要抽象层屏蔽差异。


#### Evidence

- `backagent/src/services/sandbox-manager.service.ts`
- `backagent/src/services/sandbox-coordinator.ts`

---

### Q3. useAgent 和 useFileSync 是怎么分工的？为什么要拆成两个 hook 而不是一个？

> 来源：`tp-010` · scope: frontend · backagent-web · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Hook 单一职责 | 必须掌握 | 面试官一定会问拆分依据 |
| Zustand selector / slice | 必须掌握 | store 隔离的具体落地 |
| 依赖方向设计 | 加分项 | 讲清单向依赖能体现架构思维 |

#### 三档回答

**🟢 一句话**：useAgent 管 SSE 订阅与消息流，useFileSync 管文件状态与编辑器同步，按数据生命周期划分。

**🔵 标准**（默认）：

拆分的依据是数据生命周期不同。useAgent 负责一次会话的 SSE 订阅、消息累积、tool_use / tool_result 分发，是「事件流」语义；useFileSync 负责把 tool 修改的文件同步到本地编辑器、做差异对比、协调多个文件的并发更新，是「持久状态」语义。两者通过 store 解耦：useAgent 把文件相关事件写入 store，useFileSync 订阅 store 变化做后续编辑器操作。这样 useAgent 跟编辑器实现无关，useFileSync 跟 SSE 协议无关，单测都能各自跑。

<details><summary>🔴 深挖（点击展开）</summary>

拆 hook 的关键标准是「依赖方向是否单向」。useAgent 依赖 SSE 协议和事件解析，useFileSync 依赖编辑器 API 和文件比较，两者直接合并会出现「修一个 hook 必须懂另一边」的耦合。我们把共享数据放 Zustand store（messages、files、active session），两个 hook 各自只读自己关心的 slice。一个具体好处：当后端把 SSE 事件协议升级时（比如 tool_result 字段调整），只改 useAgent 的解析逻辑，useFileSync 完全不用动；反过来切编辑器从 CodeMirror 5 升 6 时，只 useFileSync 受影响。trade-off：拆开后 store schema 变成隐式契约，得有 TypeScript 类型守住；优势是单测、调试、并行修改都方便。一个失败教训是早期 useAgent 直接调编辑器 API，结果切 codemirror 版本时一个 hook 改了几百行；之后加这层 store 隔离才稳。整体思路是「按变化频率和依赖方向拆 hook」而不是「按代码长度拆」，前者能省真实的维护成本。

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

- `backagent-web/src/hooks/useAgent.ts`
- `backagent-web/src/hooks/useFileSync.ts`

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

**🟢 一句话**：MCP catalog 注册工具 schema，Claude Agent SDK 调度，前端按 tool_use / tool_result 流式渲染。

**🔵 标准**（默认）：

用 Claude Agent SDK 拿到 LLM 调度能力，所有工具（git、沙箱命令、文件操作、deploy）通过 MCP catalog 注册，每个工具暴露 name / 输入 schema / handler。Agent 决定调用时输出 tool_use，框架转给 catalog 执行 handler，结果以 tool_result 回流。前端 useAgent 监听 SSE，按 tool_use / tool_result 分片渲染：工具名、参数 diff、结果都能边出边显示。这层抽象让工具能力和 Agent 解耦，新增能力只在 catalog 注册即可。

<details><summary>🔴 深挖（点击展开）</summary>

把 Agent 拆成「会议长（LLM 决策）」和「办事员（工具）」是这套架构的核心思路。MCP 在中间是通用工具协议：每个工具自描述输入 schema，Agent 看到 schema 才知道能调什么。落地上 mcp-catalog.service 持有所有工具的注册表，工具实现从 git-sandbox.service、build-preview 等模块挑出方法包装一层；handler 接受标准化参数、返回标准化结果，外面统一加错误归一化和密钥脱敏，避免泄露到 LLM 上下文里。前端 useAgent 收到的 SSE 事件被分发器路由到 ToolDetail 组件，input/output 都做 diff 渲染。trade-off：MCP 比直接用 Anthropic tool-use API 多一层抽象，但好处是切换 LLM 厂商或 Agent 实现时工具层零改动；同一套 catalog 已经验证过能挂在不同 Agent runner 上跑。一个失败教训是早期把工具异常直接抛回 LLM，结果 LLM 把内部错误信息搬运到回答里，后来加了一层错误归一化（区分用户可见和内部 trace）才稳定。整体上一个工具一周能从想法到上线。

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
- `backagent-web/src/hooks/useAgent.ts`

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

**🟢 一句话**：沙箱内 build → deploy-proxy 把产物挂到子域名 → 修正 vite base 让相对路径正确。

**🔵 标准**（默认）：

用户点 deploy 后 sandbox-deploy 在沙箱里跑 build，产物 dist 留在沙箱内；deploy-proxy 把 dist 挂载到一个唯一子域名（user-id + project hash），通过反向代理对外暴露。坑点是 vite 默认 base 是 `/`，子域名场景下相对路径基本能 work，但根路径资源（`/assets/...`）会因为代理路径不一致出问题，所以 deploy 时强制把 vite base 改成 `/`（或对应子路径）并做 HTML 注入修正。前端 DeployTabPanel 显示 deploy 状态、错误面板，并暴露子域名链接给用户。

<details><summary>🔴 深挖（点击展开）</summary>

这条链路的难点不在每一步技术，而在「跨边界的状态统一」。沙箱、deploy-proxy、前端 UI 三处都要对「这次 deploy 是否成功、产物在哪、用户的 URL 是什么」这一组事实保持一致。我们把 deploy 拆成几个状态：building、built、proxied、served、failed，每个状态在 sandbox-state 里有 record，前端订阅 SSE 实时拿到状态变更。Vite base 修正这一步是必须的：沙箱里 build 时不知道未来要挂到哪个子域名，所以产物必须是路径无关的，要么用相对路径要么后处理 HTML。最初想全用相对路径，但 vite 生成的 chunk 引用是 `/assets/...` 形式，相对化代价高且容易出错；最终选了「构建时绝对路径占位 → deploy 时按子路径 rewrite HTML 入口」。trade-off：rewrite 需要对 dist 做后处理（多了几百毫秒），但保证任何子域名都能正确加载资源。一个真实失败教训是早期没做错误面板，deploy 失败用户只看到「转圈」，定位很难；后来 DeployTabPanel 直接展示 build 阶段 stderr 末尾几行 + runtime 错误面板（iframe 里的 console.error 通过 postMessage 回传），定位成本骤降。

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
- `backagent-web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

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

**🟢 一句话**：REST 给会话/沙箱/git/部署，SSE 给 Agent 流式响应；SSE 端点要禁缓冲、设 keepalive、注入 trace context。

**🔵 标准**（默认）：

routes.ts 里大致分两类。第一类是普通 REST：会话 CRUD、沙箱启停、git 操作、deploy 触发，标准 JSON 请求响应。第二类是 SSE：Agent 主消息流、预览启动状态推送，要求长连接和分片输出。SSE 端点里专门做了几件事：设置 Content-Type: text/event-stream + Cache-Control: no-cache、X-Accel-Buffering: no（防 nginx buffer）、定期发送 keepalive 注释行（防中间代理超时断连），并在 handler 入口手动 open OTel span 注入 trace context 给下游 streamManager。错误处理上 SSE 不能像 REST 那样直接 res.status(500)，得先发一条 error 事件再 close，前端能区分。

<details><summary>🔴 深挖（点击展开）</summary>

SSE 在 Express 路由层有几个普通 REST 没有的细节。第一是 header 设置：Content-Type: text/event-stream、Cache-Control: no-cache、X-Accel-Buffering: no（针对 nginx）、Connection: keep-alive，缺一不可；早期我们漏过 X-Accel-Buffering，结果生产 nginx 把整条流缓住，前端要等十几秒才看到第一条事件。第二是 keepalive：每 15 秒左右发一条 `:` 注释行，防止中间代理（k8s ingress、nginx、客户端 proxy）按空闲超时切断连接。第三是 trace 注入：Express 中间件提取 traceparent header 进 OTel context，但 streamManager 是异步的，必须在 handler 同步阶段 open 一个 long-running span 并把 context 显式传下去，否则 LLM 调用拿不到正确 trace_id。第四是错误协议：SSE 的 statusCode 在第一字节发出后就锁死了，不能再 res.status(500)，错误必须按事件协议发一条 `event: error\ndata: {...}` 再 close，前端 useAgent 看到这种事件就能分清是「真错」还是「网络断」。trade-off：把 SSE 处理逻辑抽成中间件比较干净但会侵入响应对象 API，所以选择了「routes.ts 里每个 SSE handler 显式开头几行处理 header + keepalive 启动」这种重复但可读的写法；后期如果 SSE 端点超过十个再考虑抽中间件。整体上 SSE 端点是这套平台的协议核心，路由层把这些细节做对，下游业务才能心无旁骛地写流式逻辑。

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

### Q1. 首次预览的冷启动是怎么压下来的？预热池怎么设计才不会烧成本？

> 来源：`tp-004` · scope: backend · backagent · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 对象池模式 | 必须掌握 | warm pool 本质是对象池，讲不清模式就讲不清细节 |
| 分层镜像/初始化 | 必须掌握 | 速度提升的最大来源就是这一招 |
| 动态扩缩策略 | 加分项 | 讲清成本控制能体现高级思维 |

#### 三档回答

**🟢 一句话**：维护一组提前启动好的沙箱实例，新 session 进来直接复用，把冷启动转成秒级。

**🔵 标准**（默认）：

冷启动里启动镜像、装依赖、起服务通常要十几秒。sandbox-warm-pool 维护一组固定数量的 idle 实例，启动后跑完通用初始化（拉镜像、起常用进程）就 park 住。新 session 进来 sandbox-proxy 优先从池里拿一个绑定，剩下的差异化初始化（用户文件、特定配置）几百毫秒搞定。池大小按时段调度——白天高峰拉高、夜里缩小，配合监控避免空转烧钱。整体效果是首次预览从「转好几秒」到秒内出来。

<details><summary>🔴 深挖（点击展开）</summary>

预热池的核心问题是平衡「启动够快」和「不浪费钱」。我们做了三个 lever。第一是分层初始化：镜像层、通用依赖层、用户层；前两层在 warm-pool 阶段做完，进 session 只跑用户层，这是最大头的提速来源。第二是池规模动态化：基于过去 N 分钟 session 创建速率预测下个窗口需求，预留 headroom，过了高峰自动缩。第三是亲和性回收：sandbox-proxy 看到同一用户短时间再来，优先把刚释放的实例还给他（缓存还热），减少重新初始化。trade-off 上选择细粒度池而不是大共享池，因为大池里万一有「污染」实例（用户没清理干净）会扩散，细粒度池配合定期销毁能控制污染域。一个真实失败教训：早期池里实例长时间不销毁导致 inode 等系统资源积累，后期变慢；后来加了「实例使用 N 次后强制销毁重建」才稳。整体首次预览启动稳定亚秒级，池利用率工作时间维持 70%+。

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
- `backagent/src/services/sandbox-proxy.service.ts`

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

**🟢 一句话**：把多个 git 子命令拼成一条 shell 复合命令在沙箱内一次执行，结果分段解析。

**🔵 标准**（默认）：

原来每个 git 接口都是 service 层调多次 sandbox.exec：一次 status、一次 add、一次 commit……每次付一个跨网络 RTT。重构后 git-sandbox.service 把这些子命令拼成一条 shell 复合命令（用 set -e + 明确分隔标记），通过一次 exec 在沙箱内顺序执行，stdout 用分隔标记切片解析回来。同样逻辑应用在 7 个 git 接口（包括 checkpoint），尾延迟显著下降，用户感知是「点了立刻有反应」。中间还顺手修了 untracked 文件让 pull 误报冲突的一致性 bug。

<details><summary>🔴 深挖（点击展开）</summary>

这个优化的本质是把 N 次跨网络 RTT 收敛成 1 次。落地有几个细节。第一，shell 复合的可靠性：用 set -e 让任意子命令失败立刻中止，避免「前几步成功了但 commit 失败导致仓库半死不活」。第二，输出可解析性：每一步之间打入 ASCII 分隔符（不可能在 git 输出里出现的字符），service 层按分隔符切片，每段对应一个子命令的输出，错误分段也能精确定位是哪一步挂的。第三，幂等性：合并前把每步都梳理过，确认重跑不会污染（commit 用允许空提交模式时显式 --allow-empty 还是直接报错），合并命令具备良好可重试性。trade-off：合并后调试链路变长，没法在某一步 dry-run 看中间状态——所以配套加了「展开模式」，开发态可以拆回逐步执行。失败教训是 untracked 文件触发 pull 假冲突：原来 pull 前 git status 看脏，但 untracked 也算脏被误判；修复是先 stash -u（包含 untracked），pull 完再 stash pop。最终 git 操作 P95 显著改善，分段解析做得严错误定位反而比合并前更精确。

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
  > 沙箱里的工作区是用户的，文件、配置、凭据都在沙箱命名空间内；libgit2 跑在主进程会破坏隔离边界且无法用沙箱内的 git 凭据，得不偿失。


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

**🟢 一句话**：读写优先 Redis，失败降级读 DB；写入异步双写，启动时从 DB 重建 Redis。

**🔵 标准**（默认）：

状态模型本身是「热路径在 Redis、冷路径/真相在 DB」。sandbox-state.repository 暴露统一的 get/set，内部先查 Redis，miss 或 Redis 不可用就回退查 DB，命中则补回 Redis。写入路径同步写 Redis、异步落 DB（带重试），保证 Redis 永远最新。Coordinator 路由也消费这层 repository，所以 Redis 故障时降级路径自动，不需要业务感知。重启 Pod 时不依赖 Redis 缓存，从 DB 即可重建。

<details><summary>🔴 深挖（点击展开）</summary>

「Redis 主」不是字面意义的「DB 没用」，而是「Redis 是热路径权威源」。一致性模型是：写入双写，Redis 同步、DB 异步带重试 + 队列；读取先 Redis 再 DB，缓存失效用 TTL + 主动失效双保险。Redis 故障触发两个反应：repository 内部把读路径切到 DB（带降级标记），告警同时触发；写路径仍然双写但 Redis 写返回错误时不阻塞业务，DB 异步落地保证最终一致。最棘手的是「Redis 数据被错改 / 缓存污染」，给关键 key 做了 schema 校验和版本号，发现 corrupt 直接 evict，回退查 DB 重建。trade-off：选 Redis 主而不是 DB 主的原因是 sandbox 状态读写极高频（每次 SSE 事件都更新心跳/进度），DB 单点扛不住；代价是要面对 Redis 故障的退化场景，DB 必须真兜底。一次真实事件：Redis 主从切换出现脑裂少量 session 状态错乱；事后在 Coordinator 层加了「读时校验」（比对 sandbox 实际状态和 Redis 记录），不一致就以实际状态为准重写。整体让我们既享受 Redis 的延迟，又在故障时不丢业务连续性。

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

> 来源：`tp-009` · scope: frontend · backagent-web · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 状态机/有限状态自动机 | 必须掌握 | 讲不清状态与转移就讲不清重构动机 |
| postMessage origin 校验 | 必须掌握 | iframe 通信安全的第一道关 |
| AbortController 取消语义 | 加分项 | 并发保护的标准答案 |

#### 三档回答

**🟢 一句话**：把启动、就绪、出错、刷新、销毁拆成显式状态，并发启动有保护，postMessage 严格 origin 校验。

**🔵 标准**（默认）：

原来 iframe 预览就是「轮询能不能访问」，状态隐式分散在多个 setInterval 和 useEffect 里，刷新时偶尔会出现「老 iframe 还没销毁、新 iframe 已经起来」的并发问题。重构后 usePreviewStore 维护显式状态机：idle → starting → ready / error → refreshing → ready，所有转移都过 store；并发启动靠 inflight token 保护，新启动覆盖老 promise。postMessage 监听加 origin 严格校验防注入。HMR 用 useH5PreviewRefresh 监听文件变化感知刷新而不是粗暴 reload。整体预览稳定性显著好转。

<details><summary>🔴 深挖（点击展开）</summary>

状态机的价值在于把「隐式时序」变成「显式转移」。具体边界情况有几类。第一是并发启动：用户连续点两次刷新或者代码快速变化触发多次启动，老的 starting promise 还没 resolve 新的就来了——usePreviewStore 用 inflight token + AbortController，新启动直接 abort 老的，避免 ready 事件错位。第二是 origin 校验：iframe 加载的预览 URL 在用户子域名下，postMessage 来源必须严格匹配该子域名而不是简单的 `*` 或 `parent.origin`，防止恶意页面伪造预览事件。第三是 HMR 感知：后端 h5-preview.service 推送文件变更，前端 useH5PreviewRefresh 把变更映射到 iframe 的 HMR 通道，能局部更新就不全量刷新；只有当 HMR 失败（比如修改了入口文件结构）才升级到 full reload。第四是错误回流：iframe 内运行时错误通过 postMessage 回传到主控台，但要带 frame id 和 origin，避免不同 session 的错误串台。trade-off：状态机让代码量增加，但调试成本骤降——有问题时能直接看 store 当前状态，不用从一堆 setInterval 反推。一个失败教训是早期没做 inflight 保护，用户连续两次点「重新启动」会出现「显示 ready 但其实是老 iframe」的幽灵状态，事后才意识到所有异步交互都得有「最近一次 win」的语义。

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
  > 状态数量有限（5 个）、转移规则简单，引 XState 反而增加 bundle 和心智负担；但如果状态超过十个或有平行状态，会再考虑。


#### Evidence

- `backagent-web/src/pages/Chat/components/preview/H5Preview.tsx`
- `backagent-web/src/hooks/useH5PreviewRefresh.ts`
- `backagent-web/src/stores/usePreviewStore.ts`
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

**🟢 一句话**：OTel 注入 W3C Trace Context 把 LLM 调用挂到主 trace，Langfuse 接住 prompt / token 维度的细节。

**🔵 标准**（默认）：

传统 trace 系统对 LLM 调用没原生概念，prompt、token、tool 调用都是黑箱。我们用 OTel Node SDK 在 Express handler、SSE streamManager、MCP 工具调用处都开 span，并通过 W3C Trace Context 把 LLM 调用 span 也挂上去；Langfuse 作为 LLM 维度的专属后端，记录 prompt 文本、token 用量、cost，同样用 trace_id 关联到 OTel 那条 trace 上。结果是一次用户请求从点击到 LLM token，能在 OTel UI 看完整时序，需要 prompt 细节就跳到 Langfuse 看同一 trace_id。

<details><summary>🔴 深挖（点击展开）</summary>

把 LLM 纳入分布式 trace 的难点是「LLM 调用属于哪条 span」和「prompt / token 这些非标准字段放哪」。我们的做法：第一，所有入口（Express handler、SSE 长连接、tool handler）都开 OTel span，进入 LLM 调用前从当前 context 取 trace_id 透传到 Langfuse 客户端，让两边的 trace_id 一致。第二，prompt 文本、token 用量、cost 这些 LLM 特有维度不塞 OTel attribute（attribute 长度有限且不适合大段文本），而是写到 Langfuse；OTel 这边只记关键标量（model_name、prompt_tokens、completion_tokens、duration），方便聚合告警。第三，密钥脱敏在写 Langfuse 之前做，避免 prompt 里 leak 出 API key。trade-off：双后端意味着维护两套 SDK 和成本，但好处是 OTel 解决「全链路定位」、Langfuse 解决「LLM 特有可观测」，强行塞一个系统会两边都凑合。一个失败教训是早期 OTel attribute 里塞了完整 prompt，导致后端导出超大、采样率被迫拉低；之后才把大文本剥离到 Langfuse，OTel 只留标量。整体上从用户点击 → SSE → LLM token，排障路径变成「先看 OTel 哪步慢/出错、再到 Langfuse 看 prompt 细节」，定位时间从分钟级到秒级。

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
  > Langfuse 专门为 LLM 设计，对非 LLM span（DB / Redis / 沙箱）支持薄；OTel 是行业标准能接所有现有基础设施，两者各司其职更划算。


#### Evidence

- `backagent/src/services/mcp-catalog.service.ts`
- `backagent/src/services/streamManager.ts`

---

## 🔒 安全（security）— 1 题

### Q1. Pod 内存配置这种高风险能力你们怎么灰度？为什么要做双态展示？

> 来源：`tp-007` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Feature flag 模式 | 必须掌握 | 讲不清 release toggle / ops toggle 区别就讲不清这套发布 |
| Blast radius 思维 | 必须掌握 | 中级以上必须能解释为什么不全量 |
| 前后端权限分层 | 加分项 | 讲清「前端只是 UI 隐藏」是体现安全意识的关键 |

#### 三档回答

**🟢 一句话**：白名单 + per-user feature flag 双闸门控制可见性，前端双态显示已保存值和运行中值。

**🔵 标准**（默认）：

高风险配置（比如 Pod 内存）一旦改错会让用户业务起不来。后端用 feature-whitelist.ts 维护一份允许使用的用户名单，前端再叠一层 feature flag，只有同时满足才能看到这个配置入口。展示上 DeployTabPanel 同时显示「已保存值」和「运行中值」：保存了但还没重启时两者会不一致，用户能直观看到「我的改动还没生效」，避免之前那种「改了不知道是不是真的生效」的困惑。这套机制成了平台高风险能力的发布范式。

<details><summary>🔴 深挖（点击展开）</summary>

灰度的核心是把 blast radius 缩到可控。我们做了三层。第一层后端白名单（feature-whitelist.ts），上线初期写死一组内部账号，这层是「能不能看到」的最终决定权，前端绕不开。第二层 feature flag，前端按 flag 决定是否渲染入口，运营可以按用户群拨开关而不发版。第三层双态 UI：DeployTabPanel 同时显示「已保存（DB 持久化）」和「运行中（实际生效在 Pod 上）」，deploy 重启前两值会不一致，肉眼可见。trade-off：双态比单态实现成本高（前端要拉两个值、UI 要解释清楚），但相比「改完不知道生不生效，反复试」的体验，这层成本完全值得。一个真实问题：早期没做白名单光靠前端 feature flag，结果有用户用浏览器开发者工具改 flag 看到了入口，差点改坏配置；之后把权限的最终判断完全压到后端 API，前端只是隐藏入口。现在这套范式被复用到部署、checkpoint 等多个高风险场景，成本几乎是零（拷贝一份白名单 key），收益是稳定性兜底。

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

- ⚖️ **为什么需要双态 UI 而不是改完直接显示新值？**（trade-off）
  > Pod 内存这类配置只有 deploy 重启后才真正生效，单态会让用户误以为已经生效；双态明确显示「已保存 vs 运行中」避免静默 drift。


#### Evidence

- `backagent/src/config/feature-whitelist.ts`
- `backagent-web/src/pages/Chat/components/deploy/DeployTabPanel.tsx`

---

