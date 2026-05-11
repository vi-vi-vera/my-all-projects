# 腾讯频道 Web 平台 (guild_web) — 面试官出题包

> Mode: interviewer · Role: 前端工程师（Vue 3 + Nuxt + Monorepo 方向） · Level: 中级

> 本材料用于面试官在面试中抽题与评分。**不含标准答案**——评分依靠每题对应的 rubric。

## 🏗️ 架构（architecture）— 5 题

### Q1. 你们这套 6 业务 × 11 共享包的 monorepo 用 pnpm workspaces + lerna 怎么协作？依赖一致性是如何被保证的？

> id: `iq-01` · 来源 tech-point: `tp-01` · scope: frontend · 难度: 中级

#### Evidence

- `pnpm-workspace.yaml`
- `lerna.json`
- `package.json`
- `packages/guild-components`
- `packages/guild-pb`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果一次升级把 vue 3.4 换成 3.5，你担心哪些包会出问题？提前怎么发现？**（reliability）
- ⚖️ **lerna independent 模式的 changed detection 在什么情况下会漏报？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 完整讲清 workspace:^ 协议、lerna independent、only-allow pnpm 三件套，并能解释 frozen-lockfile 在 CI 的具体作用。 | 能描述 pnpm 管依赖、lerna 管发布的分工，并举出至少一种锁定一致性的工具机制。 | 把 pnpm 和 lerna 职责混为一谈，或答不出 workspace:^ 是什么协议。 |
| 取舍意识 | 0.30 | 主动对比 Nx、Rush，能给出『不引入 task graph』的具体收益与代价，体现工程权衡观。 | 知道还有 Nx / Rush 等方案，能讲出一项不同点。 | 认为 pnpm + lerna 是唯一/最佳方案，无替代方案视角。 |
| 实战经验 | 0.30 | 能复述一次依赖版本飘移导致的具体线上/联调事故，并说明事后立了哪些纪律。 | 能讲出常见踩坑（如未锁 lockfile / workspace:^ 没替换），但没有具体事故。 | 完全没有 monorepo 治理实战痕迹，所有回答停留在理论。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. guild-editor 基于 exeditor3 的 At/Emoji/Placeholder 三类插件，状态隔离和跨插件通信怎么做？

> id: `iq-03` · 来源 tech-point: `tp-03` · scope: frontend · projects/guild-editor · 难度: 中级

#### Evidence

- `projects/guild-editor/src/components/Editor/index.ts`
- `projects/guild-editor/src/components/Editor/index.vue`
- `projects/guild-editor/src/components/Editor/plugins/placeholder.ts`
- `projects/guild-editor/src/components/Editor/utils/Editor.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **为什么 PlaceholderPlugin 必须用 decorations 而不能进 schema？**（architecture）
- ⚖️ **如果要新增『@全体成员』需求，会动哪几个插件？**（feature）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 讲清 ProseMirror PluginKey 隔离每个 plugin state 槽位的机制，且能给出 transaction.meta 跨插件通信的具体写法。 | 能说明三个插件职责差异，知道有 PluginKey 这种隔离机制。 | 把所有插件状态都塞同一个 store，或不知道 ProseMirror 的插件模型。 |
| 边界判断 | 0.30 | 明确区分『schema 落库』vs『decorations 视图层』，能举出 placeholder 写错位置会导致脏数据落库的具体后果。 | 知道 schema 与 decorations 性质不同，能正确归类常见富文本元素。 | 混淆 schema 与 decorations，或认为 placeholder 应该是真节点。 |
| 扩展性思维 | 0.30 | 能描述新增 PollPlugin 等插件的最小改动面，并指出多格式 serialize 的扩展点。 | 知道插件可插拔但讲不清新增插件具体走哪些钩子。 | 认为需要改动核心代码才能加新功能。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q3. PC Web / H5 / Electron / QQ 浏览器 / 手 Q 长贴 5 个宿主能力差异极大，你们是怎么分层抽象的？

> id: `iq-04` · 来源 tech-point: `tp-04` · scope: frontend · 难度: 中级

#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qq-guild`
- `projects/qqbrowser`
- `projects/guild-editor`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **useHostCapability 在 SSR 阶段读 window 会炸，你怎么处理？**（reliability）
- ⚖️ **如果业务方坚持要 isElectron 这种宿主判断，你怎么治理？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 分层架构能力 | 0.40 | 完整给出『能力探测 - 能力适配 composable - UI fallback』三层，并能举出 useShare / useUpload 在每一层的落点。 | 能描述两层抽象，至少举出一个 composable 例子。 | 宿主判断散在业务代码，无统一抽象，认为每个宿主写一份即可。 |
| fallback 设计 | 0.30 | 能讲出至少两条三级 fallback 链（如分享 native → 截图 → 二维码；剪贴板 navigator → execCommand → 弹窗），并解释埋点量化每层命中率。 | 知道需要 fallback，能给出一条具体的两级降级路径。 | 认为只有 native 一条路径，宿主不支持就报错。 |
| 扩展性 | 0.30 | 能清晰回答『新增鸿蒙 webview 第六个宿主时改哪一层』，体现抽象的单向扩展性。 | 知道理论上加宿主成本可控，但说不出具体改哪一层。 | 认为加一个宿主等于全量改造，看不到分层好处。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q4. web-guild 的 guild 和 detail 两个 Pinia store 边界怎么划分？SSR 水合 mismatch 你的排查方法学是什么？

> id: `iq-07` · 来源 tech-point: `tp-07` · scope: frontend · projects/web-guild · 难度: 中级

#### Evidence

- `projects/web-guild/store/detail.ts`
- `projects/web-guild/store/guild.ts`
- `projects/web-guild/composables/useShare.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果一个字段（如 用户角色）guild 和 detail 都想要，归属怎么定？**（architecture）
- ⚖️ **PATCH-style diff-only 同步在路由切换时如果遇到字段冲突怎么办？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 边界划分 | 0.40 | 用『生命周期』+『谁拥有数据/谁消费派生』两条准则给出明确边界，并解释 guild/detail 各自的实例化粒度（按 route key）。 | 能描述 guild 全局态 / detail 瞬时态的差异，但准则模糊。 | 把所有状态塞一个大 store，或两个 store 互相 import 形成循环。 |
| SSR 水合排查能力 | 0.30 | 按 cookie / 时间戳 / 第三方 widget / v-for key 四类高频原因给出系统化排查顺序，并提及 Vue devtools Pinia 面板。 | 能说出至少两类 mismatch 常见原因，工具链不完整。 | 依赖『加 ClientOnly 试一试』，无系统排查思路。 |
| 性能/可靠性细节 | 0.30 | 能讲出 PATCH diff-only 同步省 30% 流量的实测，且解释 etag + 增量 update 的具体协议设计。 | 知道路由切换可以增量更新 store，但讲不清协议细节。 | 认为切路由就该整体 reset store，看不到复用价值。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q5. guild-components / guild-pb / guild-types 共享包怎么版本管理？跨业务方升级冲突如何避免？

> id: `iq-11` · 来源 tech-point: `tp-11` · scope: frontend · 难度: 中级

#### Evidence

- `packages/guild-components/src/ai-app-cover/ai-app-cover.vue`
- `packages/guild-components/src/base-components/media-link/media-link.vue`
- `packages/guild-pb`
- `packages/guild-types`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **组件改一个 default slot 内容算 breaking change 吗？依据是什么？**（trade-off）
- ⚖️ **PB 类型如何向后兼容字段增减？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| SemVer 判定 | 0.40 | 明确给出『暴露给业务的 props/events/slots 契约变更才算 breaking』的判断准则，并区分 patch/minor/major 三档具体场景。 | 知道 SemVer 三档语义，能正确判断常见变更归类。 | 随手 patch 推 breaking change，或对 SemVer 不熟。 |
| PB 类型治理 | 0.30 | 讲清 .proto → codegen → npm publish 链路，并说明 root package.json 锚定 guild-pb 版本保证 6 个 project 同步升的必要性。 | 知道 PB 类型来自代码生成，能说一种版本一致性手段。 | 认为 PB 类型可以多版本共存，不理解 type erase 后的隐性 bug。 |
| 演进纪律 | 0.30 | 能讲『加 prop 默认兼容 / 删 prop 必先 deprecate 一版 + ESLint warn / 发包前 24h @ owner 公告 changelog』全套纪律。 | 知道需要 deprecate 流程，但具体执行细节缺失。 | 认为想删就删，删完通知下游即可。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🧩 功能（feature）— 2 题

### Q1. agent-settings / tasks / bio / identity / nickname 这套 AI Agent H5 链路为什么拆 5 个独立页 + 各自 editor？合并成一个大表单有什么不好？

> id: `iq-05` · 来源 tech-point: `tp-05` · scope: frontend · projects/h5-guild · 难度: 中级

#### Evidence

- `projects/h5-guild/views/agent-settings/index.vue`
- `projects/h5-guild/views/agent-tasks/index.vue`
- `projects/h5-guild/views/agent-bio/components/bio-editor/index.vue`
- `projects/h5-guild/views/agent-identity/components/identity-editor/index.vue`
- `projects/h5-guild/views/agent-nickname/components/nickname-editor/index.vue`
- `projects/h5-guild/pages/agent-settings/[guildId]/[tinyId]/index.vue`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果业务需要 identity 改完自动 refresh tasks，你会用 EventBus 还是双绑 store？**（architecture）
- ⚖️ **controlled editor 模式下，表单校验规则放在 editor 内还是父组件？**（trade-off）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 拆分理由 | 0.40 | 能讲清『后端实体微服务化 + UX 单字段编辑 + editor 状态各异』三个驱动因素，并对应解释为什么不做聚合 BFF。 | 能说出至少一条业务/技术驱动因素。 | 认为拆 5 页只是历史包袱，无业务/技术理由。 |
| Controlled editor 抽象 | 0.30 | 能讲清 v-model:value + onCommit 的解耦点，并说明这种模式如何避免 editor 与 store 强耦合。 | 知道 controlled / uncontrolled 区别，但讲不清边界。 | 把所有 editor 设计为直接读 store，组件失去复用性。 |
| 联动机制 | 0.30 | 能明确指出『弱关联走 EventBus / 强关联走 form-engine』的判断准则，并提及未来形态。 | 知道有 EventBus 或 store 两种方式，能说出一种适用场景。 | 认为只能 store 双绑，看不到其他联动手段。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. useShare / useGlobalShare / share-screen-dialog 这套分享体系怎么决定走哪条路？为什么不合成一个 composable？

> id: `iq-13` · 来源 tech-point: `tp-13` · scope: frontend · projects/web-guild · 难度: 中级

#### Evidence

- `projects/web-guild/composables/useShare.ts`
- `projects/web-guild/composables/useGlobalShare.ts`
- `projects/web-guild/components/share-qrcode`
- `projects/web-guild/components/share-screen-dialog`
- `projects/web-guild/types/guild-share.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **html2canvas 在 iOS Safari 上 OOM 怎么处理？**（reliability）
- ⚖️ **新增一种『复制图片到剪贴板』fallback，体系怎么扩展？**（feature）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| Composable 拆分 | 0.40 | 明确给出『useShare 跟随贴子组件生命周期 / useGlobalShare 跟随 app 生命周期』的拆分依据，并解释合并会反向加重耦合。 | 知道两个 composable 职责不同，能讲一处差异。 | 认为合并成一个更省事，看不到耦合代价。 |
| fallback 设计 | 0.30 | 能讲『native → 截图 → 二维码 → 短链』四级 fallback 的判定逻辑，并讲清每一级的能力探测条件。 | 能讲两级 fallback 和触发条件。 | 认为只要 native 就行，宿主不支持直接报错。 |
| 类型与观测 | 0.30 | 讲清 ShareTarget 联合枚举 + ShareContent discriminated union + 每次 share 的 scene/target/result 埋点；能举出『微信分享秒级定位』案例。 | 知道要类型约束，能说一种埋点维度。 | 类型用 any / 不打点。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## ⚡ 性能（performance）— 2 题

### Q1. Nuxt 3 SSR 和 CSR 在 guild_web 是怎么从同一份源码出双产物的？rollup 自定义分包的切分依据是什么？

> id: `iq-02` · 来源 tech-point: `tp-02` · scope: frontend · projects/web-guild · 难度: 中级

#### Evidence

- `projects/web-guild`
- `projects/h5-guild`
- `projects/qqbrowser`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果 SSR 模式下 onMounted 调 useFetch 没生效，你会怎么排查？**（reliability）
- ⚖️ **manualChunks 返回值不稳定会导致什么问题？怎么避免？**（performance）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 完整讲清 NUXT_SSR flag、nuxt build vs nuxt generate、server/plugins 仅 SSR 生效这三条事实，并解释 manualChunks 的写法层级。 | 能区分 SSR 与 CSR 产物形态，描述至少两种分包维度。 | 把 SSR/CSR 当成 runtime 切换，混淆 build 时和 runtime 概念。 |
| 性能权衡 | 0.30 | 能用 cache 命中率、LCP、vendor 体积三类数据具体论证手写 manualChunks 的收益。 | 知道默认 route-based splitting 有缺点，能说出一条具体差异。 | 认为分包颗粒度无所谓，或讲不出 vendor-stable / vendor-guild 分层动机。 |
| 宿主感知 | 0.30 | 主动结合 5 宿主能力差异讲清为什么必须双构建，并给出 SSR/CSR 各自适合的宿主。 | 知道部分宿主不支持 SSR，但说不出具体技术原因。 | 认为所有宿主表现一致，没有宿主差异概念。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. 短贴 Feed 用瀑布流 / 虚拟列表把 1 万条滚动做到 55+ FPS，核心机制是什么？踩过哪些坑？

> id: `iq-06` · 来源 tech-point: `tp-06` · scope: frontend · 难度: 中级

#### Evidence

- `projects/web-guild/views/g-home/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/h5-guild/views/cms/cms-batch/components/waterfall-feed/guild-waterfall-feed.vue`
- `projects/web-guild/components/virtual-waterfall`
- `projects/web-guild/gui/virtual-list`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **复用池大小怎么定？过大过小各有什么副作用？**（performance）
- ⚖️ **如果要支持锚点跳到第 5000 条，架构哪里要扩展？**（feature）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 技术正确性 | 0.40 | 完整描述『DOM 复用池 + IntersectionObserver + ResizeObserver 异步分片测高』三件套，并讲清复用是基于 transform translateY 而非真删 DOM。 | 能说出虚拟列表的核心是『不渲染视口外节点』，并给出一种触发懒加载方式。 | 认为 Vue 的 v-for + key 已经够用，看不到 1 万条数据响应式开销爆炸。 |
| 性能量化能力 | 0.30 | 能用 FPS、内存、reflow 次数三组数据具体论证收益，并讲出 requestIdleCallback batching 的意义。 | 知道要看 FPS 和内存，能讲一种性能分析工具。 | 无量化思维，仅停留在『看起来不卡』层面。 |
| 踩坑复盘 | 0.30 | 能讲出至少两个具体踩坑（如图片 load 触发 reflow 风暴、scroll 事件性能问题），并给出当下的修复方案。 | 能讲一个具体踩坑，但修复方案泛化。 | 无任何实战踩坑记忆，所有内容来自文档。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. fileBatchUpload → fileUpload 两阶段协议为什么不一次性传？多登录态（pskey/skey/access_token）怎么兼容？

> id: `iq-10` · 来源 tech-point: `tp-10` · scope: frontend · 难度: 中级

#### Evidence

- `projects/web-guild/components/upload-button`
- `packages/guild-components/src/base-components/media-link/media-link.vue`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **100MB 大文件主线程算 md5 卡死了，怎么解？**（performance）
- ⚖️ **断点续传的状态存 localStorage 还是 IndexedDB？为什么？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 协议理解 | 0.40 | 完整讲清『一阶段批申请签名 + 二阶段并发 PUT』的拆分理由（省握手 + 后端预检查 + 风控容量分离），并能讲 uploadId 在断点续传里的作用。 | 能说出两阶段的基本流程，知道为什么不能合并。 | 认为合并成一次也能跑通，看不到批申请收益。 |
| 工程化 | 0.30 | 能讲 Web Worker 分片 md5 + Semaphore 并发控制 + 指数退避重试 + 30% 失败阈值整批 abort 的具体策略。 | 能讲两个工程化点（如 Worker 算 md5 + 重试）。 | 主线程算 md5 / 并发不设限 / 失败不重试。 |
| 认证适配 | 0.30 | 讲清 pskey / skey / access_token 三套 header 的差异，并说明为什么 axios interceptor 必须统一在 packages/guild-components 而非各 project 重写。 | 知道多登录态需要适配 header，但讲不清统一封装的工程价值。 | 在业务侧手写 header，三个 project 三份实现。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

### Q2. ESLint 9 flat config + Husky + lint-staged + Orange CI 四道质量门禁，能不能只留 CI 那一道？

> id: `iq-12` · 来源 tech-point: `tp-12` · scope: frontend · 难度: 中级

#### Evidence

- `eslint.config.mjs`
- `.orange-ci.yml`
- `.code.yml`
- `package.json`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **团队成员习惯 --no-verify 怎么治理？**（trade-off）
- ⚖️ **flat config 在 monorepo 下多套规则怎么写？**（architecture）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 门禁分层理解 | 0.40 | 能讲『反馈循环长度 + CI 资源 + main 分支保护 + 渐进教育』四个理由，论证不能只留 CI。 | 知道本地和 CI 应该分工，能说出至少一条具体理由。 | 认为本地是冗余，CI 跑得过就行。 |
| flat config 掌握 | 0.30 | 能讲 flat config 的 files glob 显式匹配 vs .eslintrc 自动 merge 的根本差异，并能给 monorepo 下两套规则的具体写法。 | 知道 flat config 是普通 JS 模块，能说出一条优势。 | 把 flat config 当成 .eslintrc 的简单改名，看不到根本差异。 |
| 工具链踩坑 | 0.30 | 能讲 husky 9.x stash 在 Windows 失败、lint-staged 没 --diff 全量跑等真实踩坑，并给出 workaround。 | 能讲一个常见踩坑（如 husky 升级 hook 失效）。 | 无任何工具链踩坑经验。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 📈 可观测性（observability）— 1 题

### Q1. AegisV2 / Datong V4 / OpenTelemetry 三家观测同存，职责怎么划分？为什么不挑一家全用？

> id: `iq-09` · 来源 tech-point: `tp-09` · scope: frontend · 难度: 中级

#### Evidence

- `projects/web-guild/server/plugins/aegis.ts`
- `projects/web-guild`
- `projects/h5-guild`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果让你只保留一家，会怎么选？要补哪些短板？**（trade-off）
- ⚖️ **SSR 阶段三家 SDK 怎么分别注入？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 三家职责理解 | 0.40 | 清晰区分 Aegis 错误指纹聚合 / Datong 业务漏斗 OLAP / OTel 跨服务 trace 三者的不可替代项。 | 能说出三家中至少两家的核心能力。 | 三家职责混淆，认为都是『前端监控』。 |
| 工程协同设计 | 0.30 | 能讲统一 traceId 串三家、采样策略错峰（Aegis 全量 / Datong 场景 / OTel 头采+错误尾采）的具体设计。 | 知道要做关联，能讲一种关联手段（如 traceId）。 | 认为三家独立运行即可，无协同设计。 |
| SSR 注入细节 | 0.30 | 能讲清 Aegis 在 server/plugins 注入用 globalThis 而非 window、Datong 仅 client、OTel context 跨 server/client 通过 HTTP header 传递。 | 知道 SSR 不能直接读 window，但具体注入策略说不清。 | 在 SSR 直接读 window 让 SDK 报错。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

## 🔒 安全（security）— 1 题

### Q1. 图灵盾 turingSdk 风控接入，ticket 一次一票为什么不能缓存？PC 和 H5 的统一抽象有什么挑战？

> id: `iq-08` · 来源 tech-point: `tp-08` · scope: frontend · 难度: 中级

#### Evidence

- `projects/web-guild/utils/turingSdk/index.ts`
- `projects/h5-guild/utils/turingSdk/index.ts`


#### 压力追问（候选人答得太顺时用）

- ⚖️ **如果业务方提需求要『记住验证 5 分钟内免弹』，你怎么回应？**（security）
- ⚖️ **SDK 加载失败时业务侧的合理 fallback 是什么？**（reliability）


#### 评分卡

| 维度 | 权重 | 优秀 | 合格 | 不合格 |
|---|---|---|---|---|
| 安全意识 | 0.40 | 完整讲清 replay / 场景串扰 / 时间窗 三类攻击，明确表态 ticket 缓存是『退化为长期 token』的安全底线问题，不可妥协。 | 知道一次性凭证不该缓存，能说出至少一种攻击场景。 | 为了 UX 同意缓存，或不理解 nonce / 重放概念。 |
| 工程实现 | 0.30 | 能讲懒加载 + 兜底 + 双端统一 API 三件套，并说明 H5 在手 Q 内嵌优先走 mqq jsapi 的原因。 | 能描述至少一处工程实现细节（如懒加载或并发 dedup）。 | 认为只需 import SDK 调 verify 即可，看不到工程化考量。 |
| 观测与回滚 | 0.30 | 主动提到 verify 上报 scene/duration/result 到 Aegis，并举出『微信分享突降秒级定位』之类的真实案例。 | 知道要做埋点，但讲不出具体维度。 | 无观测意识，故障靠用户反馈才发现。 |

> 权重合计：**1.00**（建议落在 1.00 ± 0.05；偏离请人工复核）

---

