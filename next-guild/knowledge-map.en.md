# QQ 频道 Hybrid H5 (next-guild) — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (32 topics)


### 1. 302 redirect 与回跳参数设计

> Related dimensions: 🔒 `security`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ Hands-on

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 2. @tencent/checkurl subhost 模式语义

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ Hands-on

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 3. Aegis RUM（spa / reportApiSpeed / reportAssetSpeed）

> Related dimensions: 📈 `observability`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ Hands-on

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 4. BFF 与前端参数透传策略

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ Hands-on

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 5. Docker 双 tag 策略 (time + latest)

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ Hands-on

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 6. Next.js 15 middleware 生命周期

> Related dimensions: 🔒 `security`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ Hands-on

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 7. Next.js catch-all API route ([...slug])

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ Hands-on

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 8. Next.js reportWebVitals 机制

> Related dimensions: 📈 `observability`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ Hands-on

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 9. Orange CI YAML 触发器 (tag_push / push / pr)

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ Hands-on

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 10. Redux Toolkit slice / configureStore

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ Hands-on

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 11. SSR 并发下的 logger 实例隔离

> Related dimensions: 📈 `observability`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ Hands-on

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 12. TKE StatefulSetPlus 滚动发布

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ Hands-on

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 13. TypeScript 泛型包装异步调用

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ Hands-on

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 14. W3C trace-context (traceparent)

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ Hands-on

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 15. WKWebView decidePolicyForNavigationAction 拦截

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ Hands-on

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 16. WVJBCallbacks 队列模型

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ Hands-on

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 17. WebView 环境探测（UA / bridge / feature）

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ Hands-on

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 18. axios 实例与拦截器分层

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
- [ ] src/utils/os.ts
- [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑

#### 🛠️ Hands-on

- [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
- [ ] 实现一个 feature-detect 版 isInMSDK

---

### 19. httpOnly / SameSite / Secure 三元组

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ Hands-on

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 20. iOS/Android 协议枚举差异

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ Hands-on

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 21. log4js appenders / layouts / categories 模型

> Related dimensions: 📈 `observability`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ Hands-on

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 22. log4js context 与 SSR 请求隔离

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ Hands-on

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 23. next-redux-wrapper HYDRATE 流程

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ Hands-on

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 24. oidb 协议 cmd + serviceType 模型

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ Hands-on

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 25. postcss-px-to-viewport 核心配置

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ Hands-on

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 26. req.cookies API 与 httpOnly/SameSite

> Related dimensions: 🔒 `security`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] middleware.ts 全文
- [ ] pages/api/auth.ts 全文
- [ ] Next.js middleware 官方文档（matcher / request 对象）

#### 🛠️ Hands-on

- [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
- [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行

---

### 27. selectorBlackList / exclude 两层 opt-out

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ Hands-on

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 28. viewportWidth 与设计稿的关系

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ Hands-on

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 29. 大同 universal-report 事件模型

> Related dimensions: 📈 `observability`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ Hands-on

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

### 30. 开放重定向 (Open Redirect) 常见变体

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ Hands-on

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 31. 状态本地化 vs 全局化决策

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ Hands-on

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 32. 表驱动设计 (table-driven) vs 代码驱动

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ Hands-on

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

## ✨ Bonus (9 topics)


### 1. @opentelemetry/core RandomIdGenerator / TraceFlags

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] src/server-side/trpc.ts 全文
- [ ] src/utils/report.ts 中 getTraceParent 实现
- [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例

#### 🛠️ Hands-on

- [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
- [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测

---

### 2. @tencent/rpcsdk oidbRequest 入参

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] pages/api/v2/[...slug].ts 全文
- [ ] src/common/msdkRequest.ts
- [ ] Next.js catch-all & dynamic API route 文档

#### 🛠️ Hands-on

- [ ] 用表驱动重写一个 10+ 接口的 mock BFF
- [ ] 为 x-oidb 覆写加一个 JSON schema 校验

---

### 3. Clipboard API 兼容 (execCommand copy)

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] src/utils/msdk.ts 全文
- [ ] src/utils/os.ts 中 isiOS / isInMSDK
- [ ] MSDK iOS/Android 官方 bridge 接入指南

#### 🛠️ Hands-on

- [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
- [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback

---

### 4. Next.js CSS code-split

> Related dimensions: ⚡ `performance`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] postcss.config.js
- [ ] postcss-px-to-viewport 官方文档
- [ ] GameGuild* 目录下任意一个 .scss

#### 🛠️ Hands-on

- [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
- [ ] 为某个目录配 exclude 并写一个 lint 验证被排除

---

### 5. UDP fire-and-forget 语义

> Related dimensions: 📈 `observability`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] src/utils/logger/index.ts
- [ ] src/utils/logger/atta.ts
- [ ] log4js 官方 layouts 与 context 文档

#### 🛠️ Hands-on

- [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
- [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率

---

### 6. URL 标准解析（WHATWG URL）

> Related dimensions: 🔒 `security`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] pages/api/auth.ts 全文
- [ ] @tencent/checkurl README 与 subhost 模式说明
- [ ] OWASP Open Redirect 指南

#### 🛠️ Hands-on

- [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
- [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单

---

### 7. Zustand / Jotai 对比

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] src/store/store.ts 与 src/store/wallet.ts
- [ ] next-redux-wrapper 官方 HYDRATE 文档
- [ ] Redux Toolkit slice / extraReducers 章节

#### 🛠️ Hands-on

- [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
- [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性

---

### 8. git:rebaseCheck / git:changeLog / git:release 内建步骤

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] .orange-ci.yml 全文
- [ ] Dockerfile
- [ ] README.md 里正式发布段落

#### 🛠️ Hands-on

- [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
- [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本

---

### 9. time-aligned 排障方法论

> Related dimensions: 📈 `observability`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
- [ ] src/utils/report.ts generatePayload 与 A 字段映射
- [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举

#### 🛠️ Hands-on

- [ ] 写一个最小 reportWebVitals + 上报 demo
- [ ] 为大同事件加一个 debug-echo 的转发通道

---

