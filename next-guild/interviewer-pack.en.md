# QQ 频道 Hybrid H5 (next-guild) — Interviewer Question Pack

> Mode: interviewer · Role: 前端 · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 2 questions

### Q1. Walk through the 200+ entry path-to-cmd table in pages/api/v2/[...slug].ts. Why not one file per endpoint?

> id: `iq-03` · source tech-point: `tp-003` · scope: fullstack · next-guild · depth: 中级

#### Evidence

- `pages/api/v2/[...slug].ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you govern the table as it grows, and should it be split?** (architecture)
- ⚖️ **What happens if x-oidb overriding serviceType sends invalid JSON?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 表驱动抽象 | 0.40 | Explains how one table absorbs 99% of duplicate BFF code and acts as an endpoint directory, citing cmd_serviceType. | Knows it is table-driven but cannot argue against splitting files. | Suggests a file per endpoint. |
| catch-all 路由细节 | 0.30 | Explains why slice(-2), how cmd_serviceType splits on underscore and the default 2 fallback. | Knows slug is an array but leaves out detail. | Unsure how slug is parsed. |
| x-oidb 覆写健壮性 | 0.30 | Wraps JSON.parse in try/catch, falls back to the default serviceType and logs the error. | Remembers parse but not the failure path. | Calls JSON.parse without protection. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How do the three axios instances divide labour, and why does isInMSDK currently return true unconditionally?

> id: `iq-04` · source tech-point: `tp-005` · scope: frontend · next-guild · depth: 中级

#### Evidence

- `src/common/request.ts`
- `src/common/oidbRequest.ts`
- `src/common/msdkRequest.ts`
- `src/utils/os.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What is the risk of detecting MSDK purely from UA?** (reliability)
- ⚖️ **In the interceptor, would you append parameters to the URL or to headers?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 三实例分工 | 0.40 | Nails the gateway each instance targets, bkn requirements and why MSDK params go in the URL. | Knows there are three instances but mixes duties. | Argues for a single instance. |
| isInMSDK 当前决策 | 0.30 | Explains the hard-coded true as a business call, the high UA mis-detection rate historically, and keeping UA code as an escape hatch. | Knows it is true but cannot say why. | Advocates sticking with UA detection. |
| 拦截器细节 | 0.30 | Covers the question-mark separator logic, baseURL trailing slash, and URLSearchParams empty fallback. | Mentions appending params but ignores edge cases. | Ignores double-slash or empty-param issues. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 1 questions

### Q1. Why does the iOS MSDK bridge need an iframe, and how do you handle the race in setupWebViewJavascriptBridge?

> id: `iq-08` · source tech-point: `tp-009` · scope: frontend · next-guild · depth: 中级

#### Evidence

- `src/utils/msdk.ts`
- `src/utils/os.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What happens when business calls msdkCall before the bridge is ready?** (reliability)
- ⚖️ **Why not use window.webkit.messageHandlers?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| iframe 桥接原理 | 0.40 | Explains WKNavigationDelegate decidePolicyForNavigationAction interception. | Knows the iframe signals native but cannot explain the native side. | Assumes the iframe loads a real resource. |
| 竞态三分支 | 0.35 | Covers all three branches: bridge present, pending queue and missing. | Covers two branches. | Handles only one branch. |
| 跨端协议一致性 | 0.25 | Explains iOS vs Android enum differences (3 vs 6) and falling back to prompt/alert. | Knows there is a difference but not the specifics. | Assumes identical protocols. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 1 questions

### Q1. Describe the division between the master tag_push and test push pipelines. Why keep production deploy manual?

> id: `iq-09` · source tech-point: `tp-013` · scope: infra · next-guild · depth: 中级

#### Evidence

- `.orange-ci.yml`
- `Dockerfile`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you avoid races between the time and latest tags on concurrent pushes?** (reliability)
- ⚖️ **How would you add gray-release traffic switching?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 双流水线职责划分 | 0.40 | Explains master tag_push ships images without deploy and test push auto stke:update, with rationale. | Lists both but confuses triggers. | Assumes master auto-deploys. |
| 双 tag 策略 | 0.30 | Explains time tag for traceability, latest for convenience, and mitigations for concurrent races. | Aware of both tags but not the race. | Uses only latest. |
| 人工确认动机 | 0.30 | Explains manual prod gating for gray and rollback, with automation stopping at image push by design. | Knows manual gating but not why. | Advocates one-click full automation. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 3 questions

### Q1. How does trpc.withLog work, and what do the four fields of traceparent mean?

> id: `iq-05` · source tech-point: `tp-006` · scope: fullstack · next-guild · depth: 中级

#### Evidence

- `src/server-side/trpc.ts`
- `src/utils/report.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If upstream already carries traceparent, do you create a new one or reuse?** (observability)
- ⚖️ **What happens if IsDev proxy=1 leaks into production?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 泛型封装 | 0.35 | Explains withLog<T, R>, the Response<R> return and the type-inference benefit. | Knows it uses generics but not the inference. | Writes it with any. |
| traceparent 字段语义 | 0.40 | Names version(00), 32-hex traceId, 16-hex spanId and the 1-byte flags with its sampled bit. | Knows the rough shape but not the field lengths. | Unaware of W3C trace-context. |
| dev proxy 安全边界 | 0.25 | Stresses the IsDev double guard and the danger of production proxy=1. | Aware of the proxy toggle but does not stress the prod ban. | Believes enabling proxy in prod is fine. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Why run log4js dateFile plus atta as a dual channel, and how do you avoid context overwrite across concurrent SSRs?

> id: `iq-06` · source tech-point: `tp-007` · scope: backend · next-guild · depth: 中级

#### Evidence

- `src/utils/logger/index.ts`
- `src/utils/logger/atta.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Does UDP packet loss on atta affect the business?** (reliability)
- ⚖️ **How would you refactor to per-request loggers via AsyncLocalStorage?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 双通道动机 | 0.35 | Articulates local source of truth plus aggregation, atta's fire-and-forget UDP semantics and the channels not dragging each other. | Knows two channels exist but not the rationale. | Argues for keeping only one channel. |
| context 隔离 | 0.40 | Identifies the singleton context-overwrite risk under concurrent SSR and discusses AsyncLocalStorage / child logger evolution. | Knows to attach trace but not the singleton problem. | Assumes log4js is per-request by default. |
| 异常防护 | 0.25 | Explains the .catch(() => false) on atta and the crash history from unhandled rejection. | Knows to catch but not the consequences. | Chains then without protection. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. Split the duties of the three frontend monitoring tracks (Aegis / web-vitals / Datong). How do you correlate them when debugging?

> id: `iq-07` · source tech-point: `tp-008` · scope: frontend · next-guild · depth: 中级

#### Evidence

- `pages/_app.tsx`
- `src/utils/report.ts`
- `src/utils/datong.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **With spa:true, how reliable is PV capture on Next.js Pages Router?** (observability)
- ⚖️ **Why not roll a single SDK to merge all three?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 三通道职责划分 | 0.40 | Explains Aegis as RUM auto-capture, web-vitals as perf metrics and Datong as business events, with concrete fields. | Lists all three but with blurred boundaries. | Believes they should merge into one SDK. |
| 负载 / 字段对齐 | 0.30 | Explains the A8/A99/A100/A119/A120 magic fields in the Datong protocol. | Aware of magic fields but fuzzy on mapping. | Missed the field constraints. |
| 跨通道排障 | 0.30 | Describes Aegis -> atta -> log4js -> web-vitals debug path with timestamp alignment. | Knows to correlate but the flow is unclear. | Relies on a single channel to debug. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 2 questions

### Q1. Walk me through middleware.ts. Why use middleware rather than getServerSideProps?

> id: `iq-01` · source tech-point: `tp-001` · scope: fullstack · next-guild · depth: 中级

#### Evidence

- `middleware.ts`
- `pages/api/auth.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Can middleware call a remote API, and what risks come with that?** (reliability)
- ⚖️ **Would you pick the matcher config or pathname.startsWith, and why?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| middleware 定位 | 0.40 | Articulates middleware as edge interception, contrasts with the flash from getServerSideProps, and justifies narrowing the prefix to cut edge CPU. | Knows middleware runs earlier but cannot clearly explain CPU or flash details. | Treats middleware as just another API handler. |
| 回跳参数设计 | 0.35 | Explains joining basePath plus pathname plus search, why nextUrl.clone() is needed and how to bound the redirect length. | Knows to carry redirect but forgets basePath. | Stuffs location.href into redirect without considering path structure. |
| 三件套 cookie 的可见性 | 0.25 | Distinguishes openid being httpOnly false from the other two being httpOnly true and discusses XSS mitigation. | Remembers httpOnly but is unclear on which fields skip it. | Sets all cookies as plain cookies. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How does /api/auth prevent open-redirect, and why isn't a custom regex enough?

> id: `iq-02` · source tech-point: `tp-002` · scope: fullstack · next-guild · depth: 中级

#### Evidence

- `pages/api/auth.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you guard against IDN homograph confusables?** (security)
- ⚖️ **If checkurl is unavailable how would you degrade gracefully?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 开放重定向攻击面理解 | 0.40 | Lists at least three variants (springboard / @ spoofing / suffix spoofing) and explains how checkurl defeats each. | Lists two variants with rough defences. | Unaware of the springboard role and focuses only on external attackers. |
| subhost 模式语义 | 0.30 | Explains subhost vs host, and how IDN decoding and userinfo/IP filtering work. | Knows it is a subdomain whitelist but cannot explain the internal logic. | Treats subhost as a substring includes check. |
| cookie 下发顺序 | 0.30 | States Set-Cookie must precede res.redirect and mentions browser sensitivity. | Knows order matters but cannot name affected browsers. | Unaware ordering matters. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚖️ Trade-off (trade-off) — 1 questions

### Q1. Why bring in Redux when only walletSlice lives in the store, and how will you evolve as state grows?

> id: `iq-10` · source tech-point: `tp-011` · scope: frontend · next-guild · depth: 中级

#### Evidence

- `src/store/store.ts`
- `src/store/wallet.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Why not just use Zustand or Context?** (trade-off)
- ⚖️ **What side effects does HYDRATE have on the first client render?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 状态域决策 | 0.40 | Explains the three tiers (page-local, SSR props, store) and why walletSlice stays minimal. | Aware of restraint but reasons are weak. | Argues to push everything into the store. |
| next-redux-wrapper HYDRATE | 0.30 | Explains the HYDRATE merge action, extraReducers handling and why walletSlice skips it. | Knows HYDRATE exists but not the handling. | Unaware of hydration. |
| 方案对比 | 0.30 | Compares Zustand / Jotai / Context with scenario-fit suggestions. | Lists comparisons but scenarios are vague. | Ignores alternatives. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

