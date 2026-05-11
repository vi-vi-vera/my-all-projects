# QQ 项目管理门户 (qq-project) — Interviewer Question Pack

> Mode: interviewer · Role: 前端 · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 2 questions

### Q1. Materials config and power-design-react are two layers in your project. Explain their responsibility boundary and why you did not merge them.

> id: `iq-01` · source tech-point: `tp-001` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/materials/`
- `src/components/power-design-react/`
- `src/hooks/useConfigCreate.ts`
- `src/hooks/useConfigManage.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a page needs rendering logic the schema cannot express, how do you extend it without breaking the abstraction?** (trade-off)
- ⚖️ **How do you migrate when schema field names need to change?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 抽象边界清晰度 | 0.40 | Clearly explains schema describes structure only and power-design-react only renders, citing at least two concrete abstractions like useConfigCreate and useConfigManage. | States what each layer does but with vague examples. | Conflates the two layers and cannot articulate distinct responsibilities. |
| 演进与扩展思考 | 0.30 | Explains how to extend when the schema is not enough (registering renderers, OpenSpec for field renames) and is aware of risks. | Names one extension approach without discussing trade-offs. | Has no extension plan or suggests dropping the schema for imperative code. |
| 落地证据 | 0.30 | Cites concrete paths like src/materials, power-design-react, useConfigManage and names key APIs. | Mentions directories but is unclear on APIs. | Stays at the concept level with no concrete implementation details. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. By what principle are the nine Zustand stores split, and why not a single store? Please illustrate with concrete business fields.

> id: `iq-02` · source tech-point: `tp-002` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/store/useViewManageStore.ts`
- `src/store/index.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What problem does createWithEqualityFn plus shallow solve? What happens without shallow?** (performance)
- ⚖️ **How do you handle cross-store coordination, and why not an event bus?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 拆分原则与边界 | 0.40 | Explains domain decomposition principle and cites key fields per store (viewList, savedProductIds, dialogVisible). | Mentions domain-based splitting with few examples. | Cannot articulate the reason for splitting and thinks merging is fine. |
| 重渲染机制 | 0.40 | Explains shallow compare semantics of createWithEqualityFn plus shallow and demonstrates rerender behaviour without shallow. | Knows shallow is needed but cannot explain why. | Has no grasp of how equality compare and rerender relate. |
| 跨域协作 | 0.20 | Discusses explicit cross-store calls vs event bus and mentions circular dependency risk. | Provides one cross-domain approach without discussing risks. | Has no cross-domain plan and relies on useEffect to refetch. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 2 questions

### Q1. Walk through how the custom view CRUD flows from an OpenSpec proposal into useViewManageStore and then into the ViewCreate, ViewManage and ViewPush components.

> id: `iq-04` · source tech-point: `tp-007` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/store/useViewManageStore.ts`
- `openspec/changes/add-view-management/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Which fields does openEditDialog write together, and why not set them separately in the component?** (architecture)
- ⚖️ **How do you prevent cross-product privilege escalation in ViewPush? Is the frontend checkPermission trustworthy?** (security)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| OpenSpec 流程理解 | 0.30 | Explains what proposal, design, spec and tasks each produce and when they are archived. | Knows there are four files but cannot fully describe each. | No knowledge of the OpenSpec process. |
| store action 编排 | 0.40 | Explains why openEditDialog writes editingView, savedProductIds and dialogVisible together rather than letting the component set each separately. | Mentions writing multiple fields together but cannot articulate why. | Sets fields ad hoc in components, causing prefill bugs. |
| 跨产品安全意识 | 0.30 | Explains backend validation for ViewPush multi-product scenarios and clearly states frontend checkPermission is not authoritative. | Knows authorisation is needed but is unclear on the division of responsibility. | Relies entirely on frontend checkPermission. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. useQPilot polls every 200 ms up to 20 times waiting for the SDK to be ready. Why not just listen for onload, and what failure modes does this design have?

> id: `iq-10` · source tech-point: `tp-005` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/hooks/useQPilot.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What if all 20 polls fail? Do you need a fallback?** (reliability)
- ⚖️ **How do you report a failed QPilot init? Should it flow through Aegis?** (observability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 轮询设计 | 0.40 | Explains why onload is not enough (QPilotAI needs secondary init) and how the 200 ms times 20 budget was tuned. | Knows polling is used but cannot explain why. | Thinks onload is enough and is unaware of secondary init. |
| 失败处理 | 0.30 | Describes a fallback after 20 failures (hide entry, report to Aegis). | Knows a fallback is needed but the plan is vague. | No handling after failure. |
| 生命周期清理 | 0.30 | Explains the need to clearInterval and remove the script node on unmount. | Knows the timer must be cleared but overlooks the script node. | Has not considered cleanup on unmount. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚡ Performance (performance) — 1 questions

### Q1. useConfigManage exports Excel via recursive paging and then writes the file. Explain the design trade-off and how the 5000 row cap was set.

> id: `iq-05` · source tech-point: `tp-008` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/hooks/useConfigManage.ts`
- `src/utils/file.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Beyond 50000 rows how would you change the approach? Can pure frontend recursion still hold?** (performance)
- ⚖️ **Why not have the backend handle export? What unique advantages does frontend export keep?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 递归分页设计 | 0.40 | Explains fetchPage plus recursion plus termination conditions (short page or cap) and reasons for pageSize 200. | Knows it is paged recursion but lists incomplete termination conditions. | Suggests fetching everything with pageSize 10000. |
| 前端导出 vs 后端导出 | 0.30 | Weighs reuse of business endpoints, permission consistency and async task UX. | Takes a position but with weak rationale. | Has not thought about the difference between the two approaches. |
| 可扩展性 | 0.30 | Discusses scaling beyond 50000 rows via backend async tasks, workers or streaming. | Names one scaling option but lacks detail. | Believes a 5000 cap is enough and ignores larger volumes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 2 questions

### Q1. Walk through the order of transformer hooks and interceptors in src/utils/request/index.ts, and where camelize, 401, Aegis and retry each plug in.

> id: `iq-03` · source tech-point: `tp-003` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/utils/request/index.ts`
- `src/utils/request/axios-transform.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Retrying a POST create can cause duplicates. How do you avoid that?** (reliability)
- ⚖️ **How do you handle humps camelize edge cases? Do you convert urls and FormData uploads?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 钩子顺序理解 | 0.40 | Walks through beforeRequestHook, transformRequestHook, responseInterceptors and responseInterceptorsCatch in request-response order. | Names the hooks but not in the right order. | Confuses interceptors with transformers. |
| 重试 + 监控 | 0.40 | Explains retryCount, retryable error classification and idempotency concerns; describes Aegis report fields. | Knows retry and reporting exist but lacks detail. | No idempotency awareness, assumes any request can be blindly retried. |
| 边界处理 | 0.20 | Cites edge cases like skipping url conversion, FormData and whitelisted endpoints for 401 reporting. | Cites one or two edge cases but incomplete. | No edge-case awareness, assumes a one-size-fits-all request layer. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How do the Orange CI multi-branch strategy and the two Dockerfiles (business and cache) cooperate? Walk through the full chain where master pushes images and MR only runs lint.

> id: `iq-09` · source tech-point: `tp-006` · scope: infra · qq-project · depth: 中级

#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `cache.dockerfile`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What happens if cache image and business image lock files are out of sync, and how do you verify?** (reliability)
- ⚖️ **What is wrong with FROM cache:latest, and how do you manage versioned tags?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 分支策略 | 0.30 | Explains the differentiated strategy where master pushes full builds, MR runs lint plus build and feature runs only lint, plus benefits. | Knows about differentiation but cannot fully describe it. | Believes every branch should build images. |
| 双 Dockerfile 协作 | 0.40 | Describes the cache image's separate pipeline, business image FROM cache and lock file hash verification. | Knows there is a cache image but is fuzzy on cooperation. | Cannot identify which Dockerfile is the base. |
| 运维风险 | 0.30 | Identifies risks like overwritten latest, non-inherited secrets imports and TKE quota. | Names one or two risks. | No operational risk awareness. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 1 questions

### Q1. How do Aegis global error capture and API retcode reporting cooperate? Which scenarios are reported and which are skipped?

> id: `iq-06` · source tech-point: `tp-012` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/hooks/useAegis.ts`
- `src/utils/request/index.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you know when an Aegis report itself fails, and how do you avoid a reporting loop?** (observability)
- ⚖️ **What are the risks of stuffing too much business context into the ext field?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 上报模型 | 0.40 | Explains the dual track of Aegis auto-capture plus manual retcode reporting and why HTTP 200 with non-zero retcode is reported. | Knows there are two tracks but cannot articulate the difference. | Relies only on automatic SDK capture. |
| 降噪与白名单 | 0.30 | Cites noise reduction for long-polling 401, user-cancelled requests and 401 during SSO redirect. | Names one or two noise scenarios. | Has not considered noise reduction and reports everything. |
| 上报失败保护 | 0.30 | Wraps Aegis calls in try/catch, avoids reporting loops and constrains the ext field size. | Knows protection is needed but implementation is incomplete. | Has not considered that Aegis itself can fail. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 1 questions

### Q1. The portal relies on TOF cookie auth. How do the frontend 401 fallback and button-level permissions cooperate, and why is frontend checkPermission untrusted?

> id: `iq-08` · source tech-point: `tp-003` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `src/utils/request/index.ts`
- `openspec/project.md`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Why not store the token in localStorage? How would the XSS risk concretely play out?** (security)
- ⚖️ **What concurrency issue does the isRedirecting flag prevent during 401 redirect?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 认证模型 | 0.40 | Explains cookie plus withCredentials plus SSO renewal and contrasts with XSS risks of localStorage tokens. | Knows it is cookie-based but is unclear on renewal details. | Tends to store tokens in localStorage. |
| 401 处理流程 | 0.30 | Walks the full flow: isRedirecting check, logout, reset stores and redirect with redirectUrl. | Explains SSO redirect but misses details like the isRedirecting debounce. | Just redirects without clearing state. |
| 权限分工 | 0.30 | Clearly states frontend only renders disabled UX while the backend is authoritative, and discusses cross-product viewId escalation. | Knows backend must validate but is fuzzy on frontend fallback logic. | Treats frontend checkPermission as authoritative. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚖️ Trade-off (trade-off) — 1 questions

### Q1. You use Next.js 14 but every page is wrapped with NoSSR and runs as a SPA. Walk through all the reasons and costs of that decision.

> id: `iq-07` · source tech-point: `tp-011` · scope: frontend · qq-project · depth: 中级

#### Evidence

- `next.config.js`
- `src/components/Dynamic.tsx`
- `src/pages/_app.tsx`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How does disabling reactStrictMode affect dev-time bug detection, and how do you compensate?** (trade-off)
- ⚖️ **If SEO or first-paint optimisation becomes needed, how would you evolve toward SSR or RSC?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 决策动机 | 0.40 | Justifies NoSSR from internal portal, logged-in users, third-party SDK compatibility and mental-model angles. | Cites one or two reasons but not fully. | Thinks SSR is always better or does not know why NoSSR. |
| 实现细节 | 0.30 | Describes dynamic with ssr:false, static assets in _document and side effects in _app. | Knows about dynamic but other details are fuzzy. | Cannot explain how NoSSR is implemented. |
| 代价与演进 | 0.30 | Explains the cost of disabling reactStrictMode and prerequisites for RSC evolution. | Knows there are costs but cannot give concrete examples. | Has not considered costs or evolution. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

