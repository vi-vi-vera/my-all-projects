# QQ 频道小程序 (guild_mp) — 面试官出题包

> Mode: interviewer · Role: 前端工程师（微信小程序 / 内容社区方向） · Level: 中级

> 本材料用于面试官在面试中抽题与评分。**不含标准答案**——评分依靠每题对应的 rubric。

## 🏗️ 架构（architecture）— 3 题

### Q1. guild_mp 主包 2M 红线是怎么守住的？你会用什么原则来决定一个新模块进主包还是哪个分包？

> id: `iq-01` · 来源 tech-point: `tp-01` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/pages`
- `miniprogram/pages-feed`
- `miniprogram/pages-chatroom`
- `miniprogram/pages-manage`
- `miniprogram/pages-manage-inner`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果一次迭代主包意外超限 20KB，你前后端 / 构建三个方向各可以做哪些动作？哪条路径最快止血？**（reliability）
- ⚖️ **preloadRule 如果配置过激导致首 tab 首屏变慢，你如何定位是预加载抢带宽还是其他原因？**（observability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 主动讲清『主包只放 tab + tabBar』的硬边界，并解释 pkg-pb / pkg-worker 拆工具分包的动因。 | 能答出主包控制在 2M，并举出 feed / chatroom / manage 等按业务域拆分的例子。 | 只会泛泛说『用分包』，答不出主包可以放哪些内容、哪些必须剥离。 |
| 取舍意识 | 0.30 | 指出 preloadRule 过激会抢首 tab 带宽，并给出按用户路径分『必来 / 依赖 / 冷门』的分级策略。 | 知道 preloadRule 是有代价的，能举出至少一种需要按需加载而非预加载的场景。 | 认为 preloadRule 越多越好，或无法说出预加载的副作用。 |
| 失败教训复盘能力 | 0.30 | 能复述一次主包逼近 2M 红线的具体事件，给出定位手段（产物体积分析 / utils 下沉）与预防措施。 | 能说出至少一种常见踩坑（比如 utils 被错放主包）并给出修复方向。 | 没有任何线上 / 迭代踩坑记忆，只停留在『理论上会超』。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. requireAsyncModule 为什么要在原生 requireAsync 之上再封一层？没有 moduleRegistry 的版本会带来什么具体问题？

> id: `iq-02` · 来源 tech-point: `tp-02` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/utils/requireAsync.ts`
- `miniprogram/utils/moduleRegistry.ts`
- `miniprogram/utils/workerUtils.ts`
- `miniprogram/pkg-pb`
- `miniprogram/pkg-worker`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某个分包首次下载失败，你希望 requireAsyncModule 给业务返回什么？错误态、降级 UI、重试策略各自是谁负责？**（reliability）
- ⚖️ **moduleRegistry 条目增长到几百项时，你怎么保证 key 不冲突、类型签名不被人随手打破？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能解释 ModuleRegistry interface + MODULE_PATHS 常量 + requireAsyncModule 三层拆分，并说出泛型签名 <K extends keyof Registry>。 | 能说明『映射表 + 泛型 = 类型安全』的核心思路，能指出没有它时会退化成 any。 | 混淆 require / requireAsync 的差别，或答成『TypeScript 自动就能推导跨分包类型』。 |
| 取舍意识 | 0.30 | 指出维护一份 registry 的长期成本，并给出『按域切多张表』『生成器自动产出』等演化方向。 | 承认 registry 会膨胀，能给出至少一种缓解手段。 | 完全不考虑规模化成本，或认为可以永远手写维护。 |
| 失败教训复盘能力 | 0.30 | 举出一次 DEBUG_CONFIG 模拟分包失败暴露的实际 bug，并说明它让 QA 闭环更稳。 | 知道要做分包下载失败的测试，但没有具体案例。 | 从未考虑分包下载失败，也没在上线前做相关兜底验证。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. CDN 图片本地 cdn-img → cdn-go → 线上 URL 的链路里，哪一步最容易出问题？

> id: `iq-09` · 来源 tech-point: `tp-09` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/cdn-img`
- `miniprogram/utils/cdn.ts`
- `cdn-changes.txt`
- `script/robot.config.js`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **WXSS 里的 background-image 会不会被 CI 替换漏掉？你上线前怎么验证？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 串起 cdn-img 源 → utils/cdn.ts 消费 → Orange-CI 调 cdn-go 上传并替换的三层职责，能指出 dev / prod 分支行为。 | 能解释『本地写图片 + CI 自动替换 URL』的基本思路。 | 认为图片要手动上传 CDN 再粘贴 URL。 |
| 取舍意识 | 0.30 | 分析 CDN 不可用时的降级方案（本地兜底图 / 延迟重试）并给出取舍。 | 承认 CDN 会挂，并给出一种兜底方案。 | 完全不考虑 CDN 故障。 |
| 失败教训复盘能力 | 0.30 | 讲 WXSS background-image 未被 CI 覆盖导致线上图裂的修复经历。 | 能说出至少一种 CI 替换容易漏的场景。 | 认为 CI 替换万无一失。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🧩 功能（feature）— 2 题

### Q1. 邮箱登录这个需求你是从哪一步开始切的？设计文档、mock、真接口这几段如果压缩你会砍掉哪个？

> id: `iq-10` · 来源 tech-point: `tp-10` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/components/login-panel/login-panel.ts`
- `miniprogram/components/login-panel/login-panel.wxml`
- `miniprogram/utils/loginUtil.ts`
- `miniprogram/types/login.ts`
- `docs/superpowers/specs/2026-03-17-email-login-design.md`
- `docs/superpowers/reviews/2026-03-19-email-login-followups.md`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **60s 倒计时如果用 setInterval 累积，你能想到几种会出错的场景？**（reliability）
- ⚖️ **CR 里反复出现的问题你是怎么沉淀到团队知识里，而不是一人修完就算？**（feature）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 画出邮箱登录状态机：空 / 合法 / 发送中 / 冷却 / 失败，并解释 turingSdk ticket 在流程中的位置。 | 能依次讲『写设计 → mock → 真接口 → CR』四步。 | 只说『加了个登录』，答不出字段校验、按钮态、冷却等细节。 |
| 取舍意识 | 0.30 | 解释为什么倒计时以服务端时间为准、而不是 setInterval 累积，并说明 mock → 真接口两段的价值不能折叠。 | 承认 mock 阶段的价值，能说出一条使用 state machine 的好处。 | 认为 mock 阶段是浪费时间，应该直接接真接口。 |
| 失败教训复盘能力 | 0.30 | 能引用 followups 文档中至少两条具体修复（按钮态、cdn 图标、placeholder 对比度）并说明 checklist 的持续价值。 | 说得出至少一条 CR 里反复出现的修复点。 | 无法回忆 CR 中任何具体问题，只说『大家评审一下』。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. AI 应用卡片从点击到跳转的链路里，ticket_exchange 的作用是什么？没有它会怎样？

> id: `iq-13` · 来源 tech-point: `tp-13` · scope: fullstack · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/nt/api/aiAppApi.ts`
- `miniprogram/pages-feed/components/ai-app-card/ai-app-card.ts`
- `miniprogram/utils/link.ts`
- `miniprogram/utils/feedUtil.ts`
- `proto/pb/pb_just_json/group_pro/feed_ai_app/ticket_exchange.proto`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **未知 type 在老版本小程序上，你的 fallback 是静默忽略还是提示升级？理由？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 拆开 ai-app-card（纯渲染）、aiAppApi（ticket_exchange）、utils/link.ts（按 type 分发）三层职责，并示例 type === 'miniProgram' / 'webview' 的分发。 | 能答出『卡片点击 → 换票据 → 路由分发』的三段流程。 | 把卡片跳转看成直接 navigateTo，不知道 ticket 作用。 |
| 取舍意识 | 0.30 | 讨论未知 type 的静默降级 vs 升级提示两种选择，并给出与基础库兼容的判定。 | 知道要对未知 type 做 fallback，能举一种实现。 | 未知 type 直接抛错，老版本白屏。 |
| 失败教训复盘能力 | 0.30 | 举一次协议演进导致字段失配的事件，并说明 pb_just_json 类型驱动的修复路径。 | 能说出 AI 链接相关的一次改动或回归。 | 只描述过『加个新卡片』，不涉及演进问题。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚡ 性能（performance）— 3 题

### Q1. Feed 到详情页的预数据链路你是怎么设计的？触发信号、命中率、兜底路径这三件事分别怎么抓？

> id: `iq-03` · 来源 tech-point: `tp-03` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/utils/prefetch/prefetchManager.ts`
- `miniprogram/store/FeedPrefetchStore.ts`
- `miniprogram/store/PreDataStore.ts`
- `miniprogram/store/FeedDetailPreDataStore.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **弱网下滑列表时，预取请求会不会反而挤掉真实跳转请求的带宽？你是怎么量化和兜底的？**（performance）
- ⚖️ **如果线上观察到预取命中率只有 10%，你会保留还是下线？决策依据是什么？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 讲清『touchstart 触发 → prefetchManager 取数 → PreDataStore 缓存 → 详情页先读预数据再发真实请求』的完整链路，并说明为什么不用 tap。 | 能说出预取时机 + 缓存位置两件事的基本设计。 | 把预取等同于『点击后立刻取』，无法解释为什么要提前。 |
| 取舍意识 | 0.30 | 主动谈并发限制、TTL、去重三项策略，并解释弱网下的风险与量化手段（命中率 / 带宽占比）。 | 能说出至少一种代价（请求浪费 / 挤兑带宽）并说有监控。 | 认为预取完全没有代价，或不知道要做命中率观测。 |
| 失败教训复盘能力 | 0.30 | 举出『上下文菜单与详情数据不一致』的历史 bug，并解释用 computed 统一数据源解决的路径。 | 能说出一次预取相关的实际翻车或规则沉淀。 | 无任何踩坑复盘，停留在理想路径。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 你们为什么要把 miniprogram-computed 的使用规则沉淀成一份独立文件？对应的 setData 抖动问题能不能举一个具体 case？

> id: `iq-04` · 来源 tech-point: `tp-04` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/store/GuildFeedStore.ts`
- `miniprogram/pages-feed/store/FeedDetailStore.ts`
- `miniprogram/behaviors/contextMenuEmitterInitBehavior.ts`
- `.codebuddy/rules/miniprogram-computed-data-rules.mdc`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果 computed 的依赖链包含一个异步请求的结果，你会怎么接？为什么不能直接把请求写在 computed 里？**（reliability）
- ⚖️ **list 场景的 computed 如果每次返回新引用，会触发什么问题？你的修复方式是？**（performance）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 能描述 setData 经 Native Bridge 序列化到渲染层的成本，并解释 computed 脏检查如何避免等值重渲染。 | 知道 computed 用来派生视图数据、避免多处手写 setData。 | 认为 computed 就是『写简洁』的语法糖，说不出性能差异。 |
| 取舍意识 | 0.30 | 说明 computed 纯函数约束背后的原因（可缓存、可比较）并指出副作用场景应走 observer。 | 意识到 computed 不能写副作用，能举一个反例。 | 倾向在 computed 里发请求或改全局状态。 |
| 失败教训复盘能力 | 0.30 | 能引用 miniprogram-computed-data-rules 里的至少 2 条规则，并说明对应的线上 bug 起因。 | 能说出 list computed 引用稳定性或循环依赖这一类具体坑。 | 没踩过 computed 坑，也没读过团队规则文档。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. AIO 消息流里 SendMsgHelper、guildMsgPollingService、virtual-list 三块怎么分工？如果你把它们三合一成一个 service 会带来什么问题？

> id: `iq-11` · 来源 tech-point: `tp-11` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/pages-chatroom/nt/service/SendMsgHelper.ts`
- `miniprogram/pages-chatroom/nt/service/guildMsgPollingService.ts`
- `miniprogram/pages-chatroom/nt/service/localReadMsgSeqCache.ts`
- `miniprogram/pages-chatroom/text/components/virtual-list`
- `miniprogram/pages-chatroom/text/components/virtual-list-skyline`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **skyline 不支持某个 WXML 语法时，你的 fallback 是运行时切还是构建时切？各自代价是什么？**（trade-off）
- ⚖️ **乐观更新后服务端返回的 msgId 与本地 id 冲突，你怎么 reconcile？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 说清 SendMsgHelper（乐观更新）、guildMsgPollingService（轮询 + 退避）、virtual-list / skyline（渲染）的三块职责，并解释 skyline 回退策略。 | 知道有虚拟列表 + 轮询 + 发送三块，能粗略描述各自职责。 | 把 AIO 当成一块整 service，答不出分工。 |
| 取舍意识 | 0.30 | 分析 skyline 绕过 WebView 带来的帧率收益与 WXML 子集限制，并给出 capability 检测的降级路径。 | 承认 skyline 不是银弹，能说出一项限制。 | 认为 skyline 随便用都比 WebView 好。 |
| 失败教训复盘能力 | 0.30 | 举出乐观更新 id 未替换导致消息重复或错序的修复经验。 | 能说出至少一种长列表场景的具体踩坑。 | 从未遇到过消息错序或重复。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. utils/httpClient 承担了哪些横切关注点？登录态失效的时候，你希望它直接弹登录还是抛错给业务？

> id: `iq-06` · 来源 tech-point: `tp-06` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/utils/httpClient/index.ts`
- `miniprogram/utils/httpClient/cookies.ts`
- `miniprogram/utils/httpClient/urlParams.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **token 刷新期间大量接口并发打过来，你怎么防止雪崩和重复刷新？**（reliability）
- ⚖️ **非幂等接口（比如发帖）失败时，你敢不敢自动重试？判断依据是什么？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 拆分 statusCode vs backendCode 两层错误处理，说明 cookie 注入、urlParams、env 切换分别由哪个子模块负责。 | 能说出 HTTPClient 至少承担错误兜底 + 登录态注入两件事。 | 把 HTTPClient 看作『wx.request 的薄包装』，答不出横切关注点。 |
| 取舍意识 | 0.30 | 区分幂等 / 非幂等接口的重试策略，并解释 token 刷新时的队列化与去重。 | 承认非幂等接口不能随意重试，并知道 token 刷新期可能雪崩。 | 对所有接口都开启自动重试或无视 token 刷新并发。 |
| 失败教训复盘能力 | 0.30 | 能讲一次因错误码未枚举导致多个业务各自 toast 的事件，并说明如何把错误码集中到网络层。 | 举出至少一种 HTTPClient 对业务层的遗憾点（比如错误文案）。 | 从未在 HTTPClient 层遇到过生产问题。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 评论点赞限频这个 bug 复盘你们留下了什么产物？下一次类似问题怎么避免再犯？

> id: `iq-12` · 来源 tech-point: `tp-12` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/pages-feed/components/comments/comment-item/comment-item.ts`
- `miniprogram/pages-feed/components/comments/reply-item/reply-item.ts`
- `miniprogram/pages-feed/store/FeedCommentStore.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **乐观更新的四种结果分支（成功 / 失败 / 限频 / 未知），你会强制在哪个代码层保证都处理？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 指出乐观更新必须有『成功 / 失败 / 限频 / 未知』四种回滚分支，并说明限频码应在网络层枚举。 | 能描述限频时需要回滚点赞态 + toast。 | 认为乐观更新只需要处理成功分支。 |
| 取舍意识 | 0.30 | 讨论 UI 冷却窗口 vs 用户可感知延迟的折衷，并说明 toast + disable 组合的必要性。 | 承认只 toast 不 disable 会让用户继续连点。 | 只用 toast 或只 disable，不区分场景。 |
| 失败教训复盘能力 | 0.30 | 能说出团队沉淀的 optimistic action checklist 至少两条，并举使用效果。 | 能描述此次复盘产生的至少一个规则。 | 仅修了这一次 bug，没产出团队级产物。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 📈 可观测性（observability）— 1 题

### Q1. Aegis 上报的 sourcemap 是怎么上线的？为什么不能跟包一起上传？

> id: `iq-08` · 来源 tech-point: `tp-08` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/utils/log`
- `script/robot.config.js`
- `CLAUDE.md`
- `README.md`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果某次发布漏传 sourcemap，线上错误都变成乱码栈，你怎么快速兜底？**（reliability）
- ⚖️ **匿名用户阶段抛的异常，你怎么避免它挂到错误的登录 userId 上？**（observability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 说明 sourcemap 由构建产出但不随包上线，CI 通过 Aegis 上传接口以 version 为 key 推送，线上栈再做映射。 | 能说清 Aegis 的错误 / 性能上报职责，并知道要上传 sourcemap。 | 把 Aegis 看成简单的 console.error 替代品，不理解 sourcemap 作用。 |
| 取舍意识 | 0.30 | 讨论 sourcemap 随包上线的安全风险，并给出 CI 上线 checklist。 | 承认 sourcemap 不该随包上线，但没有完整 checklist。 | 认为 sourcemap 可以和产物一起公开，或者无所谓。 |
| 失败教训复盘能力 | 0.30 | 讲一次漏传 sourcemap / 匿名 userId 错绑的事件并给出补偿手段。 | 知道漏传 sourcemap 的后果，能说出排查步骤。 | 没有处理过上线监控事故，只停留在配置 SDK 层面。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🔒 安全（security）— 1 题

### Q1. 图灵盾 turingSdk 在前端只是『弹验证码』吗？前端和服务端各自承担哪部分安全校验？

> id: `iq-07` · 来源 tech-point: `tp-07` · scope: frontend · miniprogram · 难度: 中级

#### Evidence

- `miniprogram/utils/turingSdk`
- `miniprogram/behaviors/turingSdkBehavior.ts`
- `miniprogram/components/login-panel/login-panel.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **ticket 如果被复用或泄露，你期望服务端有什么防御机制？前端能帮什么忙？**（security）
- ⚖️ **验证码弹层如果短时间被触发两次，会不会导致双请求？你 Behavior 里怎么防？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 讲清 Behavior 注入 + triggerCaptcha 拿 ticket + 后端用 ticket 校验的三段式，并指出 ticket 是一次性。 | 能指出前端只是取 ticket、真正校验在服务端。 | 认为验证码过了就安全，把风控结果仅在前端判断。 |
| 取舍意识 | 0.30 | 讨论无感 / 滑块 / 短信多级策略的用户体验与风险平衡，并说明什么时候应该升级。 | 承认频繁弹验证码会伤用户，能给出一种缓解方案。 | 不考虑验证码的打扰成本，或对所有操作都要求强验证。 |
| 失败教训复盘能力 | 0.30 | 能举 Behavior 没做幂等导致短时间双弹层 / 双请求的修复案例。 | 知道要防抖 / 去重，能说出一种实现。 | 从未思考过连续触发的副作用。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. 为什么 guild_mp 选『pb_just_json 仅类型 + pkg-pb 按需编解码』的双轨？如果只允许选一条路，你会怎么选？

> id: `iq-05` · 来源 tech-point: `tp-05` · scope: fullstack · miniprogram · 难度: 中级

#### Evidence

- `proto/pb/pb_just_json`
- `proto/pb/pb_need_decode`
- `miniprogram/pkg-pb`
- `proto/typings/pb_just_json.d.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **JSON 传输和二进制传输在协议演进上的兼容性差异，你能举一个会出错的具体字段类型吗？**（trade-off）
- ⚖️ **如果后端把一个原来走 JSON 的接口切成二进制，前端改动量集中在哪几个文件？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 清晰区分 pb_just_json（仅生成 .d.ts 类型、传输走 JSON）与 pb_need_decode（编解码进 pkg-pb 懒加载）两条路径的产出物与用途。 | 知道一部分 proto 只取类型、另一部分需要运行时编解码，能说出各自的动因。 | 把 protobuf 当成『一定要二进制』的黑盒，没理解 JSON 也能复用 proto 类型。 |
| 取舍意识 | 0.30 | 给出分类规则：高频小数据走 JSON、跨端共享 / 高吞吐走二进制，并能举一个需要改轨的具体场景。 | 能说出两条路径各自代价，并给出一个选择场景。 | 一刀切推荐全 JSON 或全二进制，不考虑主包体积。 |
| 失败教训复盘能力 | 0.30 | 讲出一次因字段大小写 / 枚举序列化差异导致 JSON vs 二进制行为不一致的修复经验。 | 说得出协议兼容性至少一个常见雷点（比如新增必填字段）。 | 认为 JSON / 二进制互切不会有行为差异。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

