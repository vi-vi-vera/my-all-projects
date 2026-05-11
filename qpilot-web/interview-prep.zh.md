# QPilot Web — 面试备战材料

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 2      | 🧩 |
| architecture  | 5 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 1  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 3 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

腾讯内部的 LLMOps 一站式工作台，桌面与移动双端聚合多模型、多智能体编排、可分享。

### 标准（30–60 秒）

QPilot Web 是面向腾讯内部用户的 LLMOps 工作台。桌面端是 Next.js 16 App Router 加 React 19 的全栈应用，移动端是独立的 Next.js 应用跑 3001 端口，两端共享 packages/ui-shared 和 utils、types 三个包，UI 各走一套。主聊天链路在 /api/chat-main-agent-v2，用 Vercel AI SDK 5 的 ToolLoopAgent 加 createUIMessageStream 跑多步执行，runtime 选 Node、maxDuration 设 300 秒，配合一条会话级 AbortController 注册表做停止。鉴权放在 Edge Middleware，用 jose 的 compactDecrypt 解 TAI 智能网关下发的 JWE 身份头并写 STAFFID cookie。消息树用 Prisma 建模：Conversation 维护 currentNodeId，Message 之间用 parentId 形成分支。前端状态拆成 21 个 Zustand store，按需 persist。监控接 Galileo OTel，自建 4 个业务 metric 看请求量与错误率。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

QPilot Web 把内部 AI 平台从单一模型对话推到多 Agent 编排加多端可用。技术栈上桌面端是 Next.js 16 加 React 19 加 Tailwind 4 加 shadcn/ui，状态用 Zustand 5 加 TanStack Query 5，移动端用 packages/ui-mobile 独立组件库，部署在 3001 端口。Monorepo 是 pnpm workspace 加 catalog 锁住 React 与 Next.js 的核心版本，packages 这一层走 lerna independent 各自独立发版，preinstall 钩子 only-allow pnpm 拒掉 npm 与 yarn，CI 强制 lint 的 max-warnings 为 0。主聊天链路在 /api/chat-main-agent-v2 里，用 Vercel AI SDK 5 的 ToolLoopAgent 跑多步执行，stream 通过 createUIMessageStream 返回，配合 createUIMessageStreamResponse 出 SSE；为了支持长任务 maxDuration 设 300 秒。每个 session 进来时把 AbortController 注册到一个会话级表，前端按下停止时打 /api/chat-main-agent-v2/stop，后端按 conversationId 调 abortSession，AbortSignal 透传到工具、子 Agent 与 streamText。上下文压缩分层：context-budget 按模型上下文窗口算预算，context-compress 在 prepareStep 里裁剪历史与工具输出，context-compressor 提供策略，超阈值才触发，短对话不进。鉴权链路上 middleware.ts 跑 Edge Runtime，matcher 排除 _next 与 api，用 jose 的 compactDecrypt 解 x-tai-identity 这个 JWE 拿 StaffId、LoginName，按 MODE 切 token，写 STAFFID、STAFFNAME、prompt_username 三个 cookie，前端组件直接读不再回查接口。消息树用 Prisma 建模，Conversation.currentNodeId 指向当前分支末端，Message.parentId 形成树，分支切换在 AI Elements Message 层完成，删除走级联，conversationId 加索引。监控上 instrumentation.ts 在 nodejs runtime 下 SetupGalileo，挂 unhandledRejection 与 uncaughtException，自建四个 metric：api_request_duration、page_render_duration、chat_request_count、chat_error_count，按模型与会话状态打标签。前端状态拆 21 个 store，比如 useSelectedModelStore、usePendingMessageStore、useMainAgentConfigStore，barrel 导出，需要持久化的才 persist 配 partialize。共享层 packages 里有 ui-desktop、ui-mobile、ui-shared、utils、types 与一个独立的 sdk/html-to-figma SDK，各自独立 version 由 lerna publish from-package 发版。老的 /api/chat 跑 Edge 用自研 OpenAIStream，/api/qpilot-chat 用 eventsource-parser 透传上游 SSE，新组件接主链路，旧组件继续用老接口。整套链路下来一个工作台同时支撑桌面与移动两端，共享业务逻辑层但 UI 按端独立演进。

</details>

## ✨ 项目亮点

- **ToolLoopAgent + UIMessageStream 主链路重构**（architecture · fullstack）
  原来主聊天链路是手写的 OpenAIStream 加 SSE 透传，多步工具调用要在外层自己接续。后来切到 Vercel AI SDK 5：ToolLoopAgent 接管多步执行，streamText 出 token 流，createUIMessageStream 包装成 UI 消息事件，再用 createUIMessageStreamResponse 出 SSE。maxDuration 设 300 秒覆盖长任务。子 Agent、工具调用、abort 信号都跑同一条流。
  > 关键词：`ToolLoopAgent` · `createUIMessageStream` · `Vercel AI SDK 5` · `SSE` · `maxDuration`
- **Token 预算 + 阶梯式上下文压缩**（performance · fullstack）
  多轮对话很容易把上下文窗口打穿。原来是粗暴截断历史，损失信息。后来拆成三层：context-budget 按模型窗口算预算，context-compressor 提供压缩策略，context-compress 在 ToolLoopAgent 的 prepareStep 里按实际 token 用量裁剪历史与工具输出。只有超过阈值的才走压缩，短对话不进。多轮场景不再炸窗，工具调用密集时也能继续跑。
  > 关键词：`context-budget` · `prepareStep` · `token-usage` · `compression` · `tool-output`
- **Edge Middleware + jose JWE 解 TAI 身份头**（security · backend）
  腾讯智能网关 TAI 在请求头里下发一个 JWE 压缩格式的身份票据 x-tai-identity，必须解密后才能拿到 StaffId 和 LoginName。我们在 middleware.ts 里跑 Edge Runtime，用 jose 的 compactDecrypt 解 JWE，按 MODE 切测试和正式环境的 token，把 StaffId、LoginName、prompt_username 写成 cookie 给前端复用。matcher 排除 _next 与 api，避免静态资源和接口路径反复解密。
  > 关键词：`jose` · `JWE` · `Edge Runtime` · `TAI` · `cookie`
- **Galileo OpenTelemetry 监控接入**（observability · backend）
  服务端的稳定性原来只能看部署平台的健康检查。我们在 instrumentation.ts 启动期跑 SetupGalileo，挂 unhandledRejection 与 uncaughtException 把未捕获异常全量上报。自建 4 个 OTel metric：api_request_duration、page_render_duration、chat_request_count、chat_error_count，按 MODE 区分测试和正式环境的上报地址。聊天接口错误率与延迟现在能直接出曲线。
  > 关键词：`Galileo` · `OpenTelemetry` · `metrics` · `instrumentation` · `unhandled-rejection`
- **Prisma 消息树 + 分支切换**（architecture · backend）
  用户希望在某条消息上重新生成、回到老的回答继续聊。所以会话不能是平铺数组。我们在 Prisma 里把 Conversation 加了 currentNodeId 字段，Message 之间用 parentId 串成树结构。前端在 AI Elements 的 Message 层做分支切换，切换时只改 currentNodeId 不动旧节点。删除走级联，conversationId 上加索引保证树遍历不慢。
  > 关键词：`Prisma` · `tree` · `parentId` · `currentNodeId` · `cascade`
- **21 个 Zustand Store 的分层治理**（architecture · frontend）
  前端状态如果塞进一个巨型 store，任何字段变化都会触发挂载者重渲染。我们按职责拆成 21 个独立 store：布局、用户、选模、Pending 待发、创建草稿、工具库、Plugins、Git Auth、MainAgent Config 等，统一在 stores/index.ts 做 barrel 导出。只有需要跨刷新存活的（比如 selectedModel）走 persist 中间件，其他纯内存。组件按需订阅，重渲染范围明显收窄。
  > 关键词：`zustand` · `store-slicing` · `persist` · `barrel` · `subscription`


## 🏗️ 架构（architecture）— 5 题

### Q1. 你们主聊天链路是怎么用 Vercel AI SDK 5 重写的？ToolLoopAgent 和 createUIMessageStream 各自负责什么？

> 来源：`tp-001` · scope: fullstack · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Vercel AI SDK 5 stream API | 必须掌握 | 理解 streamText 与 UIMessageStream 分层是接得对的前提 |
| Edge vs Node Runtime | 必须掌握 | 面试官会追问为什么不放 Edge 上 |
| AbortController 链式传递 | 加分项 | 讲清停止链路能拉开候选人差距 |

#### 三档回答

**🟢 一句话**：ToolLoopAgent 跑多步执行，createUIMessageStream 把 token 与工具事件包成 UI 消息流，再以 SSE 返回。

**🔵 标准**（默认）：

原来 /api/chat 是自研 OpenAIStream，多步工具调用要在外层手动接续，事件结构也是裸的。后来切到 /api/chat-main-agent-v2：ToolLoopAgent 负责多步循环，每步调 streamText，工具调用、修复、子 Agent 都在 loop 里完成。createUIMessageStream 把 streamText 的 token、tool_call、tool_result 等事件包成 UI 消息流，再用 createUIMessageStreamResponse 出 SSE。runtime 选 Node 加 maxDuration 为 300 秒覆盖长任务。整条链路只有一个 stream。前端 useChat 直接接 SSE，AI Elements 的 Message 组件按事件类型分块渲染。整体上 streamText 是 token 流来源，ToolLoopAgent 是循环驱动，createUIMessageStream 负责事件包装，三者职责彼此独立可单测。

<details><summary>🔴 深挖（点击展开）</summary>

原来的 /api/chat 是 Edge Runtime 加自研 OpenAIStream，事件结构裸、工具调用要外层手动 loop，stop 与中断也得另写。重写时直接绑 Vercel AI SDK 5：runtime 改 Node 是因为 ToolLoopAgent 跑多步加工具执行时间长，Edge 的执行时长不够，Node 上 maxDuration 设 300 秒；ToolLoopAgent 内部跑多步循环，每步走 streamText 拿 token 流，工具调用、工具修复、子 Agent 的 stream 都在这条 loop 里串起来，外部不再自己接续。createUIMessageStream 在循环外侧把 streamText 的事件包成 UI 消息事件，token 是 text_delta，工具调用是 tool_call 与 tool_result，再交给 createUIMessageStreamResponse 出 SSE。前端用 useChat 直接接，AI Elements 的 Message 组件按事件类型分块渲染。中断这条路单独有个 /api/chat-main-agent-v2/stop 端点：进入主链路时把 AbortController 注册到会话级表，前端点停止时 stop 端点按 conversationId 调 abortSession，AbortSignal 透传到 streamText、工具与子 Agent，整条流统一退出。老的 /api/chat 和 /api/qpilot-chat 还在跑，没把所有旧组件一起切是为了控制改动面，新组件统一接主链路。迁移之前我们也评估过自研一套 Agent loop 的方案，最后没走是因为 SDK 5 的 ToolLoopAgent 已经把 step 调度、tool 修复、子 Agent 串接这些细节抽好了，自己重写一遍价值低。结合 AI Elements 的 Message 组件，前端按 part 类型分别渲染，工具调用 part 还能展开看 args 和 result，调试体验也比裸 SSE 好。我们保留了一份兼容层包装老链路的请求体，前端 useChat 不区分新老端点，只是新端点上跑出来的 part 类型更丰富。迁移过程中我们也保留了老 /api/chat 的请求体兼容层，让前端 useChat 不区分新老端点，只是新端点上跑出来的 part 类型更丰富。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Vercel AI SDK 5 官方文档 ToolLoopAgent 与 streamText 章节
  - [ ] Next.js Route Handlers 与 Runtime 选型文档
- 🛠️ 动手
  - [ ] 用 createUIMessageStream 写一个 30 行的 echo Agent 并跑通 SSE
- ⚠️ 常见踩坑
  - Edge Runtime 下 maxDuration 上限远小于 Node，长任务会被砍
  - createUIMessageStreamResponse 不会自动 flush headers，Content-Type 要显式声明
  - ToolLoopAgent 的 prepareStep 改 messages 必须返回新数组，不要原地改
- 🤔 自测题（合上文档自答）
  - [ ] 如果换成 WebSocket 你会怎么改？
  - [ ] ToolLoopAgent 内部失败时怎么继续？
  - [ ] 为什么不把 maxDuration 调得更大？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不直接用 WebSocket 代替 SSE？**（trade-off）
  > 事件几乎都是 server→client，SSE 是 HTTP 兼容、断线后 EventSource 自动重连，不需要在 nginx 与 k8s ingress 里特殊配；WebSocket 双向但要额外处理握手、心跳、断线重连。


#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`

---

### Q2. 对话支持在某条消息重新生成并切分支，你们的数据模型是怎么设计的？

> 来源：`tp-006` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 邻接表与树查询 | 必须掌握 | 面试官会问为什么不用 nested set 或 closure table |
| Prisma onDelete Cascade | 必须掌握 | 删除策略直接影响一致性 |
| 事务一致性 | 加分项 | currentNodeId 与新消息插入要在一个事务 |

#### 三档回答

**🟢 一句话**：Conversation 加 currentNodeId，Message 之间用 parentId 形成树，分支切换只改 currentNodeId。

**🔵 标准**（默认）：

消息不能是平铺数组，因为要支持「在某条消息上重新生成」并保留旧分支。Prisma 里 Conversation 加了 currentNodeId 指向当前分支的叶子，Message 有 parentId 字段链向父消息，整体是一棵树。前端从叶子向上回溯就拿到当前可见消息序列。切分支时只改 currentNodeId，旧分支节点保留。删除 Conversation 时级联删 Message，conversationId 加索引保证树遍历不慢。回到旧分支只是把 currentNodeId 切回去，节点内容并不移动。

<details><summary>🔴 深挖（点击展开）</summary>

需求侧的核心是「不破坏历史地重生成」。如果消息是平铺数组，重生成要么覆盖旧消息丢失上下文，要么标记 deleted 留着，前端读起来一团乱。所以建模成树。Prisma schema 里 Message 有 parentId 字段，自引用同表，nullable 因为根节点没有父；Conversation 加 currentNodeId 字段，指向当前可见分支的叶子节点。前端展示当前对话时从 currentNodeId 向上走 parentId 拿到完整链。重生成的流程是：用户在第 N 条消息上点重新生成，后端拿这条消息当作 parent 新建一条 assistant 消息，把 currentNodeId 切到新节点，旧的 assistant 节点保留在树里作为兄弟分支。切回旧答案就是把 currentNodeId 改回去；UI 在 AI Elements 的 Message 组件层做兄弟枚举与切换按钮。删除策略上 Conversation onDelete 设为 Cascade，删 Conversation 时所有 Message 跟着走；单独删 Message 我们做了限制，只允许删叶子，不允许从中间断链，避免出现孤儿节点。索引上 conversationId 必加，单查会话所有节点是热路径；parentId 没单独建索引因为查询路径是从子往父按主键回溯，cost 已经足够低。规模上每个用户会话节点数一般在几十到几百，树深也就十几层，树遍历完全在 IO 而不是计算上，没必要再上 CTE 这种递归 SQL。代价是写入路径要维护 currentNodeId 一致性，所以每次新消息插入与切换都在同一事务里更新 currentNodeId。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Prisma 关系字段与级联删除文档
  - [ ] 邻接表 / 路径枚举 / 嵌套集 / 闭包表四种树存储对比的经典文章
- 🛠️ 动手
  - [ ] 在 Prisma 里建一个自引用 parentId 模型，写出树遍历的 raw query
- ⚠️ 常见踩坑
  - currentNodeId 与新消息插入不同事务会出现切了 id 但节点没建好的中间态
  - 允许删中间节点会产生孤儿子树
  - 树太深时一次循环 N 次 findUnique，要用 CTE 一次拉
- 🤔 自测题（合上文档自答）
  - [ ] 如果树深到几千层会怎么样？
  - [ ] 为什么不用 closure table？
  - [ ] 并发重生成同一节点会怎样？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么用邻接表而不是 closure table？**（trade-off）
  > 我们的树深度浅、读路径是从叶子向上走，邻接表按主键回溯就够快；closure table 写入要插入祖先链所有边，多倍写放大，对消息这种高频写不划算。


#### Evidence

- `apps/desktop/prisma/schema.prisma`
- `apps/desktop/src/components/ai-elements/`

---

### Q3. 为什么前端要拆成 21 个 Zustand store？大 store 不更省事吗？

> 来源：`tp-007` · scope: frontend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Zustand selector 与 useShallow | 必须掌握 | 决定订阅粒度是否真的细 |
| persist 中间件与 partialize | 必须掌握 | 持久化字段选错会泄漏临时态 |
| store 拆分原则 | 加分项 | 面试官会问怎么决定边界 |

#### 三档回答

**🟢 一句话**：巨型 store 任何字段变都会触发挂载者全量重渲染；按职责拆 store 让订阅粒度回到组件级。

**🔵 标准**（默认）：

Zustand 订阅是按 store 实例走的，组件订阅一个 store 任何字段变更都会触发重新计算 selector。如果所有状态都塞一个 store，选模这种高频字段一变全屏组件都跟着算 selector。我们按职责拆成 21 个 store：useLayoutStore、useUserStore、useSelectedModelStore、usePendingMessageStore、useToolboxStore、useMainAgentConfigStore 等，stores/index.ts 做 barrel。需要跨刷新存活的（selectedModel、布局偏好）走 persist 中间件，其他纯内存。组件按需订阅，重渲染范围明显收窄。实际上线后第一波收益是切模型时的不必要 re-render 完全消失，第二波是表单输入卡顿明显改善。代价是 store 数变多，靠 stores/index.ts 的 barrel 把 IDE 自动 import 入口收拢，避免到处 import 路径不一致。

<details><summary>🔴 深挖（点击展开）</summary>

拆 store 的判断不是按字段数量，而是按订阅频率与字段相关性。聚类原则有三条：第一，更新节奏一致的放一起，比如 useLayoutStore 里宽度、侧栏开关都是用户偶尔触发的；usePendingMessageStore 里正在输入的草稿是高频写。两者放一起会让低频订阅者跟着高频写重算 selector，所以拆。第二，跨组件共享路径相同的放一起，useSelectedModelStore 几乎所有聊天相关页面都订阅，单拎一个 store 让别的 store 改不影响它；useMainAgentConfigStore 只在设置页用，单独放就行。第三，persist 策略一致的放一起，selectedModel 要落 localStorage 跨刷新存活，pending 的 draft 不需要，混在一起 persist 中间件 schema 难写。21 个具体名字含 useLayoutStore、useUserStore、useSelectedModelStore、usePendingMessageStore、useCreateDraftStore、useToolboxStore、usePluginsStore、useGitAuthStore、useMainAgentConfigStore、useSessionHistoryStore 等，统一在 stores/index.ts barrel 出，组件 import 单点。需要持久化的 store 用 persist 中间件单独配 storage key 与 partialize，避免把临时字段 persist 进去；selector 比较多字段用 useShallow，避免新对象引用导致假重渲染。我们也踩过两个坑：早期把 selectedModel 塞 useUserStore，结果换模型时所有订阅 user 的组件都重算，后来拆出来才好；persist 升级 schema 没写 migrate，老用户刷出来字段缺，加 version + migrate 后稳定。代价是 store 数量多、init 时要按需 import 避免一次性加载，barrel 单写在 index.ts 也帮 IDE 自动 import 收敛入口。再补一点：persist 中间件加了 version 字段做迁移，schema 升级时如果直接覆盖会让老用户少字段，我们写了 migrate 函数把缺的字段填默认值，迁移过一次之后再没出过 hydration 不一致。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Zustand 官方 docs：selector 与 shallow
  - [ ] Zustand persist 中间件文档
- 🛠️ 动手
  - [ ] 把一个 useState 巨型组件拆成两三个 zustand store，比较渲染次数
- ⚠️ 常见踩坑
  - selector 返回新对象每次都触发重渲染，要用 useShallow
  - persist 没写 partialize 会把临时字段也存进 localStorage
  - schema 升级不写 migrate，老用户刷出来字段缺导致崩溃
- 🤔 自测题（合上文档自答）
  - [ ] 拆这么多 store 怎么避免维护成本爆炸？
  - [ ] 用 Redux Toolkit 会更好吗？
  - [ ] selectedModel 用 React Context 行不行？
- ⏱️ 预估学习时长：**半天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不用 React Context？**（trade-off）
  > Context 任意 value 引用变化就让所有消费者重渲染，做不到 selector 级订阅；Zustand 的 subscribeWithSelector + useShallow 可以只在所选字段变化时通知。


#### Evidence

- `apps/desktop/src/stores/`

---

### Q4. 你们怎么用 App Router 的路由组和私有目录约定来组织页面？

> 来源：`tp-008` · scope: frontend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| App Router 路由组与私有目录 | 必须掌握 | 理解 (group) 与 _folder 的语义差异 |
| RSC 与 'use client' 边界 | 必须掌握 | layout 选 server 还是 client 直接影响包大小 |
| 组件就近原则 | 加分项 | 聊到大型项目目录组织必问 |

#### 三档回答

**🟢 一句话**：(app) 路由组带侧边栏布局，(standalone) 全屏路由组；_components 私有目录放页面专属组件。

**🔵 标准**（默认）：

src/app 下分两个路由组。(app) 套侧边栏 layout，包含首页、对话、社区、Agents、工具、设置、工作流这些日常入口；(standalone) 不套 layout，做全屏页面比如分享页、登录回调。路由组用括号包名，URL 路径不带它，只是 layout 边界。组件就近原则：页面专属组件放该路由下的 _components 目录，下划线开头是 Next.js 私有目录约定，不会成为路由，外部不应该 import。跨页面复用的组件才提到 src/components。

<details><summary>🔴 深挖（点击展开）</summary>

路由这边的核心目标是「布局清晰、组件就近、复用边界明确」。Next.js 16 App Router 给了两个机制：路由组（括号包名）只做 layout 边界不进 URL，私有目录（下划线开头）告诉 router 这不是路由段。我们用这两个机制做了三层结构。第一层是路由组：(app) 与 (standalone)。(app) 这棵子树挂一个共用 layout 包含侧栏、顶栏、状态栏，下面是首页 /、对话 /chat、社区 /community、Agents /agents、工具 /tools、设置 /settings、工作流 /workflow 等业务页面，URL 不带 (app)；(standalone) 这棵子树挂一个空 layout，下面是分享页 /share、登录回调 /auth/callback 等，需要全屏的页面进这个组。第二层是页面级 layout：每个业务页面比如 chat 自己再嵌一个 layout.tsx 处理本页的 stateful UI，比如对话列表侧栏。第三层是私有目录 _components：每个路由文件夹下放 _components 目录存只在该页面用的组件，比如 chat/_components/Chat.tsx 是聊天主组件，下划线开头让 Next.js 跳过路由解析，import 路径用相对，跨页面禁止 import 别的路由的 _components，靠 ESLint 与 review 保。这三层结构的好处是新人定位组件不用全局搜，看 URL 就能映射到目录；公共组件提到 src/components 才走全局复用。配合 RSC，layout 优先 server，里头用到 useState 这类 client hook 的部分单独 'use client' 拎出来，避免把整个 layout 标 client。ESLint 那条 rule 我们用 import/no-restricted-paths 实现，禁止任意路由从兄弟路由的 _components 下面 import，只允许向上去 src/components，强行违反时直接报错挡 PR。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Next.js App Router 官方文档：Route Groups、Private Folders、Layouts
  - [ ] React Server Components 官方介绍
- 🛠️ 动手
  - [ ] 搭一个最小 App Router 项目，建两个路由组挂不同 layout，验证 URL 不带组名
- ⚠️ 常见踩坑
  - 路由组括号包名打错变成实际 URL 段
  - _components 被别的路由 import 形成隐式耦合
  - 把整个 layout 标 'use client' 导致 server 优势没了
- 🤔 自测题（合上文档自答）
  - [ ] (app) 与 (standalone) 共享某个组件你怎么放？
  - [ ] 如果两个路由组要共享 state 你怎么做？
  - [ ] 为什么不用 Pages Router？
- ⏱️ 预估学习时长：**半天**


#### Evidence

- `apps/desktop/src/app/(app)/`
- `apps/desktop/CODEBUDDY.md`

---

### Q5. pnpm catalog 加 lerna independent 这套怎么运作？为什么要双层？

> 来源：`tp-012` · scope: infra · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| pnpm workspace catalog | 必须掌握 | 面试官常问 catalog vs overrides 区别 |
| lerna independent vs fixed | 必须掌握 | monorepo 发版策略选型常考 |
| preinstall only-allow | 加分项 | 工具链一致性的细节 |

#### 三档回答

**🟢 一句话**：pnpm catalog 锁全局核心版本，lerna independent 让每个 package 各自版本号独立发版。

**🔵 标准**（默认）：

pnpm-workspace.yaml 里用 catalog 字段把 React、Next.js、Tailwind 等核心库的版本一次锁住，每个子包写 dependencies 时引用 catalog: 即可，避免版本漂移。lerna.json 配 independent 模式，让 packages/ 下每个包有自己的 version 字段，发版时 lerna publish from-package 各自独立 bump。preinstall 钩子用 npx only-allow pnpm 拒掉 npm 与 yarn 防止 lockfile 错乱。CI 里 lint 用 max-warnings 为 0 卡严格度。踩过的坑是 React 子版本漂移导致 useId 在运行时抛 hook mismatch，build 阶段没暴露；上 catalog 后这类问题再没出过。html-to-figma 这类独立 SDK 走 lerna publish 发到内部 registry，业务侧通过 catalog 锁版本消费。

<details><summary>🔴 深挖（点击展开）</summary>

monorepo 这块的目标是「核心库版本一致、业务包独立演进、工具链单一」。我们在三层做了约束。第一层是 pnpm workspace + catalog。pnpm-workspace.yaml 列出 apps/* 与 packages/* 作为成员，catalog 字段把 React、React DOM、Next.js、Tailwind、TypeScript 等核心库锁到具体版本。子包在 dependencies 写 react: catalog:，pnpm install 时根据 root catalog 解析，所有包拿到完全一样的版本，避免 React 不同 minor 跑出双 React 上下文这种隐蔽 bug。第二层是 lerna independent 发版。packages/ 下面 ui-desktop、ui-mobile、ui-shared、utils、types、sdk/html-to-figma 各自有独立 version，lerna publish from-package 发版时按 package.json version 与 npm registry 比对，新版本就推。这种独立 version 让 utils 升小版本不强迫所有包跟着 bump。apps/* 不发版只构建。第三层是工具链单一。preinstall 钩子用 npx only-allow pnpm 在 npm install 或 yarn 时抛错，把所有人挡进 pnpm 一条路，避免出现 package-lock.json 与 pnpm-lock.yaml 并存解析错乱。CI 这边 lint 必须零警告，TypeScript build 失败直接阻塞 PR，配合代码 review 卡住烂代码。这套带来的代价是新人要先学 pnpm 与 catalog 写法，但回报是一年下来基本没出过 React 双实例、依赖版本漂移这类事故。具体踩过的坑：早期没用 catalog，子包各自指 react 版本，某次升 18 到 19 漏改一个，build 不报错运行时 useId 抛 hook mismatch；统一 catalog 之后再没出过。html-to-figma 这种独立 SDK 用 lerna publish 发到内部 registry，业务侧通过 catalog 锁住版本，迭代节奏可控。再补一个细节，preinstall 里 only-allow pnpm 不只是开发体验，更是为了避免 package-lock.json 和 pnpm-lock.yaml 在仓库里同时存在导致依赖锁失真，CI 会校验 lockfile 干净。具体到每个 lerna publish 我们都会在 CI 里做一次空跑确认 diff，避免误发版。

</details>

#### 补齐方案

- 📚 必读
  - [ ] pnpm Catalogs 官方文档
  - [ ] Lerna v8 文档：independent vs fixed mode
- 🛠️ 动手
  - [ ] 建一个 2 包的 pnpm monorepo，用 catalog 锁 React 版本并验证子包解析
- ⚠️ 常见踩坑
  - catalog 与 dependencies 直接写版本号混用导致解析意外
  - lerna independent 模式下没加 conventional commits 会让 publish 卡住
  - 忘了 only-allow 钩子，新人 npm install 弄坏 lockfile
- 🤔 自测题（合上文档自答）
  - [ ] pnpm catalog 与 npm overrides 有什么区别？
  - [ ] 为什么不用 turborepo？
  - [ ] lerna 现在维护得怎么样，有更好替代吗？
- ⏱️ 预估学习时长：**半天**


#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`

---

## 🧩 功能（feature）— 2 题

### Q1. 你们前端是怎么用 React Query 组织数据请求的？services 与 hooks 的边界在哪？

> 来源：`tp-010` · scope: frontend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| React Query queryKey 设计 | 必须掌握 | 三段式 key 与 invalidate 范围直接相关 |
| staleTime / cacheTime 区别 | 必须掌握 | 面试官常考缓存生命周期 |
| 幂等与 retry 策略 | 加分项 | 聊到 mutation 必问 retry 安全性 |

#### 三档回答

**🟢 一句话**：services 写纯 fetch 函数，hooks 用 useQuery / useMutation 包装；queryKey 按业务 id 切，mutate 后 invalidate。

**🔵 标准**（默认）：

我们把数据请求分两层。services/ 目录下写纯 fetch 函数，参数与返回都是普通对象，不依赖 React。hooks/ 目录下用 useQuery 或 useMutation 包装 services 的函数，按 conversationId、agentId 等业务 id 拼 queryKey。mutation 成功后调 queryClient.invalidateQueries 让相关 key 重新拉。这样 services 可以单独跑单测，hooks 拿到 React 体系内的缓存、retry、suspense 能力。组件只 import hooks，不直连 fetch。拆分之前我们也试过组件里直接写 fetch，结果同一个接口被三个组件用三种参数调三次，缓存命中率为零；分层之后接口调用减半。

<details><summary>🔴 深挖（点击展开）</summary>

前端数据层的设计目标是「请求能复用、缓存能共享、失败有处理、组件少写样板」。我们分两层。services/ 是纯函数层，每个文件按资源分组，比如 services/conversation.ts 暴露 fetchConversationList、fetchConversationById、postMessage 等函数，参数与返回是普通对象，里头只做 fetch 与 zod schema 校验，不依赖 React。这层是单测的主战场，mock fetch 即可。hooks/ 是适配层，每个 hook 包装一个或几个 service 函数。useQuery 这边按业务 id 拼 queryKey，比如 ['conversation', conversationId, 'messages']，结构是 [resource, id, sub-resource]，三段式让 invalidateQueries 既能精确失效一个会话的消息又能批量失效所有会话。useMutation 这边在 onSuccess 里 invalidate 关联 queryKey；像新建会话这种全局影响的 mutation 要 invalidate ['conversation'] 整棵；只改一条消息只 invalidate 该 conversationId。staleTime 按数据特性配，会话列表 30 秒，模型列表几乎不变可以 5 分钟，正在生成的消息 staleTime 设 0 强制每次最新。retry 默认开但聊天 mutation 关掉，因为请求体大且非幂等重试会出双发。组件层只 import hook，typings 自动从 service 函数推断。这套结构的好处是请求逻辑能在多个 hook 之间复用 service 函数；坏处是文件多、新人要先理解两层。我们也试过把所有 fetch 直接写到组件里，结果同一个接口在三个组件被调三遍而且写法都不一样，缓存命中率为零。分层之后接口调用集中在 hooks，请求次数显著下降。拆分之后还顺手把 staleTime 按数据特征逐项设置，会话列表 30 秒、模型列表 5 分钟、生成中消息 0 秒强制刷新，命中率和过期策略再没出过混淆。

</details>

#### 补齐方案

- 📚 必读
  - [ ] TanStack React Query 5 官方文档 Queries / Mutations / Query Keys
  - [ ] Kent C. Dodds 的 React Query Patterns 文章
- 🛠️ 动手
  - [ ] 用 React Query 写一个增删改查 todo 应用，mutation 后用 invalidate 刷新列表
- ⚠️ 常见踩坑
  - queryKey 用对象引用导致 key 不稳定，每次都重新请求
  - non-idempotent mutation 不关 retry 会双发
  - staleTime 与 cacheTime 搞混导致缓存策略意外
- 🤔 自测题（合上文档自答）
  - [ ] 如何处理乐观更新？
  - [ ] queryKey 用字符串还是数组各有什么影响？
  - [ ] 为什么不用 SWR？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `apps/desktop/src/hooks/`
- `apps/desktop/src/services/`

---

### Q2. html-to-figma SDK 是怎么把网页转成 Figma 剪贴板格式的？字形和 SVG 路径怎么处理？

> 来源：`tp-014` · scope: frontend · packages/* 共享层 · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| SVG path 与 VectorNetwork | 必须掌握 | 矢量编码是核心难点 |
| opentype.js cmap 与 glyph | 加分项 | 字形处理是高级话题 |
| Figma Plugin / Clipboard 格式 | 加分项 | 聊到产物格式必问 |

#### 三档回答

**🟢 一句话**：解析 DOM 与 computed style 出节点树；字形用 opentype.js、SVG 用 vector-network-encoder 编成 Figma VectorNetwork。

**🔵 标准**（默认）：

SDK 拆四块。figma-generator 负责走 DOM 把每个节点连同 getComputedStyle 收集成中间结构，颜色、字号、Auto Layout、阴影、线性 / 径向渐变都映射成 Figma 节点 schema。glyph-encoder 用 opentype.js 解字体文件，把不在系统里的字形转成路径节点保留视觉一致。vector-network-encoder 把 SVG path 的 M/L/C/Q 命令转换成 Figma 的 VectorNetwork（点 + 边 + 区域）。image-utils 处理 image data url 与跨域转 base64。最后输出的是 Figma 剪贴板能直接粘的格式。实际产出走的是 Figma 内部的 protobuf-ish 序列化，再 base64 推到剪贴板，所以粘贴到 Figma 不需要插件就能落地。

<details><summary>🔴 深挖（点击展开）</summary>

html-to-figma 这个 SDK 的目标是「网页选区粘到 Figma 后跟原页面像素级一致」。难点不在 DOM 转换本身，而在两个具体子问题：字体差异与矢量编码。先说整体管线。figma-generator 入口接收一个 root element，按 DOM 树深度遍历，每个节点拿 getComputedStyle 出一份完整样式快照，再做属性映射：display 与 flex 系列映射到 Figma Auto Layout 的 layoutMode 与 primary/counter axis；background 中的线性 / 径向渐变拆出 stops 映射到 Figma fillsType；box-shadow 映成 effects；border-radius 映成 cornerRadius。这一步产物是 Figma 节点 schema 的中间形态，一棵树。然后是字形。Web 字体在 Figma 端可能装不全，直接给字符串 Figma 用默认字体替换，视觉就跑了。glyph-encoder 用 opentype.js 拿到字体文件解析，把每个用到的字形（cmap 表查 codepoint 到 glyph index）拿出 path，再调 vector-network-encoder 把 path 转成 VectorNetwork，作为路径节点替换掉文本节点。这样视觉锁死但失去文本编辑能力，所以对正文留文本节点，对装饰性文字（标题艺术字这种）才走字形路径。SVG 部分也是关键。Figma 自己没有 SVG path string 这种概念，它用 VectorNetwork（vertices、segments、regions）表达矢量。vector-network-encoder 解析 SVG path 命令：M 开新轮廓建一个 vertex，L 加一段直线 segment，C 三次贝塞尔需要拆出两个控制点附在两端 vertex 的 mirroring 上，Q 二次贝塞尔升阶到三次再处理，Z 闭合并构造 region。处理过程中要算 evenodd 或 nonzero 填充规则区分 region。image-utils 这一块就比较常规，data: url 直接进 fills，跨域 url 走代理转 base64 因为 Figma 剪贴板要求图片内嵌不能引用远程。最后整个树序列化成 Figma 内部的 protobuf-ish 格式再 base64 出来塞剪贴板。这套跑出来的产物在 Figma 端粘贴后，layout 可调、文字可编辑、矢量可编辑，工作流上设计师拿到后可以继续改。

</details>

#### 补齐方案

- 📚 必读
  - [ ] SVG Path 规范（W3C）
  - [ ] Figma 官方 Plugin API 文档：VectorNetwork 与 Node Schema
  - [ ] opentype.js 文档
- 🛠️ 动手
  - [ ] 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas
- ⚠️ 常见踩坑
  - 三次 Bezier 控制点 mirror 没处理好会让曲线失真
  - fill-rule evenodd 与 nonzero 混用导致填充错
  - 字体跨域加载没处理 CORS 直接 fail
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不直接转 SVG 给 Figma？
  - [ ] 字形转路径以后还能编辑吗？
  - [ ] 怎么处理 web 字体许可？
- ⏱️ 预估学习时长：**1 周**


#### Evidence

- `packages/sdk/html-to-figma/`

---

## ⚡ 性能（performance）— 2 题

### Q1. 多轮对话很容易把上下文窗口打穿，你们的上下文压缩具体怎么做的？什么时候触发？

> 来源：`tp-004` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| LLM token 计数与窗口 | 必须掌握 | 压缩触发条件直接依赖 token 计算 |
| ToolLoopAgent prepareStep 钩子 | 必须掌握 | 压缩入口就在这里 |
| 摘要质量与信息损失评估 | 加分项 | 面试官会问怎么验证摘要没丢关键信息 |

#### 三档回答

**🟢 一句话**：三层：context-budget 算预算，context-compressor 出策略，context-compress 在 prepareStep 里裁，只超阈值才跑。

**🔵 标准**（默认）：

上下文压缩拆三层。context-budget 按当前模型的上下文窗口算一个安全预算；context-compressor 提供具体策略，比如旧消息走摘要、工具输出按长度截断保留头尾；context-compress 在 ToolLoopAgent 的 prepareStep 里跑，按实际 token 用量裁剪历史与工具结果。只有 token 用量超过阈值才进压缩，普通短对话直接跳过。早期是粗暴 slice 历史，丢上下文丢得多，现在能保留语义。

<details><summary>🔴 深挖（点击展开）</summary>

原来的实现是按消息条数截断，超过 N 条就 slice，问题是工具输出可能一次几千 token，截掉一条直接丢一段关键上下文；而且模型不同上下文窗口差异巨大，硬编码条数对小窗口模型不安全。重构后拆三层。context-budget 根据 selectedModel 读模型元数据里的 context_window，再减掉系统提示、当前用户消息、预留输出空间，得到给历史的安全 token 预算；不同模型预算自动算出来。context-compressor 提供具体策略集合：第一种是工具输出截断，保留头尾各 N 个 token，中间替换成省略标记，因为工具输出通常头尾信息最重要；第二种是历史消息摘要，旧的几轮对话压成一句摘要，保留主题与结论；第三种是按角色优先级丢，比如 system 不动、最近一轮用户消息不动、最早的 assistant 消息先丢。context-compress 是入口，在 ToolLoopAgent 的 prepareStep 钩子里跑，每一步执行前算当前 messages 的 token 用量，只有超出预算才挑策略压。短对话不会进，避免无谓 CPU 开销。返回新的 messages 数组，不在原 messages 上原地改，避免并发问题。整体目标是长对话不炸窗、工具调用密集场景下也能继续跑，同时把信息损失从无差别截断改成结构化压缩。具体阈值与摘要模型选型按经验调，没硬编码。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Vercel AI SDK ToolLoopAgent 的 prepareStep 文档
  - [ ] OpenAI / Claude / Gemini 的 context window 文档
- 🛠️ 动手
  - [ ] 写一个 100 行的 demo：统计 messages 的 token，超过阈值就把最早 2 条压成摘要
- ⚠️ 常见踩坑
  - prepareStep 原地修改 messages 在并发场景下踩坑
  - 工具输出全截掉会让模型看不到关键结果，必须保头尾
  - 硬编码 token 阈值对小窗口模型不安全，要按模型元数据算
- 🤔 自测题（合上文档自答）
  - [ ] 摘要本身也是一次 LLM 调用，怎么避免摘要失败把请求拖崩？
  - [ ] 如果是 Claude 这种支持 prompt caching 的模型，压缩策略会变吗？
  - [ ] 怎么衡量压缩前后信息损失？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不直接换长上下文窗口的模型，省掉压缩这一层？**（trade-off）
  > 长上下文模型 token 单价更贵、首字延迟更高，多轮场景成本扛不住；压缩是按需触发的，短对话零成本，性价比更好。还要兼容用户选的不同模型，不能假设都有长窗口。


#### Evidence

- `apps/desktop/src/shared/`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`

---

### Q2. DnsOptimization 组件在做什么？为什么 layout 里要在服务端读 cookie 初始化用户状态？

> 来源：`tp-011` · scope: frontend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| preconnect / dns-prefetch 区别 | 必须掌握 | 面试官常追问 crossorigin 必要性 |
| Next.js cookies() 与 RSC | 必须掌握 | 服务端读 cookie 决定水合稳定性 |
| TTFB / FCP / LCP 指标 | 加分项 | 聊性能必问指标怎么衡量 |

#### 三档回答

**🟢 一句话**：DnsOptimization 提前 preconnect 关键 API 与 CDN 域名；layout 服务端读 cookie 让首屏不出现登录闪烁。

**🔵 标准**（默认）：

DnsOptimization.tsx 在根 layout 渲染时输出一组 link rel=preconnect 与 dns-prefetch，目标是 API 域名、CDN 域名、字体托管域。preconnect 做 DNS+TCP+TLS 一步走，dns-prefetch 兜底老浏览器。layout 这边在 server 端用 next/headers 的 cookies 读 STAFFID，初始化用户态再渲染，避免客户端水合时先渲染未登录状态再切换登录态导致闪烁。两个加在一起把首屏 TTFB 与水合稳定性都拉好。preconnect 标签上的 crossorigin 属性是必填的，不写跨域字体请求会被忽略，看起来一切正常但首屏字体仍要重新走 DNS。

<details><summary>🔴 深挖（点击展开）</summary>

首屏优化这块我们做了两件事，分别解决两类问题。第一件是关键域名预连接。聊天接口跨域到一个 API 域、媒体走 CDN 域、字体走第三方域，每个域第一次访问都要付 DNS、TCP、TLS 三段开销。所以在根 layout 里挂一个 DnsOptimization 组件，输出 link rel=preconnect 指向这些域，浏览器会提前完成三段握手；同时挂一组 link rel=dns-prefetch 兜底老浏览器只做 DNS。preconnect 标签里加 crossorigin 属性必须正确，跨域字体没加会被忽略。第二件是登录态水合。Next.js App Router 默认 server 渲染，但用户态在客户端通过 cookie 读的话会出现：server 渲染时不知道用户是否登录，按未登录渲染；client 水合时读 cookie 发现已登录，再切换；这之间页面会闪一下。修复办法是在 layout.tsx 里用 next/headers 的 cookies() 直接在 server 端读 STAFFID（之前 middleware 解 JWE 已经写好），把用户态注入 RSC 渲染上下文，渲染出的 HTML 已经是登录态。客户端水合时 useUserStore 用 server 注入的初值初始化，不再有切换。Tailwind 4 的 CSS 变量与 next/font 的 font-display: swap 是另外两个细节：CSS 变量减少首屏样式表抖动，next/font 把字体下载到 self-host 避免第三方延迟。具体提升我们看的是 Aegis 上的页面 TTFB 与 LCP 曲线，预连接接入后到关键 API 的 RTT 砍掉一段，登录态水合改完后第一帧就是登录状态，体感稳定。上线后我们通过 Aegis 的页面 TTFB 和 LCP 曲线追到效果，preconnect 之后关键 API 的 RTT 少一次，登录态水合修了之后首帧就是登录态，不再闪一帧匿名。

</details>

#### 补齐方案

- 📚 必读
  - [ ] MDN Resource Hints: preconnect、dns-prefetch、preload
  - [ ] Next.js next/headers 与 cookies API 文档
- 🛠️ 动手
  - [ ] 在 Lighthouse 里跑一次基线，加 preconnect 后再跑一次，记录 LCP 变化
- ⚠️ 常见踩坑
  - preconnect 没加 crossorigin 导致字体请求重新建连
  - preconnect 太多反而占用浏览器并发槽
  - 服务端没读 cookie 导致水合切换出现闪烁
- 🤔 自测题（合上文档自答）
  - [ ] preload 与 preconnect 区别？
  - [ ] CSS-in-JS 会怎么影响首屏？
  - [ ] next/font 是怎么自托管字体的？
- ⏱️ 预估学习时长：**半天**

#### 追问（面试官深挖向）

- ⚖️ **preconnect 加多少个合适？**（trade-off）
  > 通常 4 到 6 个高优先域，浏览器并发连接槽有限再多反而互相挤占。只挑首屏必须的 API、CDN、字体三类。


#### Evidence

- `apps/desktop/src/components/DnsOptimization.tsx`
- `apps/desktop/src/app/layout.tsx`

---

## 🛡️ 可靠性（reliability）— 1 题

### Q1. 用户点停止时，前端到工具调用这一整条链是怎么把 SSE 流干净地切断的？

> 来源：`tp-003` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| AbortController 与 AbortSignal | 必须掌握 | 面试官会问怎么传到 fetch 与子流 |
| 进程内表与多 Pod 一致性 | 加分项 | 聊到多 Pod 部署就会问 sticky session 怎么处理 |

#### 三档回答

**🟢 一句话**：进入主链路时注册一个会话级 AbortController，stop 端点按 conversationId 触发 abort，信号透传到工具与子 Agent。

**🔵 标准**（默认）：

进 /api/chat-main-agent-v2 时按 conversationId 把 AbortController 注册到一个会话级表（registerSessionAbort）。前端按下停止按钮调 /api/chat-main-agent-v2/stop，参数带 conversationId，stop 端点查表后调 abortSession 触发 controller.abort。AbortSignal 沿着 streamText、工具、子 Agent 透传，整条 SSE 流统一退出。session 正常完成或异常退出时走 unregisterSession 清理表项。session 正常做完或异常 throw 时，主链路在 finally 里调 unregisterSession，把会话条目从表里删掉，避免内存堆积。conversationId 必须前后端一致才能命中，多 Pod 部署下要靠网关或 sticky session 保证 stop 落到同一实例。

<details><summary>🔴 深挖（点击展开）</summary>

停止这条链分三段。第一段是会话级注册表：用一个进程内 Map（registerSessionAbort）按 conversationId 存 AbortController。进入 /api/chat-main-agent-v2 时新建 controller，注册一份，把 controller.signal 透给 streamText 的 abortSignal 参数；ToolLoopAgent 内部跑工具时也把同一个 signal 透给每个工具，确保 fetch、shell、sandbox 这类 IO 一旦 abort 立刻退。第二段是触发端点 /api/chat-main-agent-v2/stop：前端按停止时调它，参数只带 conversationId，stop 端点调 abortSession(conversationId)，查表拿到 controller 调 abort。signal 触发后，streamText 内部的 fetch 会进 AbortError，UIMessageStream 也跟着结束，SSE 自然关闭，浏览器侧 useChat 的 onError 接住。第三段是清理：session 正常跑完、异常 throw、或被 abort 之后，主链路在 finally 里走 unregisterSession 把这条会话从表里删掉，避免内存堆积。需要注意的细节是 conversationId 必须前后端一致才能命中，前端在发起请求与点停止时都带同一个 id；多 Pod 部署下 stop 请求可能落到别的实例，这种情况下要在网关或 sticky session 上保证停止请求落回同一 Pod，否则查表查不到。整体来说就是 AbortController 在 SDK 里是一等公民，我们只是把它做成了会话维度可寻址。实现上有几个边界条件值得说：第一是工具内部用 fetch 时，要把 signal 透传进去，否则 streamText abort 之后子 fetch 还在跑，会留下一段时间的孤儿请求；第二是子 Agent 也是用同一个 signal，避免出现外层停了内层还在跑的情况；第三是前端 useChat 的 onError 拿到 AbortError 不能弹错误 toast，要按正常停止处理，否则用户体验上像出 bug 了。监控上我们没有单独建 abort 计数，而是把 abort 算进 chat_error_count 但带 reason=user_abort label，方便区分主动停止和真正的失败。

</details>

#### 补齐方案

- 📚 必读
  - [ ] MDN AbortController / AbortSignal
  - [ ] Vercel AI SDK streamText 的 abortSignal 参数文档
- 🛠️ 动手
  - [ ] 写一个 Express demo：客户端 fetch SSE，服务端通过另一个端点根据 sessionId 中断流
- ⚠️ 常见踩坑
  - 工具内部的 fetch 没接 signal 会导致 abort 后还在跑
  - finally 没清表会让 Map 越来越大
  - 多 Pod 下 stop 落到不同实例必须依赖 sticky session 或网关路由
- 🤔 自测题（合上文档自答）
  - [ ] 如果 stop 请求丢了怎么兜底？
  - [ ] 工具是流式输出的，怎么保证 abort 后不再吐数据？
  - [ ] 为什么不用 Redis 存 conversationId 到 Pod 的映射？
- ⏱️ 预估学习时长：**半天**


#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`

---

## 📈 可观测性（observability）— 1 题

### Q1. 你们的 Galileo 监控具体记了哪些 metric，instrumentation.ts 是怎么启动的？

> 来源：`tp-005` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Next.js instrumentation.ts 钩子 | 必须掌握 | 面试官常问 register 何时跑、Edge 行不行 |
| OTel histogram vs counter | 必须掌握 | metric 选型直接决定能不能算 P95 |
| unhandledRejection 与 uncaughtException | 加分项 | Node 兜底异常的常考点 |

#### 三档回答

**🟢 一句话**：instrumentation.ts 启动期 SetupGalileo，自建 4 个 OTel metric 覆盖 API、页面渲染、聊天请求与错误。

**🔵 标准**（默认）：

Next.js 在 instrumentation.ts 里暴露 register 钩子，只在 NEXT_RUNTIME 为 nodejs 时跑（Edge 不接入）。register 里调 SetupGalileo 启 OTel node-sdk，按 MODE 切测试和正式环境的上报地址；同时挂 unhandledRejection 与 uncaughtException 把未捕获异常全量上报。自建 4 个 metric：api_request_duration、page_render_duration、chat_request_count、chat_error_count，分别覆盖接口耗时、页面渲染耗时、聊天请求总数与错误数。Edge 那段绕过 OTel 是因为 node-sdk 的 async_hooks 在 Edge 不可用，强行加载会直接抛 module not found。注册顺序是 SetupGalileo 先跑、再注册自定义 metric，否则 meter 还没就绪 metric 创建会失败。

<details><summary>🔴 深挖（点击展开）</summary>

监控这块的目标是让服务端稳定性脱离平台健康检查，能按业务维度看到曲线。Next.js 16 在 instrumentation.ts 里给了 register 钩子，启动期会被调一次，但 Edge 与 Node 都会走，所以我们在里头先判 process.env.NEXT_RUNTIME 是不是 nodejs，Edge 跳过，因为 OTel node-sdk 依赖 node:async_hooks 这类 API。Node 这边调 SetupGalileo，它内部初始化 NodeSDK：HTTP/Express/Fetch 自动埋点 + 我们传的 resource attribute（service.name 与环境）；上报地址按 process.env.MODE 切，测试和正式分开，避免环境串号。SetupGalileo 之后挂两个进程级监听器，unhandledRejection 与 uncaughtException 都直接走 galileo-logger 上报全量栈与请求上下文，避免 silent fail。业务维度自建 4 个 metric：api_request_duration 是 histogram，按路由 label 切；page_render_duration 同 histogram，按页面 label 切；chat_request_count 与 chat_error_count 是 counter，按模型与会话状态打标签。聊天链路里在主入口 begin 时 increment chat_request_count，catch 块里 increment chat_error_count 并把 error code 打成 label，stream 结束时记 api_request_duration。报表上能直接出每个模型的请求量与错误率曲线。trace 与 metric 共享同一份资源属性，链路与指标可以串。要注意的是 instrumentation.ts 在 Next.js 里只在第一次请求前跑一次，所以注册顺序很重要，先 SetupGalileo 再注册 metric，避免 meter 拿不到。上线前我们也评估过自带 Sentry 这条路，最后没选是因为公司内部已经有 Galileo 平台、看板和告警都对齐它，重新接 Sentry 只是重复造轮子。错误链路上 unhandledRejection 这条专门拿来抓 promise 失踪，之前漏抓时偶发的 stream 中断没人发现，加上之后通过 galileo-logger 看到了一类 fetch retry 超限抛在外层的 case。chat_error_count 用 counter 而不是 histogram 是因为聚合维度只看次数；api_request_duration 用 histogram 才能看 p50/p95/p99 分布，这两个 metric 在看板上分别撑两类视图。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Next.js Instrumentation 文档
  - [ ] OpenTelemetry JavaScript node-sdk 文档
- 🛠️ 动手
  - [ ] 在一个 Next.js 项目里跑通 NodeSDK 自动埋点 + 一个自定义 counter
- ⚠️ 常见踩坑
  - register 在 Edge 也会被调用，没判 runtime 会报 async_hooks not found
  - metric label 基数过高会让后端聚合崩，模型名要可控
  - uncaughtException 之后进程其实不稳定，建议上报后退出由编排器拉起
- 🤔 自测题（合上文档自答）
  - [ ] 如果 OTel exporter 自身挂了怎么办？
  - [ ] metric 太多导致 export 流量大，怎么裁？
  - [ ] P95 是怎么从 histogram 算出来的？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不用 console + ELK 这种纯日志方案？**（trade-off）
  > 纯日志算 P95 与错误率要离线聚合、查询贵；OTel metric 在客户端就聚合好，histogram 直接算分位，查询便宜，告警实时。日志补 trace 上下文用、metric 看趋势用，互补不是替代。


#### Evidence

- `apps/desktop/src/instrumentation.ts`
- `apps/desktop/src/shared/utils/galileo-logger.ts`

---

## 🔒 安全（security）— 1 题

### Q1. 中间件里那段 jose.compactDecrypt 是在解什么？为什么放在 Edge Runtime？

> 来源：`tp-002` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| JWE 与 JWT 的区别 | 必须掌握 | 面试官常追问为什么用 JWE 不用 JWT |
| Edge Runtime 的 API 限制 | 必须掌握 | jose 选 Web Crypto 路径就是因为这条 |
| Cookie SameSite 与 HttpOnly | 加分项 | 聊到 cookie 必然被问安全属性 |

#### 三档回答

**🟢 一句话**：解 TAI 智能网关下发的 JWE 身份票据，拿 StaffId 后写 cookie；Edge 最贴近请求入口、延迟最小。

**🔵 标准**（默认）：

腾讯智能网关 TAI 在请求头里下发 x-tai-identity，是一个 JWE 压缩格式票据，里头有 StaffId 和 LoginName。middleware.ts 跑 Edge Runtime，先按 MODE 取测试或正式环境的解密 token，再用 jose 的 compactDecrypt 解 JWE 拿明文。解出来的字段写成 STAFFID、STAFFNAME、prompt_username 三个 cookie，前端组件直接用。matcher 排除 _next 与 api，避免静态资源和接口路径反复解密。key 不进仓库，按环境从平台侧注入，cookie 只暴露 StaffId 等身份字段，敏感字段不下放给前端。matcher 模式 ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] 是为了避免静态资源和接口路径每次请求都跑一次 JWE 解密。

<details><summary>🔴 深挖（点击展开）</summary>

TAI 是公司的统一身份网关，下发 x-tai-identity 头给上游应用，里头是一个 JWE 压缩序列化票据，必须用预共享的解密密钥解才能拿到 StaffId、LoginName。middleware.ts 跑在 Edge Runtime 上：选 Edge 是因为这是页面请求第一站，靠近入口、冷启动也快；解出来的身份要在所有页面 RSC 渲染前可见，放在节点应用层会多一次中转。逻辑上分四步：第一步按 process.env.MODE 取测试或正式环境的解密 token，避免环境串号；第二步从 request 头读 x-tai-identity，缺失就走未登录降级；第三步用 jose 的 compactDecrypt 把 JWE 解开，拿到 payload 后 JSON.parse 取 StaffId、LoginName；第四步把它们写进 STAFFID、STAFFNAME、prompt_username 三个 cookie，前端组件直接读，不再回查接口。matcher 用 ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] 排除静态资源与 api，避免接口路径每请求都做一次 JWE 解，也避免静态资产白白走解密。中间还兼容了一段老的 /home/chat?qpilot_id 链 301 重定向到新地址，迁移期老链接不掉。安全这边密钥不进代码仓，按环境注入；cookie 只暴露 StaffId 这种身份标识，敏感字段不下发。另一个考量是 key 轮换：TAI 平台会在小时级别下发新 key，所以解密 token 不能写死代码，而是每次启动时读 process.env.TAI_DECRYPT_KEY_TEST 或 PROD，部署侧通过滚动更新换 key 不需要重发版。错误处理上，compactDecrypt 抛错时我们不做 5xx，而是让请求落到匿名态继续执行，这样失败不会让整站不可用，只在监控里通过 chat_error_count metric 加一个 auth_decrypt_fail label 看到趋势。redirect 那段额外加了一个 301 用来兼容旧 /home/chat?qpilot_id 路径，迁移时收到的反馈是老链接还在外部文档里飘，所以不能简单 404。

</details>

#### 补齐方案

- 📚 必读
  - [ ] RFC 7516 JSON Web Encryption
  - [ ] Next.js Middleware 与 Edge Runtime 文档
  - [ ] jose 文档的 compactDecrypt 与 KeyLike 章节
- 🛠️ 动手
  - [ ] 写一个最小 Express demo，签发 JWE 并在 middleware 里解开
- ⚠️ 常见踩坑
  - Edge Runtime 不支持 node:crypto 全部 API，得走 Web Crypto 兼容的 jose
  - matcher 写错会把 api 也包进去导致接口反复解 JWE
  - MODE 没切环境会用错密钥，错误信息只是 decrypt failed 难排查
- 🤔 自测题（合上文档自答）
  - [ ] JWE 解密失败你怎么降级？
  - [ ] 为什么不在 API 路由里做鉴权而是 middleware？
  - [ ] 如果 token 泄漏怎么补救？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么把鉴权放 Edge Middleware 而不是 API 路由或者后端服务？**（trade-off）
  > 页面请求在 Edge 就能拒掉未登录，RSC 渲染前 cookie 已经写好，避免多一次后端来回；放 API 路由要每个 handler 重复鉴权，放后端会多一跳。


#### Evidence

- `apps/desktop/src/middleware.ts`

---

## ⚖️ 取舍（trade-off）— 3 题

### Q1. 为什么 /api/chat、/api/qpilot-chat、/api/chat-main-agent-v2 三条聊天链路同时存在？

> 来源：`tp-009` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Edge vs Node Runtime | 必须掌握 | 聊到迁移就被问 runtime 怎么选 |
| 增量迁移策略 | 加分项 | 面试官会问下线老接口的判定标准 |

#### 三档回答

**🟢 一句话**：新链路是 ToolLoopAgent + Vercel AI SDK 5；老两条还在跑是为了兼容旧组件不一次切。

**🔵 标准**（默认）：

三条链路对应三个时期。/api/chat 是最早的实现，跑 Edge Runtime 加自研 OpenAIStream，事件结构裸；/api/qpilot-chat 是中间态，用 eventsource-parser 直接透传上游 SSE，专门对接公司内部某个上游网关；/api/chat-main-agent-v2 是新链路，跑 Node Runtime 加 Vercel AI SDK 5 的 ToolLoopAgent + createUIMessageStream，支持多步工具与 abort。新组件统一接新链路，旧组件继续用老接口，没做一次性大切是为了控制改动面与回归风险。下线老端点的硬条件是看板上调用量连续一周降到零，目前 /api/qpilot-chat 还有少量插件路径在打，所以保留。

<details><summary>🔴 深挖（点击展开）</summary>

这三条链路的演进就是一个典型的「改造旧系统不能停服」的故事。最早 /api/chat 用 Edge Runtime 加自研 OpenAIStream，思路是模仿 Vercel AI SDK 1 的 OpenAIStream 但裸写：runtime 选 Edge 是因为单次响应小、想要低延迟；SSE 事件结构裸，前端按 OpenAI delta 协议解。后来要接公司内部一个上游网关吐 SSE 的服务，写了 /api/qpilot-chat：用 eventsource-parser 解上游 SSE，按事件类型透传给前端，runtime 还是 Edge。这条主要是个 proxy，不做工具调用编排。再后来要做多 Agent、多步工具、子 Agent，自研 OpenAIStream 每加一个 feature 都要改协议，外层 loop 越写越复杂，stop 与中断也得另写。所以做了 /api/chat-main-agent-v2：直接绑 Vercel AI SDK 5，runtime 改 Node 因为 ToolLoopAgent 跑多步加工具时间长 Edge 跑不下，maxDuration 设 300 秒。新链路接管所有新组件，比如 main-agent 入口、新版聊天页面；老链路继续给旧组件用，比如某些移动端页面、某些插件场景。决策点是：第一，老链路服务的请求量虽然少了但还稳定，没必要为了统一冒回归风险；第二，老链路接的上游网关协议跟新链路不一样，统一要先做协议适配层，工作量比同时维护两条链路还大；第三，下线老链路要看埋点确认零调用，目前还有调用。所以策略就是新链路接住新需求，老链路冻结只修 P0。一个具体取舍是 runtime：Edge 启动快但 maxDuration 短，Node 启动慢但能跑长任务；新链路选 Node 是被多步工具调用逼出来的，不是 Node 本身更好。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Next.js Edge Runtime 与 Node.js Runtime 文档
  - [ ] Strangler Fig Pattern（增量替换设计模式）
- 🛠️ 动手
  - [ ] 在埋点里给一个旧接口加调用计数，输出每天调用量曲线
- ⚠️ 常见踩坑
  - 下线老接口前没看埋点，直接删导致小流量场景崩
  - Edge 上跑长任务被 maxDuration 砍
  - eventsource-parser 上游断流时不主动关，前端连接挂死
- 🤔 自测题（合上文档自答）
  - [ ] 你打算什么时候下线 /api/chat？
  - [ ] 如果新链路出 bug 你怎么回滚到老链路？
  - [ ] 为什么不一次切到新链路？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `apps/desktop/src/app/api/chat/route.ts`
- `apps/desktop/src/app/api/qpilot-chat/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`

---

### Q2. 你们怎么把 web_bak 这一坨老代码逐步迁到新栈？/migrate-component 命令做了什么？

> 来源：`tp-013` · scope: frontend · web_bak · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| AST 改写与 jscodeshift | 必须掌握 | 面试官常问自动迁移的实现方式 |
| 增量迁移 / Strangler Fig | 必须掌握 | 迁移策略本身就是考察点 |
| antd 与 shadcn 设计差异 | 加分项 | 聊到映射表必然涉及 |

#### 三档回答

**🟢 一句话**：按组件粒度迁；映射表把 antd → shadcn、ahooks → React Query、Pages Router → App Router；/migrate-component 是 Cursor skill 自动改写。

**🔵 标准**（默认）：

web_bak 是老栈：Ant Design + Pages Router + ahooks。直接重写成本太高。我们做了三件事：第一定一份明确的映射表，比如 antd Button → shadcn Button、@ant-design/icons → lucide-react、ahooks useRequest → TanStack useQuery、Pages Router 文件路由 → App Router 路由组；第二在 .cursor/ 目录里写 skills 与 commands，/migrate-component 就是一个 skill，输入老组件路径，按映射表自动出新组件代码；第三按组件粒度迁，QPilotFormV2 这种业务核心先动，迁完跑回归再合。新代码进 apps/desktop，老代码留在 web_bak 当参考。迁移过程中我们也维护一份 antd 实际用到的 props 清单，因为映射表第一版漏过一些 antd 私有 prop，靠回归才发现，之后把 prop 级规则也加进映射表。

<details><summary>🔴 深挖（点击展开）</summary>

迁移这件事最大的风险是大改一次回归量爆炸。我们的策略是「映射表 + 工具 + 小批次」。映射表是核心，写在 skill 内部，一对一覆盖三类东西：UI 组件层 antd 全家桶映到 shadcn/ui 与 Radix，icon 从 @ant-design/icons 映到 lucide-react；数据层 ahooks 的 useRequest、useDebounce 等映到 TanStack Query、useDeferredValue 等 React 19 内建或自写 hook；路由层 Pages Router 的 getServerSideProps 加 _app.tsx 映到 App Router 的 layout.tsx 加 page.tsx 加 RSC 直接 fetch。光有映射不够，因为 antd 的 message.success 是命令式 API，shadcn 的 toast 是 hook，有些写法没法机械转，所以在映射表里专门标了「需要人工确认」的 case。/migrate-component 这个命令做的事情是：第一步读老组件文件，AST 解析认出 antd import；第二步按映射表替换 import 与 JSX；第三步在 jsx 里发现 message.success 这种命令式调用就插一个 TODO 注释让人来改；第四步把改完的代码写到 apps/desktop 对应路径，再补一句 import { useToast } from '@/hooks/use-toast'。批次上一次迁一个组件再跑端到端回归，避免大批量合后查错误难。新组件进 apps/desktop，老组件留在 web_bak 当参考与对照，等所有组件迁完才考虑下线 web_bak。代价是过渡期两套代码并存，但好处是任何时间点产品都能跑、出问题影响面可控。还有个细节，迁移过程中我们补了一份「antd 我们用过哪些 props」清单，因为映射表第一版漏了些 antd-specific 的小 prop，跑回归才发现，后来把 prop 级也加进映射表。另外迁移阶段我们专门起了一个统计：每次合 PR 时都把 web_bak 剩余组件数写到 dashboard，进度可见，团队也有明确的退场目标。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Strangler Fig Pattern（Martin Fowler）
  - [ ] shadcn/ui 与 Radix UI 文档
- 🛠️ 动手
  - [ ] 用 jscodeshift 写一个把 antd Button 转成 shadcn Button 的 codemod 脚本
- ⚠️ 常见踩坑
  - 命令式 API 转 hook 必须人工确认，机械转会拿不到 React context
  - 同时保留新老路由会让 SEO/SSR 行为分裂
  - 映射表覆盖不全的 prop 跑回归才暴露
- 🤔 自测题（合上文档自答）
  - [ ] 如果某个 antd 组件 shadcn 没有对应的怎么办？
  - [ ] Pages Router 与 App Router 同 repo 共存会怎样？
  - [ ] 怎么判断 web_bak 可以下线了？
- ⏱️ 预估学习时长：**1 周**


#### Evidence

- `web_bak/src/`
- `.cursor/`

---

### Q3. 你们 middleware 在 Edge 上、main-agent 在 Node 上、instrumentation 也在 Node 上，runtime 是怎么选的？

> 来源：`tp-015` · scope: backend · apps/desktop · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Next.js Edge 与 Node Runtime 能力差异 | 必须掌握 | 运行时选型直接决定能不能跑 |
| node:async_hooks 与 OTel context | 加分项 | 解释为什么 instrumentation 必须 Node |
| maxDuration 平台限制 | 必须掌握 | 长任务一定碰到这条 |

#### 三档回答

**🟢 一句话**：Edge 选给低延迟短任务，Node 选给长任务和需要 node API 的任务，按能力与时长划分。

**🔵 标准**（默认）：

三个组件三种诉求。middleware 只解 JWE 写 cookie，毫秒级、要离用户最近，Edge 合适；jose 走 Web Crypto 路径在 Edge 上能跑。/api/chat-main-agent-v2 是多步工具加流式，maxDuration 设 300 秒，Edge 的执行窗口扛不住，所以选 Node。instrumentation.ts 起 OTel node-sdk，依赖 node:async_hooks 这种 Node 独有 API，Edge 直接缺失，所以也只在 NEXT_RUNTIME 为 nodejs 时跑。runtime 选型核心看两条：执行时长够不够、需要的 API 在不在。灰区的一个具体例子是数据库连接：Edge 上要用 HTTP-based 驱动比如 Neon serverless driver，传统 pg 客户端不可用；我们用 Prisma 走传统连接，所以走 Prisma 的路由全部锁 Node。

<details><summary>🔴 深挖（点击展开）</summary>

runtime 选型这事在 Next.js 里其实是一个工程权衡，不是「Edge 一定好」或者「Node 一定保底」。我们这里有三个具体场景。第一个 middleware.ts 选 Edge：middleware 在 Vercel 与多数 Edge 平台上是部署到全球节点的，请求路径上离用户最近，启动开销极小、TLS 已建好，处理时长以毫秒计；jose 解 JWE 用的是 Web Crypto 在 Edge 上原生可用，没有 Node 模块依赖。如果把它放 Node 一来要走一跳到 Node 应用，二来 cold start 慢一截，三来全球分布的优势没了。第二个 /api/chat-main-agent-v2 选 Node：ToolLoopAgent 跑多步加工具调用经常一次几十秒到几分钟，maxDuration 设 300 秒；Edge 的执行窗口（不同平台 25 到 60 秒不等）对这种场景就是杀手；另外工具调用里要起子进程、读文件、连数据库，这些在 Edge 上要么没有要么受限。Node 这边 next.config 里 runtime: 'nodejs' 加上 export const maxDuration = 300。代价是 Node 路由的冷启动比 Edge 慢，但聊天场景用户已经在等流式输出了，对冷启动没那么敏感。第三个 instrumentation.ts 必须 Node：OTel node-sdk 依赖 node:async_hooks 跟踪异步上下文，Edge 不提供这套 API。所以代码进入 register 后第一行 if (process.env.NEXT_RUNTIME !== 'nodejs') return; Edge 进了直接退出。整体决策框架就是两步：算最长执行时间是不是大于 Edge 窗口的 70%（留余量给冷启动）；列依赖看有没有 Node 专属 API。两个其中一个命中就上 Node，否则 Edge。还有一类灰色地带是数据库连接：Postgres 直连在 Edge 上要走 HTTP 适配层（比如 Neon serverless driver），传统 pg 客户端不行；我们的数据库客户端是传统 Prisma，所以接 Prisma 的路由都得 Node。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Next.js Runtime 文档：Edge 与 Node 能力对比
  - [ ] Vercel 文档：function maxDuration 限制
- 🛠️ 动手
  - [ ] 在一个 Next.js 项目里同时部署一个 Edge route 与一个 Node route，对比冷启动延迟
- ⚠️ 常见踩坑
  - 把 Prisma 直接放 Edge 上会运行时报 require not defined
  - Edge 上跑长任务会被砍但日志不明显，看似随机断流
  - instrumentation 在 Edge 上没判 runtime 会报 async_hooks 缺失
- 🤔 自测题（合上文档自答）
  - [ ] Edge Runtime 不支持哪些 Node API？
  - [ ] 如果以后 Edge maxDuration 放宽了你会迁过去吗？
  - [ ] Edge 上数据库怎么连？
- ⏱️ 预估学习时长：**半天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不全部用 Node 简单点？**（trade-off）
  > middleware 是每个页面请求都要过一次的热路径，放 Node 会多一跳并且失去全球边缘部署的近用户优势；中间件本身做的事在 Edge 上完全够，没必要为了形式统一吃这个延迟。


#### Evidence

- `apps/desktop/src/middleware.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/instrumentation.ts`

---

