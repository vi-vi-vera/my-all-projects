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

Tencent Guild frontend monorepo. pnpm + lerna over 11 shared packages and 6 host-specific apps.

### Standard (30–60 seconds)

guild_web is the unified frontend repo for Tencent Guild. We keep 6 apps and 11 shared packages in it. The apps target different hosts: web-guild for PC, h5-guild for mobile, qq-guild for the Electron client, qqbrowser for the QQ Browser embed, guild-editor for the long-post composer, and guild-scraper for content scraping. Shared packages include guild-components for business widgets, guild-pb for proto-generated types, feed-editor for rich text, and qrtc for realtime media. The stack is Vue 3, Nuxt 3, TypeScript, Pinia, Vite 6, and exeditor3 for rich text. We use pnpm workspaces for deps and lerna for releases. ESLint 9 flat config plus Husky, lint-staged, and Orange CI handle pre-commit checks.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

The main constraint on guild_web is that one codebase has to run on five host shapes. Architecturally, shared capability lives in packages: guild-components for business widgets, guild-pb for proto-generated types, feed-editor for rich text, qrtc for realtime media. projects holds host-specific code.

pnpm workspaces uses the workspace:^ protocol, so shared package changes flow to apps immediately. lerna runs in independent mode, so a small fix doesn't cascade version bumps. web-guild and h5-guild ship Nuxt 3 SSR by default and flip to CSR with NUXT_SSR=false for hosts without Node.

We didn't take Nuxt's default chunking. We wrote rollup manualChunks that splits vendor into stable and guild tiers plus per-page chunks. lodash and dayjs sit in vendor-stable, and their long-cache hit rate stays above 85%. @tencent/guild-* packages go in vendor-guild, where they update more often.

Over the past year the biggest business investment has been AI-agent channels. agent-settings, tasks, bio, identity, and nickname are five H5 pages, each owning one business entity. Every page has a Pinia slice tracking dirty and valid, writes go out as PATCH diffs, and a failure in one field doesn't force a full-page rollback.

Observability uses three stacks. AegisV2 owns errors and perf. server/plugins/aegis.ts boots it at the SSR stage so white-screen failures still get reported. Datong V4 owns business telemetry. OpenTelemetry handles cross-service traces. All three share a traceId, so from an Aegis error we can jump to OTel for the full chain.

For security we integrate turingSdk. PC and H5 have separate implementations but the external API is the same. Every sensitive action fetches a fresh ticket. We don't cache them — replay defense is the bottom line. On the engineering side, pnpm, ESLint, Husky, and Orange CI form four gates that get more expensive as you go right. A new hire can run the full check chain right after clone.

</details>

## ✨ Highlights

- **Monorepo 工程治理：pnpm workspaces + lerna 管控 6 业务 × 11 公共包** (architecture · frontend)
  Situation: the repo holds 6 host-specific apps and 11 shared packages, and legacy npm/yarn had produced phantom deps. Task: bring the dep graph and release flow under control. Action: we switched to pnpm workspaces with workspace:^ for live-linked internal packages, lerna independent for releases, only-allow pnpm in preinstall to lock the toolchain, and Husky plus lint-staged plus Orange CI for pre-commit validation. Result: dependency drift stopped, and new hires can run the full check chain right after clone.
  > Keywords: `pnpm-workspaces` · `lerna` · `workspace:^` · `only-allow` · `Orange CI`
- **Nuxt 3 SSR/CSR 双模 + 自研 rollup 代码分包** (performance · frontend)
  Situation: web-guild's vendor.js once went over 1.2MB, and LCP on 3G was past 4 seconds. Task: shrink first paint without giving up SSR. Action: we kept Nuxt 3 SSR and added NUXT_SSR=false for CSR builds. We wrote manualChunks that splits along page, component, and npm package, with vendor split into stable and guild tiers. Result: vendor-stable stays around 180KB, its long-cache hit rate went from 60% to 85%, and first-paint payload dropped.
  > Keywords: `Nuxt3` · `SSR` · `manualChunks` · `vendor-stable` · `LCP`
- **AI Agent 化频道：agent-settings/tasks/bio/identity/nickname 全链路 H5** (feature · frontend)
  Situation: h5-guild needed a new channel surface with user-customizable AI personas and task flows. Task: ship 5 pages and handle concurrent edits without pulling in a heavy state-machine framework. Action: each page got its own Pinia slice tracking dirty and valid. Writes went out as PATCH diffs, cross-page identity shared via useAgentContext, and we pulled form widgets into an identity/bio/nickname trio. Result: all 5 pages launched, concurrent-edit conflicts stopped, and later hires extend the template directly.
  > Keywords: `AI-agent` · `Pinia-slice` · `PATCH` · `ImageCropper` · `diff-only`
- **全链路可观测：AegisV2 + Datong V4 + OpenTelemetry** (observability · frontend)
  Situation: SSR exceptions are hard to read from the browser, and business events plus perf data sat on different platforms. Task: connect frontend and backend observability into one chain. Action: we boot Aegis in web-guild's server/plugins/aegis.ts at the SSR stage, ship sourcemaps through AegisV2 for readable stacks, route business telemetry through Datong V4, and thread one traceId across services via OpenTelemetry. Result: SSR exceptions trace back to a source line in Galileo, and business diagnosis time dropped.
  > Keywords: `AegisV2` · `Datong` · `OpenTelemetry` · `SSR-plugin` · `sourcemap`
- **多形态分发：PC Web / H5 / QQ Electron / QQ 浏览器 / 手 Q 终端长贴发布器** (architecture · frontend)
  Situation: the same channel code had to run on 5 hosts with different capabilities, auth, and security policies. Task: wrap up the host differences so business code stays unaware. Action: we built three layers — useHostCapability for capability probing, composables like useShare and useUpload for adaptation, and fallback widgets like share-qrcode for UI degradation. Adapter files sit at parallel paths in web and h5. Result: business pages have no if-platform checks, and adding a new host only needs one new adapter set.
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

**🟢 Elevator**: pnpm owns hardlinks and workspace:^, lerna owns versioning and publish, only-allow pnpm plus Orange CI gate validation pre-merge.

**🔵 Standard** (default):

We have 6 apps and 11 shared packages in one repo. npm and yarn produced phantom deps and a large node_modules. pnpm workspaces uses hardlinks, and the workspace:^ protocol keeps internal packages like guild-components live-linked so a one-line edit shows up in apps immediately. lerna only handles versioning and publish so its role doesn't overlap with pnpm. only-allow pnpm in preinstall locks the toolchain, Husky plus lint-staged validate again at commit, and Orange CI runs pnpm install --frozen-lockfile to keep the lockfile consistent across machines.

<details><summary>🔴 Deep dive (click to expand)</summary>

We use pnpm plus lerna, not yarn, and we didn't bring in Nx. The reason is scope: our needs land exactly at 'dep management plus version publish'. Compared to yarn v1, pnpm cuts node_modules from GB to hundreds of MB, and strict peer resolution surfaces phantom deps directly. Once a phantom dep shows up in CI we can fix it before it ships.

We hit a consistency issue once. Two projects transitively pulled different versions of @vue/composition-api, and SSR Pinia hydration broke; we only caught it in production. After the fix we set three rules: the root package.json pins TS, ESLint, and Vue family versions; every internal dep uses workspace:^; Orange CI runs pnpm install --frozen-lockfile, so anyone who can't install locally has to update the lockfile before pushing.

Releases use lerna independent mode. A bugfix in guild-components doesn't cascade-bump guild-pb, but lerna's detect-changed marks which downstream apps need a rebuild. At publish time lerna rewrites workspace:^ into real semver in the registry tarball.

Why not Nx? The affected graph would let CI skip untouched apps and CI time would drop more. But Nuxt 3 build already has Vite cache, so another affected layer gives us little on top and raises the onboarding bar, plus the docs and onboarding need to be rewritten. The cost is we don't get max cross-package parallel build speed, but pnpm --filter recovers most of it, and the team is fine with it for now.

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
  > Nx's affected graph would let CI skip untouched apps and cut CI time noticeably. The cost is a new DSL, more complex TS paths, and conflicts with Nuxt build hooks. Migration would take about two to three weeks.


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

**🟢 Elevator**: Three plugins cover three lifecycles: external reference, rich-media token, UX placeholder. State is isolated via exeditor3's PluginKey.

**🔵 Standard** (default):

The hard part of rich text is extensibility versus state coupling. exeditor3 gives each plugin its own schema, commands, and keyboard hooks. AtPlugin persists user entity IDs and hooks into guild-types. EmojiPlugin handles emoji rendering fallback. PlaceholderPlugin is UX placeholder only, pure decoration, never touches the schema. Adding a new plugin like PollPlugin later doesn't touch the existing three. State is isolated via PluginKey, with one slot per plugin, and cross-plugin messages ride transaction.meta so events don't overwrite each other.

<details><summary>🔴 Deep dive (click to expand)</summary>

Each plugin's boundary, plus issues we hit.

AtPlugin is the hardest. Mentions need three output formats: plainText, StRichText, and HTML. StRichText is Mobile QQ's structured message protocol where @ is a segment node with uid, tinyId, and nick. The plugin's serialize hook branches by output format so business code doesn't carry serialization logic, and adding a new output format only touches the plugin.

EmojiPlugin had a problem. Early on we stored emoji as raw Unicode. Later, on a specific Mobile QQ iOS webview build, new emoji didn't render and we had to fall back to SVG. Now there's a host-capability probe feeding a strategy choice, reusing useHostCapability.

PlaceholderPlugin sits apart because it can't enter the schema. If it did, the placeholder text would land in the doc the moment the user types. The right approach is exeditor3's decorations API, inserted dynamically at EditorView render time, never in the doc. This is a common ProseMirror pitfall and we stepped on it once, then wrote an internal wiki note pinning the boundary.

State isolation uses the plugin registry. Each plugin owns a PluginKey slot, the event bus only carries transactions, and cross-plugin messages ride meta. Compared to a global store with dispatch, plugin-state keeps plugins pluggable, and debugging coupling through meta is easier than through a shared store. The cost is that a future combined feature like 'mention-with-reaction' needs to read each other's state via plugin.apply explicitly.

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

**🟢 Elevator**: Three layers: useHostCapability probes capability, composables adapt, fallback components handle UI degradation.

**🔵 Standard** (default):

We need one codebase to run on 5 hosts without sprinkling if (isQQ) in business code. The bottom layer useHostCapability probes share, clipboard, file, and login bits via UA, window globals, and JSBridge. The middle layer is composables like useShare, useUpload, and useLogin, picking among JSBridge, Web API, and dialog fallbacks based on those bits. The UI layer ships fallback components — for example, share degrades to a share-qrcode dialog on hosts without native share. Business code only calls useShare() with no host awareness.

<details><summary>🔴 Deep dive (click to expand)</summary>

The capability matrix in short: PC Web is weakest but most universal; H5 inside Mobile QQ adds mqq jsapi; qq-guild is Electron and most capable, with direct FS and system notifications; qqbrowser uses QQ Browser's own jsapi; the long-post composer runs in the MQQ client SDK so share and upload go through the native bridge.

Before we had layers, share logic was spread across a dozen components. Adding 'share-to-group' meant changing a dozen ifs. An Electron upgrade later added a system-level share menu, and regression testing went up sharply. After layering, only the useShare composable and one new ElectronAdapter change, and business code stayed untouched.

The fallback itself matters. For clipboard, the web has navigator.clipboard.writeText; some older hosts don't support it and fall back to document.execCommand('copy'); if that fails too, we pop a dialog and let the user select and copy by hand. Three tiers.

We enforce boundaries strictly. Business state doesn't go into the abstraction, like share copy text. Only 'is the capability available' and 'how is it called' go in. Otherwise useShare starts carrying business copy, which is an anti-pattern. The cost is that first-time integrators learn three layers. The payoff is lower average maintenance across the 5 hosts, and adding a sixth only needs one new adapter while existing callers stay unchanged. Looking back, the biggest payoff isn't perf or bundle size, it's mental overhead — new joiners only need to understand composable semantics, not five host runtimes.

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
  > Only the bottom layer changes. useHostCapability adds Harmony UA detection and jsapi probing. The middle layer registers a HarmonyAdapter in useShare. UI and business layers stay the same.


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

**🟢 Elevator**: guild owns channel metadata, detail owns transient post state, instantiated by route key with PATCH diff sync. For mismatches, check cookies and timestamps first.

**🔵 Standard** (default):

On boundaries, guild store owns channel-level metadata — guildId, member permissions, channel config, CDN domains, the user's role in the channel. All of it is stable across the channel lifetime. detail store owns the currently opened post — postId, comments, like state, rich content — and resets on route change. Both are instantiated per route key, so two channel-detail tabs each have their own. Cross-store derived state flows through the useShare composable. On SSR hydration, the server serializes a store snapshot into __NUXT__, and CSR deserializes it back into pinia.

<details><summary>🔴 Deep dive (click to expand)</summary>

A few lessons from the field.

On boundaries there was a dispute: does 'the current user's role in this channel' belong to guild or detail? We put it in guild because the role doesn't change across posts. But the role-derived 'button visibility' is consumed by detail. We keep 'who owns data' and 'who consumes derived state' separate; otherwise the two stores end up importing each other in a cycle.

PATCH diff-only sync. On post switch we don't wholesale reset detail. Comment lists and like state can be partially reused — for example, the next post by the same author already has cached author info. We use store.$patch for incremental updates, the backend returns etag-keyed diffs, and bandwidth drops roughly 30%.

SSR hydration mismatch debugging, by frequency.

First, cookie differences between server and client. The server reads httpOnly, the client can't, and some v-if ends up different on the two ends. The fix is adding logs in SSR setup and printing req.headers.cookie with a timestamp.

Second, timestamps. Date.now() during server render is server time, during hydrate it's client time, a few seconds apart and mismatch. The fix is writing server time into the store and not regenerating on the client.

Third, third-party widgets that don't wait for nextTick — turingSdk injects DOM that hydration's patch removes. The fix is wrapping with ClientOnly.

Fourth, v-for missing keys or using index as key. Slightly different server and client orderings then mismatch.

For tooling, we open the Vue devtools Pinia panel first to diff server and client snapshots, then Chrome Performance to look at hydration cost, and only then reach for console.log.

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

**🟢 Elevator**: lerna independent plus workspace:^ internally, SemVer externally, PB types via codegen, and breaking changes must bump major.

**🔵 Standard** (default):

Three different natures. guild-components is a UI plus business component library on independent SemVer — minor bumps mean consumers just refresh deps. guild-pb is protobuf-generated request/response types via codegen — every breaking change must bump major, CI gates on type check. guild-types is hand-maintained domain types, independent. During dev, workspace:^ feeds all 6 apps from packages source. At publish time, lerna detect-changed plus lerna version rewrites workspace:^ into real semver for the registry. Cross-app conflict mitigation: 'whoever bumps first announces in group chat' plus Orange CI enforcing lockfile consistency.

<details><summary>🔴 Deep dive (click to expand)</summary>

Version management pain points.

SemVer is fuzzy for large UI libraries. Is changing a default slot content a breaking change? Our rule: changes to props, events, or slots contract exposed to consumers count as breaking; internal style tweaks are patch; behavior changes without API changes are minor.

PB type strictness. guild-pb is codegen'd from .proto, and every backend release triggers codegen plus publish. The wrinkle is that the 6 apps may install different versions — A on v2.3, B on v2.4 — yet share a Pinia store. Runtime is fine because types are erased, but IDE inconsistency confuses devs. The fix is the root package.json pinning guild-pb version (peer-style), forcing all 6 apps to upgrade together.

lerna independent's pain. detect-changed is accurate but limited. It tells you packages/A changed and downstream X, Y need rebuild, but it can't auto-decide major/minor/patch. Devs write conventional commits and lerna parses them.

Cross-app coordination. Our rule is 'pre-publish, @-mention all owners in the chat with changelog, wait 24h'. Breaking changes also link a migration guide in the changelog. It sounds primitive, but it works better than any tool — hit rate beats auto codemod.

media-link is the most sensitive shared low-level component — used by 5 apps, one prop change is breaking. Policy: adding a prop must default-compat; removing a prop must deprecate one version first. A custom ESLint rule warns consumers on deprecated usage.

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

**🟢 Elevator**: Split by business entity into 5 separate pages, each with its own editor. pages handles dynamic routing, views owns UI.

**🔵 Standard** (default):

An AI Agent is a virtual channel member, and its attributes split along natural business entities: identity card, tasks, bio, nickname, and entry settings. The initial ask was 'give the agent a persona-shaped config panel'. We didn't build a mega-form for three reasons: commit failure would roll back the whole page; one slow field would block the whole form; the backend already shards these into microservices, so wrapping a BFF aggregator would slow things down. So pages/agent-settings/[guildId]/[tinyId]/index.vue is the entry navigator, each child route owns its editor component, and editors commit locally.

<details><summary>🔴 Deep dive (click to expand)</summary>

Three real drivers behind the split. First, the backend is already split into entity-level microservices, so frontend aggregation would be an anti-pattern. Second, in agent-config scenarios users 'enter, edit one thing, leave', and a mega-form gives worse UX. Third, each editor has its own special state — identity has avatar cropping, bio embeds guild-editor rich text, tasks has drag-reorder — and isolating them cut per-page LOC roughly in half.

A few engineering points.

Dynamic routing uses [guildId]/[tinyId] to express 'an agent under a guild'. pages reads useRoute().params and passes them down. views doesn't care about route shape, which makes a later PC port easier.

editors use the controlled-editor pattern. Each editor exposes only v-model:value and onCommit, the parent aggregates commits and calls the BFF. Adding a new editor doesn't need knowledge of the store, and new contributors don't need to read the old code from the top.

Weak cross-editor coupling, like 'change identity, refresh the tasks card', goes through an EventBus with invalidate marks, not two-way store binding. Two-way binding would expose intermediate state when one editor fails, which is the worst kind of bug to reproduce.

The current shape is weak at strong coupling, like 'changing identity auto-changes nickname'. That has to be glued in the parent page with an effect. If such requirements grow, a form-engine abstraction (formily-style) would help. The current business density doesn't justify that complexity.

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

**🟢 Elevator**: useShare is per-post sharing, useGlobalShare is the global share panel. Host capability detection picks one of native, screenshot dialog, or QR code.

**🔵 Standard** (default):

Two clearly-scoped composables. useShare takes props (post id, title, thumbnail) and returns a share() method, called by per-post UI like cards. useGlobalShare is an app-level panel (the share entry in the top nav), owning global state. Three path picks: hosts supporting native share (Mobile QQ embed, Electron, QQ Browser) invoke jsapi for the native panel; no native but screenshot-capable (PC modern browsers) uses share-screen-dialog, auto-screenshots with a watermark, and lets the user download or copy; none of the above (old browsers) uses share-qrcode. Types in guild-share.ts (ShareTarget, ShareContent) prevent raw-object usage in business code.

<details><summary>🔴 Deep dive (click to expand)</summary>

Design trade-offs.

Why not merge useShare and useGlobalShare? Different lifecycles. useShare mounts and unmounts with the post component; useGlobalShare lives with the app. Merging would tie the global panel to a specific post's context and force post cards to subscribe to global events — coupling reversed. With them split, the global panel calls useGlobalShare.share(payload) where payload is injected by the caller (possibly from useShare or the screenshot module) — unidirectional data flow.

share-screen-dialog screenshotting via html2canvas with pitfalls: cross-origin images need a CORS proxy; an oversized canvas OOMs on some phones; we added a final fallback that degrades to a 'text plus link' share when screenshotting fails.

QR fallback UX. Many PC users don't have phones handy, so share-qrcode also shows a 'short-link copy' button as a secondary fallback.

Type discipline in guild-share.ts. ShareTarget is a union enum 'wechat' | 'qq' | 'weibo' | 'copy_link', giving IDE hints and avoiding string magic. ShareContent is a discriminated union for text, image, and video — TypeScript exhaustiveness check fails compilation on missing branches.

Observability. Every share call brackets a probe (scene, target, result). Datong yields per-host per-target success rate. We once saw H5's WeChat-share success rate drop on a Mobile QQ webview version and traced it within an hour to an mqq jsapi payload field rename, then rolled back the old path.

share-screen-dialog still does client-side screenshotting. The backend has a more accurate OG-image service. The plan is to move screenshotting to the backend; the frontend would only fetch image URLs, which fixes OOM and CORS together.

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

**🟢 Elevator**: NUXT_SSR=false flips to CSR, manualChunks splits along page, component, and npm package, and vendor splits into stable and guild.

**🔵 Standard** (default):

Nuxt 3 defaults to SSR. Runtime config reads NUXT_SSR, and when it's false nuxt generate emits CSR for hosts without Node, like older QQ Browser cores. In SSR mode server/plugins/aegis.ts boots on the server side so first-byte exceptions still get reported. Chunking lives in vite build.rollupOptions.output.manualChunks across three layers. First is per-page, one chunk per page. Second is high-reuse components like virtual-waterfall, each isolated. Third is npm deps grouped by package name, with vendor split into stable (lodash, dayjs) and guild (@tencent/guild-*).

<details><summary>🔴 Deep dive (click to expand)</summary>

The driver is host diversity. Browser, QQ Browser embed, Mobile QQ webview, and WeChat mini-program webview all have different SSR support. Older MQQ cores can't even refresh server-rendered cookies, so dual builds are required and a single artifact can't cover every host.

SSR and CSR differ in more than a flag. useFetch only works in setup; calling it in onMounted resolves undefined, and we wrote this into the README and a lint rule. server/plugins/aegis.ts only fires on the server, so CSR mode needs a second mount in app.vue. Pinia's serialize is redundant on CSR, but we kept it for code-path symmetry.

The chunking rule came from measurement. vendor.js started at over 1.2MB and LCP on 3G was past 4 seconds. Our rule is 'co-locate code with similar change cadence'. lodash and dayjs are stable for months and go into vendor-stable at around 180KB with long-term caching. @tencent/guild-* updates with releases and goes into vendor-guild at around 260KB; sourcemaps track it. Page chunks load only on route change. After the split, vendor-stable's cache hit rate went from 60% to 85%, and the CDN gain showed up directly in second-visit LCP numbers.

As a trade-off we dropped Nuxt 3's default dep-graph split. It inlines single-page npm deps into page chunks, so adjacent pages redownload the same dep. Handwritten rules give up automation but the cache hit rate goes up, and apps get a more predictable post-release experience.

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
  > The default splits by dep graph and inlines single-page npm deps into the page chunk, so adjacent pages redownload the same dep. Handwritten rules lose automation but raise the cache hit rate from 60% to 85%.


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

**🟢 Elevator**: A DOM recycle pool, IntersectionObserver for lazy load, and ResizeObserver for sliced async height measurement.

**🔵 Standard** (default):

The waterfall pain is unknown heights and two-column staggering. Our approach: virtual-waterfall maintains a fixed-size DOM recycle pool, say 50 item DOMs, and scrolled-out nodes are recycled for items entering the viewport. IntersectionObserver watches a pre-bottom sentinel to trigger pagination. For unknown image heights we use estimated placeholders, then update real heights via ResizeObserver in sliced async batches to avoid reflowing many items at once. guild-waterfall-feed has separate copies in web-guild and h5-guild differing in column count and card style; the core algorithm lives in packages/guild-components.

<details><summary>🔴 Deep dive (click to expand)</summary>

Key perf points and fixes.

DOM recycling versus Vue reactivity. Plain v-for + key creates one vnode per row, and 10k rows can't hold up. The recycle pool sizes as 'viewport height over minimum card height times a buffer multiplier' — for example 50 DOM nodes cover 100 virtual items, repositioned via transform: translateY with data swapped through ref. We didn't use vue-virtual-scroller because its two-column waterfall support is weak and we can't customize image-lazy timing.

Height measurement needs batching. Image load is async, and 10 images loading together trigger 10 reflows. We use requestIdleCallback to merge measurement requests into a 16ms frame and batch-apply to column heights. The cost is brief column-height stagger on first paint, barely visible, and the product team accepted it.

IntersectionObserver versus scroll. 60fps scroll is unfriendly for perf. IO is browser-scheduled with fewer dropped frames. We use separate IO instances for the pagination sentinel and card lazy-load so callbacks don't get merged and slow response. Thresholds are tuned.

H5 vs PC is a config difference, not an implementation one. H5 has small screens with 2 columns, so a pool of 20 to 30 is fine. PC is wider with 3 to 4 columns, pool above 70.

Measurement: at 10k mock items FPS stays above 55 and memory drops roughly 80% versus the naive approach, taken from a pre-launch stress-test run.

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
  > Persist column-height arrays in the store. On jump, restore the height array, derive scrollTop from estimatedHeight × index, fill unmeasured slots with estimates, then correct via ResizeObserver after landing.


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

**🟢 Elevator**: Phase 1 batches signature requests, phase 2 uploads in parallel — saving per-file handshake. Auth adapts pskey, skey, and access_token via header switches.

**🔵 Standard** (default):

Two phases. fileBatchUpload posts a batch of file metadata (filename, size, md5); the backend returns each file's upload URL, signature, and uploadId. The client then PUTs file content in parallel, that's fileUpload. The win is one handshake — uploading 9 photos saves 8 signature roundtrips. The backend can also do risk and quota pre-check in phase 1. For auth, Mobile QQ uses pskey, PC uses skey, and third-party uses access_token, with different headers (uin/pskey versus Authorization). An axios interceptor auto-injects them based on host detection.

<details><summary>🔴 Deep dive (click to expand)</summary>

Engineering depth.

Cost of client-side md5. For files above 10MB, running md5 on the main thread freezes the UI, so we push spark-md5 chunk-incremental md5 into a Web Worker. Business code just sees await getMd5(file).

Concurrency control. Phase 2 is parallel, but browsers cap same-origin connections at 6, and some webviews are stricter at 4. A Semaphore limits max=4, and failed chunks resume via uploadId retry.

Resumable retry. Each PUT retries up to 3 times with exponential backoff via uploadId. If more than 30% of files fail, we abort the whole batch so the user retriggers, avoiding a half-success state in the UI.

Multi-auth adapter pitfall. Early on each project had its own axios interceptor, three diverging implementations, and H5 lost pskey on certain paths. We hoisted it to packages/guild-components/src/base-components/media-link, and business code imports the composable. media-link.vue checks URL scheme on render — cdn.xxx URLs are pre-signed, so pskey would interfere.

Whistle proxying. For dev, we route requests to the prod backend with local cookies via whistle rules. Onboarding docs have a dedicated section with common rule recipes.

If rebuilding, we'd consider tus.io over the custom two-phase protocol — more mature ecosystem. We didn't switch because Tencent backend infra is built around this protocol; changing requires backend coordination, and ROI is low for now. The upload setup is still evolving — the next step is moving the worker to a SharedWorker so multiple uploads share one md5 context.

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

**🟢 Elevator**: Four gates that get more expensive: editor live-lint, pre-commit lint-staged, pre-push husky, and Orange CI.

**🔵 Standard** (default):

Four gates: editor live-lint (VSCode plus ESLint) — the cheapest and real-time; lint-staged at commit, running ESLint plus Prettier on staged files via Husky pre-commit; Husky pre-push for type check and unit tests (optional); Orange CI running the full lint, type check, build, and unit tests — the most expensive. We migrated to ESLint 9 flat config (eslint.config.mjs) — programmable config with per-glob rule sets. CI mandates pass; local is recommended. Emergency --no-verify is allowed but must be explained in the PR description.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four reasons we don't rely only on CI.

Feedback loop. Editor is milliseconds, CI is 5 to 15 minutes. Writing a buggy line and learning at CI multiplies context-switch cost by 10x.

Hot-path triage. CI resources are shared across the org. Cheap local checks filter the sure-fail cases so CI tackles the maybe-fail ones, which is the best use of resources.

Main branch protection. CI gates merge, but without a pre-push gate, devs habitually push broken commits to feature branches and pollute git history.

Progressive education. lint-staged auto-fixes at commit time (prettier formatting). The 'wrote wrong → tool fixed it' loop builds muscle memory after a hundred repetitions.

ESLint 9 flat config migration value. The old .eslintrc was a config black box with invisible rule inheritance. flat config is a plain JS module exporting an array, each entry has { files, rules, plugins } matched by glob — much more readable. It allows dynamic plugin import — for example, enable vue/strongly-recommended only in packages/guild-components and looser rules elsewhere, all in one config file. pnpm plus flat config also removes monorepo ambiguity: .eslintrc used to auto-merge up the tree so packages and projects polluted each other; flat config declares files glob explicitly with clear scope.

Pitfall. lint-staged and husky 9.x have a known bug where Windows stash failures can lose files. We pin 9.0.0 plus an internal workaround script.

CI speed is still the bottleneck at around 5 minutes. Optimizing to under 2 minutes needs incremental lint and affected-only tests. Nx is strong here but, as noted, we didn't switch.

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

**🟢 Elevator**: Aegis owns frontend exceptions and perf, Datong drives business analytics, OTel traces cross-service spans. Three layers with non-overlapping scopes.

**🔵 Standard** (default):

Three roles. AegisV2 is Tencent's frontend monitoring platform, owning JS errors, perf metrics (LCP, FID, CLS), and white-screen detection, and strong at browser-side error aggregation and alerting. Datong V4 is the data-platform analytics system, strong at business KPIs, funnels, and cohorts; button clicks and page dwell go there. OpenTelemetry runs distributed traces from the browser through backend microservices via one traceId, strong at slow-request and cross-service dependency diagnosis. server/plugins/aegis.ts boots Aegis at the Nuxt SSR stage so white-screen first paints can still report. A unified useObserve composable exposes reportError, reportEvent, and startSpan, so business code stays backend-agnostic.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why not consolidate — each tool's strength is irreplaceable.

AegisV2 excels at error fingerprint aggregation. The same error ten thousand times collapses to one record with auto sourcemap. Datong as an analytics platform doesn't dedupe. OTel cares about spans, not fingerprints.

Datong owns business funnels. 'Open channel, enter post, like, comment' retention needs cohort and time slicing. Aegis lacks OLAP.

OTel owns cross-service correlation. A slow post might show 800ms in Aegis, but is it BFF slow or backend RPC slow? OTel walks the traceId chain and points to the exact service and span.

Forcing one tool: Aegis for analytics — dimension explosion, slow queries. Datong for errors — no aggregation, no sourcemap. OTel for analytics — no out-of-the-box BI.

Co-design.

Unified traceId. Generated on page entry; all three include it. From an Aegis error we jump to OTel for the full chain or Datong for the user path. Three views of one user.

Staggered sampling. Aegis runs full sampling because errors are rare. Datong samples by scene — core funnels 100%, non-core 10%. OTel uses 10% head sampling plus 100% error tail sampling. Total volume stays controlled while critical scenes are preserved.

SSR injection needs care. Aegis on server avoids window — use globalThis. Datong is client-only and is stubbed during SSR. OTel trace context flows via HTTP header across server and client. server/plugins/aegis.ts only boots Aegis; the other two live in plugins/client/observe.ts.

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

**🟢 Elevator**: A high-risk action triggers a slider check, the SDK returns a ticket, business sends the ticket to the backend, and the backend validates and consumes it. One-time use, never cached.

**🔵 Standard** (default):

turingSdk is Tencent's unified risk-control gateway. The flow: a high-risk action (post, follow, like-spam threshold) triggers turingSdk.verify({ scene }). The SDK shows a slider, puzzle, or silent challenge, and on success returns a ticket containing scene, ts, and sign. Business attaches the ticket to a request header or body and sends it with the business call. The backend validates the ticket against the turingSdk service and only then runs the real business logic. Once validated the ticket is dead — replay is rejected. PC and H5 each have their own utils/turingSdk/index.ts because the load source differs — PC via CDN script, H5 via host jsapi — but the external API is the same.

<details><summary>🔴 Deep dive (click to expand)</summary>

Why we can't cache the ticket — three design layers.

Replay defense. Caching a ticket degrades a one-time credential into a long-lived token, and one ticket would let an attacker replay high-risk endpoints. Backend validation is atomic, so duplicate consumption is rejected.

Cross-scene defense. Different scenes (post, follow, payment) carry different risk levels. Posting is low-risk and may trigger a silent challenge; payment is high-risk and triggers a slider. Caching would mean reusing a low-strength credential for a high-risk call. The SDK requires scene as an argument, so business can't bypass it.

Time-window defense. Tickets include ts, and the backend enforces a 60-second window. Not caching prevents an attacker from 'fetching a ticket at noon and replaying at 3am after risk thresholds change'.

Engineering details for the unified PC + H5 abstraction.

Lazy load. turingSdk is over 300KB. Most users never trigger it, so we lazy-load — inject the script on first verify call and cache the promise afterward.

Fallback. What if the SDK fails to load or times out? We use try/catch with a 60-second fallback window. On timeout we log a degraded state and ask the user to retry; we never let a request through without a ticket. That's the security floor.

H5 inside Mobile QQ is special: the host can invoke a native verification UI, which feels better. The H5 version checks mqq jsapi first, uses native when present, and falls back to the CDN script otherwise.

Observability. Each verify call reports scene, duration, and result to Aegis. The dashboard shows per-scene success rate and average latency, and anomalies show up quickly.

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

