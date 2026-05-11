# 腾讯频道 Web 平台 (guild_web) — 面试备战材料

> Mode: candidate · Role: 前端工程师（Vue 3 + Nuxt + Monorepo 方向） · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 3      | 🧩 |
| architecture  | 6 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 2 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

腾讯频道前端 Monorepo，pnpm + lerna 管 11 公共包 × 6 端应用，覆盖 PC Web / 手 Q / QQ 浏览器 / H5 / 长贴发布器。

### 标准（30–60 秒）

guild_web 是腾讯频道前端的总仓库，承载 6 个面向不同宿主的应用（web-guild PC 主站、h5-guild 移动 H5、qq-guild Electron、qqbrowser、guild-editor 长贴发布器、guild-scraper 抓取工具）和 11 个公共包（guild-components、guild-pb、feed-editor、qrtc、guild-mui 等）。整体技术栈是 Vue 3 + Nuxt 3 + TypeScript + Pinia + Vite 6 + exeditor3 富文本，工程侧用 pnpm workspaces 做依赖、lerna 做发布，ESLint 9 扁平配置 + Husky/lint-staged + Orange CI 把质量门禁前置到提交侧；运行时通过 AegisV2 + Datong V4 + OpenTelemetry 做一体化观测，turingSdk 兜底人机风控。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

guild_web 的核心命题是『一份代码同时服务 5 种宿主形态』。架构上 packages/ 沉淀共享能力（guild-components 业务组件、guild-pb 协议、feed-editor 富文本、qrtc 实时音视频等），projects/ 各自实现宿主特化逻辑；pnpm workspaces 的 workspace:^ 协议让公共包升级实时联动业务，lerna 的 independent 模式让小修复不需要联动版本号。Nuxt 3 在 web-guild/h5-guild 上默认 SSR，通过 NUXT_SSR=false 还可以切 CSR 出包用于不支持 Node 的宿主；自研 rollup manualChunks 把 vendor 拆成 stable/guild 两层，配合页级 chunk 把首屏依赖控在阈值内。业务层最大投入近一年都在 AI Agent 化频道：agent-settings/tasks/bio/identity/nickname 五个 H5 页面用 Pinia slice 拆分模型，PATCH-style diff-only 提交避免覆盖。可观测侧 server/plugins/aegis.ts 把 SSR 异常打通到伽利略，Datong V4 上报业务行为，OpenTelemetry 贯穿前后端。安全侧 turingSdk 在 PC/H5 两套 SDK 各自适配宿主，敏感操作每次现拿 ticket，禁止缓存防止重放。整个仓库通过 pnpm + ESLint + Husky + Orange CI 四道关把质量门禁压到提交侧，新人 clone 即可跑全套校验。

</details>

## ✨ 项目亮点

- **Monorepo 工程治理：pnpm workspaces + lerna 管控 6 业务 × 11 公共包**（architecture · frontend）
  Situation：仓库里同时有 6 个面向不同宿主的应用和 11 个公共包，旧版 npm/yarn 出现幽灵依赖。Task：建立可控的依赖图与发布流程。Action：用 pnpm workspaces + workspace:^ 协议保证内部包源码级联动，lerna 独立版本管理发布，配合 only-allow pnpm + Husky/lint-staged + Orange CI 把校验前置。Result：依赖一致性问题清零，新人 clone 即可一键拉起全套校验。
  > 关键词：`pnpm-workspaces` · `lerna` · `workspace:^` · `only-allow` · `Orange CI`
- **Nuxt 3 SSR/CSR 双模 + 自研 rollup 代码分包**（performance · frontend）
  Situation：web-guild 首屏 vendor.js 一度超 1.2MB，3G 网络 LCP 超 4s。Task：在不放弃 SSR 体验的前提下降首屏体积。Action：保留 Nuxt 3 SSR、通过 NUXT_SSR=false 支持 CSR 出包，自研 rollup manualChunks 按页/组件/npm 包三层切，vendor 拆 stable 与 guild 两层。Result：vendor-stable ~180KB 长缓存命中率从 60% 提升至 85%+，首屏体积明显下降。
  > 关键词：`Nuxt3` · `SSR` · `manualChunks` · `vendor-stable` · `LCP`
- **AI Agent 化频道：agent-settings/tasks/bio/identity/nickname 全链路 H5**（feature · frontend）
  Situation：h5-guild 需要支持用户自定义 AI 角色与任务编排的频道新形态。Task：在不引入大状态机框架的前提下落地 5 个相关页面的复杂表单与并发编辑。Action：每页一个 Pinia slice 管 dirty/valid，提交走 PATCH-style diff-only，跨页用 useAgentContext 共享身份；表单组件统一封装到 identity/bio/nickname-editor 三件套。Result：5 个 H5 页面顺利上线并发编辑零冲突，新人按模板可以快速复用。
  > 关键词：`AI-agent` · `Pinia-slice` · `PATCH` · `ImageCropper` · `diff-only`
- **全链路可观测：AegisV2 + Datong V4 + OpenTelemetry**（observability · frontend）
  Situation：SSR 异常很难只靠浏览器侧定位，业务事件与性能数据散落在不同平台。Task：建立一套前后端一体化的观测链路。Action：在 web-guild 的 server/plugins/aegis.ts 注入 SSR 侧上报，Aegis V2 上传 sourcemap 提升异常可读性，Datong V4 接管业务埋点，OpenTelemetry 把 trace id 贯穿前后端。Result：SSR 异常可在伽利略一键回溯到行号，业务问题定位时长显著缩短。
  > 关键词：`AegisV2` · `Datong` · `OpenTelemetry` · `SSR-plugin` · `sourcemap`
- **多形态分发：PC Web / H5 / QQ Electron / QQ 浏览器 / 手 Q 终端长贴发布器**（architecture · frontend）
  Situation：同一份频道代码必须在五种宿主里跑，宿主能力、登录态、安全策略各不相同。Task：把宿主差异封装起来，业务代码无感知。Action：三层抽象（useHostCapability 探测 → useShare/useUpload 适配 → 兜底组件如 share-qrcode），adapter 文件路径在 web/h5 项目里完全平行。Result：业务页面零 if-platform，新增宿主时仅追加一组 adapter 即可。
  > 关键词：`multi-host` · `JSBridge` · `Electron` · `mini-program-webview` · `useShare`


## 🏗️ 架构（architecture）— 5 题

### Q1. 你们的 Monorepo 为什么选 pnpm workspaces + lerna？11 个公共包被 6 个 project 引用时依赖一致性怎么保证？

> 来源：`tp-01` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| workspace:^ 协议语义 | 必须掌握 | 多包并行研发的底盘机制 |
| lerna independent 模式 | 必须掌握 | 解释发布流程的关键 |
| pnpm vs Nx 比较 | 加分项 | 面试官会追问为什么不选 Nx |
| lockfile 一致性策略 | 加分项 | 体现 CI 依赖一致性的理解 |

#### 三档回答

**🟢 一句话**：pnpm 管硬链接和 workspace:^，lerna 管版本和发布，only-allow pnpm + Orange CI 把校验前置。

**🔵 标准**（默认）：

诉求是同一份代码里 6 个应用 + 11 个共享包并存，npm/yarn 会有幽灵依赖和 node_modules 膨胀。pnpm workspaces 的硬链接 + workspace:^ 协议让 guild-components 等内部包源码级联动；lerna 只负责版本号推进和发布，避免与 pnpm 职责重叠。preinstall 写 only-allow pnpm 强制工具链，Husky + lint-staged 在提交侧再校一次，Orange CI 跑 pnpm install --frozen-lockfile 保证 lockfile 一致。

<details><summary>🔴 深挖（点击展开）</summary>

选型核心权衡是『本地 DX』vs『发布严谨度』。pnpm 相对 yarn v1 把 node_modules 从 GB 降到百 MB，严格 peer 解析能暴露幽灵依赖；相对 Nx/Rush，我们没到任务图编排量级，最小闭环就够：pnpm 管依赖 + lerna 管发布。

一致性踩过坑：早期两个 project 间接升级了不同版本的 @vue/composition-api，SSR Pinia 水合异常。修复后立了三条纪律：① 根 package.json 锚定 TS/ESLint/Vue 家族版本；② workspace 间一律 workspace:^；③ Orange CI 跑 pnpm install --frozen-lockfile。

发布走 lerna independent 模式：guild-components 小修复不需要带动 guild-pb 升版本，但 detect changed 会标记需要重建的下游 project。发布时 lerna 把 workspace:^ 替换成真实语义化版本写入 registry。

相对 Nx 我们放弃了 task graph caching，因为 Nuxt 3 build 已经有 Vite cache，再套 affected graph 边际收益小且抬高新人门槛；代价是失去跨包并发构建极致速度，但 pnpm --filter 也能拿到 80% 的收益。

</details>

#### 补齐方案

- 📚 必读
  - [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
  - [ ] lerna v5 文档 - independent 模式与 detect changed
  - [ ] pnpm 博客 - Phantom dependencies 深度解析
- 🛠️ 动手
  - [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
  - [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits
- ⚠️ 常见踩坑
  - 没写 preinstall only-allow pnpm，导致别人 npm i 生成第二份 lockfile
  - workspace:^ 在 publish 阶段没被替换，registry tarball 装不起来
  - lerna version 前忘记 frozen-lockfile，发布版本与 lockfile 不一致
- 🤔 自测题（合上文档自答）
  - [ ] pnpm 的 hardlink + symlink 怎么解决扁平化的 diamond 依赖冲突？
  - [ ] workspace:^ 在 publish 阶段如何被替换？不替换会怎样？
  - [ ] 为什么不切到 Nx？affected graph 能多带来什么？
- ⏱️ 预估学习时长：**1 天**

#### 追问（面试官深挖向）

- ⚖️ **如果让你现在选，是否会切到 Nx monorepo？收益和代价是什么？**（trade-off）
  > Nx affected graph 能在 CI 精准跳过未变更 project，大仓 CI 耗时可能降 40%+；代价是引入新 DSL、TS path 复杂度、与 Nuxt build hook 冲突，迁移成本 2-3 周。


#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`
- `packages/guild-components`
- `packages/guild-pb`

---

### Q2. guild-editor 基于 exeditor3 封装，为什么分 AtPlugin/EmojiPlugin/PlaceholderPlugin 三类？它们之间状态怎么隔离？

> 来源：`tp-03` · scope: frontend · projects/guild-editor · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| exeditor3 / ProseMirror PluginKey | 必须掌握 | 插件体系的底层 |
| decorations vs schema 区分 | 必须掌握 | placeholder 不能进 doc 的核心经验 |
| StRichText segment 协议 | 加分项 | 体现对手 Q 生态的理解 |
| 多格式 serialize 策略 | 加分项 | 讲清一次渲染多份输出 |

#### 三档回答

**🟢 一句话**：三类对应『外部实体引用 / 富媒体标签 / UX 占位』不同生命周期，靠 exeditor3 plugin registry + PluginKey 状态隔离。

**🔵 标准**（默认）：

富文本核心难点是『可扩展性 vs 状态耦合』。exeditor3 提供 plugin 注册机制，每个插件维护自己的 schema/commands/keyboard 钩子。AtPlugin 关心用户实体 ID 持久化，对接 guild-types；EmojiPlugin 处理表情图片渲染兜底；PlaceholderPlugin 只做 UX 占位，纯 decoration 不进 schema。后续要加 PollPlugin 等新插件不会触碰已有三者，状态通过 PluginKey 隔离，跨插件通信走 transaction.meta。

<details><summary>🔴 深挖（点击展开）</summary>

三个插件的职责边界和踩过的坑：

① AtPlugin 最复杂，因为 @某人 需要按 plainText / StRichText / HTML 三种格式分别序列化。StRichText 是手 Q 后端结构化协议，要求 at 是 segment node 包含 uid/tinyId/nick。我们在 plugin 的 serialize 钩子里按 output format 分支，避免业务侧散落序列化逻辑。

② EmojiPlugin 曾经栽过：早期 emoji 直接存 Unicode，iOS 15 某版本手 Q webview 渲染不出新 emoji，只能回退到 SVG。现在有一层『宿主能力探测 → 策略选择』分支，复用 useHostCapability。

③ PlaceholderPlugin 单独抽出来的原因是：它不能进 schema，否则用户开始输入时 placeholder 文本会被当作正文落库。正解是走 exeditor3 decorations API 在 EditorView 渲染时动态插入，不落 doc。这是 ProseMirror 社区的常见误用教训。

状态隔离靠 plugin registry：每个插件有独立 plugin state（PluginKey），事件总线只透传 transaction，跨插件通信走 meta 字段。相比方案 A『全局 store + dispatch action』，plugin state 让插件保持可插拔单元，跨插件耦合走 meta 比走 store 更好查问题；代价是 At/Emoji 未来需要联动（@某人带表情）时要显式走 plugin.apply 读对方 state。

</details>

#### 补齐方案

- 📚 必读
  - [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
  - [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
  - [ ] exeditor3 插件开发指南（内网文档）
- 🛠️ 动手
  - [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
  - [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路
- ⚠️ 常见踩坑
  - placeholder 写进 schema 导致保存时落库
  - emoji 用 Unicode 在老宿主渲染空白，需要 SVG fallback
  - @ 插件 serialize 没区分输出格式，后端拿到 HTML 解析失败
- 🤔 自测题（合上文档自答）
  - [ ] ProseMirror PluginKey 具体隔离什么状态？
  - [ ] decorations 和 schema 在更新时生命周期差异？
  - [ ] @全体成员 这种特殊 at，plugin 设计要怎么改？
- ⏱️ 预估学习时长：**2-3 天**


#### Evidence

- `projects/guild-editor/src/components/Editor/index.ts`
- `projects/guild-editor/src/components/Editor/index.vue`
- `projects/guild-editor/src/components/Editor/plugins/placeholder.ts`
- `projects/guild-editor/src/components/Editor/utils/Editor.ts`

---

### Q3. 5 种宿主（PC Web / H5 / QQ Electron / QQ 浏览器 / 手 Q 长贴）的能力差异，你们用什么分层抽象抹平？

> 来源：`tp-04` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| JSBridge / mqq jsapi 协议 | 必须掌握 | 5 宿主能力探测的入口 |
| Composable 分层设计 | 必须掌握 | 中间层适配的核心模式 |
| 渐进式优雅降级（fallback） | 加分项 | 体现兜底设计意识 |
| Electron 与 webview 的差异 | 加分项 | 讲清能力差异的具体例子 |

#### 三档回答

**🟢 一句话**：useHostCapability 做能力探测、composable 做能力适配、fallback 组件做 UI 兜底，三层从底到上。

**🔵 标准**（默认）：

诉求是同一份业务代码跑 5 个宿主、又不在业务侧写 if (isQQ) ... if (isH5) ...。最底层 useHostCapability 通过 UA / window 全局 / JSBridge 探测出 share/clipboard/file/login 等能力位；中间层比如 useShare、useUpload、useLogin 是 composable，根据能力位选择实现（JSBridge / Web API / 弹窗兜底）；UI 层提供 fallback 组件，比如分享在不支持原生分享的宿主上退化成 share-qrcode 二维码弹窗。业务层永远只调 useShare()，不感知宿主。

<details><summary>🔴 深挖（点击展开）</summary>

5 个宿主能力矩阵粗略：① PC Web 能力最弱但最通用；② H5 在手 Q 内嵌时多了 mqq jsapi；③ qq-guild（Electron）能力最强，能直接读文件系统、调系统通知；④ qqbrowser 内嵌走 QQ 浏览器自家 jsapi；⑤ 长贴发布器是手 Q 终端 SDK 套壳，分享/上传都要走端能力。

实战踩坑：早期没分层时，分享逻辑散在十几个组件里，新增『分享到群』要改十几个 if，且 Electron 升级后多了系统级 share menu，回归测试爆炸。引入分层后只动 useShare 一个 composable + 加一个 ElectronAdapter。

fallback 选择有讲究：比如 clipboard，Web 有 navigator.clipboard.writeText，H5 在某些低版本宿主不可用，要 fallback 到 document.execCommand('copy')；再不行就唤起『复制弹窗 + 文本框 + 用户手动选中复制』，三段式优雅降级。

抽象的边界：『纯业务态』不进抽象层（比如分享文案）；『能力是否可用』和『调用方式不同』才进。否则会出现 useShare 里塞业务文案的反模式。代价：业务方第一次接入时要学三层语义；收益是 5 个宿主平均维护成本下降，新增第六个宿主（比如未来 Vision Pro）只需要写一个 Adapter。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
  - [ ] MDN - Navigator.share / Web Share API 兼容性
  - [ ] Electron 文档 - ipcRenderer 与 contextBridge
- 🛠️ 动手
  - [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
  - [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗
- ⚠️ 常见踩坑
  - 在 composable 里塞业务文案，导致跨宿主时文案需要重写
  - 能力探测时同步读 window.mqq，SSR 阶段直接炸
  - fallback 链太深没埋点，无法量化各层命中率
- 🤔 自测题（合上文档自答）
  - [ ] useHostCapability 怎么处理 SSR 下 window 不存在？
  - [ ] 如果业务方就是需要 isElectron 判断，分层抽象会被绕过吗？
  - [ ] JSBridge 调用失败的回退策略怎么设计？
- ⏱️ 预估学习时长：**2-3 天**

#### 追问（面试官深挖向）

- ⚖️ **如果要再加一个鸿蒙 webview 宿主，你的分层架构哪一层要改？**（architecture）
  > 只动最底层：useHostCapability 加鸿蒙 UA 检测和 jsapi 探测；中间层 useShare 多 register 一个 HarmonyAdapter；UI 层和业务层不动。


#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qq-guild`
- `projects/qqbrowser`
- `projects/guild-editor`

---

### Q4. web-guild 的 detail.ts 和 guild.ts 两个 Pinia store 怎么划分边界？SSR 水合 mismatch 怎么排查？

> 来源：`tp-07` · scope: frontend · projects/web-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Pinia store 拆分原则 | 必须掌握 | 回答边界问题的基础 |
| SSR 水合机制 | 必须掌握 | 讲清 mismatch 的前提 |
| PATCH diff-only 同步 | 加分项 | 性能优化的具体手段 |
| ClientOnly / Teleport 用法 | 加分项 | 排查 mismatch 的常见工具 |

#### 三档回答

**🟢 一句话**：guild 管频道全局元数据、detail 管当前贴子瞬时态；按 route key 实例化 + PATCH diff 同步，水合 mismatch 看 timestamp 与 cookie 来源。

**🔵 标准**（默认）：

边界划分：guild store 是『频道维度的元数据』——guildId、成员权限、频道配置、CDN 域名、用户在频道里的角色，这些在频道生命周期内基本稳定。detail store 是『当前打开的贴子』——postId、评论列表、点赞态、富文本内容，会随路由切换重置。这两个 store 都按 route key 实例化（同时打开两个频道详情页时各持一份），通过 useShare composable 做跨 store 的派生数据。SSR 水合时 server 把 store snapshot 序列化进 __NUXT__ 全局，CSR 端 hydrate 时反序列化注入 pinia。

<details><summary>🔴 深挖（点击展开）</summary>

实战教训：

（1）边界争议：『当前用户在当前频道的角色』属于 guild 还是 detail？最终归 guild，因为切贴子时角色不变；但角色对应的权限位会被 detail 的『按钮可见性』派生使用，这种『谁拥有数据 / 谁消费派生』要严格分开，否则两 store 互相 import 容易出循环。

（2）PATCH-style diff-only 同步：detail 切贴子时不要整个 reset，因为评论列表、点赞态有部分可复用（比如同一作者的下一篇贴子，用户信息已在缓存）。我们用 store.$patch 增量更新，未变更字段保留，配合后端按 etag 返回 diff，能省 30% 流量。

（3）SSR 水合 mismatch 排查方法学，按出现频率排：
  - cookie 在 server / client 差异：服务端能读 httpOnly 而客户端读不到，导致登录态分裂，最终某个 v-if 在两端结果不同；定位手段是给 SSR 的 setup 加 console.log + req.headers.cookie 时间戳；
  - 时间戳：server render 时 Date.now() 是 server 时间，hydrate 时 client 时间，差几秒就 mismatch；解决方案是在 store 里写入 server 时间，client 端不允许再生成；
  - 第三方 widget 没等 nextTick：比如 turingSdk 注入了 DOM 节点，hydrate 时被 patch 删除；解决方案是 ClientOnly 包裹；
  - 列表 v-for 没 key 或 key 用 index：server 和 client 顺序略异时会 mismatch。

（4）排查工具链：开 Vue devtools Pinia 面板 → 看 server / client snapshot diff；开 Chrome Performance → 看 Hydration 阶段耗时；最后才是 console.log。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Pinia 官方文档 - Modular stores 与 store composition
  - [ ] Nuxt 3 - State management 与 useState hydration 机制
  - [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读
- 🛠️ 动手
  - [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
  - [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量
- ⚠️ 常见踩坑
  - store 互相 import 形成循环，build 时表面正常运行时报 undefined
  - 用 Date.now() 作为 v-if 条件，必 hydration mismatch
  - 把 token 等敏感数据存进 client 可读 store，泄漏风险
- 🤔 自测题（合上文档自答）
  - [ ] 如果让你新增一个 comment store，边界放哪里？为什么？
  - [ ] 服务端只有 detail 数据，客户端 hydrate 时怎么避免重复请求？
  - [ ] Pinia 的 storeToRefs 在 SSR 下需要注意什么？
- ⏱️ 预估学习时长：**2 天**


#### Evidence

- `projects/web-guild/store/detail.ts`
- `projects/web-guild/store/guild.ts`
- `projects/web-guild/composables/useShare.ts`

---

### Q5. guild-components / guild-pb / guild-types 这些共享包是怎么版本管理和发布的？跨业务方升级冲突怎么避免？

> 来源：`tp-11` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| SemVer 在 UI 库中的边界判定 | 必须掌握 | 回答 breaking 定义的关键 |
| PB codegen 类型生成链路 | 必须掌握 | 解释强约束的来源 |
| lerna detect-changed 机制 | 加分项 | 工具链细节 |
| deprecate-then-remove 策略 | 加分项 | 工程纪律的体现 |

#### 三档回答

**🟢 一句话**：lerna independent + workspace:^ 内部联动、SemVer 对外发版、PB 类型走 codegen 强约束，breaking change 必须发 major。

**🔵 标准**（默认）：

三类包性质不同：① guild-components 是 UI/业务组件库，独立 SemVer，升级 minor 业务方拉新即可；② guild-pb 是 protobuf 生成的请求/响应类型，每次接口变更走 PB codegen 自动生成，breaking change 必须 major，CI 卡 type check；③ guild-types 是手写的领域类型，独立维护。开发期通过 workspace:^ 让 6 个 project 直接吃 packages 源码；发布期 lerna detect changed + lerna version 把 workspace:^ 替换成真实版本号写入 registry。跨业务方冲突主要靠『谁先升 → 通知群同步』+ Orange CI 卡住 lockfile 一致性来兜底。

<details><summary>🔴 深挖（点击展开）</summary>

版本管理的几个真实痛点和应对：

（1）SemVer 在大型 UI 库的边界很模糊：组件改了一个 default slot 内容算 breaking 吗？我们的纪律是『暴露给业务的 props/events/slots 契约』变更才算 breaking，内部样式微调算 patch，对外行为变化但 API 不变算 minor。

（2）PB 类型的强约束：guild-pb 由 .proto 文件 codegen，每次接口微服务发版会触发新一次 codegen + npm publish。问题是 6 个 project 可能装的版本不同，A project 装 v2.3 而 B 装 v2.4，但他们引同一个 Pinia store；运行时 type 是 erase 的所以不会爆，但 IDE 类型对不齐会让人困惑。解法是 root package.json 锚定 guild-pb 版本（peer 强约束），保证 6 个 project 同时升。

（3）lerna independent 模式的痛点：detect-changed 准但有限——能告诉你 packages/A 改了，下游 X 和 Y 需要重建，但不能自动决定 X 和 Y 是 major / minor / patch，开发者要手写 conventional commits + lerna 解析。

（4）跨业务方升级协同：我们的纪律是『发包前在群里 @ 所有 owner 公告 changelog，等 24h』，breaking change 还要写 migration guide 链接进 changelog。这看似土，但比任何工具都管用——比 codemod 自动迁移命中率高。

（5）media-link 这种通用底层组件最危险：被 5 个 project 共用，改一行 props 就是 breaking。我们的策略是『加 prop 永远 default 兼容、删 prop 必须先 deprecate 一个版本』，配合 ESLint 自定义 rule 在 deprecated 时 warn 业务方。

</details>

#### 补齐方案

- 📚 必读
  - [ ] SemVer 2.0 规范 (https://semver.org/)
  - [ ] Conventional Commits 规范 + lerna version 文档
  - [ ] Google Protocol Buffers - Language Guide & versioning
- 🛠️ 动手
  - [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
  - [ ] 写一个 codegen 脚本把 .proto 转成 TS types
- ⚠️ 常见踩坑
  - 把 API 改动只 bump patch，下游业务运行时炸
  - guild-pb 不锁版本，多 project 类型不一致 IDE 报错
  - deprecate 没通知，下次发版直接删掉，下游线上事故
- 🤔 自测题（合上文档自答）
  - [ ] 如果一个共享组件加 prop 但 default 兼容，算 minor 还是 patch？
  - [ ] PB 类型怎么处理向后兼容字段？
  - [ ] 怎么追踪 deprecated API 还有谁在用？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `packages/guild-components/src/ai-app-cover/ai-app-cover.vue`
- `packages/guild-components/src/base-components/media-link/media-link.vue`
- `packages/guild-pb`
- `packages/guild-types`

---

## 🧩 功能（feature）— 2 题

### Q1. agent-settings / tasks / bio / identity / nickname 这套 AI Agent H5 链路是怎么拆的？为什么不做成一个大表单？

> 来源：`tp-05` · scope: frontend · projects/h5-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Nuxt 3 dynamic routing | 必须掌握 | 5 个子页的路由表达基础 |
| Controlled component 模式 | 必须掌握 | editor 解耦的核心模式 |
| BFF vs 多实体直连权衡 | 加分项 | 解释为什么不做聚合 BFF |
| form-engine（formily）思想 | 加分项 | 对未来联动需求的展望 |

#### 三档回答

**🟢 一句话**：按业务实体（身份/任务/简介/昵称）拆 5 个独立页 + 各自 editor 组件，pages 层做动态路由，views 层只管 UI。

**🔵 标准**（默认）：

AI Agent 是频道里的虚拟成员，它的属性按业务实体天然分块：身份卡（identity）/ 任务（tasks）/ 简介（bio）/ 昵称（nickname）/ 入口设置（agent-settings）。一开始的诉求是『让 Agent 拥有人格化的可配置面板』，全塞一个大表单会有三个问题：① 提交失败要整页回滚；② 单字段长加载阻塞全表单；③ 后端按实体维度切了不同微服务，前端再 fetch 一个聚合 BFF 反而拖慢。所以 pages/agent-settings/[guildId]/[tinyId]/index.vue 做主入口和导航，每个子页是独立路由配独立 editor 组件，编辑器内做局部提交。

<details><summary>🔴 深挖（点击展开）</summary>

拆分的真实驱动：① 后端实体维度服务化已成事实，前端聚合反而是反模式；② Agent 配置场景下用户是『进来改一项就走』，整页表单的 UX 反而差；③ 每个 editor 各自有特殊态（identity 涉及头像裁切、bio 接 guild-editor 富文本、tasks 涉及拖拽排序），代码量上做隔离后单页 50%+。

工程上几个有意思的点：

（1）dynamic routing `[guildId]/[tinyId]` 双参数表达『某频道下的某个 Agent』，pages 层 useRoute().params 透传到 views，views 层不感知路由形状（方便后续移植到 PC）。

（2）editor 抽象用 'controlled editor' 模式：editor 组件只暴露 v-model:value + onCommit，提交逻辑由父组件聚合调 BFF。这样新加一个 editor 不需要懂 store。

（3）跨 editor 的弱关联（比如 identity 改完想立刻 refresh tasks 的卡片）走 EventBus + invalidate 标记，不走 store 双绑——store 双绑会让某一个 editor 失败时其他 editor 看到中间态。

反思：当前架构对『跨字段强联动』表达力弱，比如『改了 identity 自动改 nickname』就只能在父页加 effect。如果未来联动需求增多，可能需要引入 form-engine 抽象（类似 formily），但当前业务密度不够，引入复杂度不划算。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
  - [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
  - [ ] Formily 设计文档 - 协议化表单的演进逻辑
- 🛠️ 动手
  - [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
  - [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件
- ⚠️ 常见踩坑
  - editor 直接读 store 导致组件失去复用性
  - EventBus 用太广，跨页事件无人 unsubscribe 内存泄漏
  - 把验证规则塞在 editor 内部，新业务接入无法定制
- 🤔 自测题（合上文档自答）
  - [ ] 如果 identity 和 nickname 必须强联动，你怎么改？
  - [ ] 为什么不做聚合 BFF？
  - [ ] editor 失败时怎么避免污染其他 editor 状态？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `projects/h5-guild/views/agent-settings/index.vue`
- `projects/h5-guild/views/agent-tasks/index.vue`
- `projects/h5-guild/views/agent-bio/components/bio-editor/index.vue`
- `projects/h5-guild/views/agent-identity/components/identity-editor/index.vue`
- `projects/h5-guild/views/agent-nickname/components/nickname-editor/index.vue`
- `projects/h5-guild/pages/agent-settings/[guildId]/[tinyId]/index.vue`

---

### Q2. useShare / useGlobalShare / share-screen-dialog 这套分享体系，多宿主下怎么决定走哪条路？

> 来源：`tp-13` · scope: frontend · projects/web-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Composable 职责拆分原则 | 必须掌握 | 两个 composable 解耦的核心 |
| Discriminated Union 类型 | 必须掌握 | guild-share.ts 的类型基础 |
| html2canvas 跨域与 OOM | 加分项 | 截图方案的真实问题 |
| 三级 fallback 策略 | 加分项 | 稳健分享体系的标志 |

#### 三档回答

**🟢 一句话**：useShare 是单贴子的局部分享、useGlobalShare 是全局分享面板，宿主能力检测决定走 native / 截图弹窗 / 二维码三条路。

**🔵 标准**（默认）：

两个 composable 职责分明：useShare 接 props（贴子 ID/标题/缩略图），返回 share() 方法，调用者是贴子卡片这类局部 UI；useGlobalShare 是 app 级别的分享面板（顶部导航的分享入口），管全局状态。三条路径选择：① 宿主支持 native share（手 Q 内嵌、Electron、QQ 浏览器）走 jsapi 调起原生面板；② 不支持但能截图（PC 现代浏览器）走 share-screen-dialog，自动截屏 + 加水印 + 让用户下载或复制；③ 啥都不支持（老浏览器）走 share-qrcode 二维码弹窗。类型 guild-share.ts 统一封装 ShareTarget / ShareContent，避免业务侧写裸对象。

<details><summary>🔴 深挖（点击展开）</summary>

几个设计上的取舍：

（1）为什么不把 useShare 和 useGlobalShare 合并成一个：它们生命周期不同。useShare 跟着贴子组件 mount/unmount，useGlobalShare 跟着 app 整个生命周期。如果合并，全局面板就要依赖某个具体贴子的上下文，反过来贴子卡片要订阅全局事件——耦合反向加重。当前拆开后，全局面板调 useGlobalShare.share(payload)，payload 由调用方注入（可能来自 useShare，可能来自截图模块），单向数据流。

（2）share-screen-dialog 的截图方案：用 html2canvas，但有几个坑：跨域图片要 CORS 代理；canvas size 太大某些手机会爆 OOM；最后加了 fallback——截不出来时退化为『分享文案 + 链接』纯文本分享。

（3）二维码方案的 UX 退路：很多 PC 用户不带手机扫码，所以 share-qrcode 同时显示『短链复制按钮』作为二级 fallback。

（4）guild-share.ts 类型约束：ShareTarget 用联合类型枚举 'wechat' | 'qq' | 'weibo' | 'copy_link'，业务方在 IDE 里直接拿到智能提示，避免散落 string magic。ShareContent 用 discriminated union 区分『纯文本 / 图文 / 视频』，TypeScript exhaustiveness check 让漏分支编译失败。

（5）观测打点：每次 share 调用前后都打点（scene/target/result），Datong 能算出『每个宿主每个 share target 的成功率』。线上发现 H5 在某个版本手 Q webview 上微信分享成功率突降，1 小时内定位到是 mqq jsapi 接口变更导致 payload 字段名变了，秒级回滚旧路径。

反思：share-screen-dialog 当前还是『前端截图』，实际上后端有更准确的 OG 图生成服务，未来计划是把客户端截图改成后端服务，前端只调 API 拿图片 URL，能解决 OOM 和跨域两大顽疾。

</details>

#### 补齐方案

- 📚 必读
  - [ ] TypeScript Handbook - Discriminated Unions
  - [ ] html2canvas 文档 + 常见 issue 列表
  - [ ] Open Graph 协议 - 分享 meta 标签规范
- 🛠️ 动手
  - [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
  - [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败
- ⚠️ 常见踩坑
  - useShare 和 useGlobalShare 互相 import 导致循环依赖
  - html2canvas 没设 useCORS，跨域图片全白
  - fallback 没埋点，无法量化各路径占比
- 🤔 自测题（合上文档自答）
  - [ ] 如果设计第四种 fallback（比如复制图片到剪贴板），架构怎么扩展？
  - [ ] html2canvas 在 iOS Safari 上有什么特有问题？
  - [ ] ShareTarget 加新平台时类型如何同步给所有调用方？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `projects/web-guild/composables/useShare.ts`
- `projects/web-guild/composables/useGlobalShare.ts`
- `projects/web-guild/components/share-qrcode`
- `projects/web-guild/components/share-screen-dialog`
- `projects/web-guild/types/guild-share.ts`

---

## ⚡ 性能（performance）— 2 题

### Q1. web-guild 和 h5-guild 都是 Nuxt 3 SSR，你们怎么同时支持 SSR 和 CSR 出包？自研 rollup 分包的切分粒度怎么定？

> 来源：`tp-02` · scope: frontend · projects/web-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Nuxt 3 SSR/CSR 切换 | 必须掌握 | 解释双构建的入口 |
| rollup manualChunks 用法 | 必须掌握 | 面试官会追问分包写法 |
| useFetch SSR 时机 | 加分项 | 讲清 onMounted 不生效的真实坑 |
| CDN 长缓存命中率优化 | 加分项 | 联结分包与基础设施 |

#### 三档回答

**🟢 一句话**：NUXT_SSR=false 切 CSR generate，自研 manualChunks 按页/组件/npm 包三层切，vendor 分 stable 与 guild 两层。

**🔵 标准**（默认）：

Nuxt 3 默认 SSR，runtime config 读 NUXT_SSR 切 generate 出 CSR，用于无法跑 Node 的宿主（老 QQ 浏览器内核）；SSR 模式下 server/plugins/aegis.ts 在服务端就启动让首屏异常能被上报。rollup 分包写在 vite build.rollupOptions.output.manualChunks 里，三层切：① 页级一页一 chunk；② 重复率高的业务组件如 virtual-waterfall 单独成 chunk；③ npm 依赖按包名做二级 group，vendor 拆 stable（lodash、dayjs）和 guild（@tencent/guild-*）两层。

<details><summary>🔴 深挖（点击展开）</summary>

根源是宿主多样性：Web 浏览器 + QQ 浏览器内嵌 + 手 Q webview + 微信小程序 webview，各家 SSR 支持度不一样，老手 Q 内核甚至没法处理 server-rendered cookie 续签，必须双构建。

SSR 与 CSR 差别不止 flag：① useFetch 只能在 setup 同步阶段生效，onMounted 调用会直接 resolve undefined，README 专门列出来过这条坑；② server/plugins/aegis.ts 只在 SSR 侧生效，CSR 模式必须在客户端 app.vue 再 mount 一次；③ Pinia 的 serialize 在 CSR 是冗余的，但为代码路径统一没剪。

分包来自实测：最初 vendor.js 1.2MB+，3G LCP 4s+。自定义 manualChunks 的规则是『同层级变更概率相近的代码放一起』：lodash + dayjs 半年不动 → vendor-stable ~180KB 长缓存；@tencent/guild-* 随版本变动 → vendor-guild ~260KB 更新频繁但可 sourcemap 追踪；页级 chunk 路由切换时才加载。分完后 vendor-stable 缓存命中率从 60% 抬到 85%+。

权衡：我们主动放弃 Nuxt 3 默认『按依赖图自动分包』，因为它会把只被一个页引用的 npm 包塞进页级 chunk，相似页之间重复下载相同依赖。手写规则失去自动化优势，但能把缓存命中率显著拉高。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
  - [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
  - [ ] Chrome DevTools Coverage 面板使用手册
- 🛠️ 动手
  - [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
  - [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable
- ⚠️ 常见踩坑
  - 在 onMounted 用 useFetch 没请求，必须 setup 同步用或改 $fetch
  - SSR 下 server/plugins 访问 window 炸 → 用 process.client 保护
  - manualChunks 返回值不稳定导致 chunk 名漂移，破坏 CDN 缓存
- 🤔 自测题（合上文档自答）
  - [ ] CSR generate 出来的产物怎么保证路由跳转时按需加载？
  - [ ] SSR 下 useAsyncData 与 useFetch 区别？
  - [ ] vendor-stable 和 vendor-guild 分层收益如何量化？
- ⏱️ 预估学习时长：**1-2 天**

#### 追问（面试官深挖向）

- ⚖️ **为什么不直接用 Nuxt 3 默认的 route-based splitting？**（trade-off）
  > 默认按依赖图分会把只被一个页用的 npm 包塞进页级 chunk，相似页面重复下载；手写规则虽失去自动化但把缓存命中率从 60% 抬到 85%。


#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qqbrowser`

---

### Q2. 短贴 Feed 的瀑布流 / 虚拟列表怎么做？滚动 1 万条不卡的核心是什么？

> 来源：`tp-06` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| DOM 复用池模式 | 必须掌握 | 虚拟列表的核心数据结构 |
| IntersectionObserver API | 必须掌握 | 懒加载 + 分页的官方方式 |
| ResizeObserver + batching | 加分项 | 高度测量异步化的关键 |
| Vue 响应式开销规避 | 加分项 | 讲清为什么不能直接 v-for |

#### 三档回答

**🟢 一句话**：DOM 复用池 + IntersectionObserver 触发懒加载 + ResizeObserver 异步分片测高，三件套就稳了。

**🔵 标准**（默认）：

瀑布流难点是高度未知、双列错位。我们的实现：① 用 virtual-waterfall 维护一个固定大小的 DOM 复用池（比如 50 个 item DOM），随用户滚动把上方滚出视口的节点回收复用给下方；② IntersectionObserver 监听『预触底 sentinel』触发翻页；③ 图片高度未知时先用预估高度占位，图片 load 完后用 ResizeObserver 异步分片更新真实高度，避免一次 reflow 大量 item。④ guild-waterfall-feed 在 web-guild 和 h5-guild 两份实现，差异只在列数与卡片样式，核心算法走 packages/guild-components 复用。

<details><summary>🔴 深挖（点击展开）</summary>

几个关键性能问题和解法：

（1）DOM 复用 vs Vue 响应式：v-for + key 的天然做法每条数据一个 vnode，10k 条直接爆。复用池的关键是『池大小 = 视口高度 ÷ 最小卡片高度 × 缓冲倍数』，比如 50 个 DOM 节点覆盖 100 个虚拟 item，滚动时通过 transform: translateY 重定位，data 用 ref 替换。我们没用 vue-virtual-scroller 是因为它对双列瀑布流支持差，且不能自定义图片 lazy 时机。

（2）高度测量的批处理：图片 load 是异步事件，10 张图同时 load 会触发 10 次 reflow。我们用 requestIdleCallback 把测量请求合并到 16ms 一帧内，统一 batch 应用到 column heights。代价是首屏列高短暂错位，肉眼几乎不可见。

（3）IntersectionObserver vs scroll 事件：scroll 事件 60fps 触发是性能噩梦，IO 由浏览器自己 schedule，掉帧友好。我们把『翻页 sentinel』『卡片懒加载』两类 IO 分开实例（避免回调合并导致响应慢），thresholds 都精心调过。

（4）H5 vs PC 的差异：H5 屏小、列数少（2 列），DOM 复用池可以更小（20-30）；PC 屏宽，3-4 列，池大小 70+。两份配置而非两份实现。

性能数据：1 万条 mock 数据下 FPS 稳定 55+，内存占用相比朴素实现降 ~80%。

</details>

#### 补齐方案

- 📚 必读
  - [ ] MDN - IntersectionObserver / ResizeObserver API
  - [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
  - [ ] vue-virtual-scroller 源码 - 池化策略实现
- 🛠️ 动手
  - [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
  - [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory
- ⚠️ 常见踩坑
  - 每条数据都 deep reactive，1 万条响应式开销爆炸
  - scroll 事件 60fps 触发 setState 卡顿
  - 图片高度变化未 batch，触发瀑布流大面积 reflow
- 🤔 自测题（合上文档自答）
  - [ ] 复用池大小怎么定？过小过大各有什么问题？
  - [ ] 瀑布流如何处理 placeholder 高度与真实高度差异？
  - [ ] IntersectionObserver 在 iOS Safari 上有什么坑？
- ⏱️ 预估学习时长：**2 天**

#### 追问（面试官深挖向）

- ⚖️ **如果改成无限滚动 + 跳锚回顶（用户点 anchor 跳到第 5000 条），架构要怎么改？**（feature）
  > 需要把列高数据持久化到 store，跳锚时先恢复列高数组、再用 estimatedHeight × index 推算 scrollTop；中途未测高的位置用预估值，跳到后用 ResizeObserver 修正。


#### Evidence

- `projects/web-guild/views/g-home/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/h5-guild/views/cms/cms-batch/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/web-guild/components/virtual-waterfall`
- `projects/web-guild/gui/virtual-list`

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. fileBatchUpload → fileUpload 两阶段上传协议，为什么不一次性上传？多登录态怎么兼容？

> 来源：`tp-10` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 两阶段上传协议 | 必须掌握 | 答题主干 |
| Web Worker + 分片 md5 | 必须掌握 | 大文件上传的关键 |
| 断点续传与并发控制 | 加分项 | 可靠性维度的体现 |
| tus.io 协议 | 加分项 | 对比社区方案 |

#### 三档回答

**🟢 一句话**：一阶段批申请签名 + 二阶段并发上传，避免每文件单次握手；登录态按 pskey/skey/access_token 三套适配 header。

**🔵 标准**（默认）：

两阶段：① fileBatchUpload 一次发文件元数据列表（filename/size/md5），后端返回每个文件的上传 URL + 签名 + uploadId；② 客户端拿 URL 并发 PUT 真实文件内容（fileUpload）。优势：握手只走一次，大批量上传（比如发 9 图贴）能省 8 次签名往返；后端也能在阶段一做风控/容量预检查。多登录态：手 Q 登录用 pskey、PC 登录用 skey、第三方授权用 access_token，三套放在不同 header（uin/pskey vs Authorization），我们用 axios interceptor 按宿主探测自动注入。

<details><summary>🔴 深挖（点击展开）</summary>

工程化几个深入点：

（1）md5 客户端计算的代价：文件大 (>10MB) 时主线程算 md5 直接卡住界面，要丢到 Web Worker 跑分片增量 md5。我们在 upload-button 内部封装了 spark-md5 + worker，业务侧只看到 await getMd5(file)。

（2）并发度控制：阶段二能并发，但浏览器对同源连接上限 6 个；超过会自动排队，但有些宿主 webview 限制更严（4 个）。我们用一个 Semaphore 控制 max=4，未上传成功的 chunk 走断点续传重试。

（3）断点续传：阶段二每个 PUT 失败时拿 uploadId 重试，最多 3 次指数退避；超过 30% 文件失败则整批 abort 让用户重新触发，避免半成功状态污染 UI。

（4）多登录态适配的踩坑：早期 axios interceptor 写在每个 project，三处实现不一致，导致 H5 在某些路径丢 pskey。后来抽到 packages/guild-components/src/base-components/media-link，业务层 import 这个 composable 即可。media-link.vue 渲染时根据 url scheme 决定是否要走鉴权重写——比如 cdn.xxx 的 url 已经签好名，pskey 反而干扰。

（5）whistle 抓包：联调时本地需要让请求走线上后端但带本地 cookie，配 whistle 规则即可。新人入职文档里专门有一段。

反思：如果重做，会考虑用 tus.io 协议替代自家两阶段，社区生态更成熟。当前没切是因为腾讯后端基建是按两阶段协议设计的，切要协同后端，ROI 不高。

</details>

#### 补齐方案

- 📚 必读
  - [ ] spark-md5 文档 - 增量 hash 使用
  - [ ] tus.io 协议规范 - 对比腾讯两阶段协议
  - [ ] MDN - Service Worker / Web Worker 入门
- 🛠️ 动手
  - [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
  - [ ] 实现一个 Semaphore，限制 fetch 并发到 3
- ⚠️ 常见踩坑
  - 在主线程算大文件 md5 让界面冻结
  - 上传失败没区分『可重试』vs『不可重试』错误
  - 三种登录态 header 同时塞，后端按优先级拒绝
- 🤔 自测题（合上文档自答）
  - [ ] 如果文件 1GB+，分片粒度和并发怎么定？
  - [ ] 断点续传的状态存哪里（localStorage vs IndexedDB）？
  - [ ] tus.io 相比腾讯两阶段优势在哪？
- ⏱️ 预估学习时长：**1-2 天**


#### Evidence

- `projects/web-guild/components/upload-button`
- `packages/guild-components/src/base-components/media-link/media-link.vue`

---

### Q2. ESLint 9 扁平配置 + Husky + lint-staged + Orange CI，质量门禁分几道？为什么不只在 CI 卡？

> 来源：`tp-12` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| ESLint 9 flat config | 必须掌握 | 现代 lint 配置基础 |
| Husky + lint-staged 工作流 | 必须掌握 | 提交侧门禁核心 |
| 本地 vs CI 职责分层 | 加分项 | 理解四道闸门的设计哲学 |
| Orange CI 自定义流水线 | 加分项 | 腾讯内 CI 生态 |

#### 三档回答

**🟢 一句话**：编辑器实时 + 提交前 lint-staged + push 前 husky pre-push + CI Orange，四道闸门，越往后越贵。

**🔵 标准**（默认）：

四道闸门：① 编辑器（VSCode + ESLint 插件）实时高亮，最便宜；② 提交时 lint-staged 对暂存区文件跑 ESLint + Prettier，Husky 的 pre-commit hook 触发；③ push 前 husky pre-push 跑 type check 和 unit test（可选）；④ Orange CI 跑 lint + type check + build + unit test 全套，最贵。ESLint 9 切到了 flat config（eslint.config.mjs），优势是配置可编程、能根据文件 glob 套不同规则集。CI 卡『100% 必须通过』，本地是『100% 建议通过』，开发者 emergency 可以 --no-verify 但必须在 PR 描述里说明。

<details><summary>🔴 深挖（点击展开）</summary>

为什么不能只靠 CI——四个理由：

（1）反馈循环时长：编辑器实时反馈是『毫秒级』，CI 反馈是『5-15 分钟』。开发者写一行错代码到 CI 失败再改，注意力切换成本 10 倍。

（2）热路径分流：CI 资源有限，全公司排队。把『一定错的』在本地拦下，CI 只跑『可能错的』，资源用在刀刃。

（3）保护 main 分支：CI 跑过的代码才能合入 main，但 push 前没卡，开发者会习惯性推一堆 broken commit 到 feature 分支，污染 git 历史。

（4）渐进教育：lint-staged 在提交时 auto-fix（比如 prettier 格式化），开发者『写错了→工具帮你改对了』循环重复 100 次，肌肉记忆就成了。

ESLint 9 flat config 的切换价值：

（a）老的 .eslintrc 是『配置黑盒』，rules 继承链不可见；flat config 是普通 JS 模块，导出数组，每条配置是一个对象 { files, rules, plugins }，按 glob 命中。可读性大幅提升。

（b）能 dynamic import 插件：比如只在 packages/guild-components 启用 vue/strongly-recommended，其他地方走宽松版，写在一份 config 文件里。

（c）pnpm + flat config 没有 monorepo 配置歧义：以前 .eslintrc 会被 ESLint 沿目录树自动 merge，packages 和 projects 里各放一份就互相污染；flat config 显式声明 files glob，作用范围清晰。

踩过的坑：lint-staged 与 husky 9.x 集成有 known bug，会在 Windows 上 stash 失败丢文件；我们 pin 在 9.0.0 + 内部脚本 workaround。

反思：CI 速度仍是瓶颈，目前 5 分钟左右，想优化到 2 分钟以内需要『lint 增量化 + test 按 affected』。Nx 在这方面优势明显，但前面说过没切。

</details>

#### 补齐方案

- 📚 必读
  - [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
  - [ ] Husky v9 文档 - Hook 管理与跨平台问题
  - [ ] Orange CI 官方文档（内网）
- 🛠️ 动手
  - [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
  - [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check
- ⚠️ 常见踩坑
  - lint-staged 没 --diff 参数，每次跑全量
  - husky 8 → 9 升级没改路径配置，hook 静默失效
  - 在 lint-staged 里跑 jest，触发 watch 模式卡死
- 🤔 自测题（合上文档自答）
  - [ ] 如果团队推 --no-verify 滥用，你怎么治理？
  - [ ] flat config 怎么处理 monorepo 多套规则？
  - [ ] 为什么 prettier 不放进 ESLint rule 而是独立工具？
- ⏱️ 预估学习时长：**1 天**


#### Evidence

- `eslint.config.mjs`
- `.orange-ci.yml`
- `.code.yml`
- `package.json`

---

## 📈 可观测性（observability）— 1 题

### Q1. AegisV2、Datong V4、OpenTelemetry 三套观测一起接，职责怎么划分？为什么不挑一个全用？

> 来源：`tp-09` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 前端监控三大件 (error/perf/trace) | 必须掌握 | 理解三家分工的基础 |
| OpenTelemetry traceContext 传递 | 必须掌握 | 跨服务关联的核心 |
| 头采样 vs 尾采样 | 加分项 | 讲清采样策略权衡 |
| SSR 阶段 globalThis 注入 | 加分项 | 工程化细节 |

#### 三档回答

**🟢 一句话**：Aegis 抓前端异常/性能、Datong 跑业务埋点、OTel 跨服务链路追踪，三家各管一档不重叠。

**🔵 标准**（默认）：

三家分工：① AegisV2 是腾讯前端监控平台，抓 JS 异常、性能指标（LCP/FID/CLS）、白屏，强项是浏览器侧错误聚合和报警；② Datong V4 是数据中台埋点系统，强项是业务指标分析、漏斗、用户分群，所有『按钮点击 / 页面停留』走它；③ OpenTelemetry 跑分布式 trace，从浏览器请求一直到后端各微服务，关联同一 traceId，强项是排查慢请求和跨服务依赖。server/plugins/aegis.ts 在 Nuxt SSR 阶段就启动 Aegis，让首屏白屏也能上报。三者通过统一封装的 useObserve composable 对外暴露 reportError/reportEvent/startSpan，业务侧不感知底层。

<details><summary>🔴 深挖（点击展开）</summary>

为什么不挑一个全用——核心是『工具的强项不可替代』：

（1）AegisV2 强在错误指纹聚合：同样的错误 1 万次会被去重成一条记录，自动 sourcemap 解析。Datong 是分析平台不会做这种聚合；OTel 关心 span 不关心 fingerprint。

（2）Datong 强在业务漏斗：『打开频道 → 进入贴子 → 点赞 → 评论』链路 retention rate，要按用户分群、按时间切片。Aegis 没这种 OLAP 能力。

（3）OTel 强在跨服务关联：贴子加载慢，Aegis 能告诉你前端慢 800ms，但不知道是 BFF 慢还是后端 RPC 慢；OTel 沿 traceId 链路看一眼，定位哪个 service 的哪个 span。

如果硬要用一家：用 Aegis 做分析？维度爆炸、查询慢；用 Datong 抓错误？没聚合、没 sourcemap；用 OTel 做业务分析？没现成的 BI 报表。

工程上的协同设计：

（a）统一 traceId：进入页面时生成一个 traceId，三家上报都带上。这样在 Aegis 看到一个错误，能拿 traceId 去 OTel 看完整链路，去 Datong 看用户路径，三家就是一个用户的三视角。

（b）采样策略错峰：Aegis 默认全量（错误本来就稀有）；Datong 按场景采样（核心漏斗 100%、非核心 10%）；OTel 头采样 10% + 错误尾采样 100%。这样总流量可控但关键场景全留。

（c）SSR 注入要小心：Aegis 在 server 端注入时不能用 window，要用 globalThis；Datong 通常只在 client 端跑，SSR 阶段 stub；OTel 的 trace context 通过 HTTP header 跨 server/client 传递。我们在 server/plugins/aegis.ts 里只 boot Aegis，其余两家在 plugins/client/observe.ts。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
  - [ ] OpenTelemetry JS - Web Tracer 集成指南
  - [ ] Datadog 博客 - Head vs Tail Sampling 对比
- 🛠️ 动手
  - [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
  - [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK
- ⚠️ 常见踩坑
  - Aegis 漏 sourcemap 上传，线上错误堆栈全是混淆名
  - OTel 全量采样，trace 数据量爆炸
  - Datong 和 Aegis 重复埋同一事件，统计数据双倍
- 🤔 自测题（合上文档自答）
  - [ ] 如果只能保留一个观测工具，你会留哪个？为什么？
  - [ ] OTel 怎么在 SSR 与 CSR 间传递 traceContext？
  - [ ] 如何识别『前端慢』vs『后端慢』？
- ⏱️ 预估学习时长：**2 天**


#### Evidence

- `projects/web-guild/server/plugins/aegis.ts`
- `projects/web-guild`
- `projects/h5-guild`

---

## 🔒 安全（security）— 1 题

### Q1. PC 和 H5 都接了图灵盾 turingSdk 风控，ticket 流程具体是怎么走的？为什么不能缓存 ticket？

> 来源：`tp-08` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 一次性凭证 / Nonce 设计 | 必须掌握 | 解释为什么不能缓存 |
| 重放攻击 (Replay Attack) 原理 | 必须掌握 | ticket 设计的根本动机 |
| SDK 懒加载与兜底 | 加分项 | 讲清工程化实现细节 |
| 图灵盾 scene 维度 | 加分项 | 体现对腾讯风控生态的理解 |

#### 三档回答

**🟢 一句话**：用户高风险动作触发滑块验证 → SDK 出 ticket → 业务把 ticket 随请求带给后端 → 后端核销；一次一票，绝不缓存。

**🔵 标准**（默认）：

图灵盾是腾讯统一风控网关。流程：① 高风险动作（发帖、关注、点赞超限等）触发 turingSdk.verify({ scene })；② SDK 弹滑块/拼图/无感校验 UI，校验通过返回 ticket（一次性凭证，含 scene/ts/sign）；③ 业务把 ticket 放进 request header 或 body，跟着业务请求一起到后端；④ 后端把 ticket 拿到图灵盾后端服务核销，核销通过才执行真实业务；⑤ ticket 核销即作废，重放无效。PC 和 H5 各有一份 utils/turingSdk/index.ts 是因为加载源不同（PC 走 CDN script、H5 走宿主 jsapi），但对外 API 统一。

<details><summary>🔴 深挖（点击展开）</summary>

为什么 ticket 不能缓存——三重设计：

（1）防重放：缓存 ticket 等于把『一次性凭证』退化成『长期 token』，攻击者拿到一个 ticket 后能批量重放高风险接口。图灵盾后端的核销是原子操作，重复核销直接拒绝。

（2）防场景串扰：不同 scene（发帖 / 关注 / 充值）的风险等级不同，发帖低风险可能只触发无感校验，充值高风险触发滑块。如果缓存复用，等于用低强度凭证调用高风险接口。SDK API 强制传 scene，业务侧无法绕过。

（3）防时间窗口攻击：ticket 内含 ts 时间戳，后端有 60 秒过期窗口；不缓存就避免了『拿一个 ticket 等到深夜风控阈值变化时再用』。

 PC/H5 双端统一抽象的工程要点：

（a）懒加载：turingSdk 是 300KB+ 的脚本，正常用户大概率永远不会触发，所以做成懒加载，第一次调 verify 时才 inject script，载入后缓存 promise；

（b）兜底：SDK 加载失败、网络超时怎么办？我们用 try/catch + 60 秒 fallback 时间窗：超时则上报降级日志、引导用户重试，绝不无 ticket 通过——这是安全侧底线；

（c）H5 在手 Q 内嵌环境特殊：宿主可以唤起原生验证 UI，体验更好，所以 H5 版本会先检测 mqq jsapi，存在则走 native，不存在再 fallback CDN script。

（d）观测：每次 verify 上报 scene/duration/result 三个字段到 Aegis，能在 dashboard 看到各 scene 的成功率/平均耗时，异常时可秒级发现。

</details>

#### 补齐方案

- 📚 必读
  - [ ] OWASP - Replay Attack 与 Nonce 设计
  - [ ] 腾讯图灵盾官方文档 - turingSdk API
  - [ ] MDN - 异步 script 懒加载最佳实践
- 🛠️ 动手
  - [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
  - [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝
- ⚠️ 常见踩坑
  - 把 ticket 写进 localStorage，下次启动复用，导致大面积请求失败
  - 兜底分支允许『SDK 失败时无 ticket 通过』，开口子
  - SDK 加载没 dedup，用户 spam 点击触发多个并发 verify
- 🤔 自测题（合上文档自答）
  - [ ] 如果业务方坚持要缓存 ticket 减少弹窗，你怎么说服？
  - [ ] verify 失败时业务侧的合理 fallback 路径是什么？
  - [ ] PC 和 H5 unified API 怎么处理 SDK 接口差异？
- ⏱️ 预估学习时长：**1 天**


#### Evidence

- `projects/web-guild/utils/turingSdk/index.ts`
- `projects/h5-guild/utils/turingSdk/index.ts`

---

