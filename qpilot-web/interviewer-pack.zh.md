# QPilot Web — 面试官出题包

> Mode: interviewer · Role: 全栈 · Level: 中级

> 本材料用于面试官在面试中抽题与评分。**不含标准答案**——评分依靠每题对应的 rubric。

## 🏗️ 架构（architecture）— 5 题

### Q1. 你们主聊天链路是怎么用 Vercel AI SDK 5 的 ToolLoopAgent 加 createUIMessageStream 重写的？为什么不继续在 OpenAIStream 上加功能？

> id: `iq-01` · 来源 tech-point: `tp-001` · scope: fullstack · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果业务要在工具执行中插入一个用户审批步骤暂停 loop，你这套架构怎么改？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动指出 ToolLoopAgent 负责多步循环、streamText 提供 token 流、createUIMessageStream 包装 part 事件，且能解释 Node runtime 与 maxDuration=300 的原因 | 在追问下能正确说出三个组件的职责和它们如何拼成一条 SSE 流 | 把 ToolLoopAgent 与 streamText 混为一谈，或说不清 part 类型与前端 useChat 的对应关系 |
| 取舍意识 | 0.30 | 能对比自研 OpenAIStream loop 与 SDK ToolLoopAgent 的成本，并指出 Edge runtime 在多步工具上的执行窗口不足 | 知道为什么改 Node runtime，但说不清楚旧链路保留的具体原因 | 只会回答『新版本更好』『SDK 更新了』之类泛泛说法，没有具体取舍 |
| 失败教训复盘能力 | 0.30 | 主动提及一个具体踩过的坑（如 abort 信号没透传到子工具、part 类型缺失导致前端渲染异常）并说出修复 | 在追问下能想起一个迁移过程中的具体问题 | 声称『没遇到问题』或只能给出『多测试』之类泛泛的总结 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 对话支持在某条消息重新生成并切分支，你们的数据模型是怎么设计的？为什么不直接覆盖旧回答？

> id: `iq-06` · 来源 tech-point: `tp-006` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/prisma/schema.prisma`
- `apps/desktop/src/components/ai-elements/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果用户在一个分支里点删除中间某条消息，你的实现会怎么处理？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 明确说出 Conversation.currentNodeId 指向当前可见叶子、Message.parentId 自引用，并解释从叶子向上回溯渲染当前会话 | 知道是树结构，能讲分支切换是切 currentNodeId，但说不清索引设计 | 把消息当作扁平数组并用 deleted 标志解决重新生成，没有意识到分支需求 |
| 取舍意识 | 0.30 | 能讨论为什么 conversationId 加索引而 parentId 不加，并解释每会话节点规模下递归 CTE 不必要 | 明白索引存在但说不清取舍 | 认为所有外键都该加索引，或建议引入图数据库等过度方案 |
| 失败教训复盘能力 | 0.30 | 主动提及 currentNodeId 一致性维护的具体坑（事务边界、并发重生）并描述如何修复 | 在追问下想到删除级联或孤儿节点这一类问题 | 不了解删除策略导致的潜在数据问题 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. 为什么前端要拆成 21 个 Zustand store 而不是放一个大 store？拆分边界是怎么定的？

> id: `iq-07` · 来源 tech-point: `tp-007` · scope: frontend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/stores/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果新加一个高频写的字段，你怎么决定它该放进哪个已有 store 还是新建一个？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动给出三条拆分准则（更新频率一致、订阅路径一致、persist 策略一致），并解释 selector 在 store 内部触发的机制 | 能说出至少一条拆分准则，理解 store 订阅会触发整个 selector | 认为按字段类型分（user / chat / ui）就够了，没意识到更新频率才是关键 |
| 取舍意识 | 0.30 | 能讨论 21 个 store 带来的认知与维护成本，并说明 barrel import 与 useShallow 在何种条件下使用 | 明白多 store 的代价但只能给出 barrel 一招 | 认为拆得越细越好，没有任何成本视角 |
| 失败教训复盘能力 | 0.30 | 主动讲述 selectedModel 早期放在 useUserStore 导致 user-subscribing 组件在切模型时全部 re-render 的踩坑与拆分修复 | 在追问下想起 persist schema 升级导致老用户字段缺失的问题 | 对真实生产中的踩坑无任何记忆 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q4. 你们怎么用 App Router 的路由组 (app)/(standalone) 和 _components 私有目录约定来组织页面？为什么需要两套机制？

> id: `iq-08` · 来源 tech-point: `tp-008` · scope: frontend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/app/(app)/`
- `apps/desktop/CODEBUDDY.md`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果一个原本 _components 下的组件突然要被另一路由复用，你的处理流程是什么？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 明确说出路由组（圆括号）只标 layout 边界不进 URL、_components（下划线）不被识别为路由段，且能给出具体目录例子 | 知道两个机制的存在，但说不清楚下划线开头的私有约定细节 | 将路由组与 _components 混为一谈，或者不知道 App Router 有这些约定 |
| 取舍意识 | 0.30 | 能讨论组件提到 src/components 的判定（真实跨页面复用而非临时共用），并解释 ESLint 规则如何挡住误用 | 明白存在分层但讲不清提到顶层的判定 | 认为所有组件都该放在 src/components 全局共用 |
| 失败教训复盘能力 | 0.30 | 主动说一个具体的越界 import 被 ESLint 挡掉的例子或者类似规则建立的动机 | 在追问下能给出一个目录约定误用的场景 | 想不起任何因目录约定踩过的坑 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q5. pnpm catalog 加 lerna independent 这套依赖治理是怎么运作的？为什么要双层而不是单一工具？

> id: `iq-12` · 来源 tech-point: `tp-012` · scope: infra · 难度: 中级

#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某个 package 下游消费方迟迟不升级 SDK 版本，你怎么推动？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能说出 pnpm-workspace.yaml 的 catalog 字段如何把核心库版本统一锁住、子包用 catalog: 引用，lerna independent 模式下每包独立 version 用 lerna publish from-package 发布 | 对 catalog 与 independent 各知道一半，但说不清 preinstall only-allow pnpm 的作用 | 认为 lerna 与 pnpm 功能重合所以选一个就够了 |
| 取舍意识 | 0.30 | 能给出『统一核心 + 独立业务』作为分层动机，并说明 lockfile 一致性需要 only-allow pnpm 兜底 | 知道两层各有职责但说不清楚交互 | 认为只用 pnpm 就够，不理解版本独立发布的需求 |
| 失败教训复盘能力 | 0.30 | 主动提到 React 子版本漂移导致 useId hook mismatch 的具体踩坑，并能说出 catalog 上线后的修复 | 在追问下想起某次 lockfile 双写造成的依赖错乱 | 对依赖治理踩过的坑没有任何记忆 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🧩 功能（feature）— 2 题

### Q1. 你们前端是怎么用 React Query 组织数据请求的？services 与 hooks 的边界为什么要这么切？

> id: `iq-10` · 来源 tech-point: `tp-010` · scope: frontend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/hooks/`
- `apps/desktop/src/services/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某个接口被三个组件用三种不同参数调用，你怎么判定是新建一个 hook 还是复用 service？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能描述 services 是纯函数 + zod 校验、hooks 是 useQuery/useMutation 包装层，queryKey 用 [resource, id, sub-resource] 三段式 | 知道有两层但说不清 queryKey 的设计 | 把 services 与 hooks 混合在同一文件，或在组件里直接 fetch |
| 取舍意识 | 0.30 | 能讨论 staleTime 按数据特征分级（30s / 5min / 0）和 retry 在 mutation 上关闭的原因（非幂等 + payload 大） | 知道不同接口配置不同 staleTime 但说不清依据 | 对所有接口用同一组配置，缺乏区分意识 |
| 失败教训复盘能力 | 0.30 | 主动谈到拆分前同接口被三组件调三次的经历，并能给出量化对比（命中率 / 调用次数） | 在追问下想起某次 invalidateQueries 误失效一整片缓存的经历 | 对 React Query 的 cache 行为没有真实生产中的认识 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. html-to-figma SDK 是怎么把网页转成 Figma 剪贴板格式的？字形与 SVG 路径分别怎么处理？

> id: `iq-14` · 来源 tech-point: `tp-014` · scope: frontend · packages/* 共享层 · 难度: 中级

#### Evidence

- `packages/sdk/html-to-figma/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某个网页用了商用字体而 Figma 端没装，你的 fallback 链路是什么？**（feature）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能拆出 figma-generator / glyph-encoder / vector-network-encoder / image-utils 四个模块，并说出 VectorNetwork 的 vertices+segments+regions 结构 | 能说出大致流程但讲不清字形为什么要转 path | 认为直接送原始 SVG path string 就行，不知道 Figma 没有这个能力 |
| 取舍意识 | 0.30 | 能讨论字形转 path 后失去文本可编辑性，并说明对正文不转、对装饰文字才转的取舍 | 知道有可编辑性损失但说不清如何分类处理 | 把所有文字都当成 path 处理而不区分场景 |
| 失败教训复盘能力 | 0.30 | 主动谈到 Bezier C/Q 命令转 VectorNetwork 时控制点对齐的踩坑，或图片跨域代理化的具体修复 | 在追问下想起 fillRule（evenodd vs nonzero）的处理差异 | 对路径与字形转换的边界没有任何具体经验 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚡ 性能（performance）— 2 题

### Q1. 多轮对话很容易把上下文窗口打穿，你们怎么决定何时压缩、压缩什么？为什么不简单按消息数 slice？

> id: `iq-04` · 来源 tech-point: `tp-004` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/shared/`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某一步工具输出突然涨到几万 token，你的预算计算会怎么响应？**（performance）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动拆出 context-budget / context-compressor / context-compress 三层职责，并能说明在 ToolLoopAgent.prepareStep 钩子里触发 | 知道有 token 预算与多种压缩策略，但说不清三层的边界 | 回答『按消息数截断』或『统一截一半』而不区分模型上下文窗口 |
| 取舍意识 | 0.30 | 能对比保留头尾 + 中间替换、老消息摘要、角色优先级丢弃三种策略的适用场景，并解释为何不全用其中一种 | 能列出策略名但说不清各自的边界 | 只会说『多压缩』『多截断』，无具体策略层次 |
| 失败教训复盘能力 | 0.30 | 主动谈到旧版盲目 slice 导致关键上下文丢失的具体案例，并说明如何借此重设计阶梯式压缩 | 在追问下能复述一次因压缩过度导致回答跑题的经历 | 认为压缩没有副作用，或想不起任何上线后调过的阈值 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. DnsOptimization 组件在做什么？为什么 layout 里要在服务端通过 cookie 初始化用户状态？

> id: `iq-11` · 来源 tech-point: `tp-011` · scope: frontend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/components/DnsOptimization.tsx`
- `apps/desktop/src/app/layout.tsx`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果 preconnect 上线后 LCP 没有改善，你会怎么定位是配置问题还是别的瓶颈？**（performance）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能说出 preconnect 同时跑 DNS+TCP+TLS 而 dns-prefetch 只做 DNS、crossorigin 必填，且 layout 通过 next/headers 的 cookies() 在 server 读 STAFFID 注入 RSC 树 | 知道 preconnect 用于减少握手，但说不清 crossorigin 的重要性 | 认为 preconnect 与 dns-prefetch 等价，或不知道 SSR 时用 cookies() 可以避免水合闪烁 |
| 取舍意识 | 0.30 | 能讨论 preconnect 数量过多会消耗连接池，并解释只对关键源域使用 | 知道不能给所有域都 preconnect 但说不出资源代价 | 建议给所有 third-party 都 preconnect 一遍 |
| 失败教训复盘能力 | 0.30 | 主动给出 Aegis 上 TTFB / LCP 上线对比（RTT 减少一次、首帧不再闪匿名） | 在追问下想起某次 preconnect 缺 crossorigin 导致字体仍重新解析 | 对实际效果没有任何数据感 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🛡️ 可靠性（reliability）— 1 题

### Q1. 用户点停止时，整条从前端到工具调用的 SSE 链路是怎么干净切断的？多 Pod 部署下 stop 请求落到不同实例怎么办？

> id: `iq-03` · 来源 tech-point: `tp-003` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/stop/route.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **假设工具内部用 fetch 调外部服务，你的 abort 没有透传 signal，会发生什么现象？怎么定位？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动描述 registerSessionAbort/unregisterSession 的会话级注册表、AbortSignal 透传到 streamText 与每个工具，并强调 finally 清理的必要性 | 知道有 stop 端点和 AbortController，但说不清 signal 如何在 SDK 内部传递 | 认为前端关闭 EventSource 就能停掉服务端，或不知道有专门的 stop 端点 |
| 取舍意识 | 0.30 | 能讨论 sticky session/网关路由解决跨实例 stop 的方案，并对比『session 信息放共享存储』的成本 | 知道多 Pod 是问题，但只能给出一个含糊方向 | 完全没意识到内存级注册表在多实例下的局限 |
| 失败教训复盘能力 | 0.30 | 主动提到把 abort 计入 chat_error_count 的 reason=user_abort label，避免与真正失败混淆 | 在追问下想起 useChat onError 不能弹错误 toast 的细节 | 想不起任何具体边界情况，或者把 abort 当成普通错误处理 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 📈 可观测性（observability）— 1 题

### Q1. 你们 Galileo 监控具体记了哪些 metric？instrumentation.ts 在 Edge 与 Node 双 runtime 下是怎么处理的？

> id: `iq-05` · 来源 tech-point: `tp-005` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/instrumentation.ts`
- `apps/desktop/src/shared/utils/galileo-logger.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某天发现 chat_error_count 突涨但 dashboard 上看不到对应的 trace，你怎么排查？**（observability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动列出 4 个 metric（api_request_duration / page_render_duration / chat_request_count / chat_error_count）并指明 histogram vs counter，再说出 NEXT_RUNTIME 守门 | 能命中两到三个 metric 名字，知道 register 钩子的作用 | 对 OTel 与 Galileo 的关系混乱，或不知道 metric 是自定义注册的 |
| 取舍意识 | 0.30 | 能解释为何选 OTel node-sdk 而非内置 Edge 监控，且说明 Sentry 等替代方案被淘汰的理由 | 知道 Edge 上 OTel 不能跑，但说不出 async_hooks 是关键阻塞 | 认为只要『加个监控库』就行，没有意识到 runtime 兼容性问题 |
| 失败教训复盘能力 | 0.30 | 主动谈到注册顺序——SetupGalileo 必须先于 metric 注册，否则 meter 未就绪——并描述如何发现这个 bug | 想起来 unhandledRejection 抓 promise 失踪的修补 | 对监控上线后的踩坑没有任何记忆 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🔒 安全（security）— 1 题

### Q1. Edge Middleware 里 jose.compactDecrypt 在解什么？为什么这一步要放在 Edge 而不是放在 Node 应用层？

> id: `iq-02` · 来源 tech-point: `tp-002` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/middleware.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果 TAI 平台开始轮换解密 key，每小时一换，你的代码不发版怎么跟上？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 明确指出解的是 JWE 紧凑序列化身份票据，能说出 StaffId 和 LoginName 字段，能解释 Web Crypto 在 Edge 原生可用而 Node 模块不行 | 能说出 Edge 离用户近、首屏前可用，但对 jose 的具体 API 模糊 | 把 JWE 与 JWT 混淆，或不知道 Edge runtime 与 Node runtime 在加密能力上的差异 |
| 取舍意识 | 0.30 | 主动讨论 matcher 的设计如何避免静态资源和 API 路径每次解密的成本，并能权衡放 Node 中间层的方案 | 知道 matcher 的存在，但说不出排除 _next 与 api 的具体动机 | 回答『Edge 更快』『更简单』而无任何场景化的依据 |
| 失败教训复盘能力 | 0.30 | 主动谈及解密失败的容错策略（落到匿名态而非 5xx），并能解释为何这样选 | 追问下能想到 key 与环境隔离的某种处理 | 认为解密失败应该直接 5xx 让站点不可用，没有意识到鉴权异常的影响半径 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚖️ 取舍（trade-off）— 3 题

### Q1. /api/chat、/api/qpilot-chat、/api/chat-main-agent-v2 三条链路同时存在，你们为什么不一次性下线老的？什么条件才会下线？

> id: `iq-09` · 来源 tech-point: `tp-009` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/app/api/chat/route.ts`
- `apps/desktop/src/app/api/qpilot-chat/route.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果产品要求所有插件路径下周必须切到新链路，你会怎么排期与风险评估？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能区分三条链路的具体定位（自研 OpenAIStream / eventsource-parser 代理上游 / SDK 5 ToolLoopAgent），并说出各自的 runtime 与上下游关系 | 知道存在三条但说不清其中一条的定位 | 把三条链路当作功能重复的冗余而不是阶段性产物 |
| 取舍意识 | 0.30 | 能给出具体下线条件（看板调用量连续一周为零、上游协议是否变化、回归风险评估） | 知道下线要等流量降下去，但没有具体阈值或时间窗 | 认为应该立即下线老链路，无视回归风险与上游兼容 |
| 失败教训复盘能力 | 0.30 | 主动讲述某次差点把老链路下线后引发回归的经历或类似教训 | 在追问下能想起一类老链路上的隐藏依赖 | 想不起来任何遗留链路相关的真实事件 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 你们怎么把 web_bak 这一坨老代码逐步迁到新栈？/migrate-component 工作流在做什么？

> id: `iq-13` · 来源 tech-point: `tp-013` · scope: frontend · web_bak · 难度: 中级

#### Evidence

- `web_bak/src/`
- `.cursor/`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果发现 antd 的某个 prop 在 shadcn 上没有对应实现，你的迁移策略怎么处理？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能拆出『映射表 + 工具 + 小批次』三步法，并能给出至少两类映射（UI 组件、数据层） | 知道有 .cursor 下的 skill，但说不清楚 AST 替换与人工 review 的边界 | 建议一次性重写整个 web_bak |
| 取舍意识 | 0.30 | 能讨论 antd 命令式 API（message.success）与 shadcn hook 风格的不可机翻边界，且说出标 TODO 让人介入的策略 | 知道有人工审 case 但说不清是哪些 case | 认为完全可以全自动迁移，无需人工介入 |
| 失败教训复盘能力 | 0.30 | 主动讲映射表第一版漏 antd 私有 prop 的踩坑与之后建立 prop 级规则的经验 | 在追问下想起 web_bak 与新栈共存阶段引发的某次回归 | 想不起任何迁移阶段的真实问题 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. 你们 middleware 在 Edge、main-agent 在 Node、instrumentation 也在 Node，runtime 是怎么选的？决策框架是什么？

> id: `iq-15` · 来源 tech-point: `tp-015` · scope: backend · apps/desktop · 难度: 中级

#### Evidence

- `apps/desktop/src/middleware.ts`
- `apps/desktop/src/app/api/chat-main-agent-v2/route.ts`
- `apps/desktop/src/instrumentation.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果未来要让 main-agent 提速，能不能改回 Edge？为什么不能？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能给出『执行时长是否超 Edge 窗口 + 是否有 Node 专属 API 依赖』两条决策标准，并对每个组件说清归属理由 | 知道 Edge 与 Node 不同但只能给出一条决策依据 | 认为 Edge 永远更快、应该全部上 Edge |
| 取舍意识 | 0.30 | 能讨论 Edge 冷启动优势 vs Node 长任务能力的取舍，并具体到 maxDuration=300 的设定背景 | 知道 maxDuration 是限制但说不清具体值的来源 | 对 maxDuration 的概念没有印象，或认为可以无限长 |
| 失败教训复盘能力 | 0.30 | 主动讲灰区案例（Postgres 在 Edge 需要 HTTP 驱动而 Prisma 不行所以路由锁 Node） | 在追问下想起某次因 runtime 选错引发的部署问题 | 想不起任何 runtime 相关的真实事故 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

