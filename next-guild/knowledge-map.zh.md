# QQ 频道 Hybrid H5 (next-guild) — 知识图谱

> Mode: knowledge

## 📚 知识点全景

本图谱汇总 candidate 输出中的 `knowledge_points`，按掌握等级分组；每个知识点末尾标注关联维度与出处题目（反向索引），便于针对性补齐。


## 🔑 必须掌握（32 项）


### 1. 302 redirect 与回跳参数设计

> 关联维度：🔒 `security`
> 出现于：`q-01`

#### 📖 必读材料

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ 动手练习

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 2. @tencent/checkurl subhost 模式语义

> 关联维度：🔒 `security`
> 出现于：`q-02`

#### 📖 必读材料

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ 动手练习

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 3. Aegis RUM（spa / reportApiSpeed / reportAssetSpeed）

> 关联维度：📈 `observability`
> 出现于：`q-07`

#### 📖 必读材料

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ 动手练习

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 4. BFF 与前端参数透传策略

> 关联维度：🏗️ `architecture`
> 出现于：`q-04`

#### 📖 必读材料

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ 动手练习

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 5. Docker 双 tag 策略 (time + latest)

> 关联维度：🛡️ `reliability`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ 动手练习

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 6. Next.js 15 middleware 生命周期

> 关联维度：🔒 `security`
> 出现于：`q-01`

#### 📖 必读材料

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ 动手练习

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 7. Next.js catch-all API route ([...slug])

> 关联维度：🏗️ `architecture`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ 动手练习

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 8. Next.js reportWebVitals 机制

> 关联维度：📈 `observability`
> 出现于：`q-07`

#### 📖 必读材料

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ 动手练习

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 9. Orange CI YAML 触发器 (tag_push / push / pr)

> 关联维度：🛡️ `reliability`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ 动手练习

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 10. Redux Toolkit slice / configureStore

> 关联维度：⚖️ `trade-off`
> 出现于：`q-10`

#### 📖 必读材料

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ 动手练习

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 11. SSR 并发下的 logger 实例隔离

> 关联维度：📈 `observability`
> 出现于：`q-06`

#### 📖 必读材料

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ 动手练习

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 12. TKE StatefulSetPlus 滚动发布

> 关联维度：🛡️ `reliability`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ 动手练习

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 13. TypeScript 泛型包装异步调用

> 关联维度：📈 `observability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ 动手练习

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 14. W3C trace-context (traceparent)

> 关联维度：📈 `observability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ 动手练习

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 15. WKWebView decidePolicyForNavigationAction 拦截

> 关联维度：🧩 `feature`
> 出现于：`q-08`

#### 📖 必读材料

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ 动手练习

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 16. WVJBCallbacks 队列模型

> 关联维度：🧩 `feature`
> 出现于：`q-08`

#### 📖 必读材料

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ 动手练习

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 17. WebView 环境探测（UA / bridge / feature）

> 关联维度：🏗️ `architecture`
> 出现于：`q-04`

#### 📖 必读材料

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ 动手练习

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 18. axios 实例与拦截器分层

> 关联维度：🏗️ `architecture`
> 出现于：`q-04`

#### 📖 必读材料

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ 动手练习

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 19. httpOnly / SameSite / Secure 三元组

> 关联维度：🔒 `security`
> 出现于：`q-02`

#### 📖 必读材料

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ 动手练习

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 20. iOS/Android 协议枚举差异

> 关联维度：🧩 `feature`
> 出现于：`q-08`

#### 📖 必读材料

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ 动手练习

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 21. log4js appenders / layouts / categories 模型

> 关联维度：📈 `observability`
> 出现于：`q-06`

#### 📖 必读材料

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ 动手练习

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 22. log4js context 与 SSR 请求隔离

> 关联维度：📈 `observability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ 动手练习

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 23. next-redux-wrapper HYDRATE 流程

> 关联维度：⚖️ `trade-off`
> 出现于：`q-10`

#### 📖 必读材料

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ 动手练习

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 24. oidb 协议 cmd + serviceType 模型

> 关联维度：🏗️ `architecture`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ 动手练习

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 25. postcss-px-to-viewport 核心配置

> 关联维度：⚡ `performance`
> 出现于：`q-11`

#### 📖 必读材料

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ 动手练习

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 26. req.cookies API 与 httpOnly/SameSite

> 关联维度：🔒 `security`
> 出现于：`q-01`

#### 📖 必读材料

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ 动手练习

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 27. selectorBlackList / exclude 两层 opt-out

> 关联维度：⚡ `performance`
> 出现于：`q-11`

#### 📖 必读材料

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ 动手练习

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 28. viewportWidth 与设计稿的关系

> 关联维度：⚡ `performance`
> 出现于：`q-11`

#### 📖 必读材料

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ 动手练习

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 29. 大同 universal-report 事件模型

> 关联维度：📈 `observability`
> 出现于：`q-07`

#### 📖 必读材料

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ 动手练习

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 30. 开放重定向 (Open Redirect) 常见变体

> 关联维度：🔒 `security`
> 出现于：`q-02`

#### 📖 必读材料

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ 动手练习

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 31. 状态本地化 vs 全局化决策

> 关联维度：⚖️ `trade-off`
> 出现于：`q-10`

#### 📖 必读材料

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ 动手练习

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 32. 表驱动设计 (table-driven) vs 代码驱动

> 关联维度：🏗️ `architecture`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ 动手练习

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

## ✨ 加分项（9 项）


### 1. @opentelemetry/core RandomIdGenerator / TraceFlags

> 关联维度：📈 `observability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ 动手练习

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 2. @tencent/rpcsdk oidbRequest 入参

> 关联维度：🏗️ `architecture`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ 动手练习

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 3. Clipboard API 兼容 (execCommand copy)

> 关联维度：🧩 `feature`
> 出现于：`q-08`

#### 📖 必读材料

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ 动手练习

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 4. Next.js CSS code-split

> 关联维度：⚡ `performance`
> 出现于：`q-11`

#### 📖 必读材料

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ 动手练习

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 5. UDP fire-and-forget 语义

> 关联维度：📈 `observability`
> 出现于：`q-06`

#### 📖 必读材料

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ 动手练习

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 6. URL 标准解析（WHATWG URL）

> 关联维度：🔒 `security`
> 出现于：`q-02`

#### 📖 必读材料

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ 动手练习

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 7. Zustand / Jotai 对比

> 关联维度：⚖️ `trade-off`
> 出现于：`q-10`

#### 📖 必读材料

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ 动手练习

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 8. git:rebaseCheck / git:changeLog / git:release 内建步骤

> 关联维度：🛡️ `reliability`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ 动手练习

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 9. time-aligned 排障方法论

> 关联维度：📈 `observability`
> 出现于：`q-07`

#### 📖 必读材料

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ 动手练习

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

