# QPilot Web — Interviewer Question Pack

> Mode: interviewer · Role: 全栈 · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 5 questions

### Q1. How did you rewrite the main chat pipeline using Vercel AI SDK 5's ToolLoopAgent and createUIMessageStream, and why did you stop extending the OpenAIStream-based version?

> id: `iq-01` · source tech-point: `tp-001` · scope: fullstack · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If product wants a user-approval step inside tool execution that pauses the loop, how would you adapt this architecture?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers that ToolLoopAgent drives the multi-step loop, streamText is the token source, createUIMessageStream wraps part events, and explains why Node runtime with maxDuration=300 is needed | On follow-up, correctly states each component's role and how they compose into a single SSE stream | Conflates ToolLoopAgent with streamText, or cannot explain how part types map to client-side useChat rendering |
| 取舍意识 | 0.30 | Contrasts hand-rolled OpenAIStream loop against SDK ToolLoopAgent on cost, and points out Edge runtime's execution window is insufficient for multi-step tools | Knows why Node runtime is used but cannot articulate why the legacy pipeline was kept | Generic answers like 'newer is better' or 'SDK got updated' with no concrete trade-offs |
| 失败教训复盘能力 | 0.30 | Volunteers a concrete past pitfall such as abort signal not propagating into sub-tools or missing part types breaking client rendering, with the fix | On probing, recalls a specific migration-time issue | Claims no issues were hit, or only offers generic lessons like 'test more' |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Your chat supports regenerating from a message and switching branches — how is the data model laid out, and why not just overwrite the old answer?

> id: `iq-06` · source tech-point: `tp-006` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/prisma/schema.prisma`
- `apps/desktop/src/components/ai-elements/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a user tries to delete a middle message in a branch, what does your implementation do?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explicitly states Conversation.currentNodeId points to the visible leaf and Message.parentId is self-referential, with leaf-to-root traversal rendering the current chat | Knows it is a tree and that switching means moving currentNodeId, but cannot explain indexing | Models messages as a flat array with a deleted flag for regeneration, missing the branching requirement |
| 取舍意识 | 0.30 | Discusses why conversationId is indexed while parentId is not, and explains why recursive CTEs are unnecessary at the per-conversation node scale | Understands an index exists but cannot articulate the trade-off | Thinks every foreign key needs an index or suggests over-engineered options like a graph database |
| 失败教训复盘能力 | 0.30 | Volunteers a concrete pitfall around currentNodeId consistency (transaction boundary, concurrent regeneration) with the fix | On probing, recalls cascade-delete or orphan-node concerns | Has no awareness of data-integrity issues caused by deletion strategy |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. Why split into 21 Zustand stores instead of one big store? On what basis is the split decided?

> id: `iq-07` · source tech-point: `tp-007` · scope: frontend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/stores/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **When adding a new high-frequency write field, how do you decide whether to put it in an existing store or create a new one?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers three split rules (matching update cadence, shared subscription path, matching persistence policy) and explains how selectors fire inside a store | States at least one split rule and understands a store change re-runs subscribed selectors | Thinks splitting by field category (user/chat/ui) is enough, missing that update cadence is the actual driver |
| 取舍意识 | 0.30 | Discusses cognitive and maintenance cost of 21 stores and when barrel imports plus useShallow are warranted | Aware of the multi-store cost but only mentions the barrel trick | Thinks finer-grained is always better with no cost lens |
| 失败教训复盘能力 | 0.30 | Volunteers the early bug where selectedModel sat in useUserStore and re-rendered every user-subscribing component on model switch, plus how splitting fixed it | On probing, recalls persist-schema upgrades stripping fields from old users | Has no recollection of any production pitfall |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q4. How do you use App Router's route groups (app)/(standalone) together with the _components private directory convention, and why are two mechanisms needed?

> id: `iq-08` · source tech-point: `tp-008` · scope: frontend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/app/(app)/`
- `apps/desktop/CODEBUDDY.md`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a component currently under _components needs to be reused by another route, what is your promotion process?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explicitly states route groups (parentheses) mark layout boundaries without affecting URLs and _components (underscore) are not treated as route segments, with concrete folder examples | Knows both mechanisms exist but is hazy on the underscore-prefix private convention | Conflates route groups with _components, or is unaware these App Router conventions exist |
| 取舍意识 | 0.30 | Discusses the criterion for promoting to src/components (genuine cross-page reuse, not transient sharing) and how ESLint rules block misuse | Understands the layering but cannot articulate the promotion criterion | Believes every component should live in a global src/components |
| 失败教训复盘能力 | 0.30 | Volunteers a concrete cross-route import caught by ESLint or the motivation that created the rule | On probing, gives a scenario where the directory convention was misused | Cannot recall any directory-convention pitfall |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q5. How does pnpm catalog plus lerna independent work as a two-layer dependency story, and why two layers instead of one tool?

> id: `iq-12` · source tech-point: `tp-012` · scope: infra · depth: 中级

#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a downstream consumer keeps lagging on SDK version upgrades, how do you drive adoption?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains the catalog field in pnpm-workspace.yaml pins shared core library versions, child packages reference via catalog:, and lerna independent gives each package its own version released via lerna publish from-package | Knows catalog or independent partially but cannot explain why preinstall only-allow pnpm exists | Believes lerna and pnpm overlap and one tool is enough |
| 取舍意识 | 0.30 | Articulates 'unified core + independent business' as the layering motivation, and explains lockfile consistency needs only-allow pnpm as a guardrail | Knows the two layers have separate jobs but cannot explain the interaction | Thinks pnpm alone suffices, missing the independent-versioning need |
| 失败教训复盘能力 | 0.30 | Volunteers the concrete React minor-drift bug that threw useId hook-mismatch and how the catalog rollout fixed it | On probing, recalls lockfile double-write breaking dependency resolution | Has no recollection of dependency-management pitfalls |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 2 questions

### Q1. How is React Query structured for data fetching, and why split services and hooks the way you did?

> id: `iq-10` · source tech-point: `tp-010` · scope: frontend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/hooks/`
- `apps/desktop/src/services/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If one endpoint is called from three components with three different parameter shapes, how do you decide between a new hook and reusing a service?** (architecture)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Describes services as pure functions with zod validation and hooks as useQuery/useMutation wrappers, with queryKey shaped as [resource, id, sub-resource] | Aware of two layers but unclear on queryKey design | Mixes services and hooks in one file, or fetches directly in components |
| 取舍意识 | 0.30 | Discusses staleTime tiered by data trait (30s / 5min / 0) and why retry is disabled on mutations (non-idempotent + large payload) | Knows different endpoints get different staleTimes but cannot ground the basis | Applies the same config to all endpoints, no differentiation |
| 失败教训复盘能力 | 0.30 | Volunteers the pre-split scenario of one endpoint hit thrice by three components, with quantitative contrast (hit rate / call count) | On probing, recalls a case of invalidateQueries wiping more cache than intended | Has no production-grounded understanding of React Query cache behavior |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How does the html-to-figma SDK convert a webpage into Figma's clipboard format, and how are glyphs and SVG paths handled separately?

> id: `iq-14` · source tech-point: `tp-014` · scope: frontend · packages/* 共享层 · depth: 中级

#### Evidence

- `packages/sdk/html-to-figma/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a webpage uses a commercial font that Figma side does not have installed, what is your fallback chain?** (feature)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Decomposes into figma-generator, glyph-encoder, vector-network-encoder, image-utils, and names the VectorNetwork structure of vertices+segments+regions | Sketches the flow but cannot explain why glyphs are converted to paths | Believes raw SVG path strings can be sent directly, unaware Figma has no such facility |
| 取舍意识 | 0.30 | Discusses how glyph-to-path loses text editability, justifying that body text stays as text and only decorative text is converted | Aware of editability loss but cannot articulate the per-class handling | Converts all text as paths without scenario distinction |
| 失败教训复盘能力 | 0.30 | Volunteers a pitfall around Bezier C/Q conversion to VectorNetwork control-point alignment, or the cross-origin image proxy fix | On probing, recalls the fillRule handling difference (evenodd vs nonzero) | Has no concrete experience with path/glyph conversion edge cases |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚡ Performance (performance) — 2 questions

### Q1. Long chats easily blow out the context window — how do you decide when to compress and what to compress, and why not just slice by message count?

> id: `iq-04` · source tech-point: `tp-004` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/shared/`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a single tool output suddenly balloons to tens of thousands of tokens, how does your budget logic react?** (performance)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers the three-layer split of context-budget / context-compressor / context-compress, and identifies the ToolLoopAgent.prepareStep hook as the trigger point | Knows there is a token budget and multiple compression strategies, but cannot delineate the three layers | Answers 'truncate by count' or 'cut in half' with no per-model context-window awareness |
| 取舍意识 | 0.30 | Contrasts head-tail truncation, old-message summarization, and role-priority dropping by use case, explaining why no single strategy covers all | Lists strategies but cannot explain each one's boundary | Just says 'compress more' or 'truncate more' with no strategy hierarchy |
| 失败教训复盘能力 | 0.30 | Volunteers a concrete case where blind slicing lost key context, and explains how that drove the redesign into tiered compression | On probing, recalls an instance where over-compression led to off-topic answers | Believes compression has no side effects or cannot recall any tuned threshold after rollout |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. What does the DnsOptimization component do, and why does the layout initialize user state from cookies on the server?

> id: `iq-11` · source tech-point: `tp-011` · scope: frontend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/components/DnsOptimization.tsx`
- `apps/desktop/src/app/layout.tsx`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If LCP does not improve after preconnect rollout, how would you isolate config error vs another bottleneck?** (performance)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | States preconnect runs DNS+TCP+TLS while dns-prefetch only DNS with mandatory crossorigin, and the layout reads STAFFID via next/headers cookies() on the server to inject into the RSC tree | Knows preconnect cuts handshake but is unaware crossorigin matters | Treats preconnect and dns-prefetch as equivalent, or is unaware SSR cookies() avoids hydration flicker |
| 取舍意识 | 0.30 | Discusses how excessive preconnects consume the connection pool, justifying restriction to key origins | Knows you should not preconnect every domain but cannot quantify resource cost | Suggests preconnecting every third-party domain |
| 失败教训复盘能力 | 0.30 | Volunteers Aegis TTFB/LCP before-after (one fewer RTT, no anonymous first-frame flash) | On probing, recalls preconnect missing crossorigin causing fonts to re-resolve | Has no data-backed sense of impact |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 1 questions

### Q1. How does the entire SSE chain from frontend down to tool calls get cleanly cut on user stop, and how do you handle the case where the stop request lands on a different pod in a multi-pod deployment?

> id: `iq-03` · source tech-point: `tp-003` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Suppose a tool's internal fetch to an external service does not propagate the abort signal — what symptom shows up and how would you debug it?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers the per-session registerSessionAbort/unregisterSession registry, AbortSignal propagation into streamText and each tool, and emphasizes finally-block cleanup | Knows about the stop endpoint and AbortController, but cannot explain how the signal travels inside the SDK | Believes closing EventSource on the client kills the server, or is unaware of the dedicated stop endpoint |
| 取舍意识 | 0.30 | Discusses sticky sessions or gateway routing for cross-instance stop, contrasting with the cost of moving session state to shared storage | Acknowledges multi-pod is a problem but can only sketch one vague direction | Unaware that an in-memory registry breaks across multiple instances |
| 失败教训复盘能力 | 0.30 | Volunteers folding abort into chat_error_count with reason=user_abort label to separate user-stop from real failure | On probing, recalls that useChat onError must not pop an error toast for AbortError | Cannot recall any concrete edge case, or treats abort as a generic error |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 1 questions

### Q1. Which metrics does Galileo capture, and how does instrumentation.ts handle the dual Edge/Node runtime case?

> id: `iq-05` · source tech-point: `tp-005` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/instrumentation.ts`
- `apps/desktop/src/shared/utils/galileo-logger.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Suppose chat_error_count spikes but dashboards show no corresponding trace — how do you investigate?** (observability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Volunteers the four metrics (api_request_duration, page_render_duration, chat_request_count, chat_error_count), classifies histogram vs counter, and states the NEXT_RUNTIME guard | Names two or three metrics correctly, understands the register hook's role | Confuses OTel with Galileo, or is unaware that metrics are custom-registered |
| 取舍意识 | 0.30 | Explains why OTel node-sdk was chosen over a built-in Edge solution, and why alternatives like Sentry were dropped | Knows OTel cannot run on Edge but does not identify async_hooks as the blocker | Thinks adding any monitoring library would do, missing the runtime-compatibility issue |
| 失败教训复盘能力 | 0.30 | Volunteers the registration order — SetupGalileo before metrics, otherwise the meter is not ready — and how this bug was discovered | Recalls the unhandledRejection fix for lost promises | Has no recollection of any post-rollout monitoring pitfall |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 1 questions

### Q1. What does jose.compactDecrypt unwrap inside the Edge middleware, and why does this step belong on Edge rather than the Node app layer?

> id: `iq-02` · source tech-point: `tp-002` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/middleware.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If TAI starts rotating decryption keys hourly, how do you keep up without redeploying?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explicitly identifies the payload as a JWE compact identity ticket, names StaffId and LoginName fields, and explains Web Crypto is native on Edge while Node modules are not | Knows Edge sits closest to the user and runs before first paint, but is vague on the jose API specifics | Confuses JWE with JWT, or is unaware of the crypto-capability gap between Edge and Node runtimes |
| 取舍意识 | 0.30 | Volunteers how the matcher design avoids decrypting on every static and API request, and weighs against placing it in a Node middle tier | Knows the matcher exists but cannot motivate why _next and api are excluded | Says 'Edge is faster' or 'simpler' with no scenario-grounded reasoning |
| 失败教训复盘能力 | 0.30 | Volunteers the failure-tolerance choice (fall through to anonymous instead of 5xx) and explains why | On probing, recalls some handling for key/environment isolation | Believes decrypt failure should hard-5xx the site, missing the blast-radius implication |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚖️ Trade-off (trade-off) — 3 questions

### Q1. Three endpoints — /api/chat, /api/qpilot-chat, /api/chat-main-agent-v2 — coexist; why not retire the legacy ones at once, and what conditions would trigger retirement?

> id: `iq-09` · source tech-point: `tp-009` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/app/api/chat/route.ts`
- `apps/desktop/src/app/api/qpilot-chat/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If product mandates all plugin paths move to the new pipeline next week, how would you plan and risk-assess this?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Distinguishes the three pipelines by role (hand-written OpenAIStream / eventsource-parser proxy to upstream / SDK 5 ToolLoopAgent), each with runtime and up/downstream relationships | Aware of all three but unclear on the role of at least one | Treats the three pipelines as functional duplication rather than phased artifacts |
| 取舍意识 | 0.30 | Provides concrete retirement criteria (zero traffic for one week on dashboards, upstream protocol changes, regression risk assessment) | Knows traffic must drop before retirement but offers no concrete threshold or time window | Believes legacy pipelines should be retired immediately, ignoring regression risk and upstream compatibility |
| 失败教训复盘能力 | 0.30 | Volunteers a near-miss where retiring the legacy pipeline almost caused regression, or a similar lesson | On probing, recalls a class of hidden dependency on the legacy pipeline | Cannot recall any legacy-pipeline incident |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. How are you migrating the web_bak legacy code to the new stack, and what does the /migrate-component workflow actually do?

> id: `iq-13` · source tech-point: `tp-013` · scope: frontend · web_bak · depth: 中级

#### Evidence

- `web_bak/src/`
- `.cursor/`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If an antd prop has no shadcn counterpart, how does your migration strategy handle it?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Lays out the three-step approach of mapping table, tooling, and small batches, with at least two mapping classes (UI components, data layer) | Aware of the .cursor skill but unclear on the boundary between AST rewrite and human review | Suggests a big-bang rewrite of web_bak in one go |
| 取舍意识 | 0.30 | Discusses the un-machine-translatable boundary between antd's imperative APIs (e.g., message.success) and shadcn's hook style, with the TODO-for-human strategy | Aware of human-review cases but cannot enumerate them | Believes migration can be fully automated with zero human input |
| 失败教训复盘能力 | 0.30 | Volunteers the v1-mapping-missing-private-prop pitfall and the subsequent prop-level rule | On probing, recalls a regression caused by coexistence of web_bak and the new stack | Cannot recall any real migration-phase issue |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q3. Middleware runs on Edge, main-agent on Node, and instrumentation also on Node — how do you decide runtime, and what is your decision framework?

> id: `iq-15` · source tech-point: `tp-015` · scope: backend · apps/desktop · depth: 中级

#### Evidence

- `apps/desktop/src/middleware.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/instrumentation.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Could main-agent be moved back to Edge for speed in the future? Why or why not?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Articulates two decision rules — execution-window fit and Node-only API dependency — and applies them to each component | Knows Edge differs from Node but offers only one decision criterion | Believes Edge is always faster and everything should go on Edge |
| 取舍意识 | 0.30 | Contrasts Edge's cold-start advantage with Node's long-task capability, with the maxDuration=300 setting in context | Knows maxDuration is a cap but cannot ground the specific value | Has no concept of maxDuration or believes it is unlimited |
| 失败教训复盘能力 | 0.30 | Volunteers a gray-zone case such as Postgres needing an HTTP driver on Edge while Prisma forces Node pinning | On probing, recalls a deployment issue caused by wrong runtime choice | Cannot recall any runtime-related incident |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

