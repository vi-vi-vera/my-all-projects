# QPilot Web — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (26 topics)


### 1. AST 改写与 jscodeshift

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] Strangler Fig Pattern（Martin Fowler）
- [ ] shadcn/ui 与 Radix UI 文档

#### 🛠️ Hands-on

- [ ] 用 jscodeshift 写一个把 antd Button 转成 shadcn Button 的 codemod 脚本

---

### 2. AbortController 与 AbortSignal

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] MDN AbortController / AbortSignal
- [ ] Vercel AI SDK streamText 的 abortSignal 参数文档

#### 🛠️ Hands-on

- [ ] 写一个 Express demo：客户端 fetch SSE，服务端通过另一个端点根据 sessionId 中断流

---

### 3. App Router 路由组与私有目录

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Next.js App Router 官方文档：Route Groups、Private Folders、Layouts
- [ ] React Server Components 官方介绍

#### 🛠️ Hands-on

- [ ] 搭一个最小 App Router 项目，建两个路由组挂不同 layout，验证 URL 不带组名

---

### 4. Edge Runtime 的 API 限制

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] RFC 7516 JSON Web Encryption
- [ ] Next.js Middleware 与 Edge Runtime 文档
- [ ] jose 文档的 compactDecrypt 与 KeyLike 章节

#### 🛠️ Hands-on

- [ ] 写一个最小 Express demo，签发 JWE 并在 middleware 里解开

---

### 5. Edge vs Node Runtime

> Related dimensions: 🏗️ `architecture` · ⚖️ `trade-off`
> Appears in: `q-01` · `q-09`

#### 📖 Must-read

- [ ] Vercel AI SDK 5 官方文档 ToolLoopAgent 与 streamText 章节
- [ ] Next.js Route Handlers 与 Runtime 选型文档
- [ ] Next.js Edge Runtime 与 Node.js Runtime 文档

#### 🛠️ Hands-on

- [ ] 用 createUIMessageStream 写一个 30 行的 echo Agent 并跑通 SSE
- [ ] 在埋点里给一个旧接口加调用计数，输出每天调用量曲线

---

### 6. JWE 与 JWT 的区别

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] RFC 7516 JSON Web Encryption
- [ ] Next.js Middleware 与 Edge Runtime 文档
- [ ] jose 文档的 compactDecrypt 与 KeyLike 章节

#### 🛠️ Hands-on

- [ ] 写一个最小 Express demo，签发 JWE 并在 middleware 里解开

---

### 7. LLM token 计数与窗口

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vercel AI SDK ToolLoopAgent 的 prepareStep 文档
- [ ] OpenAI / Claude / Gemini 的 context window 文档

#### 🛠️ Hands-on

- [ ] 写一个 100 行的 demo：统计 messages 的 token，超过阈值就把最早 2 条压成摘要

---

### 8. Next.js Edge 与 Node Runtime 能力差异

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-15`

#### 📖 Must-read

- [ ] Next.js Runtime 文档：Edge 与 Node 能力对比
- [ ] Vercel 文档：function maxDuration 限制

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里同时部署一个 Edge route 与一个 Node route，对比冷启动延迟

---

### 9. Next.js cookies() 与 RSC

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] MDN Resource Hints: preconnect、dns-prefetch、preload
- [ ] Next.js next/headers 与 cookies API 文档

#### 🛠️ Hands-on

- [ ] 在 Lighthouse 里跑一次基线，加 preconnect 后再跑一次，记录 LCP 变化

---

### 10. Next.js instrumentation.ts 钩子

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Next.js Instrumentation 文档
- [ ] OpenTelemetry JavaScript node-sdk 文档

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里跑通 NodeSDK 自动埋点 + 一个自定义 counter

---

### 11. OTel histogram vs counter

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Next.js Instrumentation 文档
- [ ] OpenTelemetry JavaScript node-sdk 文档

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里跑通 NodeSDK 自动埋点 + 一个自定义 counter

---

### 12. Prisma onDelete Cascade

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Prisma 关系字段与级联删除文档
- [ ] 邻接表 / 路径枚举 / 嵌套集 / 闭包表四种树存储对比的经典文章

#### 🛠️ Hands-on

- [ ] 在 Prisma 里建一个自引用 parentId 模型，写出树遍历的 raw query

---

### 13. RSC 与 'use client' 边界

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Next.js App Router 官方文档：Route Groups、Private Folders、Layouts
- [ ] React Server Components 官方介绍

#### 🛠️ Hands-on

- [ ] 搭一个最小 App Router 项目，建两个路由组挂不同 layout，验证 URL 不带组名

---

### 14. React Query queryKey 设计

> Related dimensions: 🧩 `feature`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] TanStack React Query 5 官方文档 Queries / Mutations / Query Keys
- [ ] Kent C. Dodds 的 React Query Patterns 文章

#### 🛠️ Hands-on

- [ ] 用 React Query 写一个增删改查 todo 应用，mutation 后用 invalidate 刷新列表

---

### 15. SVG path 与 VectorNetwork

> Related dimensions: 🧩 `feature`
> Appears in: `q-14`

#### 📖 Must-read

- [ ] SVG Path 规范（W3C）
- [ ] Figma 官方 Plugin API 文档：VectorNetwork 与 Node Schema
- [ ] opentype.js 文档

#### 🛠️ Hands-on

- [ ] 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas

---

### 16. ToolLoopAgent prepareStep 钩子

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vercel AI SDK ToolLoopAgent 的 prepareStep 文档
- [ ] OpenAI / Claude / Gemini 的 context window 文档

#### 🛠️ Hands-on

- [ ] 写一个 100 行的 demo：统计 messages 的 token，超过阈值就把最早 2 条压成摘要

---

### 17. Vercel AI SDK 5 stream API

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] Vercel AI SDK 5 官方文档 ToolLoopAgent 与 streamText 章节
- [ ] Next.js Route Handlers 与 Runtime 选型文档

#### 🛠️ Hands-on

- [ ] 用 createUIMessageStream 写一个 30 行的 echo Agent 并跑通 SSE

---

### 18. Zustand selector 与 useShallow

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Zustand 官方 docs：selector 与 shallow
- [ ] Zustand persist 中间件文档

#### 🛠️ Hands-on

- [ ] 把一个 useState 巨型组件拆成两三个 zustand store，比较渲染次数

---

### 19. lerna independent vs fixed

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] pnpm Catalogs 官方文档
- [ ] Lerna v8 文档：independent vs fixed mode

#### 🛠️ Hands-on

- [ ] 建一个 2 包的 pnpm monorepo，用 catalog 锁 React 版本并验证子包解析

---

### 20. maxDuration 平台限制

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-15`

#### 📖 Must-read

- [ ] Next.js Runtime 文档：Edge 与 Node 能力对比
- [ ] Vercel 文档：function maxDuration 限制

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里同时部署一个 Edge route 与一个 Node route，对比冷启动延迟

---

### 21. persist 中间件与 partialize

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Zustand 官方 docs：selector 与 shallow
- [ ] Zustand persist 中间件文档

#### 🛠️ Hands-on

- [ ] 把一个 useState 巨型组件拆成两三个 zustand store，比较渲染次数

---

### 22. pnpm workspace catalog

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] pnpm Catalogs 官方文档
- [ ] Lerna v8 文档：independent vs fixed mode

#### 🛠️ Hands-on

- [ ] 建一个 2 包的 pnpm monorepo，用 catalog 锁 React 版本并验证子包解析

---

### 23. preconnect / dns-prefetch 区别

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] MDN Resource Hints: preconnect、dns-prefetch、preload
- [ ] Next.js next/headers 与 cookies API 文档

#### 🛠️ Hands-on

- [ ] 在 Lighthouse 里跑一次基线，加 preconnect 后再跑一次，记录 LCP 变化

---

### 24. staleTime / cacheTime 区别

> Related dimensions: 🧩 `feature`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] TanStack React Query 5 官方文档 Queries / Mutations / Query Keys
- [ ] Kent C. Dodds 的 React Query Patterns 文章

#### 🛠️ Hands-on

- [ ] 用 React Query 写一个增删改查 todo 应用，mutation 后用 invalidate 刷新列表

---

### 25. 增量迁移 / Strangler Fig

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] Strangler Fig Pattern（Martin Fowler）
- [ ] shadcn/ui 与 Radix UI 文档

#### 🛠️ Hands-on

- [ ] 用 jscodeshift 写一个把 antd Button 转成 shadcn Button 的 codemod 脚本

---

### 26. 邻接表与树查询

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Prisma 关系字段与级联删除文档
- [ ] 邻接表 / 路径枚举 / 嵌套集 / 闭包表四种树存储对比的经典文章

#### 🛠️ Hands-on

- [ ] 在 Prisma 里建一个自引用 parentId 模型，写出树遍历的 raw query

---

## ✨ Bonus (16 topics)


### 1. AbortController 链式传递

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] Vercel AI SDK 5 官方文档 ToolLoopAgent 与 streamText 章节
- [ ] Next.js Route Handlers 与 Runtime 选型文档

#### 🛠️ Hands-on

- [ ] 用 createUIMessageStream 写一个 30 行的 echo Agent 并跑通 SSE

---

### 2. Cookie SameSite 与 HttpOnly

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] RFC 7516 JSON Web Encryption
- [ ] Next.js Middleware 与 Edge Runtime 文档
- [ ] jose 文档的 compactDecrypt 与 KeyLike 章节

#### 🛠️ Hands-on

- [ ] 写一个最小 Express demo，签发 JWE 并在 middleware 里解开

---

### 3. Figma Plugin / Clipboard 格式

> Related dimensions: 🧩 `feature`
> Appears in: `q-14`

#### 📖 Must-read

- [ ] SVG Path 规范（W3C）
- [ ] Figma 官方 Plugin API 文档：VectorNetwork 与 Node Schema
- [ ] opentype.js 文档

#### 🛠️ Hands-on

- [ ] 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas

---

### 4. TTFB / FCP / LCP 指标

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] MDN Resource Hints: preconnect、dns-prefetch、preload
- [ ] Next.js next/headers 与 cookies API 文档

#### 🛠️ Hands-on

- [ ] 在 Lighthouse 里跑一次基线，加 preconnect 后再跑一次，记录 LCP 变化

---

### 5. antd 与 shadcn 设计差异

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] Strangler Fig Pattern（Martin Fowler）
- [ ] shadcn/ui 与 Radix UI 文档

#### 🛠️ Hands-on

- [ ] 用 jscodeshift 写一个把 antd Button 转成 shadcn Button 的 codemod 脚本

---

### 6. node:async_hooks 与 OTel context

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-15`

#### 📖 Must-read

- [ ] Next.js Runtime 文档：Edge 与 Node 能力对比
- [ ] Vercel 文档：function maxDuration 限制

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里同时部署一个 Edge route 与一个 Node route，对比冷启动延迟

---

### 7. opentype.js cmap 与 glyph

> Related dimensions: 🧩 `feature`
> Appears in: `q-14`

#### 📖 Must-read

- [ ] SVG Path 规范（W3C）
- [ ] Figma 官方 Plugin API 文档：VectorNetwork 与 Node Schema
- [ ] opentype.js 文档

#### 🛠️ Hands-on

- [ ] 用 opentype.js 加载一个 ttf 文件，把单个字符的 path 画到 canvas

---

### 8. preinstall only-allow

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] pnpm Catalogs 官方文档
- [ ] Lerna v8 文档：independent vs fixed mode

#### 🛠️ Hands-on

- [ ] 建一个 2 包的 pnpm monorepo，用 catalog 锁 React 版本并验证子包解析

---

### 9. store 拆分原则

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Zustand 官方 docs：selector 与 shallow
- [ ] Zustand persist 中间件文档

#### 🛠️ Hands-on

- [ ] 把一个 useState 巨型组件拆成两三个 zustand store，比较渲染次数

---

### 10. unhandledRejection 与 uncaughtException

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Next.js Instrumentation 文档
- [ ] OpenTelemetry JavaScript node-sdk 文档

#### 🛠️ Hands-on

- [ ] 在一个 Next.js 项目里跑通 NodeSDK 自动埋点 + 一个自定义 counter

---

### 11. 事务一致性

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Prisma 关系字段与级联删除文档
- [ ] 邻接表 / 路径枚举 / 嵌套集 / 闭包表四种树存储对比的经典文章

#### 🛠️ Hands-on

- [ ] 在 Prisma 里建一个自引用 parentId 模型，写出树遍历的 raw query

---

### 12. 增量迁移策略

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Next.js Edge Runtime 与 Node.js Runtime 文档
- [ ] Strangler Fig Pattern（增量替换设计模式）

#### 🛠️ Hands-on

- [ ] 在埋点里给一个旧接口加调用计数，输出每天调用量曲线

---

### 13. 幂等与 retry 策略

> Related dimensions: 🧩 `feature`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] TanStack React Query 5 官方文档 Queries / Mutations / Query Keys
- [ ] Kent C. Dodds 的 React Query Patterns 文章

#### 🛠️ Hands-on

- [ ] 用 React Query 写一个增删改查 todo 应用，mutation 后用 invalidate 刷新列表

---

### 14. 摘要质量与信息损失评估

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vercel AI SDK ToolLoopAgent 的 prepareStep 文档
- [ ] OpenAI / Claude / Gemini 的 context window 文档

#### 🛠️ Hands-on

- [ ] 写一个 100 行的 demo：统计 messages 的 token，超过阈值就把最早 2 条压成摘要

---

### 15. 组件就近原则

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Next.js App Router 官方文档：Route Groups、Private Folders、Layouts
- [ ] React Server Components 官方介绍

#### 🛠️ Hands-on

- [ ] 搭一个最小 App Router 项目，建两个路由组挂不同 layout，验证 URL 不带组名

---

### 16. 进程内表与多 Pod 一致性

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] MDN AbortController / AbortSignal
- [ ] Vercel AI SDK streamText 的 abortSignal 参数文档

#### 🛠️ Hands-on

- [ ] 写一个 Express demo：客户端 fetch SSE，服务端通过另一个端点根据 sessionId 中断流

---

