# QQ 项目管理门户 (qq-project) — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：**会写 React，但对 Next.js Pages Router、Zustand、Axios 拦截器、Schema 驱动 UI、内网工程化（Aegis / TOF / Orange CI / TKE）还没实战过的同学**
> 目标：跟着做完，覆盖知识图谱里的 18 项必备 + 4 项加分知识点

---

## 0. 怎么使用这份指引

知识图谱里 22 个知识点，围绕 **10 道考题（q-01 ~ q-10）+ iq-xx 镜像题** 展开，每道题是一个"知识簇"。本指引按**学习顺序**把这些簇重新排序，每个簇给你：

1. **它在解决什么真实问题**（一句话场景）
2. **零基础前置**：如果连这一步都不熟，先补什么
3. **必读材料**：每条都给可直接点击的官方/权威外链（内网文档会标注"需内部权限"）
4. **动手练习**：从最小可运行 demo 开始
5. **自检清单**：能口头回答=过关

> 推荐节奏：**每个簇 1~2 个晚上**，10 个簇大约 3~4 周。

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：状态与请求基建 | 1, 2, 3 | Zustand、Axios、状态域拆分 |
| 阶段 B：Schema 驱动与 OpenSpec | 4, 5 | 配置驱动 UI、规格驱动开发 |
| 阶段 C：可观测与监控 | 6 | Aegis、retcode 分层 |
| 阶段 D：渲染与认证 | 7, 8 | Next.js Pages Router、SSO、StrictMode |
| 阶段 E：工程化部署 | 9, 10 | Docker、Orange CI、TKE、Playwright |

---

## 阶段 A：状态与请求基建

### 簇 1（q-02 / iq-02）：Zustand + selector + 状态域拆分

**覆盖知识点**：Zustand createWithEqualityFn / shallow、状态域拆分 / Domain decomposition
**真实场景**：项目里有 9 个 store，怎么避免互相循环依赖？怎么让组件只在关心的字段变化时重渲染？

#### 0-1 零基础前置
- 用过 useState、useContext；知道"重渲染"概念。

#### 必读材料
1. [Zustand 官方文档](https://zustand.docs.pmnd.rs/)
2. [Zustand — Selectors with shallow](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
3. [Zustand — createWithEqualityFn](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5#using-custom-equality-functions-such-as-shallow)
4. [React 官方文档 — Memoization](https://react.dev/reference/react/memo)
5. **项目内**：`src/store/index.ts`、`src/store/useViewManageStore.ts`

#### 动手练习
- 把一个 useState 驱动的本地组件改造成依赖某个 Zustand store，例如 `useViewManageStore`。
- 故意去掉 `shallow` 比较：
  ```ts
  // 有 shallow
  const { name, list } = useStore(s => ({ name: s.name, list: s.list }), shallow);
  // 无 shallow（每次返回新对象，全量重渲染）
  const { name, list } = useStore(s => ({ name: s.name, list: s.list }));
  ```
  用 React DevTools Profiler 对比渲染次数。
- 给 `useViewManageStore` 加一个新 action（如 `archiveView`），保证浅比较仍然有效。
- 画一张 9 个 store 的依赖图，标出哪些 store 之间有显式调用，避免循环。

#### 自检
- [ ] 能解释 `useStore(s => s.user)` 比 `useStore().user` 性能好的原因。
- [ ] 能说出 store 拆分的 3 个信号（数据域分离、生命周期不同、更新频率不同）。
- [ ] 知道 `createWithEqualityFn` 在 Zustand v5 里替代了什么。

---

### 簇 2（q-03 / q-08 / iq-03）：Axios 拦截器 + transform hook + camelize 边界

**覆盖知识点**：Axios 拦截器与 transform hook、humps camelize/decamelize 边界、前端重试策略与幂等性
**真实场景**：后端用 snake_case，前端用 camelCase；接口失败要自动重试，但 POST 不能重复创建。

#### 0-1 零基础前置
- 用过 axios 发请求；知道 `interceptors.request` 和 `interceptors.response`。

#### 必读材料
1. [Axios 拦截器文档](https://axios-http.com/docs/interceptors)
2. [Axios — Config Defaults](https://axios-http.com/docs/config_defaults)
3. [humps GitHub](https://github.com/domchristie/humps)
4. [axios-retry GitHub](https://github.com/softonic/axios-retry)
5. **项目内**：`src/utils/request/index.ts`、`src/utils/request/axios-transform.ts`

#### 动手练习
- 为 mock 后端写一个带重试和监控上报的 axios 封装：
  - `requestInterceptor`：snake_case → camelCase（用 humps）。
  - `responseInterceptor`：camelCase → 业务态分发。
  - 失败时上报 Aegis（暂时 console.log 占位）。
- 处理 humps 边界：
  - FormData / Blob / File 类型跳过转换（加 `noTransform: true`）。
  - 嵌套 5 层的 body 写测试覆盖。
- 加幂等机制：
  - POST 请求自动生成 `idempotency-key` 并放在 header。
  - 重试时复用同一个 key。
  - 用指数退避：1s → 2s → 4s（对比固定 1s 间隔的体验）。

#### 自检
- [ ] 能画出"请求 → 拦截器 → 网络 → 响应拦截器 → 错误分发"链路图。
- [ ] 能说出 humps 转换的 3 个坑（FormData、特殊字段如 ID、嵌套数组）。
- [ ] 能解释幂等 token 在重试场景下的作用。

---

### 簇 3（q-05 / iq-05）：递归分页 + xlsx 写盘 + Worker

**覆盖知识点**：递归分页 / 异步累加导出、SheetJS / xlsx 写盘
**真实场景**：导出 1 万行配置数据，后端单页只返回 100 条，要递归拉完再生成 Excel。

#### 0-1 零基础前置
- 知道分页接口的 `page / pageSize / total` 概念。

#### 必读材料
1. [SheetJS 官方文档](https://docs.sheetjs.com/)
2. [SheetJS — Cell Object](https://docs.sheetjs.com/docs/csf/cell)
3. [MDN — Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
4. **项目内**：`src/hooks/useConfigManage.ts`、`src/utils/file.ts`

#### 动手练习
- 实现一个 1 万行数据的导出：
  ```ts
  async function exportAll() {
    let page = 1, all = [];
    while (true) {
      const { data, hasMore } = await fetchPage(page);
      all.push(...data);
      onProgress(all.length / total);
      if (!hasMore) break;
      page++;
    }
    return xlsx.utils.aoa_to_sheet(all);
  }
  ```
- 加 progress 提示（百分比 + 当前条数）。
- 把一个长数字字段（如 QQ 号）强制用 `cellType='s'` 输出，防止 Excel 自动转科学计数法。
- 进阶：把"拉数据 + 写盘"挪到 Web Worker，对比主线程版本的卡顿差异。

#### 自检
- [ ] 能说出大数据量导出的 3 种策略（前端递归、后端流式、异步任务）。
- [ ] 能解释 xlsx 的 cell type `s/n/b/d` 分别代表什么。
- [ ] 知道纯前端导出的极限（10 万行内还能接受，再多要后端流式）。

---

## 阶段 B：Schema 驱动与 OpenSpec

### 簇 4（q-01 / iq-01）：Schema 驱动 UI + 自定义 Hook 抽象

**覆盖知识点**：配置驱动 / Schema-driven UI、高阶组件与自定义 Hook 抽象（useConfigCreate / useConfigManage）
**真实场景**：业务每周新增一个"配置类页面"（黑名单、敏感词、白名单……），都是表格 + 表单，怎么不重复写？

#### 0-1 零基础前置
- 写过 React 表单组件；知道什么是"高阶抽象"。

#### 必读材料
1. [JSON Schema 官方文档](https://json-schema.org/learn/getting-started-step-by-step)
2. [Formily 设计文档](https://formilyjs.org/) — 协议化表单经典实现
3. [React Hook Form](https://react-hook-form.com/)
4. **项目内**：`src/materials/` 下任意 schema 文件、`src/hooks/useConfigCreate.ts`、`src/hooks/useConfigManage.ts`、`.codebuddy/skills/config-page-development/SKILL.md`

#### 动手练习
- 阅读现有 `src/materials/` 下任意一个 schema，理解字段定义结构（type、validate、render）。
- 用现有 schema 结构新增一个"黑名单管理"页面：
  - 表格列：`account / reason / operator / createdAt`。
  - 表单：账号（必填）+ 原因（下拉选）+ 备注（可选）。
  - 复用 `useConfigCreate` / `useConfigManage`。
- 把一个老命令式列表页（如果有）改造成 schema 驱动，对比代码量。
- 实现一个最小版 `useConfigCreate`，覆盖 `init / submit / validate`。

#### 自检
- [ ] 能说出 schema 驱动相比命令式 UI 的 3 个优势（一致性、可配置、可生成）。
- [ ] 能解释 `useConfigCreate` 这种自定义 Hook 抽象的边界（哪些放 Hook、哪些留组件）。
- [ ] 知道 schema 驱动的极限（极度个性化的 UI 反而难做）。

---

### 簇 5（q-04 / iq-04）：OpenSpec 规格驱动开发

**覆盖知识点**：OpenSpec 规格驱动开发、前后端权限校验分工
**真实场景**：一个新需求"视图归档"要落地，怎么把它拆成规范化的提案、设计、规格、任务？

#### 必读材料
1. [OpenSpec 官方文档](https://github.com/Fission-AI/OpenSpec) — 规格驱动开发
2. [Spec-driven development（Microsoft 介绍）](https://github.com/microsoft/spec-driven-dev)
3. **项目内**：`openspec/AGENTS.md`、`openspec/changes/add-view-management/proposal.md`、`design.md`、`specs/view-management/spec.md`、`tasks.md`

#### 动手练习
- 完整阅读 `openspec/changes/add-view-management/` 四件套（proposal / design / spec / tasks）。
- 按 OpenSpec 流程写一个『历史视图归档』小提案：
  - `proposal.md`：为什么做、做什么、不做什么。
  - `design.md`：技术方案、数据流、风险。
  - `spec.md`：可验收的功能点列表。
  - `tasks.md`：拆到 0.5 天粒度的任务清单。
- 把一个临时 issue（口头需求）改造成四件套，对比"立刻动手"和"规格先行"的差异。
- 给某个权限敏感的按钮加 `checkPermission`：
  - 前端按 viewId 权限决定按钮是否可点。
  - 构造跨产品 viewId 越权场景，验证后端拦截。

#### 自检
- [ ] 能说出 proposal / design / spec / tasks 各自的产出物。
- [ ] 能解释"前端权限是 UX、后端权限是安全"。
- [ ] 知道什么样的需求适合走 OpenSpec（>1 周工期、跨多模块、有破坏性变更）。

---

## 阶段 C：可观测与监控

### 簇 6（q-06 / iq-06）：Aegis 监控 + retcode 分层 + 业务错误标准化

**覆盖知识点**：Aegis V2 / 前端监控 SDK、业务 retcode 与 HTTP 状态的差异、错误标准化
**真实场景**：线上用户报"页面白屏"，没有具体错误信息怎么定位？

#### 0-1 零基础前置
- 知道 `try/catch`、`window.onerror`、`unhandledrejection`。

#### 必读材料
1. [Aegis V2 官方文档](https://aegis.qq.com/docs)（部分需内部权限）
2. [MDN — GlobalEventHandlers.onerror](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror)
3. [MDN — unhandledrejection 事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event)
4. [MDN — Source map](https://developer.mozilla.org/en-US/docs/Glossary/Source_map)
5. **项目内**：`src/hooks/useAegis.ts`、`src/utils/request/index.ts` 中 `responseInterceptors`

#### 动手练习
- 实现一个最小 Aegis 上报封装：
  - 覆盖 `window.onerror` + `unhandledrejection` + axios 拦截器。
  - 自动带上 `userId / pageUrl / userAgent / traceId`。
- 为某个白名单接口跳过上报：
  - 比如轮询接口（调用太频繁），加 `noReport: true` 配置。
  - 对比降噪前后的上报量。
- 设计一组 retcode（业务错误码）：
  - `SUCCESS = 0`
  - `EXPECTED_FAIL = 1xxxx`（如重复点赞，不上报）
  - `REAL_ERROR = 5xxxx`（系统异常，要上报）
- 把上报字段标准化成 `{ msg, code, url, ext }`。

#### 自检
- [ ] 能说出 `statusCode === 200 && retcode !== 0` 这种"软错误"的处理思路。
- [ ] 能解释为什么"业务可预期失败"不应该上报（如表单校验失败）。
- [ ] 知道 sourcemap 在监控里的作用，以及为什么不能放公网。

---

## 阶段 D：渲染与认证

### 簇 7（q-07 / iq-07）：Next.js Pages Router + ssr:false + StrictMode

**覆盖知识点**：Next.js Pages Router 与 ssr:false (NoSSR)、React StrictMode 双 effect 模型
**真实场景**：一个组件依赖 `window`，SSR 直接报错；StrictMode 下 useEffect 跑两次，第三方 SDK 报"重复 init"。

#### 0-1 零基础前置
- 写过 Next.js Pages Router 项目；知道 SSR 概念。

#### 必读材料
1. [Next.js 官方 — dynamic import](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr)
2. [Next.js — _app.tsx 与 _document.tsx](https://nextjs.org/docs/pages/building-your-application/routing/custom-app)
3. [React 官方 — StrictMode](https://react.dev/reference/react/StrictMode)
4. [React 官方 — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
5. **项目内**：`next.config.js`、`src/components/Dynamic.tsx`、`src/pages/_app.tsx`、`_document.tsx`

#### 动手练习
- 用 `next/dynamic` 把一个依赖 `window` 的组件改成 `ssr: false`：
  ```ts
  const Chart = dynamic(() => import('./Chart'), { ssr: false });
  ```
  对比"直接 import"会报什么错。
- 在 `_document.tsx` 里加一段静态资源预加载，验证不影响 NoSSR 组件。
- 故意打开 `reactStrictMode: true`：
  - 观察 useEffect 双触发现象。
  - 修复一个 bug（比如 setInterval 没清理导致两个定时器叠加）。
  - 排查一个 SDK 在双 init 下报错的最小复现，加 ref 守卫。

#### 自检
- [ ] 能说出 `ssr: false` 和"完全不导入"的差异（前者保留代码分割）。
- [ ] 能解释 StrictMode 双触发的设计意图（强制写 cleanup）。
- [ ] 知道 `_app.tsx` 和 `_document.tsx` 的执行时机差异（每次请求 vs 仅 SSR 阶段）。

---

### 簇 8（q-09 / iq-08）：Cookie 认证 + SSO 跳转 + Playwright + QPilot 注入

**覆盖知识点**：Cookie-based vs token-based 认证、前端 SSO 重定向与 redirectUrl 续接、Playwright + storageState、QPilot AI Agent 注入
**真实场景**：内网项目用公司 SSO，401 时要跳登录页并带回当前 URL；E2E 测试不想每次都登录。

#### 0-1 零基础前置
- 知道 cookie 和 localStorage 的区别；用过 Playwright 跑过一次脚本。

#### 必读材料
1. [MDN — HTTP Cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
2. [MDN — XSS](https://developer.mozilla.org/zh-CN/docs/Glossary/Cross-site_scripting)
3. [Playwright 官方文档](https://playwright.dev/docs/intro)
4. [Playwright — Authentication（storageState）](https://playwright.dev/docs/auth)
5. **项目内**：`src/utils/request/index.ts` 中 401 分支与 SSO 跳转、`playwright.config.ts`、`e2e/save-auth.spec.ts`、`e2e/save-auth.ts`、`src/hooks/useQPilot.ts`

#### 动手练习
- 实现一个最小 401 拦截器：
  - 检测响应 401 → 跳转 SSO 登录页。
  - 带 `?redirectUrl=` 参数把当前 URL 续接上。
  - 加 `isRedirecting` 防抖：避免并发 401 同时触发多次跳转。
- 复现并修复一个"401 反复跳转死循环"：通常是登录页本身又触发 401。
- 对比 cookie + HttpOnly vs localStorage + token 在 XSS 场景下的差异（后者会被偷走）。
- 用 Playwright `storageState`：
  - 写 `save-auth.spec.ts`：手动登录一次后保存 cookie 到 `auth.json`。
  - 后续测试通过 `use: { storageState: 'auth.json' }` 跳过登录。
- 实现 QPilot SDK 入口注入 + 200ms × 20 的就绪轮询：
  - 失败降级（不阻塞主流程）。
  - 卸载时验证 `clearInterval` 与 script 节点移除。

#### 自检
- [ ] 能说出 cookie 在 XSS 场景下相比 localStorage token 的 2 个优势（HttpOnly + SameSite）。
- [ ] 能解释 `redirectUrl` 续接为什么要 URL 编码。
- [ ] 知道 Playwright `storageState` 的工作原理（序列化 cookie + localStorage）。

---

## 阶段 E：工程化部署

### 簇 9（q-10 / iq-09）：Docker 多阶段 + Orange CI + TKE + 北极星

**覆盖知识点**：Docker 多阶段 / cache 镜像、Orange CI 分支策略与 secrets imports、TKE 部署与北极星服务发现
**真实场景**：CI 构建慢（每次都重装依赖），部署后服务发现失败找不到下游。

#### 0-1 零基础前置
- 跑过 `docker build`；知道什么是 CI/CD。

#### 必读材料
1. [Docker — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
2. [Docker — BuildKit cache](https://docs.docker.com/build/cache/)
3. [Orange CI 官方文档](https://docs.orange-ci.oa.com/)（需内部权限）
4. [TKE（Tencent Kubernetes Engine）文档](https://cloud.tencent.com/document/product/457)
5. [Kubernetes 官方教程](https://kubernetes.io/docs/tutorials/)
6. **项目内**：`Dockerfile` 与 `cache.dockerfile` 对照、`.orange-ci.yml`、`start.sh`、`getBranch.sh`

#### 动手练习
- 把 `cache.dockerfile` 拆出 dev / prod 双版本：
  - `cache.dev.dockerfile`：包含 dev 依赖，适合本地热更。
  - `cache.prod.dockerfile`：仅 prod 依赖 + 多阶段构建，体积小。
- 用 versioned tag 替换 `latest`：
  - `app:v1.2.3`（commit hash 或语义化版本）。
  - 验证回滚：`kubectl set image deployment/app app=app:v1.2.2`。
- 为新分支策略加一个只跑 lint 的 job：
  - `.orange-ci.yml` 里按 `branch` 分支条件触发。
  - 排查一次 secrets imports 没继承导致的部署失败（一般是 yaml 缩进或 import 路径错误）。
- 配两个北极星名字（dev / prod）通过 `getBranch.sh` 切换。

#### 自检
- [ ] 能说出多阶段构建的 2 个核心收益（产物小、依赖隔离）。
- [ ] 能解释 `latest` tag 的危险（无法精确回滚）。
- [ ] 知道服务发现解决了什么问题（IP/端口动态变化）。

---

### 簇 10（q-04 / iq-04 权限分工补充）：前后端权限校验

> 该簇与簇 5 部分重叠，单独再列一遍，方便专项练习。

**覆盖知识点**：前后端权限校验分工
**真实场景**：某些操作（删除视图）前端按角色隐藏按钮，但绝对不能仅靠前端。

#### 必读材料
1. [OWASP — Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
2. [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
3. **项目内**：`src/store/useViewManageStore.ts` 中 `saveView` 调用链、`src/components/NewBoard/BugPannel/ViewPush/index.tsx`

#### 动手练习
- 给某个按钮加 `checkPermission` 渲染禁用态：
  - 无权限：按钮灰色 + tooltip 提示。
  - 有权限：正常可点。
- 构造一个跨产品 viewId 越权场景：
  - 在浏览器控制台直接调 `saveView({ viewId: 'other-product-id' })`。
  - 验证后端拒绝（403）。
  - 再加一道前端 check 防止误操作（用户体验更好）。

#### 自检
- [ ] 能背出"Deny by Default"和"Server-Side Enforcement"两条原则。
- [ ] 能解释为什么"前端隐藏按钮"不算权限控制。
- [ ] 知道权限模型 RBAC 和 ABAC 的差异。

---

## 全局自检：10 个一句话问题

1. Zustand 的 selector + shallow 怎么减少重渲染？
2. axios 拦截器里 humps 转换的 3 个坑？
3. 1 万行数据导出，前端递归和后端流式各自适合什么场景？
4. Schema 驱动 UI 相比命令式有哪 3 个优势？
5. OpenSpec 四件套（proposal / design / spec / tasks）各自产出什么？
6. retcode 和 HTTP statusCode 的差异？哪些情况要上报？
7. `next/dynamic` 的 `ssr: false` 解决什么问题？
8. cookie + HttpOnly 在 XSS 下比 localStorage token 强在哪？
9. Docker 多阶段构建的核心收益？
10. "前端权限只是 UX，后端权限才是安全"具体怎么落地？

---

## 学习效率 Tips

- **优先读项目源码**：很多知识点（拦截器、useConfigManage、useAegis）项目里都有现成实现，跟着读一遍比看文档高效。
- **内网工具优先 Demo 跑通**：Aegis、Orange CI、TKE、北极星等内网组件，一定要在测试环境跑过一次完整链路。
- **OpenSpec 是高 ROI 投资**：花 1 天理解流程，能省后续每个需求的反复返工。
- **E2E 测试先跑通登录态**：Playwright 的 `storageState` 是关键节省时间的技巧。
- **Schema 驱动有边界**：极度定制化的 UI 反而会让 schema 复杂度爆炸，不要硬塞。
