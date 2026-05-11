# QQ 项目管理门户 (qq-project) — 面试官出题包

> Mode: interviewer · Role: 前端 · Level: 中级

> 本材料用于面试官在面试中抽题与评分。**不含标准答案**——评分依靠每题对应的 rubric。

## 🏗️ 架构（architecture）— 2 题

### Q1. 你们项目里 Materials 配置和 power-design-react 是两层抽象，请讲讲它们各自的职责边界，以及为什么不合并成一层。

> id: `iq-01` · 来源 tech-point: `tp-001` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/materials/`
- `src/components/power-design-react/`
- `src/hooks/useConfigCreate.ts`
- `src/hooks/useConfigManage.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某个业务页面有 schema 表达不了的特殊渲染逻辑，你怎么扩展？会不会破坏抽象？**（trade-off）
- ⚖️ **Schema 字段命名要变更时，你有什么平滑迁移方案？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 抽象边界清晰度 | 0.40 | 能讲清 schema 只描述结构、power-design-react 只负责渲染，并能举出至少两个具体抽象点（useConfigCreate / useConfigManage）。 | 能说出两层各自做什么，但举例较泛。 | 把两层混为一谈，无法说出独立职责。 |
| 演进与扩展思考 | 0.30 | 能说出 schema 不够用时如何扩展（注册渲染器 / 字段命名走 OpenSpec），并意识到风险。 | 能给出一种扩展方式但没有讨论代价。 | 没有扩展思路或建议放弃 schema 重写命令式。 |
| 落地证据 | 0.30 | 能引用 src/materials、power-design-react、useConfigManage 这些具体路径并讲出关键 API 名。 | 提到目录但说不清 API。 | 没有具体实现细节，只停留在概念。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 九个 Zustand store 是按什么原则拆的？为什么不用单 store？请用具体业务字段举例。

> id: `iq-02` · 来源 tech-point: `tp-002` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/store/useViewManageStore.ts`
- `src/store/index.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **createWithEqualityFn + shallow 解决了什么问题？如果不传 shallow 会怎样？**（performance）
- ⚖️ **跨 store 联动你怎么处理？为什么没用 event bus？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 拆分原则与边界 | 0.40 | 能讲业务域拆分依据，举出每个 store 关键字段（如 viewList / savedProductIds / dialogVisible）。 | 能说按业务域拆但举例较少。 | 说不清拆分理由，认为合并也没问题。 |
| 重渲染机制 | 0.40 | 能讲清 createWithEqualityFn + shallow 的浅比较语义，能举不传 shallow 时的 rerender 现象。 | 知道要用 shallow 但说不清原理。 | 完全不了解相等性比较和 rerender 关系。 |
| 跨域协作 | 0.20 | 能讨论 store 间显式调用 vs event bus 的取舍，并提到循环依赖风险。 | 能给出一种跨域方案，但没讨论风险。 | 没有跨域方案，完全靠 useEffect 拉数据。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🧩 功能（feature）— 2 题

### Q1. 讲讲自定义视图 CRUD 是怎么从 OpenSpec 提案落到 useViewManageStore 再到 ViewCreate/ViewManage/ViewPush 三个组件的。

> id: `iq-04` · 来源 tech-point: `tp-007` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/store/useViewManageStore.ts`
- `openspec/changes/add-view-management/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **openEditDialog 这个 action 要同时写哪些字段？为什么不在组件里分别 set？**（architecture）
- ⚖️ **ViewPush 跨产品推送怎么防越权？前端 checkPermission 可信吗？**（security）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| OpenSpec 流程理解 | 0.30 | 能讲 proposal/design/spec/tasks 四件套各自的产出和归档时机。 | 能说出有四个文档但内容不全。 | 完全不了解 OpenSpec 流程。 |
| store action 编排 | 0.40 | 能讲 openEditDialog 同时写 editingView/savedProductIds/dialogVisible 的必要性，以及为什么不在组件里分别 set。 | 提到要同时写多字段但说不清原因。 | 在组件里到处 set，造成回填错乱。 |
| 跨产品安全意识 | 0.30 | 能讲 ViewPush 多产品场景下的后端校验，明确前端 checkPermission 不可信。 | 知道要做权限校验但分工不清。 | 完全依赖前端 checkPermission。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. useQPilot 这个 Hook 用 200ms × 20 次的轮询等 SDK 就绪，请讲讲为什么不直接监听 onload 事件，并指出这套设计可能的故障点。

> id: `iq-10` · 来源 tech-point: `tp-005` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/hooks/useQPilot.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **20 次轮询都失败你会怎么处理？是否需要降级？**（reliability）
- ⚖️ **QPilot 初始化失败怎么上报？需要走 Aegis 吗？**（observability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 轮询设计 | 0.40 | 能解释为什么 onload 不够（QPilotAI 还要二次初始化），并讲清 200ms × 20 是怎么调出来的。 | 知道用轮询但说不清原因。 | 认为直接 onload 就行，不知道二次初始化。 |
| 失败处理 | 0.30 | 能讲 20 次失败后的降级（隐藏入口 / 上报 Aegis）。 | 知道要降级但方案模糊。 | 失败后无任何处理。 |
| 生命周期清理 | 0.30 | 能讲卸载时 clearInterval 和移除 script 节点的必要性。 | 知道要清 timer 但忽略 script 节点。 | 完全没考虑卸载清理。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚡ 性能（performance）— 1 题

### Q1. useConfigManage 的 Excel 导出是递归分页拉数据再写盘，请讲讲这个设计的取舍，5000 条上限是怎么来的。

> id: `iq-05` · 来源 tech-point: `tp-008` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/hooks/useConfigManage.ts`
- `src/utils/file.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果数据量超过 5 万条你会怎么改方案？纯前端递归还能支撑吗？**（performance）
- ⚖️ **为什么不让后端做导出？前端导出有什么不可替代的好处？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 递归分页设计 | 0.40 | 能讲 fetchPage + 递归 + 终止条件（pageSize 不满 / 上限），并说出 pageSize 200 的依据。 | 知道是分页递归，但终止条件不全。 | 想直接 pageSize=10000 拉全量。 |
| 前端导出 vs 后端导出 | 0.30 | 能权衡复用业务接口、权限一致性、异步任务体验等多维度。 | 能给出一种立场但论据较弱。 | 没考虑过两种方案的差别。 |
| 可扩展性 | 0.30 | 能讨论 5 万条以上需要后端异步任务、worker、流式写盘等演进。 | 能提一种规模化方案但缺细节。 | 认为 5000 上限足够，不考虑大数据量。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. 请讲一下 src/utils/request/index.ts 里 transformer hook 和 interceptor 的协作顺序，camelize/401/Aegis/重试分别在哪一步执行。

> id: `iq-03` · 来源 tech-point: `tp-003` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/utils/request/index.ts`
- `src/utils/request/axios-transform.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **POST 创建类接口重试可能造成重复创建，你怎么避免？**（reliability）
- ⚖️ **humps camelize 的边界情况怎么处理？url、FormData 上传都做转换吗？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 钩子顺序理解 | 0.40 | 能按请求 -> 响应顺序讲完 beforeRequestHook、transformRequestHook、responseInterceptors、responseInterceptorsCatch 四个钩子。 | 能说出钩子但顺序不准确。 | 搞不清拦截器和 transform 的差异。 |
| 重试 + 监控 | 0.40 | 能讲 retryCount 计数、可重试错误判定，且讨论幂等问题；能讲 Aegis 上报字段。 | 知道有重试和上报但说不清细节。 | 无幂等意识，认为所有请求都能盲重试。 |
| 边界处理 | 0.20 | 能举 url 不转换、FormData 跳过、白名单接口跳过 401 上报等边界。 | 能说一两个边界但不全。 | 无边界意识，认为请求层一刀切就行。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. Orange CI 多分支策略和双 Dockerfile（业务镜像 + cache 镜像）是怎么配合的？请讲一遍 master 推全量、MR 只跑 lint 的全链路。

> id: `iq-09` · 来源 tech-point: `tp-006` · scope: infra · qq-project · 难度: 中级

#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `cache.dockerfile`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **cache 镜像和业务镜像 lock 文件不同步会发生什么？怎么校验？**（reliability）
- ⚖️ **FROM cache:latest 写死会有什么问题？versioned tag 怎么管？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 分支策略 | 0.30 | 能讲 master 推全量、MR 跑 lint+构建、feature 只跑 lint 的差异化策略及收益。 | 知道有差异化但说不全。 | 认为所有分支都应该构建镜像。 |
| 双 Dockerfile 协作 | 0.40 | 能讲 cache 镜像独立流水线、业务镜像 FROM cache、lock 文件 hash 校验。 | 知道有 cache 镜像但协作机制模糊。 | 搞不清两个 Dockerfile 谁是基。 |
| 运维风险 | 0.30 | 能识别 latest 被覆盖、secrets imports 不继承、TKE 配额等运维风险。 | 能说一两种风险。 | 无运维风险意识。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 📈 可观测性（observability）— 1 题

### Q1. Aegis 全局错误捕获和接口 retcode 上报你们是怎么协作的？哪些场景上报、哪些跳过？

> id: `iq-06` · 来源 tech-point: `tp-012` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/hooks/useAegis.ts`
- `src/utils/request/index.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **Aegis 上报本身失败你怎么知道？怎么避免循环上报？**（observability）
- ⚖️ **上报字段 ext 里塞太多业务上下文有什么风险？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 上报模型 | 0.40 | 能讲 Aegis 自动捕获 + retcode 手动上报双轨，并说出为什么 HTTP 200 + retcode!=0 也要上报。 | 知道有两条线但说不清差异。 | 只依赖 SDK 自动捕获。 |
| 降噪与白名单 | 0.30 | 能讲长轮询 401、用户取消请求、SSO 跳转 401 各类降噪场景。 | 能说一两种降噪场景。 | 没考虑过降噪，所有错误都报。 |
| 上报失败保护 | 0.30 | 能讲 try-catch 包住 Aegis、避免循环上报、ext 字段大小约束。 | 知道要保护但实现不全。 | 未考虑 Aegis 自身可能失败。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🔒 安全（security）— 1 题

### Q1. 门户依赖 TOF cookie 认证，前端 401 兜底和按钮级权限怎么协作？为什么前端 checkPermission 不可信？

> id: `iq-08` · 来源 tech-point: `tp-003` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `src/utils/request/index.ts`
- `openspec/project.md`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **为什么不把 token 存到 localStorage？XSS 风险具体怎么爆发？**（security）
- ⚖️ **401 跳转时 isRedirecting 标记防的是什么并发问题？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 认证模型 | 0.40 | 能讲 cookie + withCredentials + SSO 续期，对比 localStorage token 的 XSS 风险。 | 知道是 cookie-based 但讲不清续期细节。 | 倾向把 token 存 localStorage。 |
| 401 处理流程 | 0.30 | 能讲完整流程 isRedirecting -> logout -> reset stores -> redirect with redirectUrl。 | 能讲跳 SSO 但缺 isRedirecting 防抖等细节。 | 只跳 SSO 不清状态。 |
| 权限分工 | 0.30 | 能明确前端只做 UX 禁用、后端是权威，并讨论 viewId 跨产品越权场景。 | 知道后端要校验但前端兜底逻辑模糊。 | 把前端 checkPermission 当权威。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. 你们用 Next.js 14 但所有页面都包了 NoSSR 当 SPA 用，请讲讲这个决策的全部理由和代价。

> id: `iq-07` · 来源 tech-point: `tp-011` · scope: frontend · qq-project · 难度: 中级

#### Evidence

- `next.config.js`
- `src/components/Dynamic.tsx`
- `src/pages/_app.tsx`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **reactStrictMode 关掉对开发期 bug 检测有什么影响？怎么补这一刀？**（trade-off）
- ⚖️ **如果未来需要 SEO 或首屏优化，你会怎么演进到 SSR/RSC？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 决策动机 | 0.40 | 能从内网门户、登录态、第三方 SDK 兼容性、心智模型四个维度论证 NoSSR 选型。 | 能说一两条理由但不全。 | 认为 SSR 永远更好或不知道为什么 NoSSR。 |
| 实现细节 | 0.30 | 能讲 dynamic ssr:false、_document 静态资源、_app 副作用挂载的具体写法。 | 知道用 dynamic 但其它细节模糊。 | 完全说不出 NoSSR 是怎么实现的。 |
| 代价与演进 | 0.30 | 能讲 reactStrictMode false 的代价以及 RSC 演进前提条件。 | 知道有代价但举不出具体例子。 | 未考虑代价或演进。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

