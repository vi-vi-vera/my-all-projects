# 腾讯频道 Web 平台 (guild_web) — Interview Preparation

> Mode: candidate · Role: 前端工程师（Vue 3 + Nuxt + Monorepo 方向） · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 3      | 🧩 |
| architecture  | 6 | 🏗️ |
| performance   | 2  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 2 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

Tencent Guild frontend monorepo: pnpm + lerna over 11 shared packages × 6 apps spanning Web, Mobile QQ, QQ Browser, H5 and the long-post editor.

### Standard (30–60 seconds)

guild_web is the unified frontend repo for Tencent Guild, hosting 6 host-targeted apps (web-guild for PC, h5-guild for mobile, qq-guild Electron, qqbrowser, guild-editor for long-post, guild-scraper) and 11 shared packages (guild-components, guild-pb, feed-editor, qrtc, guild-mui, etc.). The stack is Vue 3 + Nuxt 3 + TypeScript + Pinia + Vite 6 + exeditor3. Engineering relies on pnpm workspaces for deps, lerna for releases, ESLint 9 flat config + Husky/lint-staged + Orange CI for pre-commit quality gates, AegisV2 + Datong V4 + OpenTelemetry for unified observability, and turingSdk for human-check risk control.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

The core thesis of guild_web is 'one codebase, five host shapes'. Architecturally packages/ holds shared capability (guild-components business widgets, guild-pb protocol, feed-editor rich text, qrtc realtime media) while projects/ implement host specialization. pnpm workspaces' workspace:^ protocol keeps shared packages live-updating downstream; lerna's independent mode avoids cascading bumps for small fixes. web-guild and h5-guild ship Nuxt 3 SSR by default and can flip to CSR via NUXT_SSR=false for hosts without Node; an in-house rollup manualChunks splits vendor into stable/guild tiers plus per-page chunks to keep first-paint payload bounded. The largest business investment in the past year is AI-agent-style channels: agent-settings/tasks/bio/identity/nickname pages use Pinia slices for data modeling and PATCH-style diff-only writes to avoid clobber. Observability mounts aegis SSR-side via server/plugins/aegis.ts, Datong V4 reports business events, OpenTelemetry threads end-to-end. Security-wise turingSdk has separate PC/H5 SDKs adapting to host interaction differences, and tickets are fetched per-action without caching to prevent replay. The repo gates quality at the commit boundary through pnpm + ESLint + Husky + Orange CI so contributors can validate everything locally on first clone.

</details>

## ✨ Highlights

- **Monorepo 工程治理：pnpm workspaces + lerna 管控 6 业务 × 11 公共包** (architecture · frontend)
  Situation: the repo hosts 6 host-targeted apps and 11 shared packages; legacy npm/yarn produced phantom dependencies. Task: build a controllable dep graph and release flow. Action: pnpm workspaces with workspace:^ for live-linked internal packages, lerna independent mode for releases, only-allow pnpm + Husky/lint-staged + Orange CI to push validation to commit time. Result: dependency drift eliminated; first-time contributors get the whole gate working from clone.
  > Keywords: `pnpm-workspaces` · `lerna` · `workspace:^` · `only-allow` · `Orange CI`
- **Nuxt 3 SSR/CSR 双模 + 自研 rollup 代码分包** (performance · frontend)
  Situation: web-guild's vendor.js peaked over 1.2MB; 3G LCP exceeded 4s. Task: shrink first-paint without giving up SSR. Action: keep Nuxt 3 SSR, expose NUXT_SSR=false for CSR builds; in-house rollup manualChunks slices along page/component/npm-package, splitting vendor into stable and guild tiers. Result: vendor-stable ~180KB caches long-term, cache hit rate rose from 60% to 85%+, first-paint payload dropped noticeably.
  > Keywords: `Nuxt3` · `SSR` · `manualChunks` · `vendor-stable` · `LCP`
- **AI Agent 化频道：agent-settings/tasks/bio/identity/nickname 全链路 H5** (feature · frontend)
  Situation: h5-guild needed to deliver a new AI-agent channel surface with custom personas and tasks. Task: ship 5 complex form pages and handle concurrent edits without a heavy state-machine framework. Action: one Pinia slice per page tracking dirty/valid, PATCH-style diff-only writes, useAgentContext sharing identity across pages; form widgets unified into identity/bio/nickname editors. Result: all 5 pages launched with zero concurrent-edit conflicts; juniors clone-and-extend the template easily.
  > Keywords: `AI-agent` · `Pinia-slice` · `PATCH` · `ImageCropper` · `diff-only`
- **全链路可观测：AegisV2 + Datong V4 + OpenTelemetry** (observability · frontend)
  Situation: SSR exceptions can't be diagnosed purely from the browser; business events and perf data scattered across platforms. Task: unify front-and-back observability. Action: web-guild's server/plugins/aegis.ts mounts the SSR-side Aegis reporter, Aegis V2 ships sourcemaps for readable stacks, Datong V4 owns business telemetry, OpenTelemetry propagates trace ids across the stack. Result: SSR exceptions trace back to a source line in Galileo, business diagnosis time drops noticeably.
  > Keywords: `AegisV2` · `Datong` · `OpenTelemetry` · `SSR-plugin` · `sourcemap`
- **多形态分发：PC Web / H5 / QQ Electron / QQ 浏览器 / 手 Q 终端长贴发布器** (architecture · frontend)
  Situation: the same channel code must run on five hosts with divergent capabilities, auth and security policies. Task: encapsulate host differences so business code stays unaware. Action: three layers — useHostCapability probing, useShare/useUpload adapters, fallback widgets like share-qrcode — with adapter files placed at parallel paths in web/h5. Result: zero if-platform in business pages; onboarding a new host only requires adding one adapter set.
  > Keywords: `multi-host` · `JSBridge` · `Electron` · `mini-program-webview` · `useShare`


## 🏗️ Architecture (architecture) — 5 Q&A

### Q1. Why pnpm workspaces + lerna for the monorepo? How do you guarantee dep consistency across 11 shared packages used by 6 apps?

> Source: `tp-01` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| workspace:^ 协议语义 | 必须掌握 | 多包并行研发的底盘机制 |
| lerna independent 模式 | 必须掌握 | 解释发布流程的关键 |
| pnpm vs Nx 比较 | 加分项 | 面试官会追问为什么不选 Nx |
| lockfile 一致性策略 | 加分项 | 体现 CI 依赖一致性的理解 |

#### Tiered answers

**🟢 Elevator**: pnpm handles hardlinks and workspace:^; lerna handles versioning and publish; only-allow pnpm + Orange CI gate validation pre-merge.

**🔵 Standard** (default):

We have 6 apps and 11 shared packages in one repo. npm/yarn cause phantom deps and bloated node_modules. pnpm workspaces' hardlink + workspace:^ protocol keep internal packages like guild-components live-linked. lerna only owns versioning and publish, avoiding overlap with pnpm. only-allow pnpm in preinstall locks the toolchain, Husky + lint-staged re-validate at commit time, Orange CI runs pnpm install --frozen-lockfile to enforce lockfile consistency.

<details><summary>🔴 Deep dive (click to expand)</summary>

Core trade-off: local DX vs release rigor. Vs yarn v1, pnpm cuts node_modules from GB to hundreds of MB and strict peer resolution exposes phantom deps; vs Nx/Rush, our complexity doesn't need a task graph, so minimal loop: pnpm for deps + lerna for releases.

We got bitten once on consistency: two projects transitively pulled different @vue/composition-api versions, breaking SSR Pinia hydration. Rules since: (1) root package.json pins TS/ESLint/Vue families; (2) all internal deps use workspace:^; (3) Orange CI runs pnpm install --frozen-lockfile.

Publishing uses lerna independent mode: small fixes in guild-components don't cascade-bump guild-pb, but detect-changed flags downstream apps for rebuild. At publish time lerna rewrites workspace:^ into real semver in the tarball.

We skipped Nx task-graph caching: Nuxt 3 build already has Vite cache; adding Nx affected-graph yields marginal wins and raises onboarding cost. Cost: we forgo max cross-package parallel build speed, but pnpm --filter recovers ~80% of it.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] pnpm 官方文档 - Workspaces 与 filter 命令 (https://pnpm.io/workspaces)
  - [ ] lerna v5 文档 - independent 模式与 detect changed
  - [ ] pnpm 博客 - Phantom dependencies 深度解析
- 🛠️ Hands-on
  - [ ] 用 pnpm init 在空仓库建 1 package + 1 app，观察 workspace:^ 的 symlink 结构
  - [ ] 把 lerna.json 切到 independent 模式跑一次 lerna version --conventional-commits
- ⚠️ Common pitfalls
  - 没写 preinstall only-allow pnpm，导致别人 npm i 生成第二份 lockfile
  - workspace:^ 在 publish 阶段没被替换，registry tarball 装不起来
  - lerna version 前忘记 frozen-lockfile，发布版本与 lockfile 不一致
- 🤔 Self-check questions (answer without notes)
  - [ ] pnpm 的 hardlink + symlink 怎么解决扁平化的 diamond 依赖冲突？
  - [ ] workspace:^ 在 publish 阶段如何被替换？不替换会怎样？
  - [ ] 为什么不切到 Nx？affected graph 能多带来什么？
- ⏱️ Estimated time: **1 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Would you switch to Nx today? What are the wins and costs?** (trade-off)
  > Nx affected graph could cut CI by 40%+ via skipping untouched projects. Costs: new DSL, complex TS paths, conflicts with Nuxt build hooks; migration ~2-3 weeks of work.


#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`
- `packages/guild-components`
- `packages/guild-pb`

---

### Q2. guild-editor wraps exeditor3 with At/Emoji/Placeholder plugins. Why split them apart? How do you isolate their state?

> Source: `tp-03` · scope: frontend · projects/guild-editor · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| exeditor3 / ProseMirror PluginKey | 必须掌握 | 插件体系的底层 |
| decorations vs schema 区分 | 必须掌握 | placeholder 不能进 doc 的核心经验 |
| StRichText segment 协议 | 加分项 | 体现对手 Q 生态的理解 |
| 多格式 serialize 策略 | 加分项 | 讲清一次渲染多份输出 |

#### Tiered answers

**🟢 Elevator**: Three plugins model external-reference / rich-media-token / UX-placeholder — different lifecycles isolated via exeditor3's plugin registry and PluginKey.

**🔵 Standard** (default):

Rich-text editors' core tension is extensibility vs state coupling. exeditor3 gives every plugin its own schema/commands/keyboard hooks. AtPlugin persists entity IDs (interops with guild-types). EmojiPlugin handles emoji/sticker rendering fallback. PlaceholderPlugin is pure decoration, never entering schema. Adding new plugins like PollPlugin won't touch the existing three. State is isolated via PluginKey; cross-plugin communication rides transaction.meta.

<details><summary>🔴 Deep dive (click to expand)</summary>

Each plugin's boundary with its pitfalls:

(1) AtPlugin is hardest: mentions need three output formats — plainText, StRichText, HTML. StRichText is Mobile QQ's structured-message protocol where @ is a segment node {uid, tinyId, nick}. The plugin's serialize hook branches by output format so business code doesn't leak serialization logic.

(2) EmojiPlugin: early on we stored emoji as raw Unicode; a specific iOS 15 Mobile QQ webview build couldn't render certain code points, forcing SVG fallback. Now a 'host capability → strategy' branch reuses useHostCapability.

(3) PlaceholderPlugin sits apart because it must NOT enter schema — otherwise placeholder text persists once the user types. The right approach is exeditor3's decorations API at EditorView render time, never touching doc. A lesson from common ProseMirror community pitfalls.

State isolation via plugin registry: each plugin owns a state slot via PluginKey; the event bus only carries transactions; cross-plugin messaging rides meta. Vs 'global store + actions', plugin-state keeps plugins pluggable and debugging cross-plugin coupling is easier with meta than a shared store. Cost: combined features like 'mention-with-reaction' must explicitly read each other via plugin.apply.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] ProseMirror Guide - Plugins 与 PluginKey (https://prosemirror.net/docs/guide/)
  - [ ] ProseMirror decorations API reference (https://prosemirror.net/docs/ref/#view.Decoration)
  - [ ] exeditor3 插件开发指南（内网文档）
- 🛠️ Hands-on
  - [ ] 用原生 ProseMirror 写 50 行的 placeholder plugin（仅 decorations 实现）
  - [ ] 给 guild-editor 加最小 PollPlugin，跑通 schema → serialize 链路
- ⚠️ Common pitfalls
  - placeholder 写进 schema 导致保存时落库
  - emoji 用 Unicode 在老宿主渲染空白，需要 SVG fallback
  - @ 插件 serialize 没区分输出格式，后端拿到 HTML 解析失败
- 🤔 Self-check questions (answer without notes)
  - [ ] ProseMirror PluginKey 具体隔离什么状态？
  - [ ] decorations 和 schema 在更新时生命周期差异？
  - [ ] @全体成员 这种特殊 at，plugin 设计要怎么改？
- ⏱️ Estimated time: **2-3 天**


#### Evidence

- `projects/guild-editor/src/components/Editor/index.ts`
- `projects/guild-editor/src/components/Editor/index.vue`
- `projects/guild-editor/src/components/Editor/plugins/placeholder.ts`
- `projects/guild-editor/src/components/Editor/utils/Editor.ts`

---

### Q3. How do you abstract over 5 host runtimes (PC web, H5, QQ Electron, QQ Browser embed, Mobile QQ long-post) with their divergent capabilities?

> Source: `tp-04` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| JSBridge / mqq jsapi 协议 | 必须掌握 | 5 宿主能力探测的入口 |
| Composable 分层设计 | 必须掌握 | 中间层适配的核心模式 |
| 渐进式优雅降级（fallback） | 加分项 | 体现兜底设计意识 |
| Electron 与 webview 的差异 | 加分项 | 讲清能力差异的具体例子 |

#### Tiered answers

**🟢 Elevator**: Three layers bottom-up: useHostCapability for detection, adapter composables for capability, fallback components for UI graceful degradation.

**🔵 Standard** (default):

We need one codebase across five hosts without sprinkling if (isQQ) in business code. Bottom layer useHostCapability probes share/clipboard/file/login bits via UA, window globals and JSBridge. Middle layer is composables (useShare, useUpload, useLogin) that pick implementations (JSBridge / Web API / dialog fallback) based on those bits. UI layer ships fallback components — e.g., share degrades to a share-qrcode dialog on hosts without native share. Business code only calls useShare() with no host awareness.

<details><summary>🔴 Deep dive (click to expand)</summary>

Capability matrix in brief: (1) PC Web is weakest but most universal; (2) H5 inside Mobile QQ webview adds mqq jsapi; (3) qq-guild (Electron) is most capable — direct FS access, system notifications; (4) qqbrowser embed has QQ Browser's own jsapi; (5) the long-post composer runs inside MQQ client SDK so share/upload go through native bridge.

Lesson learned: before layering, share logic lived across a dozen components; adding 'share-to-group' required a dozen ifs, and an Electron upgrade adding system-level share menus exploded regression testing. After layering, only useShare composable and a new ElectronAdapter are touched.

Fallback selection matters: clipboard has navigator.clipboard.writeText on web, fails on older hosts and falls back to document.execCommand('copy'); ultimate fallback is a dialog with a textarea letting the user select-and-copy. Three-tier graceful degradation.

Boundary discipline: 'pure business state' (e.g., share copy text) stays out of the abstraction; only 'is capability available' and 'how to call it' belong. Otherwise you get useShare bloated with business copy as an anti-pattern. Cost: business devs learn three layers on first integration. Reward: average maintenance cost drops across 5 hosts; adding a 6th host (e.g., future Vision Pro) only requires a new Adapter.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Vue 3 Composition API 文档 - Composable 设计模式 (https://vuejs.org/guide/reusability/composables.html)
  - [ ] MDN - Navigator.share / Web Share API 兼容性
  - [ ] Electron 文档 - ipcRenderer 与 contextBridge
- 🛠️ Hands-on
  - [ ] 写一个 useHostCapability composable，覆盖 share/clipboard/upload 三个能力位
  - [ ] 构造一个 H5 fallback 链：navigator.share → wxJsApi → 自绘弹窗
- ⚠️ Common pitfalls
  - 在 composable 里塞业务文案，导致跨宿主时文案需要重写
  - 能力探测时同步读 window.mqq，SSR 阶段直接炸
  - fallback 链太深没埋点，无法量化各层命中率
- 🤔 Self-check questions (answer without notes)
  - [ ] useHostCapability 怎么处理 SSR 下 window 不存在？
  - [ ] 如果业务方就是需要 isElectron 判断，分层抽象会被绕过吗？
  - [ ] JSBridge 调用失败的回退策略怎么设计？
- ⏱️ Estimated time: **2-3 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If you add a HarmonyOS webview as a 6th host, which layer changes?** (architecture)
  > Only the bottom layer: useHostCapability adds Harmony UA detection and jsapi probing; middle layer useShare registers a HarmonyAdapter; UI and business layers stay intact.


#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qq-guild`
- `projects/qqbrowser`
- `projects/guild-editor`

---

### Q4. How are detail.ts and guild.ts Pinia stores partitioned in web-guild? How do you diagnose SSR hydration mismatch?

> Source: `tp-07` · scope: frontend · projects/web-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Pinia store 拆分原则 | 必须掌握 | 回答边界问题的基础 |
| SSR 水合机制 | 必须掌握 | 讲清 mismatch 的前提 |
| PATCH diff-only 同步 | 加分项 | 性能优化的具体手段 |
| ClientOnly / Teleport 用法 | 加分项 | 排查 mismatch 的常见工具 |

#### Tiered answers

**🟢 Elevator**: guild owns channel global metadata, detail owns transient post state; instantiated by route key with PATCH diff sync; hydration mismatch is diagnosed via timestamps and cookie origin.

**🔵 Standard** (default):

Boundary: guild store owns channel-level metadata — guildId, member permissions, channel config, CDN domains, user role — relatively stable across the channel lifetime. detail store owns 'the currently opened post' — postId, comments, like state, rich content — reset on route change. Both are instantiated per route key (two channel-detail tabs each have their own); cross-store derived state flows through useShare composable. On SSR hydration, the server serializes a store snapshot into __NUXT__, CSR deserializes back into pinia.

<details><summary>🔴 Deep dive (click to expand)</summary>

Hard-won lessons:

(1) Boundary disputes: does 'current user's role in current channel' belong in guild or detail? Verdict: guild, because the role doesn't change when navigating posts. However, role-derived 'button visibility' is consumed by detail. 'Who owns data vs who consumes derived' must be strictly separated to avoid circular imports.

(2) PATCH-style diff-only sync: on post switch we don't reset detail wholesale — comments and like state can be partially reused (e.g., next post by same author has cached author info). We use store.$patch for incremental updates, backend returns etag-keyed diffs, saving ~30% bandwidth.

(3) SSR hydration mismatch debug playbook, by frequency:
  - Cookie discrepancy: server reads httpOnly, client can't, login state diverges, a v-if differs across ends. Fix: add console.log on SSR setup + log req.headers.cookie with timestamp;
  - Timestamp: Date.now() differs by seconds between server and client; fix: write server time into store, ban client regeneration;
  - Third-party widgets bypassing nextTick: turingSdk injects DOM that hydrate's patch removes. Fix: wrap with ClientOnly;
  - v-for missing key or using index: minor server/client order differences cause mismatch.

(4) Tooling: Vue devtools Pinia panel → diff server/client snapshot; Chrome Performance → measure hydration cost; console.log last.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Pinia 官方文档 - Modular stores 与 store composition
  - [ ] Nuxt 3 - State management 与 useState hydration 机制
  - [ ] Vue.js 官方 - SSR 水合 mismatch 警告解读
- 🛠️ Hands-on
  - [ ] 用 Pinia 写两个 store 模拟 guild/detail 边界，故意构造一次 mismatch 并用 devtools 抓出
  - [ ] 把 store.$patch 替换成整体 reset，对比 chrome network 流量
- ⚠️ Common pitfalls
  - store 互相 import 形成循环，build 时表面正常运行时报 undefined
  - 用 Date.now() 作为 v-if 条件，必 hydration mismatch
  - 把 token 等敏感数据存进 client 可读 store，泄漏风险
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果让你新增一个 comment store，边界放哪里？为什么？
  - [ ] 服务端只有 detail 数据，客户端 hydrate 时怎么避免重复请求？
  - [ ] Pinia 的 storeToRefs 在 SSR 下需要注意什么？
- ⏱️ Estimated time: **2 天**


#### Evidence

- `projects/web-guild/store/detail.ts`
- `projects/web-guild/store/guild.ts`
- `projects/web-guild/composables/useShare.ts`

---

### Q5. How are guild-components / guild-pb / guild-types shared packages versioned and published? How do you avoid cross-app upgrade conflicts?

> Source: `tp-11` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| SemVer 在 UI 库中的边界判定 | 必须掌握 | 回答 breaking 定义的关键 |
| PB codegen 类型生成链路 | 必须掌握 | 解释强约束的来源 |
| lerna detect-changed 机制 | 加分项 | 工具链细节 |
| deprecate-then-remove 策略 | 加分项 | 工程纪律的体现 |

#### Tiered answers

**🟢 Elevator**: lerna independent + workspace:^ internally, SemVer externally; PB types via codegen; breaking changes must bump major.

**🔵 Standard** (default):

Three different natures: (1) guild-components is a UI/business component library on independent SemVer — minor bumps mean consumers just refresh deps; (2) guild-pb is protobuf-generated request/response types via codegen — every breaking change must bump major, CI gates on type check; (3) guild-types is hand-maintained domain types, independent. During dev, workspace:^ feeds all 6 apps from packages source; on publish, lerna detect-changed + lerna version rewrites workspace:^ into real semver for the registry. Cross-app conflict mitigation: 'whoever bumps first announces in group' + Orange CI enforces lockfile consistency.

<details><summary>🔴 Deep dive (click to expand)</summary>

Version management pain points and mitigations:

(1) SemVer is fuzzy for large UI libs: is changing a default slot content a breaking change? Our rule: 'changes to props/events/slots contract exposed to consumers' = breaking; internal style tweaks = patch; behavior change without API change = minor.

(2) PB type strictness: guild-pb is codegen'd from .proto; every backend release triggers codegen + publish. 6 apps may install different versions — A on v2.3, B on v2.4 — yet share a Pinia store. Runtime is fine (types erased) but IDE inconsistency confuses devs. Fix: root package.json pins guild-pb version (peer-style), forcing all 6 apps to upgrade together.

(3) lerna independent pain: detect-changed is accurate but limited — it tells you packages/A changed and downstream X, Y need rebuild, but can't auto-decide major/minor/patch. Devs must write conventional commits + lerna parses them.

(4) Cross-app coordination: rule is 'pre-publish, @-mention all owners in the chat with changelog, wait 24h'; breaking changes also link a migration guide in the changelog. Sounds primitive but beats any tool — better hit rate than auto codemod.

(5) media-link is the most dangerous shared low-level component — used by 5 apps, one prop change = breaking. Policy: 'adding a prop must default-compat; removing a prop must deprecate one version first' — plus a custom ESLint rule warns consumers on deprecated usage.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] SemVer 2.0 规范 (https://semver.org/)
  - [ ] Conventional Commits 规范 + lerna version 文档
  - [ ] Google Protocol Buffers - Language Guide & versioning
- 🛠️ Hands-on
  - [ ] 用 lerna independent 模式发布 2 个 package，一次同时 bump major/minor
  - [ ] 写一个 codegen 脚本把 .proto 转成 TS types
- ⚠️ Common pitfalls
  - 把 API 改动只 bump patch，下游业务运行时炸
  - guild-pb 不锁版本，多 project 类型不一致 IDE 报错
  - deprecate 没通知，下次发版直接删掉，下游线上事故
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果一个共享组件加 prop 但 default 兼容，算 minor 还是 patch？
  - [ ] PB 类型怎么处理向后兼容字段？
  - [ ] 怎么追踪 deprecated API 还有谁在用？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `packages/guild-components/src/ai-app-cover/ai-app-cover.vue`
- `packages/guild-components/src/base-components/media-link/media-link.vue`
- `packages/guild-pb`
- `packages/guild-types`

---

## 🧩 Feature (feature) — 2 Q&A

### Q1. How is the agent-settings / tasks / bio / identity / nickname AI-agent H5 flow split? Why not a single mega-form?

> Source: `tp-05` · scope: frontend · projects/h5-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Nuxt 3 dynamic routing | 必须掌握 | 5 个子页的路由表达基础 |
| Controlled component 模式 | 必须掌握 | editor 解耦的核心模式 |
| BFF vs 多实体直连权衡 | 加分项 | 解释为什么不做聚合 BFF |
| form-engine（formily）思想 | 加分项 | 对未来联动需求的展望 |

#### Tiered answers

**🟢 Elevator**: Split by business entity (identity/task/bio/nickname) into 5 separate pages, each with its own editor component; pages handle dynamic routing, views own UI only.

**🔵 Standard** (default):

An AI Agent is a virtual channel member; its attributes naturally split by entity — identity card / tasks / bio / nickname / entry settings. A single mega-form has three problems: (1) commit failure rolls back the whole page; (2) a single slow field blocks the form; (3) the backend already shards these by microservice — wrapping a BFF aggregator slows things down. So pages/agent-settings/[guildId]/[tinyId]/index.vue is the entry navigator, each child route owns its editor component, and the editor commits locally.

<details><summary>🔴 Deep dive (click to expand)</summary>

Real drivers behind the split: (1) backend entity-level microservices were already a fact, frontend aggregation would be anti-pattern; (2) users in agent-config scenarios typically 'enter, edit one item, leave' — a mega-form is worse UX; (3) each editor has its own special state (identity has avatar cropping, bio embeds guild-editor rich text, tasks has drag-reorder) — isolated editors cut per-page LOC by 50%+.

Few interesting engineering points:

(1) Dynamic routing [guildId]/[tinyId] expresses 'an Agent within a Guild'. Pages layer reads useRoute().params and passes them down; views layer is route-shape-agnostic (eases later PC migration).

(2) Editor abstraction uses 'controlled editor': each editor only exposes v-model:value + onCommit; commit logic is aggregated by the parent calling BFF. New editors don't need to learn the store.

(3) Weak cross-editor coupling (e.g., changing identity should refresh the tasks card) uses EventBus + invalidate marks, not two-way store binding — two-way binding would expose intermediate state when one editor fails.

Reflection: this architecture is weak at strong cross-field coupling. 'Changing identity auto-changes nickname' must be glued in the parent page with an effect. If such requirements grow, a form-engine abstraction (formily-style) would help; current density doesn't justify the complexity.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Nuxt 3 - File-based Routing 与 Dynamic Routes (https://nuxt.com/docs/guide/directory-structure/pages)
  - [ ] Vue 3 Controlled Component 模式 - v-model:custom 语法
  - [ ] Formily 设计文档 - 协议化表单的演进逻辑
- 🛠️ Hands-on
  - [ ] 用 Nuxt 3 写 demo 实现 [guildId]/[tinyId] 双层动态路由
  - [ ] 把一个传统大表单拆成 'controlled editor + onCommit' 三个子组件
- ⚠️ Common pitfalls
  - editor 直接读 store 导致组件失去复用性
  - EventBus 用太广，跨页事件无人 unsubscribe 内存泄漏
  - 把验证规则塞在 editor 内部，新业务接入无法定制
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 identity 和 nickname 必须强联动，你怎么改？
  - [ ] 为什么不做聚合 BFF？
  - [ ] editor 失败时怎么避免污染其他 editor 状态？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `projects/h5-guild/views/agent-settings/index.vue`
- `projects/h5-guild/views/agent-tasks/index.vue`
- `projects/h5-guild/views/agent-bio/components/bio-editor/index.vue`
- `projects/h5-guild/views/agent-identity/components/identity-editor/index.vue`
- `projects/h5-guild/views/agent-nickname/components/nickname-editor/index.vue`
- `projects/h5-guild/pages/agent-settings/[guildId]/[tinyId]/index.vue`

---

### Q2. useShare / useGlobalShare / share-screen-dialog — how do you pick the right share path across multiple hosts?

> Source: `tp-13` · scope: frontend · projects/web-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Composable 职责拆分原则 | 必须掌握 | 两个 composable 解耦的核心 |
| Discriminated Union 类型 | 必须掌握 | guild-share.ts 的类型基础 |
| html2canvas 跨域与 OOM | 加分项 | 截图方案的真实问题 |
| 三级 fallback 策略 | 加分项 | 稳健分享体系的标志 |

#### Tiered answers

**🟢 Elevator**: useShare for per-post sharing, useGlobalShare for the global share panel; host capability detection picks one of native / screenshot dialog / QR code.

**🔵 Standard** (default):

Two clearly-scoped composables: useShare takes props (post id/title/thumbnail) and returns a share() method, called by per-post UI like cards; useGlobalShare is an app-level panel (the share entry in the top nav), owning global state. Three path picks: (1) host supports native share (Mobile QQ embed, Electron, QQ Browser) — invoke jsapi for native panel; (2) no native but can screenshot (PC modern browsers) — share-screen-dialog auto-screenshots + watermarks + lets user download or copy; (3) none of the above (old browsers) — share-qrcode dialog. Types in guild-share.ts (ShareTarget / ShareContent) prevent raw-object usage in business code.

<details><summary>🔴 Deep dive (click to expand)</summary>

Design trade-offs:

(1) Why not merge useShare and useGlobalShare: different lifecycles. useShare mounts/unmounts with the post component; useGlobalShare lives with the app. Merging would tie the global panel to a specific post's context and force post cards to subscribe to global events — coupling reversed. Keeping them split, the global panel calls useGlobalShare.share(payload) with payload injected by the caller — unidirectional data flow.

(2) share-screen-dialog screenshotting via html2canvas, with pitfalls: cross-origin images need a CORS proxy; oversized canvas OOMs on some phones; ultimate fallback degrades to 'text + link' share when screenshotting fails.

(3) QR fallback UX: many PC users don't have phones handy, so share-qrcode also shows a 'short-link copy' button as a tertiary fallback.

(4) guild-share.ts type discipline: ShareTarget is a union enum 'wechat' | 'qq' | 'weibo' | 'copy_link' giving IDE hints, no string magic. ShareContent is a discriminated union for text/image/video — TS exhaustiveness check fails compilation on missing branches.

(5) Observability: every share call brackets a probe (scene/target/result). Datong yields per-host per-target success rate. We once spotted H5's WeChat-share success rate collapse on a Mobile QQ webview version — located within 1h to mqq jsapi payload field rename, rolled back in seconds.

Reflection: share-screen-dialog still does client-side screenshotting. Backend has a more accurate OG-image service. Plan: move screenshotting to the backend, frontend only fetches image URLs — fixes OOM and CORS pains.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] TypeScript Handbook - Discriminated Unions
  - [ ] html2canvas 文档 + 常见 issue 列表
  - [ ] Open Graph 协议 - 分享 meta 标签规范
- 🛠️ Hands-on
  - [ ] 用 discriminated union 写一个 share content type，故意漏一个分支看 TS 报错
  - [ ] 用 html2canvas 截一个跨域图片，观察哪些情况会失败
- ⚠️ Common pitfalls
  - useShare 和 useGlobalShare 互相 import 导致循环依赖
  - html2canvas 没设 useCORS，跨域图片全白
  - fallback 没埋点，无法量化各路径占比
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果设计第四种 fallback（比如复制图片到剪贴板），架构怎么扩展？
  - [ ] html2canvas 在 iOS Safari 上有什么特有问题？
  - [ ] ShareTarget 加新平台时类型如何同步给所有调用方？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `projects/web-guild/composables/useShare.ts`
- `projects/web-guild/composables/useGlobalShare.ts`
- `projects/web-guild/components/share-qrcode`
- `projects/web-guild/components/share-screen-dialog`
- `projects/web-guild/types/guild-share.ts`

---

## ⚡ Performance (performance) — 2 Q&A

### Q1. Both web-guild and h5-guild run Nuxt 3 SSR. How do you ship SSR and CSR from the same source? What drives your rollup chunking granularity?

> Source: `tp-02` · scope: frontend · projects/web-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Nuxt 3 SSR/CSR 切换 | 必须掌握 | 解释双构建的入口 |
| rollup manualChunks 用法 | 必须掌握 | 面试官会追问分包写法 |
| useFetch SSR 时机 | 加分项 | 讲清 onMounted 不生效的真实坑 |
| CDN 长缓存命中率优化 | 加分项 | 联结分包与基础设施 |

#### Tiered answers

**🟢 Elevator**: NUXT_SSR=false flips to CSR; in-house manualChunks slices along page / component / npm-package; vendor splits into stable and guild tiers.

**🔵 Standard** (default):

Nuxt 3 defaults to SSR. Runtime config reads NUXT_SSR; when false, nuxt generate emits CSR for hosts without Node (older QQ Browser cores). In SSR mode server/plugins/aegis.ts mounts server-side so first-byte exceptions are reported. Chunking sits in vite build.rollupOptions.output.manualChunks across three axes: (1) per-page chunks; (2) high-reuse components like virtual-waterfall isolated; (3) npm deps grouped by package name, with vendor split into stable (lodash, dayjs) vs guild (@tencent/guild-*).

<details><summary>🔴 Deep dive (click to expand)</summary>

Driven by host diversity: browser + QQ Browser embed + Mobile QQ webview + WeChat mini-program webview have divergent SSR support; older MQQ cores can't even refresh server-rendered cookies. Dual artifacts mandatory.

SSR vs CSR differ in more than a flag: (1) useFetch only works in setup; calling it in onMounted resolves undefined, called out in our README; (2) server/plugins/aegis.ts only fires SSR-side, so CSR mode needs a second mount in app.vue; (3) Pinia serialize is redundant in CSR but we keep it for code-path symmetry.

Chunking is measurement-driven: vendor.js started at 1.2MB+, 3G LCP past 4s. The manualChunks rule is 'co-locate code with similar change cadence': lodash + dayjs (stable for months) → vendor-stable ~180KB long-cached; @tencent/guild-* → vendor-guild ~260KB updated often with sourcemaps; page chunks load on route change. Vendor cache hit rate climbs from 60% to 85%+.

Trade-off: we dropped Nuxt 3's default 'split by dep graph' because it inlines one-page-only npm deps into page chunks, duplicating shared libs across sibling pages. Hand-rolled rules lose automation but significantly raise cache hit rate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Nuxt 3 官方 Rendering Modes 文档 (https://nuxt.com/docs/guide/concepts/rendering)
  - [ ] Vite Rollup Options 指南 (https://vitejs.dev/config/build-options.html)
  - [ ] Chrome DevTools Coverage 面板使用手册
- 🛠️ Hands-on
  - [ ] 用 Nuxt 3 建 demo，对比 nuxt build 与 nuxt generate 产物，用 source-map-explorer 看 vendor 构成
  - [ ] 写 20 行 manualChunks 把 lodash 单独打入 vendor-stable
- ⚠️ Common pitfalls
  - 在 onMounted 用 useFetch 没请求，必须 setup 同步用或改 $fetch
  - SSR 下 server/plugins 访问 window 炸 → 用 process.client 保护
  - manualChunks 返回值不稳定导致 chunk 名漂移，破坏 CDN 缓存
- 🤔 Self-check questions (answer without notes)
  - [ ] CSR generate 出来的产物怎么保证路由跳转时按需加载？
  - [ ] SSR 下 useAsyncData 与 useFetch 区别？
  - [ ] vendor-stable 和 vendor-guild 分层收益如何量化？
- ⏱️ Estimated time: **1-2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Why not lean on Nuxt 3's default route-based splitting?** (trade-off)
  > Default splits by dep graph, inlining single-page npm deps into the page chunk and duplicating across sibling pages. Hand-rolled rules sacrifice automation but raise cache hit rate from 60% to 85%.


#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qqbrowser`

---

### Q2. How is the short-post feed's waterfall / virtual list built? What keeps scrolling 10k items smooth?

> Source: `tp-06` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| DOM 复用池模式 | 必须掌握 | 虚拟列表的核心数据结构 |
| IntersectionObserver API | 必须掌握 | 懒加载 + 分页的官方方式 |
| ResizeObserver + batching | 加分项 | 高度测量异步化的关键 |
| Vue 响应式开销规避 | 加分项 | 讲清为什么不能直接 v-for |

#### Tiered answers

**🟢 Elevator**: Three pillars: DOM recycling pool, IntersectionObserver for lazy load, ResizeObserver for sliced async height measurement.

**🔵 Standard** (default):

Waterfall's pain: unknown heights, two-column staggering. Our approach: (1) virtual-waterfall maintains a fixed-size DOM recycle pool (~50 items), recycling scrolled-out nodes for items entering viewport; (2) IntersectionObserver watches a pre-bottom sentinel to trigger pagination; (3) for unknown image heights we use estimated placeholders, then update real heights via ResizeObserver in sliced async batches to avoid mass reflow; (4) guild-waterfall-feed has separate implementations in web-guild and h5-guild differing only in columns and card style; the core algorithm lives in packages/guild-components.

<details><summary>🔴 Deep dive (click to expand)</summary>

Key perf issues and fixes:

(1) DOM recycling vs Vue reactivity: naive v-for + key creates one vnode per row, exploding at 10k. Pool size = viewport height ÷ min card height × buffer ratio — e.g., 50 DOM nodes cover 100 virtual items, repositioned via transform: translateY, data swapped via ref. We didn't use vue-virtual-scroller because it handles two-column waterfall poorly and can't customize image-lazy timing.

(2) Height-measurement batching: image load is async; 10 images loading concurrently trigger 10 reflows. We use requestIdleCallback to merge measurement requests within a 16ms frame and batch-apply to column heights. Cost: first paint has brief column-height stagger, almost invisible.

(3) IntersectionObserver vs scroll event: scroll at 60fps is a perf nightmare; IO is browser-scheduled and frame-friendly. We use separate IO instances for 'pagination sentinel' and 'card lazy load' (merging callbacks slows response). Thresholds are tuned carefully.

(4) H5 vs PC differences: H5 has small screens and 2 columns, so pool can be smaller (20-30); PC has 3-4 columns, pool 70+. Different configs, same implementation.

Perf data: at 10k mock items FPS stays 55+; memory drops ~80% vs naive implementation.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] MDN - IntersectionObserver / ResizeObserver API
  - [ ] Web.dev - Virtualize large lists (https://web.dev/virtualize-long-lists-react-window/)
  - [ ] vue-virtual-scroller 源码 - 池化策略实现
- 🛠️ Hands-on
  - [ ] 用原生 DOM + transform 写一个 200 行的单列虚拟列表
  - [ ] Performance 面板录制对比 v-for 1 万条 vs 虚拟列表的 FPS / Memory
- ⚠️ Common pitfalls
  - 每条数据都 deep reactive，1 万条响应式开销爆炸
  - scroll 事件 60fps 触发 setState 卡顿
  - 图片高度变化未 batch，触发瀑布流大面积 reflow
- 🤔 Self-check questions (answer without notes)
  - [ ] 复用池大小怎么定？过小过大各有什么问题？
  - [ ] 瀑布流如何处理 placeholder 高度与真实高度差异？
  - [ ] IntersectionObserver 在 iOS Safari 上有什么坑？
- ⏱️ Estimated time: **2 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If you add infinite scroll + anchor jump (user clicks anchor to scroll to item 5000), how does the architecture change?** (feature)
  > Persist column-height arrays to the store; on jump, restore heights, derive scrollTop from estimatedHeight × index, fill unmeasured slots with estimates, correct via ResizeObserver after the jump.


#### Evidence

- `projects/web-guild/views/g-home/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/h5-guild/views/cms/cms-batch/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/web-guild/components/virtual-waterfall`
- `projects/web-guild/gui/virtual-list`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. Why a two-phase fileBatchUpload → fileUpload protocol instead of one-shot upload? How do you handle multiple auth states?

> Source: `tp-10` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 两阶段上传协议 | 必须掌握 | 答题主干 |
| Web Worker + 分片 md5 | 必须掌握 | 大文件上传的关键 |
| 断点续传与并发控制 | 加分项 | 可靠性维度的体现 |
| tus.io 协议 | 加分项 | 对比社区方案 |

#### Tiered answers

**🟢 Elevator**: Phase 1 batches signature requests, phase 2 uploads in parallel — saving per-file handshake; auth adapts pskey/skey/access_token via header switches.

**🔵 Standard** (default):

Two phases: (1) fileBatchUpload posts a batch of file metadata (filename/size/md5); backend returns per-file upload URL + signature + uploadId; (2) client PUTs file content in parallel (fileUpload). Wins: handshake happens once — uploading 9 photos saves 8 signature roundtrips; backend can also do risk/quota precheck in phase 1. Multi-auth: Mobile QQ uses pskey, PC web uses skey, third-party uses access_token — different headers (uin/pskey vs Authorization). An axios interceptor auto-injects based on host detection.

<details><summary>🔴 Deep dive (click to expand)</summary>

Engineering depth:

(1) Cost of client-side md5: for big files (>10MB), running md5 on main thread freezes UI. We push spark-md5 chunk-incremental md5 into a Web Worker. Business code just sees await getMd5(file).

(2) Concurrency control: phase 2 is parallel, but browsers cap same-origin connections at 6 — some webviews are stricter (4). A Semaphore limits max=4; failed chunks resume via uploadId retry.

(3) Resumable retry: each PUT retries up to 3 times with exponential backoff via uploadId; if >30% of files fail, abort the whole batch so the user re-triggers — avoids polluting UI with half-success state.

(4) Auth adapter pitfall: early on each project had its own axios interceptor, three diverging implementations. H5 lost pskey on certain paths. We hoisted it to packages/guild-components/src/base-components/media-link; business code imports the composable. media-link.vue checks URL scheme on render — cdn.xxx URLs are pre-signed, so pskey would interfere.

(5) Whistle proxying: for dev, route requests to prod backend with local cookies via whistle rules. Onboarding doc has a dedicated section.

Reflection: if rebuilding, we'd consider tus.io protocol over our custom two-phase — more mature ecosystem. We didn't switch because Tencent backend infra is built around this protocol; changing requires backend coordination with low ROI.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] spark-md5 文档 - 增量 hash 使用
  - [ ] tus.io 协议规范 - 对比腾讯两阶段协议
  - [ ] MDN - Service Worker / Web Worker 入门
- 🛠️ Hands-on
  - [ ] 用 Worker 算 100MB 文件的 md5，对比主线程版本的卡顿差异
  - [ ] 实现一个 Semaphore，限制 fetch 并发到 3
- ⚠️ Common pitfalls
  - 在主线程算大文件 md5 让界面冻结
  - 上传失败没区分『可重试』vs『不可重试』错误
  - 三种登录态 header 同时塞，后端按优先级拒绝
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果文件 1GB+，分片粒度和并发怎么定？
  - [ ] 断点续传的状态存哪里（localStorage vs IndexedDB）？
  - [ ] tus.io 相比腾讯两阶段优势在哪？
- ⏱️ Estimated time: **1-2 天**


#### Evidence

- `projects/web-guild/components/upload-button`
- `packages/guild-components/src/base-components/media-link/media-link.vue`

---

### Q2. ESLint 9 flat config + Husky + lint-staged + Orange CI — how many quality gates do you have and why not just rely on CI?

> Source: `tp-12` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| ESLint 9 flat config | 必须掌握 | 现代 lint 配置基础 |
| Husky + lint-staged 工作流 | 必须掌握 | 提交侧门禁核心 |
| 本地 vs CI 职责分层 | 加分项 | 理解四道闸门的设计哲学 |
| Orange CI 自定义流水线 | 加分项 | 腾讯内 CI 生态 |

#### Tiered answers

**🟢 Elevator**: Four gates getting more expensive: editor live-lint → pre-commit lint-staged → pre-push husky → Orange CI.

**🔵 Standard** (default):

Four gates: (1) editor live-lint (VSCode + ESLint) — cheapest, real-time; (2) lint-staged at commit runs ESLint + Prettier on staged files via Husky pre-commit hook; (3) Husky pre-push runs type check and unit tests (optional); (4) Orange CI does full lint + type check + build + unit tests — most expensive. We migrated to ESLint 9 flat config (eslint.config.mjs) — programmable config, per-glob rule sets. CI mandates 100% pass; local is 100% recommended; emergency --no-verify is allowed but must be explained in PR description.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why not CI-only — four reasons:

(1) Feedback loop: editor is ms, CI is 5-15 min. Writing a buggy line and learning at CI = 10x context switch cost.

(2) Hot-path triage: CI resources are shared across the org. Cheap local checks filter 'sure-fail' so CI tackles 'maybe-fail' — best resource use.

(3) Main branch protection: CI gates merge, but unguarded push means devs habitually push broken commits to feature branches, polluting git history.

(4) Progressive education: lint-staged auto-fixes (prettier formatting) — 'wrote wrong → tool fixed it' loop builds muscle memory.

ESLint 9 flat config migration value:

(a) Old .eslintrc was a 'config black box' with invisible rule inheritance; flat config is a plain JS module exporting an array, each entry { files, rules, plugins } matched by glob — vastly more readable.

(b) Dynamic plugin import: e.g., enable vue/strongly-recommended only in packages/guild-components, looser elsewhere — all in one config file.

(c) pnpm + flat config eliminates monorepo ambiguity: .eslintrc auto-merged up the tree, so packages and projects polluted each other; flat config declares files glob explicitly with clear scope.

Pitfall: lint-staged + husky 9.x have a known bug — Windows stash failures can lose files. We pin 9.0.0 + an internal workaround script.

Reflection: CI is still the bottleneck at ~5 min; optimizing to <2 min needs incremental lint + affected-test. Nx is great here but, as noted earlier, we didn't switch.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] ESLint 9 - Flat Config 迁移指南 (https://eslint.org/docs/latest/use/configure/configuration-files-new)
  - [ ] Husky v9 文档 - Hook 管理与跨平台问题
  - [ ] Orange CI 官方文档（内网）
- 🛠️ Hands-on
  - [ ] 把一个 .eslintrc 项目迁到 flat config，按 files glob 切多套规则
  - [ ] 写一个 husky pre-commit hook 同时跑 lint-staged 和 type check
- ⚠️ Common pitfalls
  - lint-staged 没 --diff 参数，每次跑全量
  - husky 8 → 9 升级没改路径配置，hook 静默失效
  - 在 lint-staged 里跑 jest，触发 watch 模式卡死
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果团队推 --no-verify 滥用，你怎么治理？
  - [ ] flat config 怎么处理 monorepo 多套规则？
  - [ ] 为什么 prettier 不放进 ESLint rule 而是独立工具？
- ⏱️ Estimated time: **1 天**


#### Evidence

- `eslint.config.mjs`
- `.orange-ci.yml`
- `.code.yml`
- `package.json`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. AegisV2, Datong V4, OpenTelemetry — three observability stacks side-by-side. How do their responsibilities divide and why not pick one?

> Source: `tp-09` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 前端监控三大件 (error/perf/trace) | 必须掌握 | 理解三家分工的基础 |
| OpenTelemetry traceContext 传递 | 必须掌握 | 跨服务关联的核心 |
| 头采样 vs 尾采样 | 加分项 | 讲清采样策略权衡 |
| SSR 阶段 globalThis 注入 | 加分项 | 工程化细节 |

#### Tiered answers

**🟢 Elevator**: Aegis owns frontend exceptions/perf, Datong drives business analytics, OTel traces cross-service spans — three layers with non-overlapping scopes.

**🔵 Standard** (default):

Three roles: (1) AegisV2 = Tencent's frontend monitoring platform — JS errors, perf metrics (LCP/FID/CLS), white screens; strong at browser-side error aggregation and alerting; (2) Datong V4 = data-platform analytics — business KPIs, funnels, cohorts; every 'button click / page dwell' goes here; (3) OpenTelemetry = distributed tracing from browser to backend microservices via shared traceId, strong at slow-request and cross-service dependency diagnosis. server/plugins/aegis.ts boots Aegis at Nuxt SSR entry so even white-screen first-paint can report. A unified useObserve composable exposes reportError/reportEvent/startSpan — business code is backend-agnostic.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why not consolidate — each tool's strength is irreplaceable:

(1) AegisV2 excels at error fingerprint aggregation: the same error 10k times collapses to one record with auto sourcemap. Datong (analytics) doesn't dedupe; OTel cares about spans not fingerprints.

(2) Datong owns business funnels: 'open channel → enter post → like → comment' retention, cohort and time slicing. Aegis lacks OLAP.

(3) OTel owns cross-service correlation: a slow post might show 800ms in Aegis, but is it BFF slow or RPC slow? OTel walks the traceId chain and points to the exact service and span.

Forcing one tool: Aegis for analytics? dimension explosion, slow queries; Datong for errors? no aggregation, no sourcemap; OTel for analytics? no out-of-the-box BI.

Co-design details:

(a) Unified traceId: generated on page entry; all three include it. From an Aegis error, jump to OTel for the full chain or Datong for user path — three views of the same user.

(b) Staggered sampling: Aegis full sampling (errors are rare); Datong scene-based (core funnels 100%, non-core 10%); OTel 10% head sampling + 100% error tail sampling. Total volume controlled, critical scenes preserved.

(c) SSR injection care: Aegis on server avoids window — use globalThis; Datong is client-only, stubbed in SSR; OTel trace context flows via HTTP header across server/client. server/plugins/aegis.ts only boots Aegis; the other two live in plugins/client/observe.ts.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Aegis V2 接入文档（内网） + Web Vitals 规范 (https://web.dev/vitals/)
  - [ ] OpenTelemetry JS - Web Tracer 集成指南
  - [ ] Datadog 博客 - Head vs Tail Sampling 对比
- 🛠️ Hands-on
  - [ ] 用 OTel JS 写 demo，把 fetch 请求自动注入 traceparent header
  - [ ] 在 Nuxt 3 plugin 里区分 server / client 注入观测 SDK
- ⚠️ Common pitfalls
  - Aegis 漏 sourcemap 上传，线上错误堆栈全是混淆名
  - OTel 全量采样，trace 数据量爆炸
  - Datong 和 Aegis 重复埋同一事件，统计数据双倍
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果只能保留一个观测工具，你会留哪个？为什么？
  - [ ] OTel 怎么在 SSR 与 CSR 间传递 traceContext？
  - [ ] 如何识别『前端慢』vs『后端慢』？
- ⏱️ Estimated time: **2 天**


#### Evidence

- `projects/web-guild/server/plugins/aegis.ts`
- `projects/web-guild`
- `projects/h5-guild`

---

## 🔒 Security (security) — 1 Q&A

### Q1. Both PC and H5 integrate the TuringShield turingSdk for risk control. How does the ticket flow work and why can't tickets be cached?

> Source: `tp-08` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 一次性凭证 / Nonce 设计 | 必须掌握 | 解释为什么不能缓存 |
| 重放攻击 (Replay Attack) 原理 | 必须掌握 | ticket 设计的根本动机 |
| SDK 懒加载与兜底 | 加分项 | 讲清工程化实现细节 |
| 图灵盾 scene 维度 | 加分项 | 体现对腾讯风控生态的理解 |

#### Tiered answers

**🟢 Elevator**: High-risk action triggers slider captcha → SDK returns a ticket → business attaches ticket to API request → backend validates and consumes; one-time use, never cached.

**🔵 Standard** (default):

TuringShield is Tencent's unified risk-control gateway. Flow: (1) a high-risk action (post, follow, like-spam threshold) triggers turingSdk.verify({ scene }); (2) SDK shows slider / puzzle / silent challenge UI; on success returns a ticket (one-time credential with scene/ts/sign); (3) business attaches ticket to header or body and sends with the business request; (4) backend validates ticket against TuringShield service, only then executes real business; (5) consumed tickets are dead; replay rejected. PC and H5 have separate utils/turingSdk/index.ts because load sources differ (PC via CDN script, H5 via host jsapi), but external API is unified.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why tickets must not be cached — three design layers:

(1) Replay defense: caching a ticket degrades a one-time credential into a long-lived token, letting attackers replay high-risk endpoints. Backend validation is atomic — duplicate consumption is rejected outright.

(2) Cross-scene defense: different scenes (post / follow / payment) carry different risk levels. Posting may trigger silent challenge; payment requires sliders. Caching would mean reusing a low-strength credential for a high-risk action. The SDK requires scene as an arg so business can't bypass.

(3) Time-window defense: tickets include ts; backend enforces a 60s window. No caching ensures attackers can't 'fetch a ticket at noon and replay at 3am after risk thresholds change'.

Engineering details for PC/H5 unified abstraction:

(a) Lazy load: turingSdk is 300KB+; most users never trigger it, so we lazy-load — inject script on first verify call, cache the promise after;

(b) Fallback: what if SDK fails to load or times out? try/catch + 60s timeout window: log degraded state, ask user to retry, never let a request through without a ticket — the security bottom line;

(c) H5 inside Mobile QQ has a special advantage: host can invoke native verification UI for better UX. So H5 version first detects mqq jsapi, falls back to CDN script if absent;

(d) Observability: each verify reports scene/duration/result to Aegis; dashboards show per-scene success rate and average latency, enabling second-level anomaly detection.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] OWASP - Replay Attack 与 Nonce 设计
  - [ ] 腾讯图灵盾官方文档 - turingSdk API
  - [ ] MDN - 异步 script 懒加载最佳实践
- 🛠️ Hands-on
  - [ ] 写一个 useRisk composable，封装 turingSdk 懒加载 + verify + 上报
  - [ ] 构造重放攻击 demo：缓存 ticket 后两次发请求，观察后端拒绝
- ⚠️ Common pitfalls
  - 把 ticket 写进 localStorage，下次启动复用，导致大面积请求失败
  - 兜底分支允许『SDK 失败时无 ticket 通过』，开口子
  - SDK 加载没 dedup，用户 spam 点击触发多个并发 verify
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果业务方坚持要缓存 ticket 减少弹窗，你怎么说服？
  - [ ] verify 失败时业务侧的合理 fallback 路径是什么？
  - [ ] PC 和 H5 unified API 怎么处理 SDK 接口差异？
- ⏱️ Estimated time: **1 天**


#### Evidence

- `projects/web-guild/utils/turingSdk/index.ts`
- `projects/h5-guild/utils/turingSdk/index.ts`

---

