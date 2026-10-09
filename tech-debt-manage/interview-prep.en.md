# 技术负债治理管理平台 — Interview Preparation

> Mode: candidate · Role: 全栈 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 1      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

I built an internal tech-debt console from the initial commit, with menus from a project API and automatic test deploys.

### Standard (30–60 seconds)

This is the tech-debt console for an internal QQ management line. I made the initial commit in February 2025 and built the admin app with React, Vite, and TDesign. The project list drives the menu, a shared table handles query and row actions, and Excel covers bulk import and export. The request layer reads tRPC response headers to separate expired login from authorization failure. A push to the test branch makes Orange CI build an image and update the test workload. The production branch builds the image and asks a person to update the workload. I owned the pages, the request contract, and the path from build through the test update.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

The console collects technical projects and security tickets. New projects keep appearing, so I did not hard-code the menu. The route module requests the project list while it loads, then picks a page by moduleId. The generic template also exposes import and settings routes. A failed request redirects to an error page instead of leaving a blank menu. List pages share CommonTable. A page passes query fields, columns, and buttons, and the table handles paging, sorting, and multi-select. Bulk data uses SheetJS: export writes xlsx, and import parses a file into JSON. Axios sends cookies and reads trpc-func-ret. Code 100001 clears cookies and reloads. Code 100002 extracts an authorization URL from the error header. Aegis reports to Galileo, with different identifiers for production and test. Delivery is part of the same work. The image runs Nginx and falls back to index.html. Test updates itself, while production sends a WeCom message after the image is built so a person confirms the rollout. The git history matches that timeline. My initial commit is dated 14 February 2025, and the next few days added the table, dialogs, Nginx, and the test build. By October I had added export, batch validation, a progress field, and the scheduled-task entry. The 2026 mobile adaptation was committed by a teammate, so I do not claim it. In an interview I keep the scope to the menu, table, import and export, session handling, and release cadence. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

## ✨ Highlights

- **从初始提交搭起可发布的管理端** (architecture · fullstack)
  In February 2025 I made the initial commit and, the same month, added pages, Nginx, and the pipeline so test could build and update its image.
  > Keywords: `React` · `Vite` · `Orange CI` · `Nginx`
- **专项列表驱动动态菜单** (architecture · frontend)
  The route module waits for the project API and selects a page by moduleId. The generic template adds import and settings routes.
  > Keywords: `动态路由` · `React.lazy` · `moduleId`
- **配置化表格承接多个专项** (feature · frontend)
  Each project passes query, column, and action config. The table owns paging, sorting, multi-select, and custom callbacks.
  > Keywords: `CommonTable` · `TDesign` · `分页`
- **Excel 批量导入导出** (feature · frontend)
  Export writes the current rows to xlsx. Import reads the uploaded file into JSON for the generic project to validate.
  > Keywords: `SheetJS` · `xlsx` · `批量导入`
- **测试自动发布、正式手动确认** (reliability · infra)
  A test push updates the test workload automatically. Master only pushes the image and sends WeCom, so production stays manual.
  > Keywords: `Docker` · `TKEx` · `Orange CI`


## 🏗️ Architecture (architecture) — 2 Q&A

### Q1. Why is the menu not hard-coded, and when does the project list become routes?

> Source: `tp-01` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 动态路由 | 必须掌握 | 菜单必须和后台专项列表一致。 |
| React.lazy | 必须掌握 | 专项页面按访问再加载。 |
| 顶层 await | 加分项 | 它决定菜单何时就绪，也决定失败时页面能否渲染。 |

#### Tiered answers

**🟢 Elevator**: The menu comes from the project API. The route module fetches it on load and lazy-loads a page by moduleId.

**🔵 Standard** (default):

Projects are configured on the server, so a hard-coded menu would miss new ones. projects.ts calls getProjectListNew at module scope. The returned projectInfos go through createRouter. Module ids 1 through 5 map to scan, management, certification, compute, and disaster-recovery pages. Id 99 uses the generic template. That template adds import and settings routes beside the home page. Unauthorized items stay out of the menu. Pages use React.lazy so every project is not in the first bundle. A failed list request does not create an empty menu. It switches to the load-failure page.

<details><summary>🔴 Deep dive (click to expand)</summary>

The requirement was one console for many projects, with more projects added later. A static route per project would need a frontend release for every menu change. The route table therefore comes from the API. The file awaits the list at the top so the menu exists before the app renders. createRouter uses the category array to decide between a top-level item and a nested menu. A single name becomes a home route. The generic template also appends hidden importing and settings routes, so those actions stay out of the sidebar. An unknown moduleId falls through to the More page instead of a blank screen. A project with isAuthed false does not get a usable route. An empty list or a thrown request becomes an error route and the browser moves to /project/error. The user sees a load failure rather than an empty shell. Lazy components sit on the route objects, so a page downloads when that project is opened. The category array decides menu depth. One name becomes a leaf route, and several names become an expandable parent. Child values must be unique. I fixed a bug where duplicate values expanded two items together. An unknown moduleId lands on the More page, so a new backend type does not crash the frontend. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] React Router 嵌套路由
  - [ ] React.lazy 与 Suspense
- 🛠️ Hands-on
  - [ ] 用一份 JSON 菜单生成两级路由，并给未知类型一个兜底页
- ⚠️ Common pitfalls
  - 接口失败时路由模块抛错，整站没有菜单
  - 隐藏路由忘记标记，导入页出现在侧栏
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果专项从 10 个变成 100 个，这段路由还要改什么？
- ⏱️ Estimated time: **1 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What happens to a project the user cannot access?** (security)
  > If isAuthed is false, I do not create a usable menu entry. Authorization failure is also handled in the request layer with a separate URL.


#### Evidence

- `src/router/modules/projects.ts`

---

### Q2. Why can several projects share one table component?

> Source: `tp-02` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 配置驱动界面 | 必须掌握 | 新专项复用交互，只替换列和接口。 |
| 受控分页 | 必须掌握 | 页码和筛选必须一起进入请求。 |
| Redux Toolkit | 加分项 | 查询条件跨页面保留。 |

#### Tiered answers

**🟢 Elevator**: Differences stay in config. CommonTable owns query, paging, sorting, and row actions.

**🔵 Standard** (default):

Columns and filters differ, but list interaction is similar. I put query fields, columns, and buttons into querySet, tableSet, and operationSet. The page passes getListApi. The table keeps page, page size, sort, and selected rows, then sends page, page_size, and filters. handleQuery can rewrite params before the request. Row click, double-click, and buttons have callbacks, so a project dialog does not copy table state. Search state also goes into the search store and can be restored after returning from a detail page.

<details><summary>🔴 Deep dive (click to expand)</summary>

Each project first had its own table, and paging and reset logic were copied. I moved the stable interaction into SelectTable and left business rules in config and callbacks. SearchForm renders the query config, so field names are not hard-coded in the table. getListData builds paging params. If the page passes handleQuery, that function shapes the filters; otherwise the filter object is spread. Sort lives in table state and is included when the page changes. isMultiple turns on selection, and checkValid lets the page reject illegal rows. fetchAllAtOnce is for statistics that need the full result before client processing. Normal lists still request one page. Selected rows leave through onSelectChange for bulk actions. Adding a project then means writing column config and an API function, not another pager. The cost is a large config object, so field meanings have to stay explicit in the types. Reset clears SearchForm and returns to page one. Otherwise the old filter stays on the next request. Column width changes go back through handleResizable, so a page can remember the width an operator dragged. The caller supplies rowKey, which keeps selection stable when projects use different primary-key names. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate. Search values live in the store, and returning from detail must request again with that same filter.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] TDesign Table 分页与排序
  - [ ] 受控组件和状态提升
- 🛠️ Hands-on
  - [ ] 做一个三列配置表，支持服务端分页和返回详情后恢复筛选
- ⚠️ Common pitfalls
  - 页码和筛选各存一份，重置后请求仍带旧条件
  - 把业务判断写进通用表格，下一个专项无法复用
- 🤔 Self-check questions (answer without notes)
  - [ ] 配置化表格和每个页面各写一张表，你怎么选？
- ⏱️ Estimated time: **1 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What if one project action cannot be expressed as config?** (trade-off)
  > I keep customBtnCallback and customOptCallback. Config covers the common path, and callbacks handle dialogs or imports.


#### Evidence

- `src/components/CommonTable/index.tsx`

---

## 🧩 Feature (feature) — 1 Q&A

### Q1. How do bulk import and export connect to the generic project?

> Source: `tp-03` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| SheetJS | 必须掌握 | 导入和导出都经过工作簿，而不是手写 csv。 |
| 文件校验 | 必须掌握 | 错误文件不应进入提交接口。 |
| 上传体积 | 加分项 | 网关上限和接口超时不是一回事。 |

#### Tiered answers

**🟢 Elevator**: Export uses SheetJS to build xlsx. Import reads the file into JSON, then the generic project validates and submits it.

**🔵 Standard** (default):

The generic project uses moduleId 99 and has its own importing route. Export calls downloadJsonToXlsx or downloadArrayToXlsx, writes the rows into a workbook, and downloads a Blob. Import uses transformXlSXFileToJson and reads the first sheet. validateFileFormat checks the extension and header before any request. Nginx sets client_max_body_size to 5000m so a larger workbook is not rejected at the gateway. The import page is a hidden route opened from a list button. The import route carries the project id, so one page can serve different generic projects.

<details><summary>🔴 Deep dive (click to expand)</summary>

Operators needed to update many tickets, and row-by-row editing was too slow. I split Excel into two directions. For export, XLSX utilities turn JSON or a two-dimensional array into a sheet. bookSST stays off to favor speed. workbook2blob writes binary output and wraps it in a Blob. openDownloadDialog creates an object URL and clicks an anchor. For import, FileReader reads binary data, XLSX.read parses it, and sheet_to_json returns rows to the page callback. Validation sits after upload and before submit. A bad format stops in the browser and names the missing columns. The generic import route carries idInfo, so one page serves different projects. The list page only navigates there. Parsing does not live inside CommonTable. Large files have two edges. The request timeout is 5 seconds, so a huge sheet can be parsed locally and still be cancelled before the response returns. The 5000m gateway limit does not mean the browser or backend should accept that size. Bulk import still needs a row limit. downloadMultiArrayToXlsx can write several sheets, so statistics and detail do not require two downloads. Import reads only the first sheet, which keeps an instruction sheet from being submitted. Parsing happens in the browser, and a large file blocks the main thread. The import page is therefore separate and does not put that cost on the list page first render. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] SheetJS 读取与写出
  - [ ] Blob 下载
- 🛠️ Hands-on
  - [ ] 上传一个三列表格，校验缺列并导出当前页
- ⚠️ Common pitfalls
  - 只校验扩展名，不校验表头
  - 对象 URL 创建后从不释放
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不把解析函数放进 CommonTable？
- ⏱️ Estimated time: **1 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If import fails halfway, what happens to rows already written?** (reliability)
  > The browser validates the whole sheet first and then submits once. A failed request shows a retry message. I do not keep a partial-success state in the browser.


#### Evidence

- `src/utils/handleExcel.ts`
- `src/router/modules/projects.ts`

---

## ⚡ Performance (performance) — 1 Q&A

### Q1. Why do some lists request one page while others fetch everything?

> Source: `tp-07` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 服务端分页 | 必须掌握 | 列表规模不受前端内存限制。 |
| 一次拉全量 | 加分项 | 只用于有边界的统计和校验。 |

#### Tiered answers

**🟢 Elevator**: Normal lists request one page. Full fetch is only for client statistics or custom validation.

**🔵 Standard** (default):

CommonTable sends page and page_size by default. Filter and sort changes query the server again, and the browser renders the current page. When fetchAllAtOnce is on, a larger result returns once for client statistics or bulk validation. The statistics dialog uses that path. Ordinary ticket lists do not. A full fetch lengthens the first wait and drops server sort order. The timeout is still the global 5 seconds, so a full-fetch API has to stay small. The default page size is 10, and a page can change it through pageSizeOPtions.

<details><summary>🔴 Deep dive (click to expand)</summary>

I did not make every table fetch all rows. Ticket lists grow with each project, and returning every row helps neither the first screen nor memory. Server paging also makes filters effective, so the client does not filter stale rows again. Full fetch stays where the result has a bound. Statistics need one batch to calculate a ratio, and paging would split that calculation. checkValid also needs the current selectable set, not only the visible page. This is a switch on the same table, not a second component. Params still leave through getListData, and the page decides whether the API ignores page number. The trade is one less component and one explicit parameter for the caller. If statistics later grow, aggregation should move to the backend and the client should receive the result. fetchAllAtOnce is not a default optimization. It reduces request count and increases the size of one response. pageSizeOPtions lets a page choose a size that fits scan results, while the default stays 10. Server sort and client sort must not be mixed. After fetchAllAtOnce is on, table sort only describes the returned batch. I do not describe it as the order of the whole dataset. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate. The statistics dialog needs one complete batch, so only that case turns on a single full fetch.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 分页参数设计
  - [ ] 前端聚合与后端聚合
- 🛠️ Hands-on
  - [ ] 同一张表分别按页和全量请求，比较返回体积
- ⚠️ Common pitfalls
  - 统计接口也按页求和，结果随翻页变化
  - 默认打开全量开关
- 🤔 Self-check questions (answer without notes)
  - [ ] 减少请求次数就等于更快吗？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What if the full result exceeds the timeout?** (reliability)
  > I would not raise the global timeout. The statistic should be aggregated by the backend, or that API should get its own timeout and row cap.


#### Evidence

- `src/components/CommonTable/index.tsx`

---

## 🛡️ Reliability (reliability) — 2 Q&A

### Q1. How do you detect expired login and business failure when HTTP status stays successful?

> Source: `tp-04` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Axios 拦截器 | 必须掌握 | 业务码不在 HTTP body 的固定位置。 |
| 登录态失效 | 必须掌握 | 过期后要终止旧页面，而不是只弹一句错误。 |
| 错误码映射 | 加分项 | 使用者只看能行动的文案。 |

#### Tiered answers

**🟢 Elevator**: I read trpc-func-ret. Code 100001 reloads login, 100002 extracts an auth URL, and other codes map to a message.

**🔵 Standard** (default):

The backend uses tRPC and puts the business code in a response header, while HTTP can still be 200. The interceptor reads trpc-func-ret first. Code 100001 means the login expired. I expire each document.cookie entry and reload, so the gateway can start login again. Code 100002 means authorization failed. A regular expression takes the https URL from trpc-error-msg and returns it with the data to the route layer. Other codes enter errorMap. Known ones get a fixed message, such as duplicate or missing record. Unknown ones say the system is busy. Network errors use the second callback and follow the same mapping.

<details><summary>🔴 Deep dive (click to expand)</summary>

Looking only at HTTP status treats an expired login as an ordinary success or failure. The user stays on the stale page and clicks keep failing. The success interceptor therefore handles two special codes first. Cookie clearing changes expires and path only. Cookie values are not sent to monitoring. After reload, the route module requests the project list again. Authorization failure should not reload, because the user may simply lack one project. I pass the authorization URL out. The route module stores it on window.authUrl, and the no-access page uses it to guide an application. errorMap collapses many internal codes into a busy message. Those codes do not help the user, and showing them exposes internal numbers. Duplicate and missing records are actionable, so they keep specific copy. The timeout is 5 seconds. That fits normal admin queries, but export or a large submit can be short. If more bulk APIs appear, they should get their own timeout instead of raising the global one. In the success callback I treat an empty data payload as an error instead of rendering it. The network callback first checks that err.response exists. A timeout has no response, and reading headers immediately would throw again. Mapped copy leaves through Promise.reject rather than a hardcoded toast, so the page decides whether to show it. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Axios interceptors
  - [ ] tRPC HTTP 映射
- 🛠️ Hands-on
  - [ ] 模拟 100001 和 100002 两个响应头，确认页面行为不同
- ⚠️ Common pitfalls
  - 鉴权失败也整页刷新，使用者不知道去哪里申请
  - 把内部错误码直接展示出来
- 🤔 Self-check questions (answer without notes)
  - [ ] HTTP 200 就代表业务成功吗？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What happens when the error header is missing?** (reliability)
  > The interceptor falls back to data.message, err.message, or a generic contact-admin message. It does not assume every response has trpc-func-ret.


#### Evidence

- `src/utils/request.ts`

---

### Q2. Why do test and production releases differ?

> Source: `tp-09` · scope: infra · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Orange CI | 必须掌握 | 测试和正式使用不同的构建与更新步骤。 |
| Nginx SPA | 必须掌握 | 前端路由刷新要回到 index.html。 |
| 镜像发布 | 加分项 | 构建成功和正式生效是两步。 |

#### Tiered answers

**🟢 Elevator**: Test builds and updates the workload on push. Production only builds the image, then WeCom asks a person to update it.

**🔵 Standard** (default):

The app is static output from Vite. The Dockerfile starts from an Nginx image and copies dist plus nginx.conf. Nginx uses try_files and falls back to index.html for frontend routes. In Orange CI, the test branch runs build:test, pushes the image, and calls stke:update on the test workload. Master runs the production build and push, then writes the image tag into a WeCom message. A person updates the production workload. Test can be automatic because the blast radius is small. Automatically rolling a bad production build would affect users immediately.

<details><summary>🔴 Deep dive (click to expand)</summary>

The project starts from the February initial commit, and the release path was added the same month. It was not attached to another platform later. The pipeline uses Node 20 to install and build. Dependencies come from the internal npm mirror. The image registry and workload update are both in the pipeline. I let test update automatically because import, query, and login are verified many times a day. The test address stays close to the latest commit. Production keeps a person in the loop. A successful build only proves that the image was pushed, not that every user should receive those assets immediately. The message includes the image tag, so the person does not pick the wrong one. Two Nginx settings are tied to the product. SPA fallback keeps a refresh on a deep route from returning 404. client_max_body_size is 5000m so an Excel upload is not rejected early by the gateway. Gzip compresses text assets. That size limit is an upload constraint, not a performance optimization. The container has no backend process. APIs still come from a separate service. This deployment therefore handles static assets and release cadence, not server rendering. Production and test image tags include the branch, time, and short commit, so a rollback can return from a tag to a commit. The Dockerfile does not run Node. It only copies build output. There is no npm process at runtime. On the machine I check whether Nginx serves dist from /etc/nginx/html. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Docker 多阶段与静态站点镜像
  - [ ] Nginx try_files
- 🛠️ Hands-on
  - [ ] 把一次测试分支推送跟到镜像标签和负载更新
- ⚠️ Common pitfalls
  - 正式环境也自动更新，错误构建直接生效
  - 忘记 SPA 回退，刷新子路由 404
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么测试可以自动更新，正式不行？
- ⏱️ Estimated time: **1 天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **If the build succeeds but the page is old, where do you look first?** (reliability)
  > I first compare the workload image tag with the tag pushed by this pipeline. Production does not switch merely because the push succeeded.


#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `nginx.conf`

---

## 📈 Observability (observability) — 1 Q&A

### Q1. Where do you look when a page or API call fails?

> Source: `tp-05` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 伽利略 | 必须掌握 | 前端错误和接口明细都看这里。 |
| 环境隔离 | 必须掌握 | 测试流量不能进正式大盘。 |
| Aegis | 加分项 | SDK 负责采集，业务代码只做初始化。 |

#### Tiered answers

**🟢 Elevator**: Aegis starts with the app and reports to Galileo. Production and test use different identifiers, and API detail is enabled.

**🔵 Standard** (default):

main.tsx creates Aegis before rendering. hostUrl points at the Galileo collector. The report id switches on import.meta.env.MODE: release uses production, and other modes use test. With plugin.api.apiDetail, URL, status, and timing reach the dashboard. Script errors are collected by the SDK too. I separate environments first so test traffic does not enter the production board. The identifier stays in environment configuration and out of interview notes. Business events go through reportEventFunc, so pages do not depend on the monitoring SDK directly.

<details><summary>🔴 Deep dive (click to expand)</summary>

This admin app has no separate frontend log service, so monitoring is the first place I look. Initialization happens before React renders, which covers first-screen script errors and the earliest project-list request. Production and test have different identifiers because test repeatedly imports and reloads. Mixing them inflates the error rate. apiDetail shows the failing API, but not business data from the request body. That is enough to identify the endpoint. It does not replace a backend trace. The browser evidence only shows that a request was sent and which status returned. Repeated failures caused by expired login need trpc-func-ret beside the chart. A burst of reloads makes me check the 100001 path before assuming the API became slow. The collector host stays fixed. Only the project identifier changes by environment, so test data is not written into the production app. window.AegisV2 is global so a few reports that do not pass through Axios can still call reportEvent. Business events go through reportEventFunc in utils, which keeps the monitoring SDK out of every page. When I inspect production, I first confirm MODE is release. Otherwise I am looking at the test application. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate. The report identifier follows MODE, and in production I only read API detail for the production application.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] 前端监控接入
  - [ ] 区分脚本错误和接口错误
- 🛠️ Hands-on
  - [ ] 在测试环境触发一次接口失败，并在监控里找到这条记录
- ⚠️ Common pitfalls
  - 正式和测试共用一个上报标识
  - 在监控里记录 Cookie 或请求体
- 🤔 Self-check questions (answer without notes)
  - [ ] 前端监控能证明后端根因吗？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What do you inspect when monitoring has no stack?** (observability)
  > I check the failed API, status, and business code in the response header, then return to that page's request params. Frontend monitoring only localizes the call.


#### Evidence

- `src/main.tsx`

---

## 🔒 Security (security) — 1 Q&A

### Q1. Where does the session live, and why do expiry and missing permission take different paths?

> Source: `tp-06` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Cookie 会话 | 必须掌握 | 身份在网关，不在前端存储。 |
| 开放重定向 | 必须掌握 | 鉴权地址必须限制协议。 |
| 权限与登录分离 | 加分项 | 两种失败对使用者的下一步不同。 |

#### Tiered answers

**🟢 Elevator**: Requests send cookies. Expiry clears them and reloads. Missing permission keeps the page and only exposes an application URL.

**🔵 Standard** (default):

Axios sets withCredentials. The gateway writes the session cookie, and the frontend does not store a token. Expiry is code 100001. Keeping the old cookie only repeats failures, so I expire the local cookies and reload. Missing permission is code 100002. The person is already logged in and only lacks a project. I extract an https URL from trpc-error-msg and give it to the no-access page. Reloading both cases would hide the application entry. The regular expression accepts only https, so an arbitrary string in the error header cannot become a redirect.

<details><summary>🔴 Deep dive (click to expand)</summary>

The admin app sits behind an internal gateway, so I did not build a password login. The browser only attaches the cookie. The frontend never handles a long-lived credential or puts identity in localStorage. The expiry risk is a loop. If cleanup is incomplete, reload still sends the old cookie and the page receives 100001 again. Deletion therefore sets path=/ and a past expires. I do not print cookie values in logs. Missing permission needs a conservative path. The error header is assembled by the server and may contain unexpected text. The expression requires an https URL and takes the first match. Without a match, there is no redirect, only the data and the unauthorized state. window.authUrl is a small handoff between the route module and the request layer. It is not the authorization system. The gateway and backend still decide access. The frontend only chooses a menu, an error page, or an application entry. Cookie cleanup cannot delete only known names. The gateway may add session fields, so expiring every current cookie is safer. location.reload makes the route module run its top-level request again. The no-access URL is stored but not followed inside the interceptor, so one list request does not suddenly navigate away. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate. The authorization URL comes from the response header. The page uses it for the access request, and the interceptor does not navigate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] Cookie 与 withCredentials
  - [ ] 开放重定向
- 🛠️ Hands-on
  - [ ] 构造一条非 https 的错误头，确认页面不会跳走
- ⚠️ Common pitfalls
  - 把鉴权地址直接赋给 location.href
  - 登录过期后只弹提示，不清理 Cookie
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么没权限不能和登录过期一样刷新？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **Can hiding a menu item enforce permission?** (security)
  > No. Hiding a menu only changes the interface. The gateway and backend must still reject the API. The frontend only renders the 100002 result.


#### Evidence

- `src/utils/request.ts`

---

## ⚖️ Trade-off (trade-off) — 1 Q&A

### Q1. Why await the API at the top of the route module instead of rendering first and filling the menu later?

> Source: `tp-08` · scope: fullstack · tech-debt-manage · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 顶层 await | 必须掌握 | 它把接口耗时放进应用启动。 |
| 路由稳定性 | 必须掌握 | 菜单未返回时不能误判 404。 |
| 渐进渲染 | 加分项 | 接口变慢后再把等待从整站缩小到菜单区。 |

#### Tiered answers

**🟢 Elevator**: Waiting for the menu avoids flashing an empty one. The cost is that a slow API blocks the whole entry.

**🔵 Standard** (default):

The alternative renders a static shell first, then fetches projects and updates routes. That is faster, but the menu grows from empty and a deep link can hit 404 first. I chose a top-level await so the route table exists before BrowserRouter uses it. Failure goes straight to /project/error and does not render half a menu. The drawback is that getProjectListNew adds directly to time to interactive, and a module failure affects every route. The first action in this console is choosing a project, so an empty menu has no value. I accept the wait.

<details><summary>🔴 Deep dive (click to expand)</summary>

This choice was made early. There were few projects, the API was usually fast, and waiting made the menu match the URL with the least code. Rendering first would add three jobs. Unknown URLs must not become 404 during startup. Returned routes must replace the table without dropping the current URL. A failed request must turn an already rendered shell into an error page. All of that is possible, but it was not needed then. The current cost is clear. On a slow network the user sees the browser loading instead of an in-app skeleton. A module-level error is also harder for a React error boundary to catch alone. If the project API becomes slow, I would render the shell first, give the menu its own loading state, keep the deep-link path, and validate it after the list returns. I am not changing it now because that latency problem has not appeared, while the empty-menu flash is already avoided. In an interview I describe this as a staged trade-off, not a structure that is right forever. The top-level await also depends on the build target. Vite build.target is esnext, because an older target may reject the module syntax. The failure redirect checks pathname and does not redirect again when it is already /project/error, which prevents a reload loop. I added that guard after seeing the load-failure path refresh repeatedly. I can point to the file for this behavior, and I do not include the later mobile work committed by a teammate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] ES modules 顶层 await
  - [ ] React Router 动态路由
- 🛠️ Hands-on
  - [ ] 把等待改到组件内，比较空菜单闪动和首屏时间
- ⚠️ Common pitfalls
  - 接口未返回就注册通配 404
  - 失败后没有任何错误页
- 🤔 Self-check questions (answer without notes)
  - [ ] 启动时请求菜单，还有哪些做法？
- ⏱️ Estimated time: **半天**

#### Follow-ups (interviewer deep probes)

- ⚖️ **What signal would justify changing this wait later?** (performance)
  > I would change it when the project-list API regularly exceeds a normal query, or when users can perceive the blank wait. Then I would split the shell from menu loading.


#### Evidence

- `src/router/modules/projects.ts`

---

