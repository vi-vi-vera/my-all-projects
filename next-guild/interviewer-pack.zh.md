# QQ 频道 Hybrid H5 (next-guild) — 面试官出题包

> Mode: interviewer · Role: 前端 · Level: 中级

> 本材料用于面试官在面试中抽题与评分。**不含标准答案**——评分依靠每题对应的 rubric。

## 🏗️ 架构（architecture）— 2 题

### Q1. pages/api/v2/[...slug].ts 那张 200+ 条 path 到 cmd 映射表怎么设计的？为什么不每个接口一个文件？

> id: `iq-03` · 来源 tech-point: `tp-003` · scope: fullstack · next-guild · 难度: 中级

#### Evidence

- `pages/api/v2/[...slug].ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **表越来越大怎么治理？要不要拆文件？**（architecture）
- ⚖️ **x-oidb 覆写 serviceType 如果传非法 JSON 会怎么样？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 表驱动抽象 | 0.40 | 能讲「一张表吃掉 99% 重复 BFF 代码 + 表本身就是接口目录」并举 cmd_serviceType 结构。 | 知道是表驱动但讲不出为什么不拆文件。 | 建议给每个接口写一个文件。 |
| catch-all 路由细节 | 0.30 | 能讲 slice(-2) 的原因、cmd_serviceType 下划线拆分和默认 2 的兜底。 | 知道 slug 是数组但不讲细节。 | 搞不清 slug 怎么解析。 |
| x-oidb 覆写健壮性 | 0.30 | 能讲 try-catch 包 JSON.parse、失败时回退默认 serviceType 并记错误日志。 | 知道要 parse 但没讲失败路径。 | 直接 JSON.parse 没有保护。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 三类 axios 实例你们是怎么分工的？isInMSDK 的判定逻辑为什么当前固定返回 true？

> id: `iq-04` · 来源 tech-point: `tp-005` · scope: frontend · next-guild · 难度: 中级

#### Evidence

- `src/common/request.ts`
- `src/common/oidbRequest.ts`
- `src/common/msdkRequest.ts`
- `src/utils/os.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **仅用 UA 判定 MSDK 环境有什么风险？**（reliability）
- ⚖️ **拦截器里把参数拼在 URL 还是 header 你会怎么选？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 三实例分工 | 0.40 | 能说清每个实例对应的网关、bkn 需求、MSDK 参数拼 URL 的原因。 | 能说三实例存在但混淆职责。 | 主张合并成一个。 |
| isInMSDK 当前决策 | 0.30 | 能讲固定 true 是业务决策以及历史 UA 判误判率高，保留 UA 代码做逃生口。 | 知道现在是 true 但讲不清原因。 | 认为应当继续靠 UA。 |
| 拦截器细节 | 0.30 | 能讲问号分隔符判断、baseURL 尾斜杠处理、URLSearchParams 空值兜底。 | 能说拼参数但忽略边界。 | 完全没关注拼接产生的双斜杠或空参数。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🧩 功能（feature）— 1 题

### Q1. iOS 的 MSDK 桥接为什么要一个 iframe？setupWebViewJavascriptBridge 的竞态你是怎么处理的？

> id: `iq-08` · 来源 tech-point: `tp-009` · scope: frontend · next-guild · 难度: 中级

#### Evidence

- `src/utils/msdk.ts`
- `src/utils/os.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **bridge 还没就绪前业务先调了 msdkCall 会发生什么？**（reliability）
- ⚖️ **为什么不用 window.webkit.messageHandlers？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| iframe 桥接原理 | 0.40 | 能讲 WKNavigationDelegate decidePolicyForNavigationAction 的拦截原理。 | 知道 iframe 是信号但讲不清 native 侧逻辑。 | 以为 iframe 加载真实资源。 |
| 竞态三分支 | 0.35 | 能讲 bridge 已在 / 待在队列 / 未在三种分支的处理。 | 能说出两种分支。 | 只处理一种。 |
| 跨端协议一致性 | 0.25 | 能讲 iOS 与 Android 协议枚举差异（3 vs 6）以及 fallback 到 prompt/alert。 | 知道两端略有差异但不具体。 | 以为协议完全一样。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🛡️ 可靠性（reliability）— 1 题

### Q1. master tag_push 和 test push 两条 Orange CI 流水线的分工是什么？为什么正式发布不自动？

> id: `iq-09` · 来源 tech-point: `tp-013` · scope: infra · next-guild · 难度: 中级

#### Evidence

- `.orange-ci.yml`
- `Dockerfile`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **双 tag（time + latest）并发 push 怎么避免竞争？**（reliability）
- ⚖️ **如果要加灰度流量切换你会怎么做？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 双流水线职责划分 | 0.40 | 能讲 master tag_push 只发镜像不部署、test push 自动 stke:update 的分工与动机。 | 能说两条流水线但混淆触发条件。 | 以为 master 也自动部署。 |
| 双 tag 策略 | 0.30 | 能讲 time tag 可溯源 / latest 便利，并提到并发竞争的风险规避。 | 知道有两个 tag 但讲不清竞争。 | 只用 latest。 |
| 人工确认动机 | 0.30 | 能讲生产灰度 / 回滚需要人工，自动只到镜像 push 阶段是刻意设计。 | 知道要人工但说不清动机。 | 主张一键全自动。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 📈 可观测性（observability）— 3 题

### Q1. trpc.withLog 是怎么工作的？traceparent 四段字段的含义是什么？

> id: `iq-05` · 来源 tech-point: `tp-006` · scope: fullstack · next-guild · 难度: 中级

#### Evidence

- `src/server-side/trpc.ts`
- `src/utils/report.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **上游已经带 traceparent 时你会新建还是复用？**（observability）
- ⚖️ **IsDev proxy=1 生产环境误开会怎么样？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 泛型封装 | 0.35 | 能讲 withLog<T,R> 的入参、Response<R> 返回以及类型推断收益。 | 知道是泛型但说不清推断。 | 用 any 写。 |
| traceparent 字段语义 | 0.40 | 能讲 version(00) / 32 位 traceId / 16 位 spanId / 1 字节 flags，以及 sampled 位。 | 知道格式大致结构但字段长度不准。 | 完全不知道 W3C trace-context。 |
| dev proxy 安全边界 | 0.25 | 强调 IsDev 双保险、生产禁用 proxy=1 的风险说明。 | 知道有 proxy 开关但没强调生产禁用。 | 认为生产开 proxy 也可以。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 服务端日志为什么要 log4js dateFile + atta 双通道？并发 SSR 下 context 覆写怎么处理？

> id: `iq-06` · 来源 tech-point: `tp-007` · scope: backend · next-guild · 难度: 中级

#### Evidence

- `src/utils/logger/index.ts`
- `src/utils/logger/atta.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **atta UDP 丢包对业务有影响吗？**（reliability）
- ⚖️ **用 AsyncLocalStorage 做 per-request logger 你会怎么改造？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 双通道动机 | 0.35 | 能说明本地真源 + 聚合补充、atta 走 UDP 的 fire-and-forget 语义、单通道失败不互相拖累。 | 知道有两条但说不清动机。 | 主张只留一条通道。 |
| context 隔离 | 0.40 | 能指出 getLogger 单例在并发 SSR 下会互相覆盖，并讨论 AsyncLocalStorage / child logger 的演进。 | 知道要挂 trace 但说不清单例问题。 | 以为 log4js 默认是每请求独立。 |
| 异常防护 | 0.25 | 能讲 atta .catch(() => false) 的动机和 unhandled rejection 曾崩溃的经验。 | 知道要 catch 但讲不清后果。 | 直接链式 then 没防护。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. 前端三通道监控（Aegis / web-vitals / 大同）职责怎么划分？排障时你怎么串起来用？

> id: `iq-07` · 来源 tech-point: `tp-008` · scope: frontend · next-guild · 难度: 中级

#### Evidence

- `pages/_app.tsx`
- `src/utils/report.ts`
- `src/utils/datong.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **spa:true 下 Next.js Pages Router 的 PV 捕获靠谱吗？**（observability）
- ⚖️ **为什么不自己撸一个单通道 SDK 合并三者？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 三通道职责划分 | 0.40 | 能讲 Aegis 是 RUM 自动采集、web-vitals 是性能指标、大同是业务事件，并给具体字段。 | 能说三者存在但边界模糊。 | 认为可以合并成一个 SDK。 |
| 负载 / 字段对齐 | 0.30 | 能讲 A8/A99/A100/A119/A120 这些魔法字段在大同协议里的角色。 | 知道有魔法字段但讲不清对应。 | 没注意到字段约束。 |
| 跨通道排障 | 0.30 | 能讲 Aegis -> atta -> log4js -> web-vitals 的排查路径与时间戳对齐。 | 知道要多通道关联但流程不清。 | 只依赖一个通道排查。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🔒 安全（security）— 2 题

### Q1. 讲讲你们 middleware.ts 做了什么，为什么选择 middleware 而不是 getServerSideProps？

> id: `iq-01` · 来源 tech-point: `tp-001` · scope: fullstack · next-guild · 难度: 中级

#### Evidence

- `middleware.ts`
- `pages/api/auth.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **middleware 里能调远端接口吗？这样做有什么风险？**（reliability）
- ⚖️ **matcher 配置和 pathname.startsWith 你会选哪个？为什么？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| middleware 定位 | 0.40 | 能说清 middleware 是边缘拦截、对比 getServerSideProps 的白屏差异，以及收窄前缀减少 CPU 开销的动机。 | 知道 middleware 更早，但说不清 CPU/白屏细节。 | 把 middleware 当成一个普通的 API handler。 |
| 回跳参数设计 | 0.35 | 能讲 basePath + pathname + search 拼回跳、nextUrl.clone() 结构化对象的必要性、参数长度截断等细节。 | 知道要带 redirect 参数但忽略 basePath。 | 直接把 location.href 塞 redirect 不考虑路径结构。 |
| 三件套 cookie 的可见性 | 0.25 | 能区分 openid httpOnly false 的动机与另两个 httpOnly true 的动机，并讨论 XSS 防护。 | 记得 httpOnly 但说不清哪些字段不需要。 | 全部 cookie 都当普通 cookie 设置。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. /api/auth 是怎么防开放重定向的？自己写正则不行吗？

> id: `iq-02` · 来源 tech-point: `tp-002` · scope: fullstack · next-guild · 难度: 中级

#### Evidence

- `pages/api/auth.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **国际化域名同形异义字符怎么防？**（security）
- ⚖️ **如果 checkurl 宕机降级你会怎么做？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 开放重定向攻击面理解 | 0.40 | 能列出至少三类变体（跳板 / @ 欺骗 / 后缀欺骗）并说明 checkurl 如何各个击破。 | 能说两种并大致解释防御。 | 不清楚自己是跳板角色只关心外部攻击。 |
| subhost 模式语义 | 0.30 | 能说 subhost 与 host 模式差异，说明 IDN 解码和 userinfo/IP 拦截。 | 知道是子域白名单但说不清内部实现。 | 把 subhost 当成字符串 includes。 |
| cookie 下发顺序 | 0.30 | 明确 Set-Cookie 必须在 res.redirect 之前，讨论部分浏览器顺序敏感。 | 知道顺序有关但说不清哪些浏览器。 | 不知道顺序影响。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. Redux 只放了 walletSlice 一个，为什么还要引入？未来如果状态增多你怎么演进？

> id: `iq-10` · 来源 tech-point: `tp-011` · scope: frontend · next-guild · 难度: 中级

#### Evidence

- `src/store/store.ts`
- `src/store/wallet.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **为什么不直接用 Zustand 或 Context？**（trade-off）
- ⚖️ **HYDRATE 对客户端初次渲染有哪些副作用？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 状态域决策 | 0.40 | 能讲页面局部 / SSR props / store 三档的选择依据，并解释 walletSlice 刻意极简。 | 知道状态克制但理由一般。 | 主张全部搬进 store。 |
| next-redux-wrapper HYDRATE | 0.30 | 能讲 HYDRATE action merge、extraReducers 处理以及为什么 walletSlice 不需要。 | 知道 HYDRATE 但说不清处理。 | 完全不了解水合机制。 |
| 方案对比 | 0.30 | 能对比 Zustand / Jotai / Context 并给出场景适配建议。 | 能列对比项但场景不明。 | 无视其他方案。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

