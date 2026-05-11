# QPilot Web — Interview Preparation

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 2      | 🧩 |
| architecture  | 5 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 1  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 3 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

An in-house LLMOps workspace at Tencent, a desktop and mobile Next.js app for multi-model and multi-agent orchestration with sharing.

### Standard (30–60 seconds)

QPilot Web is an in-house LLMOps workspace. The desktop is a Next.js 16 App Router fullstack app, the mobile is a separate Next.js app, and they share packages/ui-shared, utils, and types. The main chat pipeline uses Vercel AI SDK 5's ToolLoopAgent plus createUIMessageStream on Node Runtime with maxDuration set to 300 seconds. Auth lives in an Edge Middleware that uses jose to decrypt the JWE identity header from the TAI gateway and writes a STAFFID cookie. The message tree is modeled in Prisma: Conversation keeps currentNodeId, and messages link by parentId to form branches. The frontend state is split into 21 Zustand stores that persist only when needed. Monitoring goes to Galileo OTel with four custom business metrics.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

QPilot Web moves the in-house AI platform from single-model chat to multi-agent orchestration on multiple devices. On the desktop the stack is Next.js 16 plus React 19 plus Tailwind 4 plus shadcn/ui, with Zustand 5 plus TanStack Query 5 for state; the mobile app uses packages/ui-mobile as its own component library. The monorepo is a pnpm workspace with catalog pinning React and Next.js core versions, the packages layer uses lerna independent so each package versions on its own, the preinstall hook calls only-allow pnpm to reject npm and yarn, and CI enforces lint with max-warnings set to 0. The main chat pipeline lives in /api/chat-main-agent-v2: ToolLoopAgent from Vercel AI SDK 5 drives the multi-step loop, the stream returns through createUIMessageStream paired with createUIMessageStreamResponse to emit SSE, and to support long jobs maxDuration is set to 300. On entry every session registers its AbortController in a per-session table, and when the user hits stop the frontend calls /api/chat-main-agent-v2/stop with conversationId and the backend calls abortSession; the AbortSignal propagates into tools, sub-agents, and streamText. Context compression is layered: context-budget computes the budget against the model's window, context-compress trims history and tool outputs in prepareStep, context-compressor supplies the strategies, and it only triggers above threshold so short chats skip it. For auth, middleware.ts runs on Edge Runtime with the matcher excluding _next and api, jose.compactDecrypt unwraps the x-tai-identity JWE to read StaffId and LoginName, the decryption token switches by MODE, and STAFFID, STAFFNAME, and prompt_username are written as cookies. The message tree is modeled in Prisma with Conversation.currentNodeId pointing to the active branch's leaf and Message.parentId linking to its parent; branch switching happens at the AI Elements Message component, deletes cascade, and conversationId is indexed. For monitoring, instrumentation.ts calls SetupGalileo only under nodejs runtime, attaches unhandledRejection and uncaughtException, and registers four custom metrics: api_request_duration, page_render_duration, chat_request_count, and chat_error_count. The frontend splits state into 21 Zustand stores like useSelectedModelStore, usePendingMessageStore, and useMainAgentConfigStore with a barrel export and persistence only where needed. The legacy /api/chat runs on Edge with hand-written OpenAIStream and /api/qpilot-chat uses eventsource-parser to relay upstream SSE; new components plug into the main pipeline and old components keep their old endpoints.

</details>

## ✨ Highlights

- **ToolLoopAgent + UIMessageStream 主链路重构** (architecture · fullstack)
  The chat pipeline used to be hand-written OpenAIStream over SSE, and multi-step tool calls were stitched in the outer code. We moved to Vercel AI SDK 5: ToolLoopAgent drives the loop, streamText emits tokens, createUIMessageStream wraps them as UI events, and createUIMessageStreamResponse returns SSE. maxDuration is set to 300 seconds to cover long jobs. Sub-agents, tool calls, and abort signals all share the same stream.
  > Keywords: `ToolLoopAgent` · `createUIMessageStream` · `Vercel AI SDK 5` · `SSE` · `maxDuration`
- **Token 预算 + 阶梯式上下文压缩** (performance · fullstack)
  Multi-turn chats easily exceed the context window. We used to truncate history bluntly and lose information. Now we split it into three layers: context-budget computes the budget against the model window, context-compressor provides compression strategies, and context-compress trims history and tool outputs inside ToolLoopAgent's prepareStep based on real token usage. Compression only runs above threshold, so short chats skip it. Multi-turn no longer blows the window, even with heavy tool-calling.
  > Keywords: `context-budget` · `prepareStep` · `token-usage` · `compression` · `tool-output`
- **Edge Middleware + jose JWE 解 TAI 身份头** (security · backend)
  Tencent's TAI gateway delivers a JWE-compact identity ticket in the x-tai-identity header, and we need to decrypt it to get StaffId and LoginName. We run middleware.ts on Edge Runtime and use jose's compactDecrypt to unwrap the JWE, switch the decryption token by MODE between test and production, and write StaffId, LoginName, and prompt_username back as cookies for the frontend. The matcher excludes _next and api so static assets and API paths do not decrypt repeatedly.
  > Keywords: `jose` · `JWE` · `Edge Runtime` · `TAI` · `cookie`
- **Galileo OpenTelemetry 监控接入** (observability · backend)
  Server-side stability used to rely on the platform's health check. We call SetupGalileo at startup in instrumentation.ts and attach unhandledRejection and uncaughtException handlers so uncaught errors are reported in full. We added four custom OTel metrics: api_request_duration, page_render_duration, chat_request_count, and chat_error_count, with different report endpoints for test and production by MODE. The chat endpoint's error rate and latency now show up as curves directly.
  > Keywords: `Galileo` · `OpenTelemetry` · `metrics` · `instrumentation` · `unhandled-rejection`
- **Prisma 消息树 + 分支切换** (architecture · backend)
  Users want to regenerate from a specific message or go back to an old answer and keep talking. A flat array won't do. In Prisma we added currentNodeId on Conversation, and Message uses parentId to form a tree. The frontend handles branch switching at the AI Elements Message layer, and switching only updates currentNodeId without touching old nodes. Deletes cascade, and conversationId is indexed so tree traversal stays fast.
  > Keywords: `Prisma` · `tree` · `parentId` · `currentNodeId` · `cascade`
- **21 个 Zustand Store 的分层治理** (architecture · frontend)
  If frontend state goes into one big store, any field change re-renders every subscriber. We split it by responsibility into 21 stores: layout, user, model selection, pending message, draft, tool library, plugins, git auth, main-agent config, and so on, with a barrel export in stores/index.ts. Only stores that need to survive refresh (selectedModel for example) use the persist middleware; the rest stay in memory. Components subscribe per slice, and re-render scope tightens noticeably.
  > Keywords: `zustand` · `store-slicing` · `persist` · `barrel` · `subscription`


## 🏗️ Architecture (architecture) — 5 Q&A

### Q1. How did you rewrite the main chat pipeline on Vercel AI SDK 5? What do ToolLoopAgent and createUIMessageStream each handle?

> Source: `tp-001` · scope: fullstack · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Vercel AI SDK 5 stream API | 必须掌握 | 理解 streamText 与 UIMessageStream 分层是接得对的前提 |
| Edge vs Node Runtime | 必须掌握 | 面试官会追问为什么不放 Edge 上 |
| AbortController 链式传递 | 加分项 | 讲清停止链路能拉开候选人差距 |

#### Tiered answers

**🟢 Elevator**: ToolLoopAgent drives the multi-step loop, createUIMessageStream wraps tokens and tool events into a UI message stream returned as SSE.

**🔵 Standard** (default):

The old /api/chat used hand-written OpenAIStream and stitched multi-step tool calls in the outer code with raw events. We moved to /api/chat-main-agent-v2: ToolLoopAgent drives the multi-step loop, calling streamText each step, with tool calls, repair, and sub-agents handled inside the loop. createUIMessageStream wraps streamText's token, tool_call, and tool_result events into a UI message stream, and createUIMessageStreamResponse returns SSE. We run Node runtime with maxDuration set to 300 seconds to cover long jobs. The whole pipeline is one stream.On the client side useChat consumes the SSE directly and AI Elements' Message component renders chunks by event type. Conceptually streamText is the token source, ToolLoopAgent drives the loop, and createUIMessageStream wraps events; the three responsibilities are decoupled and unit-testable in isolation.

<details><summary>🔴 Deep dive (click to expand)</summary>

The old /api/chat ran on Edge with hand-written OpenAIStream, raw events, an outer loop for tool calls, and a separate stop mechanism. The rewrite binds to Vercel AI SDK 5 directly: we switched runtime to Node because ToolLoopAgent's multi-step loop with tool execution runs long, and Edge's execution window is not enough; on Node we set maxDuration to 300 seconds. ToolLoopAgent drives the multi-step loop, calling streamText each step to get the token stream, while tool calls, tool repair, and sub-agent streams all sit on the same loop, so the outer code stops stitching. Outside the loop, createUIMessageStream wraps streamText's events as UI message events: tokens become text_delta, tool calls become tool_call and tool_result, then createUIMessageStreamResponse returns SSE. The frontend hooks it up with useChat and renders by event type at the AI Elements Message component. Cancellation has its own /api/chat-main-agent-v2/stop endpoint: when a session enters the main pipeline its AbortController is registered in a per-session table, and on the stop click that endpoint calls abortSession by conversationId, so the AbortSignal propagates into streamText, tools, and sub-agents and the whole stream exits together. The old /api/chat and /api/qpilot-chat still run; we did not migrate every legacy component to keep the change surface small, and new components plug into the main pipeline.Before the rewrite we also evaluated rolling our own agent loop and decided against it because SDK 5's ToolLoopAgent already abstracts step scheduling, tool repair, and sub-agent stitching, and rewriting these would not earn its keep. Pairing with AI Elements' Message component, the client renders by part type and tool-call parts can expand to show args and result, which beats raw SSE for debugging. We also kept a thin compatibility wrapper for the legacy request body so useChat does not distinguish endpoints; the new endpoint simply emits a richer set of part types.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Vercel AI SDK 5 官方文档 ToolLoopAgent 与 streamText 章节
  - [ ] Next.js Route Handlers 与 Runtime 选型文档
- 🛠️ Hands-on
  - [ ] 用 createUIMessageStream 写一个 30 行的 echo Agent 并跑通 SSE
- ⚠️ Common pitfalls
  - Edge Runtime 下 maxDuration 上限远小于 Node，长任务会被砍
  - createUIMessageStreamResponse 不会自动 flush headers，Content-Type 要显式声明
  - ToolLoopAgent 的 prepareStep 改 messages 必须返回新数组，不要原地改
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果换成 WebSocket 你会怎么改？
  - [ ] ToolLoopAgent 内部失败时怎么继续？
  - [ ] 为什么不把 maxDuration 调得更大？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not use WebSocket instead of SSE?** (trade-off)
  > Almost all events are server-to-client. SSE is HTTP-compatible, EventSource auto-reconnects, and we do not need special config in nginx or k8s ingress. WebSocket is bidirectional but adds handshake, heartbeat, and reconnect handling.


#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`

---

### Q2. Your chat supports regenerating from a message and switching branches. How is the data model designed?

> Source: `tp-006` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 邻接表与树查询 | 必须掌握 | 面试官会问为什么不用 nested set 或 closure table |
| Prisma onDelete Cascade | 必须掌握 | 删除策略直接影响一致性 |
| 事务一致性 | 加分项 | currentNodeId 与新消息插入要在一个事务 |

#### Tiered answers

**🟢 Elevator**: Conversation has currentNodeId, messages link by parentId to form a tree, and switching only updates currentNodeId.

**🔵 Standard** (default):

Messages cannot be a flat array because regenerating from a message has to keep the old branch. In Prisma, Conversation has currentNodeId pointing to the current branch's leaf, and Message has parentId linking to its parent, forming a tree. The frontend walks up from the leaf to get the visible message sequence. Switching only updates currentNodeId; old branch nodes stay. Deleting a Conversation cascades to its Messages, and conversationId is indexed so traversal stays fast.Switching back to an old answer is just setting currentNodeId to that branch's leaf; the data does not move. Deletion is restricted: deleting a Conversation cascades to all messages, but deleting a single message is leaf-only to avoid orphans in the chain.

<details><summary>🔴 Deep dive (click to expand)</summary>

The core need is regenerating without losing history. A flat message array either overwrites the old one and loses context or marks it deleted and leaves a mess. So we modeled it as a tree. The Prisma schema gives Message a parentId column, self-referential on the same table, nullable for the root. Conversation has a currentNodeId pointing to the current visible branch's leaf. To render the current chat the frontend walks up parentId from currentNodeId to get the full chain. Regeneration flow: when the user regenerates at the Nth message, the backend creates a new assistant message with that message as the parent and switches currentNodeId to the new node; the old assistant stays in the tree as a sibling branch. Switching back to the old answer just sets currentNodeId. The UI handles sibling enumeration and switch buttons at the AI Elements Message component. For deletion, Conversation has onDelete: Cascade so all messages drop with it; deleting a single message is restricted to leaves to avoid breaking the chain and creating orphans. For indexing, conversationId is indexed because fetching all nodes for a conversation is hot; parentId is not separately indexed because traversal goes child-to-parent by primary key, which is already cheap. At scale each user conversation has tens to hundreds of nodes and the tree is around a dozen levels deep, so traversal is IO not compute, and we did not need recursive CTEs. The cost is keeping currentNodeId consistent, so insertion and switching update currentNodeId in the same transaction.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Prisma 关系字段与级联删除文档
  - [ ] 邻接表 / 路径枚举 / 嵌套集 / 闭包表四种树存储对比的经典文章
- 🛠️ Hands-on
  - [ ] 在 Prisma 里建一个自引用 parentId 模型，写出树遍历的 raw query
- ⚠️ Common pitfalls
  - currentNodeId 与新消息插入不同事务会出现切了 id 但节点没建好的中间态
  - 允许删中间节点会产生孤儿子树
  - 树太深时一次循环 N 次 findUnique，要用 CTE 一次拉
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果树深到几千层会怎么样？
  - [ ] 为什么不用 closure table？
  - [ ] 并发重生成同一节点会怎样？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why adjacency list rather than a closure table?** (trade-off)
  > Our trees are shallow and the read path walks from leaf upward, so adjacency list traversal by primary key is fast enough. Closure tables insert all ancestor edges on write, multiplying writes, which is wasteful for high-frequency message inserts.


#### Evidence

- `apps/desktop/prisma/schema.prisma`
- `apps/desktop/src/components/ai-elements/`

---

### Q3. Why did you split frontend state into 21 Zustand stores instead of one big store?

> Source: `tp-007` · scope: frontend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Zustand selector 与 useShallow | 必须掌握 | 决定订阅粒度是否真的细 |
| persist 中间件与 partialize | 必须掌握 | 持久化字段选错会泄漏临时态 |
| store 拆分原则 | 加分项 | 面试官会问怎么决定边界 |

#### Tiered answers

**🟢 Elevator**: A monolithic store re-renders every subscriber on any field change; splitting by responsibility brings subscription granularity back to the component level.

**🔵 Standard** (default):

Zustand subscriptions are per store instance: when a component subscribes to a store, any field change re-runs the selector. If everything sits in one store, a hot field like the selected model triggers selector re-runs across the whole app. We split by responsibility into 21 stores: useLayoutStore, useUserStore, useSelectedModelStore, usePendingMessageStore, useToolboxStore, useMainAgentConfigStore, and so on, with a barrel in stores/index.ts. Stores that need to survive refresh (selected model, layout prefs) use the persist middleware; the rest stay in memory. Components subscribe per slice, and the re-render scope tightens noticeably.After rollout the first win was that unnecessary re-renders on model switch disappeared, and the second was visibly smoother typing in form fields. The cost is more stores to maintain, and a single barrel in stores/index.ts keeps the auto-import entry tight so paths stay consistent.

<details><summary>🔴 Deep dive (click to expand)</summary>

The decision to split is not by field count but by update cadence and field cohesion. Three rules. First, group fields with matching update cadence: useLayoutStore (width, sidebar toggle) gets user-triggered changes occasionally, while usePendingMessageStore (draft) writes on every keystroke; mixing them would re-run selectors for low-frequency subscribers on every keystroke, so we split. Second, group by shared subscription path: useSelectedModelStore is touched by almost every chat-related view, so giving it its own store insulates it from unrelated writes; useMainAgentConfigStore is settings-only and can stay separate. Third, group by persistence policy: selectedModel persists to localStorage to survive refresh, pending draft does not — mixing makes the persist middleware schema awkward. The 21 names include useLayoutStore, useUserStore, useSelectedModelStore, usePendingMessageStore, useCreateDraftStore, useToolboxStore, usePluginsStore, useGitAuthStore, useMainAgentConfigStore, useSessionHistoryStore, and others, barrel-exported in stores/index.ts so components import from one place. Persistent stores configure persist with a dedicated storage key and partialize to avoid persisting transient fields; useShallow is used in selectors when comparing multiple fields, to skip false re-renders from new object references. We hit two pitfalls: early on selectedModel lived inside useUserStore, so every user-subscribing component re-ran on model switch, and pulling it out fixed it; persist schema changes without migrate left old users with missing fields, so we added version plus migrate and it stabilized. The cost is many stores, so we import on demand instead of all at once, and the single barrel in index.ts keeps the IDE auto-import entry tight.One more detail: the persist middleware uses a version field for migration; without it a schema bump silently strips fields from old users, so we wrote a migrate function that fills missing fields with defaults, and after one round of migration we have not seen hydration mismatch since.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Zustand 官方 docs：selector 与 shallow
  - [ ] Zustand persist 中间件文档
- 🛠️ Hands-on
  - [ ] 把一个 useState 巨型组件拆成两三个 zustand store，比较渲染次数
- ⚠️ Common pitfalls
  - selector 返回新对象每次都触发重渲染，要用 useShallow
  - persist 没写 partialize 会把临时字段也存进 localStorage
  - schema 升级不写 migrate，老用户刷出来字段缺导致崩溃
- 🤔 Self-check questions (answer without notes)
  - [ ] 拆这么多 store 怎么避免维护成本爆炸？
  - [ ] 用 Redux Toolkit 会更好吗？
  - [ ] selectedModel 用 React Context 行不行？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not use React Context?** (trade-off)
  > Context re-renders every consumer when the value reference changes and can't do selector-level subscriptions; Zustand's subscribeWithSelector with useShallow notifies only on the selected field's change.


#### Evidence

- `apps/desktop/src/stores/`

---

### Q4. How do you organize pages using App Router's route groups and the private folder convention?

> Source: `tp-008` · scope: frontend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| App Router 路由组与私有目录 | 必须掌握 | 理解 (group) 与 _folder 的语义差异 |
| RSC 与 'use client' 边界 | 必须掌握 | layout 选 server 还是 client 直接影响包大小 |
| 组件就近原则 | 加分项 | 聊到大型项目目录组织必问 |

#### Tiered answers

**🟢 Elevator**: (app) route group carries the sidebar layout, (standalone) is for full-screen pages; _components private folders hold page-specific components.

**🔵 Standard** (default):

Under src/app we have two route groups. (app) wraps a sidebar layout for everyday entries: home, chat, community, agents, tools, settings, workflow. (standalone) skips the layout for full-screen pages like share view and login callback. Route groups use parentheses in folder names, do not show up in URLs, and just mark layout boundaries. Component placement follows co-location: page-specific components live in a sibling _components folder, which Next.js treats as a private directory that does not become a route and should not be imported from elsewhere. Components reused across pages move up to src/components.

<details><summary>🔴 Deep dive (click to expand)</summary>

The goal here is clear layouts, co-located components, and obvious reuse boundaries. Next.js 16 App Router gives two mechanisms: route groups (folders in parentheses) only mark layout boundaries without showing in URLs, and private folders (underscore prefix) tell the router not to treat them as routes. We use both for a three-layer structure. First layer, route groups: (app) and (standalone). (app) carries a shared layout with sidebar, topbar, and status bar; under it are the business pages like home, chat, community, agents, tools, settings, and workflow, none of which carry (app) in the URL. (standalone) carries an empty layout for full-screen pages like share and auth callback. Second layer, page-level layouts: a page like chat nests its own layout.tsx for stateful UI such as the conversation list sidebar. Third layer, _components: each route folder has a _components subfolder holding components used only by that page, like chat/_components/Chat.tsx; the underscore tells Next.js to skip routing, imports stay relative, and importing one route's _components from another route is banned via ESLint and review. The benefit is locating a component does not require a global search — you map URL to folder. Components promote to src/components only when truly shared. Combined with RSC, layouts default to server, and pieces using client hooks like useState are pulled out into 'use client' boundaries instead of marking the whole layout client.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Next.js App Router 官方文档：Route Groups、Private Folders、Layouts
  - [ ] React Server Components 官方介绍
- 🛠️ Hands-on
  - [ ] 搭一个最小 App Router 项目，建两个路由组挂不同 layout，验证 URL 不带组名
- ⚠️ Common pitfalls
  - 路由组括号包名打错变成实际 URL 段
  - _components 被别的路由 import 形成隐式耦合
  - 把整个 layout 标 'use client' 导致 server 优势没了
- 🤔 Self-check questions (answer without notes)
  - [ ] (app) 与 (standalone) 共享某个组件你怎么放？
  - [ ] 如果两个路由组要共享 state 你怎么做？
  - [ ] 为什么不用 Pages Router？
- ⏱️ Estimated time: **半天**


#### Evidence

- `apps/desktop/src/app/(app)/`
- `apps/desktop/CODEBUDDY.md`

---

### Q5. How does the pnpm catalog plus lerna independent setup work, and why do you need both layers?

> Source: `tp-012` · scope: infra · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| pnpm workspace catalog | 必须掌握 | 面试官常问 catalog vs overrides 区别 |
| lerna independent vs fixed | 必须掌握 | monorepo 发版策略选型常考 |
| preinstall only-allow | 加分项 | 工具链一致性的细节 |

#### Tiered answers

**🟢 Elevator**: pnpm catalog pins shared core versions; lerna independent gives each package its own version and release cadence.

**🔵 Standard** (default):

pnpm-workspace.yaml's catalog field pins shared core versions like React, Next.js, and Tailwind in one place, and child packages reference them with catalog: to avoid version drift. lerna.json uses independent mode so every package under packages/ has its own version field, and lerna publish from-package bumps each independently at release time. The preinstall hook runs npx only-allow pnpm to reject npm and yarn so the lockfile stays consistent. CI lints with max-warnings set to 0 to keep strictness.We once hit a React minor-version drift that threw useId hook-mismatch at runtime while the build stayed green; after catalog the issue stopped recurring. The html-to-figma SDK is published via lerna to an internal registry and consumers pin its version through catalog.

<details><summary>🔴 Deep dive (click to expand)</summary>

Monorepo goals: shared core versions consistent, business packages evolve independently, and a single toolchain. We enforce on three layers. First, pnpm workspace plus catalog. pnpm-workspace.yaml lists apps/* and packages/* as members; the catalog field pins React, React DOM, Next.js, Tailwind, and TypeScript to exact versions. Child packages declare react: catalog:, and pnpm install resolves through the root catalog so every package gets the exact same version, avoiding subtle bugs like dual React contexts from minor-version drift. Second, lerna independent releases. Under packages/, ui-desktop, ui-mobile, ui-shared, utils, types, and sdk/html-to-figma each carry independent versions, and lerna publish from-package compares package.json against the npm registry and pushes the new ones. Independent versioning means a minor bump on utils doesn't force every package to bump along. apps/* are not published, only built. Third, single toolchain. The preinstall hook runs npx only-allow pnpm so npm install or yarn install throws, herding everyone into pnpm and preventing the package-lock.json plus pnpm-lock.yaml split-brain. CI demands lint with zero warnings, TypeScript build failure blocks the PR, and code review handles the rest. The cost is newcomers must learn pnpm and catalog syntax first; the return is no React-dual-instance or version-drift incidents in the past year. A concrete pitfall we hit early: no catalog, child packages each pinned react, a 18-to-19 upgrade missed one, build was green and useId threw hook-mismatch at runtime; after unifying via catalog the issue stopped. html-to-figma as a standalone SDK is published via lerna to an internal registry, and consumers pin its version through catalog, so the cadence stays controlled.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] pnpm Catalogs 官方文档
  - [ ] Lerna v8 文档：independent vs fixed mode
- 🛠️ Hands-on
  - [ ] 建一个 2 包的 pnpm monorepo，用 catalog 锁 React 版本并验证子包解析
- ⚠️ Common pitfalls
  - catalog 与 dependencies 直接写版本号混用导致解析意外
  - lerna independent 模式下没加 conventional commits 会让 publish 卡住
  - 忘了 only-allow 钩子，新人 npm install 弄坏 lockfile
- 🤔 Self-check questions (answer without notes)
  - [ ] pnpm catalog 与 npm overrides 有什么区别？
  - [ ] 为什么不用 turborepo？
  - [ ] lerna 现在维护得怎么样，有更好替代吗？
- ⏱️ Estimated time: **半天**


#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`

---

## 🧩 Feature (feature) — 2 Q&A

### Q1. How is data fetching organized with React Query on your frontend? Where is the line between services and hooks?

> Source: `tp-010` · scope: frontend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| React Query queryKey 设计 | 必须掌握 | 三段式 key 与 invalidate 范围直接相关 |
| staleTime / cacheTime 区别 | 必须掌握 | 面试官常考缓存生命周期 |
| 幂等与 retry 策略 | 加分项 | 聊到 mutation 必问 retry 安全性 |

#### Tiered answers

**🟢 Elevator**: services hold plain fetch functions, hooks wrap them with useQuery and useMutation; queryKeys are keyed by business id, and mutations invalidate.

**🔵 Standard** (default):

Data fetching is split into two layers. The services directory holds plain fetch functions whose arguments and returns are plain objects with no React dependency. The hooks directory wraps service functions with useQuery or useMutation and composes queryKeys from business ids like conversationId and agentId. On a mutation's success it calls queryClient.invalidateQueries to refetch related keys. This way services run in unit tests directly while hooks get React Query's cache, retry, and suspense. Components only import hooks, never fetch directly.

<details><summary>🔴 Deep dive (click to expand)</summary>

The goal for the data layer is reusable requests, shared cache, real failure handling, and minimal boilerplate in components. Two layers. services/ is the pure-function layer, grouped by resource per file, e.g. services/conversation.ts exporting fetchConversationList, fetchConversationById, postMessage, with plain object inputs and outputs, doing only fetch and zod schema validation, no React dependency. This layer is the main unit-test surface — just mock fetch. hooks/ is the adapter layer; each hook wraps one or more service functions. On the useQuery side queryKeys are composed from business ids like ['conversation', conversationId, 'messages'], a three-segment shape of [resource, id, sub-resource] so invalidateQueries can target one conversation's messages or all conversations at once. On the useMutation side, onSuccess invalidates the related keys; mutations with global impact like creating a conversation invalidate ['conversation'] as a tree; mutations on a single message only invalidate that conversationId. staleTime is set per data trait: 30 seconds for conversation lists, 5 minutes for the rarely-changing model list, 0 for in-flight generations to force fresh fetches. Retry stays on by default but is disabled for chat mutations because payloads are large and the request is not idempotent — retry would double-send. Components only import hooks, with typings inferred from service signatures. The upside: request logic is reused across hooks; the downside: more files, and newcomers must learn the two layers. We tried inlining fetch in components — the same endpoint got called three times across three components with three different shapes, cache hit rate zero. After the split, request count dropped noticeably.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] TanStack React Query 5 官方文档 Queries / Mutations / Query Keys
  - [ ] Kent C. Dodds 的 React Query Patterns 文章
- 🛠️ Hands-on
  - [ ] 用 React Query 写一个增删改查 todo 应用，mutation 后用 invalidate 刷新列表
- ⚠️ Common pitfalls
  - queryKey 用对象引用导致 key 不稳定，每次都重新请求
  - non-idempotent mutation 不关 retry 会双发
  - staleTime 与 cacheTime 搞混导致缓存策略意外
- 🤔 Self-check questions (answer without notes)
  - [ ] 如何处理乐观更新？
  - [ ] queryKey 用字符串还是数组各有什么影响？
  - [ ] 为什么不用 SWR？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `apps/desktop/src/hooks/`
- `apps/desktop/src/services/`

---

### Q2. How does the html-to-figma SDK turn a webpage into Figma's clipboard format? How are glyphs and SVG paths handled?

> Source: `tp-014` · scope: frontend · packages/* 共享层 · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| SVG path 与 VectorNetwork | 必须掌握 | 矢量编码是核心难点 |
| opentype.js cmap 与 glyph | 加分项 | 字形处理是高级话题 |
| Figma Plugin / Clipboard 格式 | 加分项 | 聊到产物格式必问 |

#### Tiered answers

**🟢 Elevator**: Parse DOM and computed styles into a node tree; glyphs go through opentype.js, SVG paths go through vector-network-encoder into Figma's VectorNetwork.

**🔵 Standard** (default):

The SDK has four parts. figma-generator walks the DOM and collects each node with getComputedStyle into an intermediate shape, mapping colors, fonts, Auto Layout, shadows, and linear/radial gradients into Figma's node schema. glyph-encoder uses opentype.js to parse font files and convert glyphs missing from the target system into path nodes, preserving visual fidelity. vector-network-encoder converts SVG path M/L/C/Q commands into Figma's VectorNetwork (vertices, edges, regions). image-utils handles image data URLs and cross-origin to base64. The final output is in Figma's clipboard format and can be pasted directly.

<details><summary>🔴 Deep dive (click to expand)</summary>

The html-to-figma SDK aims to make a webpage selection paste into Figma pixel-faithful to the original. The hard parts are not DOM conversion itself but two specific subproblems: font fidelity and vector encoding. Pipeline first. figma-generator takes a root element and walks the DOM depth-first, getComputedStyle gives each node a complete style snapshot, then attribute mapping: display and flex map to Figma's Auto Layout (layoutMode, primary/counter axis); linear and radial gradients in background expand into stops mapped to fillsType; box-shadow maps to effects; border-radius maps to cornerRadius. The output is an intermediate tree of Figma node schemas. Next, glyphs. Web fonts may not be installed on the Figma side; passing the raw string would let Figma fall back and break visual fidelity. glyph-encoder parses the font file via opentype.js, looks up each used glyph (cmap mapping codepoint to glyph index) to get its path, and feeds it to vector-network-encoder, which converts to a VectorNetwork that replaces the text node. Visual is locked but editing is lost, so we keep text nodes for body copy and only convert decorative text (display headlines) to glyph paths. SVG is the other key piece. Figma has no SVG path string; it uses VectorNetwork (vertices, segments, regions). vector-network-encoder parses path commands: M opens a contour with a vertex, L adds a straight segment, C cubic Bezier needs two control points attached to mirroring vertex tangents, Q quadratic gets elevated to cubic, Z closes and forms a region. Fill rules (evenodd vs nonzero) determine region construction. image-utils is more routine: data: URLs go straight into fills, cross-origin URLs go through a proxy to base64 because Figma's clipboard format requires inlined images. Finally the tree serializes into Figma's internal protobuf-ish format, base64 encoded, and pushed into the clipboard. The pasted result preserves layout, editable text, and editable vectors, so designers can continue iterating.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] SVG Path 规范（W3C）
  - [ ] Figma 官方 Plugin API 文档：VectorNetwork 与 Node Schema
  - [ ] opentype.js 文档
- 🛠️ Hands-on
  - [ ] 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas
- ⚠️ Common pitfalls
  - 三次 Bezier 控制点 mirror 没处理好会让曲线失真
  - fill-rule evenodd 与 nonzero 混用导致填充错
  - 字体跨域加载没处理 CORS 直接 fail
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不直接转 SVG 给 Figma？
  - [ ] 字形转路径以后还能编辑吗？
  - [ ] 怎么处理 web 字体许可？
- ⏱️ Estimated time: **1 周**


#### Evidence

- `packages/sdk/html-to-figma/`

---

## ⚡ Performance (performance) — 2 Q&A

### Q1. Multi-turn chats easily blow the context window. How does your context compression work, and when does it trigger?

> Source: `tp-004` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| LLM token 计数与窗口 | 必须掌握 | 压缩触发条件直接依赖 token 计算 |
| ToolLoopAgent prepareStep 钩子 | 必须掌握 | 压缩入口就在这里 |
| 摘要质量与信息损失评估 | 加分项 | 面试官会问怎么验证摘要没丢关键信息 |

#### Tiered answers

**🟢 Elevator**: Three layers: context-budget computes the budget, context-compressor provides strategies, context-compress trims in prepareStep, and it only runs above threshold.

**🔵 Standard** (default):

Context compression has three layers. context-budget computes a safe budget against the current model's context window; context-compressor provides strategies like summarizing old messages and truncating tool outputs while keeping head and tail; context-compress runs inside ToolLoopAgent's prepareStep, trimming history and tool results based on real token usage. Compression only runs above the threshold, so normal short chats skip it. Early on we sliced history bluntly and lost a lot of context; the new approach preserves meaning.Early on we sliced history bluntly by message count and lost context whenever a single tool output was huge; the new approach computes a real-token budget per model and only triggers above the threshold, so short chats skip it.

<details><summary>🔴 Deep dive (click to expand)</summary>

The old implementation truncated by message count: once the array exceeded N we sliced it. The problem is a single tool output can be thousands of tokens, and dropping one message can throw away a key piece of context; models also differ a lot in context window size, so a hard-coded count is unsafe for smaller models. The rewrite has three layers. context-budget reads context_window from the selected model's metadata, subtracts the system prompt, current user message, and reserved output space, and produces a safe history budget per model automatically. context-compressor provides a set of strategies: first, tool-output truncation that keeps the head and tail tokens and replaces the middle with an ellipsis marker, since head and tail usually carry the most signal; second, old-message summarization that collapses early turns into a single summary preserving topic and conclusion; third, role-priority dropping, where system stays, the latest user turn stays, and the earliest assistant turn goes first. context-compress is the entry, hooked into ToolLoopAgent's prepareStep: before each step it computes the current messages' token usage and only picks a strategy when usage exceeds budget. Short chats bypass it, avoiding unnecessary CPU. It returns a new messages array instead of mutating in place, so concurrent reads stay safe. The goal is no context blowup on long chats and to keep running under heavy tool calling, while changing information loss from blind truncation into structured compression. Thresholds and the summarization model are tuned empirically, not hard-coded.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Vercel AI SDK ToolLoopAgent 的 prepareStep 文档
  - [ ] OpenAI / Claude / Gemini 的 context window 文档
- 🛠️ Hands-on
  - [ ] 写一个 100 行的 demo：统计 messages 的 token，超过阈值就把最早 2 条压成摘要
- ⚠️ Common pitfalls
  - prepareStep 原地修改 messages 在并发场景下踩坑
  - 工具输出全截掉会让模型看不到关键结果，必须保头尾
  - 硬编码 token 阈值对小窗口模型不安全，要按模型元数据算
- 🤔 Self-check questions (answer without notes)
  - [ ] 摘要本身也是一次 LLM 调用，怎么避免摘要失败把请求拖崩？
  - [ ] 如果是 Claude 这种支持 prompt caching 的模型，压缩策略会变吗？
  - [ ] 怎么衡量压缩前后信息损失？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not just switch to a long-context model and skip the compression layer?** (trade-off)
  > Long-context models cost more per token and have higher TTFT, so multi-turn costs do not scale; compression triggers on demand, costs nothing on short chats, and the ROI is better. We also support whatever model the user picks, so we can't assume long context.


#### Evidence

- `apps/desktop/src/shared/`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`

---

### Q2. What does DnsOptimization do? And why does layout read cookies on the server to initialize user state?

> Source: `tp-011` · scope: frontend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| preconnect / dns-prefetch 区别 | 必须掌握 | 面试官常追问 crossorigin 必要性 |
| Next.js cookies() 与 RSC | 必须掌握 | 服务端读 cookie 决定水合稳定性 |
| TTFB / FCP / LCP 指标 | 加分项 | 聊性能必问指标怎么衡量 |

#### Tiered answers

**🟢 Elevator**: DnsOptimization preconnects to key API and CDN origins; layout reads cookies on the server so first paint does not flash from logged-out to logged-in.

**🔵 Standard** (default):

DnsOptimization.tsx renders a set of link rel=preconnect and dns-prefetch tags targeting API origins, CDN origins, and the font host. preconnect does DNS, TCP, and TLS in one go; dns-prefetch covers older browsers. The root layout reads STAFFID via next/headers cookies on the server and initializes user state before rendering, so the client doesn't first paint logged-out state and flicker on hydration. Together they tighten first-paint TTFB and hydration stability.The crossorigin attribute on preconnect is mandatory; without it cross-origin font requests are silently ignored, the page looks fine, but the first paint still pays a fresh DNS lookup for fonts.

<details><summary>🔴 Deep dive (click to expand)</summary>

First-paint optimization has two pieces solving two problems. First, preconnecting key origins. Chat hits a separate API domain, media goes through a CDN domain, fonts come from a third-party host, and each new origin pays a DNS, TCP, and TLS round trip on first hit. The root layout mounts a DnsOptimization component that emits link rel=preconnect for these origins, telling the browser to complete the three-way handshake early; it also emits link rel=dns-prefetch as a fallback for older browsers that only do DNS. preconnect needs the crossorigin attribute correctly set; without it cross-origin fonts get ignored. Second, hydrating logged-in state. Next.js App Router renders on the server by default, but if user state is read from cookies on the client, the server renders as logged-out, hydration reads the cookie, and the UI flips — the page flashes. The fix: in layout.tsx use next/headers cookies() to read STAFFID on the server (already written by the middleware after JWE decrypt) and inject user state into the RSC tree so the HTML already shows logged-in state. On hydration the user store initializes from the server-injected value, no flip. Two more details: Tailwind 4's CSS variables reduce stylesheet jitter on first paint, and next/font with font-display: swap self-hosts fonts to avoid third-party latency. We track impact via Aegis page TTFB and LCP curves: after preconnect went live the RTT to the key API dropped by one round trip, and after the hydration fix the first frame already shows the logged-in state with no visible flicker.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] MDN Resource Hints: preconnect、dns-prefetch、preload
  - [ ] Next.js next/headers 与 cookies API 文档
- 🛠️ Hands-on
  - [ ] 在 Lighthouse 里跑一次基线，加 preconnect 后再跑一次，记录 LCP 变化
- ⚠️ Common pitfalls
  - preconnect 没加 crossorigin 导致字体请求重新建连
  - preconnect 太多反而占用浏览器并发槽
  - 服务端没读 cookie 导致水合切换出现闪烁
- 🤔 Self-check questions (answer without notes)
  - [ ] preload 与 preconnect 区别？
  - [ ] CSS-in-JS 会怎么影响首屏？
  - [ ] next/font 是怎么自托管字体的？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **How many preconnects are reasonable to add?** (trade-off)
  > Usually four to six high-priority origins. Browsers have limited parallel connection slots, so more preconnects start crowding each other. Stick to first-paint-critical ones: API, CDN, fonts.


#### Evidence

- `apps/desktop/src/components/DnsOptimization.tsx`
- `apps/desktop/src/app/layout.tsx`

---

## 🛡️ Reliability (reliability) — 1 Q&A

### Q1. When the user hits stop, how does the whole chain from the frontend down to tool calls cleanly terminate the SSE stream?

> Source: `tp-003` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| AbortController 与 AbortSignal | 必须掌握 | 面试官会问怎么传到 fetch 与子流 |
| 进程内表与多 Pod 一致性 | 加分项 | 聊到多 Pod 部署就会问 sticky session 怎么处理 |

#### Tiered answers

**🟢 Elevator**: Entering the main pipeline registers a per-session AbortController; the stop endpoint aborts by conversationId, and the signal propagates into tools and sub-agents.

**🔵 Standard** (default):

On entering /api/chat-main-agent-v2 we register an AbortController by conversationId in a per-session table (registerSessionAbort). When the user hits stop the frontend calls /api/chat-main-agent-v2/stop with conversationId, the stop endpoint looks it up and calls abortSession to trigger controller.abort. The AbortSignal propagates through streamText, tools, and sub-agents, and the SSE stream exits together. On normal or error exit unregisterSession cleans the entry.On normal completion or exception, the main pipeline calls unregisterSession in finally so the session entry is dropped, avoiding leaks. The conversationId has to match end-to-end, and in a multi-pod deployment we rely on gateway routing or sticky sessions so stop lands on the same instance that started the stream.

<details><summary>🔴 Deep dive (click to expand)</summary>

Cancellation has three parts. First, the per-session registry: an in-process Map (registerSessionAbort) keyed by conversationId holding AbortControllers. When /api/chat-main-agent-v2 starts it creates a controller, registers it, and passes controller.signal into streamText's abortSignal; ToolLoopAgent passes the same signal into every tool, so fetch, shell, and sandbox IO all exit on abort. Second, the trigger endpoint /api/chat-main-agent-v2/stop: the frontend calls it on stop with only conversationId, the endpoint calls abortSession(conversationId), looks up the controller, and aborts it. Once the signal fires, streamText's internal fetch throws AbortError, the UIMessageStream ends, the SSE closes, and useChat's onError catches it on the client. Third, cleanup: on normal completion, exception, or abort the main pipeline runs unregisterSession in finally to drop the entry, avoiding leaks. One detail: conversationId must match front-to-back, so the frontend sends the same id when starting and when stopping; in a multi-pod deploy the stop request could land on a different instance, so we rely on gateway routing or sticky sessions to keep it on the same pod. AbortController is first-class in the SDK; we just made it addressable per session.Several edge conditions are worth flagging in the implementation. First, tools that use fetch internally must propagate the signal, otherwise after streamText aborts a child fetch can keep running for a window, leaving orphan requests. Second, sub-agents share the same signal so we never get an outer abort with the inner loop still running. Third, the client's useChat onError must not pop an error toast on AbortError; it has to be treated as normal stop, otherwise the experience looks broken. On metrics we did not add a dedicated abort counter; we fold abort into chat_error_count with a reason=user_abort label so dashboards can separate user-initiated stop from real failure.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] MDN AbortController / AbortSignal
  - [ ] Vercel AI SDK streamText 的 abortSignal 参数文档
- 🛠️ Hands-on
  - [ ] 写一个 Express demo：客户端 fetch SSE，服务端通过另一个端点根据 sessionId 中断流
- ⚠️ Common pitfalls
  - 工具内部的 fetch 没接 signal 会导致 abort 后还在跑
  - finally 没清表会让 Map 越来越大
  - 多 Pod 下 stop 落到不同实例必须依赖 sticky session 或网关路由
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 stop 请求丢了怎么兜底？
  - [ ] 工具是流式输出的，怎么保证 abort 后不再吐数据？
  - [ ] 为什么不用 Redis 存 conversationId 到 Pod 的映射？
- ⏱️ Estimated time: **半天**


#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. What metrics does your Galileo monitoring record, and how is instrumentation.ts wired up?

> Source: `tp-005` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Next.js instrumentation.ts 钩子 | 必须掌握 | 面试官常问 register 何时跑、Edge 行不行 |
| OTel histogram vs counter | 必须掌握 | metric 选型直接决定能不能算 P95 |
| unhandledRejection 与 uncaughtException | 加分项 | Node 兜底异常的常考点 |

#### Tiered answers

**🟢 Elevator**: instrumentation.ts calls SetupGalileo at startup and registers four custom OTel metrics covering API, page render, chat request, and error count.

**🔵 Standard** (default):

Next.js exposes the register hook in instrumentation.ts. We only run it under NEXT_RUNTIME=nodejs (Edge skips it). register calls SetupGalileo to start the OTel node-sdk, picking the report endpoint by MODE for test or production, and attaches unhandledRejection and uncaughtException handlers to report uncaught errors in full. We register four custom metrics: api_request_duration, page_render_duration, chat_request_count, and chat_error_count, covering API latency, page-render latency, total chat requests, and chat errors.Edge skips OTel because node-sdk's async_hooks is unavailable there and forcing it would throw module-not-found. The registration order matters: SetupGalileo must run before custom metrics are registered, otherwise the meter is not ready and metric creation fails.

<details><summary>🔴 Deep dive (click to expand)</summary>

The goal here is to move server stability off the platform health check and onto business-level curves. Next.js 16 exposes the register hook in instrumentation.ts, called once at startup, but it runs in both Edge and Node, so inside we first check process.env.NEXT_RUNTIME === 'nodejs' and skip Edge, because the OTel node-sdk depends on node:async_hooks. On Node we call SetupGalileo, which initializes NodeSDK: auto-instrumentation for HTTP, Express, and Fetch plus the resource attributes we pass (service.name and environment); the report endpoint is picked by process.env.MODE so test and production do not mix. After SetupGalileo we attach two process-level handlers: unhandledRejection and uncaughtException both go through galileo-logger to report the full stack and request context, avoiding silent fail. For business metrics we register four custom ones: api_request_duration as a histogram labeled by route; page_render_duration as a histogram labeled by page; chat_request_count and chat_error_count as counters labeled by model and session state. In the chat pipeline we increment chat_request_count at entry, increment chat_error_count in the catch block with the error code as a label, and record api_request_duration when the stream ends. Dashboards then show per-model request volume and error rate. Traces and metrics share the same resource attributes so they correlate. One detail: instrumentation.ts only runs once before the first request, so the order matters — we call SetupGalileo before registering metrics, otherwise the meter is not ready.Before rollout we also weighed Sentry and dropped it because the company already runs Galileo with dashboards and alerts wired to it, and adopting Sentry would duplicate infrastructure. The unhandledRejection handler exists specifically to catch lost promises; before adding it, sporadic stream interruptions went unnoticed, and afterwards galileo-logger surfaced a class of fetch-retry-exhausted errors thrown from outer code. chat_error_count is a counter because dashboards only need totals; api_request_duration is a histogram so we can see p50, p95, and p99 distribution; the two metrics back two different dashboard views.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Next.js Instrumentation 文档
  - [ ] OpenTelemetry JavaScript node-sdk 文档
- 🛠️ Hands-on
  - [ ] 在一个 Next.js 项目里跑通 NodeSDK 自动埋点 + 一个自定义 counter
- ⚠️ Common pitfalls
  - register 在 Edge 也会被调用，没判 runtime 会报 async_hooks not found
  - metric label 基数过高会让后端聚合崩，模型名要可控
  - uncaughtException 之后进程其实不稳定，建议上报后退出由编排器拉起
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 OTel exporter 自身挂了怎么办？
  - [ ] metric 太多导致 export 流量大，怎么裁？
  - [ ] P95 是怎么从 histogram 算出来的？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not just use console plus an ELK-style log pipeline?** (trade-off)
  > Logs need offline aggregation for P95 and error rate and queries get expensive; OTel metrics aggregate on the client, histograms compute percentiles directly, queries are cheap, and alerts are real-time. Logs cover trace context, metrics show trends — they complement, not replace.


#### Evidence

- `apps/desktop/src/instrumentation.ts`
- `apps/desktop/src/shared/utils/galileo-logger.ts`

---

## 🔒 Security (security) — 1 Q&A

### Q1. What does the jose.compactDecrypt call in the middleware decrypt? Why run it on Edge Runtime?

> Source: `tp-002` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| JWE 与 JWT 的区别 | 必须掌握 | 面试官常追问为什么用 JWE 不用 JWT |
| Edge Runtime 的 API 限制 | 必须掌握 | jose 选 Web Crypto 路径就是因为这条 |
| Cookie SameSite 与 HttpOnly | 加分项 | 聊到 cookie 必然被问安全属性 |

#### Tiered answers

**🟢 Elevator**: It decrypts the JWE identity ticket from the TAI gateway, gets StaffId, and writes a cookie. Edge sits closest to the request and adds the least latency.

**🔵 Standard** (default):

Tencent's TAI gateway delivers x-tai-identity in the header, a JWE-compact ticket containing StaffId and LoginName. middleware.ts runs on Edge Runtime: it picks the decryption token by MODE for test or production, then jose.compactDecrypt unwraps the JWE to plaintext. The fields are written back as STAFFID, STAFFNAME, and prompt_username cookies for the frontend. The matcher excludes _next and api so static assets and API paths do not decrypt repeatedly.The decryption key is injected per environment via the platform and never committed; cookies only expose identity fields like StaffId, with sensitive payload kept server-side. The matcher pattern ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] keeps static assets and API paths from running JWE decrypt on every request.

<details><summary>🔴 Deep dive (click to expand)</summary>

TAI is the company's identity gateway. It delivers x-tai-identity to upstream apps, and the value is a JWE-compact ticket that must be decrypted with a pre-shared key to read StaffId and LoginName. middleware.ts runs on Edge Runtime: Edge is the first hop for page requests, sits close to the entry, and cold-starts fast; the identity must be available before RSC renders, so pushing it into the Node app would add a hop. The logic has four steps: first, pick the decryption token by process.env.MODE for test or production so environments do not mix; second, read x-tai-identity from the request header and fall back to anonymous if missing; third, jose.compactDecrypt unwraps the JWE and JSON.parse pulls StaffId and LoginName from the payload; fourth, write STAFFID, STAFFNAME, and prompt_username cookies, which frontend components read directly instead of refetching. The matcher is ['/((?!_next/static|_next/image|favicon.ico|api/).*)'], excluding static assets and api so endpoints do not decrypt per request and static assets do not pay the cost. There is also a 301 redirect from the legacy /home/chat?qpilot_id path to the new URL so old links keep working. On security, the key is not in the repo and is injected per environment; cookies only expose identity fields, no sensitive payload.Another factor is key rotation: TAI rotates keys at the hour scale, so the decrypt token cannot be hard-coded; we read process.env.TAI_DECRYPT_KEY_TEST or PROD on startup, and platform-side rolling deploys swap the key without a code release. On error handling, when compactDecrypt throws we do not return 5xx; we fall through to anonymous state and let the request continue, so a key glitch does not take the site down, and we only see the trend through chat_error_count with an auth_decrypt_fail label. The redirect block also handles a 301 from the legacy /home/chat?qpilot_id path because feedback during migration showed those links were still in external docs, so a plain 404 was not acceptable.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] RFC 7516 JSON Web Encryption
  - [ ] Next.js Middleware 与 Edge Runtime 文档
  - [ ] jose 文档的 compactDecrypt 与 KeyLike 章节
- 🛠️ Hands-on
  - [ ] 写一个最小 Express demo，签发 JWE 并在 middleware 里解开
- ⚠️ Common pitfalls
  - Edge Runtime 不支持 node:crypto 全部 API，得走 Web Crypto 兼容的 jose
  - matcher 写错会把 api 也包进去导致接口反复解 JWE
  - MODE 没切环境会用错密钥，错误信息只是 decrypt failed 难排查
- 🤔 Self-check questions (answer without notes)
  - [ ] JWE 解密失败你怎么降级？
  - [ ] 为什么不在 API 路由里做鉴权而是 middleware？
  - [ ] 如果 token 泄漏怎么补救？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why put auth in the Edge middleware rather than in API routes or a backend service?** (trade-off)
  > Page requests get rejected at Edge before RSC renders, with the cookie already set, so we avoid an extra backend hop. Putting it in API routes duplicates auth in every handler, and pushing it to a backend service adds another hop.


#### Evidence

- `apps/desktop/src/middleware.ts`

---

## ⚖️ Trade-off (trade-off) — 3 Q&A

### Q1. Why do three chat endpoints — /api/chat, /api/qpilot-chat, and /api/chat-main-agent-v2 — coexist?

> Source: `tp-009` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Edge vs Node Runtime | 必须掌握 | 聊到迁移就被问 runtime 怎么选 |
| 增量迁移策略 | 加分项 | 面试官会问下线老接口的判定标准 |

#### Tiered answers

**🟢 Elevator**: The new endpoint runs ToolLoopAgent on Vercel AI SDK 5; the two legacy ones stay for old components, no big-bang migration.

**🔵 Standard** (default):

Each endpoint maps to a phase. /api/chat is the earliest, on Edge Runtime with hand-written OpenAIStream and raw events; /api/qpilot-chat is an interim path using eventsource-parser to relay an internal upstream SSE; /api/chat-main-agent-v2 is the new pipeline on Node Runtime with Vercel AI SDK 5's ToolLoopAgent plus createUIMessageStream, supporting multi-step tools and abort. New components plug into the new endpoint, old components keep their old endpoints; we did not do a big-bang migration to limit blast radius and regression.The hard condition for retiring a legacy endpoint is the dashboard showing zero traffic for a full week, and right now /api/qpilot-chat still gets a small amount from plugin paths so it stays.

<details><summary>🔴 Deep dive (click to expand)</summary>

This is a classic incremental-migration story. The earliest /api/chat ran on Edge Runtime with hand-written OpenAIStream, modeled on Vercel AI SDK 1's OpenAIStream but written by hand: Edge was chosen for low latency on small payloads, and the SSE events stayed raw with the frontend parsing OpenAI delta. Later we needed to plug into an internal upstream gateway that already streams SSE, so /api/qpilot-chat appeared: it uses eventsource-parser to parse upstream SSE and relays events to the frontend; runtime stays on Edge. This one is essentially a proxy, no orchestration. Then we wanted multi-agent, multi-step tool calling, and sub-agents, but every feature on hand-written OpenAIStream meant another protocol change, an even bigger outer loop, and a separate stop mechanism. So we built /api/chat-main-agent-v2 on Vercel AI SDK 5; runtime moved to Node because ToolLoopAgent's multi-step execution exceeds Edge's window, and we set maxDuration to 300. The new endpoint takes all new components — the main-agent entry, the new chat page; the legacy endpoints keep serving old components like some mobile pages and certain plugin paths. The decision points: first, legacy traffic is lower but stable, so unifying is not worth the regression risk; second, the upstream gateway behind the legacy path uses a different protocol, so unifying would require an adapter layer that is more work than maintaining both; third, decommissioning the legacy endpoint needs telemetry showing zero calls, which we have not reached yet. So the strategy is the new endpoint absorbs new work and the old ones are frozen with only P0 fixes. One specific trade-off is runtime: Edge cold-starts fast but caps maxDuration; Node starts slower but runs long jobs. The new endpoint chose Node because of multi-step tools, not because Node is inherently better.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Next.js Edge Runtime 与 Node.js Runtime 文档
  - [ ] Strangler Fig Pattern（增量替换设计模式）
- 🛠️ Hands-on
  - [ ] 在埋点里给一个旧接口加调用计数，输出每天调用量曲线
- ⚠️ Common pitfalls
  - 下线老接口前没看埋点，直接删导致小流量场景崩
  - Edge 上跑长任务被 maxDuration 砍
  - eventsource-parser 上游断流时不主动关，前端连接挂死
- 🤔 Self-check questions (answer without notes)
  - [ ] 你打算什么时候下线 /api/chat？
  - [ ] 如果新链路出 bug 你怎么回滚到老链路？
  - [ ] 为什么不一次切到新链路？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `apps/desktop/src/app/api/chat/route.ts`
- `apps/desktop/src/app/api/qpilot-chat/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`

---

### Q2. How are you incrementally migrating the legacy web_bak codebase to the new stack? What does the /migrate-component command do?

> Source: `tp-013` · scope: frontend · web_bak · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| AST 改写与 jscodeshift | 必须掌握 | 面试官常问自动迁移的实现方式 |
| 增量迁移 / Strangler Fig | 必须掌握 | 迁移策略本身就是考察点 |
| antd 与 shadcn 设计差异 | 加分项 | 聊到映射表必然涉及 |

#### Tiered answers

**🟢 Elevator**: Migrate component by component using mapping rules: antd to shadcn, ahooks to React Query, Pages Router to App Router; /migrate-component is a Cursor skill that automates the rewrite.

**🔵 Standard** (default):

web_bak is the legacy stack: Ant Design plus Pages Router plus ahooks. A full rewrite is too costly. We did three things. First, a clear mapping: antd Button to shadcn Button, @ant-design/icons to lucide-react, ahooks useRequest to TanStack useQuery, Pages Router file routes to App Router route groups. Second, .cursor/ holds skills and commands; /migrate-component is one such skill that takes an old component path and emits the new component using the mapping. Third, migrate at component granularity — start with business-critical ones like QPilotFormV2, run regression, then merge. New code lands in apps/desktop, legacy stays in web_bak as a reference.

<details><summary>🔴 Deep dive (click to expand)</summary>

The biggest risk in this kind of migration is a big-bang change blowing up regression. The strategy is mapping table plus tooling plus small batches. The mapping table is the core, sitting inside the skill and covering three areas one-to-one: UI components map antd's family to shadcn/ui plus Radix, icons map @ant-design/icons to lucide-react; data layer maps ahooks's useRequest, useDebounce, and so on to TanStack Query, useDeferredValue from React 19, or hand-rolled hooks; routing maps Pages Router's getServerSideProps and _app.tsx to App Router's layout.tsx, page.tsx, and direct fetches in RSCs. The mapping alone isn't enough because antd's message.success is an imperative API while shadcn's toast is a hook, so the table marks needs-human-review cases. /migrate-component does this: parse the old component as AST, recognize antd imports; apply the mapping to imports and JSX; when it sees imperative calls like message.success, insert a TODO comment for a human; write the result to the corresponding apps/desktop path and add import { useToast } from '@/hooks/use-toast'. Batches stay small — one component, end-to-end regression, then merge — to avoid masking errors in a big merge. New components land in apps/desktop, the old ones stay in web_bak as reference and contrast, and decommissioning web_bak waits until all components have moved. The cost is two codebases coexist during the transition, but the product runs at every point and incident blast radius stays small. One detail: during migration we kept a list of which antd props we actually used, because the first mapping missed some antd-specific minor props and only regression caught them; we then promoted prop-level rules into the mapping table.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Strangler Fig Pattern（Martin Fowler）
  - [ ] shadcn/ui 与 Radix UI 文档
- 🛠️ Hands-on
  - [ ] 用 jscodeshift 写一个把 antd Button 转成 shadcn Button 的 codemod 脚本
- ⚠️ Common pitfalls
  - 命令式 API 转 hook 必须人工确认，机械转会拿不到 React context
  - 同时保留新老路由会让 SEO/SSR 行为分裂
  - 映射表覆盖不全的 prop 跑回归才暴露
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果某个 antd 组件 shadcn 没有对应的怎么办？
  - [ ] Pages Router 与 App Router 同 repo 共存会怎样？
  - [ ] 怎么判断 web_bak 可以下线了？
- ⏱️ Estimated time: **1 周**


#### Evidence

- `web_bak/src/`
- `.cursor/`

---

### Q3. Your middleware runs on Edge, main-agent runs on Node, and instrumentation runs on Node too. How do you decide the runtime?

> Source: `tp-015` · scope: backend · apps/desktop · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Next.js Edge 与 Node Runtime 能力差异 | 必须掌握 | 运行时选型直接决定能不能跑 |
| node:async_hooks 与 OTel context | 加分项 | 解释为什么 instrumentation 必须 Node |
| maxDuration 平台限制 | 必须掌握 | 长任务一定碰到这条 |

#### Tiered answers

**🟢 Elevator**: Edge for low-latency short tasks; Node for long tasks or those needing Node APIs. Split by capability and duration.

**🔵 Standard** (default):

Three components, three needs. Middleware just decrypts JWE and writes cookies — millisecond-scale and close to the user — so Edge fits, and jose works through Web Crypto on Edge. /api/chat-main-agent-v2 is multi-step plus streaming with maxDuration set to 300 seconds, which Edge's execution window can't sustain, so it goes on Node. instrumentation.ts boots the OTel node-sdk, which depends on Node-only APIs like node:async_hooks that Edge lacks, so it only runs under NEXT_RUNTIME=nodejs. Two questions decide runtime: is the execution window enough, and are the required APIs available.

<details><summary>🔴 Deep dive (click to expand)</summary>

Runtime choice in Next.js is an engineering trade-off, not Edge-is-always-better or Node-as-safe-default. We have three concrete cases. First, middleware.ts goes Edge: middleware deploys to global edge nodes on Vercel and similar platforms, sits closest on the request path, has minimal startup, TLS is already established, and processing is in milliseconds; jose's JWE decrypt uses Web Crypto, which runs natively on Edge with no Node module dependency. Putting it on Node would add a hop, slow cold starts, and lose the global distribution edge. Second, /api/chat-main-agent-v2 goes Node: ToolLoopAgent's multi-step plus tool calls often runs tens of seconds to minutes, with maxDuration set to 300; Edge's execution window (25 to 60 seconds depending on platform) is a killer for this; tools also need to spawn subprocesses, read files, and hit databases, which Edge either lacks or restricts. So next.config sets runtime: 'nodejs' and we export maxDuration = 300. The cost is slower Node cold starts, but in chat the user is already waiting for streaming output, so cold start matters less. Third, instrumentation.ts must be Node: the OTel node-sdk depends on node:async_hooks for async context propagation, which Edge doesn't expose. The first line in register is if (process.env.NEXT_RUNTIME !== 'nodejs') return; Edge bails out. The decision framework is two steps: estimate the longest execution time and check whether it exceeds 70% of the Edge window (leaving cold-start headroom); list dependencies and see whether any are Node-only APIs. Either hits, go Node; otherwise Edge. A gray-zone case is database connections: Postgres on Edge needs an HTTP adapter (like Neon's serverless driver), and the traditional pg client doesn't work; our DB client is traditional Prisma, so any Prisma route must run on Node.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Next.js Runtime 文档：Edge 与 Node 能力对比
  - [ ] Vercel 文档：function maxDuration 限制
- 🛠️ Hands-on
  - [ ] 在一个 Next.js 项目里同时部署一个 Edge route 与一个 Node route，对比冷启动延迟
- ⚠️ Common pitfalls
  - 把 Prisma 直接放 Edge 上会运行时报 require not defined
  - Edge 上跑长任务会被砍但日志不明显，看似随机断流
  - instrumentation 在 Edge 上没判 runtime 会报 async_hooks 缺失
- 🤔 Self-check questions (answer without notes)
  - [ ] Edge Runtime 不支持哪些 Node API？
  - [ ] 如果以后 Edge maxDuration 放宽了你会迁过去吗？
  - [ ] Edge 上数据库怎么连？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not just put everything on Node to keep it simple?** (trade-off)
  > Middleware is on the hot path for every page request; on Node it adds a hop and loses the close-to-user edge deployment. What the middleware does fits Edge, so paying that latency just for uniformity isn't worth it.


#### Evidence

- `apps/desktop/src/middleware.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/instrumentation.ts`

---

