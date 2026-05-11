# QQ 项目管理门户 (qq-project) — 面试备战材料

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 1      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 2 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

QQ 客户端的项目管理门户，覆盖版本进度、Bug 看板、灰度计划和归档；技术栈是 Next.js 14 + Zustand + TDesign。

### 标准（30–60 秒）

qq-project 是 QQ 客户端「项目管理系统」的前端门户，承担版本节奏、Bug 看板、灰度发布、归档查询四条主业务，对接后端 pindao-bff、TAPD、盘古、TOF 认证、Aegis 监控、QPilot AI Agent 等多个内部平台。我在中级前端身份做的事可以归为四块：第一块是把页面拆成 Materials 配置驱动的 schema 化模块加 power-design-react 双层组件，让重复的「列表+表单+审核」页面用一份配置就能产出；第二块是按业务域把状态拆到九个 Zustand store，并统一用 createWithEqualityFn + shallow 治理重渲染；第三块是封装 Axios 请求层，把 humps camelize、401 logout、Aegis 上报、3 次重试这些横切关注点放进同一个 transformer；第四块是按 OpenSpec 规范走 proposal/design/specs/tasks 四件套来落新需求，让 AI 协作有迹可循。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

qq-project 这套系统是 QQ 客户端管理门户，业务上既要给版本经理看跨产品的发版节奏，又要给 QA 看 Bug 看板，还要给业务方做灰度策略和历史归档，所以前端需要在「同一套技术栈」里支撑差异很大的页面形态。我们选的是 Next.js 14 Pages Router，但通过 next.config.js 里关掉 reactStrictMode、所有页面用 NoSSR 包装、_document 注入静态资源的方式，把它当一个纯 CSR 的 SPA 来用 —— 这是一个明确的取舍：放弃 SSR 的首屏，换来内网门户开发心智一致、状态管理简单、第三方 SDK（QPilot/TDesign）兼容性好。架构上我做了三层抽象：最底层是 src/materials 里 schema 化的物料，每个页面给一份 columns/formItems/actions 配置就能跑；中间层是 power-design-react 这套组件库，封装了 ConfigCreate/ConfigManage 两类高阶模板，把「分页查询、批量操作、审核、Excel 导出」这些重复行为写成可复用 Hook（useConfigCreate、useConfigManage）；最上层才是真正的业务组件，例如 VersionProgress、BugPannel、ViewManage。状态层我们按域拆了九个 store（useVersionStore、useBugPanelStore、useViewManageStore、useAdminConfigStore 等），所有 store 统一用 createWithEqualityFn 创建，外部通过 useStore(selector, shallow) 订阅，避免动一个字段全树重渲染。请求层是单文件 src/utils/request/index.ts，把 humps.camelize 加在 transformRequestHook、401 redirect 加在 responseInterceptors、Aegis 上报放在同一处、网络异常做 3 次×1s 退避重试。监控接入了 Aegis V2 和 retcode，错误堆栈和接口失败都会落到内部监控平台。CI 是 Orange CI 的多分支差异化流水线，master 触发镜像构建并推送 TKE，MR/feature 只跑 lint+构建，secret 走仓库级凭证导入。E2E 用 Playwright，登录态用 storageState 文件提前生成、跑用例时复用，绕开了内网 SSO 的复杂性。这样整个工程在内网门户语境下做到了「业务页面可以拼」、「状态变化可以追」、「接口异常可以兜底」、「构建发布可以管控」。

</details>

## ✨ 项目亮点

- **Materials 配置驱动 + power-design-react 双层抽象**（architecture · frontend）
  我把重复出现的「列表+表单+审核+导出」页面统一抽到 src/materials 的 schema 配置里，再通过 power-design-react 的 ConfigCreate/ConfigManage 高阶组件加上 useConfigCreate/useConfigManage 两个 Hook 渲染。新增一个配置类页面只需要加一份 columns/formItems/actions，原本每页 300 多行模板代码降到 80 行以内，同时新人按 .codebuddy/skills/config-page-development/SKILL.md 走流程就能产出符合规范的页面。
  > 关键词：`config-driven` · `schema` · `react-hook` · `design-system`
- **Zustand 9 store 领域拆分 + createWithEqualityFn 治理重渲染**（architecture · frontend）
  全局状态按业务域拆成 useVersionStore、useBugPanelStore、useViewManageStore、useAdminConfigStore 等九个 store，统一用 createWithEqualityFn 创建，组件订阅用 useStore(selector, shallow) 写法。这样修改 viewList 不会触发 versionList 那一侧重新渲染，编辑/创建对话框也借助 store 的 dialogVisible + savedProductIds 字段做回填。
  > 关键词：`zustand` · `shallow` · `selector` · `domain-split`
- **Axios 请求层一站式封装：camelize + 401 + Aegis + 重试**（reliability · frontend）
  src/utils/request/index.ts 把横切关注点收敛在一处：transformRequestHook 处理 dataPath/codePath，beforeRequestHook 加 urlPrefix、joinTimestamp、humps.camelize；responseInterceptors 兜 401 跳登录并把失败上报到 window.AegisV2；responseInterceptorsCatch 做 3 次 1 秒间隔重试。业务侧调用只需要 request.get/post 不再各自写 try-catch。
  > 关键词：`axios` · `interceptor` · `humps` · `retry` · `aegis`
- **OpenSpec 规格驱动开发 + .codebuddy 规则**（architecture · frontend）
  新需求统一走 openspec/changes/<change-id>/ 的四件套：proposal.md 写动机和影响、design.md 写关键决策、specs/<cap>/spec.md 写 ADDED/MODIFIED 的 Requirement、tasks.md 拆 1.1/1.2 任务勾选。配合 .codebuddy/rules 下的核心规则、错误必查、文档同步几个 mdc，AI 协作和人写代码遵循同一份契约。
  > 关键词：`spec-driven` · `openspec` · `ai-collab` · `process`
- **QPilot AI Agent 入口注入与 200ms×20 就绪轮询**（feature · frontend）
  useQPilot 这个 Hook 在 _app.tsx 挂载时动态注入 QPilot 的 SDK 脚本，再用 setInterval 每 200ms 轮询 window.QPilotAI 是否就绪，最多 20 次；准备好就调用 init 传 QPILOT_ID=2851、AGENT_ID=8173；卸载时清掉定时器并移除 script 节点。
  > 关键词：`ai-integration` · `polling` · `lifecycle` · `third-party-sdk`
- **自定义视图 CRUD 端到端（add-view-management）**（feature · frontend）
  Bug 看板的视图管理是一个完整的需求样例：从 OpenSpec 提案到 useViewManageStore 的 fetchDropdownViews/saveView/setDefault/toggleEnable/deleteView/openEditDialog 全套 actions，再到 ViewCreate、ViewManage、ViewPush 三个面板组件，覆盖创建、编辑、默认、启停、推送链接到其他产品的全链路。
  > 关键词：`crud` · `share-link` · `permission` · `feature`
- **Orange CI 多分支差异化流水线 + 双 Dockerfile**（reliability · infra）
  工程根有 .orange-ci.yml 跑 master/MR/feature/bugfix/push 多套分支策略，依赖 Dockerfile 业务镜像和 cache.dockerfile 缓存层镜像，secrets 用 imports 从仓库级凭证读取；构建产物推送到内部 TKE，并通过北极星做服务发现。
  > 关键词：`orange-ci` · `docker` · `tke` · `polaris`


## 🏗️ 架构（architecture）— 2 题

### Q1. 你们说页面是「Materials 配置驱动」的，能不能讲讲这套抽象长什么样？为什么要做两层（Materials + power-design-react）？

> 来源：`tp-001` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 配置驱动 / Schema-driven UI | 必须掌握 | 理解 declarative-vs-imperative 边界以及如何把页面结构数据化是讲清这套抽象的前提。 |
| 高阶组件与自定义 Hook 抽象 | 必须掌握 | ConfigCreate/ConfigManage + useConfigCreate/useConfigManage 是组合式抽象的典型，需要懂如何把「行为」封进 Hook。 |
| TDesign React 组件库 | 加分项 | 渲染层底层依赖 TDesign，能讲清 Table/Form 的受控用法可以拓展回答深度。 |

#### 三档回答

**🟢 一句话**：Materials 是一份 schema，描述列表列、表单项、操作按钮；power-design-react 是渲染层，把 schema 渲染成具体 UI，业务组件只关心 schema 和数据。

**🔵 标准**（默认）：

我们配置驱动是分两层。第一层是 src/materials 下的物料 schema：每个业务页有一个配置文件，里面声明 columns（列定义）、formItems（表单项）、actions（按钮和操作）、permissions（权限标识），相当于把页面结构数据化。第二层是 src/components/power-design-react，它消费 schema 渲染成真实 UI，提供 ConfigCreate 和 ConfigManage 两个高阶组件，再加 useConfigCreate、useConfigManage 两个 Hook 处理「分页查询、批量、审核、Excel 导出」这些通用行为。分两层的理由是：schema 是声明式契约，可以被多个渲染端复用，也方便 AI 协作时按 .codebuddy/skills/config-page-development/SKILL.md 模板生成；power-design-react 只关心怎么渲染，不绑定具体业务，便于升级 TDesign 版本不影响业务代码。

<details><summary>🔴 深挖（点击展开）</summary>

我可以从「为什么是两层」、「具体抽象点」、「踩过的坑」三个维度讲。先讲为什么是两层：早期我们其实只有一层「业务组件直接调 TDesign」，结果 BugPannel、VersionProgress、AdminConfig 这些列表页代码长得一模一样但都微差异，每改一次 TDesign 升级就要扫一遍，重复劳动很多。后来我们意识到必须把「页面长什么样」和「页面怎么渲染」拆开。Materials 这层只描述结构，比如 columns 数组里每一项是 { dataIndex, title, render?, sorter? }，formItems 是 { type: 'input'|'select'|'date', name, label, rules } 这种声明式对象；power-design-react 这层吃这份 schema，调用 useConfigManage 拿到 dataSource、loading、pagination、selectedRowKeys、handleBatch 这些状态和回调，再丢给 TDesign 的 Table/Form。具体抽象点上，useConfigManage 把分页查询写成统一的 fetchPage(params)+setData，把多选行为统一在 selectedRowKeys + onSelectChange，把导出做成 generateExportFile，导出还做了递归分页拉所有数据；useConfigCreate 把 create/edit 表单的 init/submit/validate 做成一套生命周期，业务侧只需要传 onSubmit 和 schema 就能拿到完整表单。踩过的坑主要两类：一类是 schema 表达力不够时容易写「特例字段」，比如 columns 里加 render 又会回到命令式，所以我们约定 render 只能引内置渲染器名（badge、enum、time 等），如果实在不行才允许业务自己注册渲染器；另一类是和 power-design-react 升级配合，schema 字段改名要走 OpenSpec 流程，先发 proposal 再改字段，避免业务侧静默坏掉。整体上这套抽象让一个新配置页基本 80 行内能写完，且 .codebuddy 的 SKILL 文档也固化了这个模板，新人按模板一天能上手。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 项目内 src/components/power-design-react/ 完整目录
  - [ ] src/hooks/useConfigCreate.ts 与 useConfigManage.ts 全文
  - [ ] .codebuddy/skills/config-page-development/SKILL.md
- 🛠️ 动手
  - [ ] 基于现有 schema 新增一个简单的「黑名单管理」配置页，跑通增删改查
  - [ ] 把一个老命令式页面（无 schema）改造成 Materials 配置
- ⚠️ 常见踩坑
  - 在 columns.render 里写内联 JSX，破坏 schema 的可序列化
  - 把业务校验逻辑写到 power-design-react 内部，导致渲染层耦合业务
  - 升级 TDesign 时没同步 power-design-react 适配层
- 🤔 自测题（合上文档自答）
  - [ ] 如果新页面需要一个 schema 不支持的特殊渲染，你会怎么扩展？
  - [ ] Materials 和 JSON Schema 标准比有什么差异？
  - [ ] schema 字段重命名怎么平滑迁移？
- ⏱️ 预估学习时长：**4-6 小时**


#### Evidence

- `src/materials/`
- `src/components/power-design-react/`
- `src/hooks/useConfigCreate.ts`
- `src/hooks/useConfigManage.ts`
- `.codebuddy/skills/config-page-development/SKILL.md`

---

### Q2. 你们项目用 Zustand 拆了 9 个 store，为什么不集中成一个 store？createWithEqualityFn + shallow 是为了解决什么问题？

> 来源：`tp-002` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Zustand createWithEqualityFn / shallow | 必须掌握 | 这是回答相等性、避免重渲染的核心 API。 |
| 状态域拆分 / Domain decomposition | 必须掌握 | 考察候选人能否给出按业务域拆分 state 的依据与边界。 |
| React 重渲染机制 | 必须掌握 | 需要解释为什么浅比较能减少 rerender。 |
| Redux/Recoil/Jotai 对比 | 加分项 | 横向比较能体现选型思考。 |

#### 三档回答

**🟢 一句话**：九个 store 是按业务域拆的，目的是改一个域不影响别的域。createWithEqualityFn + shallow 是为了让组件只在 selector 选出的那部分真的变了才重渲染。

**🔵 标准**（默认）：

拆 9 个 store 的核心理由是「业务域隔离」。版本、Bug 看板、视图管理、灰度计划、审核配置这些子领域之间状态结构差异很大，强行塞一个 store 会导致 actions 命名冲突、reducer 逻辑互相牵动；按域拆开后每个 store 自包含，例如 useViewManageStore 里面就有 viewList、savedProductIds、dialogVisible、createDialogVisible 这些专属字段以及 fetchDropdownViews/saveView/openEditDialog 等 actions。createWithEqualityFn 是 Zustand 4 的 API，比默认的 create 多了一个相等性函数参数，配合 shallow 做浅比较，意思是组件 useStore((s) => ({ a: s.a, b: s.b }), shallow) 只有 a 或 b 真的变化时才会触发重渲染；如果你不传 shallow，默认是引用相等，每次返回新对象都会重渲染，列表页就会很卡。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么这样拆」、「createWithEqualityFn 的具体写法」、「实际中遇到的两个问题」三块讲。第一块，为什么按域拆。我们一开始也试过单 store 模式，state 树是 { version, bug, view, admin, ... }，actions 是 setVersionList、setBugList 这种前缀命名，结果两个问题：一是改一个 action 类型就要回归整棵树；二是 selectors 写起来层层 .version.viewManage.viewList 容易写错，且任意子树字段变更都会触发上层订阅者重渲染。后来按域拆成九个 store，每个 store 是独立的 hook，比如 useViewManageStore，state 里有 viewList、initialViewList、editingView、savedProductIds、dialogVisible、createDialogVisible、fetchLoading、saveLoading 等业务字段，actions 是 fetchDropdownViews、saveView、setDefault、toggleEnable、deleteView、openCreateDialog、openEditDialog、resetEditingView，业务页只 import 自己用的 store 即可。第二块，createWithEqualityFn 的具体写法。Zustand 4 把相等性比较从内置改为可注入，于是我们的 store 创建是 createWithEqualityFn<State>()((set, get) => ({ ...state, ...actions }))，组件侧统一是 const { viewList, fetchDropdownViews } = useViewManageStore((s) => ({ viewList: s.viewList, fetchDropdownViews: s.fetchDropdownViews }), shallow)，这里 shallow 是 zustand/shallow 导出的浅比较函数，它确保只要 viewList 引用没变就不会触发本组件重渲染，函数引用因为是 store 自己持有也保持稳定。第三块，实际中遇到的问题。一个是「编辑回填」：打开编辑对话框时要把 editingView 写进 store，并且 savedProductIds 这类副字段也要从 viewList 里反查塞进去，否则取消编辑再开会拿到上一次的脏数据，所以我们专门有 openEditDialog(viewId) 这个 action 一次写三组字段。另一个问题是「跨 store 联动」：保存视图后要让 BugPannel 那侧的列表刷新一下，我们没有走全局 event bus，而是在 saveView 成功的回调里直接调用 useBugPanelStore.getState().refresh()，store 之间显式依赖，可读性好但要注意循环依赖，所以约定底层 store（如 useUserStore）不能反过来 import 上层 store。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Zustand 官方文档关于 selector 与 equalityFn 的章节
  - [ ] 项目内 src/store/useViewManageStore.ts 全文
  - [ ] 项目内 src/store/index.ts 入口
- 🛠️ 动手
  - [ ] 把一个 useState 驱动的本地组件改造成依赖某个 Zustand store
  - [ ] 故意去掉 shallow，观察列表页 rerender 次数变化
- ⚠️ 常见踩坑
  - selector 返回新对象但忘记传 shallow 导致全量重渲
  - 在 store action 里直接 await 后忘记 set 错误状态
  - store 之间循环依赖导致初始化时 undefined
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不直接用 React Context？
  - [ ] selector 里能不能写复杂派生数据？
  - [ ] createWithEqualityFn 内部是怎么实现 equalityFn 的？
- ⏱️ 预估学习时长：**3-5 小时**


#### Evidence

- `src/store/index.ts`
- `src/store/useViewManageStore.ts`
- `src/store/useVersionStore.ts`
- `src/store/useBugPanelStore.ts`
- `src/store/useAdminConfigStore.ts`

---

## 🧩 功能（feature）— 1 题

### Q1. 讲讲 Bug 看板的「自定义视图」是怎么端到端做的？从 OpenSpec 提案到 store 再到组件。

> 来源：`tp-007` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| OpenSpec 流程（proposal/design/spec/tasks） | 必须掌握 | 这是答题的主线之一。 |
| Zustand store 的 action 编排 | 必须掌握 | openEditDialog 这种「同时写多字段」的 action 是典型用法。 |
| 权限校验与受控按钮 | 加分项 | 跨产品推送的鉴权是 trade-off 部分。 |

#### 三档回答

**🟢 一句话**：先在 openspec 里写 proposal/design/spec/tasks 四件套，然后落地 useViewManageStore 的 actions，最后实现 ViewCreate / ViewManage / ViewPush 三个面板组件。

**🔵 标准**（默认）：

整个需求从 openspec/changes/add-view-management 起步：proposal.md 说明业务问题（不同角色看 Bug 列表筛选条件不一样，希望保存自己的视图）；design.md 给出关键决策，比如视图是用户级还是产品级、跨产品推送怎么鉴权；specs/view-management/spec.md 用 ADDED Requirement 描述「保存视图」、「设为默认」、「启用/停用」、「推送到其他产品」等子需求；tasks.md 拆 1.1 store / 1.2 ViewCreate / 1.3 ViewManage / 1.4 ViewPush 之类的小任务。代码上 useViewManageStore 提供 fetchDropdownViews 拉下拉数据、saveView 创建或更新、setDefault 设置默认、toggleEnable 启停、deleteView 删除、openEditDialog 打开编辑（同时回填 savedProductIds）。组件层 ViewCreate 调 saveView('create') 走表单，ViewManage 是表格 + 操作列调 toggleEnable/setDefault/openEditDialog/deleteView，ViewPush 用一个产品多选 + 链接复制做跨产品推送。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么要走 OpenSpec」、「数据结构关键点」、「编辑回填的细节」、「跨产品推送鉴权」四个角度讲。第一，走 OpenSpec 是因为这个需求跨多个角色（业务、QA、版本经理）和多个产品，光在 IM 里讨论很容易丢上下文，所以我们坚持 proposal.md 写动机和影响、design.md 写关键决策（比如要不要让运营批量删除、要不要让普通用户改别人视图）、spec.md 写 ADDED Requirement、tasks.md 把任务拆到一两小时粒度，PR 合并时 archive 掉。这个流程让 AI 协作（CodeBuddy）也能按规范产出代码。第二，数据结构上 ViewItem 有 id、name、creator、productList[]、filterParams、isDefault、enabled、updatedAt 几个核心字段，productList 是关联的产品 ID 数组，因为我们允许一个视图绑定多个产品。第三，编辑回填的细节比较有意思：当用户点击表格里某行的「编辑」按钮，我们触发 openEditDialog(viewId)，这个 action 做三件事 —— 1) 从 viewList 找到对应 view 写到 editingView；2) 把 view.productList 写到 savedProductIds（用于 ProductSelector 组件回显已选产品）；3) 把 dialogVisible 设为 true。如果用户取消，调 resetEditingView 清掉这三个字段。第四，跨产品推送的鉴权：ViewPush 让用户选目标产品并复制带 viewId 的链接，但接收方的产品里这个视图 id 是「外来」的，所以 saveView 接口收到 productList 多个产品时会做权限校验，没有目标产品操作权限就拒绝；前端在按钮上会先调 checkPermission 显示禁用态。整体上这个需求是项目里 OpenSpec 流程最完整的一个范例，也是 useViewManageStore 这个 store 的源头。

</details>

#### 补齐方案

- 📚 必读
  - [ ] openspec/changes/add-view-management/proposal.md
  - [ ] openspec/changes/add-view-management/design.md
  - [ ] openspec/changes/add-view-management/specs/view-management/spec.md
  - [ ] src/store/useViewManageStore.ts
- 🛠️ 动手
  - [ ] 按 OpenSpec 流程写一个『历史视图归档』小提案
  - [ ] 为 ViewManage 加一个『复制视图』按钮
- ⚠️ 常见踩坑
  - openEditDialog 漏写 savedProductIds 导致编辑回填错
  - saveView 在 create 和 update 之间共用一个 action 但没区分参数
  - 跨产品推送忘记做权限校验造成越权
- 🤔 自测题（合上文档自答）
  - [ ] OpenSpec 的 spec.md 和普通文档有什么区别？
  - [ ] 如果两个用户同时编辑同一个视图怎么处理冲突？
  - [ ] ViewPush 的链接被截图泄露怎么办？
- ⏱️ 预估学习时长：**4-6 小时**


#### Evidence

- `src/store/useViewManageStore.ts`
- `src/components/NewBoard/BugPannel/ViewCreate/index.tsx`
- `src/components/NewBoard/BugPannel/ViewManage/index.tsx`
- `src/components/NewBoard/BugPannel/ViewPush/index.tsx`
- `openspec/changes/add-view-management/`

---

## ⚡ 性能（performance）— 1 题

### Q1. useConfigManage 里有一段 Excel 导出的递归分页逻辑，能讲一下你是怎么设计的，为什么不直接拉全量？

> 来源：`tp-008` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 递归分页 / 异步累加 | 必须掌握 | 核心算法。 |
| SheetJS / xlsx 写盘 | 加分项 | 导出 Excel 的底层细节。 |
| 前端导出 vs 后端导出权衡 | 必须掌握 | trade-off 部分的关键问题。 |

#### 三档回答

**🟢 一句话**：导出走 getAllDataForExport 递归分页：每次拿 200 条，拿完再生成 Excel，不打爆后端。

**🔵 标准**（默认）：

useConfigManage 的导出流程是：用户点导出 -> generateExportFile 先收集 columns 里要导出的字段名 -> 调 getAllDataForExport({ pageSize: 200, page: 1 }, []) 递归累加 -> 把所有数据交给 utils/file.ts 里基于 sheetjs 的 downloadExcel 写盘。getAllDataForExport 里每次 await fetchPage(params) 拿到当前页 data，如果 data.length 等于 pageSize 就 page+1 再调一次（递归终止条件是 data.length < pageSize 或者超过最大上限 5000 条）。我们没有直接 pageSize=10000 拉全量是因为：第一是后端单接口超时和内存有限；第二是有的接口会做权限过滤，全量返回字段不一致；第三是分页拉过程中可以给前端一个 progress 提示，避免用户以为卡死。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么不让后端做导出」、「递归分页的实现」、「文本提取的细节」、「踩坑」四个角度讲。第一，为什么不让后端做。后端每个接口都加一个导出版本意味着双倍维护、双倍权限校验、双倍 retcode 路径，且后端导出走异步任务还要轮询，体验更差。我们前端递归分页的好处是直接复用业务接口，权限和数据形态和列表页完全一致，多一个导出按钮就行。第二，递归分页实现。getAllDataForExport(params, acc) 是 async 函数：调 fetchPage(params) 拿到 { list, total }，把 list 推进 acc；如果 acc.length >= total 或 acc.length >= 5000 或 list.length < params.pageSize 就 return acc；否则 return getAllDataForExport({...params, page: params.page + 1}, acc)。pageSize 200 是基于内网 RTT 50ms+后端处理时间 200ms 调出来的折中，太小会请求次数多，太大会单次超时。第三，文本提取。表格列的 render 经常返回 JSX，比如状态徽标、时间格式化，导出 Excel 不能写 JSX，所以 generateExportFile 在每个 cell 上做了一层 cell 文本提取：先调 column.exportRender?.(record) 用专用导出渲染器，没有的话再回退到 column.render，但只接受字符串结果；如果 render 返回 JSX 我们就 fallback 到原始字段值。第四，踩坑：一是早期没有 5000 上限，有用户点了一个全表导出把浏览器卡崩，加了 hard cap 之后再点提示「数据过多，请加筛选条件」；二是分页时如果有人在编辑会出现「跨页重复 / 漏」，我们文档里说明导出是「拉取时刻」的快照、不保证强一致；三是 sheetjs 默认对长数字会变科学计数法，我们对 productID 这种长串字段强制 cellType='s'。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/hooks/useConfigManage.ts 全文
  - [ ] src/utils/file.ts
  - [ ] SheetJS 官方文档 cell type 部分
- 🛠️ 动手
  - [ ] 实现一个 1 万行数据的导出，带 progress 提示
  - [ ] 为某个表格加 exportRender，把状态徽标转成中文文本
- ⚠️ 常见踩坑
  - 没有 hard cap 导致浏览器内存爆炸
  - render 返回 JSX 直接写进 Excel 变 [object Object]
  - 长数字字段被识别为科学计数法
- 🤔 自测题（合上文档自答）
  - [ ] 如果数据量超过 5 万条你会怎么改方案？
  - [ ] 导出过程中用户切走页面再回来，要不要恢复进度？
  - [ ] 为什么选 SheetJS 而不是 ExcelJS？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/hooks/useConfigManage.ts`
- `src/utils/file.ts`
- `src/utils/tool.ts`

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. 请讲一下你们的 Axios 请求层是怎么封装的，camelize、401 跳转、Aegis 上报、重试这些怎么协作？

> 来源：`tp-003` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Axios 拦截器与 transform hook | 必须掌握 | 整个回答围绕 transform hook 和 interceptors 展开。 |
| humps camelize / decamelize | 必须掌握 | 解释命名风格转换的边界与陷阱。 |
| 前端重试策略与幂等性 | 必须掌握 | 讨论重试时一定会问到幂等问题。 |
| Aegis / 前端监控基础 | 加分项 | 上报字段和异常聚合是观测性的延伸话题。 |

#### 三档回答

**🟢 一句话**：请求层一个文件 src/utils/request/index.ts 把所有横切关注点收敛在 transformer 钩子和拦截器里，业务代码只调 request.get/post。

**🔵 标准**（默认）：

我们封装了一个 createAxios 工厂，它接收一份 transform 配置，里面挂了四个钩子：transformRequestHook 在响应回来时按 dataPath/codePath 解构 data 和 retcode，按 codeSuccessValue=0 判断成功；beforeRequestHook 在请求发出前加上 urlPrefix（/pindao-bff）、joinTimestamp（防缓存）和 humps.camelize（请求参数 snake -> camel）；responseInterceptors 处理 status==401 时清登录态并 window.location 跳到 SSO，同时把每次失败发到 window.AegisV2.error 上报；responseInterceptorsCatch 做网络错误重试，最多 3 次，每次 1 秒退避。所有 GET 请求默认开 joinTimestamp，业务侧只需要 request.get<T>(url, params) 就拿到了带 retry、监控和 401 兜底的 promise。

<details><summary>🔴 深挖（点击展开）</summary>

我可以从「设计目标」、「钩子顺序」、「具体实现细节」、「踩坑」四个维度讲。设计目标是「业务代码不写 try-catch、不关心 retcode、不关心 SSO、不关心监控」，所以请求层必须把这些都吃掉，业务侧只关心拿到 data，复杂度全部下沉到一处。钩子顺序上，请求方向是 beforeRequestHook 加前缀和 timestamp，再 humps.camelize 参数（这一步只对请求 params 做，body 不做，因为后端接口约定是 body 用驼峰）；响应方向是先 transformRequestHook 按 dataPath: 'data'、codePath: 'retcode'、codeSuccessValue: 0 抽出业务数据；再过 responseInterceptors 把 401 拦下来，调 logout()、window.location.replace 到 SSO，然后把异常摔出去；摔出来后 responseInterceptorsCatch 接到 error，先看是不是 ECONNABORTED 或者 5xx 之类的可重试错误，是的话调 utils.requestRetry(config, count=3, delay=1000) 重新发一次，否则上报到 Aegis：window.AegisV2 && window.AegisV2.error({ msg, code, url })。具体实现上 retry 用 axios 的 config.__retryCount 字段计数，避免无限循环，每次失败递增并比对最大值，超过 3 次就交出最终错误；joinTimestamp 是给 url 拼 _t=Date.now()，简单粗暴防内网代理缓存；camelize 用 humps.camelizeKeys，深度遍历对象，但碰到 File、Blob、FormData 不动，避免破坏上传字段。踩过的坑主要三个：第一是 humps 把 abc_def 变 abcDef 没问题，但形如 productID2 这种带数字 + 大写的 key 会被错误改写，所以我们对 url 路径不做 camelize，只对 params/data；第二是早期 401 拦截把所有 401 都跳 SSO，结果某些 LongPolling 接口会偶发 401，被反复跳，后来加了 ignoreUrl 白名单；第三是 Aegis 上报本身在弱网下也会失败，我们加了 try-catch 包住上报调用，避免上报失败影响业务流。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/utils/request/index.ts 全文
  - [ ] src/utils/request/axios-transform.ts
  - [ ] humps 库 README
- 🛠️ 动手
  - [ ] 为一个 mock 后端写一个带重试和监控上报的 axios 封装
  - [ ] 把现有 retcode 不一致的接口接入 transformRequestHook
- ⚠️ 常见踩坑
  - 对 POST body 也做 camelize 但后端不识别
  - 重试没有计数导致网络抖动时无限重发
  - 401 拦截器没有白名单造成 SSO 跳转死循环
- 🤔 自测题（合上文档自答）
  - [ ] 重试时如果是 POST 创建类接口，怎么避免重复创建？
  - [ ] Aegis 上报失败你怎么知道？
  - [ ] 如果后端把 retcode 字段改名你这个层怎么平滑切换？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/utils/request/index.ts`
- `src/utils/request/axios-transform.ts`
- `src/utils/request/utils.ts`

---

### Q2. Orange CI 你们是怎么配多分支策略的？master / MR / feature 跑的东西不一样吗？双 Dockerfile（业务镜像 + cache）怎么协作？

> 来源：`tp-006` · scope: infra · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Orange CI 分支策略与 secrets imports | 必须掌握 | 题目主线。 |
| Docker 多阶段 / cache 镜像 | 必须掌握 | 双 Dockerfile 协作核心。 |
| TKE 部署与北极星服务发现 | 加分项 | master 流水线最后一公里。 |

#### 三档回答

**🟢 一句话**：master 才构镜像推 TKE，MR/feature 只跑 lint+构建；cache 镜像装依赖，业务镜像复用它。

**🔵 标准**（默认）：

.orange-ci.yml 里我们按触发事件区分 jobs：on master push 触发 build-image -> push -> deploy-tke 全流程；on MR 触发 lint + tsc + next build，不构建镜像不部署；on feature/*、bugfix/* 分支只跑 lint + tsc，最快得到反馈；普通 push 走默认 lint + 构建。镜像策略上 cache.dockerfile 是基础镜像，FROM node:18 后只 COPY package.json + pnpm-lock.yaml + pnpm install，产物是依赖装好的 base；业务镜像 Dockerfile 用 FROM <我们的-cache-image>，在上面 COPY 代码再 pnpm build，最后 CMD 跑 start.sh 启动 next start 并接入北极星。这样代码迭代快、依赖很少变时镜像构建可以秒级，命中 cache 镜像；只有依赖变更时才重建 cache 镜像。secrets 用 imports 从仓库级凭证读取，不写在 yml 里。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么不所有分支都构建镜像」、「双 Dockerfile 的具体协作」、「getBranch.sh / start.sh 的作用」、「踩坑」四个角度讲。第一，所有分支都构建镜像太贵 —— 内部 TKE 镜像仓库有配额，CI 时间也敏感，所以 MR/feature 只跑 lint + tsc + next build 这种「保证编译过」的检查；只有 master 才进入推镜像和部署。这种分层带来的好处是开发分支反馈在 2 分钟内，master 流水线虽然 8-10 分钟也是可以接受的，分级 fail-fast 也减轻了码农的心智负担。第二，双 Dockerfile 协作。cache.dockerfile 是「依赖镜像」，独立流水线在 pnpm-lock.yaml 变化时手动 / 定期触发，构建产物 push 到 镜像仓库 tag 成 cache:latest 或带版本号的 tag；Dockerfile 顶部 FROM <namespace>/qq-project-cache:<tag>，于是不再装依赖，直接 COPY src + COPY public + RUN pnpm build + CMD bash start.sh，单次构建从 8 分钟掉到不到 2 分钟。第三，getBranch.sh / start.sh。getBranch.sh 的作用是在容器启动时读环境变量决定走哪个北极星名字（dev/prod 不同），start.sh 负责 export 一些 NODE_OPTIONS（比如 --max-old-space-size 提到 4096，因为 next build 在大型 SPA 下会爆内存）然后 next start，并把日志接到容器 stdout。第四，踩坑：第一是 cache 镜像 lock 文件没及时更新会让业务镜像装不到新依赖，我们加了一个 CI 步骤对比 lock 文件 hash，不一致直接 fail；第二是 Orange CI 的 secrets imports 在某个分支上没继承导致部署失败，要在仓库设置里显式开 inherit；第三是 Dockerfile FROM 的 cache tag 写死 latest 偶尔被覆盖，后来改成版本号 tag 更稳定，回滚也方便。整体上这套设计核心是「用 cache 镜像吃掉 80% 的构建时间，按分支差异化跑测试」，让发布既稳又快。

</details>

#### 补齐方案

- 📚 必读
  - [ ] .orange-ci.yml
  - [ ] Dockerfile 与 cache.dockerfile 对照阅读
  - [ ] start.sh / getBranch.sh
- 🛠️ 动手
  - [ ] 为新分支策略加一个只跑 lint 的 job
  - [ ] 把 cache.dockerfile 拆出 dev / prod 双版本
- ⚠️ 常见踩坑
  - cache 镜像和业务镜像的 lock 文件不同步
  - FROM cache:latest 被覆盖导致回滚困难
  - secrets imports 没继承导致部署失败
- 🤔 自测题（合上文档自答）
  - [ ] 如果发布出问题怎么回滚？
  - [ ] 如何判断该重建 cache 镜像？
  - [ ] next build OOM 你怎么定位？
- ⏱️ 预估学习时长：**4-5 小时**


#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `cache.dockerfile`
- `getBranch.sh`
- `start.sh`

---

## 📈 可观测性（observability）— 1 题

### Q1. 你们前端怎么做监控的？Aegis 和接口 retcode 怎么协作上报？哪些场景上报、哪些不上报？

> 来源：`tp-012` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Aegis V2 / 前端监控 SDK | 必须掌握 | 上报字段和初始化都围绕 Aegis V2。 |
| 业务 retcode 与 HTTP 状态的差异 | 必须掌握 | 解释为什么需要手动上报。 |
| 全局错误捕获 (window.onerror / unhandledrejection) | 加分项 | 自动捕获原理。 |

#### 三档回答

**🟢 一句话**：全局错误和接口失败统一上报到 Aegis V2，retcode 不为 0 也算业务失败上报；只有白名单接口和长轮询的偶发 401 不上报。

**🔵 标准**（默认）：

我们监控分两条线。一条是 Aegis SDK 的全局错误捕获：useAegis 这个 Hook 在 _app.tsx 启动时初始化 window.AegisV2，传入 id、uin、host 等，自动捕获 window.onerror 和 unhandledrejection 的 JS 异常；另一条是接口层在 src/utils/request/index.ts 的 responseInterceptors 里手动调 window.AegisV2.error({ msg, code, url }) 上报，这样不管是 HTTP 4xx/5xx，还是 retcode != 0 的业务失败，都能落到 Aegis 后台。我们对几类场景做特殊处理：长轮询 401 不上报、用户主动取消请求 (axios cancel) 不上报、登录跳转过程中的 401 不上报。Aegis 上报本身用 try-catch 包住，避免上报失败反过来影响业务。

<details><summary>🔴 深挖（点击展开）</summary>

我可以从「为什么手动上报 retcode」、「上报字段设计」、「白名单与降噪」、「踩坑」四个角度讲。第一，为什么 retcode 也手动上报。Aegis 默认只看 HTTP 状态，而我们后端约定 200 + retcode!=0 表示业务失败（比如越权、参数错），如果只看 HTTP 监控就完全看不到这些业务异常；所以 transformRequestHook 解析出 retcode 后在 responseInterceptors 里把 retcode!=0 当作 error 上报，msg 用后端返回的 message，code 用 retcode 字符串化，url 取 config.url，方便聚合。第二，上报字段设计。我们约定四个核心字段 msg/code/url/ext，ext 里塞自定义元信息比如 productId、当前路由、用户角色，这样后端在 Aegis 平台用 code 聚合就能直接定位高频失败的产品和路由。第三，白名单与降噪。早期所有 401 都上报导致 Aegis 平台被「跳登录前的 401」刷屏，后来在 responseInterceptors 里加了 ignoreAegisUrls 数组，长轮询的 /poll 接口和 SSO 跳转中产生的 401 都不报；axios.isCancel(error) 也直接跳过；某些可恢复的网络抖动重试成功后我们也只在最终失败时报。第四，踩坑：第一是 Aegis 在弱网下偶发 ETIMEDOUT，没 try-catch 时上报本身抛异常被全局监控再捕获，循环把控制台刷爆；后来用 try { window.AegisV2 && window.AegisV2.error(...) } catch{} 隔离。第二是初始化时 useAegis 必须晚于路由就绪，否则 host 字段是 about:blank，后来改成 useEffect 里 setTimeout 0 再初始化。第三是 retcode 上报时如果接口本身被 cancel 会先进 catch 拿到 axios.Cancel，要先判定再上报。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/hooks/useAegis.ts
  - [ ] src/utils/request/index.ts 中 responseInterceptors 部分
  - [ ] Aegis V2 官方接入文档
- 🛠️ 动手
  - [ ] 实现一个最小 Aegis 上报封装，覆盖 onerror + axios 拦截器
  - [ ] 为一个接口加白名单跳过上报
- ⚠️ 常见踩坑
  - 上报本身抛错没有 try-catch
  - 把 axios cancel 当成正常错误上报
  - ext 里塞过大对象导致 Aegis 拒收
- 🤔 自测题（合上文档自答）
  - [ ] 怎么区分『真错误』和『可预期失败』？
  - [ ] 如果 Aegis 后台数据缺字段怎么排查？
  - [ ] 前端怎么和后端 retcode 字段保持一致？
- ⏱️ 预估学习时长：**2-3 小时**


#### Evidence

- `src/hooks/useAegis.ts`
- `src/utils/request/index.ts`
- `src/global.d.ts`

---

## 🔒 安全（security）— 1 题

### Q1. 门户依赖 TOF 认证，前端怎么处理登录态丢失和 401？怎么避免越权操作？

> 来源：`tp-003` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Cookie-based vs token-based 认证 | 必须掌握 | 前端不存 token 的根本原因。 |
| 前端 SSO 重定向与 redirectUrl 续接 | 必须掌握 | 401 处理的具体动作。 |
| 前后端权限校验分工 | 必须掌握 | checkPermission 与后端 retcode 的边界。 |
| XSS / CSRF 基础 | 加分项 | 讨论为什么 cookie + withCredentials 比 localStorage 安全。 |

#### 三档回答

**🟢 一句话**：登录态由 TOF cookie 维持，前端不存 token；401 时统一在拦截器里清状态并跳 SSO；越权由后端兜底，前端在按钮上做 checkPermission 显示禁用态。

**🔵 标准**（默认）：

我们的认证模型是 cookie-based：用户登录后由 TOF 写 cookie，前端不主动持有 token，所以 axios 请求只要带上 withCredentials 就够了。401 处理统一收敛在 src/utils/request/index.ts 的 responseInterceptors：检测 status==401 时调 logout() 清掉 zustand 中的用户信息，再 window.location.replace 跳 SSO；同一时间窗口内多次 401 用一个布尔标记避免重复跳转。授权方面我们坚持「后端是 source of truth」：前端的 checkPermission(productId, action) 只用来给按钮显示「禁用 + 提示」，真正的越权由后端拦截并回 retcode 错误码，前端在 catch 里上报 Aegis 并 toast 提示。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么前端不存 token」、「401 拦截的具体步骤」、「按钮级权限的取舍」、「常见越权路径」四个角度讲。第一，前端不存 token 是因为内部门户走 TOF 的 cookie 域，浏览器自动带；如果前端再存一份 token 在 localStorage，反而引入 XSS 失窃风险，且 SSO 续期时 cookie 会自动刷新而 localStorage 不会，容易出现「cookie 已过期、本地 token 仍存在」的不一致状态。第二，401 拦截步骤：interceptor 拿到 error.response.status===401 -> 检查 isRedirecting 标记是不是已经在跳 SSO，是就直接 reject -> 否则置 isRedirecting=true、调 logout() 清 zustand 用户态、调 useViewManageStore 等需要重置的 store 的 reset、最后 window.location.replace 到 SSO 入口（带 redirectUrl=current）；这样回到登录后能回到原页。我们对长轮询接口加了 ignoreUrls，避免一个偶发 401 把整个页面跳走。第三，按钮级权限。前端做 checkPermission 是体验需要：用户看不到自己没权限做的按钮总比点了之后吃 retcode 体验好。但权限源是后端 GET /permissions 拉到的列表，前端只是缓存和渲染，不可信。所以即便 checkPermission 返回 false 我们仍然在按钮 onClick 里调 saveView，让后端再次校验。第四，常见越权路径：用户复制一个含 viewId 的链接给同事，同事在另一个产品里打开 -> 前端按钮可能因为 checkPermission 返回 true（因为同事在自己产品里有读权限）而显示可点；但 saveView 在多产品 productList 校验时会拒绝跨产品操作。综合下来这套模型的核心原则是「前端不持密钥、不做权威鉴权、只做体验和兜底」。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/utils/request/index.ts 中 401 分支
  - [ ] openspec/project.md 关于 External Dependencies 与 TOF 的段落
  - [ ] 公司 TOF 认证接入文档
- 🛠️ 动手
  - [ ] 实现一个最小 401 拦截器，带 isRedirecting 防抖
  - [ ] 为一个按钮加 checkPermission 渲染禁用态
- ⚠️ 常见踩坑
  - 401 后没清 store 导致下一次请求仍带旧用户上下文
  - 把 token 缓存到 localStorage 引入 XSS 风险
  - 前端权限当作权威，后端少校验
- 🤔 自测题（合上文档自答）
  - [ ] 如果 cookie 过期但页面还开着，怎么提示用户？
  - [ ] checkPermission 缓存多久？怎么失效？
  - [ ] 跨产品 viewId 链接怎么防越权？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/utils/request/index.ts`
- `openspec/project.md`

---

## ⚖️ 取舍（trade-off）— 2 题

### Q1. 你们用 Next.js 14 但所有页面都包了 NoSSR 当 SPA 用，为什么不用 SSR？这个取舍背后的考量是什么？

> 来源：`tp-011` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Next.js Pages Router 与 ssr:false | 必须掌握 | NoSSR 实现核心。 |
| React StrictMode 双 effect 模型 | 必须掌握 | 解释为什么关掉 strict mode 的代价。 |
| Hydration / Server Component 基础 | 加分项 | 讨论未来演进时会用到。 |

#### 三档回答

**🟢 一句话**：因为这是内网门户，首屏不敏感、用户上来都登录，SSR 带来的水合复杂度和第三方 SDK 兼容性问题不值得；CSR 能让心智模型保持简单。

**🔵 标准**（默认）：

我们选 Next.js 14 主要是看中它的目录路由、_app/_document 全局壳、Webpack/SWC 构建链、easy DX，但没有用 SSR 而是把它当 SPA：pages 都用 src/components/Dynamic.tsx 这个 NoSSR 壳包一层（基于 next/dynamic 的 ssr:false），_document 只输出 HTML 骨架和静态资源，next.config.js 关掉 reactStrictMode。这样取舍的理由是：一是这是内网门户，用户都是登录态访问，首屏由 SSR 提速没意义；二是 TDesign React、QPilot、Aegis 这些第三方 SDK 都依赖 window，SSR 会触发 ReferenceError 或者 hydration mismatch；三是 Zustand store 和大量 useEffect 写法在 CSR 下心智一致，SSR 还要处理 store 在服务端首次渲染的 hydration。代价是首屏白屏时间略长、SEO 不友好（但门户不需要 SEO）。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么不直接用 Vite SPA」、「NoSSR 怎么实现」、「reactStrictMode false 的代价」、「未来怎么演进」四个角度讲。第一，为什么不直接 Vite SPA。其实早期讨论过，但 Next.js 在公司内有现成的 Docker 模板、Orange CI 模板、北极星接入模板，构建产物形态被运维认可；而且我们还是想要 _app.tsx 作为全局壳挂 useQPilot、useAegis、TDesignProvider 这些副作用，文件路由也比手写 React Router 整洁，所以保留了 Next.js 但只用它的「框架壳」，把 SSR 能力主动放弃，省掉了那一套 hydration 调试。第二，NoSSR 怎么实现。src/components/Dynamic.tsx 是 const NoSSR = dynamic(() => Promise.resolve(({ children }) => <>{children}</>), { ssr: false })，每个页面文件最终默认导出都 wrap 一层；_document.tsx 不做特殊渲染，只把语言、字体预加载、Aegis SDK 这些静态资源摆好；_app.tsx 包裹 TDesignProvider、ConfigProvider、AegisInit、QPilotInit，所有副作用 Hook 都在客户端跑。第三，reactStrictMode false 是因为有些老 Class 组件以及第三方 SDK 在双 effect 重入下表现异常（比如 QPilot SDK 会被 init 两次报错，TDesign Form 的 init 也会重复触发，Aegis 重复 push 一次错误），上线优先保稳定；代价是开发期我们少了一层潜在 bug 提示，所以我们用 OpenSpec 流程和 .codebuddy/rules 的「修改后必查 lint」补这块审计，同时在 review 时人工关注 useEffect 依赖。第四，未来演进可能往 App Router + RSC 走，但要等 TDesign React 适配 server component 以及 QPilot 提供 SSR 友好版本，目前 OpenSpec 上没有 active proposal，业务侧也没有强烈需求。整体上这是「内网门户用 Next.js 当 SPA」的典型取舍，业务收益清晰，代价可控可逆。

</details>

#### 补齐方案

- 📚 必读
  - [ ] next.config.js 全文
  - [ ] src/components/Dynamic.tsx
  - [ ] src/pages/_app.tsx 与 _document.tsx
  - [ ] Next.js 官方 dynamic 文档
- 🛠️ 动手
  - [ ] 用 next/dynamic 把一个组件改成 ssr:false
  - [ ] 故意打开 reactStrictMode 观察 useEffect 双触发
- ⚠️ 常见踩坑
  - 在 NoSSR 外层访问 window 仍会触发 SSR 报错
  - reactStrictMode 关掉后忽略真正的 effect 副作用 bug
  - _document 里写浏览器逻辑导致编译报错
- 🤔 自测题（合上文档自答）
  - [ ] 如果未来要支持 SEO，你会怎么改？
  - [ ] reactStrictMode 重新打开可能会暴露哪些 bug？
  - [ ] NoSSR 和 Suspense + lazy 有什么区别？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `next.config.js`
- `src/components/Dynamic.tsx`
- `src/pages/_app.tsx`
- `src/pages/_document.tsx`
- `openspec/project.md`

---

### Q2. 你们用 humps.camelize 做接口字段命名转换，这个方案有哪些坑？为什么不让前后端统一一种命名风格？

> 来源：`tp-014` · scope: frontend · qq-project · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| humps camelize / decamelize 边界 | 必须掌握 | 本题核心。 |
| axios transformRequest / transformResponse | 必须掌握 | 插入点选择背后的机制。 |
| FormData / Blob 序列化注意事项 | 加分项 | 上传场景容易踩坑。 |

#### 三档回答

**🟢 一句话**：前后端统一命名是理想，但跨多个后端改不动，所以前端用 camelize 在请求层兜底。

**🔵 标准**（默认）：

我们对接的后端有 pindao-bff、TAPD、盘古、TOF 这些不同来源，命名风格混杂：有的全 snake_case，有的驼峰，甚至同一个接口 request 用 snake、response 用 camel。前端如果在每个 service 里手动转，重复又容易漏，所以我们在 src/utils/request/index.ts 的 beforeRequestHook 里对请求 params 做 humps.camelize（实际我们对接 BFF 的约定是请求侧需要 snake_case，所以这里其实是 decamelize；项目历史里两种都用过，本质都是统一在请求层处理）。前端业务代码内部一直保持驼峰，转换只在出入口发生。坑主要有：第一是 url path 不能转，否则带下划线的资源 id 会被改写；第二是带数字大写混合的 key 转换不稳定；第三是 body 是嵌套对象时要深度遍历，但碰到 File、Blob 不能动。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么不统一命名」、「转换接入点选择」、「具体坑」、「我们的折中方案」四个角度讲。第一，为什么不统一。理论上前后端约定一种风格最干净，但实际我们对接的后端不止一个，pindao-bff 是新建的可以约定，TAPD 是公司平台不能改，盘古是历史遗留接口字段名都是 snake_case，TOF 认证字段是 camelCase。让前端代码迁就任意一种都不优雅，所以折中是「内部驼峰、出入口转换」。第二，转换接入点。我们考虑过三个位置：service 层（每个接口手转）、axios transformRequest（最外层）、组件层（用前转）。最终选 axios transformer，因为只有这一处既能拿到完整的 config（决定要不要转），又能在错误时定位明确。第三，具体坑：humps.camelize 'product_id' -> 'productId' OK，但 'product_id_v2' 在某些版本会变 'productIdV2' 而不是 'productIdV_2'，对于带版本号的字段我们专门加了忽略列表；FormData 上传文件时不能动 keys 否则后端找不到字段；嵌套对象超过 5 层后转换性能下降，所以我们对单次 body > 1MB 的请求跳过转换。第四，折中方案：对 url 路径强制不转、对 FormData 跳过、对显式声明 noTransform=true 的接口跳过；同时对接 pindao-bff 时和后端确定 response 用 camel、request 由前端 decamelize 成 snake，这样前端业务代码完全是驼峰。这个 trade-off 的本质是「兼容历史的成本由前端单点承担」，比让每个业务自己处理代价小。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/utils/request/index.ts 中 beforeRequestHook 部分
  - [ ] humps 库 README 与已知 issue
  - [ ] axios transformRequest 文档
- 🛠️ 动手
  - [ ] 为一个嵌套 5 层的接口 body 写测试，验证 camelize 正确性
  - [ ] 给某个 FormData 上传接口加 noTransform 跳过转换
- ⚠️ 常见踩坑
  - 对 url path 做 camelize 把 /v2_user 改成 /v2User
  - FormData 字段被 camelize 后端找不到
  - 对带数字大写的字段转换不一致
- 🤔 自测题（合上文档自答）
  - [ ] 如果某个接口希望保持 snake，你怎么单独跳过？
  - [ ] 前端用 camelize 后类型怎么生成？
  - [ ] 如果换成 zod / typia 自动序列化，方案会怎么变？
- ⏱️ 预估学习时长：**2-3 小时**


#### Evidence

- `src/utils/request/index.ts`

---

