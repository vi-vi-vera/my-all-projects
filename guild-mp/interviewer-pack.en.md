# QQ 频道小程序 (guild_mp) — Interviewer Question Pack

> Mode: interviewer · Role: 前端工程师（微信小程序 / 内容社区方向） · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 3 questions

### Q1. How is the 2MB main-bundle cap actually held in guild_mp, and what principles do you use to decide whether a new module belongs to the main package or a specific sub-package?

> id: `iq-01` · source tech-point: `tp-01` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/pages`
- `miniprogram/pages-feed`
- `miniprogram/pages-chatroom`
- `miniprogram/pages-manage`
- `miniprogram/pages-manage-inner`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If one iteration overshoots the cap by 20KB, what levers do you have on the front-end, build and backend sides, and which path stops the bleed fastest?** (reliability)
- ⚖️ **If an aggressive preloadRule slows the first tab's cold start, how do you tell whether preload bandwidth contention is the real cause?** (observability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers the hard rule that only tabs and tabBar belong in the main package, and explains why pkg-pb / pkg-worker are tooling sub-packages. | Correctly states the 2MB cap and names business-domain sub-packages like feed, chatroom and manage. | Vague 'use sub-packages' answer without specifying what may or may not live in the main package. |
| 取舍意识 | 0.30 | Points out that aggressive preloadRule can starve the first tab and proposes a 'must-come / dependency / cold-path' tiering. | Recognizes preloadRule has a cost and names at least one case that should stay on-demand. | Treats preloadRule as always-better or cannot articulate any side effect. |
| 失败教训复盘能力 | 0.30 | Recalls a specific near-cap incident, names the analysis tool (bundle size report / util relocation) and the preventive measure adopted. | Names at least one common pitfall (like utilities accidentally landing in the main package) and a fix direction. | No recollection of any real incident; stays purely at 'in theory it might overflow'. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Why wrap another layer on top of the native requireAsync with requireAsyncModule? What concrete problems show up if moduleRegistry is missing?

> id: `iq-02` · source tech-point: `tp-02` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/utils/requireAsync.ts`
- `miniprogram/utils/moduleRegistry.ts`
- `miniprogram/utils/workerUtils.ts`
- `miniprogram/pkg-pb`
- `miniprogram/pkg-worker`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **When a sub-package first-load fails, what should requireAsyncModule expose to callers, and who owns the error UI, retry and degraded path?** (reliability)
- ⚖️ **When moduleRegistry grows to hundreds of entries, how do you keep keys unique and prevent colleagues from quietly breaking the typed signatures?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains the three layers: ModuleRegistry interface, MODULE_PATHS constant and requireAsyncModule, and recites the <K extends keyof Registry> signature. | Describes the 'registry + generics = type safety' idea and notes that without it callers fall back to any. | Confuses require vs requireAsync or falsely claims TypeScript auto-infers cross-package types. |
| 取舍意识 | 0.30 | Calls out the long-term maintenance cost of one registry and proposes splitting by domain or generating it automatically. | Acknowledges registry bloat and names at least one mitigation. | Ignores scale cost or believes hand-maintenance scales forever. |
| 失败教训复盘能力 | 0.30 | Cites a real bug uncovered by DEBUG_CONFIG's simulated sub-package failure and how it tightened the QA loop. | Knows they should test sub-package download failure but lacks a concrete case. | Never considered sub-package load failure nor validated fallbacks pre-release. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. Along the local cdn-img → cdn-go → online-URL path, which step fails most often in your experience?

> id: `iq-09` · source tech-point: `tp-09` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/cdn-img`
- `miniprogram/utils/cdn.ts`
- `cdn-changes.txt`
- `script/robot.config.js`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Could WXSS background-image be missed by the CI rewrite? How do you verify before release?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Strings together cdn-img source → utils/cdn.ts consumer → Orange-CI cdn-go upload & rewrite, and notes dev/prod branching. | Explains the basic 'local asset + CI URL rewrite' idea. | Assumes assets must be uploaded and pasted manually. |
| 取舍意识 | 0.30 | Analyzes degradation when the CDN is down (local fallback, delayed retry) and weighs the options. | Acknowledges CDN outages and offers one fallback. | Ignores CDN outages entirely. |
| 失败教训复盘能力 | 0.30 | Shares the story of WXSS background-image missed by CI rewrite and the fix. | Names at least one case the CI rewrite tends to miss. | Believes CI rewriting is foolproof. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 2 questions

### Q1. Where did you start on the email-login feature? If you had to compress design-doc, mock and real-API into fewer stages, which would you cut?

> id: `iq-10` · source tech-point: `tp-10` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/components/login-panel/login-panel.ts`
- `miniprogram/components/login-panel/login-panel.wxml`
- `miniprogram/utils/loginUtil.ts`
- `miniprogram/types/login.ts`
- `docs/superpowers/specs/2026-03-17-email-login-design.md`
- `docs/superpowers/reviews/2026-03-19-email-login-followups.md`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If the 60-second countdown is driven by a cumulative setInterval, how many failure scenarios can you enumerate?** (reliability)
- ⚖️ **For recurring CR comments, how did you push the lesson into team-wide knowledge rather than stopping at a one-person fix?** (feature)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Sketches the email-login state machine (empty / valid / sending / cooling / failed) and locates the turingSdk ticket in the flow. | Walks the four stages: design doc → mock → real API → CR. | Just says 'added login' without discussing validation, button state or cooldown. |
| 取舍意识 | 0.30 | Explains why the countdown should track server time instead of accumulated setInterval and why mock and real-API stages shouldn't be collapsed. | Recognizes mock-stage value and names one benefit of the state machine. | Believes mock stage is wasted effort and prefers jumping to the real API. |
| 失败教训复盘能力 | 0.30 | Quotes at least two fixes from the follow-ups doc (button state, CDN icon, placeholder contrast) and articulates the checklist's lasting value. | Names at least one recurring CR issue and its fix. | Cannot recall any concrete CR issue beyond 'team reviewed it'. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. In the AI-app-card click-to-navigate chain, what does ticket_exchange actually guarantee? What breaks without it?

> id: `iq-13` · source tech-point: `tp-13` · scope: fullstack · miniprogram · depth: 中级

#### Evidence

- `miniprogram/nt/api/aiAppApi.ts`
- `miniprogram/pages-feed/components/ai-app-card/ai-app-card.ts`
- `miniprogram/utils/link.ts`
- `miniprogram/utils/feedUtil.ts`
- `proto/pb/pb_just_json/group_pro/feed_ai_app/ticket_exchange.proto`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **For an unknown card type on an old base-library, do you silently degrade or prompt the user to upgrade, and why?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Separates ai-app-card (pure render), aiAppApi (ticket_exchange) and utils/link.ts (type-based dispatch) and gives concrete examples for miniProgram / webview types. | Describes the three-step flow 'card tap → ticket exchange → route dispatch'. | Sees card navigation as a direct navigateTo and misses the ticket's role. |
| 取舍意识 | 0.30 | Discusses silent degradation vs upgrade prompt for unknown types and ties the decision to base-library compatibility. | Knows unknown types require a fallback and names one implementation. | Throws on unknown type and breaks old base-library users. |
| 失败教训复盘能力 | 0.30 | Cites a protocol-evolution mismatch incident and explains how pb_just_json type-driven fixes landed. | Names at least one AI-link change or regression handled. | Only describes 'adding a new card' without touching evolution concerns. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚡ Performance (performance) — 3 questions

### Q1. How did you design the feed-to-detail prefetch chain? Specifically: what triggers it, how do you measure hit rate and how does the fallback work?

> id: `iq-03` · source tech-point: `tp-03` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/utils/prefetch/prefetchManager.ts`
- `miniprogram/store/FeedPrefetchStore.ts`
- `miniprogram/store/PreDataStore.ts`
- `miniprogram/store/FeedDetailPreDataStore.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **On a weak network, can prefetch contend with the real navigation request for bandwidth? How do you measure it and cap it?** (performance)
- ⚖️ **If production shows a prefetch hit rate of only 10%, would you keep it or kill it, and how do you decide?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Walks the full chain 'touchstart trigger → prefetchManager fetch → PreDataStore cache → detail page reads pre-data before firing the real request' and explains why tap is not used. | Names the trigger timing and the cache location in basic terms. | Treats prefetch as 'fetch right after tap' and cannot articulate why it must be earlier. |
| 取舍意识 | 0.30 | Volunteers concurrency cap, TTL and dedup strategies, and discusses weak-network risks plus metrics (hit rate, bandwidth share). | Names at least one cost (wasted requests or bandwidth contention) and mentions monitoring. | Believes prefetch is free of cost or is unaware hit rate should be tracked. |
| 失败教训复盘能力 | 0.30 | Cites the historical 'context menu vs detail data mismatch' bug and explains how unifying the source with computed resolved it. | Names at least one real prefetch incident or follow-up rule. | No incident recall, stays on the happy path. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Why did you need to distill a dedicated miniprogram-computed rules file? Can you walk through a concrete setData-churn case that motivated it?

> id: `iq-04` · source tech-point: `tp-04` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/store/GuildFeedStore.ts`
- `miniprogram/pages-feed/store/FeedDetailStore.ts`
- `miniprogram/behaviors/contextMenuEmitterInitBehavior.ts`
- `.codebuddy/rules/miniprogram-computed-data-rules.mdc`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a computed value depends on the result of an async request, how do you wire it? Why can't the request itself live inside computed?** (reliability)
- ⚖️ **For list-style computed values that return a fresh reference each time, what breaks and how do you fix it?** (performance)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Describes the serialization cost of setData across the native bridge and how computed's dirty-check skips equal-value re-renders. | Knows computed derives view data and avoids scattered hand-rolled setData. | Treats computed as syntactic sugar with no performance story. |
| 取舍意识 | 0.30 | Explains why computed must be pure (cacheable, comparable) and when observer is the correct tool instead. | Knows side-effects don't belong in computed and can give a counter-example. | Tempted to fire requests or mutate global state inside computed. |
| 失败教训复盘能力 | 0.30 | Quotes at least two rules from miniprogram-computed-data-rules and ties them to specific production bugs. | Names a concrete pitfall like list-computed reference stability or cyclic dependency. | Has not hit computed pitfalls nor read the team rules file. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. How do SendMsgHelper, guildMsgPollingService and virtual-list divide responsibilities in the AIO? If you merged them into one service, what would break?

> id: `iq-11` · source tech-point: `tp-11` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/pages-chatroom/nt/service/SendMsgHelper.ts`
- `miniprogram/pages-chatroom/nt/service/guildMsgPollingService.ts`
- `miniprogram/pages-chatroom/nt/service/localReadMsgSeqCache.ts`
- `miniprogram/pages-chatroom/text/components/virtual-list`
- `miniprogram/pages-chatroom/text/components/virtual-list-skyline`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **When skyline rejects a WXML syntax, is your fallback runtime or build-time, and what are the costs of each?** (trade-off)
- ⚖️ **When the server returns a msgId that collides with the local id after an optimistic update, how do you reconcile?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Articulates the three duties (SendMsgHelper for optimistic update, guildMsgPollingService for polling with backoff, virtual-list / skyline for rendering) and the skyline fallback. | Knows there are virtual-list, polling and send layers and can roughly describe each. | Treats AIO as one monolithic service without any split. |
| 取舍意识 | 0.30 | Analyzes skyline's FPS gains against its restricted WXML subset and the capability-detection fallback. | Acknowledges skyline is not a silver bullet and names one limitation. | Believes skyline is strictly better than WebView in all cases. |
| 失败教训复盘能力 | 0.30 | Cites a real bug where optimistic-update id reconciliation failed and caused duplicated or out-of-order messages, plus the fix. | Names at least one concrete long-list pitfall. | Claims to have never hit message ordering or duplication bugs. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 2 questions

### Q1. Which cross-cutting concerns does utils/httpClient own, and when the login expires, should it pop the login UI itself or throw to business code?

> id: `iq-06` · source tech-point: `tp-06` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/utils/httpClient/index.ts`
- `miniprogram/utils/httpClient/cookies.ts`
- `miniprogram/utils/httpClient/urlParams.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **During a token refresh, many APIs fire in parallel. How do you prevent a thundering herd and duplicate refresh calls?** (reliability)
- ⚖️ **For a non-idempotent API like posting, would you auto-retry on failure? What's your decision framework?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Separates statusCode vs backendCode layers and maps cookie injection, urlParams and env switch to concrete sub-modules. | Names at least two duties: error fallback and login-state injection. | Treats HTTPClient as a thin wx.request wrapper with no cross-cutting story. |
| 取舍意识 | 0.30 | Distinguishes retry policy for idempotent vs non-idempotent APIs and explains token-refresh queuing with dedup. | Agrees non-idempotent APIs shouldn't auto-retry and acknowledges token-refresh thundering herd risk. | Enables auto-retry for everything or ignores token-refresh concurrency. |
| 失败教训复盘能力 | 0.30 | Tells a story where missing error-code enum caused scattered toasts and how the fix centralized codes at the network layer. | Names at least one regret (e.g. error copy) HTTPClient exposed to callers. | Claims no production issue has ever surfaced at the HTTPClient layer. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. What artifact did the comment-like rate-limit bug review leave behind, and how does it prevent the next similar bug?

> id: `iq-12` · source tech-point: `tp-12` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/pages-feed/components/comments/comment-item/comment-item.ts`
- `miniprogram/pages-feed/components/comments/reply-item/reply-item.ts`
- `miniprogram/pages-feed/store/FeedCommentStore.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **The four branches after an optimistic update (success / failure / rate-limit / unknown) — which code layer should enforce that all four are handled?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Points out optimistic updates need four rollback branches (success / failure / rate-limit / unknown) and that the rate-limit code must be enumerated in the network layer. | Describes reverting the liked state and toasting on rate-limit. | Believes only the success branch of optimistic update needs handling. |
| 取舍意识 | 0.30 | Discusses the trade-off between UI cooldown and perceived latency, arguing why toast plus disable is both necessary. | Concedes a toast alone without disabling still leaves users mashing the button. | Relies on one of toast or disable alone without considering context. |
| 失败教训复盘能力 | 0.30 | Quotes at least two items from the team's optimistic-action checklist and reports its impact. | Names at least one rule that emerged from this review. | Only patched the single bug, leaving no team-level artifact. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 1 questions

### Q1. How does the Aegis sourcemap actually get published to production, and why must it not ship together with the bundle?

> id: `iq-08` · source tech-point: `tp-08` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/utils/log`
- `script/robot.config.js`
- `CLAUDE.md`
- `README.md`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a release misses the sourcemap upload and production stacks become minified noise, how do you recover quickly?** (reliability)
- ⚖️ **For errors thrown in the anonymous phase, how do you keep them from being attributed to the wrong logged-in userId?** (observability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains that sourcemaps are built but not shipped; the CI uploads them to Aegis keyed by version and the backend maps stacks later. | Describes Aegis's error and performance duties and knows sourcemap upload is required. | Treats Aegis as a console.error replacement and misunderstands sourcemap's role. |
| 取舍意识 | 0.30 | Discusses the security risk of shipping sourcemaps and proposes a release checklist. | Agrees sourcemaps shouldn't ship with the bundle but lacks a full checklist. | Thinks it's fine to expose sourcemaps alongside the bundle. |
| 失败教训复盘能力 | 0.30 | Tells a real incident of missing sourcemap or mis-bound anonymous userId and the remediation. | Knows the consequence of a missing sourcemap and can outline the investigation. | Has never handled a monitoring incident; stops at SDK configuration. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 1 questions

### Q1. Is Turing-shield turingSdk just 'show a captcha' on the client? Where exactly does the security guarantee sit on the client vs. the server?

> id: `iq-07` · source tech-point: `tp-07` · scope: frontend · miniprogram · depth: 中级

#### Evidence

- `miniprogram/utils/turingSdk`
- `miniprogram/behaviors/turingSdkBehavior.ts`
- `miniprogram/components/login-panel/login-panel.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a ticket is reused or leaked, what server-side defense do you expect, and what can the client do to help?** (security)
- ⚖️ **If the captcha layer is triggered twice in quick succession, do duplicate requests fire? How does your Behavior guard against it?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Walks the three steps Behavior injection → triggerCaptcha ticket → server-side ticket verification, and highlights single-use tickets. | States that the client merely fetches the ticket while the real check lives on the server. | Assumes passing the captcha means 'safe' and validates the result only client-side. |
| 取舍意识 | 0.30 | Discusses the UX-risk trade-off across silent / slider / SMS tiers and when escalation is right. | Admits frequent captcha hurts UX and gives one mitigation. | Ignores captcha friction or demands strong verification everywhere. |
| 失败教训复盘能力 | 0.30 | Cites a case where missing Behavior idempotency caused double popup and double request, and the fix. | Knows debounce/dedup is needed and names one implementation. | Never considered side-effects of repeated triggers. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚖️ Trade-off (trade-off) — 1 questions

### Q1. Why did guild_mp pick the dual-track of pb_just_json (types only) and pkg-pb (on-demand encode/decode)? If you were forced to pick only one track, which would you choose?

> id: `iq-05` · source tech-point: `tp-05` · scope: fullstack · miniprogram · depth: 中级

#### Evidence

- `proto/pb/pb_just_json`
- `proto/pb/pb_need_decode`
- `miniprogram/pkg-pb`
- `proto/typings/pb_just_json.d.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Where do JSON and binary diverge in protocol-evolution compatibility? Can you name a specific field type that would break?** (trade-off)
- ⚖️ **If the backend flips a previously-JSON API to binary, which front-end files take the hit?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Crisply separates pb_just_json (types-only .d.ts, JSON transport) from pb_need_decode (codec lives in pkg-pb, lazy-loaded) with clear outputs and use cases. | Knows some protos are types-only while others need runtime codec and can state the reasoning. | Treats protobuf as 'must be binary' without realizing JSON can still reuse proto types. |
| 取舍意识 | 0.30 | Articulates a routing rule: JSON for high-frequency small data, binary for cross-platform or high-throughput, plus a concrete case that would cross the rails. | Names the cost of each track and offers at least one selection scenario. | Insists on all-JSON or all-binary without considering bundle size. |
| 失败教训复盘能力 | 0.30 | Tells a fix story where field casing or enum serialization caused JSON vs binary to diverge. | Names at least one common compatibility trap (e.g. adding a required field). | Believes JSON and binary are behaviorally identical. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

