# QQ 频道小程序 (guild_mp) — 面试备战材料

> Mode: candidate · Role: 前端工程师（微信小程序 / 内容社区方向） · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 2      | 🧩 |
| architecture  | 3 | 🏗️ |
| performance   | 3  | ⚡ |
| reliability   | 2  | 🛡️ |
| observability | 1| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 1     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

QQ 频道微信小程序，原生栈 + 16 分包架构，主包守住 2M，承载频道 / 帖子 / 讨论组 / AI 问问全链路。

### 标准（30–60 秒）

guild_mp 是腾讯 QQ 频道的微信小程序端，用原生小程序 + TypeScript + mini-stores + miniprogram-computed 搭建，整体是 1 个主包加 16 个业务分包再加 pkg-pb / pkg-worker 两个工具分包的架构。主包靠 preloadRule 在首 tab 进入时预加载 feed / assistant / tool 等分包，跨分包通过 requireAsyncModule 配合 moduleRegistry 做类型安全的懒加载。业务上覆盖频道浏览、Feed 详情与发布、讨论组 IM、频道管理、AI 问问等完整场景；我参与了 Feed 预数据加速、邮箱登录功能闭环、CR 复盘与监控埋点等工作。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

guild_mp 是 QQ 频道在微信侧的官方小程序端，技术选型围绕两个核心约束：微信 2M 主包红线与 IM + 内容社区的复杂业务形态。我们没有使用 Taro 这类跨端框架，而是用原生小程序 + TypeScript 5，以 @tencent/mini-stores 作为跨页状态容器、miniprogram-computed 作为计算属性方案、@bufbuild/protobuf + protobufjs 处理协议。主包只放 4 个 tab（首页 / 消息 / 我的 / 频道主页）与自定义 tabBar，其他业务都拆到 16 个业务分包，并额外拆出 pkg-pb（协议编解码）和 pkg-worker（emoji 等重工具）两个工具分包；首 tab 加载完成后 app.json 的 preloadRule 会预拉起 feed / assistant / tool / pkg-pb 等高频分包。跨分包调用通过 utils/requireAsync.ts 的 requireAsyncModule，结合 moduleRegistry 的泛型映射，把字符串路径转成强类型的模块签名，内置 DEBUG_CONFIG 可模拟分包下载延迟与失败。性能层面，utils/prefetch/prefetchManager 配合 FeedPrefetchStore / PreDataStore 在 Feed 列表点击时预取详情页接口，miniprogram-computed 收敛 setData，数据一致性问题沉淀成了一份 miniprogram-computed-data-rules。可靠性上 httpClient 做 Cookie 与错误兜底，安全上接入了图灵盾 turingSdk，监控上用伽利略 Aegis 做错误上报且发布流水线自动上传 sourcemap，长列表走 virtual-list 与 skyline 两套实现。我主要负责 Feed 预数据调优、邮箱登录功能、AI 应用卡链接分发，以及围绕这些需求的 CR 修复与规则沉淀。另外我在这个项目里养成了一个习惯：每次加新需求先看主包大小、看新分包是不是该独立、看有没有可以走 requireAsyncModule 的入口，把性能问题挡在合入之前。

</details>

## ✨ 项目亮点

- **主包 2M 红线下的 16 分包架构与类型安全跨分包懒加载**（architecture · frontend）
  情境：QQ 频道在小程序侧需要同时承载 IM + 内容社区，天然容易把主包撑爆。任务：保证主包 ≤ 2M 的同时不牺牲二次跳转体验、且让 TypeScript 能在跨分包调用处提供补全。行动：把主包收敛到 4 个 tab + 自定义 tabBar，其余按业务域拆成 16 个业务分包并抽出 pkg-pb、pkg-worker 两个工具分包；app.json preloadRule 在首 tab 就位后预拉起 feed / assistant / tool / pkg-pb；跨分包调用统一走 utils/requireAsync.ts 的 requireAsyncModule，用 moduleRegistry 的泛型映射把字符串路径转成强类型签名。结果：主包长期稳定在 2M 红线内，新业务横向扩展只改映射表不动业务方，协议编解码代码不再进主包，DEBUG_CONFIG 能模拟分包延迟 / 失败用于测试。
  > 关键词：`分包` · `preloadRule` · `requireAsyncModule` · `TypeScript 泛型` · `moduleRegistry`
- **Feed 预数据 + miniprogram-computed 打磨首屏与渲染性能**（performance · frontend）
  情境：Feed 列表到详情页跳转的白屏时长与滑动卡顿影响留存。任务：在不改协议的前提下把首屏数据前置、减少 setData 抖动。行动：在 utils/prefetch/prefetchManager 里实现基于点击意图的预取，结果写入 FeedPrefetchStore / PreDataStore；组件侧用 miniprogram-computed 代替手写 setData 组合，沉淀 miniprogram-computed-data-rules。结果：详情页首屏命中时近乎瞬开，上下文菜单与 Feed 详情数据不一致的线上问题通过 computed 统一数据源收敛，规则文件成为团队 onboarding 资料。
  > 关键词：`prefetch` · `PreDataStore` · `miniprogram-computed` · `setData 优化` · `mini-stores`
- **Protobuf 双轨策略：仅类型 vs 按需编解码**（trade-off · fullstack）
  情境：把 protobufjs 运行时打进主包会撑爆体积，全用 JSON 又丢类型安全。任务：兼顾类型安全、包体积与协议演进能力。行动：把 proto 分成 pb_just_json（仅需类型）与 pb_need_decode（需要运行时编解码），前者 yarn gen:pb 生成全局 rootProto 命名空间的 .d.ts，后者的编解码实现放进 pkg-pb 分包由业务 requireAsyncModule 懒加载。结果：主包不再吃编解码代码，新增 JSON 协议几乎零成本，二进制链路独立演进，包体积与 DX 取得平衡。
  > 关键词：`protobuf` · `pkg-pb 分包` · `rootProto` · `包体积` · `类型安全`
- **HTTPClient + 图灵盾 + 伽利略 Aegis 的网络 / 风控 / 监控三件套**（reliability · frontend）
  情境：前端要处理登录态、多环境切换、后台错误码、验证码风控与线上监控。任务：让业务不用关心这些横切关注点。行动：utils/httpClient 统一封装 cookie、urlParams、环境切换与后端错误兜底；utils/turingSdk + turingSdkBehavior 接入图灵盾做验证码与风控；utils/log 基于 Aegis 封装上报，流水线自动上传 sourcemap。结果：业务调 API 一行代码，异常定位从 build 后回到源文件，高风险操作有统一风控入口。
  > 关键词：`httpClient` · `turingSdk` · `Aegis` · `sourcemap` · `Behavior`
- **邮箱登录需求：从设计文档到 CR 闭环的一个研发样本**（feature · frontend）
  情境：QQ 频道需要补齐邮箱登录以覆盖没有 QQ 号的用户。任务：在既有 login-panel 下接入邮箱 + 验证码，兼顾设计规范、交互可用性与安全。行动：先写 docs/superpowers/specs/2026-03-17-email-login-design.md 走清字段与态，mock 调通倒计时 / 禁用态 / placeholder，再接入真实接口 + 图灵盾，多轮 CR 修复按钮态、cdn 图标、错误文案，最后把 followups 归档到 docs/superpowers/reviews/2026-03-19-email-login-followups.md。结果：邮箱登录灰度稳定，『设计 → mock → 真接口 → CR → 复盘』流程被固化为团队样板，产出可复用的倒计时验证码 Behavior。
  > 关键词：`需求闭环` · `mock → 真接口` · `CR followups` · `Behavior` · `图灵盾`


## 🏗️ 架构（architecture）— 3 题

### Q1. guild_mp 的主包是怎么守住 2M 红线的？分包划分依据和 preloadRule 策略是什么？

> 来源：`tp-01` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 微信小程序主包与分包、pkg-* 工具分包的体积规则 | 必须掌握 | 小程序工程化最基础的约束。 |
| app.json preloadRule 的 network / packages 语义与触发时机 | 必须掌握 | 低成本把二次跳转体验拉满的杠杆。 |
| 分包下载失败 / 超时的兜底 | 加分项 | 加分项，体现生产可用性敏感度。 |

#### 三档回答

**🟢 一句话**：主包只放 4 个 tab 和 tabBar，16 个业务分包按业务域拆，preloadRule 在首 tab 预热 feed/assistant/tool。

**🔵 标准**（默认）：

主包严格只放 4 个 tab 页（首页 / 消息 / 我的 / 频道主页）加自定义 tabBar，业务一律进分包。16 个业务分包按业务域切：Feed 相关进 pages-feed，讨论组 IM 进 pages-chatroom，频道管理因为页面较深拆成 pages-manage 外层与 pages-manage-inner 内层两块，AI 问问单独一个 pages-wenwen。protobuf 编解码、emoji 这类重工具独立成 pkg-pb 与 pkg-worker 工具分包。preloadRule 不是一次预加载所有分包，而是基于用户路径：首 tab 就位后预热 feed / assistant / tool / pkg-pb 这些最高频命中的分包，其他分包在真实点击时再下载。整体让主包 ≤ 2M、首屏最快、二次跳转几乎零感知。

<details><summary>🔴 深挖（点击展开）</summary>

设计时我们给主包划了两条硬性边界：一条是微信平台的 2M 体积红线，一条是『能不能离开 tab 壳子进业务』。主包里只允许四个 tab 页与 tabBar 组件。分包划分遵循三原则：业务高内聚优先（feed / chatroom / manage / wenwen 各自成包）；页面层级深的再二次拆分（pages-manage → pages-manage-inner 承担身份组 / 版块 / 权限 / 应用管理三级页）；跨业务重工具走工具分包（pkg-pb 放 protobuf 运行时编解码，pkg-worker 放 emoji 等纯函数工具）。preloadRule 按三类路径建模：一是 T+1 必来的（feed / assistant / tool），直接在 app.json 预加载；二是依赖型（pkg-pb），在高概率触发点发生前预热；三是冷门路径（pages-manage-inner），完全按需。跨分包调用统一走 requireAsyncModule，让分包边界在代码上显式、可控、可测，DEBUG_CONFIG 还能模拟分包下载延迟 / 失败，用来 QA 兜底路径。最终主包体积长期稳定在红线内，新业务扩展基本只动分包 + moduleRegistry。我们守 2M 主包的办法分三层。第一层是分包粒度：guild-aio、channel-frame、square、square-feed、live-stream、kge-channel、qmusic-channel 这些重业务都各自独立分包，工具类拆出 pkg-pb 装 protobuf 生成物、pkg-worker 装 worker 脚本。第二层是 preloadRule 白名单：主包 onLaunch 后才会预下载 channel-frame、square 这两个高频入口，其他分包等到点进对应 tab 再走 requireAsyncModule 拉。第三层是 CI 防回退：构建产物超过 2M 直接红线挡合入，新增 npm 包必须在 review 里讲清楚放主包还是分包，所以新功能基本不会污染主包。这套规则在仓库 project.config.json 和 build 脚本里都能直接看到。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 微信官方文档 - 分包加载 / 分包预下载 (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
  - [ ] guild_mp docs/分包规则.md
- 🛠️ 动手
  - [ ] 空小程序压到 1.5M 以下，用 preloadRule 预加载一个分包并观察加载时序。
- ⚠️ 常见踩坑
  - 通用工具随手放主包 utils 导致悄悄逼近 2M。
  - preloadRule 配得太激进抢首屏带宽。
- 🤔 自测题（合上文档自答）
  - [ ] 怎么判断一个模块该放主包还是分包？
  - [ ] preloadRule 与独立分包、按需注入有什么区别？
- ⏱️ 预估学习时长：**1 day**

#### 追问（面试官深挖向）

- ⚖️ **如果主包在某次迭代超出 2M 20K，你会怎么定位与切分？**（architecture）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/pages`
- `miniprogram/pages-feed`
- `miniprogram/pages-chatroom`
- `miniprogram/pages-manage`
- `miniprogram/pages-manage-inner`
- `docs/分包规则.md`

---

### Q2. requireAsyncModule 是如何在跨分包懒加载的同时保住 TypeScript 类型的？

> 来源：`tp-02` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 小程序 require / requireAsync API 与加载时序 | 必须掌握 | 懒加载的底层能力。 |
| TypeScript 泛型映射：keyof / mapped types / conditional types | 必须掌握 | moduleRegistry 强类型的支撑。 |
| 模块缓存与首次加载失败的重试 / 降级 | 加分项 | 加分项，生产鲁棒性。 |

#### 三档回答

**🟢 一句话**：用 moduleRegistry 做路径到模块类型的泛型映射，await requireAsyncModule(key) 直接拿到强类型。

**🔵 标准**（默认）：

小程序原生 require 跨分包拿到的是 any，补全和重构都没法玩。我们在 utils/requireAsync.ts 里定义 ModuleRegistry interface，键是分包内的逻辑路径（如 pkg-pb/messagePb），值是对应模块的真实类型，再用 MODULE_PATHS 常量表把逻辑路径映射到物理相对路径。requireAsyncModule<K extends keyof ModuleRegistry>(key: K) 的返回值是 Promise<ModuleRegistry[K]>，业务 await 后就拿到带类型的模块。DEBUG_CONFIG 可以注入随机延迟与失败，用来验证加载态与兜底逻辑。调用方拿到的就是普通对象，编辑器跳转、自动补全和类型检查都不会掉。

<details><summary>🔴 深挖（点击展开）</summary>

这个工具解决的是『小程序跨分包调用的 DX 和安全性』。基础库的 require(path) 是运行时字符串，TypeScript 静态分析不到跨分包真实模块，默认拿 any，意味着调错签名、改名都没有反馈。我们把问题拆三层：路径层 MODULE_PATHS 把 'pkg-pb/messagePb' 这样的逻辑 key 映射到物理路径；类型层 ModuleRegistry interface，value 是 typeof import('../pkg-pb/messagePb') 这类真实模块类型；能力层 requireAsyncModule 把基础库 requireAsync 包装成强类型 Promise。调用方 const mod = await requireAsyncModule('pkg-pb/messagePb') 就像引本地模块一样享受补全和跳转。workerUtils 也复用同一套注册表去加载 worker 模块，多分包边界收敛到一张表。测试层面 DEBUG_CONFIG 支持 simulateDelayMs / simulateFailureRate，灰度前会专门跑一遍分包下载失败场景验证 loading / error / retry。还有模块内存缓存避免重复 await。实现思路是把 requireAsyncModule 包了一层。每个分包对外暴露的入口都在 moduleRegistry 里登记，键是字符串路径，值是一个返回 Promise<模块对象> 的函数。我们再写一个泛型函数 loadModule<K extends keyof Registry>，它的返回类型从 Registry[K] 里推断出来。调用方写 const mod = await loadModule('square/feed-card') 时，mod 的方法和字段都是带类型的。我们还在 ESLint 里加了一条规则，禁止业务代码直接调原始 requireAsyncModule，必须走 loadModule，这样保证类型不会被绕过。还有一处细节是 loading 态：loadModule 内部统一处理超时和重试，业务侧不用每次写 try/catch。这一层抽象上线后大约半年内基本没有再因为懒加载导致的运行时报错或者类型缺失反馈。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 微信官方文档 - 分包异步化 requireAsync (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
  - [ ] TypeScript Handbook - Mapped Types (https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- 🛠️ 动手
  - [ ] 自己实现一个 10 行版 requireAsyncModule：带类型签名 + 缓存 + 超时。
- ⚠️ 常见踩坑
  - path 写死在调用点，路径改名时大范围改动。
  - 忘了缓存 Promise，同一模块被重复 requireAsync。
- 🤔 自测题（合上文档自答）
  - [ ] 没有 moduleRegistry 直接用 any 调用会出什么问题？
  - [ ] requireAsyncModule 怎么兼容 worker 端？
- ⏱️ 预估学习时长：**half a day**

#### 追问（面试官深挖向）

- ⚖️ **如果 moduleRegistry 条目膨胀到几百项，怎么维护？**（architecture）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/utils/requireAsync.ts`
- `miniprogram/utils/moduleRegistry.ts`
- `miniprogram/utils/workerUtils.ts`
- `miniprogram/pkg-pb`
- `miniprogram/pkg-worker`

---

### Q3. CDN 图片的工程化链路是怎么设计的？本地 cdn-img、cdn-go 与 Orange-CI 如何配合？

> 来源：`tp-09` · scope: frontend · 难度: 初级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| CDN / 对象存储工程化上传与路径替换模式 | 必须掌握 | 前端资产工程化的通用套路。 |
| CI / CD 流水线钩子与产物替换 | 加分项 | 加分项，体现对发布链路的完整感知。 |

#### 三档回答

**🟢 一句话**：本地写 cdn-img，CI 发布时走 cdn-go 上传并把 utils/cdn.ts 路径替换到线上 URL。

**🔵 标准**（默认）：

图片资产不进主包、统一放在 miniprogram/cdn-img。utils/cdn.ts 把逻辑路径拼成 dev 本地或 prod 线上地址。Orange-CI 在发布阶段调用 cdn-go 上传资产到腾讯 CDN，并根据 cdn-changes.txt 或构建产物把线上地址写回业务代码。效果是：主包不吃图片体积，新图只要放进 cdn-img，CI 自动处理上传与路径替换。cdn-img 维护本地映射表，cdn-go 把表里的 key 翻成线上 URL，Orange-CI 在构建后把变化的图片自动推到 CDN。

<details><summary>🔴 深挖（点击展开）</summary>

这套链路解决两个问题：图片体积不能挤占主包、前端不想手动管 CDN URL。我们切三层职责：资产源层 miniprogram/cdn-img 是 Git 管理的单一源；消费层 utils/cdn.ts 暴露函数把 'xx/xx.png' 拼成 URL，dev 输出本地路径、prod 输出 cdn-go 上线路径；流水线层 Orange-CI 在发布分支触发 cdn-go 脚本，扫 cdn-changes.txt 或构建产物里的新增 / 变更图片，统一上传 CDN 拿真实 URL，再由 script/robot.config.js 的 post-build 步骤替换线上产物。日常开发只接触 cdn-img + utils/cdn.ts，不用写裸 https URL，发布也不会漏传或版本错配，CI 做增量对比即可支持灰度 / 回滚。整条链路是这样运行的。开发期图片放在 src/assets/cdn-img 目录下，每张图都有一个稳定 key。代码里不直接写 URL，而是写 cdnGo('icon/feed-like') 这样的调用，运行时 cdn-go 从一份 JSON 映射表里查到对应 CDN 域名加哈希文件名。构建期 Orange-CI 流水线扫描这个目录，把新增或修改过的图片推到 CDN，同时更新映射表 JSON。这样做的好处是图片不进小程序包体、有版本哈希不会撞缓存、回滚只要回滚映射表。出问题最多的一次是有人手动改了映射表导致线上 404，所以我们后来加了 CI 校验：映射表必须由脚本生成，手工 commit 会被挡。另外这套链路上线后，主包里基本没有静态图片资产了，体积空间又腾出几十 KB 给业务代码使用。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 微信官方文档 - image 组件 (https://developers.weixin.qq.com/miniprogram/dev/component/image.html)
- 🛠️ 动手
  - [ ] 为 demo 写 cdn.ts 支持 dev/prod 切换并模拟 CI 替换。
- ⚠️ 常见踩坑
  - 忘了把大图走 CDN 悄悄把主包撑爆。
  - CI 替换未覆盖 WXSS background-image。
- 🤔 自测题（合上文档自答）
  - [ ] 如果 CDN 临时不可用，页面应该怎么兜底？
- ⏱️ 预估学习时长：**2 hours**


#### Evidence

- `miniprogram/cdn-img`
- `miniprogram/utils/cdn.ts`
- `cdn-changes.txt`
- `script/robot.config.js`

---

## 🧩 功能（feature）— 2 题

### Q1. 邮箱登录这个功能你怎么从 0 到 1 做下来的？有哪些值得说的 CR 沉淀？

> 来源：`tp-10` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 登录 / 验证码类表单的状态机设计 | 必须掌握 | 避免各种竞态和重复提交。 |
| mock → 真接口的渐进式联调方法 | 必须掌握 | 保证前后端进度解耦。 |
| CR followups 作为团队知识资产沉淀 | 加分项 | 加分项，体现对团队成长的贡献。 |

#### 三档回答

**🟢 一句话**：先写设计文档定字段 / 态 / 兜底 → mock 调通交互 → 接真接口 + 图灵盾 → 多轮 CR 修文案 / 按钮 / 图标 → followups 归档。

**🔵 标准**（默认）：

需求是给 QQ 频道小程序补邮箱登录。我先写了 docs/superpowers/specs/2026-03-17-email-login-design.md：列清字段（邮箱 / 验证码）、状态机（空 / 合法 / 发送中 / 冷却 / 失败）、视觉规范、跨场景兜底（已登录用户、换号、低版本基础库）。然后在 login-panel 里先用 mock 调通验证码倒计时、按钮态、placeholder 样式等交互。mock 通过后接真接口（发验证码 + 登录），同时把图灵盾 triggerCaptcha 串进去。CR 阶段发现几个细节：倒计时 60s 与按钮 disable 没严格同步导致点出多次、placeholder 颜色不符合无障碍对比度、cdn 图标路径写死会被 CI 替换失败。修完后我把这些沉淀到 docs/superpowers/reviews/2026-03-19-email-login-followups.md，作为后续登录类功能的 checklist。

<details><summary>🔴 深挖（点击展开）</summary>

这个需求我当作一次完整的研发闭环在做。设计阶段画了状态机图把字段校验、按钮 disable、倒计时、验证码弹出的时序都穷尽：输入合法 → 点『发送验证码』 → 走 turingSdk triggerCaptcha → 拿 ticket → 调后端发验证码接口 → 60s 冷却 → 期间按钮 disable + 倒计时显示。每种异常（邮箱格式错误、接口失败、图灵盾失败、用户过快连击）都对应一种 UI 反馈。mock 阶段用本地 timeout 模拟接口延迟、故意抛错验证失败态，确保真接口接上时只需要换 URL 不改逻辑。接入真接口后我做了两件安全相关的事：一是图灵盾的 ticket 只送后端不落本地，避免被小程序缓存窃取；二是登录响应里的 session 由 HTTPClient 统一写 cookie，业务不接触。CR 沉淀里最有价值的不是单个修复，而是『登录类功能 onboarding checklist』：1) 输入 → 按钮 disable 的竞态必须用 state machine 管；2) 倒计时需要以后端时间为准而不是 setInterval 累积；3) 图标只能走 utils/cdn.ts；4) 错误文案必须走 HTTPClient 错误对象。整个迭代从设计到灰度上线大约一周半，期间大约 4 轮 CR。另外这次迭代让我对『状态机优先于布尔标记』这件事有了非常直观的感受：邮箱登录里票据未到、按钮 disable、倒计时未结束、错误提示这几个状态用布尔写大概 4 个变量，实际可达组合远不止 4 个，缺一个 transition 就漏；后来改成 state machine 之后排查起来很省心。

</details>

#### 补齐方案

- 📚 必读
  - [ ] XState 官方文档（理解状态机） (https://stately.ai/docs/xstate)
  - [ ] guild_mp docs/superpowers/specs / reviews 目录
- 🛠️ 动手
  - [ ] 自己写一个邮箱 + 验证码登录组件，带完整状态机与 mock 兜底。
- ⚠️ 常见踩坑
  - 倒计时用 setInterval 累计，掉帧 / 熄屏后不准。
  - 按钮 disable 没和请求态联动，用户连点多次。
- 🤔 自测题（合上文档自答）
  - [ ] 为什么倒计时要以服务端时间为准？
- ⏱️ 预估学习时长：**1 day**

#### 追问（面试官深挖向）

- ⚖️ **如果后端把邮箱验证码和短信验证码合流，前端要怎么抽象？**（feature）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/components/login-panel/login-panel.ts`
- `miniprogram/components/login-panel/login-panel.wxml`
- `miniprogram/utils/loginUtil.ts`
- `miniprogram/types/login.ts`
- `docs/superpowers/specs/2026-03-17-email-login-design.md`
- `docs/superpowers/reviews/2026-03-19-email-login-followups.md`

---

### Q2. AI 应用卡片是怎么从点击到跳转的？aiAppApi + ai-app-card + link.ts 的协作是怎样的？

> 来源：`tp-13` · scope: fullstack · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 前端路由分发器的职责分层：数据 / 协议 / 跳转 | 必须掌握 | 让多目的地跳转可扩展。 |
| 一次性 ticket 在业务链路里的防伪作用 | 必须掌握 | AI 场景链接容易被伪造需要额外校验。 |
| 前端向后兼容：未知 type 的 fallback 设计 | 加分项 | 加分项，保证协议演进安全。 |

#### 三档回答

**🟢 一句话**：ai-app-card 渲染卡片，点击时 aiAppApi 拿票据，link.ts 根据协议分发到目标页面或外部链路。

**🔵 标准**（默认）：

AI 应用卡片在帖子 / 评论里以 ai-app-card 组件渲染，服务端返回卡片元数据（标题、描述、图标、action）。点击时业务层调 aiAppApi.ticketExchange 拿一次性票据（proto 为 ticket_exchange），再把票据交给 utils/link.ts 做链路分发：内部路径直接 wx.navigateTo 带上票据，外部或跨场景链路做降级或唤起。feedUtil 负责把 AI 卡片数据与普通帖子内容做统一渲染兼容。整体把『AI 卡片的展示、票据换取、路由分发』三件事解耦开。

<details><summary>🔴 深挖（点击展开）</summary>

这个链路要解决的问题是：AI 生成的内容里嵌入的卡片可能指向很多类型目的地（内部页、其他小程序、外部浏览器等），并且需要票据换取避免链路被伪造。设计上三件事解耦：1) ai-app-card 纯渲染，只关心 UI + 点击回调；2) nt/api/aiAppApi 负责 ticket_exchange proto 的请求，把后端返回的票据 + 跳转目标类型返回给调用方；3) utils/link.ts 作为路由分发中心，接收 { type, target, ticket } 三元组后匹配分发：type === 'pagePath' 走 wx.navigateTo；type === 'miniProgram' 走 wx.navigateToMiniProgram；type === 'webview' 拼 webview url；type === 'external' 降级为复制链接或二维码。proto 文件专门做 ticket_exchange 独立定义，说明这是一块会快速演进的协议，因此走了 pb_just_json 路线（类型安全 + JSON 传输）。演进上我们保留了 fallback action，让未知 type 在老版本上不至于崩，只是静默降级。这种设计让新增 AI 能力只需要加一个 type 和 link 的 case，不用改 card 组件本身，也不用改后端接口形状。做这一块时最让我觉得有价值的是『把变化点最小化』。新的 AI 卡片类型上线时，前端只改两处：一个是 link.ts 里加一个 case 决定路由，一个是 type 枚举里加一条。card 组件本身、feedUtil、票据换取链路都是稳定的。这种设计在 AI 接入加速的那段时间帮我们扛住了几乎每周一次的新卡片接入。最后值得一提的是 link.ts 这种集中分发文件容易长成上千行的怪物，所以我们约定 case 写到 30 个就要拆模块，按业务线把 case handler 切出去，保证主入口可读。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 微信小程序官方文档 - 页面跳转 API (https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)
- 🛠️ 动手
  - [ ] 写一个 mini 路由分发器，支持 4 种 type 并自带 fallback。
- ⚠️ 常见踩坑
  - 在 card 组件里硬编码跳转逻辑，扩展时全组件改。
  - 未知 type 不处理，低版本直接抛错白屏。
- 🤔 自测题（合上文档自答）
  - [ ] 票据如果泄露会怎样？怎么限制副作用？
- ⏱️ 预估学习时长：**half a day**

#### 追问（面试官深挖向）

- ⚖️ **如果未来卡片要支持多模态（图 / 视频 / 3D），协议和组件分层要怎么升级？**（feature）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/nt/api/aiAppApi.ts`
- `miniprogram/pages-feed/components/ai-app-card/ai-app-card.ts`
- `miniprogram/utils/link.ts`
- `miniprogram/utils/feedUtil.ts`
- `proto/pb/pb_just_json/group_pro/feed_ai_app/ticket_exchange.proto`

---

## ⚡ 性能（performance）— 3 题

### Q1. Feed 列表到详情页的首屏加速是怎么做的？prefetchManager 的触发时机和数据流是怎样的？

> 来源：`tp-03` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 意图信号（touchstart / hover）驱动的预取时序 | 必须掌握 | 决定预取能否真领先真实跳转。 |
| mini-stores 数据流与 miniprogram-computed 脏检查 | 必须掌握 | 预数据要通过 store 推到视图，避免反复 setData。 |
| 请求并发 / TTL / 去重缓存策略 | 加分项 | 加分项，极端场景鲁棒性。 |

#### 三档回答

**🟢 一句话**：点击意图触发 prefetchManager 提前拉详情接口，结果写 PreDataStore，详情页打开直接消费。

**🔵 标准**（默认）：

Feed 列表帖子项绑定 hover / touchstart 信号，触发 utils/prefetch/prefetchManager 调详情接口，结果经轻度归一写入 FeedPrefetchStore 和 PreDataStore / FeedDetailPreDataStore。详情页启动时优先从 Store 查预数据：命中则立刻 setData 首屏骨架填充并同时发真实请求补全；未命中则走正常请求。正常网络下详情页几乎瞬开，同时保留未命中体验。用户在 Feed 上 touchstart 时就开始预拉详情数据，存到 PreDataStore，跳转后页面直接读缓存。

<details><summary>🔴 深挖（点击展开）</summary>

Feed → 详情链路拆成四段：触发、取数、缓存、消费。触发阶段不用 tap（跳转几乎同时发生收益低），改用 touchstart / hover 作为意图信号，留 100–300ms 让请求先跑。取数阶段 prefetchManager 内置并发限制（避免快速滑动时几十个请求一起打）、TTL（过期数据丢弃）、去重（同一 postId 短时间内只取一次）。缓存层 PreDataStore 是 mini-stores 的一个 store，详情页懒加载时通过 requireAsyncModule 拿到 FeedDetailStore 再 merge 预数据。消费端首屏用预数据生成骨架并发起真实请求补全评论、预加载图片；命中时 diff 合并，失败走正常请求。miniprogram-computed 保证 store 变更不引发冗余渲染。上线后通过 Aegis 自定义耗时打点看到详情首屏明显收敛，同时把『上下文菜单与 Feed 详情数据不一致』的历史 bug 通过统一数据源顺手收敛。prefetchManager 的触发分两级。第一级是滚动可视区命中：IntersectionObserver 检测到 Feed 卡片进入视口并停留超过 200ms 时，把卡片对应的详情 id 加入 idle 队列，在 wx.nextTick 里取最高优先级的 1 个拉数据。第二级是用户意图命中：用户在卡片上 touchstart 时立刻发请求，不进队列。请求返回写入 PreDataStore，键就是详情 id，带一个 60 秒 TTL。详情页 onLoad 时先查 PreDataStore，命中直接渲染，缺数据再走正常接口。我们专门把这层抽出来是因为之前页面里到处写 wx.request，没法控制并发也没法限速，prefetchManager 出来之后并发数有上限、有失败重试退避，整条链路就稳定了。

</details>

#### 补齐方案

- 📚 必读
  - [ ] mini-stores 仓库 README (https://github.com/Tencent/mini-stores)
  - [ ] Web Prefetch 相关 MDN 文档 (https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)
- 🛠️ 动手
  - [ ] demo 里实现 touchstart 预取并用 DevTools 网络面板量化首屏时间。
- ⚠️ 常见踩坑
  - tap 时才触发预取，几乎没有收益。
  - 预取与真实数据未 diff 合并导致闪烁。
- 🤔 自测题（合上文档自答）
  - [ ] 预取失败时如何不阻塞真实请求？
  - [ ] 怎么量化预取的收益？
- ⏱️ 预估学习时长：**1 day**

#### 追问（面试官深挖向）

- ⚖️ **弱网下滑列表时，预取会不会反而拖慢真实请求？**（performance）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/utils/prefetch/prefetchManager.ts`
- `miniprogram/store/FeedPrefetchStore.ts`
- `miniprogram/store/PreDataStore.ts`
- `miniprogram/store/FeedDetailPreDataStore.ts`

---

### Q2. miniprogram-computed 相比手写 setData 解决了什么问题？你们为什么要沉淀 computed 数据规则？

> 来源：`tp-04` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| setData 的性能模型与 Native Bridge 成本 | 必须掌握 | 所有渲染优化的起点。 |
| 响应式派生：Vue / MobX computed 的脏检查机制 | 必须掌握 | 理解 miniprogram-computed 的行为边界。 |
| list 的引用稳定性与 shallow compare | 加分项 | 加分项，决定大列表是否真省渲染。 |

#### 三档回答

**🟢 一句话**：用 computed 从 store 派生视图数据，避免手写 setData 组合导致的抖动与数据不一致。

**🔵 标准**（默认）：

小程序每次 setData 都会触发一次 diff + 渲染层同步，手写组合一旦忘合并就会多次打小数据到渲染层。miniprogram-computed 让我们以 store 为源声明派生字段，框架脏检查后只在派生值真的变了才 setData，天然避免抖动与不一致。我们曾发现上下文菜单和 Feed 详情对同一条帖子点赞态不一致的 bug，就是两处独立算状态。我们把两处都迁到 computed，并沉淀 miniprogram-computed-data-rules（避免副作用、避免环依赖等）。

<details><summary>🔴 深挖（点击展开）</summary>

小程序性能核心痛点是 setData 昂贵：数据从逻辑层经 Native Bridge 过渲染层，每一次都是开销。手写派生的翻车：同一派生值在多处独立算（上下文菜单 vs Feed 详情的点赞态）；一次 store 更新走多条 setData 路径；视图数据塞进 store 让所有订阅者跟着刷新。我们用 miniprogram-computed + mini-stores：store 只放原始模型（postEntity、likeStatusMap），视图派生值一律 computed 声明，computed 纯函数、不写副作用、不调接口。框架脏检查让等值时不 setData，配合不可变更新风格，渲染次数明显下降。规则要点：1) computed 必须纯；2) 同一派生值不在两处 compute，应挂到公共 store；3) 谨慎依赖 this.data 里的非 computed 字段避免循环；4) list 类 computed 控制结果引用稳定性避免整列重渲染；5) 不要把异步结果直接写进 computed 依赖，应先写 store 再派生。规则文件后来成为新人入职前置阅读和 CR checklist，这类 bug 复发率明显下降。我自己最直观的感受是，没 computed 之前 setData 的调用栈完全是手抖出来的：哪里数据变了哪里就要补 setData，漏了就脏；上了 miniprogram-computed 之后业务文件里基本看不到 setData，只有 store 写和派生函数声明，心智一下子轻了。性能上原本 Feed 列表点赞会触发整列 setData，迁到 computed 之后只有那一行被脏检查覆盖到，长列表滑动手感差别很明显。

</details>

#### 补齐方案

- 📚 必读
  - [ ] miniprogram-computed 官方 README (https://github.com/wechat-miniprogram/computed)
  - [ ] guild_mp .codebuddy/rules/miniprogram-computed-data-rules.mdc
- 🛠️ 动手
  - [ ] 对比纯 setData 与 computed 在频繁更新下的 setData 次数。
- ⚠️ 常见踩坑
  - 在 computed 里发请求或写 this.setData。
  - list computed 每次返回新引用导致整列重渲染。
- 🤔 自测题（合上文档自答）
  - [ ] computed 依赖异步数据时怎么处理？
  - [ ] computed 与 observer 有什么区别？
- ⏱️ 预估学习时长：**half a day**

#### 追问（面试官深挖向）

- ⚖️ **如果 computed 依赖链很深性能还 OK 吗？**（performance）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/store/GuildFeedStore.ts`
- `miniprogram/pages-feed/store/FeedDetailStore.ts`
- `miniprogram/behaviors/contextMenuEmitterInitBehavior.ts`
- `.codebuddy/rules/miniprogram-computed-data-rules.mdc`

---

### Q3. 讨论组 AIO 是怎么做长列表与消息轮询的？skyline 版本的虚拟列表有什么不同？

> 来源：`tp-11` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 虚拟列表的可视窗口、回收与定高 / 变高测量 | 必须掌握 | 任何长列表性能讨论的核心。 |
| skyline vs WebView 渲染器的差异 | 必须掌握 | 决定是否启用 skyline 与回退策略。 |
| IM 消息乐观更新、id 映射与失败重试 | 加分项 | 加分项，用户可感知体验。 |

#### 三档回答

**🟢 一句话**：SendMsgHelper 管发送，guildMsgPollingService 管轮询，virtual-list / virtual-list-skyline 分别兜 WebView 和 skyline 渲染。

**🔵 标准**（默认）：

AIO 消息流拆成三块：发送走 SendMsgHelper，负责乐观更新、失败重试、本地状态；接收走 guildMsgPollingService 的轮询 + localReadMsgSeqCache 记录已读 seq；渲染走两套虚拟列表，virtual-list 是 WebView 版，virtual-list-skyline 走 skyline 渲染器。skyline 跳过 WebView 渲染成本更低、滑动更顺，但 API 限制多，所以仅在支持设备上启用，不支持时回退 WebView 版。底层数据源是一份 PullStore，由 SendMsgHelper 通过事件 emit 进来，列表组件订阅即可。数据源解耦让两套渲染路径不会互相影响。

<details><summary>🔴 深挖（点击展开）</summary>

IM 长列表核心挑战：消息持续增长、滚动高频、状态复杂（未读 / 已读 / 发送中 / 失败）。设计思路是『职责单一 + 双渲染器』。发送层 SendMsgHelper 包乐观更新：点发送立刻插 pending 消息，本地 id 与服务端 id 映射，成功原地替换，失败切 UI 态支持重发。接收层 guildMsgPollingService 长轮询 + 退避：稳定期周期轮询，活跃期缩短间隔；localReadMsgSeqCache 本地持久化已读 seq，避免重进群时全部当未读。渲染层两套虚拟列表共用『可视窗口 + 定高 / 变高测量』抽象：virtual-list 在 WebView 渲染器里用 recycle-view 思路回收 DOM；virtual-list-skyline 借 skyline 原生渲染绕过 WebView diff，滑动帧率稳，但 WXML 子集受限，所以 component 层做 capability 检测决定走哪套。SendMsgHelper 与两套虚拟列表通过事件（eventemitter3 / 内部 emitter）解耦，发送侧只负责塞数据源，视图层自行决定怎么渲染，切换渲染器不动业务。实际遇到的坑也讲一下。skyline 版本最大的限制是支持的 WXML 子集偏小，富文本卡片渲染要回退到 WebView 路径，所以我们在每个消息组件上都做了一个 capability 标记，标记走哪条渲染路径。第二个是滚动定位：用户切前后台回来要回到上次未读位置，两套虚拟列表都需要把 anchor seq 持久化，skyline 因为本身 scroll API 不同，做法上是用 scroll-into-view 加偏移修正。第三个是消息撤回的视觉延迟：撤回事件先到 PullStore，标记 deleted 后由虚拟列表自己决定怎么过渡，避免直接抖动。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 微信官方文档 - skyline 渲染引擎 (https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
  - [ ] recycle-view / virtual-list 开源实现 (https://github.com/wechat-miniprogram/recycle-view)
- 🛠️ 动手
  - [ ] 实现一个能跑 5000 条消息的 virtual-list 并测帧率。
- ⚠️ 常见踩坑
  - skyline 里用 WebView 专属语法导致白屏。
  - 乐观更新没做 id 替换导致消息重复。
- 🤔 自测题（合上文档自答）
  - [ ] polling 落后于用户输入怎么避免错序？
  - [ ] 未读 seq 多端登录怎么同步？
- ⏱️ 预估学习时长：**1–2 days**

#### 追问（面试官深挖向）

- ⚖️ **skyline 不可用时降级切换是在运行时还是构建期决定？**（performance）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/pages-chatroom/nt/service/SendMsgHelper.ts`
- `miniprogram/pages-chatroom/nt/service/guildMsgPollingService.ts`
- `miniprogram/pages-chatroom/nt/service/localReadMsgSeqCache.ts`
- `miniprogram/pages-chatroom/text/components/virtual-list`
- `miniprogram/pages-chatroom/text/components/virtual-list-skyline`

---

## 🛡️ 可靠性（reliability）— 2 题

### Q1. HTTPClient 统一封装在 guild_mp 里承担了哪些职责？如何处理后端错误兜底与多环境切换？

> 来源：`tp-06` · scope: frontend · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| HTTP 请求封装的经典分层：拦截器 / 适配器 / 错误分发 | 必须掌握 | 所有网络层的基础。 |
| statusCode vs 业务 code 的错误分层 | 必须掌握 | 决定业务层的错误处理体验。 |
| 幂等性与重试 / 退避策略 | 加分项 | 加分项，避免重试带来重复写入。 |

#### 三档回答

**🟢 一句话**：一个 request 入口统一注入 Cookie / 签名、按环境拼 host、按 code 分发错误并吐出统一 Promise。

**🔵 标准**（默认）：

utils/httpClient/index.ts 对外只暴露 request 入口，内部串四件事：一是用 cookies.ts 把本地登录态注入请求头，二是根据 env（dev / test / pre / prod）在构建时挑对应 host，三是 urlParams.ts 拼 query，四是拿到响应后按后端返回 code 分发：ok 透传业务数据、登录态失效触发重登、限频 / 风控抛可识别错误让业务决定 toast 或重试。业务层只写 api.getFeed(params).then(data => ...)，横切逻辑完全下沉。实现层就一个 httpClient 模块，对外暴露 get/post，对内是流水线式的拦截器。

<details><summary>🔴 深挖（点击展开）</summary>

网络层可靠性要同时满足几件事：登录态、环境切换、错误兜底、可观测性、可重入。我们让 HTTPClient 单一入口承担：登录态注入由 cookies.ts 把本地 cookie 拼到 header，避免每个接口重复写；多环境切换走 build 阶段注入而非运行时判断，避免误打线上；错误处理引入 statusCode + backendCode 双层判断，statusCode 非 2xx 直接抛网络错误并打点，2xx 再看 backendCode：0 / 200 成功、登录失效（如 -2001）触发 reLogin 流程、风控 / 限频（如 4xxxxx 系列）抛 BizError 让业务决定 toast 或降级、其他未识别 code 抛 UnknownError 同时上报 Aegis 以便发现新错误码。可观测性上每次请求会打一条自定义耗时日志并在异常时上报 Aegis；可重入上对幂等接口内置有限重试与退避，非幂等（发帖）只拉起一次。最后还沉淀了错误文案规范，让 UI 不用散见地拼接错误描述，直接从 HTTPClient 产出的错误对象取。举一个我自己处理过的真实例子：邮箱登录上线那一周，发现一个偶发 401。如果按老代码，每个调用点都要自己判 code 重登。我直接在 HTTPClient 的响应拦截器里加了一段逻辑：识别到登录态失效错误码就广播一次 logout 事件，AppStore 统一处理 token 清理与跳转。这样所有业务点的 401 都被一处拦下，业务代码没有任何变化。这种集中处理在小程序里特别重要，因为页面栈和异步链路很容易让分散的 try/catch 漏处理。

</details>

#### 补齐方案

- 📚 必读
  - [ ] axios / wx.request 的拦截器设计 (https://axios-http.com/docs/interceptors)
  - [ ] guild_mp utils/httpClient 源码
- 🛠️ 动手
  - [ ] 实现一个 mini-axios：支持 interceptor + 统一错误分发。
- ⚠️ 常见踩坑
  - 不区分网络错误与业务错误，toast 显示『请求失败』被用户误解。
  - 对非幂等接口做自动重试导致脏写。
- 🤔 自测题（合上文档自答）
  - [ ] 登录态失效时应由 HTTPClient 直接弹登录还是抛错给业务？
  - [ ] 怎么防止同一接口在 token 刷新时雪崩？
- ⏱️ 预估学习时长：**1 day**

#### 追问（面试官深挖向）

- ⚖️ **是否考虑把 HTTPClient 改造成带请求合并 / 去重的更上层 query 框架？**（reliability）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/utils/httpClient/index.ts`
- `miniprogram/utils/httpClient/cookies.ts`
- `miniprogram/utils/httpClient/urlParams.ts`

---

### Q2. 评论 / 点赞被后端限频时前端是怎么兜底的？这次 reliability 复盘得到了什么？

> 来源：`tp-12` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 乐观更新的回滚与一致性保证 | 必须掌握 | 是决定乐观更新成败的关键。 |
| 错误码枚举集中管理的工程价值 | 必须掌握 | 避免相同坑在不同业务重现。 |
| 限频 / 冷却的 UI 反馈模式 | 加分项 | 加分项。 |

#### 三档回答

**🟢 一句话**：拿到限频 code 后立刻撤销乐观更新 + toast 提示，并记录到 FeedCommentStore 的本地状态避免重复触发。

**🔵 标准**（默认）：

以前评论 / 回复点赞时我们先乐观更新 UI，再发请求。后端限频后返回专门 code，但前端漏处理导致 UI 一直是点赞态却并没入库。复盘后在 comment-item / reply-item 的点赞回调里：拿到限频 code 立刻 revert 点赞态，toast『操作太频繁，请稍后再试』，并在 FeedCommentStore 里记一个短时冷却窗口，期间同一评论的点赞按钮保持 disable。后端 code 枚举也补齐到网络层，避免后续其他接口再踩同样的坑。

<details><summary>🔴 深挖（点击展开）</summary>

这个 bug 教了我们几条 reliability 经验。第一，乐观更新必须配成对的回滚：任何触发乐观更新的地方都要处理成功 / 失败 / 限频 / 未知四种分支，而不是只写成功。第二，错误码必须在网络层枚举而不是散落在每个业务里，不然一个新业务接口出现限频时同样会忘处理。第三，限频要有 UI 冷却窗口：直接 toast 用户还会继续狂点，最好把按钮 disable 到后端冷却结束。第四，复盘要留产物：我们把这次的修复回顾了一遍 commit，沉淀了『optimistic action checklist』放到 docs/superpowers/reviews 下一份备忘录（包含 must-handle 的错误码列表、UI 冷却规范、单测建议），让新的乐观更新点上线前能对着 checklist 自查。上线后该场景的 UI / 数据不一致类问题回归明显下降。这次复盘对我个人最大的收获是：所有乐观更新的设计上线前都要明确『失败回滚谁负责』。早期我倾向把回滚塞在请求 catch 里，看着干净但容易漏；后来我们统一让 store 暴露 revert 方法，UI 只发 intent。其次是限频错误码这种东西必须列在网络层的枚举里，散在业务文件里就一定会漏。这两个习惯一直沿用到后面的功能。现在新功能上线前的 CR 里只要看到乐观更新，第一件事就是问 revert 怎么走，这条已经成了团队共识。

</details>

#### 补齐方案

- 📚 必读
  - [ ] React Query optimistic update 文档 (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- 🛠️ 动手
  - [ ] 给 demo 加乐观点赞并故意让后端返回限频，验证回滚 + 冷却。
- ⚠️ 常见踩坑
  - 乐观更新只写成功分支。
  - 只 toast 不 disable 按钮，用户继续狂点。
- 🤔 自测题（合上文档自答）
  - [ ] 限频是用服务端 code 还是客户端计数判断？
- ⏱️ 预估学习时长：**3 hours**


#### Evidence

- `miniprogram/pages-feed/components/comments/comment-item/comment-item.ts`
- `miniprogram/pages-feed/components/comments/reply-item/reply-item.ts`
- `miniprogram/pages-feed/store/FeedCommentStore.ts`

---

## 📈 可观测性（observability）— 1 题

### Q1. guild_mp 的线上监控是怎么做的？sourcemap 是如何和 Aegis 联动的？

> 来源：`tp-08` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| JS 异常捕获：window.onerror / unhandledrejection / 小程序 App.onError | 必须掌握 | 前端监控的基础入口。 |
| sourcemap 的安全与构建 / 上传流程 | 必须掌握 | 决定异常栈能否映射回源码。 |
| 核心指标定义：FCP / 自定义业务指标 | 加分项 | 加分项，说明观测性落地。 |

#### 三档回答

**🟢 一句话**：用伽利略 Aegis (@tencent/aegis-mp-sdk-v2) 做错误 / 性能上报，发布流水线自动把 sourcemap 上传，异常栈能直接定位源码。

**🔵 标准**（默认）：

utils/log 里初始化 Aegis（项目 id、用户标识、环境 tag），统一接管 console.error / Promise rejection / onError。业务侧调 logger.error / logger.perf 打点，Aegis 自动收集 JS 异常、自定义上报、接口耗时。发布分支的 Orange-CI 流水线在出包后调 Aegis 上传接口把 sourcemap 推上去，线上看异常时控制台会直接显示 miniprogram/xxx/yyy.ts 而不是 build 后的 dist。整体的好处是排查线上异常的速度从分钟级别降到秒级，能直接看到源码行号、调用栈和上下文用户行为；坏处是流水线步骤多了一层，需要 review 出包脚本时不要漏掉这一步。

<details><summary>🔴 深挖（点击展开）</summary>

观测性的三个层次：JS 异常、业务埋点、性能指标。JS 异常由 Aegis SDK 自动挂 global error / Promise rejection，所有错误先走 utils/log 的 logger.error，再走 Aegis.report；业务埋点是 logger.info / logger.warn 提供的方法加自定义 key，比如预取命中率、登录成功率；性能指标通过 logger.perf 打自定义耗时，配合 Aegis 自带的网络 / 首屏指标。关键工程化在 sourcemap 链路：构建产物开启 sourcemap 但不随包上传（保护代码），发布流水线在 script/robot.config.js 里执行 post-build 调 Aegis 上传 API 把 sourcemap 以 version 为 key 推到伽利略后端；线上报错带 version + 栈帧，Aegis 后端自动映射源码行号。风险点：1) sourcemap 别漏传，上线 checklist 里一条；2) sourcemap 千万别随包上传（安全）；3) 用户标识要在登录后再绑定，避免匿名期异常挂错用户。结果是线上异常定位速度大幅提升，能直接看到仓库里对应的源码行，CR 时也有数据支撑取舍。另外我们对 Aegis 的使用是分级的，不是把所有日志都丢上去。线上常用的几条习惯：1) 接口耗时只采样上报，避免高频接口占满配额；2) JS 异常全量上报，但加上来源页面、用户等级做聚合；3) 业务自定义事件单独走 logger.biz，方便和异常区分查询。这一层用法约定也是踩过坑：早期不分级时 Aegis 控制台被高频日志淹没，关键异常被埋掉。

</details>

#### 补齐方案

- 📚 必读
  - [ ] Tencent Aegis 官网 / 接入文档 (https://aegis.qq.com/)
  - [ ] MDN - Source map (https://developer.mozilla.org/en-US/docs/Glossary/Source_map)
- 🛠️ 动手
  - [ ] 在 demo 里接一个监控 SDK，构造错误并验证源码映射。
- ⚠️ 常见踩坑
  - sourcemap 跟包一起上线。
  - 用户 id 匿名态绑定导致串号。
- 🤔 自测题（合上文档自答）
  - [ ] 线上只看到 aa.js:1 这种乱码栈时，怎么排查？
- ⏱️ 预估学习时长：**half a day**

#### 追问（面试官深挖向）

- ⚖️ **小程序没有 window，onerror 入口改从哪里接？**（observability）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `miniprogram/utils/log`
- `script/robot.config.js`
- `CLAUDE.md`
- `README.md`

---

## 🔒 安全（security）— 1 题

### Q1. 图灵盾 turingSdk 是怎么接入的？它在登录与关键操作里扮演什么角色？

> 来源：`tp-07` · scope: frontend · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 小程序 Behavior 的注入机制 | 必须掌握 | turingSdkBehavior 能复用到任何组件的前提。 |
| ticket / challenge-response 模式在风控中的作用 | 必须掌握 | 验证码只有一次性 ticket 才有防伪能力。 |
| 前端安全的边界：客户端绝不是最终校验 | 加分项 | 加分项，纠正常见误区。 |

#### 三档回答

**🟢 一句话**：turingSdkBehavior 做 Behavior 注入，登录 / 关键操作前调 turingSdk 拿 ticket，后端用 ticket 校验风控结果。

**🔵 标准**（默认）：

utils/turingSdk 封装图灵盾 SDK 初始化与验证码调用，utils/turingSdkBehavior 作为小程序 Behavior 注入到需要风控的组件里（例如 login-panel），让页面只需 this.triggerCaptcha(action) 就能拿到 ticket。后端拿 ticket + userId + action 去图灵盾做校验，防止脚本批量刷接口（登录、邮箱验证码、发帖等关键路径）。前端只处理 UI 态（验证码弹层、失败提示），安全校验完全由服务端完成。整体协作分工就是前端负责触发与反馈，后端负责真正的风控判定。

<details><summary>🔴 深挖（点击展开）</summary>

风控接入要解决两个问题：在关键路径识别机器脚本、不增加正常用户操作负担。方案是前端触发 + 服务端校验的 ticket 模式。前端侧 utils/turingSdk 管 SDK 生命周期（懒加载、单例、回调清理），utils/turingSdkBehavior 把 triggerCaptcha 方法挂到组件，统一封装『展示验证码 → 拿到 ticket → 返回给调用方』的闭环。关键动作（登录、发送邮箱验证码、发帖 / 评论等）在发请求前先走一遍 triggerCaptcha，拿到 ticket 随请求一起送到后端；后端在图灵盾侧以 ticket + userId + action 做风险判定，返回 pass / block / secondary_verify，前端根据结果展示不同反馈。为了不打扰正常用户，图灵盾有无感验证 / 滑块 / 短信 几级策略，只有风险分升高时才升级到强验证。另外 Behavior 还做了幂等保护：短时间内同一 action 已有未完成 triggerCaptcha 时不会重复弹层，避免误触导致双重请求。安全性核心是 ticket 一次一用、服务端校验，不会让前端绕过。我自己接入邮箱登录的图灵盾流程时踩过两个点。第一是 ticket 不能复用：早期我把 ticket 缓存了 30 秒想减少弹层，被 review 时打回，因为 ticket 一旦复用就有重放风险，正确做法是每次关键动作都触发一次验证。第二是失败态：用户没过验证不能弹 toast 完事，要把 action 重置回未触发状态，否则下次点击会发现按钮 disable 没解开。这两条后来写进了登录功能 checklist。

</details>

#### 补齐方案

- 📚 必读
  - [ ] 腾讯防水墙 / 图灵盾官方文档（需内部权限）
  - [ ] OWASP Automated Threats to Web Applications (https://owasp.org/www-project-automated-threats-to-web-applications/)
- 🛠️ 动手
  - [ ] 给 demo 接入一个开源 captcha SDK，走一遍『前端拿 ticket → 后端验证 → 接口放行』全流程。
- ⚠️ 常见踩坑
  - 把风控结果仅在前端校验。
  - 短时间重复弹验证码导致用户烦躁。
- 🤔 自测题（合上文档自答）
  - [ ] ticket 若被复用会怎样？服务端应当怎么防御？
- ⏱️ 预估学习时长：**half a day**


#### Evidence

- `miniprogram/utils/turingSdk`
- `miniprogram/behaviors/turingSdkBehavior.ts`
- `miniprogram/components/login-panel/login-panel.ts`

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. 为什么选 protobuf 仅类型 + pkg-pb 分包的双轨策略？有没有更简单的方案？

> 来源：`tp-05` · scope: fullstack · 难度: 高级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Protocol Buffers：字段规则、wire format、兼容性原则 | 必须掌握 | 讨论 protobuf 选型绕不开。 |
| JSON vs binary 的协议演进风险对比 | 必须掌握 | 决定哪些字段敢用 JSON 传。 |
| 类型生成：.d.ts 挂全局 namespace 的可维护性 | 加分项 | 加分项，影响 DX。 |

#### 三档回答

**🟢 一句话**：纯 JSON 丢类型、全量 protobufjs 撑主包；我们走『仅类型 + 按需编解码分包懒加载』平衡 DX 与体积。

**🔵 标准**（默认）：

方案 A 全用 JSON：简单、体积小，但没类型安全且协议演进容易出错。方案 B 全用 protobufjs：类型安全 + 二进制兼容，但运行时几十 KB + 代码都进主包撑爆。我们选 C：把 proto 分成 pb_just_json（仅取类型、传输走 JSON）和 pb_need_decode（需要二进制编解码）。前者 yarn gen:pb 生成全局 rootProto 命名空间的 .d.ts 让业务零成本消费，后者编解码实现放进 pkg-pb 分包，业务用 requireAsyncModule 懒加载。代价是多维护一层 proto 目录划分和 moduleRegistry 映射，但换来主包不吃 codec 代码、纯 JSON 协议几乎零成本新增。

<details><summary>🔴 深挖（点击展开）</summary>

这是个典型的三方权衡：包体积 vs 类型安全 vs 维护成本。纯 JSON 方案最简单但在协议多、字段多时容易因手工维护出错（尤其是 oneof、enum、嵌套 message）；全量 protobufjs 类型最安全但主包承受不了运行时；我们的双轨是成本在中间、收益最大的选项：1) JSON 协议走『类型外挂』模式，proto 是 SSOT（single source of truth），.d.ts 自动生成挂全局 rootProto 命名空间，业务直接用 rootProto.xxx.IMessage 类型，不引入任何运行时代码；2) 真正需要二进制或跨语言兼容的协议进 pb_need_decode，编译出 ESM 运行时放 pkg-pb 分包；3) moduleRegistry 把 'pkg-pb/xxxPb' 暴露成强类型模块，业务 await requireAsyncModule 一次就拿到 encode/decode。代价是工程同学需要维护『这个协议要不要走二进制』的判断，以及目录切分规则；但换回主包几十 KB + 新协议上线几乎零成本。做选择时我们明确列了几条规则：高频小数据（Feed 点赞、计数）一律 JSON；AI 流式、IM 消息这类高吞吐走二进制；跨端（小程序 / H5 / 客户端）共享协议优先二进制保证一致性。另外这套双轨方案在团队里的接受度也是分阶段建立起来的。最早只有 IM 用了二进制，大家不太敢扩展，后来 AI 流式接入需要更小包体和更稳的解析，我们才把 pkg-pb 抽出来。再后来跨端共享协议变多，规则才正式写进 docs/superpowers/recipes 里。结论是工程上的取舍要分阶段，先用最小代价验证，验证完了再补规则文档。

</details>

#### 补齐方案

- 📚 必读
  - [ ] protobufjs 官方文档 (https://github.com/protobufjs/protobuf.js)
  - [ ] Protocol Buffers Encoding (https://protobuf.dev/programming-guides/encoding/)
- 🛠️ 动手
  - [ ] 用 protoc 生成同一 proto 的 JSON 版本与 binary 版本，量化包体积差异。
- ⚠️ 常见踩坑
  - 把 encode/decode 直接 import 进主包。
  - JSON 传输时字段大小写 / 枚举序列化不一致。
- 🤔 自测题（合上文档自答）
  - [ ] 如果后端想把某个接口从 JSON 切成二进制，前端要怎么改？
- ⏱️ 预估学习时长：**1 day**

#### 追问（面试官深挖向）

- ⚖️ **如果主包还吃紧，会考虑把 rootProto.d.ts 也按需拆吗？**（trade-off）
  > 参考主回答的 deep_dive，围绕该 follow-up 的核心点展开：给出思路、权衡与落地方案。


#### Evidence

- `proto/pb/pb_just_json`
- `proto/pb/pb_need_decode`
- `miniprogram/pkg-pb`
- `proto/typings/pb_just_json.d.ts`

---

