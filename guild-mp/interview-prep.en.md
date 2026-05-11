# QQ 频道小程序 (guild_mp) — Interview Preparation

> Mode: candidate · Role: 前端工程师（微信小程序 / 内容社区方向） · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 2      | 🧩 |
| architecture  | 3 | 🏗️ |
| performance   | 3  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

QQ Guild WeChat mini-program, native stack with 16 sub-packages, keeps main bundle under 2MB.

### Standard (30–60 seconds)

guild_mp is the WeChat mini-program client of Tencent QQ Guild. It is built with the native mini-program framework plus TypeScript, mini-stores and miniprogram-computed, organized as one main package, 16 business sub-packages and two tooling sub-packages (pkg-pb, pkg-worker). The main bundle is kept under 2MB by preloadRule that warms feed, assistant and tool sub-packages on first tab entry, while cross-sub-package lazy loading goes through a typed requireAsyncModule helper backed by a moduleRegistry. Surface covers channel browsing, feed detail and publishing, chatroom IM, channel management and AI assistant. My work spans feed prefetch, email login from spec to launch, and review follow-ups.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

guild_mp is the official WeChat mini-program client of QQ Guild. Two hard constraints drive design: the 2MB main-bundle quota and the need to host both IM and a content community. Instead of a cross-platform framework we stay on native mini-program plus TypeScript 5, using @tencent/mini-stores for cross-page state, miniprogram-computed for derived data, and @bufbuild/protobuf plus protobufjs for wire format. The main package only carries four tabs and a custom tab bar; everything else lives in 16 business sub-packages plus two tooling sub-packages pkg-pb and pkg-worker. app.json preloadRule warms feed, assistant, tool and pkg-pb after the first tab is ready. Cross-sub-package access goes through requireAsyncModule in utils/requireAsync.ts, backed by a generic moduleRegistry that turns a string path into a typed module shape, with a DEBUG_CONFIG switch for latency and failure injection. On performance, utils/prefetch/prefetchManager plus FeedPrefetchStore and PreDataStore prefetch the detail API on feed click; miniprogram-computed contains setData calls and a dedicated rules file captures the lessons. Reliability uses a unified httpClient for cookie, env switch and error fallback; security uses Turing-shield turingSdk for captcha and risk control; observability uses Tencent Aegis with sourcemap auto-upload; long lists have both a classic virtual-list and a skyline variant. I personally drove feed prefetch tuning, email login end-to-end, AI app card link dispatch, and follow-up fixes and rule files that came out of reviews.

</details>

## ✨ Highlights

- **主包 2M 红线下的 16 分包架构与类型安全跨分包懒加载** (architecture · frontend)
  Situation: QQ Guild on mini-program hosts both IM and community and easily blows the 2MB budget. Task: stay under 2MB without hurting re-navigation UX, and keep TypeScript autocomplete for cross-package calls. Action: shrink the main package to four tabs plus a custom tab bar, split the rest into 16 domain sub-packages plus two tooling ones (pkg-pb and pkg-worker), use preloadRule to warm feed, assistant, tool and pkg-pb after first tab, and wrap every cross-package call in requireAsyncModule backed by a generic moduleRegistry. Result: main bundle stays under 2MB, new business lines only extend the registry, protobuf encode/decode stays out of the main package, and DEBUG_CONFIG simulates latency or failure for QA.
  > Keywords: `分包` · `preloadRule` · `requireAsyncModule` · `TypeScript 泛型` · `moduleRegistry`
- **Feed 预数据 + miniprogram-computed 打磨首屏与渲染性能** (performance · frontend)
  Situation: feed-to-detail navigation has visible white screen and scroll jank. Task: pre-warm detail-page data without changing the API and stop setData churn. Action: implement click-intent prefetch in utils/prefetch/prefetchManager writing into FeedPrefetchStore and PreDataStore; replace hand-rolled setData with miniprogram-computed and distill a miniprogram-computed-data-rules file. Result: detail first-screen is near-instant on hit, the context-menu vs feed-detail mismatch is fixed by unifying the source, and the rules file becomes onboarding material.
  > Keywords: `prefetch` · `PreDataStore` · `miniprogram-computed` · `setData 优化` · `mini-stores`
- **Protobuf 双轨策略：仅类型 vs 按需编解码** (trade-off · fullstack)
  Situation: pulling protobufjs runtime into the main bundle eats the budget, but pure JSON loses type safety. Task: balance type safety, bundle size and protocol evolution. Action: split proto into pb_just_json (types only) compiled by yarn gen:pb into a global rootProto .d.ts, and pb_need_decode whose runtime codec lives in the pkg-pb sub-package and is lazy-loaded via requireAsyncModule. Result: main bundle no longer carries encode/decode, JSON-only protocols cost almost nothing to add, binary paths evolve independently, and size versus DX are both satisfied.
  > Keywords: `protobuf` · `pkg-pb 分包` · `rootProto` · `包体积` · `类型安全`
- **HTTPClient + 图灵盾 + 伽利略 Aegis 的网络 / 风控 / 监控三件套** (reliability · frontend)
  Situation: the client has to juggle login state, multi-env switch, backend error codes, captcha and online monitoring. Task: hide these cross-cutting concerns from business code. Action: utils/httpClient wraps cookie, urlParams, env switch and backend error fallback; utils/turingSdk and turingSdkBehavior plug Turing-shield into login and key flows; utils/log wraps Aegis and the release pipeline auto-uploads sourcemaps. Result: business code calls APIs in one line, crash diagnosis jumps to source, and risk control has a single entry.
  > Keywords: `httpClient` · `turingSdk` · `Aegis` · `sourcemap` · `Behavior`
- **邮箱登录需求：从设计文档到 CR 闭环的一个研发样本** (feature · frontend)
  Situation: QQ Guild needs email login for users without a QQ account. Task: plug email and captcha into the existing login-panel while respecting design, UX and security. Action: start with a design doc at docs/superpowers/specs/2026-03-17-email-login-design.md; wire a mock to validate countdown, disabled state and placeholder styling; hook the real API plus Turing captcha; iterate through multiple CR rounds on button states, CDN icons and error copy; archive follow-ups at docs/superpowers/reviews/2026-03-19-email-login-followups.md. Result: email login ships stably in gray, the spec-to-review loop becomes a team template, and a reusable countdown captcha behavior falls out.
  > Keywords: `需求闭环` · `mock → 真接口` · `CR followups` · `Behavior` · `图灵盾`


## 🏗️ Architecture (architecture) — 3 Q&A

### Q1. How does guild_mp keep the main package under 2MB, and what drives sub-package partitioning and preloadRule?

> Source: `tp-01` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 微信小程序主包与分包、pkg-* 工具分包的体积规则 | 必须掌握 | 小程序工程化最基础的约束。 |
| app.json preloadRule 的 network / packages 语义与触发时机 | 必须掌握 | 低成本把二次跳转体验拉满的杠杆。 |
| 分包下载失败 / 超时的兜底 | 加分项 | 加分项，体现生产可用性敏感度。 |

#### Tiered answers

**🟢 Elevator**: Main bundle keeps four tabs and tabBar; 16 domain sub-packages split by business; preloadRule warms feed/assistant/tool after first tab.

**🔵 Standard** (default):

The main package strictly holds four tab pages (home, messages, me, guild home) plus a custom tab bar; all business surface goes into sub-packages. The 16 domain sub-packages are partitioned by product line: feed in pages-feed, chatroom IM in pages-chatroom, channel management split into shallow pages-manage and deep pages-manage-inner, AI assistant isolated in pages-wenwen. Heavy tooling like protobuf encode/decode and emoji lives in pkg-pb and pkg-worker. preloadRule is path-driven: after the first tab is ready we warm the highest-hit sub-packages (feed, assistant, tool, pkg-pb), leaving the rest for on-demand download. Net effect: main bundle under 2MB, fastest cold start, near-zero latency on secondary navigation.

<details><summary>🔴 Deep dive (click to expand)</summary>

We drew two hard boundaries up front: the 2MB cap and whether a page can leave the tab shell and enter business code. Only the four tabs and tab-bar component live in the main package. Sub-package partitioning follows three rules: business cohesion first (feed, chatroom, manage, wenwen each own a package); deep hierarchies get a second split (pages-manage for shallow navigation, pages-manage-inner for role, category, permission, app management); heavy cross-business tooling lives in tooling sub-packages (pkg-pb for protobuf runtime, pkg-worker for emoji helpers). preloadRule models three path kinds: near-certain next hop after first tab (feed, assistant, tool) is preloaded in app.json; dependency sub-packages (pkg-pb) are warmed right before likely trigger; cold paths such as pages-manage-inner stay on-demand. Cross-package calls always go through requireAsyncModule, making boundaries explicit, controllable and testable, while DEBUG_CONFIG simulates download latency or failure so we can validate fallback paths. The outcome is that the main bundle stays well under 2MB and new business only adds sub-packages and moduleRegistry entries. We enforce the budget in three layers. First, heavy features like guild-aio, channel-frame, square, square-feed, live-stream, kge-channel, qmusic-channel sit in their own subpackages; protobuf generated code goes to pkg-pb and worker scripts go to pkg-worker. Second, preloadRule only warms channel-frame and square after onLaunch — every other subpackage waits for requireAsyncModule. Third, CI fails the build if the main package crosses 2MB, and any new npm dep must be justified in review as main vs subpackage. The rules live in project.config.json and the build scripts, so they are auditable.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 微信官方文档 - 分包加载 / 分包预下载 (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
  - [ ] guild_mp docs/分包规则.md
- 🛠️ Hands-on
  - [ ] 空小程序压到 1.5M 以下，用 preloadRule 预加载一个分包并观察加载时序。
- ⚠️ Common pitfalls
  - 通用工具随手放主包 utils 导致悄悄逼近 2M。
  - preloadRule 配得太激进抢首屏带宽。
- 🤔 Self-check questions (answer without notes)
  - [ ] 怎么判断一个模块该放主包还是分包？
  - [ ] preloadRule 与独立分包、按需注入有什么区别？
- ⏱️ Estimated time: **1 day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If the main bundle overshoots 2MB by 20KB in one iteration, how would you locate and split?** (architecture)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/pages`
- `miniprogram/pages-feed`
- `miniprogram/pages-chatroom`
- `miniprogram/pages-manage`
- `miniprogram/pages-manage-inner`
- `docs/分包规则.md`

---

### Q2. How does requireAsyncModule keep TypeScript types while lazy-loading across sub-packages?

> Source: `tp-02` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 小程序 require / requireAsync API 与加载时序 | 必须掌握 | 懒加载的底层能力。 |
| TypeScript 泛型映射：keyof / mapped types / conditional types | 必须掌握 | moduleRegistry 强类型的支撑。 |
| 模块缓存与首次加载失败的重试 / 降级 | 加分项 | 加分项，生产鲁棒性。 |

#### Tiered answers

**🟢 Elevator**: A generic moduleRegistry maps keys to module types so await requireAsyncModule(key) returns a fully typed module.

**🔵 Standard** (default):

Native require across sub-packages returns any, which breaks autocomplete and refactoring. In utils/requireAsync.ts we declare a ModuleRegistry interface whose keys are logical paths (like pkg-pb/messagePb) and values are real module types, plus a MODULE_PATHS constant mapping to physical paths. requireAsyncModule<K extends keyof ModuleRegistry>(key: K) returns Promise<ModuleRegistry[K]>, so callers await it and get a typed module. DEBUG_CONFIG injects latency or failure for testing. Callers get a typed object with full IDE jump-to-definition and autocomplete, so async boundaries do not erode type safety.

<details><summary>🔴 Deep dive (click to expand)</summary>

This utility targets DX and safety for cross-sub-package calls. require(path) takes a runtime string, so TypeScript cannot resolve the real module across packages and falls back to any, breaking refactor and signature checks. We split the problem into three layers. Path layer: MODULE_PATHS maps logical keys like 'pkg-pb/messagePb' to physical paths. Type layer: ModuleRegistry interface whose values are real module types like typeof import('../pkg-pb/messagePb'). Capability layer: requireAsyncModule<K extends keyof ModuleRegistry>(key: K): Promise<ModuleRegistry[K]>, a typed wrapper around the platform's requireAsync. Callers write const mod = await requireAsyncModule('pkg-pb/messagePb') and get autocomplete and go-to-definition. workerUtils reuses the same registry for worker modules so every cross-package boundary collapses into one table. DEBUG_CONFIG exposes simulateDelayMs and simulateFailureRate, and we also memoize resolved modules to avoid repeated awaits. The implementation wraps requireAsyncModule. Every subpackage entry registers itself in moduleRegistry — key is the string path, value is a function returning Promise<Module>. A generic loadModule<K extends keyof Registry> infers the return type from Registry[K], so when business code writes const mod = await loadModule('square/feed-card'), mod has full typing for methods and fields. We added an ESLint rule that forbids calling raw requireAsyncModule in business code — everything must go through loadModule, so type safety cannot be bypassed. Another detail is loading state: loadModule centralizes timeout and retry, so callers do not write try/catch every time. Six months after this layer landed, we saw zero new bug reports about async loading or type loss.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 微信官方文档 - 分包异步化 requireAsync (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
  - [ ] TypeScript Handbook - Mapped Types (https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- 🛠️ Hands-on
  - [ ] 自己实现一个 10 行版 requireAsyncModule：带类型签名 + 缓存 + 超时。
- ⚠️ Common pitfalls
  - path 写死在调用点，路径改名时大范围改动。
  - 忘了缓存 Promise，同一模块被重复 requireAsync。
- 🤔 Self-check questions (answer without notes)
  - [ ] 没有 moduleRegistry 直接用 any 调用会出什么问题？
  - [ ] requireAsyncModule 怎么兼容 worker 端？
- ⏱️ Estimated time: **half a day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If moduleRegistry grows to hundreds of entries, how to keep it maintainable?** (architecture)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/utils/requireAsync.ts`
- `miniprogram/utils/moduleRegistry.ts`
- `miniprogram/utils/workerUtils.ts`
- `miniprogram/pkg-pb`
- `miniprogram/pkg-worker`

---

### Q3. How is the CDN image pipeline wired between local cdn-img, cdn-go and Orange-CI?

> Source: `tp-09` · scope: frontend · depth: 初级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| CDN / 对象存储工程化上传与路径替换模式 | 必须掌握 | 前端资产工程化的通用套路。 |
| CI / CD 流水线钩子与产物替换 | 加分项 | 加分项，体现对发布链路的完整感知。 |

#### Tiered answers

**🟢 Elevator**: Assets live in local cdn-img; CI uploads via cdn-go at release and rewrites utils/cdn.ts paths to online URLs.

**🔵 Standard** (default):

Image assets never sit in the main bundle; they live in miniprogram/cdn-img. utils/cdn.ts composes dev-local or prod-online URLs from logical paths. Orange-CI invokes cdn-go at release to upload assets to Tencent CDN, and rewrites online URLs back into business code based on cdn-changes.txt. Result: main bundle is free of image weight, new assets only drop into cdn-img, CI handles upload and rewriting. cdn-img keeps a local mapping table, cdn-go resolves the key to a runtime URL, and Orange-CI uploads changed assets to the CDN as a post-build step.

<details><summary>🔴 Deep dive (click to expand)</summary>

This pipeline addresses two problems: images cannot eat the 2MB quota, and developers should not hand-manage CDN URLs. We split into three layers. Source layer, miniprogram/cdn-img, a Git-tracked single source. Consumer layer, utils/cdn.ts, a helper that turns a logical path into a URL: local in dev, cdn-go URL in prod. Pipeline layer, Orange-CI, triggers a cdn-go script on release branches, scans cdn-changes.txt or build artifacts for new or changed images, uploads them to the CDN, and a post-build step in script/robot.config.js rewrites the online URL. Day-to-day work only touches cdn-img and utils/cdn.ts, no one writes raw https URLs, releases never miss an upload, and the same pipeline supports canary and rollback via incremental diff. The full flow works like this. During development, images live in src/assets/cdn-img with a stable key per file. Business code never writes URLs directly — it calls cdnGo('icon/feed-like'), and at runtime cdn-go resolves the key from a JSON mapping table to a CDN domain plus a hashed filename. At build time Orange-CI scans the directory, pushes changed images to the CDN, and updates the mapping JSON. Images never enter the mini-program bundle, the hash kills cache collisions, and rollbacks are just rolling back the mapping. The worst incident was someone hand-editing the mapping table and breaking production, so we added a CI check that rejects manual commits to that file — it has to come from the script.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 微信官方文档 - image 组件 (https://developers.weixin.qq.com/miniprogram/dev/component/image.html)
- 🛠️ Hands-on
  - [ ] 为 demo 写 cdn.ts 支持 dev/prod 切换并模拟 CI 替换。
- ⚠️ Common pitfalls
  - 忘了把大图走 CDN 悄悄把主包撑爆。
  - CI 替换未覆盖 WXSS background-image。
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 CDN 临时不可用，页面应该怎么兜底？
- ⏱️ Estimated time: **2 hours**


#### Evidence

- `miniprogram/cdn-img`
- `miniprogram/utils/cdn.ts`
- `cdn-changes.txt`
- `script/robot.config.js`

---

## 🧩 Feature (feature) — 2 Q&A

### Q1. How did you take email login from zero to one, and what review-driven learnings are worth highlighting?

> Source: `tp-10` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 登录 / 验证码类表单的状态机设计 | 必须掌握 | 避免各种竞态和重复提交。 |
| mock → 真接口的渐进式联调方法 | 必须掌握 | 保证前后端进度解耦。 |
| CR followups 作为团队知识资产沉淀 | 加分项 | 加分项，体现对团队成长的贡献。 |

#### Tiered answers

**🟢 Elevator**: Start with a design doc locking fields/states/fallbacks → wire a mock for interactions → hook real API plus Turing-shield → iterate CR on copy/buttons/icons → archive follow-ups.

**🔵 Standard** (default):

The requirement was to add email login to the QQ Guild mini-program. I began with docs/superpowers/specs/2026-03-17-email-login-design.md pinning down fields (email, captcha), state machine (empty / valid / sending / cooling / failed), visual specs, and fallbacks (already logged in, account switch, old base library). Then I wired a mock in login-panel to validate the countdown, button states and placeholder styling. With the mock stable, I hooked the real API (send captcha + login) and threaded Turing-shield's triggerCaptcha through. CR flagged several details: 60s countdown and the disabled button were not strictly synced, allowing multiple sends; placeholder color failed accessibility contrast; hard-coded CDN icon paths broke CI rewriting. After fixing I archived everything in docs/superpowers/reviews/2026-03-19-email-login-followups.md as a checklist for future login features.

<details><summary>🔴 Deep dive (click to expand)</summary>

I treated this as a full engineering loop. In the design phase I drew a state diagram exhausting field validation, button disable, countdown and captcha timing: valid input → click 'send code' → turingSdk triggerCaptcha → get ticket → call backend send-code API → 60s cooldown with disabled button and countdown. Each anomaly (invalid email, API failure, captcha failure, user double-click) mapped to a UI response. In the mock phase I used local timeouts to simulate latency and deliberately threw errors, so switching to the real API only required swapping URLs. After hooking the real API I handled two security concerns: the Turing-shield ticket is sent only to the backend and never stored locally; the login session cookie is written by HTTPClient, invisible to business code. The most valuable CR artifact was not a single fix but a login-feature onboarding checklist: (1) input-to-button-disable races must be managed by a state machine; (2) countdown must track server time rather than accumulating via setInterval; (3) icons must go through utils/cdn.ts; (4) error copy must come from the HTTPClient error object. The whole iteration took about a week and a half and around four CR rounds before gray release. On reflection, two design decisions stand out as worth repeating in future login-style features. First, treat the captcha + button-disable race as a state machine instead of two independent flags — debugging combined states is much easier when transitions are explicit. Second, never derive countdown from setInterval drift — always read server time. Both rules turned into platform conventions used by later flows.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] XState 官方文档（理解状态机） (https://stately.ai/docs/xstate)
  - [ ] guild_mp docs/superpowers/specs / reviews 目录
- 🛠️ Hands-on
  - [ ] 自己写一个邮箱 + 验证码登录组件，带完整状态机与 mock 兜底。
- ⚠️ Common pitfalls
  - 倒计时用 setInterval 累计，掉帧 / 熄屏后不准。
  - 按钮 disable 没和请求态联动，用户连点多次。
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么倒计时要以服务端时间为准？
- ⏱️ Estimated time: **1 day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If backend merges email and SMS captcha, how would you abstract it?** (feature)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/components/login-panel/login-panel.ts`
- `miniprogram/components/login-panel/login-panel.wxml`
- `miniprogram/utils/loginUtil.ts`
- `miniprogram/types/login.ts`
- `docs/superpowers/specs/2026-03-17-email-login-design.md`
- `docs/superpowers/reviews/2026-03-19-email-login-followups.md`

---

### Q2. How does the AI app card flow from click to navigation? How do aiAppApi, ai-app-card and link.ts cooperate?

> Source: `tp-13` · scope: fullstack · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 前端路由分发器的职责分层：数据 / 协议 / 跳转 | 必须掌握 | 让多目的地跳转可扩展。 |
| 一次性 ticket 在业务链路里的防伪作用 | 必须掌握 | AI 场景链接容易被伪造需要额外校验。 |
| 前端向后兼容：未知 type 的 fallback 设计 | 加分项 | 加分项，保证协议演进安全。 |

#### Tiered answers

**🟢 Elevator**: ai-app-card renders the card; on click aiAppApi fetches a ticket and link.ts dispatches to the target page or external path by protocol.

**🔵 Standard** (default):

AI app cards render inside posts and comments as the ai-app-card component with server-provided metadata (title, description, icon, action). On click the business calls aiAppApi.ticketExchange for a single-use ticket (ticket_exchange proto), then hands it to utils/link.ts for dispatch: internal paths wx.navigateTo with the ticket attached, while external or cross-scene paths degrade or invoke the launcher. feedUtil keeps AI card data rendering compatible with regular post content. Overall: card display, ticket exchange and route dispatch are decoupled. The point is that visual rendering, ticket exchange and route dispatch each evolve independently.

<details><summary>🔴 Deep dive (click to expand)</summary>

This path has to serve a tricky need: AI-generated content may embed cards pointing at many kinds of targets (internal pages, other mini-programs, external browsers), and needs ticket exchange to prevent forgery. The design decouples three things: (1) ai-app-card is pure rendering, only UI and click callback; (2) nt/api/aiAppApi runs the ticket_exchange proto request and returns ticket plus jump-target type; (3) utils/link.ts is the route dispatcher that pattern-matches the { type, target, ticket } triple: type === 'pagePath' uses wx.navigateTo; 'miniProgram' uses wx.navigateToMiniProgram; 'webview' assembles a webview URL; 'external' degrades to copy link or QR. The proto ticket_exchange is defined standalone, which signals fast evolution, so it stays on the pb_just_json track (type-safe plus JSON transport). We keep a fallback action so unknown types on old versions silently degrade instead of crashing. This way new AI capabilities only add one type and one link case, without touching the card component or the API shape. The most valuable thing about this design was minimizing the surface area of change. For every new AI card type, the frontend touched exactly two places — one route case in link.ts and one entry in the type enum. The card component, feedUtil and the ticket exchange path stayed stable. During the AI integration surge that landed roughly weekly, this design absorbed the churn without forcing component rewrites.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 微信小程序官方文档 - 页面跳转 API (https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)
- 🛠️ Hands-on
  - [ ] 写一个 mini 路由分发器，支持 4 种 type 并自带 fallback。
- ⚠️ Common pitfalls
  - 在 card 组件里硬编码跳转逻辑，扩展时全组件改。
  - 未知 type 不处理，低版本直接抛错白屏。
- 🤔 Self-check questions (answer without notes)
  - [ ] 票据如果泄露会怎样？怎么限制副作用？
- ⏱️ Estimated time: **half a day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If cards must support multimodal (image/video/3D), how would you evolve the protocol and layering?** (feature)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/nt/api/aiAppApi.ts`
- `miniprogram/pages-feed/components/ai-app-card/ai-app-card.ts`
- `miniprogram/utils/link.ts`
- `miniprogram/utils/feedUtil.ts`
- `proto/pb/pb_just_json/group_pro/feed_ai_app/ticket_exchange.proto`

---

## ⚡ Performance (performance) — 3 Q&A

### Q1. How is first-screen load accelerated from the feed list to the detail page, and what are prefetchManager's triggers and data flow?

> Source: `tp-03` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 意图信号（touchstart / hover）驱动的预取时序 | 必须掌握 | 决定预取能否真领先真实跳转。 |
| mini-stores 数据流与 miniprogram-computed 脏检查 | 必须掌握 | 预数据要通过 store 推到视图，避免反复 setData。 |
| 请求并发 / TTL / 去重缓存策略 | 加分项 | 加分项，极端场景鲁棒性。 |

#### Tiered answers

**🟢 Elevator**: Click intent triggers prefetchManager to fetch detail API early; results land in PreDataStore and the detail page consumes them directly.

**🔵 Standard** (default):

Feed list items subscribe to pre-click signals (hover or touchstart) and trigger utils/prefetch/prefetchManager to fetch the detail API. The response is lightly normalized and stored into FeedPrefetchStore and PreDataStore / FeedDetailPreDataStore. Detail page boots by first querying pre-data: on hit it setData's a skeleton immediately while still firing the real request for completeness; on miss it takes the regular path. Under normal network the detail feels instant while miss path keeps default UX. On Feed touchstart we already start fetching the detail data and stash it in PreDataStore, so the detail page reads from cache on mount.

<details><summary>🔴 Deep dive (click to expand)</summary>

We split feed-to-detail into four segments: trigger, fetch, cache, consume. Trigger skips tap (navigation fires simultaneously, no gain) in favor of touchstart or hover as intent signals, giving requests a 100–300ms head start. Fetch enforces concurrency cap (avoid dozens of parallel requests on fast scroll), TTL (expire stale), and dedup (same postId refetched only after cooldown). Cache layer PreDataStore is a mini-stores store; the detail page resolves FeedDetailStore via requireAsyncModule and merges pre-data in. Consumer first setData renders a skeleton from pre-data while the real request runs in parallel to backfill comments and preload images; on hit we diff-merge, on miss we fall back. miniprogram-computed avoids redundant renders. After release, Aegis timing showed detail first-screen time shrinking, and we unified the source of truth to kill a long-standing context-menu vs detail mismatch. prefetchManager fires at two levels. Level one is scroll-driven: an IntersectionObserver watches Feed cards, and once a card has been in viewport for over 200ms its detail id goes into an idle queue, drained at wx.nextTick one item at a time by priority. Level two is intent-driven: a touchstart on a card fires the request immediately, bypassing the queue. Responses land in PreDataStore keyed by detail id with a 60s TTL; on detail onLoad we read PreDataStore first and only hit the network on miss. We pulled this layer out because the old code spread wx.request everywhere with no concurrency control. With prefetchManager we have a hard cap on inflight requests and backoff on failure, and the whole path got predictable.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] mini-stores 仓库 README (https://github.com/Tencent/mini-stores)
  - [ ] Web Prefetch 相关 MDN 文档 (https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)
- 🛠️ Hands-on
  - [ ] demo 里实现 touchstart 预取并用 DevTools 网络面板量化首屏时间。
- ⚠️ Common pitfalls
  - tap 时才触发预取，几乎没有收益。
  - 预取与真实数据未 diff 合并导致闪烁。
- 🤔 Self-check questions (answer without notes)
  - [ ] 预取失败时如何不阻塞真实请求？
  - [ ] 怎么量化预取的收益？
- ⏱️ Estimated time: **1 day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Could prefetch starve the real request on weak network?** (performance)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/utils/prefetch/prefetchManager.ts`
- `miniprogram/store/FeedPrefetchStore.ts`
- `miniprogram/store/PreDataStore.ts`
- `miniprogram/store/FeedDetailPreDataStore.ts`

---

### Q2. What does miniprogram-computed solve compared with hand-written setData, and why a dedicated rules file?

> Source: `tp-04` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| setData 的性能模型与 Native Bridge 成本 | 必须掌握 | 所有渲染优化的起点。 |
| 响应式派生：Vue / MobX computed 的脏检查机制 | 必须掌握 | 理解 miniprogram-computed 的行为边界。 |
| list 的引用稳定性与 shallow compare | 加分项 | 加分项，决定大列表是否真省渲染。 |

#### Tiered answers

**🟢 Elevator**: Derive view data via computed to avoid the churn and inconsistency of hand-rolled setData combinations.

**🔵 Standard** (default):

Every setData triggers diff plus render-layer sync; hand-rolled combinations that forget to merge push many small payloads. miniprogram-computed lets us declare derived fields over a store source; the framework dirty-checks and only setData's when the derived value really changed, naturally avoiding churn and inconsistency. We once hit a bug where context menu and feed detail disagreed on the liked state because both places computed state independently. We migrated both to computed and distilled miniprogram-computed-data-rules (no side effects, no cycles) based on the scars.

<details><summary>🔴 Deep dive (click to expand)</summary>

setData is the costly primitive in mini-programs. Common derivation failures: same derived value computed in multiple places (context menu vs feed detail liked state); one store mutation fans out over several setData paths; view data pushed into the store forcing all subscribers to re-render. Our pattern: store holds only raw models (postEntity, likeStatusMap), all derived view data is declared in computed, computed is pure with no side effects or API calls. The framework skips setData on equality; combined with immutable updates, render counts drop sharply. Key rules: (1) computed must be pure; (2) never compute the same derived value twice—promote to a shared store; (3) avoid non-computed fields from this.data to dodge cycles; (4) for list-style computed keep referential stability; (5) never depend on async outputs directly—write to store first, then derive. The rules file became onboarding reading and a CR checklist and drove recurrence down. The other thing worth noting is the developer experience. Before computed, setData calls were spread by hand everywhere — every state change had to remember to call setData and every miss caused dirty UI. After miniprogram-computed, business files barely contain setData at all; you see store writes and derived declarations only. On Feed lists the difference is visible: a single like used to setData the whole row, now only the derived flag is touched, and long-list scrolling stays smooth.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] miniprogram-computed 官方 README (https://github.com/wechat-miniprogram/computed)
  - [ ] guild_mp .codebuddy/rules/miniprogram-computed-data-rules.mdc
- 🛠️ Hands-on
  - [ ] 对比纯 setData 与 computed 在频繁更新下的 setData 次数。
- ⚠️ Common pitfalls
  - 在 computed 里发请求或写 this.setData。
  - list computed 每次返回新引用导致整列重渲染。
- 🤔 Self-check questions (answer without notes)
  - [ ] computed 依赖异步数据时怎么处理？
  - [ ] computed 与 observer 有什么区别？
- ⏱️ Estimated time: **half a day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Does deep dependency chain in computed still perform well?** (performance)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/store/GuildFeedStore.ts`
- `miniprogram/pages-feed/store/FeedDetailStore.ts`
- `miniprogram/behaviors/contextMenuEmitterInitBehavior.ts`
- `.codebuddy/rules/miniprogram-computed-data-rules.mdc`

---

### Q3. How does the chatroom AIO handle long lists and polling, and what is different about the skyline virtual list?

> Source: `tp-11` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 虚拟列表的可视窗口、回收与定高 / 变高测量 | 必须掌握 | 任何长列表性能讨论的核心。 |
| skyline vs WebView 渲染器的差异 | 必须掌握 | 决定是否启用 skyline 与回退策略。 |
| IM 消息乐观更新、id 映射与失败重试 | 加分项 | 加分项，用户可感知体验。 |

#### Tiered answers

**🟢 Elevator**: SendMsgHelper handles sends, guildMsgPollingService handles polling, virtual-list and virtual-list-skyline cover WebView and skyline renderers.

**🔵 Standard** (default):

The AIO message flow has three responsibilities. Sending goes through SendMsgHelper with optimistic updates, retry and local state. Receiving runs via guildMsgPollingService polling plus localReadMsgSeqCache tracking read seq. Rendering uses two virtual lists: virtual-list for WebView and virtual-list-skyline for skyline. Skyline skips WebView rendering for smoother scrolling but has API limits, so we enable it only on supported devices and fall back to WebView otherwise. The underlying data source is a PullStore fed by SendMsgHelper via event emit; the list component just subscribes.

<details><summary>🔴 Deep dive (click to expand)</summary>

Long-list IM has three hard constraints: messages keep growing, scrolling is high-frequency, states are rich. Our design is single responsibility plus dual renderer. Send layer SendMsgHelper wraps optimistic updates: insert a pending message on submit, map local id to server id, replace on success, switch UI and offer retry on failure. Receive layer uses long polling with backoff (slow in idle, tight in active) and localReadMsgSeqCache persists read seq locally so reopening a group does not re-mark all messages unread. Render layer shares a windowing abstraction (visible window plus fixed/variable-height measurement) across two renderers: virtual-list in WebView recycles DOM like recycle-view, virtual-list-skyline rides skyline for smoother frames at the cost of a restricted WXML subset. Capability detection in the component picks the renderer. SendMsgHelper and the lists communicate via events, so sending only injects into the data source and the view decides how to render—swapping renderers does not touch business. A few pitfalls worth mentioning. The biggest skyline constraint is its WXML subset — rich-text cards fall back to the WebView path, so every message component carries a capability flag picking the render path. Second is scroll restoration: when the user comes back from background we need to jump to the last unread anchor; both virtual lists persist anchor seq, but skyline has different scroll APIs so we use scroll-into-view with an offset correction. Third is recall visual latency: the recall event hits PullStore first, marks the row as deleted, and lets the virtual list decide the transition, instead of mutating the DOM directly.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 微信官方文档 - skyline 渲染引擎 (https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
  - [ ] recycle-view / virtual-list 开源实现 (https://github.com/wechat-miniprogram/recycle-view)
- 🛠️ Hands-on
  - [ ] 实现一个能跑 5000 条消息的 virtual-list 并测帧率。
- ⚠️ Common pitfalls
  - skyline 里用 WebView 专属语法导致白屏。
  - 乐观更新没做 id 替换导致消息重复。
- 🤔 Self-check questions (answer without notes)
  - [ ] polling 落后于用户输入怎么避免错序？
  - [ ] 未读 seq 多端登录怎么同步？
- ⏱️ Estimated time: **1–2 days**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Is the skyline-to-WebView fallback decided at runtime or build time?** (performance)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/pages-chatroom/nt/service/SendMsgHelper.ts`
- `miniprogram/pages-chatroom/nt/service/guildMsgPollingService.ts`
- `miniprogram/pages-chatroom/nt/service/localReadMsgSeqCache.ts`
- `miniprogram/pages-chatroom/text/components/virtual-list`
- `miniprogram/pages-chatroom/text/components/virtual-list-skyline`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. What responsibilities does the unified HTTPClient shoulder in guild_mp, and how does it handle backend errors and multi-env switching?

> Source: `tp-06` · scope: frontend · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| HTTP 请求封装的经典分层：拦截器 / 适配器 / 错误分发 | 必须掌握 | 所有网络层的基础。 |
| statusCode vs 业务 code 的错误分层 | 必须掌握 | 决定业务层的错误处理体验。 |
| 幂等性与重试 / 退避策略 | 加分项 | 加分项，避免重试带来重复写入。 |

#### Tiered answers

**🟢 Elevator**: A single request entry injects cookies/signatures, assembles host by env, dispatches backend errors by code and returns a uniform Promise.

**🔵 Standard** (default):

utils/httpClient/index.ts exposes only a single request entry that wires four concerns: cookies.ts injects local login state into headers; env (dev/test/pre/prod) picks the host at build time; urlParams.ts assembles the query; and on response we dispatch by backend code: ok passes data through, expired login triggers re-auth, rate-limit or risk-control throws a recognizable error so business decides to toast or retry. Business code only writes api.getFeed(params).then(data => ...) with cross-cutting concerns buried. The implementation is a single httpClient module exposing get/post, internally a pipeline of interceptors.

<details><summary>🔴 Deep dive (click to expand)</summary>

The network layer must serve several reliability goals at once: login state, env switching, error fallback, observability and re-entrancy. HTTPClient owns them all. Login state injection is done by cookies.ts pasting local cookies into headers so no API repeats the work. Env switching is injected at build time rather than decided at runtime, preventing accidental prod hits. Error handling uses two layers: statusCode and backendCode. Non-2xx throws a network error and reports immediately. 2xx then inspects backendCode: 0/200 success; expired login (e.g. -2001) triggers the reLogin flow; risk control or rate limit (4xxxxx series) throws a recognizable BizError so the business decides toast or degrade; unrecognized codes throw UnknownError and report to Aegis to surface new codes. Observability logs a custom timing record per request and reports anomalies to Aegis. Re-entrancy: idempotent APIs carry bounded retry with backoff; non-idempotent ones (posting) fire only once. We also landed an error-copy standard so the UI never splices error descriptions—always reads from the error object produced by HTTPClient. A concrete example from the email-login launch week: an intermittent 401 was leaking through. The old pattern would force every caller to recheck the code and re-auth. I added a single rule in the response interceptor — when the auth-failure code is seen, broadcast a logout event and let AppStore centralize token cleanup and navigation. Every 401 across the app got caught in one place, with no change to business code. This kind of centralization matters a lot in mini-programs because the page stack and async chains make scattered try/catch dangerous.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] axios / wx.request 的拦截器设计 (https://axios-http.com/docs/interceptors)
  - [ ] guild_mp utils/httpClient 源码
- 🛠️ Hands-on
  - [ ] 实现一个 mini-axios：支持 interceptor + 统一错误分发。
- ⚠️ Common pitfalls
  - 不区分网络错误与业务错误，toast 显示『请求失败』被用户误解。
  - 对非幂等接口做自动重试导致脏写。
- 🤔 Self-check questions (answer without notes)
  - [ ] 登录态失效时应由 HTTPClient 直接弹登录还是抛错给业务？
  - [ ] 怎么防止同一接口在 token 刷新时雪崩？
- ⏱️ Estimated time: **1 day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Would you evolve HTTPClient into a higher-level query framework with batching/dedup?** (reliability)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/utils/httpClient/index.ts`
- `miniprogram/utils/httpClient/cookies.ts`
- `miniprogram/utils/httpClient/urlParams.ts`

---

### Q2. How does the client fall back when comment or like hits backend rate limits, and what did the reliability review teach you?

> Source: `tp-12` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 乐观更新的回滚与一致性保证 | 必须掌握 | 是决定乐观更新成败的关键。 |
| 错误码枚举集中管理的工程价值 | 必须掌握 | 避免相同坑在不同业务重现。 |
| 限频 / 冷却的 UI 反馈模式 | 加分项 | 加分项。 |

#### Tiered answers

**🟢 Elevator**: On a rate-limit code the client rolls back the optimistic update, toasts the user, and records it in FeedCommentStore to avoid repeated triggers.

**🔵 Standard** (default):

Previously we optimistically updated the UI and then fired the request. When the backend rate-limited, it returned a dedicated code but the client ignored it—so the UI stayed in liked state while nothing was persisted. After the review we fixed the like callbacks in comment-item / reply-item to: revert on the rate-limit code, toast 'too frequent, please try later', and record a short cooldown in FeedCommentStore during which the like button stays disabled for that comment. We also filled the backend code enum into the network layer to prevent other APIs from hitting the same trap.

<details><summary>🔴 Deep dive (click to expand)</summary>

This bug yielded several reliability lessons. First, optimistic updates need symmetric rollbacks: wherever we optimistically apply a change, we must handle success, failure, rate-limit and unknown, not just success. Second, error codes must be enumerated at the network layer, not scattered per feature—otherwise the next API will hit the same trap. Third, rate-limit needs a UI cooldown: a toast alone does not stop repeated taps, so we disable the button until the backend cooldown passes. Fourth, every review leaves an artifact: we walked through the commits, distilled an 'optimistic action checklist' into docs/superpowers/reviews (must-handle error codes, UI cooldown spec, test suggestions) so new optimistic paths can self-check before release. Post-fix, the UI-vs-data inconsistency regressions dropped noticeably. My biggest personal takeaway from that postmortem: every optimistic update has to declare who owns the rollback before launch. I used to bury revert logic in the request catch — looked clean but easy to skip. We standardized on stores exposing revert methods and UI only emitting intents. The second habit: throttle-like backend codes must live in the network-layer enum, not scattered in business files. Both habits stuck through later features. These days, any CR that touches an optimistic update gets one mandatory question up front: where does the revert live? It became a baseline review rule for the whole team. It also forced cleaner unit tests around revert paths.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] React Query optimistic update 文档 (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- 🛠️ Hands-on
  - [ ] 给 demo 加乐观点赞并故意让后端返回限频，验证回滚 + 冷却。
- ⚠️ Common pitfalls
  - 乐观更新只写成功分支。
  - 只 toast 不 disable 按钮，用户继续狂点。
- 🤔 Self-check questions (answer without notes)
  - [ ] 限频是用服务端 code 还是客户端计数判断？
- ⏱️ Estimated time: **3 hours**


#### Evidence

- `miniprogram/pages-feed/components/comments/comment-item/comment-item.ts`
- `miniprogram/pages-feed/components/comments/reply-item/reply-item.ts`
- `miniprogram/pages-feed/store/FeedCommentStore.ts`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. How is production monitoring done in guild_mp, and how does the sourcemap integrate with Aegis?

> Source: `tp-08` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| JS 异常捕获：window.onerror / unhandledrejection / 小程序 App.onError | 必须掌握 | 前端监控的基础入口。 |
| sourcemap 的安全与构建 / 上传流程 | 必须掌握 | 决定异常栈能否映射回源码。 |
| 核心指标定义：FCP / 自定义业务指标 | 加分项 | 加分项，说明观测性落地。 |

#### Tiered answers

**🟢 Elevator**: Use Tencent Aegis (@tencent/aegis-mp-sdk-v2) for error and performance reporting; the release pipeline auto-uploads sourcemaps so stacks land on source files.

**🔵 Standard** (default):

utils/log initializes Aegis (project id, user identifier, env tag) and takes over console.error, Promise rejection and onError. Business code calls logger.error or logger.perf; Aegis collects JS exceptions, custom reports and API timings. The release branch's Orange-CI pipeline pushes the sourcemap to Aegis after bundling, so the online view shows miniprogram/xxx/yyy.ts instead of build output. The upshot is online-error triage went from minutes to seconds — you see the source line, the call stack, and the user context directly. The downside is one extra pipeline step that reviewers must remember not to drop from the publish script.

<details><summary>🔴 Deep dive (click to expand)</summary>

Observability has three layers: JS exceptions, business events, performance metrics. The Aegis SDK auto-hooks global error and Promise rejection; utils/log's logger.error passes through before Aegis.report. Business events go through logger.info/warn with custom keys, like prefetch hit rate or login success. Performance metrics use logger.perf for custom timing, on top of Aegis's built-in network and first-screen metrics. The key engineering work is the sourcemap pipeline: builds emit sourcemaps but do not bundle them (code protection); the release pipeline's post-build step in script/robot.config.js uploads the sourcemap to Aegis keyed by version; production errors carry version plus stack frames, and the Aegis backend maps to source lines. Risks: (1) missing sourcemap upload (on the release checklist); (2) never ship sourcemap with the bundle; (3) bind the user identifier only after login so anonymous errors are not attributed to the wrong user. The outcome is faster online diagnosis and data-backed CR trade-offs. We also tier Aegis usage rather than dumping every log. Our rules in production: sampled latency reporting for hot APIs to protect quota, full JS-error reporting tagged with page and user level for aggregation, and business events on a separate logger.biz channel so they do not mix with errors. This came from a bad period where Aegis was flooded with hot-API logs and the critical exceptions got buried. Tiering log severity also helped trim Aegis costs.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Tencent Aegis 官网 / 接入文档 (https://aegis.qq.com/)
  - [ ] MDN - Source map (https://developer.mozilla.org/en-US/docs/Glossary/Source_map)
- 🛠️ Hands-on
  - [ ] 在 demo 里接一个监控 SDK，构造错误并验证源码映射。
- ⚠️ Common pitfalls
  - sourcemap 跟包一起上线。
  - 用户 id 匿名态绑定导致串号。
- 🤔 Self-check questions (answer without notes)
  - [ ] 线上只看到 aa.js:1 这种乱码栈时，怎么排查？
- ⏱️ Estimated time: **half a day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Mini-program has no window—where does onerror plug in?** (observability)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `miniprogram/utils/log`
- `script/robot.config.js`
- `CLAUDE.md`
- `README.md`

---

## 🔒 Security (security) — 1 Q&A

### Q1. How is Turing-shield turingSdk integrated, and what role does it play in login and key operations?

> Source: `tp-07` · scope: frontend · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 小程序 Behavior 的注入机制 | 必须掌握 | turingSdkBehavior 能复用到任何组件的前提。 |
| ticket / challenge-response 模式在风控中的作用 | 必须掌握 | 验证码只有一次性 ticket 才有防伪能力。 |
| 前端安全的边界：客户端绝不是最终校验 | 加分项 | 加分项，纠正常见误区。 |

#### Tiered answers

**🟢 Elevator**: turingSdkBehavior injects via Behavior; login and key operations call turingSdk for a ticket, which the backend verifies for risk control.

**🔵 Standard** (default):

utils/turingSdk wraps Turing-shield SDK init and captcha calls; utils/turingSdkBehavior is a mini-program Behavior injected into risk-sensitive components (e.g. login-panel) so a page only calls this.triggerCaptcha(action) to get a ticket. The backend validates ticket + userId + action with Turing-shield to block script abuse on key paths (login, email captcha, posting). The client only handles UI state (captcha layer, failure hint); the real security check lives on the server. In short, the frontend owns triggering and feedback while the backend owns the real risk decision; this split kept responsibilities clean across the integration.

<details><summary>🔴 Deep dive (click to expand)</summary>

Risk-control integration needs to detect bots on key paths without hurting legitimate users. The pattern is front-end trigger plus server verification via a ticket. On the client side, utils/turingSdk owns the SDK lifecycle (lazy load, singleton, callback cleanup) and utils/turingSdkBehavior attaches a triggerCaptcha method to components, bundling the show-captcha / get-ticket / return-ticket loop. Key actions (login, email captcha, posting, commenting) call triggerCaptcha before the request and send the ticket along; the server asks Turing-shield to judge ticket + userId + action and gets back pass / block / secondary_verify, which the client surfaces. To minimize friction, Turing-shield cascades from silent verification to slider to SMS, only escalating when risk rises. The Behavior also includes idempotency: while a triggerCaptcha is pending for the same action, it will not pop another layer, avoiding duplicate requests from accidental double taps. The core security property is that tickets are single-use and validated server-side, so the client cannot bypass. Two pitfalls I hit while wiring up Turing for email login. First, ticket reuse — I once cached a ticket for 30 seconds to cut down on captcha popups, and review pushed it back because reused tickets carry replay risk; the correct rule is one validation per critical action. Second, the failure path — you cannot just toast the user, you have to reset the action back to its untriggered state, otherwise the next tap sees a still-disabled button. Both rules went into the login checklist afterwards.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 腾讯防水墙 / 图灵盾官方文档（需内部权限）
  - [ ] OWASP Automated Threats to Web Applications (https://owasp.org/www-project-automated-threats-to-web-applications/)
- 🛠️ Hands-on
  - [ ] 给 demo 接入一个开源 captcha SDK，走一遍『前端拿 ticket → 后端验证 → 接口放行』全流程。
- ⚠️ Common pitfalls
  - 把风控结果仅在前端校验。
  - 短时间重复弹验证码导致用户烦躁。
- 🤔 Self-check questions (answer without notes)
  - [ ] ticket 若被复用会怎样？服务端应当怎么防御？
- ⏱️ Estimated time: **half a day**


#### Evidence

- `miniprogram/utils/turingSdk`
- `miniprogram/behaviors/turingSdkBehavior.ts`
- `miniprogram/components/login-panel/login-panel.ts`

---

## ⚖️ Trade-off (trade-off) — 1 Q&A

### Q1. Why pick the protobuf types-only plus pkg-pb dual-track strategy? Is there a simpler alternative?

> Source: `tp-05` · scope: fullstack · depth: 高级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Protocol Buffers：字段规则、wire format、兼容性原则 | 必须掌握 | 讨论 protobuf 选型绕不开。 |
| JSON vs binary 的协议演进风险对比 | 必须掌握 | 决定哪些字段敢用 JSON 传。 |
| 类型生成：.d.ts 挂全局 namespace 的可维护性 | 加分项 | 加分项，影响 DX。 |

#### Tiered answers

**🟢 Elevator**: Pure JSON loses types; full protobufjs bloats the main bundle. We pick types-only plus lazy-loaded encode/decode sub-package to balance DX and size.

**🔵 Standard** (default):

Option A pure JSON: simple and small but loses type safety and protocol-evolution correctness. Option B full protobufjs: type-safe and binary-compatible but tens of KB runtime plus code balloons the main bundle. We pick C: split proto into pb_just_json (types only, JSON transport) and pb_need_decode (binary codec needed). The former is compiled by yarn gen:pb into a global rootProto .d.ts consumed at zero cost; the latter's codec lives in the pkg-pb sub-package and is lazy-loaded via requireAsyncModule. The cost is one more proto-dir split and a moduleRegistry entry; the gain is a main bundle free of codec and near-zero cost for JSON-only protocols.

<details><summary>🔴 Deep dive (click to expand)</summary>

A classic three-way trade-off: bundle size vs type safety vs maintenance. Pure JSON is simplest but handwritten types drift easily over many messages and oneofs/enums/nested types; full protobufjs has best safety but the runtime is too heavy for the main bundle; our dual track sits in the middle with the best payoff. (1) JSON protocols use a 'types-attached' pattern: proto is the single source of truth, .d.ts is generated into a global rootProto namespace, business code uses rootProto.xxx.IMessage without importing runtime. (2) Protocols that truly need binary or cross-language compatibility go into pb_need_decode, compiled to ESM and placed in pkg-pb. (3) moduleRegistry exposes 'pkg-pb/xxxPb' as a typed module; business awaits requireAsyncModule once to get encode/decode. Cost: engineers must decide which route a protocol takes, and maintain the dir split. Gain: tens of KB off the main bundle and near-zero cost for new JSON protocols. Selection rules we wrote: high-frequency small data (likes, counters) stays JSON; AI streaming and IM messages go binary; cross-client shared protocols prefer binary for consistency. One more thing: team adoption was incremental. Initially only IM used binary, and people were hesitant to spread it; later AI streaming needed smaller payloads and stricter parsing, which is when we extracted pkg-pb. Only after cross-client shared protocols grew did the rules get codified in docs/superpowers/recipes. The takeaway: phase engineering trade-offs — validate with the smallest cost first, write the rules down after.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] protobufjs 官方文档 (https://github.com/protobufjs/protobuf.js)
  - [ ] Protocol Buffers Encoding (https://protobuf.dev/programming-guides/encoding/)
- 🛠️ Hands-on
  - [ ] 用 protoc 生成同一 proto 的 JSON 版本与 binary 版本，量化包体积差异。
- ⚠️ Common pitfalls
  - 把 encode/decode 直接 import 进主包。
  - JSON 传输时字段大小写 / 枚举序列化不一致。
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果后端想把某个接口从 JSON 切成二进制，前端要怎么改？
- ⏱️ Estimated time: **1 day**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If the main bundle is still tight, would you split rootProto.d.ts on demand?** (trade-off)
  > Building on the main deep_dive answer, address the follow-up with trade-offs, approach and concrete landing plan.


#### Evidence

- `proto/pb/pb_just_json`
- `proto/pb/pb_need_decode`
- `miniprogram/pkg-pb`
- `proto/typings/pb_just_json.d.ts`

---

