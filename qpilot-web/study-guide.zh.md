# QPilot Web — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：**会写 React，但对 Next.js App Router、Vercel AI SDK、Edge Runtime、Prisma 还没实战过的同学**
> 目标：跟着做完，覆盖知识图谱里的 26 项必备 + 16 项加分知识点

---

## 0. 怎么使用这份指引

知识图谱里 42 个知识点，围绕 **15 道考题（q-01 ~ q-15）** 展开，每道题是一个"知识簇"。本指引按**学习顺序**把 15 个簇重新排序，每个簇给你：

1. **它在解决什么真实问题**（一句话场景）
2. **零基础前置**：如果连这一步都不熟，先补什么
3. **必读材料**：每条都给可直接点击的官方/权威外链
4. **动手练习**：从最小可运行 demo 开始
5. **自检清单**：能口头回答=过关

> 推荐节奏：**每个簇 1~2 个晚上**，15 个簇大约 5~6 周。

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：Next.js 基础 | 1, 2, 3 | App Router、RSC、Edge vs Node |
| 阶段 B：AI Agent 核心 | 4, 5, 6 | Vercel AI SDK、ToolLoop、SSE 中断 |
| 阶段 C：状态与数据 | 7, 8, 9 | Zustand、React Query、Prisma |
| 阶段 D：性能与可观测 | 10, 11, 12 | Resource Hints、OTel、Web Vitals |
| 阶段 E：工程化与扩展 | 13, 14, 15 | Monorepo、迁移、Figma、Runtime |

---

## 阶段 A：Next.js 基础

### 簇 1（q-08）：App Router + RSC + 路由组

**覆盖知识点**：App Router 路由组与私有目录、RSC 与 'use client' 边界、组件就近原则
**真实场景**：项目里有"管理后台"和"前台门户"两套布局，URL 又不能带 `/admin` 前缀，怎么办？

#### 0-1 零基础前置
- 用过 Next.js Pages Router；写过 `getServerSideProps`。
- 没用过 App Router 的话先看：[Next.js 官方教程](https://nextjs.org/learn)。

#### 必读材料
1. [Next.js 官方文档 — App Router](https://nextjs.org/docs/app)
2. [Next.js — Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
3. [Next.js — Private Folders](https://nextjs.org/docs/app/building-your-application/routing/colocation#private-folders)
4. [Next.js — Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
5. [React 官方文档 — Server Components](https://react.dev/reference/rsc/server-components)
6. [Next.js — 'use client' 指令](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

#### 动手练习
- 用 `npx create-next-app@latest --app` 建项目。
- 创建两个路由组：
  ```
  app/
    (admin)/
      layout.tsx   # 后台布局
      dashboard/page.tsx
    (public)/
      layout.tsx   # 前台布局
      page.tsx
  ```
- 验证 URL 是 `/dashboard` 而不是 `/admin/dashboard`。
- 把 `dashboard/page.tsx` 写成 RSC，里面 `await fetch(...)` 直接用 `async` 函数；再加一个 `Counter.tsx` 客户端组件 `'use client'`。
- 用 `_components/` 私有目录放只在该路由用的组件。

#### 自检
- [ ] 能说出 RSC 的 3 个限制（不能用 hooks、不能用浏览器 API、不能传函数 props）。
- [ ] 能解释路由组 `(name)` 和动态路由 `[name]` 的区别。
- [ ] 知道"组件就近原则"在 App Router 里怎么落地。

---

### 簇 2（q-02）：JWE + Edge Runtime + Cookie 安全

**覆盖知识点**：Edge Runtime API 限制、JWE 与 JWT 区别、Cookie SameSite 与 HttpOnly
**真实场景**：用户的 session token 不能让前端 JS 读到，还要在 Edge middleware 里能解开做鉴权。

#### 0-1 零基础前置
- 知道什么是 JWT；用过 cookie 鉴权。

#### 必读材料
1. [RFC 7516 — JSON Web Encryption](https://datatracker.ietf.org/doc/html/rfc7516)
2. [Next.js — Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
3. [Next.js — Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
4. [jose 文档 — compactDecrypt](https://github.com/panva/jose/blob/main/docs/jwe/compact/decrypt/functions/compactDecrypt.md)
5. [MDN — Set-Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie)
6. [MDN — SameSite cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value)

#### 动手练习
- 写一个最小 Express demo：
  - 登录接口用 `jose` 签发 JWE（加密的 JWT）。
  - 设置 cookie：`HttpOnly; Secure; SameSite=Lax`。
- 在 Next.js middleware 里用 `compactDecrypt` 解 JWE，校验通过后挂载用户信息。
- 故意把 `HttpOnly` 去掉，在 Console 里 `document.cookie` 验证能不能读到。
- 对比 JWT（签名）和 JWE（加密）的 payload —— 一个明文一个密文。

#### 自检
- [ ] 能说出 JWT 和 JWE 的本质区别（签名 vs 加密）。
- [ ] 能解释 `SameSite=Strict / Lax / None` 的差异。
- [ ] 知道 Edge Runtime 不能用哪些 Node API（fs、child_process、原生 crypto）。

---

### 簇 3（q-09）：Edge vs Node Runtime + 增量迁移

**覆盖知识点**：Edge vs Node Runtime、增量迁移策略
**真实场景**：老项目跑在 Node Runtime，想把鉴权挪到 Edge 加速冷启动，但不能一次性全迁。

#### 必读材料
1. [Next.js — Edge vs Node Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
2. [Vercel — Functions Runtime](https://vercel.com/docs/functions/runtimes)
3. [Martin Fowler — Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)

#### 动手练习
- 给一个 Node route 和一个 Edge route 都加 `console.time`，对比冷启动延迟。
- 在埋点里给一个旧接口加调用计数，输出每天调用量曲线 —— 用来判断"什么时候可以删"。
- 写一份"Strangler Fig 迁移计划"：标记新接口、引流、灰度、下线。

#### 自检
- [ ] 能说出 Edge Runtime 的 3 个优势（冷启动快、就近、低成本）和 3 个限制（API 受限、内存小、超时短）。
- [ ] 能解释 Strangler Fig 模式的"包围-替换-移除"三步。

---

## 阶段 B：AI Agent 核心

### 簇 4（q-01）：Vercel AI SDK 5 + streamText + AbortController 链式

**覆盖知识点**：Vercel AI SDK 5 stream API、Edge vs Node Runtime（架构维度）、AbortController 链式传递
**真实场景**：实现一个 ChatGPT 风格的对话框，逐字流式输出，用户点"停止"立即中断。

#### 0-1 零基础前置
- 用过一次 OpenAI 或 Anthropic 的 API。

#### 必读材料
1. [Vercel AI SDK 5 文档](https://ai-sdk.dev/docs/introduction)
2. [Vercel AI SDK — streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
3. [Vercel AI SDK — ToolLoopAgent](https://ai-sdk.dev/docs/foundations/agents)
4. [Vercel AI SDK — createUIMessageStream](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
5. [Next.js — Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
6. [MDN — AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)

#### 动手练习
- 用 `createUIMessageStream` 写一个 30 行的 echo Agent：
  ```ts
  // app/api/chat/route.ts
  export async function POST(req: Request) {
    const result = streamText({ model: openai('gpt-4'), messages: ... });
    return result.toUIMessageStreamResponse();
  }
  ```
- 前端用 `useChat()` 接收，加一个"停止"按钮调 `stop()`。
- 把 `req.signal` 传给 `streamText` 的 `abortSignal`，验证客户端断开时上游 LLM 也停止计费。

#### 自检
- [ ] 能画出 SSE 从浏览器 → Next.js Route Handler → LLM Provider 的链路。
- [ ] 能解释 AbortController 链式传递的 3 段：UI → fetch → upstream。
- [ ] 知道 `toUIMessageStreamResponse()` 比手写 SSE 省了哪些事。

---

### 簇 5（q-04）：ToolLoopAgent prepareStep + token 计数

**覆盖知识点**：LLM token 计数与窗口、ToolLoopAgent prepareStep 钩子、摘要质量与信息损失评估
**真实场景**：聊天历史超过模型窗口（128k tokens），怎么自动压缩？

#### 必读材料
1. [Vercel AI SDK — Agents](https://ai-sdk.dev/docs/foundations/agents)
2. [Vercel AI SDK — prepareStep](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#preparestep)
3. [OpenAI — Models 与 Context Window](https://platform.openai.com/docs/models)
4. [Anthropic — Models](https://docs.anthropic.com/en/docs/about-claude/models)
5. [tiktoken（OpenAI 官方 tokenizer）](https://github.com/openai/tiktoken)
6. [js-tiktoken（浏览器版）](https://github.com/dqbd/tiktoken)

#### 动手练习
- 写一个 100 行的 demo：
  - 用 `js-tiktoken` 统计 messages 的 token。
  - 超过阈值（如 100k）时把最早 2 条用 LLM 压成摘要，替换原消息。
  - 在 ToolLoopAgent 的 `prepareStep` 钩子里实现这个逻辑。
- 评估摘要质量：把摘要前后的对话再喂给 LLM 问同一个问题，对比答案差异。

#### 自检
- [ ] 能说出主流模型的 context window（GPT-4o 128k、Claude 3.5 200k、Gemini 2M）。
- [ ] 能解释 `prepareStep` 在 agent loop 里的执行时机。
- [ ] 知道"摘要"会损失什么信息（精确数字、引用、口吻）。

---

### 簇 6（q-03）：AbortController + 进程内表 + 多 Pod 一致性

**覆盖知识点**：AbortController 与 AbortSignal、进程内表与多 Pod 一致性
**真实场景**：用户在浏览器点"停止"，请求打到 Pod-A，但流式响应在 Pod-B 上 —— 怎么跨 Pod 中断？

#### 必读材料
1. [MDN — AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
2. [MDN — AbortSignal](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)
3. [Vercel AI SDK — abortSignal](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#abortsignal)
4. [Redis Pub/Sub 文档](https://redis.io/docs/latest/develop/interact/pubsub/)

#### 动手练习
- 写一个 Express demo：
  - 端点 A：`/chat` 启动 SSE 流。
  - 端点 B：`/abort/:sessionId` 中断流。
- 单机版：用 Map 存 `sessionId → AbortController`。
- 多 Pod 版：用 Redis Pub/Sub 广播中断信号，所有 Pod 订阅，命中则 abort 本地 controller。

#### 自检
- [ ] 能解释 `controller.abort()` 后，下游 fetch 会发生什么（throw `AbortError`）。
- [ ] 能说出"进程内表"在多 Pod 下失效的根本原因（无共享内存）。
- [ ] 知道 Redis Pub/Sub 和消息队列（如 Kafka）的差异。

---

## 阶段 C：状态与数据

### 簇 7（q-07）：Zustand + selector + persist

**覆盖知识点**：Zustand selector 与 useShallow、persist 中间件与 partialize、store 拆分原则
**真实场景**：聊天 store 里有 100 条消息，怎么让"输入框组件"不在每次新消息进来时都重渲染？

#### 0-1 零基础前置
- 用过 useState、useContext。

#### 必读材料
1. [Zustand 官方文档](https://zustand.docs.pmnd.rs/)
2. [Zustand — Selectors with useShallow](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
3. [Zustand — Persist middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)

#### 动手练习
- 把一个 useState 巨型组件拆成两三个 Zustand store：
  - `useChatStore`（消息列表）
  - `useInputStore`（输入框状态）
  - `useUIStore`（侧边栏、主题）
- 用 React DevTools Profiler 对比拆分前后的渲染次数。
- 给 `useUIStore` 加 persist 中间件，用 `partialize` 只持久化 `theme`，不持久化 `sidebarOpen`。

#### 自检
- [ ] 能解释 `useStore(s => s.user)` 比 `useStore().user` 性能好的原因。
- [ ] 能说出 store 拆分的 3 个信号（不同生命周期、不同更新频率、不同持久化策略）。
- [ ] 知道 `partialize` 能避免哪些坑（敏感数据泄漏、版本不兼容）。

---

### 簇 8（q-10）：React Query queryKey + staleTime + 幂等

**覆盖知识点**：React Query queryKey 设计、staleTime / cacheTime 区别、幂等与 retry 策略
**真实场景**：列表页和详情页都要用同一份用户数据，怎么避免重复请求？mutation 失败怎么自动重试？

#### 必读材料
1. [TanStack Query 5 文档](https://tanstack.com/query/latest/docs)
2. [TanStack Query — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
3. [TanStack Query — staleTime vs gcTime](https://tanstack.com/query/latest/docs/framework/react/guides/caching)
4. [Kent C. Dodds — React Query Patterns](https://tkdodo.eu/blog/practical-react-query)

#### 动手练习
- 用 React Query 写一个增删改查 todo 应用：
  - queryKey 设计成层级：`['todos', 'list', { filter }]`、`['todos', 'detail', id]`。
  - mutation 后用 `invalidateQueries(['todos'])` 刷新所有相关查询。
- 设置 `staleTime: 5 * 60 * 1000`（5 分钟），观察"切换 tab 回来不会重新 fetch"。
- 给 POST mutation 加 `retry: 3` + 指数退避 + 幂等 token（避免重试创建多份）。

#### 自检
- [ ] 能解释 `staleTime`（数据多久变陈旧）和 `gcTime`（数据多久被回收）。
- [ ] 能说出 queryKey 的设计三原则（结构化、可序列化、层级化）。
- [ ] 知道哪些请求适合 retry（GET、幂等 POST），哪些不适合（创建订单）。

---

### 簇 9（q-06）：Prisma + 树存储 + 事务

**覆盖知识点**：Prisma onDelete Cascade、邻接表与树查询、事务一致性
**真实场景**：评论支持回复（树结构），删除父评论时要级联删除子评论，且要保证一致性。

#### 0-1 零基础前置
- 写过 SQL 的 SELECT/INSERT；用过任意一个 ORM（Sequelize / TypeORM 都行）。

#### 必读材料
1. [Prisma 官方文档](https://www.prisma.io/docs)
2. [Prisma — Relations 与 onDelete](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions)
3. [Prisma — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
4. [树存储四种方案对比（经典文章）](https://www.percona.com/blog/2008/02/29/storing-hierarchical-data-in-mysql-using-the-adjacency-list-model/)
5. [PostgreSQL — Recursive CTE](https://www.postgresql.org/docs/current/queries-with.html)

#### 动手练习
- 在 Prisma 里建一个自引用模型：
  ```prisma
  model Comment {
    id       Int       @id @default(autoincrement())
    content  String
    parentId Int?
    parent   Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
    replies  Comment[] @relation("Replies")
  }
  ```
- 写一个递归 CTE 的 raw query 拉出整个评论树。
- 用 `prisma.$transaction` 包"删除评论 + 更新计数"两个操作，故意让其中一个失败，验证回滚。

#### 自检
- [ ] 能说出树存储 4 种方案（邻接表、路径枚举、嵌套集、闭包表）的取舍。
- [ ] 能解释 `onDelete: Cascade` 在数据库层和 Prisma 层的区别。
- [ ] 知道事务的 4 个特性 ACID 分别是什么。

---

## 阶段 D：性能与可观测

### 簇 10（q-11）：Resource Hints + Web Vitals + cookies()

**覆盖知识点**：preconnect / dns-prefetch 区别、TTFB / FCP / LCP 指标、Next.js cookies() 与 RSC
**真实场景**：首屏 LCP 是 4.5 秒（差），怎么优化？

#### 必读材料
1. [MDN — Resource Hints](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel)
2. [MDN — preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect)
3. [MDN — dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/dns-prefetch)
4. [web.dev — Core Web Vitals](https://web.dev/vitals/)
5. [web.dev — LCP](https://web.dev/lcp/)
6. [Next.js — cookies()](https://nextjs.org/docs/app/api-reference/functions/cookies)

#### 动手练习
- 在 Lighthouse 里跑一次基线，记录 LCP。
- 在 `<head>` 里加：
  ```html
  <link rel="preconnect" href="https://api.example.com">
  <link rel="dns-prefetch" href="https://cdn.example.com">
  ```
- 再跑 Lighthouse，对比 LCP 变化。
- 在 RSC 里用 `cookies()` 读 cookie，注意它会把页面变成动态渲染。

#### 自检
- [ ] 能说出 preconnect、dns-prefetch、preload 三者的差异。
- [ ] 能解释 LCP / FCP / TTFB / INP 4 个核心指标的含义。
- [ ] 知道 RSC 里调用 `cookies()` 会让整个路由变成 dynamic。

---

### 簇 11（q-05）：Next.js instrumentation + OTel

**覆盖知识点**：Next.js instrumentation.ts 钩子、OTel histogram vs counter、unhandledRejection vs uncaughtException
**真实场景**：要在 Next.js 项目里接入 OpenTelemetry，统计每个 API 的 P95 延迟。

#### 必读材料
1. [Next.js — Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
2. [OpenTelemetry JS — Node SDK](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
3. [OTel — Metrics 概念](https://opentelemetry.io/docs/concepts/signals/metrics/)
4. [Node.js — process events](https://nodejs.org/api/process.html#event-uncaughtexception)

#### 动手练习
- 创建 `instrumentation.ts`，初始化 NodeSDK + Auto Instrumentation。
- 加一个自定义 counter：`api.requests` 标签 `{ route, method, status }`。
- 加一个 histogram：`api.duration` 记录每个请求耗时。
- 监听 `process.on('unhandledRejection')` 和 `uncaughtException`，分别上报。

#### 自检
- [ ] 能说出 counter（单调递增）和 histogram（分布统计）的差异。
- [ ] 能解释 `unhandledRejection` 和 `uncaughtException` 的触发场景。
- [ ] 知道 `instrumentation.ts` 在 Next.js 启动流程里的位置。

---

### 簇 12（q-15）：Edge vs Node 能力差异 + maxDuration + async_hooks

**覆盖知识点**：Next.js Edge 与 Node Runtime 能力差异、maxDuration 平台限制、node:async_hooks 与 OTel context
**真实场景**：一个长耗时任务（30 秒）跑在 Edge 上超时了，是用 Node 还是改成异步？

#### 必读材料
1. [Vercel — Function Runtime 限制](https://vercel.com/docs/functions/runtimes#runtimes)
2. [Vercel — maxDuration](https://vercel.com/docs/functions/configuring-functions/duration)
3. [Node.js — async_hooks](https://nodejs.org/api/async_hooks.html)
4. [OpenTelemetry — Context 传递](https://opentelemetry.io/docs/languages/js/context/)

#### 动手练习
- 在 Next.js 项目里同时部署 Edge route 和 Node route，对比冷启动延迟。
- 给一个 route 配 `export const maxDuration = 60`（仅 Node），故意 sleep 70 秒看是否被强制中断。
- 用 `AsyncLocalStorage` 在 Express 中间件里挂 `traceId`，下游所有日志自动带上。

#### 自检
- [ ] 能列举 Edge 不支持的 5 个 Node API。
- [ ] 能说出 Vercel 不同套餐的 maxDuration 限制（Hobby 10s、Pro 60s/300s）。
- [ ] 知道 async_hooks 和 AsyncLocalStorage 的关系。

---

## 阶段 E：工程化与扩展

### 簇 13（q-12）：pnpm catalog + lerna v8 + only-allow

**覆盖知识点**：lerna independent vs fixed、pnpm workspace catalog、preinstall only-allow
**真实场景**：monorepo 里 5 个包都依赖 React，怎么统一锁版本？怎么强制大家都用 pnpm？

#### 必读材料
1. [pnpm — Catalogs](https://pnpm.io/catalogs)
2. [Lerna v8 — Version and Publish](https://lerna.js.org/docs/features/version-and-publish)
3. [only-allow](https://github.com/pnpm/only-allow)

#### 动手练习
- 建一个 2 包的 pnpm monorepo：
  - 在根 `pnpm-workspace.yaml` 加 catalog：`react: ^18.3.0`。
  - 子包 `package.json` 写 `"react": "catalog:"`。
- 加 preinstall 钩子：`"preinstall": "npx only-allow pnpm"`，验证用 npm/yarn 装会被拒绝。
- 把 lerna 切到 independent 模式发布两个包。

#### 自检
- [ ] 能解释 catalog 协议解决了什么问题（多包依赖版本漂移）。
- [ ] 能说出 fixed mode 和 independent mode 的取舍。
- [ ] 知道 `npm_config_user_agent` 怎么判断当前用的包管理器。

---

### 簇 14（q-13）：jscodeshift + Strangler Fig + antd → shadcn

**覆盖知识点**：AST 改写与 jscodeshift、增量迁移 / Strangler Fig、antd 与 shadcn 设计差异
**真实场景**：500 个文件用了 antd Button，要逐步迁移到 shadcn 又不能停业务。

#### 必读材料
1. [jscodeshift README](https://github.com/facebook/jscodeshift)
2. [AST Explorer](https://astexplorer.net/) — 在线试 AST 改写
3. [Martin Fowler — Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
4. [shadcn/ui 文档](https://ui.shadcn.com/)
5. [Radix UI 文档](https://www.radix-ui.com/)

#### 动手练习
- 用 AST Explorer 探索一段 `<Button type="primary">` 的 AST 结构。
- 写一个 jscodeshift codemod：
  - 把 `import { Button } from 'antd'` 改成 `import { Button } from '@/components/ui/button'`。
  - 把 `type="primary"` 改成 `variant="default"`。
- 在仓库里跑：`jscodeshift -t transform.js src/`，对比 git diff。

#### 自检
- [ ] 能说出 codemod 的 4 步（解析 → 遍历 → 改写 → 输出）。
- [ ] 能解释为什么 shadcn 是"复制源码到项目"而不是"npm install"。
- [ ] 知道 antd 和 shadcn 在样式分发上的本质差异（CSS-in-JS vs Tailwind + CSS Variables）。

---

### 簇 15（q-14）：SVG path + Figma + opentype.js

**覆盖知识点**：SVG path 与 VectorNetwork、Figma Plugin / Clipboard 格式、opentype.js cmap 与 glyph
**真实场景**：做一个"把字体转成 SVG 路径"的小工具，可以从 Figma 一键导出。

#### 必读材料
1. [SVG Path 规范（W3C）](https://www.w3.org/TR/SVG/paths.html)
2. [MDN — SVG path](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d)
3. [Figma Plugin API — VectorNetwork](https://www.figma.com/plugin-docs/api/VectorNetwork/)
4. [Figma Plugin API — Clipboard](https://www.figma.com/plugin-docs/api/properties/figma-clipboard/)
5. [opentype.js 文档](https://github.com/opentypejs/opentype.js)

#### 动手练习
- 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas。
- 写一个最小 Figma plugin：选中一个文字图层，导出对应的 SVG path 到剪贴板。
- 对比 SVG path 和 Figma VectorNetwork 的数据结构差异。

#### 自检
- [ ] 能背出 SVG path 的常用命令（M、L、C、Z）。
- [ ] 能解释字体的 cmap（字符到 glyph 的映射）和 glyph（实际形状）。
- [ ] 知道 Figma VectorNetwork 比 SVG path 强在哪里（支持网格连接）。

---

## 全局自检：15 个一句话问题

1. RSC 里能不能用 useState？为什么？
2. JWT 和 JWE 的核心区别？
3. Strangler Fig 的三步是什么？
4. `streamText` 的 `abortSignal` 传递链是？
5. ToolLoopAgent 的 `prepareStep` 在什么时机执行？
6. 多 Pod 下怎么实现"中断信号"广播？
7. `useStore(s => s.x)` 和 `useStore().x` 性能差在哪？
8. `staleTime` 和 `gcTime` 分别控制什么？
9. 树存储 4 种方案分别叫什么？
10. preconnect 比 dns-prefetch 多做了什么？
11. Counter 和 histogram 分别用于什么场景？
12. Vercel Hobby 套餐的 maxDuration 是多少秒？
13. pnpm catalog 解决了什么问题？
14. jscodeshift 的 4 个步骤是？
15. opentype.js 的 cmap 和 glyph 分别是什么？

---

## 学习效率 Tips

- **App Router 是核心**：这个项目几乎所有路由相关的知识点都基于 App Router，不要混用 Pages Router 概念。
- **Vercel AI SDK 文档要追新**：AI SDK 5 和 4 差异很大，注意版本号。
- **Edge Runtime 优先实测**：很多 API 限制在文档里写了但容易忘，跑一次踩坑印象最深。
- **codemod 别一次性跑全量**：先在 10 个文件试，确认无误再放开。
- **Prisma + PostgreSQL 比 MySQL 学习收益高**：递归 CTE、JSON 字段、partial index 都是 PG 的强项。
