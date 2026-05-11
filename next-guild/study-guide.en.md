# QQ 频道 Hybrid H5 (next-guild) — Beginner Study Guide

> Companion: `knowledge-map.en.md`
> Audience: you can write a little JS/TS, but most of the project's core concepts still feel like "heard of, never built"
> Goal: by following this guide end to end, you cover every topic in the knowledge map

---

## 0. How to use this guide

Walk down phase by phase, cluster by cluster. Each cluster gives you a real-world scenario, a list of must-read links (clickable), a few hands-on exercises, and three self-check questions.

Aim for one or two clusters per day. Do the hands-on first, then the spec. Use the self-check at the end of each cluster to gate yourself; only move on once you can answer all three.

| Phase | Clusters | Keywords |
|---|---|---|
| Phase A: Hybrid 基座：Next.js 15 + WebView 双场景 | `c-routing` · `c-three-axios` | Next.js 15 Pages Router + react-next-keep-alive 页面缓存; 三类 axios 实例与 isInMSDK 分发 |
| Phase B: 安全授权：middleware + /api/auth 边缘守卫 | `c-auth-flow` | Edge middleware 守卫 + /api/auth 授权兑换 |
| Phase C: BFF 与 SSR：表驱动 oidb + 泛型 trpc | `c-bff-table` · `c-ssr-trpc` | catch-all + 路径 -> cmd 表驱动 BFF; 泛型 trpc.withLog + OpenTelemetry traceparent |
| Phase D: 可观测 & 发布：三通道监控 + Orange CI | `c-monitoring` · `c-release` | 三通道前端监控 + 服务端双通道日志; Orange CI 双流水线 + 双 Docker tag + stke:update |

---

## Phase A: Hybrid 基座：Next.js 15 + WebView 双场景

### Cluster 1 (c-routing): Next.js 15 Pages Router + react-next-keep-alive 页面缓存

**Covered topics**: Next.js Pages Router 与 ssr:false (NoSSR), Hybrid 路由模式：Pages Router + react-next-keep-alive 页面缓存 + NoSSR 异步导入

**Scenario**: 理解 Pages Router 的 _app / _document / middleware 分工，以及 next/dynamic 在 hybrid WebView 中的 NoSSR 用法。

#### 0-1 Prerequisites

- React 18 组件模型与 useEffect 生命周期
- 基本的 SSR vs CSR 心智模型

#### Must Read

1. [Next.js Pages Router 指南](https://nextjs.org/docs/pages)
2. [Next.js Custom App / Custom Document](https://nextjs.org/docs/pages/building-your-application/routing/custom-app)
3. [next/dynamic 与 ssr:false](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
4. [react-next-keep-alive 文档](https://github.com/CJY0208/react-next-keep-alive)

#### Hands-On

- 给一个本地 Next.js 项目加 _app.tsx 全局壳，挂一个 Context Provider
- 用 next/dynamic ssr:false 包一个依赖 window 的组件

#### Self Check

- [ ] 为什么 _app.tsx 改动会让所有页面重新挂载？
- [ ] Pages Router 下 getServerSideProps 与 middleware 在时序上有什么差异？
- [ ] react-next-keep-alive 能缓存什么、不能缓存什么？

---

### Cluster 2 (c-three-axios): 三类 axios 实例与 isInMSDK 分发

**Covered topics**: axios 拦截器与 transform hook, 三类 axios 实例 + isInMSDK 分发（request / oidbRequest / msdkRequest）, WebView 环境探测（UA / bridge / feature）

**Scenario**: 在同一套代码里同时支持 QQ 内置 WebView、MSDK 游戏 WebView、普通浏览器三种宿主。

#### 0-1 Prerequisites

- axios 拦截器与实例的基本用法

#### Must Read

1. [axios 实例与拦截器 (Interceptors)](https://axios-http.com/docs/interceptors)
2. [URLSearchParams 规范](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
3. [Detecting WebView 环境讨论](https://developer.chrome.com/docs/multidevice/user-agent/)

#### Hands-On

- 写一个 axios 实例工厂，按 baseURL / 拦截器差异化产出 3 个实例
- 在一个拦截器里把当前页面 query 的三个参数拼到请求 URL，覆盖已有问号场景

#### Self Check

- [ ] 拦截器里把参数拼在 URL 还是 header？各自适合什么场景？
- [ ] isInMSDK 只用 UA 有哪些典型误判？
- [ ] 为什么通用网关要 bkn 而 MSDK 网关不要？

---

## Phase B: 安全授权：middleware + /api/auth 边缘守卫

### Cluster 1 (c-auth-flow): Edge middleware 守卫 + /api/auth 授权兑换

**Covered topics**: Next.js 15 middleware.ts 边缘路径守卫 + openid/access_token/appid 三件套 cookie 拦截, itopencodeparam 解密 + @tencent/checkurl 白名单 (subhost) 防开放重定向, Cookie httpOnly / SameSite / Secure 三元组, 开放重定向 (Open Redirect) 常见变体

**Scenario**: 游戏场景的用户从 MSDK 链接进来时，如何在一次 302 内完成三件套 cookie 下发 + 防开放重定向。

#### 0-1 Prerequisites

- HTTP Set-Cookie / httpOnly / SameSite 三元组
- 理解 302 重定向的 HTTP 语义

#### Must Read

1. [Next.js Middleware 官方文档](https://nextjs.org/docs/pages/building-your-application/routing/middleware)
2. [MDN: Set-Cookie HttpOnly / SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
3. [OWASP Open Redirect Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
4. [WHATWG URL 标准](https://url.spec.whatwg.org/)

#### Hands-On

- 用 Next.js 15 middleware 做一个只拦 /admin 前缀的 cookie 守卫，缺失跳登录
- 写 10 条开放重定向 fixture（跳板 / @ 欺骗 / 后缀欺骗 / IDN 同形异义）并跑过一个 host 白名单工具

#### Self Check

- [ ] 为什么 middleware 比 getServerSideProps 更适合做路径守卫？
- [ ] subhost 模式与 host 模式在匹配语义上差在哪？
- [ ] Set-Cookie 为什么必须写在 redirect 响应之前？

---

## Phase C: BFF 与 SSR：表驱动 oidb + 泛型 trpc

### Cluster 1 (c-bff-table): catch-all + 路径 -> cmd 表驱动 BFF

**Covered topics**: pages/api/v2/[...slug].ts BFF：路径 -> (cmd, serviceType) 静态表映射 + x-oidb 覆写, pages/api/guild/[...slug].ts axios stream 透传代理 + Set-Cookie 保留, 表驱动设计 (table-driven) vs 代码驱动

**Scenario**: 把 200+ 后端 trpc 路径收敛到一张静态表里，让前端新增接口只改一行，不新增文件。

#### 0-1 Prerequisites

- Next.js API Routes 基本形状
- 理解 oidb 协议 cmd + serviceType 两级路由

#### Must Read

1. [Next.js Dynamic API Routes (catch-all)](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
2. [Node.js Streams Pipeline](https://nodejs.org/api/stream.html)
3. [表驱动设计 (Table-Driven Design)](https://en.wikipedia.org/wiki/Control_table)

#### Hands-On

- 用一张 Map 重写一个 10+ 接口的 mock BFF 代理
- 为表驱动 BFF 加一个 x-override header 支持，覆写默认字段但加 try-catch 兜底

#### Self Check

- [ ] 什么场景适合表驱动？什么场景仍然应该一个接口一个文件？
- [ ] 如何避免路径前缀变更导致整张表失效？
- [ ] axios stream pipe 做透传代理时 Set-Cookie 头要不要处理？

---

### Cluster 2 (c-ssr-trpc): 泛型 trpc.withLog + OpenTelemetry traceparent

**Covered topics**: getServerSideProps + trpc.withLog 通用封装 + OpenTelemetry traceparent 串联, W3C trace-context (traceparent), TypeScript 泛型包装异步调用, @opentelemetry/core RandomIdGenerator / TraceFlags

**Scenario**: 在 getServerSideProps 里发起 trpc 调用时，把日志、链路追踪、开发代理、错误抛出集中到一个泛型封装里。

#### 0-1 Prerequisites

- TypeScript 泛型与函数签名
- 理解 getServerSideProps 的运行环境

#### Must Read

1. [W3C Trace Context 规范](https://www.w3.org/TR/trace-context/)
2. [OpenTelemetry JS core](https://opentelemetry.io/docs/languages/js/)
3. [TypeScript Generics 手册](https://www.typescriptlang.org/docs/handbook/2/generics.html)
4. [log4js-node 官方文档](https://log4js-node.github.io/log4js-node/)

#### Hands-On

- 写一个 withLog<T,R> 包 Promise 的最小版，自动注入 traceparent 并在 retCode != 0 时抛错
- 在 getServerSideProps 里复用上游带进来的 traceparent 并验证串联

#### Self Check

- [ ] traceparent 四段字段分别是什么？sampled 位在平台上有什么影响？
- [ ] 并发 SSR 下怎么保证 logger context 不被其它请求覆写？
- [ ] IsDev proxy=1 的安全边界如何保障？

---

## Phase D: 可观测 & 发布：三通道监控 + Orange CI

### Cluster 1 (c-monitoring): 三通道前端监控 + 服务端双通道日志

**Covered topics**: Aegis RUM + Next reportWebVitals + 大同 analytics/v2_upload 三通道前端监控, log4js dateFile + @tencent/atta UDP 双通道日志, 业务 retcode 与 HTTP 状态的差异, time-aligned 排障方法论

**Scenario**: 线上问题从浏览器侧一路追到服务端时，需要 Aegis、web-vitals、大同、log4js、atta 五条数据互相参照。

#### 0-1 Prerequisites

- Web Vitals 核心指标 (LCP / FID / CLS) 含义

#### Must Read

1. [Google Web Vitals](https://web.dev/articles/vitals)
2. [Next.js reportWebVitals](https://nextjs.org/docs/pages/api-reference/functions/use-report-web-vitals)
3. [腾讯 Aegis 接入文档](https://aegis.qq.com/docs/)
4. [log4js layouts & contexts](https://log4js-node.github.io/log4js-node/layouts.html)

#### Hands-On

- 在本地 Next 项目导出 reportWebVitals 并把指标打到一个 mock HTTP 端点
- 用 log4js 写一个自定义 json layout，把自定义 context 字段拍平到最外层

#### Self Check

- [ ] Aegis、web-vitals、大同三通道如果都不上报一条业务错误，可能的原因是什么？
- [ ] atta UDP 丢包在什么量级会影响聚合准确性？
- [ ] 如何在并发 SSR 下做到 trace_id 与业务请求一对一？

---

### Cluster 2 (c-release): Orange CI 双流水线 + 双 Docker tag + stke:update

**Covered topics**: Orange CI 双流水线 + 双 Docker tag + stke:update 自动滚动发布 test 环境, standard-version 自动化发版 + CHANGELOG 累积到 v0.1.190, TKE StatefulSetPlus 滚动发布, Docker 多阶段 / cache 镜像

**Scenario**: master 打 tag 只出镜像，test 推代码自动滚 TKE；灰度 / 回滚 / 变更记录生成都顺着这一套流水线跑。

#### 0-1 Prerequisites

- Docker 镜像 tag 管理基础
- Kubernetes Deployment / StatefulSet 的滚动更新概念

#### Must Read

1. [Docker Official Docs](https://docs.docker.com/reference/dockerfile/)
2. [standard-version 规则](https://github.com/conventional-changelog/standard-version)
3. [Kubernetes StatefulSet 更新策略](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
4. [W3C Semantic Versioning](https://semver.org/)

#### Hands-On

- 为一个本地 Node 项目写 Dockerfile 并控制 NODE_OPTIONS 的 max-old-space-size
- 写一个最小 yaml 流水线：master 打 tag 只构镜像、feature 分支只跑 lint

#### Self Check

- [ ] 为什么生产部署不自动？手动确认具体拦下了哪些风险？
- [ ] 双 tag 并发 push 时 latest 为什么会错？
- [ ] 如何让 CHANGELOG 自动衔接 git:release 并避免格式漂移？

---

## Global Self Check: 7 one-line questions

1. (c-routing) 如果要把某个页面从 CSR 切回 SSR，你会改哪些文件？
2. (c-three-axios) 新增一种宿主环境（比如企业微信 H5）你会加第四个 axios 实例还是复用？
3. (c-auth-flow) 如果 /api/auth 的 checkurl 依赖暂时不可用，你会怎么降级让业务继续？
4. (c-bff-table) 表从 200 条涨到 2000 条后，你会考虑哪些治理手段？
5. (c-ssr-trpc) 上游请求已带 traceparent 时你的封装是复用还是新建？为什么？
6. (c-monitoring) 为什么不合并到一个 SDK？这是过度设计还是必要？
7. (c-release) 如果生产环境某次部署失败需要回滚，你能在几分钟内定位到上一个稳定镜像？

---

## Learning Tips

- 把 middleware.ts 和 pages/api/auth.ts 当作一个整体阅读，拆开看会丢失上下文。
- pages/api/v2/[...slug].ts 那张路径到 cmd 的映射表，建议按功能域（频道 / 钱包 / 签约 / feed）做分页阅读，而不是从头扫一遍。
- 读 src/server-side/trpc.ts 的 withLog 时，先理解泛型签名，再读 traceparent 拼接，最后看错误抛出策略。
- 跑 yarn dev 后一定要配 .whistle.js 的本地代理规则，否则所有 /qunng/next/h5 请求都打不到本地。
- 先动手用 standard-version 在自己的玩具项目里打一次版本并观察 CHANGELOG 结构，再去看 .orange-ci.yml 的 git:changeLog 就清晰得多。
- 排障时严格按 Aegis -> atta -> log4js -> web-vitals 的顺序走，任何一步拿不到线索就回退一级排查数据口径。

