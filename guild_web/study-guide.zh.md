# 腾讯频道 Web 平台 (guild_web) — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：**会写 Vue/React，但对 Nuxt 3、ProseMirror、Monorepo、可观测性还没实战过的同学**
> 目标：跟着做完，覆盖知识图谱里的 26 项必备 + 26 项加分知识点

---

## 0. 怎么使用这份指引

知识图谱里 52 个知识点，围绕 **13 道考题（q-01 ~ q-13）** 展开，每道题是一个"知识簇"。本指引按**学习顺序**把 13 个簇重新排序，每个簇给你：

1. **它在解决什么真实问题**（一句话场景）
2. **零基础前置**：如果连这一步都不熟，先补什么
3. **必读材料**：每条都给可直接点击的官方/权威外链
4. **动手练习**：从最小可运行 demo 开始
5. **自检清单**：能口头回答=过关

> 推荐节奏：**每个簇 1~2 个晚上**，13 个簇大约 4~5 周。

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：工程基建 | 1, 2 | Monorepo、pnpm、lerna、ESLint |
| 阶段 B：Nuxt 3 与性能 | 3, 4, 5 | SSR/CSR、路由、虚拟列表、构建优化 |
| 阶段 C：编辑器与协议 | 6, 7 | ProseMirror、PB codegen、版本管理 |
| 阶段 D：可观测与安全 | 8, 9, 10, 11 | 监控、风控、上传、分享 |

---

## 阶段 A：工程基建

### 簇 1（q-01）：Monorepo + pnpm workspace + lerna independent

**覆盖知识点**：workspace:^ 协议语义、lerna independent 模式、lockfile 一致性、pnpm vs Nx
**真实场景**：一个仓库里有 5 个包（UI 组件库、工具库、业务 App），怎么管理依赖版本和发布？

#### 0-1 零基础前置
- 用过 npm/yarn/pnpm 其中一个；知道 `package.json` 里的 `dependencies`。

#### 必读材料
1. [pnpm 官方文档 — Workspaces](https://pnpm.io/workspaces)
2. [pnpm 官方文档 — Workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace)
3. [Lerna 官方文档 — Independent mode](https://lerna.js.org/docs/features/version-and-publish#independent-mode)
4. [pnpm 博客 — Phantom dependencies](https://pnpm.io/blog/2020/10/17/node-modules-configuration-options-with-pnpm)
5. [Nx 官方文档 — 与 pnpm 集成](https://nx.dev/recipes/adopting-nx/adding-to-monorepo)

#### 动手练习
- 用 `pnpm init` 建一个空仓库，创建两个包：
  - `packages/ui`（导出一个 Button 组件）
  - `apps/web`（引用 `workspace:^` 的 ui 包）
- 观察 `node_modules` 里的 symlink 结构，理解 workspace 协议怎么解析。
- 初始化 lerna：`npx lerna init --independent`，跑一次 `lerna version --conventional-commits`，观察两个包版本是否独立 bump。
- 讨论：什么场景选 pnpm workspace 就够了，什么场景需要加 Nx？

#### 自检
- [ ] 能说出 `workspace:^` 和 `workspace:~` 的区别。
- [ ] 能解释 lerna fixed mode 和 independent mode 的适用场景。
- [ ] 知道什么是 phantom dependencies，pnpm 怎么避免它。

---

### 簇 2（q-12）：ESLint 9 flat config + Husky + lint-staged + Orange CI

**覆盖知识点**：ESLint 9 flat config、Husky + lint-staged 工作流、本地 vs CI 职责分层
**真实场景**：团队代码风格不统一，有人提交时没跑 lint，CI 上才发现错误。

#### 0-1 零基础前置
- 项目里配过 `.eslintrc.js`；知道什么是 git hook。

#### 必读材料
1. [ESLint 9 — Flat Config 迁移指南](https://eslint.org/docs/latest/use/configure/configuration-files-new)
2. [Husky 官方文档](https://typicode.github.io/husky/)
3. [lint-staged 官方文档](https://github.com/lint-staged/lint-staged)
4. [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/v1.0.0/)

#### 动手练习
- 把一个 `.eslintrc` 项目迁移到 `eslint.config.js`（flat config）：
  - 按 `files: ['**/*.ts', '**/*.vue']` 切多套规则。
  - 给测试文件单独配一套更宽松的规则。
- 配置 Husky v9 + lint-staged：
  - `pre-commit` 跑 `lint-staged`（只检查暂存文件）。
  - 再加一个 `pre-push` 跑全量 `type-check`。
- 写一份"本地 vs CI 职责"文档：本地做什么（fast feedback）、CI 做什么（全量检查 + 构建）。

#### 自检
- [ ] 能说出 flat config 相比 `.eslintrc` 的 3 个变化（单一文件、显式配置、插件解析）。
- [ ] 能解释 `lint-staged` 为什么比 `pre-commit` 里跑 `eslint .` 更快。
- [ ] 知道 Husky v9 的 `.husky/` 目录结构变化。

---

## 阶段 B：Nuxt 3 与性能

### 簇 3（q-02）：Nuxt 3 渲染模式 + 构建优化

**覆盖知识点**：Nuxt 3 SSR/CSR 切换、rollup manualChunks、useFetch SSR 时机、CDN 长缓存
**真实场景**：SEO 要求高的页面用 SSR，后台管理页面用 CSR；怎么把 lodash 单独打包避免重复？

#### 0-1 零基础前置
- 用过 Vue 3；知道 `npm run build` 会生成 dist 文件。

#### 必读材料
1. [Nuxt 3 — Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering)
2. [Nuxt 3 — Hybrid Rendering](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering)
3. [Vite — Build Options](https://vitejs.dev/config/build-options.html)
4. [Vite — Rollup Options](https://vitejs.dev/config/build-options.html#rollupoptions)
5. [source-map-explorer](https://github.com/danvk/source-map-explorer)

#### 动手练习
- 用 `npx nuxi@latest init demo` 创建一个 Nuxt 3 项目：
  - 对比 `nuxt build`（SSR）和 `nuxt generate`（SSG）的产物差异。
  - 用 `source-map-explorer` 分析 vendor 包构成。
- 在 `nuxt.config.ts` 里配 `manualChunks`：
  ```ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-stable': ['lodash-es'],
        }
      }
    }
  }
  ```
- 写一个页面用 `useFetch`，观察 SSR 阶段数据是否在 HTML 中直出（看页面源码）。

#### 自检
- [ ] 能说出 SSR、SSG、CSR、ISR 4 种渲染模式的区别。
- [ ] 能解释 `manualChunks` 怎么减少重复打包。
- [ ] 知道 `useFetch` 在 SSR 阶段会阻塞渲染直到数据返回。

---

### 簇 4（q-05 / q-06）：Nuxt 3 路由与表单 + 虚拟列表

**覆盖知识点**：Nuxt 3 dynamic routing、Controlled component 模式、form-engine 思想、DOM 复用池、IntersectionObserver
**真实场景**：频道详情页 URL 是 `/guild/123/post/456`；表单有 20 个字段，怎么拆组件不混乱？

#### 0-1 零基础前置
- 知道 Vue 的 `v-model`；写过 `pages/index.vue`。

#### 必读材料
1. [Nuxt 3 — File-based Routing](https://nuxt.com/docs/guide/directory-structure/pages)
2. [Nuxt 3 — Dynamic Routes](https://nuxt.com/docs/guide/directory-structure/pages#dynamic-routes)
3. [Vue 3 — v-model 自定义修饰符](https://vuejs.org/guide/components/v-model.html)
4. [Formily 设计文档](https://formilyjs.org/)
5. [MDN — IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
6. [web.dev — Virtualize long lists](https://web.dev/virtualize-long-lists-react-window/)

#### 动手练习
- 用 Nuxt 3 实现 `[guildId]/[tinyId].vue` 双层动态路由，打印 `route.params`。
- 把一个传统大表单拆成：
  - `FormEditor.vue`（受控编辑，只管数据）
  - `FormPreview.vue`（只读展示）
  - `FormCommit.vue`（提交逻辑）
  - 用 `v-model:form` 在父子间同步。
- 用原生 DOM + `transform` 写一个 200 行单列虚拟列表：
  - `IntersectionObserver` 检测可视区域。
  - 只渲染 15 个节点，滚动时复用。
  - Performance 面板对比 `v-for` 1 万条 vs 虚拟列表的 FPS。

#### 自检
- [ ] 能说出 Nuxt 3 文件路由和 Vue Router 配置路由的取舍。
- [ ] 能解释 Controlled component 里"数据上行、事件下行"的原则。
- [ ] 知道 IntersectionObserver 相比 `scroll` 事件监听的优势。

---

### 簇 5（q-07）：Pinia + SSR 水合 + ClientOnly

**覆盖知识点**：Pinia store 拆分、SSR 水合机制、ClientOnly / Teleport、PATCH diff-only 同步
**真实场景**：SSR 直出的页面和客户端 hydrate 后状态不一致，控制台报 mismatch 警告。

#### 0-1 零基础前置
- 用过 Pinia 或 Vuex；知道什么是 SSR。

#### 必读材料
1. [Pinia 官方文档 — Modular Stores](https://pinia.vuejs.org/core-concepts/)
2. [Pinia 官方文档 — SSR](https://pinia.vuejs.org/ssr/)
3. [Nuxt 3 — State Management](https://nuxt.com/docs/getting-started/state-management)
4. [Vue.js — SSR Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)

#### 动手练习
- 用 Pinia 写两个 store：`useGuildStore` 和 `useUserStore`，模拟边界。
- 故意构造一次 hydration mismatch：
  - SSR 阶段 `new Date()` 生成一个时间戳。
  - 客户端 hydrate 时时间不同，触发 mismatch。
  - 用 `<ClientOnly>` 包裹解决。
- 对比 `store.$patch({ count: 1 })` 和 `store.count = 1` 在 SSR 场景下的网络流量差异。

#### 自检
- [ ] 能解释 hydration mismatch 的根本原因（服务端和客户端渲染结果不同）。
- [ ] 能说出 Pinia store 拆分的 3 个信号（数据域分离、不同生命周期、不同权限）。
- [ ] 知道 `<ClientOnly>` 和 `<Teleport>` 在 SSR 中的限制。

---

## 阶段 C：编辑器与协议

### 簇 6（q-03）：ProseMirror 插件体系

**覆盖知识点**：decorations vs schema 区分、PluginKey、StRichText segment 协议、多格式 serialize
**真实场景**：做一个富文本编辑器，需要 placeholder、@提及、投票插件，怎么不互相冲突？

#### 0-1 零基础前置
- 知道什么是富文本编辑器（用过 Quill / Slate / 微信编辑器）。

#### 必读材料
1. [ProseMirror Guide](https://prosemirror.net/docs/guide/)
2. [ProseMirror — Plugins](https://prosemirror.net/docs/guide/#state.Plugins)
3. [ProseMirror — Decorations](https://prosemirror.net/docs/ref/#view.Decoration)
4. [ProseMirror — Schema](https://prosemirror.net/docs/guide/#schema)

#### 动手练习
- 用原生 ProseMirror 写一个 50 行的 placeholder plugin（仅 decorations，不修改 schema）。
- 写一个 PollPlugin：
  - 定义 schema 节点 `poll`。
  - 实现 `toDOM` 和 `serialize`（输出 HTML 和 JSON 两种格式）。
  - 用 PluginKey 获取插件状态。

#### 自检
- [ ] 能说出 decorations 和 schema 的核心区别（视图层 vs 数据层）。
- [ ] 能解释 PluginKey 的作用（跨插件通信、状态读取）。
- [ ] 知道 ProseMirror 的"文档是不可变数据结构"意味着什么。

---

### 簇 7（q-11）：PB codegen + SemVer + deprecate-then-remove

**覆盖知识点**：PB codegen 类型生成链路、SemVer 在 UI 库中的边界判定、deprecate-then-remove 策略
**真实场景**：UI 库发了一个 breaking change，怎么让下游平滑升级？

#### 0-1 零基础前置
- 知道什么是 npm 版本号（`1.2.3`）；了解过 Protobuf。

#### 必读材料
1. [SemVer 2.0 规范](https://semver.org/lang/zh-CN/)
2. [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
3. [Lerna — Version and Publish](https://lerna.js.org/docs/features/version-and-publish)
4. [Google Protocol Buffers — Language Guide](https://protobuf.dev/programming-guides/proto3/)

#### 动手练习
- 用 lerna independent 模式发布 2 个 package：
  - 一个 bump major（breaking change）。
  - 一个 bump minor（新功能）。
- 写一个 codegen 脚本把 `.proto` 转成 TS types。
- 给一个函数加 `@deprecated` 标记，发布 minor 版本，下一个 major 版本再删除。

#### 自检
- [ ] 能背出 SemVer 的三段含义（MAJOR.MINOR.PATCH）。
- [ ] 能说出 UI 库 breaking change 的判定标准（DOM 结构变、CSS 类名变、API 签名变）。
- [ ] 知道 deprecate-then-remove 的完整周期（至少 1 个 minor 警告 + 1 个 major 删除）。

---

## 阶段 D：可观测与安全

### 簇 8（q-09）：前端监控 + OTel + 采样

**覆盖知识点**：前端监控三大件、OpenTelemetry traceContext 传递、头采样 vs 尾采样、SSR 阶段 globalThis 注入
**真实场景**：页面白屏了，怎么从监控里定位是前端错、接口慢、还是资源加载失败？

#### 0-1 零基础前置
- 知道什么是日志、指标、链路追踪。

#### 必读材料
1. [web.dev — Core Web Vitals](https://web.dev/vitals/)
2. [OpenTelemetry JS — Getting Started](https://opentelemetry.io/docs/languages/js/getting-started/)
3. [OpenTelemetry — Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
4. [Datadog — Head vs Tail Sampling](https://www.datadoghq.com/blog/trace-sampling/)

#### 动手练习
- 用 OTel JS 写 demo，自动给 `fetch` 请求注入 `traceparent` header。
- 在 Nuxt 3 plugin 里区分 server/client 注入观测 SDK：
  - Server 用 `@opentelemetry/sdk-node`。
  - Client 用 `@opentelemetry/sdk-trace-web`。
- 对比 head sampling（请求进来就决定是否采样）和 tail sampling（等请求完成后再决定）。

#### 自检
- [ ] 能说出前端监控"三大件"：error、performance、trace。
- [ ] 能解释 `traceparent` 头的格式。
- [ ] 知道 head sampling 和 tail sampling 的适用场景。

---

### 簇 9（q-08）：风控 + 重放攻击 + Nonce

**覆盖知识点**：一次性凭证/Nonce 设计、重放攻击原理、图灵盾 scene 维度、SDK 懒加载与兜底
**真实场景**：防止接口被刷，需要验证用户是不是真人。

#### 0-1 零基础前置
- 知道什么是 XSS、CSRF 的基础概念。

#### 必读材料
1. [OWASP — Replay Attack](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/10-Testing-for-Process-Timing#replay-attack)
2. [OWASP — CSRF](https://owasp.org/www-community/attacks/csrf)
3. [MDN — Script 懒加载](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attributes)

#### 动手练习
- 写一个 `useRisk` composable：
  - 懒加载 turingSdk（`import('turing-sdk')`）。
  - 封装 `verify()` 和 `report()`。
  - 失败时自动降级（允许通过但上报风险）。
- 构造重放攻击 demo：
  - 正常流程：请求 ticket → 验证 → 放行。
  - 攻击：缓存 ticket，第二次用同一个 ticket 发请求。
  - 验证后端拒绝第二次请求。

#### 自检
- [ ] 能说出 Nonce 的 3 个特性（随机、一次性、有时效）。
- [ ] 能解释重放攻击和 CSRF 的区别。
- [ ] 知道 SDK 懒加载失败时的兜底策略（功能降级、提示用户、上报监控）。

---

### 簇 10（q-10）：大文件上传 + Web Worker + tus.io

**覆盖知识点**：两阶段上传协议、Web Worker + 分片 md5、断点续传与并发控制、tus.io 协议
**真实场景**：用户要上传 1GB 的视频，不能卡死页面，断网后要能续传。

#### 0-1 零基础前置
- 知道什么是 Web Worker；用过 `<input type="file">`。

#### 必读材料
1. [MDN — Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
2. [tus.io 协议规范](https://tus.io/protocols/resumable-upload)
3. [spark-md5 文档](https://github.com/satazor/js-spark-md5)
4. [MDN — Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

#### 动手练习
- 用 Web Worker 计算 100MB 文件的 md5，对比主线程版本的卡顿差异。
- 实现一个 Semaphore，限制 `fetch` 并发到 3。
- 用 tus.js 实现断点续传：
  - 选择文件 → 计算指纹 → 检查服务端是否有未完成的上传 → 断点续传。

#### 自检
- [ ] 能说出 Web Worker 和 Service Worker 的区别。
- [ ] 能解释 tus.io 的 4 个核心请求（POST 创建、PATCH 上传、HEAD 查询、DELETE 取消）。
- [ ] 知道为什么大文件上传要分片（内存限制、网络抖动、并发控制）。

---

### 簇 11（q-04 / q-13）：跨端能力 + 分享 + 三级 fallback

**覆盖知识点**：Composable 分层设计、JSBridge/mqq jsapi 协议、渐进式优雅降级、三级 fallback、Discriminated Union、html2canvas
**真实场景**：点击"分享"按钮，在 QQ 里调原生分享，在浏览器里调 Web Share API，都不支持就弹出自绘弹窗。

#### 0-1 零基础前置
- 知道什么是 JSBridge（至少听说过"H5 调原生"）。

#### 必读材料
1. [Vue 3 — Composables](https://vuejs.org/guide/reusability/composables.html)
2. [MDN — Navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
3. [Electron — ipcRenderer](https://www.electronjs.org/docs/latest/api/ipc-renderer)
4. [TypeScript — Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
5. [html2canvas 文档](https://html2canvas.hertzen.com/)
6. [Open Graph 协议](https://ogp.me/)

#### 动手练习
- 写一个 `useHostCapability` composable：
  - 检测 `navigator.share` → `wxJsApi` → `mqq.jsapi` → 自绘弹窗。
  - 返回 `{ share, clipboard, upload, available }`。
- 用 Discriminated Union 定义分享内容类型：
  ```ts
  type ShareContent =
    | { type: 'text'; text: string }
    | { type: 'image'; url: string }
    | { type: 'link'; title: string; url: string };
  ```
  故意漏一个分支，看 TS 编译报错。
- 用 html2canvas 截一个跨域图片，观察哪些情况会失败（CORS、canvas 污染）。

#### 自检
- [ ] 能说出 Composable 和 Vue mixin 的 3 个区别。
- [ ] 能解释三级 fallback 的设计原则（能力检测 → 协议降级 → UI 兜底）。
- [ ] 知道 html2canvas 跨域失败的根本原因（CORS + canvas taint）。

---

## 全局自检：13 个一句话问题

1. `workspace:^` 在发布时会解析成什么版本？
2. flat config 和 `.eslintrc` 最大的语法差异是什么？
3. SSR 和 SSG 的本质区别是什么？
4. `v-model:custom` 怎么实现父子组件双向绑定？
5. hydration mismatch 怎么排查？
6. ProseMirror 的 decorations 和 schema 分别管什么？
7. SemVer 里什么情况下 bump major？
8. `traceparent` 头包含哪些信息？
9. Nonce 为什么能防重放攻击？
10. tus.io 断点续传的核心机制是什么？
11. 三级 fallback 的最后一级通常是什么？
12. Discriminated Union 的"可辨识属性"有什么用？
13. pnpm 为什么不会有 phantom dependencies？

---

## 学习效率 Tips

- **Nuxt 3 文档是核心**：这个项目大量知识点围绕 Nuxt 3，官方文档要反复看。
- **ProseMirror 学习曲线陡**：先从"跑通一个最小编辑器"开始，不要一上来读源码。
- **Monorepo 工具选 pnpm 就够了**：除非项目极其复杂，否则不需要 Nx。
- **跨端能力用真机测**：模拟器和真机的 JSBridge 行为差异很大。
