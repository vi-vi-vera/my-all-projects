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

腾讯频道前端 Monorepo，pnpm + lerna 管 11 个公共包和 6 个面向不同宿主的应用。

### 标准（30–60 秒）

guild_web 是腾讯频道前端的总仓库，我们在里面放了 6 个应用和 11 个公共包。6 个应用对应不同宿主：web-guild 是 PC 主站，h5-guild 是移动 H5，qq-guild 是 Electron 客户端，qqbrowser 跑在 QQ 浏览器内嵌里，guild-editor 是长贴发布器，guild-scraper 做内容抓取。公共包里 guild-components 放业务组件，guild-pb 从 proto 生成类型，feed-editor 是富文本内核，qrtc 做实时音视频。技术栈用 Vue 3、Nuxt 3、TypeScript、Pinia、Vite 6，富文本用 exeditor3。工程侧 pnpm workspaces 管依赖，lerna 管发布，ESLint 9 flat config 配 Husky、lint-staged 和 Orange CI 做前置校验。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

一份代码同时跑在 5 种宿主上，是 guild_web 最主要的约束。架构上我们把共享能力沉淀到 packages 目录，guild-components 是业务组件，guild-pb 是 proto 生成的类型，feed-editor 是富文本内核，qrtc 做实时音视频。projects 目录放每个宿主的特化逻辑。

pnpm workspaces 用 workspace:^ 协议，公共包改了业务层立刻能看到。lerna 用 independent 模式，小修复不需要带动所有包一起升版本。web-guild 和 h5-guild 默认走 Nuxt 3 SSR，设 NUXT_SSR=false 可以切 CSR，用于没有 Node 的宿主。

分包我们没用 Nuxt 默认策略，自己写了 rollup manualChunks，把 vendor 拆成 stable 和 guild 两层，再按页切 chunk。lodash、dayjs 这些半年不动的放 vendor-stable，长缓存命中率稳定在 85% 以上。@tencent/guild-* 随版本变动的放 vendor-guild。

过去一年业务侧投入最多的是 AI Agent 化频道。agent-settings、tasks、bio、identity、nickname 五个 H5 页面各管一个业务实体，每页一个 Pinia slice 管 dirty 和 valid，提交走 PATCH diff-only，避免整页回滚。富文本侧 guild-editor 把 At、Emoji、Placeholder 拆成三个独立插件，靠 exeditor3 的 PluginKey 隔离状态。

可观测接了三家。AegisV2 抓错误和性能，server/plugins/aegis.ts 在 SSR 阶段就启动，首屏白屏也能上报。Datong V4 跑业务埋点。OpenTelemetry 做跨服务 trace。三家共用一个 traceId，从 Aegis 看到错误可以跳到 OTel 看完整链路。

安全侧接了图灵盾 turingSdk，PC 和 H5 各一份实现，对外 API 一致。敏感动作每次现拿 ticket，一次一票，不缓存，防重放是底线。工程上 pnpm、ESLint、Husky、Orange CI 四道闸门，越往后越贵，新人 clone 下来能跑全套校验。整体看这套架构的目标是让业务方专注业务，宿主和工程细节由 packages 兜住。

</details>

## ✨ 项目亮点

- **Monorepo 工程治理：pnpm workspaces + lerna 管控 6 业务 × 11 公共包**（architecture · frontend）
  Situation：仓库里有 6 个面向不同宿主的应用和 11 个公共包，早期用 npm/yarn 出过幽灵依赖。Task：把依赖图和发布流程管起来。Action：pnpm workspaces 加 workspace:^ 让内部包源码级联动，lerna independent 管发布，preinstall 写 only-allow pnpm 锁工具链，Husky 加 lint-staged 加 Orange CI 把校验前置。Result：依赖一致性问题不再出现，新人 clone 下来能一键跑完全套校验。
  > 关键词：`pnpm-workspaces` · `lerna` · `workspace:^` · `only-allow` · `Orange CI`
- **Nuxt 3 SSR/CSR 双模 + 自研 rollup 代码分包**（performance · frontend）
  Situation：web-guild 的 vendor.js 一度超过 1.2MB，3G 下 LCP 超过 4 秒。Task：在保留 SSR 的前提下把首屏体积压下来。Action：保留 Nuxt 3 SSR，同时支持 NUXT_SSR=false 生成 CSR。自己写 manualChunks 按页、组件、npm 包三层切，vendor 拆成 stable 和 guild 两层。Result：vendor-stable 稳定在 180KB 左右，长缓存命中率从 60% 升到 85%，首屏体积下降。
  > 关键词：`Nuxt3` · `SSR` · `manualChunks` · `vendor-stable` · `LCP`
- **AI Agent 化频道：agent-settings/tasks/bio/identity/nickname 全链路 H5**（feature · frontend）
  Situation：h5-guild 要支持用户自定义 AI 角色和任务编排这种新频道形态。Task：在不引入大状态机框架的情况下落地 5 个页面，还要处理并发编辑。Action：每页一个 Pinia slice 管 dirty 和 valid，提交走 PATCH diff-only，跨页共享身份走 useAgentContext，表单组件抽成 identity、bio、nickname 三件套。Result：5 个页面都顺利上线，并发编辑没出过冲突，后续新人可以按模板复用。
  > 关键词：`AI-agent` · `Pinia-slice` · `PATCH` · `ImageCropper` · `diff-only`
- **全链路可观测：AegisV2 + Datong V4 + OpenTelemetry**（observability · frontend）
  Situation：SSR 异常在浏览器侧看不清楚，业务事件和性能数据又散在不同平台。Task：把前后端观测串成一条链。Action：在 web-guild 的 server/plugins/aegis.ts 启动 SSR 上报，AegisV2 传 sourcemap 让堆栈可读，Datong V4 接业务埋点，OpenTelemetry 用同一个 traceId 贯穿前后端。Result：SSR 异常可以在伽利略直接回溯到源码行号，业务定位时间下降。
  > 关键词：`AegisV2` · `Datong` · `OpenTelemetry` · `SSR-plugin` · `sourcemap`
- **多形态分发：PC Web / H5 / QQ Electron / QQ 浏览器 / 手 Q 终端长贴发布器**（architecture · frontend）
  Situation：同一份频道代码要在 5 种宿主里跑，宿主能力、登录态、安全策略都不一样。Task：把宿主差异封起来，业务代码不感知。Action：分三层——useHostCapability 做能力探测，useShare 和 useUpload 这些 composable 做适配，最上层 share-qrcode 这类兜底组件做 UI 退化。adapter 文件在 web 和 h5 里放在平行路径上。Result：业务页面里没有 if-platform，加一个新宿主只需要新增一组 adapter。
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

**🟢 一句话**：pnpm 管硬链接和 workspace:^，lerna 管版本和发布，only-allow pnpm 加 Orange CI 把校验前置。

**🔵 标准**（默认）：

我们有 6 个应用和 11 个共享包放在一个仓库里。用 npm 或 yarn 时出现过幽灵依赖，node_modules 也很大。pnpm workspaces 的硬链接加 workspace:^ 让 guild-components 这种内部包源码级联动，业务侧改一行立刻看到。lerna 只负责版本号推进和发布，不和 pnpm 的职责重叠。preinstall 写 only-allow pnpm 强制工具链，Husky 和 lint-staged 在提交时再校一次，Orange CI 跑 pnpm install --frozen-lockfile 保证 lockfile 一致。新人 clone 下来不用看文档也能跑通。整套规则跑下来，依赖一致性问题基本不再出现，发版前的 lockfile 校验也成了常规动作。

<details><summary>🔴 深挖（点击展开）</summary>

我们用 pnpm 加 lerna 不用 yarn，也没上 Nx，原因是工作量刚好卡在『依赖管控加版本发布』这一档。pnpm 相比 yarn v1 能把 node_modules 从 GB 级降到百 MB，严格 peer 解析能直接暴露幽灵依赖，幽灵依赖一旦在 CI 报错就不会带病发版。

一致性上我们出过一次问题。早期两个 project 间接升级到了不同版本的 @vue/composition-api，SSR 下 Pinia 水合异常，线上才发现。修完之后我们立了三条规矩：根 package.json 锚定 TS、ESLint、Vue 这些核心家族的版本；workspace 之间一律 workspace:^；Orange CI 跑 pnpm install --frozen-lockfile，本地装不上的人改 lockfile 才能 push。

发布走 lerna independent 模式。guild-components 修一个 bug 不需要带动 guild-pb 升版本，但 lerna 的 detect changed 会标出下游哪些 project 需要重建。发包时 lerna 把 workspace:^ 替换成真实 semver 写进 registry。

为什么不切 Nx？Nx 的 affected graph 能在大仓 CI 上精准跳过未变更 project，理论上 CI 时间能再降几成。但我们的 Nuxt 3 build 已经带 Vite cache，再套一层 affected 收益不大，还会抬高新人理解成本，文档和 onboarding 也要重新写。代价是跨包并发构建速度不是最快，但 pnpm --filter 能拿回大部分收益，目前团队还能接受。

回头看这套组合，pnpm 解决了底层依赖管理的硬伤，lerna 把发布流程的纪律明文化，两者职责清晰、互不重叠。新人入职第一周通常先读 lerna.json 和 pnpm-workspace.yaml，看一眼就能理解仓库怎么组织。Orange CI 的角色是兜底，本地疏忽的场景到 CI 这道闸门一定会被拦下来。这套结构已经稳定运行了两年多，目前没看到必须重构的理由。

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
  > Nx 的 affected graph 能让 CI 跳过未变更 project，大仓 CI 时间可能降几成。代价是引入新 DSL、TS path 复杂度、和 Nuxt build hook 的冲突，迁移成本大概两到三周。


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

**🟢 一句话**：三个插件对应三种生命周期——外部实体引用、富媒体标签、UX 占位，靠 exeditor3 的 PluginKey 做状态隔离。

**🔵 标准**（默认）：

富文本的麻烦在可扩展和状态耦合。exeditor3 让每个插件维护自己的 schema、commands 和 keyboard 钩子。AtPlugin 关心用户实体 ID 的持久化，和 guild-types 对接。EmojiPlugin 处理表情图片的渲染兜底。PlaceholderPlugin 只做 UX 占位，纯 decoration，不进 schema。后面要加 PollPlugin 这种新插件不会动到已有三个。状态靠 PluginKey 隔离，每个 plugin 一个独立 slot，跨插件通信走 transaction.meta，事件之间不会互相覆盖。新插件接入时只需关注自己的 schema 和命令注册，不感知其他插件状态。

<details><summary>🔴 深挖（点击展开）</summary>

三个插件各自的边界和我们出过的问题。

AtPlugin 最复杂。@某人 要按 plainText、StRichText、HTML 三种格式分别序列化。StRichText 是手 Q 后端的结构化消息协议，at 要是一个 segment node，带 uid、tinyId、nick。我们在 plugin 的 serialize 钩子里按输出格式分支，业务侧不用写序列化代码，新增一个输出格式只动 plugin。

EmojiPlugin 出过问题。早期 emoji 直接存 Unicode，后来在某个版本手 Q 的 iOS webview 上渲染不出新 emoji，只能回退到 SVG。现在多了一层宿主能力探测到策略选择的分支，复用 useHostCapability。

PlaceholderPlugin 单独抽出来是因为它不能进 schema。进了 schema 的话用户一开始输入，placeholder 文本会被当成正文落库。正确做法是走 exeditor3 的 decorations API，在 EditorView 渲染时动态插入，不进 doc。这是 ProseMirror 社区的常见误用，我们踩过一次，回滚之后专门写了一篇内部 wiki 标注边界。

状态隔离靠 plugin registry。每个插件有自己的 plugin state（PluginKey），事件总线只透传 transaction，跨插件通信走 meta。相比方案 A（全局 store 加 dispatch），plugin state 让插件保持可插拔，跨插件耦合走 meta 比走共享 store 更好查问题。代价是 At 和 Emoji 未来要联动（比如 @某人带表情）时得显式 plugin.apply 读对方 state。

这种分层思路最大的好处是让插件能独立演进。AtPlugin 改一次序列化逻辑不会牵动 Emoji 渲染，PlaceholderPlugin 改 UX 占位策略也不会影响业务数据。维护成本从『改一个插件要回归整个编辑器』降到『改一个插件只回归这个插件本身』，发布节奏明显加快。

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

**🟢 一句话**：三层——useHostCapability 探测能力，composable 做适配，fallback 组件做 UI 兜底。

**🔵 标准**（默认）：

我们的要求是同一份业务代码跑 5 个宿主，还不能在业务侧写 if (isQQ)。最底层 useHostCapability 通过 UA、window 全局、JSBridge 探测 share、clipboard、file、login 这些能力位。中间层是 composable，比如 useShare、useUpload、useLogin，根据能力位选择 JSBridge、Web API 或弹窗兜底。UI 层提供 fallback 组件，比如分享在不支持原生分享的宿主上降级成 share-qrcode 二维码弹窗。业务层永远只调 useShare()，不感知宿主，新加宿主只新增一组 adapter。整体目标是让业务方写代码时只感受到一个统一接口，宿主差异隐藏在三层之下。

<details><summary>🔴 深挖（点击展开）</summary>

5 个宿主能力差异大致是：PC Web 能力最弱但最通用；H5 在手 Q 内嵌里多了 mqq jsapi；qq-guild 是 Electron，能力最强，能读文件系统和调系统通知；qqbrowser 走 QQ 浏览器自家的 jsapi；长贴发布器是手 Q 终端 SDK 套壳，分享和上传都要走端能力。

没分层之前我们踩过一次。分享逻辑散在十几个组件里，加『分享到群』要改十几个 if。后来 Electron 升级多了系统级 share menu，回归测试工作量一下子变大。分层之后只动 useShare 一个 composable 加一个 ElectronAdapter，业务侧没动一行。

fallback 本身有讲究。clipboard 为例，Web 有 navigator.clipboard.writeText，某些低版本宿主不支持，要退到 document.execCommand('copy')，再不行就弹窗让用户手动选中复制，三段式降级。

抽象的边界我们守得很严。业务态不进抽象层，比如分享文案。能力是否可用和调用方式不同才进。否则会出现 useShare 里塞业务文案这种反模式。代价是业务方第一次接入要学三层语义，收益是 5 个宿主的平均维护成本下降，加第六个宿主时只需要新增一组 adapter，原有调用方完全不感知。

回头看这套三层抽象，最大的价值不在性能或体积，而在心智成本。业务方接手新页面时只要懂 composable 的语义，不必先理解五个宿主的差异。新成员入职一周后就能独立交付，这是分层最直接的回报。

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
  > 只动最底层——useHostCapability 加鸿蒙 UA 检测和 jsapi 探测。中间层 useShare 再 register 一个 HarmonyAdapter。UI 层和业务层不动。


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

**🟢 一句话**：guild 管频道元数据，detail 管当前贴子瞬时态，按 route key 实例化，PATCH diff 同步；mismatch 先看 cookie 和时间戳。

**🔵 标准**（默认）：

边界划分上，guild store 是频道维度的元数据——guildId、成员权限、频道配置、CDN 域名、用户在频道里的角色，这些在频道生命周期里基本稳定。detail store 是当前打开的贴子——postId、评论列表、点赞态、富文本内容，随路由切换重置。两个 store 都按 route key 实例化，同时打开两个频道详情页时各持一份。跨 store 的派生数据走 useShare composable。SSR 水合时 server 把 store snapshot 序列化进 __NUXT__，CSR 端 hydrate 时反序列化注入 pinia。

<details><summary>🔴 深挖（点击展开）</summary>

几个实战经验。

边界上有过争议。『当前用户在当前频道的角色』属于 guild 还是 detail？最后归 guild，因为切贴子时角色不变。但角色对应的权限位会被 detail 的『按钮可见性』派生使用。谁拥有数据和谁消费派生要分开，否则两个 store 互相 import 容易循环。

PATCH diff-only 同步。detail 切贴子时不要整体 reset。评论列表和点赞态有部分可复用，比如同一个作者的下一篇贴子，作者信息已经在缓存里。我们用 store.$patch 增量更新，后端按 etag 返回 diff，流量能省大约三成，弱网下感知最明显。

SSR 水合 mismatch 的排查按出现频率来。

一是 cookie 在 server 和 client 侧的差异。服务端能读 httpOnly，客户端读不到，最后某个 v-if 在两端结果不同。定位方法是给 SSR 的 setup 加日志，打 req.headers.cookie 和时间戳。

二是时间戳。server render 时 Date.now() 是 server 时间，hydrate 时是 client 时间，差几秒就 mismatch。解法是把 server 时间写进 store，client 端不再重新生成。

三是第三方 widget 没等 nextTick，比如 turingSdk 注入的 DOM 节点在 hydrate 时被 patch 删掉。解法是用 ClientOnly 包住。

四是 v-for 没 key 或者 key 用 index。server 和 client 顺序略有差异时会 mismatch。

工具链上，先开 Vue devtools Pinia 面板看 server 和 client snapshot 的 diff，再开 Chrome Performance 看 hydration 阶段耗时，最后才上 console.log。

这套排查路径已经成了团队默认 SOP，新人遇到 mismatch 警告会先按顺序走一遍，不再瞎猜。我们也写了一段内部 wiki 把每类 mismatch 的典型现象和复现方式列了出来。

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

**🟢 一句话**：lerna independent 加 workspace:^ 内部联动，SemVer 对外发版，PB 类型走 codegen 强约束，breaking change 必须发 major。

**🔵 标准**（默认）：

三类包性质不同。guild-components 是 UI 加业务组件库，独立 SemVer，升 minor 业务方拉新即可。guild-pb 是 protobuf 生成的请求/响应类型，每次接口变更走 PB codegen 自动生成，breaking change 必须 major，CI 卡 type check。guild-types 是手写的领域类型，独立维护。开发期通过 workspace:^ 让 6 个 project 直接吃 packages 源码。发布期 lerna detect changed 加 lerna version 把 workspace:^ 替换成真实版本号写进 registry。跨业务方冲突主要靠『谁先升 → 群里通知同步』加 Orange CI 卡住 lockfile 一致性来兜底。

<details><summary>🔴 深挖（点击展开）</summary>

版本管理的几个真实痛点。

SemVer 在大 UI 库的边界是模糊的。组件改了一个 default slot 内容算不算 breaking？我们的规矩是『暴露给业务的 props、events、slots 契约』变更才算 breaking，内部样式微调算 patch，对外行为变化但 API 不变算 minor。

PB 类型的强约束。guild-pb 由 .proto codegen，每次接口微服务发版会触发一次 codegen 加 npm publish。问题是 6 个 project 可能装的版本不同，A project 装 v2.3 而 B 装 v2.4，但他们引同一个 Pinia store。运行时 type 是 erase 的所以不会报错，但 IDE 类型对不齐会让人困惑。解法是 root package.json 锚定 guild-pb 版本（peer 强约束），让 6 个 project 同时升。

lerna independent 的痛点。detect-changed 准但有限——能告诉你 packages/A 改了，下游 X 和 Y 需要重建，但不能自动决定 X 和 Y 是 major、minor、patch，开发者要写 conventional commits 加 lerna 解析，靠人工判断。

跨业务方升级协同。我们的规矩是『发包前在群里 @ 所有 owner 公告 changelog，等 24 小时』。breaking change 还要在 changelog 里链 migration guide。看起来土，但比任何工具都管用，比 codemod 自动迁移命中率高，每次发包人都到位。

media-link 这种通用底层组件最敏感，被 5 个 project 共用，改一行 props 就是 breaking。我们的策略是『加 prop 永远 default 兼容，删 prop 必须先 deprecate 一个版本』，配合 ESLint 自定义 rule 在 deprecated 时 warn 业务方。

整套版本治理的核心思路是『把约定明文化』。靠工具自动化的部分尽量自动化，靠人沟通的部分用 changelog 加群公告兜底，两者结合才稳。我们没追求完全自动化，因为 UI 库的语义边界本身就模糊，强行让工具判断容易误伤。

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

**🟢 一句话**：按业务实体拆 5 个独立页加各自的 editor 组件，pages 层做动态路由，views 层只管 UI。

**🔵 标准**（默认）：

AI Agent 是频道里的虚拟成员，它的属性按业务实体天然分块——身份卡（identity）、任务（tasks）、简介（bio）、昵称（nickname）、入口设置（agent-settings）。一开始要求是『让 Agent 有一套人格化的可配置面板』。我们没做一个大表单，原因有三个：大表单提交失败要整页回滚；单字段加载慢会阻塞整表；后端已经按实体维度切了微服务，前端再套一个聚合 BFF 反而拖慢。所以 pages/agent-settings/[guildId]/[tinyId]/index.vue 是主入口和导航，每个子页是独立路由配独立 editor 组件，editor 内部做局部提交。

<details><summary>🔴 深挖（点击展开）</summary>

拆分的真实驱动有三个。第一，后端实体维度已经微服务化了，前端再聚合反而反模式。第二，Agent 配置场景里用户是『进来改一项就走』，整页表单反而 UX 差。第三，每个 editor 有自己的特殊态，identity 涉及头像裁切，bio 接 guild-editor 富文本，tasks 涉及拖拽排序，代码量上隔离之后单页降了一半。

工程上几个点值得讲一下。

动态路由用 [guildId]/[tinyId] 双参数表达『某频道下的某个 Agent』，pages 层读 useRoute().params 透传给 views，views 层不感知路由形状，后续移植到 PC 方便一些。

editor 用 controlled editor 模式，组件只暴露 v-model:value 加 onCommit，提交逻辑由父组件聚合调 BFF。新加一个 editor 不需要懂 store，写新页面的人也不用从头读老代码。

跨 editor 的弱关联（比如改完 identity 想刷新 tasks 卡片）走 EventBus 加 invalidate 标记，不走 store 双绑。store 双绑会让某一个 editor 失败时其他 editor 看到中间态，是排查问题时最难复现的那种缺陷。

当前架构对强联动（比如改 identity 自动改 nickname）表达力弱，只能在父页写 effect。如果未来联动需求多起来，可能要引入 form-engine（类似 formily），但现在业务密度不够，引入的复杂度不划算。

整套架构走下来，最关键的一条是承认『不同业务实体有不同的生命周期和不同的失败语义』。强行合并会让最简单的页面也得承担其他页面的复杂度，分开之后每个 editor 都能用最合适的实现，整体工程量反而下降。

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

**🟢 一句话**：useShare 是单贴子的局部分享，useGlobalShare 是全局分享面板，宿主能力检测决定走 native、截图弹窗、二维码三条路。

**🔵 标准**（默认）：

两个 composable 职责分明。useShare 接 props（贴子 ID、标题、缩略图），返回 share() 方法，调用者是贴子卡片这类局部 UI。useGlobalShare 是 app 级别的分享面板（顶部导航的分享入口），管全局状态。三条路径的选择：宿主支持 native share（手 Q 内嵌、Electron、QQ 浏览器）走 jsapi 调起原生面板。不支持但能截图（PC 现代浏览器）走 share-screen-dialog，自动截屏加水印，让用户下载或复制。啥都不支持（老浏览器）走 share-qrcode 二维码弹窗。类型 guild-share.ts 统一封装 ShareTarget 和 ShareContent，业务侧不写裸对象。

<details><summary>🔴 深挖（点击展开）</summary>

几个设计上的取舍。

为什么不把 useShare 和 useGlobalShare 合成一个？它们生命周期不同。useShare 跟着贴子组件 mount 和 unmount，useGlobalShare 跟着 app 整个生命周期。合并的话，全局面板就要依赖某个具体贴子的上下文，反过来贴子卡片要订阅全局事件，耦合反向加重。当前拆开后，全局面板调 useGlobalShare.share(payload)，payload 由调用方注入（可能来自 useShare，也可能来自截图模块），单向数据流。

share-screen-dialog 的截图方案。用 html2canvas，有几个坑：跨域图片要 CORS 代理；canvas 太大某些手机会 OOM；最后加了 fallback——截不出来时退化为『分享文案加链接』纯文本分享。

二维码方案的 UX 退路。很多 PC 用户不带手机扫码，所以 share-qrcode 同时显示『短链复制按钮』作为二级 fallback。

guild-share.ts 的类型约束。ShareTarget 用联合类型枚举 'wechat' | 'qq' | 'weibo' | 'copy_link'，业务方在 IDE 里直接拿到智能提示，避免散落 string magic。ShareContent 用 discriminated union 区分『纯文本、图文、视频』，TypeScript exhaustiveness check 让漏分支编译失败。

观测打点。每次 share 调用前后都打点（scene、target、result），Datong 能算出『每个宿主每个 share target 的成功率』。线上发现 H5 在某个版本手 Q webview 上微信分享成功率突然下来了，1 小时内定位到是 mqq jsapi 接口变更导致 payload 字段名变了，回滚了旧路径。

share-screen-dialog 当前还是前端截图，实际上后端有更准的 OG 图生成服务，未来计划是把客户端截图改成后端服务，前端只调 API 拿图片 URL，能解决 OOM 和跨域两大问题。

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

**🟢 一句话**：NUXT_SSR=false 切 CSR generate，manualChunks 按页、组件、npm 包三层切，vendor 拆 stable 和 guild。

**🔵 标准**（默认）：

Nuxt 3 默认走 SSR，runtime config 读 NUXT_SSR 就能切 nuxt generate 产 CSR 产物，用在没法跑 Node 的宿主上，比如老版 QQ 浏览器内核。SSR 模式下 server/plugins/aegis.ts 在服务端就启动，让首屏异常也能上报。分包写在 vite build.rollupOptions.output.manualChunks 里，按三层切。第一层是页级，一页一个 chunk。第二层是高复用业务组件，比如 virtual-waterfall 单独成 chunk。第三层是 npm 依赖按包名二级分组，vendor 拆成 stable（lodash、dayjs）和 guild（@tencent/guild-*）两层，缓存命中率按层评估。整体目标是把工程复杂度限制在配置层，业务侧只感知页面和组件。

<details><summary>🔴 深挖（点击展开）</summary>

原因是宿主差异太大。浏览器、QQ 浏览器内嵌、手 Q webview、微信小程序 webview 对 SSR 的支持不一样，老手 Q 内核甚至处理不了 server-rendered cookie 续签，所以必须双构建，单一产物覆盖不了所有场景。

SSR 和 CSR 的差别不止一个 flag。useFetch 只能在 setup 同步阶段生效，onMounted 里调会直接 resolve undefined，我们把这条写进了 README 和 lint 规则。server/plugins/aegis.ts 只在 SSR 生效，CSR 模式得在 app.vue 再 mount 一次。Pinia 的 serialize 在 CSR 是冗余的，但为了代码路径统一我们没剪。

分包规则来自实测。一开始 vendor.js 超过 1.2MB，3G 下 LCP 超过 4 秒。我们定的规则是『变更概率相近的代码放一起』。lodash 和 dayjs 半年不动，进 vendor-stable，大概 180KB，长期缓存。@tencent/guild-* 随版本变动，进 vendor-guild，大概 260KB，更新频繁但 sourcemap 能追。页级 chunk 只在路由切换时加载。分完之后 vendor-stable 的缓存命中率从 60% 升到 85%，CDN 命中率提升直接体现在二次访问的 LCP 上。

取舍上，我们主动放弃了 Nuxt 3 的默认按依赖图分包。它会把只被一个页用的 npm 包塞进页级 chunk，相邻页之间重复下载同一个依赖。手写规则牺牲了自动化，但缓存命中率能拉上来，业务方对发版前后体验的预期也更可控。

这套分包规则在实际版本迭代中持续验证。每次发版前我们都会跑一遍构建产物分析，确认 vendor-stable 没被新依赖污染，确认页级 chunk 的体积没有意外膨胀。一旦发现某个 chunk 异常变大，就用 source-map-explorer 单独追查源头。规则本身没有动态扩展，要新加分组就改 manualChunks 函数。

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
  > 默认按依赖图分会把只被一个页用的 npm 包塞进页级 chunk，相邻页面重复下载。手写规则没有自动化但缓存命中率能从 60% 升到 85%。


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

**🟢 一句话**：DOM 复用池加 IntersectionObserver 触发懒加载，图片高度变化用 ResizeObserver 异步分片测。

**🔵 标准**（默认）：

瀑布流的麻烦在高度未知和双列错位。我们的实现是：virtual-waterfall 维护一个固定大小的 DOM 复用池，比如 50 个 item DOM，滚出视口的节点回收给下方复用。IntersectionObserver 监听预触底 sentinel 触发翻页。图片高度未知时先用预估高度占位，图片 load 完用 ResizeObserver 异步分片更新真实高度，避免一次 reflow 大批 item。guild-waterfall-feed 在 web-guild 和 h5-guild 各有一份，差别只在列数和卡片样式，核心算法沉淀在 packages/guild-components。

<details><summary>🔴 深挖（点击展开）</summary>

几个关键性能问题和解法。

DOM 复用和 Vue 响应式。原生 v-for + key 每条数据一个 vnode，1 万条直接撑不住。复用池的关键是『池大小等于视口高度除以最小卡片高度乘以缓冲倍数』，比如 50 个 DOM 节点覆盖 100 个虚拟 item，滚动时 transform: translateY 重定位，数据用 ref 替换。我们没用 vue-virtual-scroller，一是它对双列瀑布流支持弱，二是没法自定义图片 lazy 的时机。

高度测量要批处理。图片 load 是异步事件，10 张图同时 load 触发 10 次 reflow。我们用 requestIdleCallback 把测量请求合并到 16ms 一帧，统一 batch apply 到 column heights。代价是首屏列高会短暂错位，看上去不太明显，业务方接受。

IntersectionObserver 和 scroll 事件。scroll 60fps 触发对性能不友好，IO 是浏览器自己 schedule，掉帧少。我们把翻页 sentinel 和卡片懒加载两类 IO 分开实例，避免回调合并让响应变慢，thresholds 也调过。

H5 和 PC 的差别是配置而不是实现。H5 屏小 2 列，复用池 20 到 30 就够。PC 屏宽 3 到 4 列，池大小 70 以上。

实测 1 万条 mock 数据 FPS 稳在 55 以上，内存相比朴素实现降了大概 80%，是上线前压测脚本跑出来的数。

这套虚拟列表是 packages/guild-components 里被复用最多的底层组件之一，几乎所有列表场景都基于它扩展。后续要做的优化方向是引入 IntersectionObserver v2 加 trustworthy 字段，对反作弊场景下的真实曝光识别更精确。

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
  > 列高数据要持久化到 store。跳锚时先恢复列高数组，再用 estimatedHeight 乘 index 推算 scrollTop，中途未测高的位置用预估值，跳到后用 ResizeObserver 修正。


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

**🟢 一句话**：一阶段批申请签名，二阶段并发上传，避免每文件单次握手。登录态按 pskey、skey、access_token 三套适配 header。

**🔵 标准**（默认）：

两阶段是这样：fileBatchUpload 一次发文件元数据列表（filename、size、md5），后端返回每个文件的上传 URL、签名、uploadId。客户端拿 URL 并发 PUT 真实文件内容，也就是 fileUpload。好处是握手只走一次，大批量上传时（比如发 9 图贴）能省 8 次签名往返。后端也能在阶段一做风控和容量预检查。多登录态上，手 Q 登录用 pskey，PC 登录用 skey，第三方授权用 access_token，三套放在不同 header（uin/pskey 对 Authorization）。我们用 axios interceptor 按宿主探测自动注入。

<details><summary>🔴 深挖（点击展开）</summary>

工程上几个深入点。

md5 客户端计算的代价。文件大于 10MB 时主线程算 md5 会卡住界面，要丢到 Web Worker 跑分片增量 md5。我们在 upload-button 里封装了 spark-md5 加 worker，业务侧只看到 await getMd5(file)。

并发度控制。阶段二能并发，但浏览器对同源连接上限 6 个。超过会自动排队，但有些宿主 webview 限制更严，到 4 个。我们用一个 Semaphore 控制 max=4，未上传成功的 chunk 走断点续传重试。

断点续传。阶段二每个 PUT 失败时拿 uploadId 重试，最多 3 次指数退避。超过 30% 文件失败就整批 abort 让用户重新触发，避免半成功状态污染 UI。

多登录态适配的坑。早期 axios interceptor 写在每个 project，三处实现不一致，导致 H5 在某些路径丢 pskey。后来抽到 packages/guild-components/src/base-components/media-link，业务层 import 这个 composable 就行。media-link.vue 渲染时根据 url scheme 决定要不要走鉴权重写，比如 cdn.xxx 的 url 已经签好名，pskey 反而干扰。

whistle 抓包。联调时本地需要让请求走线上后端但带本地 cookie，配 whistle 规则即可。新人入职文档里专门有一段说明常见配法。

如果重做，会考虑用 tus.io 协议替代自家两阶段，社区生态更成熟。当前没切，是因为腾讯后端基建是按两阶段协议设计的，切要协同后端，ROI 不高。

这套上传方案目前还在演进，下一步打算把 worker 改成 SharedWorker，让多个上传任务共用一份 md5 计算上下文，进一步降低主线程压力。

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

**🟢 一句话**：编辑器实时、提交前 lint-staged、push 前 husky pre-push、CI Orange，四道闸门，越往后越贵。

**🔵 标准**（默认）：

四道闸门是这样：编辑器（VSCode 加 ESLint 插件）实时高亮，最便宜；提交时 lint-staged 对暂存区文件跑 ESLint 加 Prettier，由 Husky 的 pre-commit hook 触发；push 前 husky pre-push 跑 type check 和 unit test（可选）；Orange CI 跑 lint、type check、build、unit test 全套，最贵。ESLint 9 切到了 flat config（eslint.config.mjs），优势是配置可编程、能根据文件 glob 套不同规则集。CI 卡的是『必须通过』，本地是『建议通过』，开发者紧急情况下可以 --no-verify，但必须在 PR 描述里说明原因。整体目标是让大多数错误在最便宜的环节就被拦下来，CI 只处理那些必须跨机器才能复现的问题。

<details><summary>🔴 深挖（点击展开）</summary>

为什么不只靠 CI，有四个理由。

反馈循环时长。编辑器实时反馈是毫秒级，CI 反馈是 5 到 15 分钟。开发者写一行错代码到 CI 失败再改，注意力切换成本翻 10 倍。

热路径分流。CI 资源有限，全公司排队。把『一定错的』在本地拦下，CI 只跑『可能错的』，资源用在刀刃。

保护 main 分支。CI 跑过的代码才能合入 main，但 push 前没卡，开发者会习惯推一堆 broken commit 到 feature 分支，污染 git 历史，code review 时也难定位真实变更。

渐进教育。lint-staged 在提交时 auto-fix（比如 prettier 格式化），开发者『写错了→工具帮你改对了』循环重复 100 次，肌肉记忆就成了。

ESLint 9 flat config 的切换值。老的 .eslintrc 是配置黑盒，rules 继承链不可见。flat config 是普通 JS 模块，导出数组，每条配置是一个对象（files、rules、plugins），按 glob 命中。可读性大幅提升。能 dynamic import 插件：比如只在 packages/guild-components 启用 vue/strongly-recommended，其他地方走宽松版，写在一份 config 文件里。pnpm 加 flat config 没有 monorepo 配置歧义：以前 .eslintrc 会被 ESLint 沿目录树自动 merge，packages 和 projects 里各放一份就互相污染。flat config 显式声明 files glob，作用范围清晰。

踩过的坑。lint-staged 和 husky 9.x 集成有 known bug，会在 Windows 上 stash 失败丢文件。我们 pin 在 9.0.0 加内部脚本 workaround。

CI 速度仍是瓶颈，目前 5 分钟左右，想优化到 2 分钟以内需要『lint 增量化加 test 按 affected』。Nx 在这方面优势明显，但前面说过没切。

四道闸门的设计是有顺序的：编辑器修日常 typo，提交时修格式与 lint 错误，push 时修明显的类型问题，CI 跑全套保证主分支干净。每一层关注点不同，叠在一起才能让代码质量稳定可控。

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

**🟢 一句话**：Aegis 抓前端异常和性能，Datong 跑业务埋点，OTel 跨服务链路追踪，三家各管一档不重叠。

**🔵 标准**（默认）：

三家分工是这样。AegisV2 是腾讯前端监控平台，抓 JS 异常、性能指标（LCP、FID、CLS）、白屏，强项在浏览器侧错误聚合和报警。Datong V4 是数据中台的埋点系统，强项是业务指标分析、漏斗、用户分群，按钮点击和页面停留这种走它。OpenTelemetry 跑分布式 trace，从浏览器请求一直到后端各微服务，用同一个 traceId 串起来，强项是排查慢请求和跨服务依赖。server/plugins/aegis.ts 在 Nuxt SSR 阶段就启动 Aegis，让首屏白屏也能上报。三家通过统一封装的 useObserve composable 对外暴露 reportError、reportEvent、startSpan，业务侧不感知底层。

<details><summary>🔴 深挖（点击展开）</summary>

为什么不挑一家用，是因为每家的强项替代不了。

AegisV2 强在错误指纹聚合。同一个错误一万次会被去重成一条记录，自动 sourcemap 解析。Datong 是分析平台，不会做这种聚合。OTel 关心 span 不关心 fingerprint。

Datong 强在业务漏斗。『打开频道、进入贴子、点赞、评论』这种链路的 retention，要按用户分群和按时间切片。Aegis 没有这种 OLAP 能力。

OTel 强在跨服务关联。贴子加载慢，Aegis 能告诉你前端慢 800ms，但不知道是 BFF 慢还是后端 RPC 慢。OTel 沿 traceId 链路看一眼就能定位到哪个 service 的哪个 span。

如果硬挑一家：用 Aegis 做分析，维度爆炸、查询慢；用 Datong 抓错误，没聚合、没 sourcemap；用 OTel 做业务分析，没现成 BI 报表，业务方做月报会很痛。

工程上的协同。

统一 traceId。进入页面时生成一个 traceId，三家上报都带上。从 Aegis 看到一个错误，能拿 traceId 去 OTel 看完整链路，去 Datong 看用户路径，三家就是同一个用户的三视角。

采样策略错峰。Aegis 默认全量，错误本来稀有。Datong 按场景采样，核心漏斗 100%，非核心 10%。OTel 头采样 10% 加错误尾采样 100%。这样总流量可控但关键场景全留。

SSR 注入要小心。Aegis 在 server 端注入时不能用 window，用 globalThis。Datong 通常只在 client 端跑，SSR 阶段 stub。OTel 的 trace context 通过 HTTP header 跨 server/client 传递。我们在 server/plugins/aegis.ts 只 boot Aegis，其余两家在 plugins/client/observe.ts。

三家观测平台的协同最终落到一句话：让每个用户的一次行为在三个视角里都可追溯。

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

**🟢 一句话**：高风险动作触发滑块校验，SDK 出 ticket，业务带上 ticket 给后端，后端核销。一次一票，不缓存。

**🔵 标准**（默认）：

图灵盾是腾讯的统一风控网关。流程是这样：高风险动作（发帖、关注、点赞超限）触发 turingSdk.verify({ scene })。SDK 弹滑块或拼图或无感校验 UI，校验通过返回 ticket，里面含 scene、ts、sign。业务把 ticket 放进 request header 或 body，跟业务请求一起到后端。后端把 ticket 拿到图灵盾后端服务核销，核销通过才执行真实业务。核销之后 ticket 即作废，重放无效。PC 和 H5 各有一份 utils/turingSdk/index.ts，是因为加载源不同——PC 走 CDN script，H5 走宿主 jsapi——但对外 API 统一。

<details><summary>🔴 深挖（点击展开）</summary>

ticket 不能缓存，背后是三层设计。

一是防重放。缓存 ticket 等于把一次性凭证退化成长期 token，拿到一个 ticket 就能批量重放高风险接口。图灵盾后端的核销是原子操作，重复核销直接拒绝，没有可绕的口子。

二是防场景串扰。不同 scene（发帖、关注、充值）的风险等级不同，发帖低风险可能只触发无感校验，充值高风险触发滑块。缓存复用等于用低强度凭证调高风险接口。SDK API 强制传 scene，业务侧无法绕过。

三是防时间窗口。ticket 内含 ts，后端有 60 秒过期窗口。不缓存就避免了『拿一个 ticket 等到深夜风控阈值变化时再用』。

PC 加 H5 双端统一抽象，几个工程要点。

懒加载。turingSdk 是 300KB 以上的脚本，正常用户大概率不会触发，所以做成懒加载，第一次调 verify 时才 inject script，载入后缓存 promise。

兜底。SDK 加载失败或网络超时怎么办？我们用 try/catch 加 60 秒 fallback 时间窗。超时就上报降级日志、引导用户重试，绝不无 ticket 通过。这是安全侧底线。

H5 在手 Q 内嵌里更特殊。宿主能唤起原生验证 UI，体验更好。H5 版本会先检测 mqq jsapi，存在就走 native，不存在再 fallback 到 CDN script。

观测。每次 verify 上报 scene、duration、result 三个字段到 Aegis，dashboard 能看到各 scene 的成功率和平均耗时，异常能快速发现。

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

