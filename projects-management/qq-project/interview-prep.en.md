# QQ 项目管理门户 (qq-project) — Interview Preparation

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 1      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 2 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

Internal portal for the QQ client covering version progress, bug board, gray release and archive, built on Next.js 14 plus Zustand and TDesign.

### Standard (30–60 seconds)

qq-project is the frontend portal of the QQ client project management system. It covers four product lines: version cadence, bug board, gray release and archive lookup, and it talks to multiple internal platforms such as pindao-bff, TAPD, Pangu, TOF authentication, Aegis monitoring and the QPilot AI agent. As a mid level frontend engineer my work falls into four buckets. First, I split pages into config-driven Materials and a two-layer power-design-react component set, so repeated list-plus-form-plus-review pages can be produced from a single schema. Second, I split global state into nine Zustand stores by business domain, and we standardised on createWithEqualityFn plus shallow to keep rerenders under control. Third, I wrapped Axios with one transformer that handles humps camelize, 401 logout, Aegis reporting and three retries. Fourth, I follow the OpenSpec process of proposal, design, specs and tasks so that AI assisted work stays traceable.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

qq-project is the QQ client management portal. The product needs to serve release managers looking at cross-product cadence, QAs looking at bug boards and product owners running gray release and archive lookup, so the frontend has to support very different page shapes inside one stack. We picked Next.js 14 Pages Router but turned it into a CSR-only SPA: reactStrictMode is off in next.config.js, every page is wrapped in NoSSR and _document only injects static assets. This is a deliberate trade-off: we give up SSR-driven first paint in exchange for a single mental model on an internal portal, simpler state management and better third-party SDK compatibility for QPilot and TDesign. Architecturally there are three layers. At the bottom src/materials holds schema-style material descriptors; one columns-formItems-actions config drives a page. In the middle power-design-react wraps two higher-order templates ConfigCreate and ConfigManage, with reusable hooks useConfigCreate and useConfigManage to handle pagination, bulk action, review and Excel export. Only on top do we have business components such as VersionProgress, BugPannel and ViewManage. State is split into nine domain stores including useVersionStore, useBugPanelStore, useViewManageStore and useAdminConfigStore. Every store is built with createWithEqualityFn and consumed via useStore(selector, shallow) so a single field change does not rerender the whole tree. The request layer lives in src/utils/request/index.ts; humps.camelize sits in transformRequestHook, 401 redirect sits in responseInterceptors, Aegis reporting is centralised, and network errors retry three times with one-second backoff. Observability is wired through Aegis V2 plus retcode reporting. CI is an Orange CI multi-branch pipeline: master triggers a TKE image build and rollout, while MR or feature only run lint and build, with repo-scoped secrets imported by reference. End-to-end tests run on Playwright with a pre-generated storageState file so cases can reuse the SSO session and skip the internal login flow.

</details>

## ✨ Highlights

- **Materials 配置驱动 + power-design-react 双层抽象** (architecture · frontend)
  I extracted recurring list-plus-form-plus-review-plus-export pages into schema configs under src/materials, and rendered them through the power-design-react higher-order ConfigCreate and ConfigManage components plus useConfigCreate and useConfigManage hooks. Adding a new config-style page only takes a columns-formItems-actions config; what used to be 300+ lines of template code per page dropped below 80, and new developers following .codebuddy/skills/config-page-development/SKILL.md can produce a compliant page end to end.
  > Keywords: `config-driven` · `schema` · `react-hook` · `design-system`
- **Zustand 9 store 领域拆分 + createWithEqualityFn 治理重渲染** (architecture · frontend)
  Global state is split by domain into nine stores such as useVersionStore, useBugPanelStore, useViewManageStore and useAdminConfigStore, all created with createWithEqualityFn and consumed via useStore(selector, shallow). Changing viewList no longer rerenders the versionList side, and edit/create dialogs reuse the store fields dialogVisible and savedProductIds to handle prefill.
  > Keywords: `zustand` · `shallow` · `selector` · `domain-split`
- **Axios 请求层一站式封装：camelize + 401 + Aegis + 重试** (reliability · frontend)
  src/utils/request/index.ts centralises cross-cutting concerns: transformRequestHook resolves dataPath and codePath, beforeRequestHook adds urlPrefix, joinTimestamp and humps.camelize; responseInterceptors handles 401 redirect and reports failures to window.AegisV2; responseInterceptorsCatch retries three times with one-second backoff. Business code only calls request.get/post and no longer writes its own try/catch.
  > Keywords: `axios` · `interceptor` · `humps` · `retry` · `aegis`
- **OpenSpec 规格驱动开发 + .codebuddy 规则** (architecture · frontend)
  Every new feature follows the openspec/changes/<change-id>/ four-file pattern: proposal.md captures motivation and impact, design.md captures key decisions, specs/<cap>/spec.md uses ADDED/MODIFIED requirements and tasks.md breaks the work into 1.1/1.2 checkboxes. Combined with mdc rules under .codebuddy/rules covering core rules, mandatory error checking and doc sync, AI assistance and human coding share the same contract.
  > Keywords: `spec-driven` · `openspec` · `ai-collab` · `process`
- **QPilot AI Agent 入口注入与 200ms×20 就绪轮询** (feature · frontend)
  The useQPilot hook dynamically injects the QPilot SDK script when _app.tsx mounts, then polls window.QPilotAI every 200 ms up to 20 times via setInterval. Once ready it calls init with QPILOT_ID 2851 and AGENT_ID 8173. On unmount it clears the timer and removes the script node.
  > Keywords: `ai-integration` · `polling` · `lifecycle` · `third-party-sdk`
- **自定义视图 CRUD 端到端（add-view-management）** (feature · frontend)
  The bug board view management is a full feature sample: from an OpenSpec proposal to the full action set on useViewManageStore (fetchDropdownViews, saveView, setDefault, toggleEnable, deleteView, openEditDialog) and the three panel components ViewCreate, ViewManage and ViewPush. It covers create, edit, default selection, enable/disable and pushing share links across products.
  > Keywords: `crud` · `share-link` · `permission` · `feature`
- **Orange CI 多分支差异化流水线 + 双 Dockerfile** (reliability · infra)
  The repo root has .orange-ci.yml running multiple branch strategies for master, MR, feature, bugfix and push. It depends on Dockerfile for the business image and cache.dockerfile for the cache layer; secrets are read via imports from repo-scoped credentials. Build artifacts are pushed to the internal TKE cluster and discovered via Polaris.
  > Keywords: `orange-ci` · `docker` · `tke` · `polaris`


## 🏗️ Architecture (architecture) — 2 Q&A

### Q1. You say pages are config-driven by Materials. Can you walk through what this abstraction looks like and why you split it into two layers (Materials and power-design-react)?

> Source: `tp-001` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 配置驱动 / Schema-driven UI | 必须掌握 | 理解 declarative-vs-imperative 边界以及如何把页面结构数据化是讲清这套抽象的前提。 |
| 高阶组件与自定义 Hook 抽象 | 必须掌握 | ConfigCreate/ConfigManage + useConfigCreate/useConfigManage 是组合式抽象的典型，需要懂如何把「行为」封进 Hook。 |
| TDesign React 组件库 | 加分项 | 渲染层底层依赖 TDesign，能讲清 Table/Form 的受控用法可以拓展回答深度。 |

#### Tiered answers

**🟢 Elevator**: Materials is a schema that describes list columns, form items and actions. power-design-react is the render layer that turns the schema into UI, so business components only care about the schema and the data.

**🔵 Standard** (default):

Our config-driven setup has two layers. The first is the material schema under src/materials: each business page has a config file that declares columns, formItems, actions and permissions, turning page structure into data. The second is src/components/power-design-react, which consumes the schema and renders real UI; it exposes two higher-order components ConfigCreate and ConfigManage and two hooks useConfigCreate and useConfigManage to handle common behaviors like pagination, bulk action, review and Excel export. We chose two layers because the schema is a declarative contract reusable by different renderers and easy for AI assistance to generate via the .codebuddy/skills/config-page-development/SKILL.md template, while power-design-react focuses purely on rendering and is not coupled to a specific business, so upgrading TDesign does not ripple into business code.

<details><summary>🔴 Deep dive (click to expand)</summary>

I can answer from three angles: why two layers, what is abstracted and what bit us. First, why two layers. Early on we only had business components calling TDesign directly, and pages such as BugPannel, VersionProgress and AdminConfig all looked the same but each had small differences, so every TDesign bump meant a full sweep. We then realised page shape and page rendering had to be separated. The Materials layer only describes structure: a columns array where each item is { dataIndex, title, render?, sorter? }, formItems items like { type: 'input'|'select'|'date', name, label, rules }. The power-design-react layer consumes that schema, calls useConfigManage to get dataSource, loading, pagination, selectedRowKeys and handleBatch, and feeds them to TDesign Table and Form. On the abstraction itself, useConfigManage standardises paged fetch as fetchPage(params)+setData, multi-select as selectedRowKeys plus onSelectChange and export as generateExportFile, with the export hook fetching all pages recursively. useConfigCreate wraps the init, submit and validate lifecycle of create/edit forms. Two pitfalls: schema expressiveness is sometimes too weak so people add special-case fields, and an inline render callback drags us back to imperative code; we now require render to reference a built-in renderer name such as badge, enum or time. The other pitfall is coordinating with power-design-react upgrades; renaming a schema field has to go through the OpenSpec proposal flow before the rename lands so business pages do not silently break. Overall a new config page now ships in under 80 lines and the .codebuddy SKILL document encodes the template.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 项目内 src/components/power-design-react/ 完整目录
  - [ ] src/hooks/useConfigCreate.ts 与 useConfigManage.ts 全文
  - [ ] .codebuddy/skills/config-page-development/SKILL.md
- 🛠️ Hands-on
  - [ ] 基于现有 schema 新增一个简单的「黑名单管理」配置页，跑通增删改查
  - [ ] 把一个老命令式页面（无 schema）改造成 Materials 配置
- ⚠️ Common pitfalls
  - 在 columns.render 里写内联 JSX，破坏 schema 的可序列化
  - 把业务校验逻辑写到 power-design-react 内部，导致渲染层耦合业务
  - 升级 TDesign 时没同步 power-design-react 适配层
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果新页面需要一个 schema 不支持的特殊渲染，你会怎么扩展？
  - [ ] Materials 和 JSON Schema 标准比有什么差异？
  - [ ] schema 字段重命名怎么平滑迁移？
- ⏱️ Estimated time: **4-6 小时**


#### Evidence

- `src/materials/`
- `src/components/power-design-react/`
- `src/hooks/useConfigCreate.ts`
- `src/hooks/useConfigManage.ts`
- `.codebuddy/skills/config-page-development/SKILL.md`

---

### Q2. You split state into nine Zustand stores instead of a single one. Why? And what problem does createWithEqualityFn plus shallow solve?

> Source: `tp-002` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Zustand createWithEqualityFn / shallow | 必须掌握 | 这是回答相等性、避免重渲染的核心 API。 |
| 状态域拆分 / Domain decomposition | 必须掌握 | 考察候选人能否给出按业务域拆分 state 的依据与边界。 |
| React 重渲染机制 | 必须掌握 | 需要解释为什么浅比较能减少 rerender。 |
| Redux/Recoil/Jotai 对比 | 加分项 | 横向比较能体现选型思考。 |

#### Tiered answers

**🟢 Elevator**: Nine stores are split by business domain so changing one domain does not impact the others. createWithEqualityFn plus shallow makes components rerender only when the slice picked by the selector actually changes.

**🔵 Standard** (default):

Splitting into nine stores is mainly about domain isolation. Versioning, bug board, view management, gray release and review config differ so much in shape that one global store would lead to action name collisions and tangled reducer logic. Per-domain stores are self-contained: useViewManageStore owns viewList, savedProductIds, dialogVisible and createDialogVisible plus actions such as fetchDropdownViews, saveView and openEditDialog. createWithEqualityFn is a Zustand 4 API that takes an equality function. Combined with shallow it does a shallow compare, so a component using useStore((s) => ({ a: s.a, b: s.b }), shallow) only rerenders when a or b really change. Without shallow the default is reference equality, every selector returning a fresh object causes a rerender, and list pages become laggy.

<details><summary>🔴 Deep dive (click to expand)</summary>

Three angles: why split this way, how createWithEqualityFn looks in code, and two real-world issues. First, why per-domain. We tried a single store with shape { version, bug, view, admin, ... } and prefixed actions like setVersionList and setBugList. Two problems showed up: changing one action type forced a regression across the tree, and selectors had to drill through .version.viewManage.viewList and were error prone. We then split into nine stores. Each store is its own hook; useViewManageStore for example holds viewList, initialViewList, editingView, savedProductIds, dialogVisible, createDialogVisible, fetchLoading and saveLoading, with actions fetchDropdownViews, saveView, setDefault, toggleEnable, deleteView, openCreateDialog, openEditDialog and resetEditingView. A page just imports the store it uses. Second, how createWithEqualityFn is wired. Zustand 4 made the equality function injectable. We create stores via createWithEqualityFn<State>()((set, get) => ({ ...state, ...actions })). Components write const { viewList, fetchDropdownViews } = useViewManageStore((s) => ({ viewList: s.viewList, fetchDropdownViews: s.fetchDropdownViews }), shallow), where shallow is exported from zustand/shallow. As long as viewList keeps the same reference the component does not rerender. Third, two real issues. One is edit prefill: when opening the edit dialog we need to write editingView and also derive savedProductIds from viewList; otherwise cancelling and reopening shows stale data. We made a single action openEditDialog(viewId) that writes the three groups in one call. The other is cross-store coordination: after saving a view we want the bug board list to refresh. Instead of a global event bus we call useBugPanelStore.getState().refresh() inside the saveView callback. It is explicit and readable but we have to avoid circular imports, so a low-level store like useUserStore must not import an upper store.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Zustand 官方文档关于 selector 与 equalityFn 的章节
  - [ ] 项目内 src/store/useViewManageStore.ts 全文
  - [ ] 项目内 src/store/index.ts 入口
- 🛠️ Hands-on
  - [ ] 把一个 useState 驱动的本地组件改造成依赖某个 Zustand store
  - [ ] 故意去掉 shallow，观察列表页 rerender 次数变化
- ⚠️ Common pitfalls
  - selector 返回新对象但忘记传 shallow 导致全量重渲
  - 在 store action 里直接 await 后忘记 set 错误状态
  - store 之间循环依赖导致初始化时 undefined
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不直接用 React Context？
  - [ ] selector 里能不能写复杂派生数据？
  - [ ] createWithEqualityFn 内部是怎么实现 equalityFn 的？
- ⏱️ Estimated time: **3-5 小时**


#### Evidence

- `src/store/index.ts`
- `src/store/useViewManageStore.ts`
- `src/store/useVersionStore.ts`
- `src/store/useBugPanelStore.ts`
- `src/store/useAdminConfigStore.ts`

---

## 🧩 Feature (feature) — 1 Q&A

### Q1. Walk me through the bug board custom view feature end to end, from the OpenSpec proposal to the store to the components.

> Source: `tp-007` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| OpenSpec 流程（proposal/design/spec/tasks） | 必须掌握 | 这是答题的主线之一。 |
| Zustand store 的 action 编排 | 必须掌握 | openEditDialog 这种「同时写多字段」的 action 是典型用法。 |
| 权限校验与受控按钮 | 加分项 | 跨产品推送的鉴权是 trade-off 部分。 |

#### Tiered answers

**🟢 Elevator**: First write the proposal, design, spec and tasks under openspec, then implement the actions in useViewManageStore, and finally build the three panel components ViewCreate, ViewManage and ViewPush.

**🔵 Standard** (default):

It starts from openspec/changes/add-view-management. proposal.md states the business problem: different roles need different bug filters and want to save their own views. design.md captures key decisions like whether views are user or product scoped and how cross-product sharing is authorised. specs/view-management/spec.md uses ADDED requirements for save view, set default, enable/disable and push to other products. tasks.md breaks the work down into 1.1 store, 1.2 ViewCreate, 1.3 ViewManage, 1.4 ViewPush and so on. In code, useViewManageStore exposes fetchDropdownViews to load the dropdown, saveView for create or update, setDefault to set default, toggleEnable to enable/disable, deleteView to delete, and openEditDialog which also prefills savedProductIds. ViewCreate calls saveView('create') from a form, ViewManage is a table whose action column calls toggleEnable, setDefault, openEditDialog and deleteView, and ViewPush uses a multi-select plus copy-link to push views across products.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why OpenSpec, data shape, edit prefill details and cross-product push authorisation. First, OpenSpec is needed because this feature touches several roles (product, QA, release managers) and multiple products; IM discussion easily loses context, so we insist on proposal.md for motivation and impact, design.md for key decisions like bulk delete by ops or whether ordinary users can edit others' views, spec.md with ADDED requirements and tasks.md split to one-to-two-hour items, archived on PR merge. That flow also lets AI assistance (CodeBuddy) generate compliant code. Second, ViewItem has id, name, creator, productList[], filterParams, isDefault, enabled and updatedAt; productList is an array of product ids because one view can bind to multiple products. Third, edit prefill is interesting. When the user clicks edit, we dispatch openEditDialog(viewId). The action does three things: locate the view in viewList and write it to editingView; write view.productList to savedProductIds so the ProductSelector reflects current selection; set dialogVisible to true. Cancel calls resetEditingView to clear the three fields. Fourth, cross-product push authorisation. ViewPush lets the user pick target products and copy a link with viewId. Inside the target product the viewId is foreign, so the saveView endpoint validates permission against every product in productList and rejects when the user lacks operation rights on a target. The button first calls checkPermission to display a disabled state. Overall this is the most complete OpenSpec sample in the project and the origin of useViewManageStore.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] openspec/changes/add-view-management/proposal.md
  - [ ] openspec/changes/add-view-management/design.md
  - [ ] openspec/changes/add-view-management/specs/view-management/spec.md
  - [ ] src/store/useViewManageStore.ts
- 🛠️ Hands-on
  - [ ] 按 OpenSpec 流程写一个『历史视图归档』小提案
  - [ ] 为 ViewManage 加一个『复制视图』按钮
- ⚠️ Common pitfalls
  - openEditDialog 漏写 savedProductIds 导致编辑回填错
  - saveView 在 create 和 update 之间共用一个 action 但没区分参数
  - 跨产品推送忘记做权限校验造成越权
- 🤔 Self-check questions (answer without notes)
  - [ ] OpenSpec 的 spec.md 和普通文档有什么区别？
  - [ ] 如果两个用户同时编辑同一个视图怎么处理冲突？
  - [ ] ViewPush 的链接被截图泄露怎么办？
- ⏱️ Estimated time: **4-6 小时**


#### Evidence

- `src/store/useViewManageStore.ts`
- `src/components/NewBoard/BugPannel/ViewCreate/index.tsx`
- `src/components/NewBoard/BugPannel/ViewManage/index.tsx`
- `src/components/NewBoard/BugPannel/ViewPush/index.tsx`
- `openspec/changes/add-view-management/`

---

## ⚡ Performance (performance) — 1 Q&A

### Q1. useConfigManage has a recursive paged Excel export. Walk me through the design and why you don't just fetch all records at once.

> Source: `tp-008` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 递归分页 / 异步累加 | 必须掌握 | 核心算法。 |
| SheetJS / xlsx 写盘 | 加分项 | 导出 Excel 的底层细节。 |
| 前端导出 vs 后端导出权衡 | 必须掌握 | trade-off 部分的关键问题。 |

#### Tiered answers

**🟢 Elevator**: Export uses getAllDataForExport with recursive paging at 200 per page, then builds the Excel without overloading the backend.

**🔵 Standard** (default):

useConfigManage exports as follows: the user clicks export, generateExportFile collects which fields under columns are exportable, then calls getAllDataForExport({ pageSize: 200, page: 1 }, []) to accumulate, and finally hands the data to downloadExcel in utils/file.ts (based on sheetjs) to write the file. Inside getAllDataForExport each await fetchPage(params) fetches the current page; if data.length equals pageSize the function recurses with page+1, otherwise it returns. The terminating condition is data.length < pageSize or exceeding the 5000 row cap. We did not just set pageSize to 10000 because of three reasons: backend per-call timeout and memory, permission filtering causing inconsistent fields on full dumps, and paged fetching lets us show progress on the frontend so the user does not think the page is frozen.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why not server side, how recursion is implemented, the cell text extraction and pitfalls. First, why not server side. Adding an export endpoint per business endpoint doubles maintenance, doubles permission checks and doubles retcode paths, and async task style export needs polling and feels worse. Frontend recursive paging reuses the business endpoint directly so permission and data shape match the list page exactly; one extra button is enough. Second, recursion. getAllDataForExport(params, acc) is async: call fetchPage(params) to get { list, total }, push list into acc; return acc when acc.length >= total or acc.length >= 5000 or list.length < params.pageSize; otherwise return getAllDataForExport({...params, page: params.page + 1}, acc). pageSize 200 was chosen against an internal RTT of 50 ms plus backend processing of around 200 ms; too small means too many calls and too large risks per-call timeout. Third, text extraction. Table render functions often return JSX such as status badges and formatted timestamps, but Excel cannot hold JSX, so generateExportFile extracts text per cell: it first tries column.exportRender?.(record), falls back to column.render only if it returns a string, and otherwise uses the raw field. Fourth, pitfalls. Originally there was no 5000 cap and a user once exported the full table and crashed the browser; we added the hard cap with a hint to add filters. With concurrent edits paging can show duplicates or skips, so the doc states export is a snapshot at pull time without strong consistency. SheetJS turns long digit strings into scientific notation by default, so we force cellType='s' on long fields like productID.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/hooks/useConfigManage.ts 全文
  - [ ] src/utils/file.ts
  - [ ] SheetJS 官方文档 cell type 部分
- 🛠️ Hands-on
  - [ ] 实现一个 1 万行数据的导出，带 progress 提示
  - [ ] 为某个表格加 exportRender，把状态徽标转成中文文本
- ⚠️ Common pitfalls
  - 没有 hard cap 导致浏览器内存爆炸
  - render 返回 JSX 直接写进 Excel 变 [object Object]
  - 长数字字段被识别为科学计数法
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果数据量超过 5 万条你会怎么改方案？
  - [ ] 导出过程中用户切走页面再回来，要不要恢复进度？
  - [ ] 为什么选 SheetJS 而不是 ExcelJS？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/hooks/useConfigManage.ts`
- `src/utils/file.ts`
- `src/utils/tool.ts`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. Walk me through your Axios wrapper. How do camelize, 401 redirect, Aegis reporting and retries work together?

> Source: `tp-003` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Axios 拦截器与 transform hook | 必须掌握 | 整个回答围绕 transform hook 和 interceptors 展开。 |
| humps camelize / decamelize | 必须掌握 | 解释命名风格转换的边界与陷阱。 |
| 前端重试策略与幂等性 | 必须掌握 | 讨论重试时一定会问到幂等问题。 |
| Aegis / 前端监控基础 | 加分项 | 上报字段和异常聚合是观测性的延伸话题。 |

#### Tiered answers

**🟢 Elevator**: The request layer lives in one file src/utils/request/index.ts. All cross-cutting concerns are concentrated in transformer hooks and interceptors, business code only calls request.get/post.

**🔵 Standard** (default):

We have a createAxios factory that takes a transform config carrying four hooks. transformRequestHook destructures data and retcode by dataPath and codePath when the response returns and treats codeSuccessValue=0 as success. beforeRequestHook adds urlPrefix (/pindao-bff), joinTimestamp (cache busting) and humps.camelize for request params (snake to camel) before sending. responseInterceptors clears auth and redirects to SSO when status equals 401, and reports every failure via window.AegisV2.error. responseInterceptorsCatch retries on network errors up to three times with one-second backoff. GET requests have joinTimestamp on by default, and business code just calls request.get<T>(url, params) to get a promise with retry, monitoring and 401 fallback baked in.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: design goals, hook order, implementation details and pitfalls. The goal is that business code does not write try/catch, does not care about retcode, SSO or monitoring, so the request layer absorbs all of it. Hook order on the request path is beforeRequestHook adding the prefix and timestamp then humps.camelize on params (only params, not body, because the backend contract uses camelCase in body). On the response path transformRequestHook extracts business data with dataPath 'data', codePath 'retcode' and codeSuccessValue 0; responseInterceptors catches 401, calls logout(), redirects via window.location.replace to SSO and rethrows; responseInterceptorsCatch then receives the error, checks whether it is retryable like ECONNABORTED or 5xx and if so calls utils.requestRetry(config, count=3, delay=1000); otherwise it reports to Aegis with window.AegisV2 && window.AegisV2.error({ msg, code, url }). On details, retry uses an axios config.__retryCount counter to avoid an infinite loop; joinTimestamp appends _t=Date.now() to the url to break internal proxy caches; camelize uses humps.camelizeKeys with deep traversal. Three pitfalls: first humps turns abc_def into abcDef fine but mangles keys like productID2 that mix digits and capitals, so we skip camelize on url paths and only run it on params/data. Second, early on every 401 redirected to SSO, but some long-polling endpoints occasionally returned 401 and caused redirect loops; we added an ignoreUrl whitelist. Third, the Aegis reporting itself can fail under weak networks, so we wrapped the call in a try/catch to ensure failed reporting does not break the business flow.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/utils/request/index.ts 全文
  - [ ] src/utils/request/axios-transform.ts
  - [ ] humps 库 README
- 🛠️ Hands-on
  - [ ] 为一个 mock 后端写一个带重试和监控上报的 axios 封装
  - [ ] 把现有 retcode 不一致的接口接入 transformRequestHook
- ⚠️ Common pitfalls
  - 对 POST body 也做 camelize 但后端不识别
  - 重试没有计数导致网络抖动时无限重发
  - 401 拦截器没有白名单造成 SSO 跳转死循环
- 🤔 Self-check questions (answer without notes)
  - [ ] 重试时如果是 POST 创建类接口，怎么避免重复创建？
  - [ ] Aegis 上报失败你怎么知道？
  - [ ] 如果后端把 retcode 字段改名你这个层怎么平滑切换？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/utils/request/index.ts`
- `src/utils/request/axios-transform.ts`
- `src/utils/request/utils.ts`

---

### Q2. How is the Orange CI multi-branch strategy set up? Do master, MR and feature run different things? How do the two Dockerfiles (business image and cache) work together?

> Source: `tp-006` · scope: infra · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Orange CI 分支策略与 secrets imports | 必须掌握 | 题目主线。 |
| Docker 多阶段 / cache 镜像 | 必须掌握 | 双 Dockerfile 协作核心。 |
| TKE 部署与北极星服务发现 | 加分项 | master 流水线最后一公里。 |

#### Tiered answers

**🟢 Elevator**: Only master builds and pushes images; MR and feature run lint plus build. The cache image holds dependencies, the business image reuses it.

**🔵 Standard** (default):

.orange-ci.yml splits jobs by event: on master push it runs build-image -> push -> deploy-tke; on MR it runs lint, tsc and next build without building or deploying an image; on feature/* and bugfix/* it only runs lint and tsc for fast feedback; ordinary push runs the default lint and build. For images, cache.dockerfile is the base: FROM node:18, COPY package.json plus pnpm-lock.yaml, pnpm install, leaving an image with dependencies pre-installed. The business Dockerfile uses FROM <our-cache-image>, COPYs the code, runs pnpm build and CMDs start.sh to launch next start and register with Polaris. Iteration is fast: when only code changes, the image build hits the cached layer in seconds; only dependency changes rebuild the cache image. Secrets are imported from repo-scoped credentials rather than inlined.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why not build images on every branch, how the two Dockerfiles cooperate, what getBranch.sh and start.sh do, and pitfalls. First, building an image on every branch is too expensive: internal TKE registry has quota and CI time matters, so MR and feature only run lint, tsc and next build to confirm the code compiles; only master pushes the image and deploys. The layering keeps dev branch feedback under two minutes while master takes 8 to 10 minutes, which is acceptable. Second, the two Dockerfiles cooperate as follows. cache.dockerfile is the dependency image, built on a separate pipeline triggered manually or scheduled when pnpm-lock.yaml changes, with the artefact pushed to the registry as cache:latest. The business Dockerfile starts with FROM <namespace>/qq-project-cache:latest, then COPY src, COPY public, RUN pnpm build and CMD bash start.sh. Third, getBranch.sh chooses the Polaris name at container start based on env vars (different names for dev and prod). start.sh exports NODE_OPTIONS such as --max-old-space-size 4096 because next build for a large SPA can run out of heap, then runs next start. Fourth, pitfalls. If the cache image lock file is stale the business image cannot pick up new dependencies; we added a CI step that hashes the lock file and fails on mismatch. Orange CI secrets imports were not inherited on some branches and broke deploys; we had to enable inherit explicitly in repo settings. Pinning FROM to cache:latest occasionally gave us an overwritten image, so we switched to versioned tags. Overall the design eats 80% of build time via the cache image and differentiates tests by branch, which keeps releases both stable and fast.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] .orange-ci.yml
  - [ ] Dockerfile 与 cache.dockerfile 对照阅读
  - [ ] start.sh / getBranch.sh
- 🛠️ Hands-on
  - [ ] 为新分支策略加一个只跑 lint 的 job
  - [ ] 把 cache.dockerfile 拆出 dev / prod 双版本
- ⚠️ Common pitfalls
  - cache 镜像和业务镜像的 lock 文件不同步
  - FROM cache:latest 被覆盖导致回滚困难
  - secrets imports 没继承导致部署失败
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果发布出问题怎么回滚？
  - [ ] 如何判断该重建 cache 镜像？
  - [ ] next build OOM 你怎么定位？
- ⏱️ Estimated time: **4-5 小时**


#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `cache.dockerfile`
- `getBranch.sh`
- `start.sh`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. How is frontend monitoring set up? How do Aegis and API retcode reporting work together? Which scenarios are reported and which are not?

> Source: `tp-012` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Aegis V2 / 前端监控 SDK | 必须掌握 | 上报字段和初始化都围绕 Aegis V2。 |
| 业务 retcode 与 HTTP 状态的差异 | 必须掌握 | 解释为什么需要手动上报。 |
| 全局错误捕获 (window.onerror / unhandledrejection) | 加分项 | 自动捕获原理。 |

#### Tiered answers

**🟢 Elevator**: Global errors and API failures are reported to Aegis V2; a non-zero retcode is also reported as a business failure. Only whitelisted endpoints and occasional 401s on long polling are skipped.

**🔵 Standard** (default):

Monitoring runs on two tracks. One is Aegis SDK global capture: the useAegis hook initialises window.AegisV2 in _app.tsx with id, uin and host, picking up window.onerror and unhandledrejection automatically. The other is the request layer in src/utils/request/index.ts where responseInterceptors call window.AegisV2.error({ msg, code, url }) manually, so HTTP 4xx/5xx and non-zero retcode business failures both land in Aegis. A few cases are excluded: 401s from long polling, user-cancelled requests via axios cancel, and 401s during the login redirect. The Aegis call itself is wrapped in try/catch so a failed report does not break business code.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why manual retcode reporting, field design, whitelisting and noise suppression, and pitfalls. First, why retcode is reported manually. Aegis only inspects HTTP status by default, but our backend uses HTTP 200 plus a non-zero retcode for business failures like permission denied or invalid params; pure HTTP monitoring would miss them. So after transformRequestHook parses retcode, responseInterceptors treats retcode != 0 as an error and reports it; msg is the backend message, code is the stringified retcode and url is config.url, which aggregates well on the dashboard. Second, fields. We standardised on msg, code, url and ext. ext carries productId, current route and user role so the Aegis dashboard can group by code and locate hot-spot products and routes. Third, whitelisting and noise. Early on every 401 was reported, flooding the Aegis dashboard with pre-redirect 401s, so we added an ignoreAegisUrls array; long polling /poll and 401 during SSO redirect are skipped, axios.isCancel(error) is skipped, and recoverable network blips that retries fix only report on final failure. Fourth, pitfalls. Aegis can ETIMEDOUT on weak networks; without try/catch the report itself throws and the global handler catches it again, looping into a console flood. We isolated it with try { window.AegisV2 && window.AegisV2.error(...) } catch{}. useAegis init must run after the router is ready or host is about:blank, so we moved init into useEffect with a setTimeout 0. And retcode reporting must check axios.Cancel first because cancelled requests also hit catch.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/hooks/useAegis.ts
  - [ ] src/utils/request/index.ts 中 responseInterceptors 部分
  - [ ] Aegis V2 官方接入文档
- 🛠️ Hands-on
  - [ ] 实现一个最小 Aegis 上报封装，覆盖 onerror + axios 拦截器
  - [ ] 为一个接口加白名单跳过上报
- ⚠️ Common pitfalls
  - 上报本身抛错没有 try-catch
  - 把 axios cancel 当成正常错误上报
  - ext 里塞过大对象导致 Aegis 拒收
- 🤔 Self-check questions (answer without notes)
  - [ ] 怎么区分『真错误』和『可预期失败』？
  - [ ] 如果 Aegis 后台数据缺字段怎么排查？
  - [ ] 前端怎么和后端 retcode 字段保持一致？
- ⏱️ Estimated time: **2-3 小时**


#### Evidence

- `src/hooks/useAegis.ts`
- `src/utils/request/index.ts`
- `src/global.d.ts`

---

## 🔒 Security (security) — 1 Q&A

### Q1. The portal relies on TOF auth. How does the frontend handle session loss and 401? How do you prevent unauthorized actions?

> Source: `tp-003` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Cookie-based vs token-based 认证 | 必须掌握 | 前端不存 token 的根本原因。 |
| 前端 SSO 重定向与 redirectUrl 续接 | 必须掌握 | 401 处理的具体动作。 |
| 前后端权限校验分工 | 必须掌握 | checkPermission 与后端 retcode 的边界。 |
| XSS / CSRF 基础 | 加分项 | 讨论为什么 cookie + withCredentials 比 localStorage 安全。 |

#### Tiered answers

**🟢 Elevator**: Sessions are kept in TOF cookies, the frontend stores no token. 401 redirects to SSO in one interceptor; the backend enforces authorisation while checkPermission only renders disabled buttons.

**🔵 Standard** (default):

Authentication is cookie-based: TOF sets the cookie on login and the frontend keeps no token, so axios requests only need withCredentials. 401 handling is centralised in src/utils/request/index.ts responseInterceptors: status 401 triggers logout() to clear the Zustand user info and window.location.replace to SSO; a boolean flag prevents duplicate redirects within a short window. For authorisation we treat the backend as the source of truth. The frontend checkPermission(productId, action) only renders disabled state and a tooltip; real authorisation is enforced server-side and returned via retcode, then the frontend reports to Aegis and toasts.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why no token on the frontend, the 401 interception steps, the button-level permission trade-off and common privilege escalation paths. First, no token on the frontend because the internal portal uses the TOF cookie domain and the browser sends it automatically; storing a token in localStorage would add XSS theft risk, and SSO renewal refreshes the cookie but not localStorage, causing inconsistent state. Second, the 401 steps: the interceptor checks error.response.status===401, then checks the isRedirecting flag and rejects immediately if already redirecting; otherwise it sets isRedirecting=true, calls logout() to clear the Zustand user state, calls reset on stores like useViewManageStore that need clearing, and finally window.location.replace to the SSO entry with redirectUrl=current so the user returns to the same page after login. Long-polling endpoints are in ignoreUrls so an occasional 401 does not yank the page away. Third, button-level permission. checkPermission on the frontend is purely for UX, hiding buttons the user has no permission to use is better than letting them click and hit retcode. But the source is GET /permissions from the backend, cached and rendered on the frontend; it is not authoritative. Even when checkPermission returns false, the onClick handler still calls saveView so the backend revalidates. Fourth, common privilege escalation paths. A user copies a link with a viewId to a coworker who opens it in another product. The frontend button may show as clickable because checkPermission returns true (the coworker has read in their own product), but saveView, validating productList across products, rejects the cross-product action. The bottom line: the frontend holds no key, performs no authoritative auth, and only provides UX and fallback.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/utils/request/index.ts 中 401 分支
  - [ ] openspec/project.md 关于 External Dependencies 与 TOF 的段落
  - [ ] 公司 TOF 认证接入文档
- 🛠️ Hands-on
  - [ ] 实现一个最小 401 拦截器，带 isRedirecting 防抖
  - [ ] 为一个按钮加 checkPermission 渲染禁用态
- ⚠️ Common pitfalls
  - 401 后没清 store 导致下一次请求仍带旧用户上下文
  - 把 token 缓存到 localStorage 引入 XSS 风险
  - 前端权限当作权威，后端少校验
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果 cookie 过期但页面还开着，怎么提示用户？
  - [ ] checkPermission 缓存多久？怎么失效？
  - [ ] 跨产品 viewId 链接怎么防越权？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/utils/request/index.ts`
- `openspec/project.md`

---

## ⚖️ Trade-off (trade-off) — 2 Q&A

### Q1. You use Next.js 14 but wrap every page in NoSSR and run it as a SPA. Why not use SSR? What is the trade-off behind this choice?

> Source: `tp-011` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Next.js Pages Router 与 ssr:false | 必须掌握 | NoSSR 实现核心。 |
| React StrictMode 双 effect 模型 | 必须掌握 | 解释为什么关掉 strict mode 的代价。 |
| Hydration / Server Component 基础 | 加分项 | 讨论未来演进时会用到。 |

#### Tiered answers

**🟢 Elevator**: It is an internal portal, first paint is not critical, users always log in first, and the hydration complexity plus third-party SDK incompatibility from SSR is not worth it. CSR keeps the mental model simple.

**🔵 Standard** (default):

We picked Next.js 14 for its file-based routing, _app/_document shell, Webpack/SWC build chain and overall DX, but we run it as an SPA: pages are wrapped in src/components/Dynamic.tsx (a NoSSR shell built on next/dynamic with ssr:false), _document only emits the HTML skeleton plus static assets, and next.config.js disables reactStrictMode. The trade-off is justified by three reasons. First, it is an internal portal accessed only by logged-in users, so SSR-driven first paint adds no value. Second, third-party SDKs like TDesign React, QPilot and Aegis depend on window; SSR triggers ReferenceError or hydration mismatches. Third, Zustand stores and many useEffect patterns are mentally consistent under CSR, while SSR forces hydration of the server-rendered first render. The cost is a slightly longer white-screen and SEO unfriendliness, but the portal does not need SEO.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why not Vite, how NoSSR is implemented, the cost of reactStrictMode false and how it might evolve. First, why not Vite. We considered it but Next.js has ready-made Docker templates, Orange CI templates and Polaris integration templates inside the company, and ops is happy with the build artefact shape. We also wanted _app.tsx to act as the shell for useQPilot, useAegis and TDesignProvider, and file-based routing is cleaner than hand-written React Router. So we kept Next.js but use it as a framework shell only. Second, how NoSSR is wired. src/components/Dynamic.tsx is const NoSSR = dynamic(() => Promise.resolve(({ children }) => <>{children}</>), { ssr: false }) and every page wraps its default export with it. _document.tsx does no special rendering and only emits language, font preload and the Aegis SDK script. _app.tsx wraps TDesignProvider, ConfigProvider, AegisInit and QPilotInit. Third, reactStrictMode is false because some legacy class components and third-party SDKs misbehave under double-effect remount, and the QPilot SDK in particular errors on a second init; we prioritised production stability. The cost is losing a layer of dev-time bug detection, which we cover via the OpenSpec process and the mandatory post-change lint check enforced by .codebuddy/rules. Fourth, future evolution might move to App Router with RSC, but only once TDesign React adapts to server components and QPilot ships an SSR-friendly build. There is no active proposal for that in OpenSpec right now. Overall this is a classic internal-portal-uses-Next.js-as-SPA trade-off; business gains are clear and the cost is controllable.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] next.config.js 全文
  - [ ] src/components/Dynamic.tsx
  - [ ] src/pages/_app.tsx 与 _document.tsx
  - [ ] Next.js 官方 dynamic 文档
- 🛠️ Hands-on
  - [ ] 用 next/dynamic 把一个组件改成 ssr:false
  - [ ] 故意打开 reactStrictMode 观察 useEffect 双触发
- ⚠️ Common pitfalls
  - 在 NoSSR 外层访问 window 仍会触发 SSR 报错
  - reactStrictMode 关掉后忽略真正的 effect 副作用 bug
  - _document 里写浏览器逻辑导致编译报错
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果未来要支持 SEO，你会怎么改？
  - [ ] reactStrictMode 重新打开可能会暴露哪些 bug？
  - [ ] NoSSR 和 Suspense + lazy 有什么区别？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `next.config.js`
- `src/components/Dynamic.tsx`
- `src/pages/_app.tsx`
- `src/pages/_document.tsx`
- `openspec/project.md`

---

### Q2. You use humps.camelize to convert API field names. What are the pitfalls? Why not just align frontend and backend on one naming style?

> Source: `tp-014` · scope: frontend · qq-project · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| humps camelize / decamelize 边界 | 必须掌握 | 本题核心。 |
| axios transformRequest / transformResponse | 必须掌握 | 插入点选择背后的机制。 |
| FormData / Blob 序列化注意事项 | 加分项 | 上传场景容易踩坑。 |

#### Tiered answers

**🟢 Elevator**: Aligning naming is ideal but unrealistic across many backends, so the frontend uses camelize at the request layer.

**🔵 Standard** (default):

We talk to multiple backends including pindao-bff, TAPD, Pangu and TOF, with mixed naming: some are snake_case, others camelCase, and a few use snake on request and camel on response. Doing the conversion per service is repetitive and error prone, so we run humps.camelize on request params inside beforeRequestHook in src/utils/request/index.ts (the BFF actually expects snake_case so this is effectively decamelize; both directions appeared historically, the point is to centralise it in the request layer). Business code stays camelCase internally; conversion only happens at the boundaries. Pitfalls: URL paths must not be converted or resource ids with underscores get mangled; keys mixing digits and capitals convert unreliably; nested bodies need deep traversal but File and Blob must be skipped.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why not unify, where to plug the converter, the actual pitfalls and our compromise. First, unification is cleanest in theory but unrealistic in practice. We talk to multiple backends; pindao-bff is new and can agree on a style, TAPD is a company-wide platform we cannot change, Pangu has legacy snake_case fields, TOF auth uses camelCase. Forcing the frontend to follow any single style is ugly, so the compromise is camelCase internally and conversion at the edges. Second, plug-in point. Three places were on the table: per-service manual conversion, axios transformRequest at the outer layer and at the component level. We picked the axios transformer because it has the full config (so it can decide whether to convert) and gives clear error attribution. Third, pitfalls. humps.camelize turns product_id into productId fine, but product_id_v2 in some versions becomes productIdV2 instead of productIdV_2; we added an ignore list for versioned fields. FormData uploads must keep field keys intact or the backend cannot find them. Deep nesting over five levels degrades conversion performance, so we skip when a single body exceeds 1 MB. Fourth, the compromise. URL paths are never converted, FormData is skipped, and endpoints with noTransform=true are skipped. With pindao-bff we agreed responses are camel and the frontend decamelizes requests into snake, so business code stays camel. The trade-off essentially says the frontend absorbs the legacy cost in one spot, which is cheaper than letting every feature handle it.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/utils/request/index.ts 中 beforeRequestHook 部分
  - [ ] humps 库 README 与已知 issue
  - [ ] axios transformRequest 文档
- 🛠️ Hands-on
  - [ ] 为一个嵌套 5 层的接口 body 写测试，验证 camelize 正确性
  - [ ] 给某个 FormData 上传接口加 noTransform 跳过转换
- ⚠️ Common pitfalls
  - 对 url path 做 camelize 把 /v2_user 改成 /v2User
  - FormData 字段被 camelize 后端找不到
  - 对带数字大写的字段转换不一致
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果某个接口希望保持 snake，你怎么单独跳过？
  - [ ] 前端用 camelize 后类型怎么生成？
  - [ ] 如果换成 zod / typia 自动序列化，方案会怎么变？
- ⏱️ Estimated time: **2-3 小时**


#### Evidence

- `src/utils/request/index.ts`

---

