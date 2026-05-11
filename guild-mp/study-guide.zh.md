# QQ 频道小程序 (guild_mp) — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：**会写 JS/TS，但没怎么做过微信小程序的同学**
> 目标：跟着做完，覆盖知识图谱里的 25 项必备 + 13 项加分知识点

---

## 0. 怎么使用这份指引

知识图谱里 38 个知识点，其实围绕 **13 道考题（qa-01 ~ qa-13）** 展开，每道题是一个"知识簇"。本指引按**学习顺序**把 13 个簇重新排序，每个簇给你：

1. **它在解决什么真实问题**（一句话场景）
2. **零基础前置**：如果连这一步都不熟，先补什么
3. **必读材料**：每条都给可直接点击的官方/权威外链
4. **动手练习**：从最小可运行 demo 开始
5. **自检清单**：能口头回答=过关

> 推荐节奏：**每个簇 1~2 个晚上**，13 个簇大约 3~4 周。

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：小程序基础 | 1, 2, 3 | 分包、预加载、setData |
| 阶段 B：网络与状态 | 4, 5, 6, 7 | HTTP、拦截器、状态机、乐观更新 |
| 阶段 C：性能与渲染 | 8, 9, 10 | 虚拟列表、skyline、预取、computed |
| 阶段 D：工程与安全 | 11, 12, 13 | Protobuf、CDN、风控、sourcemap |

---

## 阶段 A：小程序基础

### 簇 1（qa-01）：主包/分包体积 + preloadRule

**覆盖知识点**：主包与分包体积规则、preloadRule 语义、分包下载失败兜底
**真实场景**：小程序主包超过 2M 无法上传，怎么拆？用户进首页时后台偷偷把"我的"分包下好。

#### 0-1 零基础前置
- 注册过微信小程序开发者账号，用微信开发者工具跑过"Hello World"。
- 没跑过的话：[微信官方 — 小程序快速开始](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/)。

#### 必读材料
1. [微信官方 — 分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html)
2. [微信官方 — 分包预下载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
3. [微信官方 — 独立分包](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/independent.html)
4. [微信官方 — 分包异步化 requireAsync](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)

#### 动手练习
- 新建一个空小程序，把 pages 拆成 `pages/index`（主包）和 `packageA/pages/list`（分包），`app.json` 配 `subpackages`。
- 给 `preloadRule` 加 `"network": "all"` 和 `"packages": ["packageA"]``，用开发者工具 Network 面板观察分包下载时机。
- 把主包压到 1.5M 以下（删大图片、用外部字体、开启压缩），体验一次上传成功。
- 故意把分包下载 URL 改错，在 `onLoad` 里 catch 分包加载失败并 toast 提示。

#### 自检
- [ ] 能说清主包 2M、整个包 20M 的体积限制。
- [ ] 能解释 `preloadRule` 的 `network` 为 `wifi` 和 `all` 的差异。
- [ ] 知道分包加载失败时 `require` 会抛什么错误，怎么兜底。

---

### 簇 2（qa-02）：requireAsync + TS 泛型映射

**覆盖知识点**：requireAsync API 与加载时序、模块缓存与首次加载失败重试、TS 泛型映射
**真实场景**：分包里有一个很大的图表库，只在用户点"查看统计"时才懒加载，还要带类型提示。

#### 0-1 零基础前置
- 知道 `require()` 和 `import()` 的区别；写过简单的 TypeScript 类型。

#### 必读材料
1. [微信官方 — 分包异步化](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
2. [TypeScript Handbook — Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
3. [TypeScript Handbook — Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
4. [TypeScript Handbook — keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

#### 动手练习
- 自己实现一个 10 行版 `requireAsyncModule<T>(path: string, timeout?: number): Promise<T>`：
  - 内部用 `require.async`（或 `wx.requireAsync`）。
  - 带模块缓存（第二次直接返回缓存）。
  - 超时 reject。
  - 失败重试 1 次。
- 给这个函数写完整 TS 类型签名，让调用方 `const chart = await requireAsyncModule<typeof import('chart-lib')>('chart-lib')` 能拿到类型。

#### 自检
- [ ] 能说出 `require.async` 和 `import()` 在小程序里的兼容性差异。
- [ ] 能用 `keyof` + `mapped types` 把一个对象的所有值转成 `Promise<T>`。
- [ ] 能解释为什么模块缓存要同时存"加载中 Promise"和"已加载结果"。

---

### 簇 3（qa-05）：setData 性能 + computed 脏检查

**覆盖知识点**：setData 性能模型、响应式派生脏检查、list 引用稳定性
**真实场景**：列表页 100 条数据，每条都有"已读/未读"状态，频繁切换时页面卡顿。

#### 0-1 零基础前置
- 写过小程序 `Page({ data: {}, onLoad() {} })`。

#### 必读材料
1. [微信官方 — 性能与体验](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips.html)
2. [miniprogram-computed 官方 README](https://github.com/wechat-miniprogram/computed)
3. [微信官方 — 自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/)

#### 动手练习
- 写一个 100 条数据的列表页，每条带一个 toggle 按钮：
  - 版本 A：直接在 `tap` 里 `this.setData({ list: newList })`（整个数组替换）。
  - 版本 B：只 `setData({ 'list[5].read': true })`（路径更新）。
  - 版本 C：用 `miniprogram-computed`，`readCount` 自动派生。
- 用微信开发者工具 Performance 面板对比三个版本的 setData 次数和耗时。
- 故意让 list 的引用不变但内容变，观察 computed 是否触发 —— 体会"引用稳定性"。

#### 自检
- [ ] 能说出 `setData` 的数据量上限建议（单次 < 1KB，总量 < 256KB）。
- [ ] 能解释 computed 的"脏检查"和 Vue 的响应式系统有什么相似处。
- [ ] 知道为什么 `list.push(item)` 后 `setData({ list })` 可能不触发更新。

---

## 阶段 B：网络与状态

### 簇 4（qa-08）：HTTP 请求分层 + 错误码 + 幂等重试

**覆盖知识点**：HTTP 请求封装分层、statusCode vs 业务 code、幂等性与重试/退避
**真实场景**：后端返回 200 但 body 里 `retcode: -1001`，前端怎么统一处理？用户狂点提交，怎么防重复？

#### 0-1 零基础前置
- 用 `wx.request` 发过一次 GET/POST 请求。

#### 必读材料
1. [Axios 拦截器文档](https://axios-http.com/docs/interceptors)
2. [微信官方 — wx.request](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)
3. [MDN — HTTP 状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
4. [AWS — 幂等性 API 设计](https://docs.aws.amazon.com/zh_cn/whitepapers/latest/building-mission-critical-applications/ensuring-idempotency.html)

#### 动手练习
- 实现一个 `mini-axios`：
  - 支持 `request / response` 拦截器。
  - 统一错误分发：HTTP 错误（status >= 400）走一层，业务错误（retcode != 0）走另一层。
  - POST 请求自动带 `idempotency-key` 头，重试时 key 不变。
  - 指数退避重试：1s → 2s → 4s，最多 3 次。
- 用 mock 服务器（[json-server](https://github.com/typicode/json-server) 或微信 mock）验证：
  - 第一次 500 → 重试成功。
  - 第二次 200 但 retcode 错误 → 走业务错误回调。

#### 自检
- [ ] 能画出"请求 → 拦截器 → 网络 → 响应拦截器 → 错误分发"的链路图。
- [ ] 能解释为什么 `statusCode === 200 && retcode !== 0` 比 `statusCode !== 200` 更常见。
- [ ] 能说出幂等 key 的生成策略（UUID + 用户态 + 接口名）。

---

### 簇 5（qa-12）：mock → 真接口渐进联调 + 状态机 + CR 沉淀

**覆盖知识点**：mock → 真接口渐进联调、登录/验证码表单状态机、CR followups 知识资产
**真实场景**：后端接口还没好，前端要先能跑；验证码倒计时 60 秒，各种边界状态怎么管理？

#### 0-1 零基础前置
- 知道什么是状态机（至少知道"状态 + 事件 → 新状态"）。

#### 必读材料
1. [XState 官方文档](https://stately.ai/docs/xstate)
2. [XState 可视化编辑器](https://stately.ai/editor)
3. [微信官方 — 登录流程](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)

#### 动手练习
- 写一个邮箱 + 验证码登录组件，用状态机管理：
  - 状态：`idle / sending / sent / verifying / success / error`
  - 事件：`SEND_CODE / RESEND / VERIFY / RESET`
  - 用 `useReducer` 或 XState 实现，不要散落 `setTimeout`。
- 在状态机里加 mock 层：
  - `MOCK=true` 时所有 API 走本地 mock 数据。
  - `MOCK=false` 时走真接口，但保留 mock fallback（接口 5 秒没响应就回 mock）。
- 把这次 CR 里的 3 条重要 comment 整理成 `.codebuddy/reviews/qa-12.md`，作为团队知识资产。

#### 自检
- [ ] 能画出登录组件的完整状态转移图。
- [ ] 能说出 mock 联调的 3 个阶段（纯 mock → 混合 → 全真实）。
- [ ] 知道为什么"倒计时 60 秒"不适合用 `useState + setInterval` 零散管理。

---

### 簇 6（qa-11）：乐观更新 + 错误码枚举 + 限频冷却

**覆盖知识点**：乐观更新的回滚与一致性、错误码枚举集中管理、限频/冷却的 UI 反馈
**真实场景**：点赞按钮点了立刻变红，但网络失败时要悄悄变回来；连续点 5 次要提示"操作太频繁"。

#### 0-1 零基础前置
- 知道什么是乐观更新（先改 UI 再发请求）。

#### 必读材料
1. [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
2. [React Query 中文概述](https://cangsdarm.github.io/react-query-web-i18n/)（辅助理解）

#### 动手练习
- 给一个"点赞"按钮加乐观更新：
  - 点击立刻 `setData({ liked: true, count: count + 1 })`。
  - 请求失败时回滚：`setData({ liked: false, count: count - 1 })`。
  - 加冷却：5 秒内重复点击 toast "请稍后再试"。
- 设计一个错误码枚举：
  ```ts
  enum BizCode {
    SUCCESS = 0,
    RATE_LIMIT = 10001,
    NOT_FOUND = 10004,
    // ...
  }
  ```
  所有错误文案集中在一个对象里，不要散落在组件里。

#### 自检
- [ ] 能说出乐观更新的 3 个风险（回滚时用户已离开、并发覆盖、网络抖动）。
- [ ] 能解释为什么错误码要集中管理而不是 `if (code === 10001)` 到处写。
- [ ] 知道"限频"和"防抖/节流"的区别。

---

### 簇 7（qa-13）：路由分发器 + 一次性 ticket + 未知 type fallback

**覆盖知识点**：前端路由分发器职责分层、一次性 ticket 防伪、未知 type 的 fallback
**真实场景**：小程序里收到一个"跳转链接"，可能是内部页、H5、另一个小程序、APP，怎么统一分发？

#### 0-1 零基础前置
- 用过 `wx.navigateTo`、`wx.redirectTo`。

#### 必读材料
1. [微信官方 — 页面跳转 API](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)
2. [微信官方 — 打开 APP](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html)
3. [微信官方 — web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)

#### 动手练习
- 写一个 `navigateDispatcher`：
  ```ts
  type RouteType = 'page' | 'h5' | 'miniprogram' | 'app';
  function dispatch(type: RouteType, payload: unknown): void;
  ```
  - 支持 4 种 type，未知 type 走 fallback（toast "暂不支持"）。
- 给跳转加一次性 ticket：
  - 跳转前向服务端申请 ticket（有效期 30 秒，只能用一次）。
  - 目标页校验 ticket，已用或过期都拒绝。

#### 自检
- [ ] 能说出路由分发器的 3 层职责（数据解析 → 协议选择 → 实际跳转）。
- [ ] 能解释一次性 ticket 为什么能防重放攻击。
- [ ] 知道"未知 type fallback"是向前兼容的关键设计。

---

## 阶段 C：性能与渲染

### 簇 8（qa-06）：skyline vs WebView + 虚拟列表 + IM 消息乐观更新

**覆盖知识点**：skyline vs WebView 渲染器差异、虚拟列表可视窗口与回收、IM 消息乐观更新
**真实场景**：聊天列表 5000 条消息，WebView 里滚动卡顿；换 skyline 后有些 API 不支持，怎么兼容？

#### 0-1 零基础前置
- 知道什么是"列表渲染"和"滚动性能"。

#### 必读材料
1. [微信官方 — Skyline 渲染引擎](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
2. [微信官方 — Skyline 与 WebView 差异](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/difference.html)
3. [recycle-view 开源实现](https://github.com/wechat-miniprogram/recycle-view)
4. [微信官方 — virtual-list](https://developers.weixin.qq.com/miniprogram/dev/component/virtual-list.html)

#### 动手练习
- 实现一个能跑 5000 条消息的 virtual-list：
  - 只渲染可视窗口内的节点（约 15 条）。
  - 滚动时回收复用 DOM 节点。
  - 用微信开发者工具 Performance 测帧率，对比普通 `wx:for`。
- 在 skyline 和 WebView 两种渲染器下分别跑这个列表，记录哪些 API/样式表现不一致。
- 给消息列表加乐观更新：发送消息立刻显示在列表底部（带"发送中"状态），失败时标记为红色可重试。

#### 自检
- [ ] 能说出 skyline 的 3 个优势（更流畅、更少通信、支持 Worklet）和 2 个限制（部分 API 不支持、调试工具差异）。
- [ ] 能解释虚拟列表的"可视窗口 + 缓冲区 + 回收池"模型。
- [ ] 知道 IM 消息乐观更新时"本地 ID"和"服务端 ID"的映射关系。

---

### 簇 9（qa-04）：预取时序 + mini-stores + 请求并发/TTL/去重

**覆盖知识点**：意图信号驱动的预取时序、mini-stores 数据流、请求并发/TTL/去重缓存
**真实场景**：用户手指刚碰到"查看详情"按钮，还没点下去，就开始预加载详情数据。

#### 0-1 零基础前置
- 知道 `touchstart` 事件；了解过状态管理（Redux / Vuex 概念即可）。

#### 必读材料
1. [mini-stores 仓库 README](https://github.com/Tencent/mini-stores)
2. [MDN — Prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)
3. [MDN — Preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)

#### 动手练习
- 在 demo 里实现 `touchstart` 预取：
  - 按钮 `bindtouchstart` 时发预请求，缓存结果 5 秒。
  - 真正 `tap` 时如果缓存命中直接用，不命中再发请求。
- 用 mini-stores 管理一个全局 store：
  - 封装 `fetchWithDedup(url)`：相同 URL 并发请求只发一次，TTL 5 秒。
  - 用开发者工具 Network 面板验证"同时点 3 个按钮只发 1 次请求"。

#### 自检
- [ ] 能解释 `touchstart` 预取和 `tap` 正常加载的时序差异（约 100~300ms）。
- [ ] 能说出请求去重的 3 种策略（in-flight 合并、缓存命中、防抖）。
- [ ] 知道 mini-stores 和 MobX 的响应式模型有什么相似处。

---

### 簇 10（qa-10）：异常监控 + sourcemap + 核心指标

**覆盖知识点**：JS 异常捕获、sourcemap 安全与构建流程、核心指标 FCP / 自定义业务指标
**真实场景**：线上小程序白屏了，怎么知道是哪行代码报错？怎么量化"首屏时间"？

#### 0-1 零基础前置
- 知道 `try/catch`；在 Chrome DevTools 里看过 Source 面板。

#### 必读材料
1. [Tencent Aegis 官网](https://aegis.qq.com/)
2. [MDN — Source map](https://developer.mozilla.org/en-US/docs/Glossary/Source_map)
3. [微信官方 — 性能面板](https://developers.weixin.qq.com/miniprogram/dev/devtools/performance.html)
4. [web.dev — Core Web Vitals](https://web.dev/vitals/)

#### 动手练习
- 在 demo 里接入 Aegis（或任意监控 SDK）：
  - 覆盖 `App.onError`、`window.onerror`（H5 场景）、`unhandledrejection`。
  - 构造一个 `throw new Error('test')`，验证监控平台能看到堆栈。
- 配置 sourcemap 上传：
  - 构建时生成 `.js.map`，CI 上传到 Aegis（或私有服务器）。
  - 生产环境报错后，在监控平台看到原始 TS 代码行号。
- 定义一个自定义业务指标："从用户点击到列表渲染完成的时间"，用 `Date.now()` 差值上报。

#### 自检
- [ ] 能说出小程序里 3 种异常捕获入口（App.onError、Page.onError、try/catch）。
- [ ] 能解释为什么 sourcemap 不能放在公网（暴露源码）。
- [ ] 知道 FCP（First Contentful Paint）和"业务首屏时间"的区别。

---

## 阶段 D：工程与安全

### 簇 11（qa-07）：Protobuf + JSON 协议演进 + 类型生成

**覆盖知识点**：Protocol Buffers 字段规则与 wire format、JSON vs binary 协议演进风险、.d.ts 挂全局 namespace
**真实场景**：前后端通信协议从 JSON 换成 Protobuf，包体积小了 60%，但怎么保证兼容性？

#### 0-1 零基础前置
- 知道什么是序列化/反序列化；写过 `.proto` 文件或至少听说过。

#### 必读材料
1. [protobuf.js 官方文档](https://github.com/protobufjs/protobuf.js)
2. [Protocol Buffers 编码指南](https://protobuf.dev/programming-guides/encoding/)
3. [Protocol Buffers 语言指南](https://protobuf.dev/programming-guides/proto3/)

#### 动手练习
- 定义一个 `.proto`：
  ```protobuf
  message User {
    int32 id = 1;
    string name = 2;
    optional string email = 3;
  }
  ```
- 用 `protoc` 或 `protobufjs` 生成：
  - JSON 版本（`User.toJSON()`）。
  - Binary 版本（`User.encode()`）。
  - 对比两者包体积（binary 通常小 30~60%）。
- 加一个新字段 `phone = 4;`，验证旧客户端解析新数据不会报错（Protobuf 向前兼容）。
- 把生成的 `.d.ts` 挂到全局 namespace，讨论"全局类型 vs 模块类型"的可维护性差异。

#### 自检
- [ ] 能说出 Protobuf 的 3 个字段规则（required / optional / repeated，proto3 里 required 已移除）。
- [ ] 能解释为什么字段编号（field number）不能随意改。
- [ ] 知道"全局 namespace 挂 .d.ts"在大型项目里的维护风险。

---

### 簇 12（qa-03）：CDN 工程化 + CI 产物替换

**覆盖知识点**：CDN/对象存储工程化上传与路径替换、CI/CD 流水线钩子与产物替换
**真实场景**：开发时图片走本地 `assets/`，上线时要自动上传到 CDN 并把路径替换成 `https://cdn.xxx.com/`。

#### 0-1 零基础前置
- 知道什么是 CDN；用过对象存储（COS / OSS / S3）上传文件。

#### 必读材料
1. [微信官方 — image 组件](https://developers.weixin.qq.com/miniprogram/dev/component/image.html)
2. [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
3. [GitHub Actions 入门](https://docs.github.com/zh/actions/learn-github-actions/understanding-github-actions)

#### 动手练习
- 写一个 `cdn.ts` 工具：
  ```ts
  const CDN_BASE = process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com/guild-mp/'
    : '/assets/';
  export const cdnUrl = (path: string) => CDN_BASE + path;
  ```
- 在 CI 流水线（GitHub Actions / Orange CI）里加一步：
  - `npm run build` 后，把 `dist/assets/` 上传到 COS。
  - 用 `sed` 或脚本把 `index.html` 里的 `/assets/` 替换成 CDN 路径。
- 验证：本地 `npm run dev` 走本地路径，CI 构建后走 CDN。

#### 自检
- [ ] 能说出"构建时替换"和"运行时替换"的优缺点。
- [ ] 能解释为什么 CDN 路径要加 hash（缓存刷新）。
- [ ] 知道 CI 流水线里"pre-build / build / post-build"三阶段的职责划分。

---

### 簇 13（qa-09）：风控 + ticket/challenge-response + Behavior 注入 + 前端安全边界

**覆盖知识点**：ticket/challenge-response 模式、小程序 Behavior 注入机制、前端安全边界
**真实场景**：防止机器人刷接口，需要"滑动验证 → 拿 ticket → 后端校验 → 放行"。

#### 0-1 零基础前置
- 知道什么是验证码（captcha）；了解过 OWASP 基础安全概念。

#### 必读材料
1. [OWASP — Automated Threats to Web Applications](https://owasp.org/www-project-automated-threats-to-web-applications/)
2. [微信官方 — Behavior](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html)
3. [腾讯防水墙官网](https://007.qq.com/)（了解概念）

#### 动手练习
- 给 demo 接入一个开源 captcha（如 [SliderCaptcha](https://github.com/ArgoZhang/SliderCaptcha) 或 [Geetest](https://www.geetest.com/)）：
  - 前端：触发验证 → 拿到 ticket。
  - 后端：校验 ticket（只能使用一次，30 秒过期）。
  - 校验通过才放行后续 API。
- 用小程序 Behavior 封装一个"风控校验"通用逻辑：
  - 任何页面需要验证时 `behaviors: [requireRiskCheck]`。
  - Behavior 自动注入验证流程，页面只关心结果回调。
- 构造一个攻击 demo：用脚本连续发 100 次请求，观察无 ticket 时被拒绝、有 ticket 时只能成功一次。

#### 自检
- [ ] 能说出 challenge-response 的 3 步流程（请求挑战 → 完成挑战 → 提交凭证）。
- [ ] 能解释 Behavior 和 Vue mixin 的相似与差异。
- [ ] 知道"前端校验只是 UX，后端校验才是安全"这句话的含义。

---

## 全局自检：13 个一句话问题

1. 小程序主包和分包的大小限制分别是多少？
2. `requireAsync` 和 `import()` 在小程序里有什么区别？
3. `setData` 单次建议不超过多少数据量？
4. 怎么区分 HTTP 错误和业务错误？
5. 状态机相比散落 `setTimeout` 有什么优势？
6. 乐观更新失败时怎么回滚？
7. 路由分发器遇到未知 type 应该怎么做？
8. skyline 和 WebView 的本质区别是什么？
9. `touchstart` 预取比 `tap` 提前多少时间窗口？
10. sourcemap 为什么不能放在公网？
11. Protobuf 字段编号为什么不能改？
12. CI 里"构建时替换 CDN 路径"和"运行时替换"哪个更好？
13. 为什么前端通过了验证，后端还要再验一次 ticket？

---

## 学习效率 Tips

- **微信开发者工具是最佳实验场**：每个练习都可以在里面直接跑，不用配环境。
- **真机预览很重要**：模拟器和真机的性能差异很大，虚拟列表和 skyline 一定要真机测。
- **善用微信官方文档**：小程序生态封闭，官方文档是最权威的参考。
- **从小程序扩展到前端通用知识**：setData 性能 → 虚拟 DOM 原理；拦截器设计 → Axios 源码；状态机 → XState → 通用状态管理。
