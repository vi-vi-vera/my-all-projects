# 腾讯频道 Web 平台 (guild_web) — Interviewer Question Pack

> Mode: interviewer · Role: 前端工程师（Vue 3 + Nuxt + Monorepo 方向） · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 5 questions

### Q1. How do pnpm workspaces + lerna actually cooperate across 6 apps and 11 shared packages, and what mechanically guarantees dependency consistency?

> id: `iq-01` · source tech-point: `tp-01` · scope: frontend · depth: 中级

#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`
- `packages/guild-components`
- `packages/guild-pb`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Bumping vue from 3.4 to 3.5 — which packages worry you most and how do you catch the breakage early?** (reliability)
- ⚖️ **When does lerna independent's changed-detection miss real changes?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Clearly explains workspace:^ protocol, lerna independent mode and only-allow pnpm together, and states the exact role of frozen-lockfile in CI. | Describes the pnpm-deps / lerna-publish split of responsibilities and names at least one consistency-locking mechanism. | Confuses pnpm and lerna roles or cannot explain what workspace:^ is. |
| 取舍意识 | 0.30 | Volunteers a comparison vs Nx and Rush, articulating the wins and costs of skipping task graph caching. | Aware of Nx / Rush alternatives and names at least one difference. | Treats pnpm + lerna as the only or always-best choice without alternative awareness. |
| 实战经验 | 0.30 | Recalls a concrete incident caused by dep-version drift and which discipline was put in place afterwards. | Can describe common pitfalls (e.g., unlocked lockfile, workspace:^ unreplaced) without a specific incident. | No real monorepo operational experience; answers stay purely theoretical. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Within guild-editor (exeditor3-based) you split into At/Emoji/Placeholder plugins — how is state isolated and how do plugins communicate?

> id: `iq-03` · source tech-point: `tp-03` · scope: frontend · projects/guild-editor · depth: 中级

#### Evidence

- `projects/guild-editor/src/components/Editor/index.ts`
- `projects/guild-editor/src/components/Editor/index.vue`
- `projects/guild-editor/src/components/Editor/plugins/placeholder.ts`
- `projects/guild-editor/src/components/Editor/utils/Editor.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Why must PlaceholderPlugin use decorations rather than enter the schema?** (architecture)
- ⚖️ **If you add an '@all members' feature, which plugins get touched?** (feature)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains how ProseMirror PluginKey isolates each plugin's state slot and shows the transaction.meta cross-plugin pattern. | Articulates the three plugins' role split and is aware that PluginKey provides isolation. | Lumps all plugin state into a single store or has no concept of ProseMirror's plugin model. |
| 边界判断 | 0.30 | Sharply separates 'schema persists' from 'decorations are view-only' and cites the data-pollution risk of misplacing placeholder. | Knows schema and decorations are different and correctly classifies common rich-text elements. | Confuses schema and decorations or insists placeholder should be a real node. |
| 扩展性思维 | 0.30 | Describes the minimal change footprint to add a PollPlugin and identifies extension points for multi-format serialize. | Knows plugins are pluggable but cannot list the hooks a new plugin must implement. | Believes new features require core edits. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. With five hosts (PC web, H5, Electron, QQ Browser embed, MQQ long-post composer) of very different capabilities, how do you structure the abstraction?

> id: `iq-04` · source tech-point: `tp-04` · scope: frontend · depth: 中级

#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qq-guild`
- `projects/qqbrowser`
- `projects/guild-editor`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **useHostCapability accessing window blows up during SSR — how do you handle?** (reliability)
- ⚖️ **If business code insists on direct isElectron checks, how do you govern?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 分层架构能力 | 0.40 | Lays out the three-layer model (capability probe → adapter composable → UI fallback) with concrete useShare / useUpload examples at each layer. | Describes at least two layers and gives one composable example. | Lets host checks scatter in business code with no unified abstraction; thinks one-per-host duplication is fine. |
| fallback 设计 | 0.30 | Articulates ≥2 three-tier fallback chains (e.g., share native → screenshot → QR; clipboard navigator → execCommand → dialog) and explains per-tier hit-rate telemetry. | Knows fallback is needed; gives one two-tier degradation path. | Treats native as the only path; degrades to error on unsupported hosts. |
| 扩展性 | 0.30 | Clearly states which layer changes to onboard a sixth host (e.g., HarmonyOS webview), demonstrating unidirectional extensibility. | Knows costs should be bounded but cannot pinpoint the layer to touch. | Treats adding a host as a full rewrite; misses the layering payoff. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q4. How do you split guild vs detail Pinia stores in web-guild, and what's your SSR hydration-mismatch debug playbook?

> id: `iq-07` · source tech-point: `tp-07` · scope: frontend · projects/web-guild · depth: 中级

#### Evidence

- `projects/web-guild/store/detail.ts`
- `projects/web-guild/store/guild.ts`
- `projects/web-guild/composables/useShare.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a field like 'user role in current channel' is wanted by both stores, who owns it?** (architecture)
- ⚖️ **Under PATCH-style diff-only sync, what happens when fields conflict across route changes?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 边界划分 | 0.40 | Applies two principles — lifecycle and 'owner vs consumer of derived state' — to draw a sharp boundary, and explains route-key-based instantiation. | Distinguishes guild (global) from detail (transient) but offers vague principles. | Lumps everything into a single mega-store or creates circular imports. |
| SSR 水合排查能力 | 0.30 | Lists 4 frequent causes (cookie, timestamp, 3rd-party widget, v-for key) in a systematic order and mentions Vue devtools Pinia panel. | Names at least 2 mismatch categories; tool chain incomplete. | Falls back to 'try ClientOnly'; no systematic approach. |
| 性能/可靠性细节 | 0.30 | Cites the measured ~30% bandwidth saving of PATCH diff-only sync and explains the etag + delta protocol. | Knows store can be incrementally updated on route change but lacks protocol detail. | Insists on full reset on every route change; misses reuse value. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q5. How are guild-components / guild-pb / guild-types shared packages versioned, and how do you avoid cross-app upgrade conflicts?

> id: `iq-11` · source tech-point: `tp-11` · scope: frontend · depth: 中级

#### Evidence

- `packages/guild-components/src/ai-app-cover/ai-app-cover.vue`
- `packages/guild-components/src/base-components/media-link/media-link.vue`
- `packages/guild-pb`
- `packages/guild-types`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Is changing a default slot content a breaking change? On what grounds?** (trade-off)
- ⚖️ **How do PB types stay backward-compatible across field additions/removals?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| SemVer 判定 | 0.40 | States the rule 'only contract changes to exposed props/events/slots count as breaking' and concretely maps patch/minor/major scenarios. | Knows the three SemVer tiers and classifies common changes correctly. | Ships breaking changes as patch or unfamiliar with SemVer. |
| PB 类型治理 | 0.30 | Explains .proto → codegen → npm publish, and the necessity of pinning guild-pb in root package.json so all 6 apps upgrade together. | Knows PB types are codegen'd and names one consistency mechanism. | Believes multiple PB versions can coexist; misses post-type-erasure hidden bugs. |
| 演进纪律 | 0.30 | Articulates the full discipline: add-with-default, deprecate-before-remove + ESLint warning, 24h pre-publish @owner changelog announcement. | Aware of deprecation flow but lacks executional detail. | Believes 'delete first, notify after' is acceptable. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 2 questions

### Q1. Why is the AI-Agent H5 flow split into 5 separate pages with their own editors (agent-settings / tasks / bio / identity / nickname) instead of one mega-form?

> id: `iq-05` · source tech-point: `tp-05` · scope: frontend · projects/h5-guild · depth: 中级

#### Evidence

- `projects/h5-guild/views/agent-settings/index.vue`
- `projects/h5-guild/views/agent-tasks/index.vue`
- `projects/h5-guild/views/agent-bio/components/bio-editor/index.vue`
- `projects/h5-guild/views/agent-identity/components/identity-editor/index.vue`
- `projects/h5-guild/views/agent-nickname/components/nickname-editor/index.vue`
- `projects/h5-guild/pages/agent-settings/[guildId]/[tinyId]/index.vue`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If editing identity must auto-refresh tasks, do you pick EventBus or two-way store binding?** (architecture)
- ⚖️ **Under controlled-editor pattern, do validation rules live in the editor or the parent?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 拆分理由 | 0.40 | Names three drivers (backend entity microservices, single-field-edit UX, divergent editor state) and explains why no BFF aggregation. | Names at least one business or technical driver. | Treats the 5-page split as legacy bloat with no real justification. |
| Controlled editor 抽象 | 0.30 | Articulates v-model:value + onCommit decoupling and how it avoids editor↔store tight coupling. | Knows controlled vs uncontrolled distinction but cannot draw the boundary cleanly. | Has editors directly read the store, losing reusability. |
| 联动机制 | 0.30 | Articulates the rule 'weak coupling → EventBus, strong coupling → form-engine' and gestures at future evolution. | Aware of EventBus or store options and names one scenario each. | Defaults to two-way store binding; sees no alternative. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How do useShare / useGlobalShare / share-screen-dialog pick the right path, and why not merge into one composable?

> id: `iq-13` · source tech-point: `tp-13` · scope: frontend · projects/web-guild · depth: 中级

#### Evidence

- `projects/web-guild/composables/useShare.ts`
- `projects/web-guild/composables/useGlobalShare.ts`
- `projects/web-guild/components/share-qrcode`
- `projects/web-guild/components/share-screen-dialog`
- `projects/web-guild/types/guild-share.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If html2canvas OOMs on iOS Safari, how do you handle?** (reliability)
- ⚖️ **Adding a 'copy image to clipboard' fallback — how does the system extend?** (feature)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| Composable 拆分 | 0.40 | States the lifecycle-based split (post component vs app) and explains why merging reverses coupling. | Knows the two composables differ and names one distinction. | Pushes for merging; ignores coupling cost. |
| fallback 设计 | 0.30 | Covers the four-tier fallback (native → screenshot → QR → short link) with capability-probing conditions at each layer. | Describes two fallback tiers and trigger conditions. | Sticks to native only; errors on unsupported hosts. |
| 类型与观测 | 0.30 | Explains ShareTarget union enum + ShareContent discriminated union + per-share scene/target/result telemetry; cites a real-world rapid-diagnosis case. | Knows type discipline is needed and names one telemetry dimension. | Uses any types and skips telemetry. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚡ Performance (performance) — 2 questions

### Q1. How do you ship both SSR and CSR artifacts from one Nuxt 3 codebase, and what drives your custom rollup chunking?

> id: `iq-02` · source tech-point: `tp-02` · scope: frontend · projects/web-guild · depth: 中级

#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qqbrowser`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Under SSR, useFetch fired inside onMounted does nothing — how do you diagnose?** (reliability)
- ⚖️ **What goes wrong when manualChunks returns unstable names and how do you prevent it?** (performance)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Clearly states three facts: NUXT_SSR flag, nuxt build vs nuxt generate, server/plugins runs only on SSR side; explains the layered structure of manualChunks. | Distinguishes SSR from CSR artifacts and names at least two chunking dimensions. | Confuses build-time vs runtime, thinking SSR/CSR is just a runtime switch. |
| 性能权衡 | 0.30 | Uses cache hit rate, LCP and vendor size to quantitatively justify hand-rolled manualChunks. | Recognizes the limits of default route-based splitting and names one concrete difference. | Treats granularity as irrelevant or cannot articulate the vendor-stable vs vendor-guild split. |
| 宿主感知 | 0.30 | Voluntarily links 5-host capability matrix to the need for dual builds and matches hosts to SSR or CSR. | Aware some hosts can't do SSR but cannot pinpoint the technical reason. | Assumes all hosts behave identically; no host-diversity awareness. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Your short-post feed scrolls 10k items at 55+ FPS via waterfall + virtual list — what is the core mechanism and which pitfalls have you hit?

> id: `iq-06` · source tech-point: `tp-06` · scope: frontend · depth: 中级

#### Evidence

- `projects/web-guild/views/g-home/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/h5-guild/views/cms/cms-batch/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/web-guild/components/virtual-waterfall`
- `projects/web-guild/gui/virtual-list`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you size the recycle pool? What goes wrong if it's too large or too small?** (performance)
- ⚖️ **If you must support anchor-jumping to item #5000, where does the architecture need to extend?** (feature)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Lays out the trio: DOM recycle pool + IntersectionObserver + ResizeObserver async batched measurement, clarifying that recycling uses transform translateY rather than DOM removal. | Knows the core idea — don't render off-viewport nodes — and names one lazy-load trigger. | Believes Vue v-for + key suffices; ignores the reactivity blow-up at 10k items. |
| 性能量化能力 | 0.30 | Quantifies FPS, memory and reflow counts, and explains the role of requestIdleCallback batching. | Knows FPS and memory matter and names one profiler. | No quantitative mindset; stays at 'feels smooth'. |
| 踩坑复盘 | 0.30 | Cites ≥2 concrete pitfalls (e.g., image-load reflow storms, scroll-event performance) with the actual fixes deployed. | Cites one pitfall with a generic fix. | No real pitfalls recalled; everything comes from docs. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 2 questions

### Q1. Why a two-phase fileBatchUpload → fileUpload protocol instead of one-shot? How do you handle multiple auth states (pskey / skey / access_token)?

> id: `iq-10` · source tech-point: `tp-10` · scope: frontend · depth: 中级

#### Evidence

- `projects/web-guild/components/upload-button`
- `packages/guild-components/src/base-components/media-link/media-link.vue`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Computing md5 on the main thread freezes UI for a 100MB file — how do you solve?** (performance)
- ⚖️ **Do you store resumable-upload state in localStorage or IndexedDB, and why?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 协议理解 | 0.40 | Lays out the two-phase rationale (saves handshake + backend precheck + risk/quota separation) and explains uploadId's role in resumable retry. | Describes the two-phase flow and knows why merging fails. | Claims merging would work; misses the batched-signature payoff. |
| 工程化 | 0.30 | Covers Web Worker chunked md5 + Semaphore concurrency cap + exponential backoff + 30% failure abort threshold. | Names two engineering points (e.g., Worker md5 + retries). | Main-thread md5, uncapped concurrency, no retries. |
| 认证适配 | 0.30 | Explains the three header schemes (pskey / skey / access_token) and why the axios interceptor must live in packages/guild-components rather than per-app duplication. | Aware multi-auth needs header adaptation but cannot articulate the unification benefit. | Hand-writes headers in business code with three diverging copies. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. ESLint 9 flat config + Husky + lint-staged + Orange CI form four quality gates — could you collapse them all into just the CI gate?

> id: `iq-12` · source tech-point: `tp-12` · scope: frontend · depth: 中级

#### Evidence

- `eslint.config.mjs`
- `.orange-ci.yml`
- `.code.yml`
- `package.json`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If teammates routinely use --no-verify, how do you govern?** (trade-off)
- ⚖️ **Under flat config in a monorepo, how do you express multiple rule sets?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 门禁分层理解 | 0.40 | Argues 'feedback loop length + CI resource + main protection + progressive education' as four reasons not to consolidate. | Knows local and CI should split responsibility and names at least one reason. | Treats local checks as redundant; CI-pass-only mindset. |
| flat config 掌握 | 0.30 | Articulates the fundamental difference (explicit files glob vs implicit merge) and shows a monorepo two-rule-set config. | Knows flat config is a plain JS module and names one advantage. | Treats flat config as a rename of .eslintrc; misses the fundamental change. |
| 工具链踩坑 | 0.30 | Cites real pitfalls (husky 9.x stash failures on Windows, lint-staged without --diff running full) with workarounds. | Names one common pitfall (e.g., husky upgrade silently disabling hooks). | Zero toolchain-pitfall experience. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 1 questions

### Q1. AegisV2 / Datong V4 / OpenTelemetry coexist — how are responsibilities divided and why not consolidate to one?

> id: `iq-09` · source tech-point: `tp-09` · scope: frontend · depth: 中级

#### Evidence

- `projects/web-guild/server/plugins/aegis.ts`
- `projects/web-guild`
- `projects/h5-guild`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If you must keep only one, which would you pick and what gaps would you need to fill?** (trade-off)
- ⚖️ **How are the three SDKs respectively injected during SSR?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 三家职责理解 | 0.40 | Sharply distinguishes Aegis (error fingerprint aggregation) / Datong (business funnel OLAP) / OTel (cross-service traces) — each irreplaceable. | Names the core capability of at least two of the three. | Conflates all three as 'frontend monitoring'. |
| 工程协同设计 | 0.30 | Describes unified traceId tying all three together and the staggered sampling strategy (Aegis full, Datong scene-based, OTel head + error tail). | Knows correlation is needed and names one mechanism (e.g., traceId). | Sees the three as independent; no coordinated design. |
| SSR 注入细节 | 0.30 | Explains Aegis SSR injection via globalThis (not window), Datong client-only, OTel context flowing via HTTP header across server/client. | Knows window is forbidden in SSR but cannot detail per-SDK injection. | Reads window directly in SSR; SDKs crash. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 1 questions

### Q1. TuringShield turingSdk one-shot ticket — why must it never be cached? What's tricky about unifying PC and H5 integrations?

> id: `iq-08` · source tech-point: `tp-08` · scope: frontend · depth: 中级

#### Evidence

- `projects/web-guild/utils/turingSdk/index.ts`
- `projects/h5-guild/utils/turingSdk/index.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If business asks 'remember verification for 5 minutes to skip prompts', how do you respond?** (security)
- ⚖️ **When SDK load fails, what's the right fallback for the caller?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 安全意识 | 0.40 | Covers replay / cross-scene / time-window attacks and firmly states caching tickets degrades them to long-lived tokens — a security bottom line. | Knows one-time credentials must not be cached and names one attack scenario. | Agrees to cache for UX, or fails to grasp nonce / replay concept. |
| 工程实现 | 0.30 | Covers lazy load + fallback + unified API, and explains why H5 inside MQQ prefers mqq jsapi. | Describes at least one implementation detail (lazy load or concurrency dedup). | Thinks import-and-call is enough; misses engineering concerns. |
| 观测与回滚 | 0.30 | Volunteers Aegis telemetry (scene/duration/result) and cites a real-world rapid-diagnosis case like the WeChat-share collapse. | Knows telemetry is needed but cannot name dimensions. | No observability mindset; issues surface via user complaints. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

