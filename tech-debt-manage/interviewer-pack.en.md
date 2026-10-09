# 技术负债治理管理平台 — Interviewer Question Pack

> Mode: interviewer · Role: 全栈 · Level: 中级

> For interviewer use during the session: pick questions and score with the rubric. **No model answers** — scoring relies on the rubric attached to each question.

## 🏗️ Architecture (architecture) — 2 questions

### Q1. Why is the menu not hard-coded, and when does the project list become routes?

> id: `iq-01` · source tech-point: `tp-01` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/router/modules/projects.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What does the user see if the project API times out?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Names moduleId, lazy loading, and the redirect to /project/error. | Only says the menu comes from an API. | Describes the routes as a hard-coded config file. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Why can several projects share one table component?

> id: `iq-02` · source tech-point: `tp-02` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/components/CommonTable/index.tsx`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a button cannot be expressed in config, do you change the shared table or add a callback?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Separates config, callbacks, and restored search state. | Says the table sends paging params. | Says every project copies its own table. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🧩 Feature (feature) — 1 questions

### Q1. How do bulk import and export connect to the generic project?

> id: `iq-03` · source tech-point: `tp-03` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/utils/handleExcel.ts`
- `src/router/modules/projects.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **What happens when the workbook has an instruction sheet but no data sheet?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Mentions SheetJS, header validation, and that the gateway size is only a ceiling. | Separates import from export. | Says the file is passed straight to the table for display. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚡ Performance (performance) — 1 questions

### Q1. Why do some lists request one page while others fetch everything?

> id: `iq-07` · source tech-point: `tp-07` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/components/CommonTable/index.tsx`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **Does a full fetch still hold after the statistics payload grows?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Says full fetch is only for bounded statistics and notes the 5-second timeout. | Knows the default is paging. | Says returning every list at once is faster. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🛡️ Reliability (reliability) — 2 questions

### Q1. How do you detect expired login and business failure when HTTP status stays successful?

> id: `iq-04` · source tech-point: `tp-04` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/utils/request.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If the response header is missing, can the interceptor throw a second exception?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Distinguishes 100001, 100002, and readable business codes. | Knows the business code is in a response header. | Treats HTTP 200 as success. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

### Q2. Why do test and production releases differ?

> id: `iq-09` · source tech-point: `tp-09` · scope: infra · tech-debt-manage · depth: 中级

#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `nginx.conf`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **The image push succeeded but production is still old. What do you check first?** (reliability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Separates automatic test update from manual production confirmation and mentions SPA fallback. | Knows the output is static files served by Nginx. | Says the frontend repo also runs a backend server process. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 📈 Observability (observability) — 1 questions

### Q1. Where do you look when a page or API call fails?

> id: `iq-05` · source tech-point: `tp-05` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/main.tsx`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **How do you confirm that you are looking at the wrong environment when test traffic enters production?** (observability)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains separate production and test identifiers and that monitoring does not replace a backend trace. | Knows reporting starts with the app. | Says there is no monitoring and only browser alerts are used. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## 🔒 Security (security) — 1 questions

### Q1. Where does the session live, and why do expiry and missing permission take different paths?

> id: `iq-06` · source tech-point: `tp-06` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/utils/request.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If the error header is plain text, will the page navigate away?** (security)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains cookie cleanup, the https restriction, and that hiding a menu is not authorization. | Knows the session is a cookie, not localStorage. | Says the frontend stores a token and decides permission itself. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

## ⚖️ Trade-off (trade-off) — 1 questions

### Q1. Why await the API at the top of the route module instead of rendering first and filling the menu later?

> id: `iq-08` · source tech-point: `tp-08` · scope: fullstack · tech-debt-manage · depth: 中级

#### Evidence

- `src/router/modules/projects.ts`


#### Stress probes (use when the candidate answers too smoothly)

- ⚖️ **If a deep link opens before the menu returns, can it become a 404 first?** (trade-off)


#### Rubric

| Criterion | Weight | Excellent | Pass | Fail |
|---|---|---|---|---|
| 技术正确性 | 0.40 | Explains that waiting avoids an empty menu and admits a slow request blocks the whole app. | Names the render-first alternative. | Says waiting for the API has no cost. |
| 取舍意识 | 0.30 | Volunteers the rejected option and the current cost. | Names one alternative after a follow-up. | Repeats the current implementation and cannot say why it was chosen. |
| 失败教训复盘能力 | 0.30 | Names a real edge such as timeout, duplicate menu values, or production not switching automatically. | Describes what the user sees on failure. | Claims there is no failure path, or claims a teammate's mobile changes. |

> Weight sum: **1.00** (target 1.00 ± 0.05; review manually if it deviates).

---

