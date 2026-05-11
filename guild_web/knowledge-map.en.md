# 腾讯频道 Web 平台 (guild_web) — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (26 topics)


### 1. Composable 分层设计

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
- [ ] MDN - Navigator.share / Web Share API 兼容性
- [ ] Electron 文档 - ipcRenderer 与 contextBridge

#### 🛠️ Hands-on

- [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
- [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗

---

### 2. Composable 职责拆分原则

> Related dimensions: 🧩 `feature`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] TypeScript Handbook - Discriminated Unions
- [ ] html2canvas 文档 + 常见 issue 列表
- [ ] Open Graph 协议 - 分享 meta 标签规范

#### 🛠️ Hands-on

- [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
- [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败

---

### 3. Controlled component 模式

> Related dimensions: 🧩 `feature`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
- [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
- [ ] Formily 设计文档 - 协议化表单的演进逻辑

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
- [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件

---

### 4. DOM 复用池模式

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] MDN - IntersectionObserver / ResizeObserver API
- [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
- [ ] vue-virtual-scroller 源码 - 池化策略实现

#### 🛠️ Hands-on

- [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
- [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory

---

### 5. Discriminated Union 类型

> Related dimensions: 🧩 `feature`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] TypeScript Handbook - Discriminated Unions
- [ ] html2canvas 文档 + 常见 issue 列表
- [ ] Open Graph 协议 - 分享 meta 标签规范

#### 🛠️ Hands-on

- [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
- [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败

---

### 6. ESLint 9 flat config

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ ] Husky v9 文档 - Hook 管理与跨平台问题
- [ ] Orange CI 官方文档（内网）

#### 🛠️ Hands-on

- [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
- [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check

---

### 7. Husky + lint-staged 工作流

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ ] Husky v9 文档 - Hook 管理与跨平台问题
- [ ] Orange CI 官方文档（内网）

#### 🛠️ Hands-on

- [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
- [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check

---

### 8. IntersectionObserver API

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] MDN - IntersectionObserver / ResizeObserver API
- [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
- [ ] vue-virtual-scroller 源码 - 池化策略实现

#### 🛠️ Hands-on

- [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
- [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory

---

### 9. JSBridge / mqq jsapi 协议

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
- [ ] MDN - Navigator.share / Web Share API 兼容性
- [ ] Electron 文档 - ipcRenderer 与 contextBridge

#### 🛠️ Hands-on

- [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
- [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗

---

### 10. Nuxt 3 SSR/CSR 切换

> Related dimensions: ⚡ `performance`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
- [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
- [ ] Chrome DevTools Coverage 面板使用手册

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
- [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable

---

### 11. Nuxt 3 dynamic routing

> Related dimensions: 🧩 `feature`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
- [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
- [ ] Formily 设计文档 - 协议化表单的演进逻辑

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
- [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件

---

### 12. OpenTelemetry traceContext 传递

> Related dimensions: 📈 `observability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
- [ ] OpenTelemetry JS - Web Tracer 集成指南
- [ ] Datadog 博客 - Head vs Tail Sampling 对比

#### 🛠️ Hands-on

- [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
- [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK

---

### 13. PB codegen 类型生成链路

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] SemVer 2.0 规范 (https://semver.org/)
- [ ] Conventional Commits 规范 + lerna version 文档
- [ ] Google Protocol Buffers - Language Guide & versioning

#### 🛠️ Hands-on

- [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
- [ ] 写一个 codegen 脚本把 .proto 转成 TS types

---

### 14. Pinia store 拆分原则

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Pinia 官方文档 - Modular stores 与 store composition
- [ ] Nuxt 3 - State management 与 useState hydration 机制
- [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读

#### 🛠️ Hands-on

- [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
- [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量

---

### 15. SSR 水合机制

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Pinia 官方文档 - Modular stores 与 store composition
- [ ] Nuxt 3 - State management 与 useState hydration 机制
- [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读

#### 🛠️ Hands-on

- [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
- [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量

---

### 16. SemVer 在 UI 库中的边界判定

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] SemVer 2.0 规范 (https://semver.org/)
- [ ] Conventional Commits 规范 + lerna version 文档
- [ ] Google Protocol Buffers - Language Guide & versioning

#### 🛠️ Hands-on

- [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
- [ ] 写一个 codegen 脚本把 .proto 转成 TS types

---

### 17. Web Worker + 分片 md5

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] spark-md5 文档 - 增量 hash 使用
- [ ] tus.io 协议规范 - 对比腾讯两阶段协议
- [ ] MDN - Service Worker / Web Worker 入门

#### 🛠️ Hands-on

- [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
- [ ] 实现一个 Semaphore，限制 fetch 并发到 3

---

### 18. decorations vs schema 区分

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
- [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
- [ ] exeditor3 插件开发指南（内网文档）

#### 🛠️ Hands-on

- [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
- [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路

---

### 19. exeditor3 / ProseMirror PluginKey

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
- [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
- [ ] exeditor3 插件开发指南（内网文档）

#### 🛠️ Hands-on

- [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
- [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路

---

### 20. lerna independent 模式

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
- [ ] lerna v5 文档 - independent 模式与 detect changed
- [ ] pnpm 博客 - Phantom dependencies 深度解析

#### 🛠️ Hands-on

- [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
- [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits

---

### 21. rollup manualChunks 用法

> Related dimensions: ⚡ `performance`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
- [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
- [ ] Chrome DevTools Coverage 面板使用手册

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
- [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable

---

### 22. workspace:^ 协议语义

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
- [ ] lerna v5 文档 - independent 模式与 detect changed
- [ ] pnpm 博客 - Phantom dependencies 深度解析

#### 🛠️ Hands-on

- [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
- [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits

---

### 23. 一次性凭证 / Nonce 设计

> Related dimensions: 🔒 `security`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] OWASP - Replay Attack 与 Nonce 设计
- [ ] 腾讯图灵盾官方文档 - turingSdk API
- [ ] MDN - 异步 script 懒加载最佳实践

#### 🛠️ Hands-on

- [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
- [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝

---

### 24. 两阶段上传协议

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] spark-md5 文档 - 增量 hash 使用
- [ ] tus.io 协议规范 - 对比腾讯两阶段协议
- [ ] MDN - Service Worker / Web Worker 入门

#### 🛠️ Hands-on

- [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
- [ ] 实现一个 Semaphore，限制 fetch 并发到 3

---

### 25. 前端监控三大件 (error/perf/trace)

> Related dimensions: 📈 `observability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
- [ ] OpenTelemetry JS - Web Tracer 集成指南
- [ ] Datadog 博客 - Head vs Tail Sampling 对比

#### 🛠️ Hands-on

- [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
- [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK

---

### 26. 重放攻击 (Replay Attack) 原理

> Related dimensions: 🔒 `security`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] OWASP - Replay Attack 与 Nonce 设计
- [ ] 腾讯图灵盾官方文档 - turingSdk API
- [ ] MDN - 异步 script 懒加载最佳实践

#### 🛠️ Hands-on

- [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
- [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝

---

## ✨ Bonus (26 topics)


### 1. BFF vs 多实体直连权衡

> Related dimensions: 🧩 `feature`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
- [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
- [ ] Formily 设计文档 - 协议化表单的演进逻辑

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
- [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件

---

### 2. CDN 长缓存命中率优化

> Related dimensions: ⚡ `performance`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
- [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
- [ ] Chrome DevTools Coverage 面板使用手册

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
- [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable

---

### 3. ClientOnly / Teleport 用法

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Pinia 官方文档 - Modular stores 与 store composition
- [ ] Nuxt 3 - State management 与 useState hydration 机制
- [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读

#### 🛠️ Hands-on

- [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
- [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量

---

### 4. Electron 与 webview 的差异

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
- [ ] MDN - Navigator.share / Web Share API 兼容性
- [ ] Electron 文档 - ipcRenderer 与 contextBridge

#### 🛠️ Hands-on

- [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
- [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗

---

### 5. Orange CI 自定义流水线

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ ] Husky v9 文档 - Hook 管理与跨平台问题
- [ ] Orange CI 官方文档（内网）

#### 🛠️ Hands-on

- [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
- [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check

---

### 6. PATCH diff-only 同步

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Pinia 官方文档 - Modular stores 与 store composition
- [ ] Nuxt 3 - State management 与 useState hydration 机制
- [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读

#### 🛠️ Hands-on

- [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
- [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量

---

### 7. ResizeObserver + batching

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] MDN - IntersectionObserver / ResizeObserver API
- [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
- [ ] vue-virtual-scroller 源码 - 池化策略实现

#### 🛠️ Hands-on

- [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
- [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory

---

### 8. SDK 懒加载与兜底

> Related dimensions: 🔒 `security`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] OWASP - Replay Attack 与 Nonce 设计
- [ ] 腾讯图灵盾官方文档 - turingSdk API
- [ ] MDN - 异步 script 懒加载最佳实践

#### 🛠️ Hands-on

- [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
- [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝

---

### 9. SSR 阶段 globalThis 注入

> Related dimensions: 📈 `observability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
- [ ] OpenTelemetry JS - Web Tracer 集成指南
- [ ] Datadog 博客 - Head vs Tail Sampling 对比

#### 🛠️ Hands-on

- [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
- [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK

---

### 10. StRichText segment 协议

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
- [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
- [ ] exeditor3 插件开发指南（内网文档）

#### 🛠️ Hands-on

- [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
- [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路

---

### 11. Vue 响应式开销规避

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] MDN - IntersectionObserver / ResizeObserver API
- [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
- [ ] vue-virtual-scroller 源码 - 池化策略实现

#### 🛠️ Hands-on

- [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
- [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory

---

### 12. deprecate-then-remove 策略

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] SemVer 2.0 规范 (https://semver.org/)
- [ ] Conventional Commits 规范 + lerna version 文档
- [ ] Google Protocol Buffers - Language Guide & versioning

#### 🛠️ Hands-on

- [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
- [ ] 写一个 codegen 脚本把 .proto 转成 TS types

---

### 13. form-engine（formily）思想

> Related dimensions: 🧩 `feature`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
- [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
- [ ] Formily 设计文档 - 协议化表单的演进逻辑

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
- [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件

---

### 14. html2canvas 跨域与 OOM

> Related dimensions: 🧩 `feature`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] TypeScript Handbook - Discriminated Unions
- [ ] html2canvas 文档 + 常见 issue 列表
- [ ] Open Graph 协议 - 分享 meta 标签规范

#### 🛠️ Hands-on

- [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
- [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败

---

### 15. lerna detect-changed 机制

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] SemVer 2.0 规范 (https://semver.org/)
- [ ] Conventional Commits 规范 + lerna version 文档
- [ ] Google Protocol Buffers - Language Guide & versioning

#### 🛠️ Hands-on

- [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
- [ ] 写一个 codegen 脚本把 .proto 转成 TS types

---

### 16. lockfile 一致性策略

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
- [ ] lerna v5 文档 - independent 模式与 detect changed
- [ ] pnpm 博客 - Phantom dependencies 深度解析

#### 🛠️ Hands-on

- [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
- [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits

---

### 17. pnpm vs Nx 比较

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
- [ ] lerna v5 文档 - independent 模式与 detect changed
- [ ] pnpm 博客 - Phantom dependencies 深度解析

#### 🛠️ Hands-on

- [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
- [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits

---

### 18. tus.io 协议

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] spark-md5 文档 - 增量 hash 使用
- [ ] tus.io 协议规范 - 对比腾讯两阶段协议
- [ ] MDN - Service Worker / Web Worker 入门

#### 🛠️ Hands-on

- [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
- [ ] 实现一个 Semaphore，限制 fetch 并发到 3

---

### 19. useFetch SSR 时机

> Related dimensions: ⚡ `performance`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
- [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
- [ ] Chrome DevTools Coverage 面板使用手册

#### 🛠️ Hands-on

- [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
- [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable

---

### 20. 三级 fallback 策略

> Related dimensions: 🧩 `feature`
> Appears in: `q-13`

#### 📖 Must-read

- [ ] TypeScript Handbook - Discriminated Unions
- [ ] html2canvas 文档 + 常见 issue 列表
- [ ] Open Graph 协议 - 分享 meta 标签规范

#### 🛠️ Hands-on

- [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
- [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败

---

### 21. 图灵盾 scene 维度

> Related dimensions: 🔒 `security`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] OWASP - Replay Attack 与 Nonce 设计
- [ ] 腾讯图灵盾官方文档 - turingSdk API
- [ ] MDN - 异步 script 懒加载最佳实践

#### 🛠️ Hands-on

- [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
- [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝

---

### 22. 多格式 serialize 策略

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
- [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
- [ ] exeditor3 插件开发指南（内网文档）

#### 🛠️ Hands-on

- [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
- [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路

---

### 23. 头采样 vs 尾采样

> Related dimensions: 📈 `observability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
- [ ] OpenTelemetry JS - Web Tracer 集成指南
- [ ] Datadog 博客 - Head vs Tail Sampling 对比

#### 🛠️ Hands-on

- [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
- [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK

---

### 24. 断点续传与并发控制

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] spark-md5 文档 - 增量 hash 使用
- [ ] tus.io 协议规范 - 对比腾讯两阶段协议
- [ ] MDN - Service Worker / Web Worker 入门

#### 🛠️ Hands-on

- [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
- [ ] 实现一个 Semaphore，限制 fetch 并发到 3

---

### 25. 本地 vs CI 职责分层

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ ] Husky v9 文档 - Hook 管理与跨平台问题
- [ ] Orange CI 官方文档（内网）

#### 🛠️ Hands-on

- [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
- [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check

---

### 26. 渐进式优雅降级（fallback）

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
- [ ] MDN - Navigator.share / Web Share API 兼容性
- [ ] Electron 文档 - ipcRenderer 与 contextBridge

#### 🛠️ Hands-on

- [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
- [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗

---

