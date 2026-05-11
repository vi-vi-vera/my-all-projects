# QQ 频道 Hybrid H5 (next-guild) — Interview Preparation

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 Dimension coverage

| Dimension | Count | Emoji |
|---|---|---|
| feature       | 1      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 1  | 🛡️ |
| observability | 2| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 2     | 🔒 |

## 🎯 Project pitch

### Elevator (resume-sized)

Hybrid H5 portal for QQ Guild on Next.js 15 Pages Router with TypeScript; a BFF path table bridges oidb and it runs inside MSDK game WebView.

### Standard (30–60 seconds)

next-guild is the hybrid H5 portal for QQ Guild, covering signing center, creator wallet, banned keywords, gift ranks and game-guild aggregation. It runs both inside the QQ WebView and the MSDK game WebView. The stack is Next.js 15 Pages Router on TypeScript 4.9 with Redux Toolkit (only walletSlice), antd-mobile and @tencent/exeditor3. The frontend does three things. First, middleware.ts guards /game-* on the openid/access_token/appid cookie trio and redirects to /api/auth with a callback so the endpoint can decrypt itopencodeparam and issue httpOnly cookies. Second, two pages/api [...slug] routes provide a streamed axios proxy and a path-to-(cmd, serviceType) mapping that delegates to rpcsdk oidbRequest, collapsing many backend paths into one table. Third, src/server-side/trpc.withLog is a generic helper used by getServerSideProps to inject OpenTelemetry traceparent, enable the IsDev proxy and raise retCode errors. Observability has three tracks: Aegis RUM, Next reportWebVitals and Datong universal-report. On the server log4js dateFile and @tencent/atta UDP form a dual channel. Releases run via two Orange CI pipelines; test push auto-rolls into TKE via stke:update while production stays manual.

### Deep dive (2–3 minutes)

<details><summary>Expand</summary>

next-guild is the QQ Guild H5 portal plus the in-game MSDK H5, serving both the plain QQ WebView and the embedded game WebView, so the whole project is hybrid-shaped across routing, requests, auth and styles. Routing uses Next.js 15 Pages Router with a very thin middleware: it only intercepts /game-* for the cookie trio guard; everything else runs as normal Pages and _app.tsx wraps Component in react-next-keep-alive to keep list-to-detail scroll state. Requests come in three flavours: request goes to the /qunng/http2rpc/gotrpc/v1 gateway with bkn, oidbRequest goes to /qunng/guild/gotrpc/v1 with bkn, and msdkRequest targets the internal /qunng/next/h5/api/v2 BFF and appends itopencodeparam / gameid / channelid to every URL via an interceptor. Business code picks one with const request = isInMSDK() ? msdkRequest : oidbRequest;. The auth chain is middleware -> /api/auth -> @tencent/rpcsdk msdk.decrypt -> @tencent/checkurl in subhost mode validates the redirect whitelist -> httpOnly cookies are set and the browser 302s back. The BFF centrepiece is pages/api/v2/[...slug].ts which holds a 200-plus entry path2cmdAndServiceType table mapping trpc.xxx.xxx/HandleProcessN into cmd (for example 0xf57) and serviceType (for example 125); the x-oidb header can override serviceType, then rpcsdk oidbRequest builds the packet. Observability is three-track: _app initialises Aegis with spa: true for RUM, reportWebVitals forwards LCP/FID/CLS to Datong analytics/v2_upload, and universal-report defines the PGIN/PGOUT/IMP/IMPEND/CLCK events. On the server, log4js writes /data/log/project/log/global.yyyy-MM-dd.log in json layout with uid/trace/path/cost, while @tencent/atta ships over UDP to 04900055524. Releases run through two Orange CI pipelines: $.tag_push builds nextguild with both time and latest tags, pushes to csighub, sends WeWork and git comments plus git:changeLog and git:release; test.push adds git:rebaseCheck and stke:update to roll the nextguild_test image into TKE StatefulSetPlus. The Dockerfile is node:20-alpine with NODE_OPTIONS=--max_old_space_size=4096 and ARG-injected CICD_ENV/TEST_ENV/VERSION/DEPLOY_ENV.

</details>

## ✨ Highlights

- **middleware.ts 在边缘做 /game-* 路径的 cookie 三件套守卫** (security · fullstack)
  The middleware only intercepts the /game- prefix; if any of openid, access_token or appid is missing it passes itopencodeparam/gameid/channelid and a redirect callback to /api/auth via a 302. Business pages always get a complete cookie set and never write their own auth branching.
  > Keywords: `next-middleware` · `edge-guard` · `cookie-trio` · `redirect`
- **/api/auth 用 rpcsdk.msdk.decrypt + @tencent/checkurl 做授权兑换与防开放重定向** (security · fullstack)
  /api/auth decrypts itopencodeparam with rpcsdk.msdk.decrypt to obtain openid, access_token and appid, then calls @tencent/checkurl in subhost mode to confirm redirect belongs to qq.com or tencent.com, preventing open-redirect abuse. On success it issues httpOnly cookies and 302s back, while winston only logs at info level.
  > Keywords: `msdk-decrypt` · `checkurl` · `open-redirect` · `httpOnly` · `winston`
- **pages/api/v2/[...slug].ts：200+ 条 path2cmdAndServiceType 静态表把 BFF 收敛成一处** (architecture · fullstack)
  Over 200 backend protocol paths like trpc.xxx.xxx/HandleProcessN are mapped in a single frontend table to cmd plus serviceType (with the _N suffix encoding overloads). Clients may override serviceType via the x-oidb header, then rpcsdk oidbRequest builds the packet. Adding a new endpoint only means appending an entry to this table, no new BFF file per endpoint.
  > Keywords: `bff` · `path-mapping` · `oidb` · `x-oidb` · `table-driven`
- **三类 axios 实例 + isInMSDK 分发，业务代码零感知** (architecture · frontend)
  Three axios instances live under src/common/: request (gotrpc gateway with bkn), oidbRequest (guild gateway with bkn) and msdkRequest (MSDK game WebView, whose interceptor auto-appends itopencodeparam, gameid and channelid). Business pages pick one with const request = isInGameWebview ? msdkRequest : oidbRequest; and then only call request.post(path, params) without caring which environment they run in.
  > Keywords: `axios` · `isInMSDK` · `interceptor` · `env-dispatch`
- **src/server-side/trpc.withLog 通用 SSR trpc 封装 + OpenTelemetry traceparent** (observability · fullstack)
  withLog<T, R> wraps a trpc proxy method and automatically injects option.context.traceparent built in W3C trace-context form as 00-traceId-spanId-01, enables proxy=1 under IsDev, and throws JSON.stringify(error) on retCode != 0 or error.code != 0. getLogger() ties a traceId to the request with log4js addContext('trace', traceId), making the SSR chain traceable.
  > Keywords: `trpc` · `withLog` · `traceparent` · `opentelemetry` · `ssr`
- **日志双通道：log4js dateFile + @tencent/atta UDP** (observability · backend)
  log4js writes /data/log/project/log/global.yyyy-MM-dd.log in json layout with uid, trace_id, path and cost fields, keeping three backups. The atta channel ships a field array [project, level, ip, uid, ctx, payload, trace, env] over UDP to 04900055524. The two channels decouple: if atta is down local logs persist, and if the local disk fills up atta still aggregates.
  > Keywords: `log4js` · `atta` · `udp` · `json-layout` · `dual-channel`
- **前端监控三通道：Aegis RUM + reportWebVitals + 大同** (observability · frontend)
  _app.tsx loads aegis.min.js via Script beforeInteractive and sets up RUM with new window.Aegis({ spa: true, reportApiSpeed, reportAssetSpeed }). reportWebVitals forwards LCP/FID/CLS/web-vital to baseReport, which posts to Datong /analytics/v2_upload. A third channel runs universal-report over beacon with the STANDARD enum standardising the five event names: page-in, page-out, impression, impression-end and click.
  > Keywords: `aegis` · `web-vitals` · `datong` · `universal-report` · `rum`
- **MSDK WebView 桥接：iframe src=__bridge_loaded__ 唤起回调** (feature · frontend)
  iOS MSDK has no standard js bridge, so we trigger the native callback via a hidden iframe whose src is https://__bridge_loaded__, retrieve bridge.callHandler through WVJBCallbacks and then call msdkCall for setScreenOrientation, setFullScreen and closeWebView. On Android we fall back to prompt(data) / alert with the protocol string. copyText also rewrites @{uin:xxx,nick:yyy} back to @yyy before writing to the clipboard.
  > Keywords: `msdk` · `webview-bridge` · `iframe` · `ios` · `copy-text`
- **Orange CI 双流水线：master tag_push 构镜像 + test push 自动 stke:update** (reliability · infra)
  $.tag_push runs docker login, build, push with both time and latest tags, WeWork notification, git:comment, git:changeLog and git:release in one go to fully automate releases. test.push starts with git:rebaseCheck to confirm main was merged, then builds nextguild_test and calls stke:update to roll the image into ns-prjftchp-1605051-test's StatefulSetPlus/next-guild-test, making the test environment fully hands-off.
  > Keywords: `orange-ci` · `docker` · `stke` · `tke` · `release-automation`


## 🏗️ Architecture (architecture) — 2 Q&A

### Q1. How did you design the 200+ entry path-to-cmd map in pages/api/v2/[...slug].ts, and why not write a separate BFF file per endpoint?

> Source: `tp-003` · scope: fullstack · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Next.js catch-all API route ([...slug]) | 必须掌握 | 路由骨架。 |
| oidb 协议 cmd + serviceType 模型 | 必须掌握 | 解释映射表为什么正好是 cmd_serviceType 结构。 |
| 表驱动设计 (table-driven) vs 代码驱动 | 必须掌握 | 抽象模式。 |
| @tencent/rpcsdk oidbRequest 入参 | 加分项 | 知道 payload / rpcContext / cookies / extra.ip 的作用。 |

#### Tiered answers

**🟢 Elevator**: A single static table path2cmdAndServiceType maps each backend trpc path to cmd plus serviceType; one catch-all route calls rpcsdk oidbRequest. Adding an endpoint means adding a row, not a new file.

**🔵 Standard** (default):

pages/api/v2/[...slug].ts is a Next.js catch-all API route. From req.query.slug we join the last two segments, for example slug ['trpc.group_pro.cmd0xf57.GetGuildInfo', 'HandleProcess125'] becomes last2 'trpc.group_pro.cmd0xf57.GetGuildInfo/HandleProcess125'. Look that up in the table to get cmdAndServiceType '0xf57_125' and split by underscore into cmd '0xf57' and serviceType 125. Clients can also override serviceType via an x-oidb header like {"uint32_service_type": 8}; the table value is only the default. Then we call @tencent/rpcsdk/dist/lib/node-common/sdk/oidbRequest with payload, rpcContext, cmd, serviceType, logger, cookies and extra.ip, and after oidbRes returns we res.status(200).json(oidbRes). We avoided a file per endpoint because oidb itself is a cmd-plus-serviceType routing protocol; two hundred endpoints share identical BFF code apart from those two fields, so a table collapses the duplication and mirrors the protocol model.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why table-driven, implementation details, the _N suffixes in HandleProcess entries, and pitfalls. First, a file per endpoint would be 99% duplicate code with 1% difference (cmd, serviceType, payload validation). We already sink payload validation into oidbRequest, which looks up proto schemas by cmd, so a per-file split is unjustified. The table itself also doubles as an endpoint directory; new folks read it once and know what backend services we touch. Second, on the implementation, we first read cookies.openid into logger context, then req.query.slug is a string[] produced by Next.js splitting the path. We always take the last two segments because earlier ones may carry version or tenant prefixes while the last two are service name / method name. The lookup result is split by underscore with const [cmd, serviceType = 2] so a raw '0xf57' entry still works. Third, suffixes like HandleProcess1 / 8 / 10 / 125 encode serviceType overloads; for example 0xf57_1 and 0xf57_125 are both GetGuildInfo but with different serviceType and different business semantics. The table key must therefore include HandleProcessN because different N under the same cmd dispatch to different handlers downstream. Fourth, pitfalls. Originally the key was the full path; any prefix change broke everything, so we switched to slice(-2). The x-oidb JSON parse had no try/catch and invalid JSON would 500 the request; a try/catch now logs and keeps the default serviceType. Finally, cookies pass through verbatim to oidbRequest because rpcsdk reads skey/pskey for auth; once we filtered cookies and skey was dropped, auth broke across the board.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] pages/api/v2/[...slug].ts 全文
  - [ ] src/common/msdkRequest.ts
  - [ ] Next.js catch-all & dynamic API route 文档
- 🛠️ Hands-on
  - [ ] 用表驱动重写一个 10+ 接口的 mock BFF
  - [ ] 为 x-oidb 覆写加一个 JSON schema 校验
- ⚠️ Common pitfalls
  - 把完整 path 当 key 导致前缀不稳
  - x-oidb parse 无 try-catch
  - 裁剪 cookies 破坏下游鉴权
- 🤔 Self-check questions (answer without notes)
  - [ ] 表越来越大怎么管理？要不要拆文件？
  - [ ] 新增接口的 review 流程是什么？
  - [ ] 如果后端加新 serviceType 前端怎么跟？
- ⏱️ Estimated time: **3-5 小时**


#### Evidence

- `pages/api/v2/[...slug].ts`
- `src/common/msdkRequest.ts`

---

### Q2. Why keep three axios instances (request, oidbRequest, msdkRequest) in src/common/ instead of one, and how does isInMSDK pick between them?

> Source: `tp-005` · scope: frontend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| axios 实例与拦截器分层 | 必须掌握 | 理解为什么一个网关对应一个实例。 |
| WebView 环境探测（UA / bridge / feature） | 必须掌握 | isInMSDK 的实现空间。 |
| BFF 与前端参数透传策略 | 必须掌握 | query vs header 的选择。 |

#### Tiered answers

**🟢 Elevator**: They differ by baseURL and interceptors: which gateway, whether bkn is attached and whether itopencodeparam is appended. isInMSDK inspects the UA to choose.

**🔵 Standard** (default):

The division of labour is: request targets the http2rpc gateway at /qunng/http2rpc/gotrpc/v1 with bkn auto-attached to params; oidbRequest targets the guild gateway at /qunng/guild/gotrpc/v1 also with bkn; msdkRequest targets the internal BFF at /qunng/next/h5/api/v2/, and its request interceptor appends itopencodeparam / gameid / channelid read from window.location.search to the URL via config.url += separator + .... Business modules pick an instance with one line at the top: const isInGameWebview = isInMSDK(); const request = isInGameWebview ? msdkRequest : oidbRequest;, and every subsequent request.post(path, params) dispatches automatically. isInMSDK lives in src/utils/os.ts and currently returns true unconditionally (so every scene is treated as MSDK); historically it matched the MSDK tag against window.navigator.userAgent.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why three instances, why MSDK appends parameters into the URL, why isInMSDK now returns true, and pitfalls. First, three instances are not over-engineering: the three gateways differ in protocol. http2rpc needs bkn and speaks http2rpc; oidb also needs bkn but hits the guild-owned gotrpc entry with different cmds; the MSDK scene runs inside the game WebView where cookies come from /api/auth (openid / access_token / appid), must not carry bkn and must propagate itopencodeparam / gameid / channelid on every call, which is exactly what the msdkRequest interceptor does. A single instance would force branching at every call site, making things worse. Second, we append parameters into the URL rather than headers because the BFF layer (pages/api/v2/[...slug].ts) is a Next.js serverless handler that reads parameters via req.query, which is the cheapest path; headers would be more RESTful but require explicit req.headers.get and passthrough inside the BFF, which is a maintenance hit. Third, isInMSDK returning true is a deliberate business call: as all scenes eventually share the MSDK auth model (the unified openid / access_token / appid benefits both game WebView and plain WebView), two paths are no longer needed. The historical UA-based code stays as an escape hatch so a single line can flip behaviour back later. Fourth, pitfalls. The interceptor used config.url?.includes('?') to decide the separator, but a trailing '/' on baseURL combined with a relative url could produce '/api/v2//...&...'; we fixed it by standardising baseURL with no trailing '/'. URLSearchParams returns '' not null for missing keys, so each param needs a || '' fallback. Historically isInMSDK sniffed the UA, but some devices inside games mangle UA, so the error rate was high; that is why we collapsed it to true.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
  - [ ] src/utils/os.ts
  - [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑
- 🛠️ Hands-on
  - [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
  - [ ] 实现一个 feature-detect 版 isInMSDK
- ⚠️ Common pitfalls
  - baseURL 尾 '/' 导致双斜杠
  - isInMSDK 仅靠 UA 判误判率高
  - 把 bkn 误加到 msdkRequest 后端拒绝
- 🤔 Self-check questions (answer without notes)
  - [ ] 如果新增一类场景，你会加第四个实例还是复用？
  - [ ] 为什么不用 fetch？axios 的增益是什么？
  - [ ] msdkRequest 响应失败怎么统一兜底？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/common/request.ts`
- `src/common/oidbRequest.ts`
- `src/common/msdkRequest.ts`
- `pages/api/game-guild.ts`
- `src/utils/os.ts`

---

## 🧩 Feature (feature) — 1 Q&A

### Q1. How do you talk to native in the MSDK game WebView, and why do you use an iframe on iOS?

> Source: `tp-009` · scope: frontend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| WKWebView decidePolicyForNavigationAction 拦截 | 必须掌握 | iframe jsbridge 的原生原理。 |
| iOS/Android 协议枚举差异 | 必须掌握 | 跨端封装要点。 |
| WVJBCallbacks 队列模型 | 必须掌握 | 竞态处理。 |
| Clipboard API 兼容 (execCommand copy) | 加分项 | copyText 的历史兼容。 |

#### Tiered answers

**🟢 Elevator**: iOS has no standard js bridge, so a hidden iframe with src=__bridge_loaded__ triggers the native injection of WebViewJavascriptBridge; only after getting callHandler can we invoke MSDKCall.

**🔵 Standard** (default):

isiOS() is true when the UA is iPad/iPhone/iPod or MacIntel with maxTouchPoints > 1 (iPadOS 13+). On iOS we first call setupWebViewJavascriptBridge(callback): if window.WebViewJavascriptBridge already exists we callback immediately; if a window.WVJBCallbacks array is present we push into it; otherwise we set window.WVJBCallbacks = [callback], create a display:none iframe with src 'https://__bridge_loaded__', append it to documentElement, and remove it on setTimeout 0. The iframe src is the signal agreed with iOS MSDK; native catches this request and injects bridge.callHandler into window. Once callHandler is available, msdkCall(data) sends the JSON protocol such as '{"MsdkMethod":"setScreenOrientation","screenOrientation":"3"}'. Android has no such constraint; prompt(data) / alert(data) is hooked natively, so the same msdkCall falls back to prompt/alert on Android with the identical protocol string.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why iframe instead of URL scheme on iOS, the race handling in setupWebViewJavascriptBridge, the orientation / full-screen wrappers, and pitfalls. First, iframe vs URL scheme: many community js bridges use location.href = 'schema://...' on iOS, but since 2019 WKWebView swallows some of these and reliability drops. MSDK picks iframe.src = 'https://__bridge_loaded__' because that is a request observable by WKNavigationDelegate's decidePolicyForNavigationAction; native detects host __bridge_loaded__, injects the bridge and cancels the request, so the page never notices. Second, race handling. Business code may call msdkCall before the bridge is ready, so setupWebViewJavascriptBridge handles three cases: bridge present, bridge pending (WVJBCallbacks queue exists), or bridge missing (we are first). Only the third case creates the iframe, so subsequent msdkCall invocations never recreate it. Third, orientation wrappers: setLandscapeScreen sends screenOrientation '3' on iOS and '6' on Android because native enums differ; setLandscapeFullScreen awaits setLandscapeScreen() then setFullScreen() because both commands are independent and combinations like full-screen portrait or landscape non-full exist. The @{uin:xxx,nick:yyy} regex rewrite inside copyText exists because at-mentions are stored structurally in Guild, and external clipboards want the human @nick form. Fourth, pitfalls. On certain Android builds prompt is blocked so no native handler fires; we fall back to alert, which pops UI, but some versions print the protocol into native and return undefined, a worse UX but workable. Appending the iframe to body instead of documentElement used to throw during document.readyState === 'loading' when body had not materialised; switching to documentElement fixed it. setTimeout 0 to remove the iframe has a tiny chance to race ahead of native injection, removing the iframe before the bridge is ready; we have not seen it in production, but setTimeout 50 or a MutationObserver watching window.WebViewJavascriptBridge readiness would mitigate.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/utils/msdk.ts 全文
  - [ ] src/utils/os.ts 中 isiOS / isInMSDK
  - [ ] MSDK iOS/Android 官方 bridge 接入指南
- 🛠️ Hands-on
  - [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
  - [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback
- ⚠️ Common pitfalls
  - iframe 插 body 抛错
  - prompt 被 Android 屏蔽
  - 重复创建 iframe 导致 bridge 被重置
- 🤔 Self-check questions (answer without notes)
  - [ ] bridge 未就绪前业务调用怎么兜底？
  - [ ] 为什么不用 window.webkit.messageHandlers？
  - [ ] copyText 在 HTTPS 场景下能否用 Clipboard API？
- ⏱️ Estimated time: **4-6 小时**


#### Evidence

- `src/utils/msdk.ts`
- `src/utils/os.ts`
- `pages/_app.tsx`

---

## ⚡ Performance (performance) — 1 Q&A

### Q1. You use postcss-px-to-viewport with viewportWidth 1284 and exclude the GameGuild directories. Why configure it this way?

> Source: `tp-012` · scope: frontend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| postcss-px-to-viewport 核心配置 | 必须掌握 | 回答主线。 |
| viewportWidth 与设计稿的关系 | 必须掌握 | 解释 1284 选择。 |
| selectorBlackList / exclude 两层 opt-out | 必须掌握 | 工程实务。 |
| Next.js CSS code-split | 加分项 | 与 purgecss 取舍的上下文。 |

#### Tiered answers

**🟢 Elevator**: Regular H5 uses the 1284 iPad design width as a vw baseline for consistent scaling; GameGuild pages ship their own pixel sizes, so we exclude them wholesale.

**🔵 Standard** (default):

postcss.config.js key settings for postcss-px-to-viewport: viewportWidth 1284 (matching the iPad design width as vw baseline), unitPrecision 3, viewportUnit 'vw', selectorBlackList ['.ignore', 'max-view'], minPixelValue 1, mediaQuery false; exclude is a regex array [/GameGuildMain/, /game-guild-main/, /GameGuildDetail/, /game-guild-detail/, /GameGuildComponents/] covering both casings. Reasoning: first, most QQ Guild H5 scenes render inside iPad WebView against a 1284-wide design; vw then scales consistently on iPhone. Second, the three GameGuild directories are game-guild aggregation pages designed per-game with fixed pixel sizes, and proportional vw scaling would blow buttons up on wide screens, so they are excluded wholesale at the postcss layer to keep px. Third, selectorBlackList entries .ignore and max-view are an escape hatch for the few library classes that must stay px, combining directory-level and class-level opt-outs.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why 1284 instead of 750 or 375, first-paint and bundle implications, the engineering cost of directory-level excludes, and pitfalls. First, traditional mobile uses 750 or 375 as the vw baseline, but QQ Guild's main devices include iPad and landscape WebView and the design is 1284 wide; on iPhone vw scales down naturally. The same px value maps closest to the design at 1284 (1:1) and is proportionally smaller on narrower screens. Second, first paint and bundle. postcss-px-to-viewport rewrites px to vw at build time, slightly increasing CSS size (longer strings) but improving cross-screen behaviour; Next.js already splits CSS per route, so big pages like GameGuild do not pollute others. We disabled @fullhuman/postcss-purgecss (commented out) because antd-mobile and exeditor3 generate some class names at runtime and purge risk outweighs gain; first-paint is governed by Next.js dynamic imports (via next/dynamic under Pages Router) and Aegis LCP monitoring. Third, directory excludes are socially contracted: both GameGuildMain and game-guild-main must be listed, casing and hyphen variants can slip, so we keep five regexes plus a team convention that any new game-guild aggregation page must sit under a GameGuild* prefix; this is more brittle than pure technical isolation but pragmatic. Fourth, pitfalls. selectorBlackList initially held only ['.ignore'], and a component needing px under .max-view was converted to vw; two entries fixed it. unitPrecision was once 5 producing long fractions like 0.12345vw and a tiny render cost; dropping to 3 cleaned it up. mediaQuery was once enabled, so px inside @media also got converted and breakpoints skewed; disabling restored correct media queries.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] postcss.config.js
  - [ ] postcss-px-to-viewport 官方文档
  - [ ] GameGuild* 目录下任意一个 .scss
- 🛠️ Hands-on
  - [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
  - [ ] 为某个目录配 exclude 并写一个 lint 验证被排除
- ⚠️ Common pitfalls
  - mediaQuery 开启导致断点错乱
  - selectorBlackList 漏列
  - exclude 没覆盖大小写与连字符两种目录命名
- 🤔 Self-check questions (answer without notes)
  - [ ] viewportWidth 怎么选？你项目是 1284，别家为什么是 750？
  - [ ] vw 基线的极端窄/宽屏表现如何？
  - [ ] 何时应该启用 purgecss？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `postcss.config.js`

---

## 🛡️ Reliability (reliability) — 1 Q&A

### Q1. How are the master tag_push and test push pipelines divided in Orange CI, and how does a single push auto-update the test environment?

> Source: `tp-013` · scope: infra · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Orange CI YAML 触发器 (tag_push / push / pr) | 必须掌握 | 流水线划分的语法基础。 |
| Docker 双 tag 策略 (time + latest) | 必须掌握 | 可溯源与便利的平衡。 |
| TKE StatefulSetPlus 滚动发布 | 必须掌握 | production 部署模型。 |
| git:rebaseCheck / git:changeLog / git:release 内建步骤 | 加分项 | Orange CI 生态组件。 |

#### Tiered answers

**🟢 Elevator**: master tag_push only builds images and cuts a release (production deploy stays manual); test push runs rebaseCheck, builds an image and calls stke:update to roll the TKE StatefulSetPlus.

**🔵 Standard** (default):

Two pipelines live in .orange-ci.yml under different YAML top-level keys. $:tag_push runs when master tags: docker login -> DOCKER_TIME_TAG (csighub.tencentyun.com/abcmouse/nextguild:<branch>_<time>_<commit>) plus DOCKER_LATEST_TAG -> docker build -> docker push both tags -> WeWork message plus git:comment echoes image names into the PR -> git:changeLog scrapes the latest CHANGELOG.md section -> git:release publishes it as Release Notes. It never triggers a production deploy; production still requires manually updating the StatefulSetPlus image on kubernetes.woa.com (link in README). test:push triggers on pushes to the test branch, starts with git:rebaseCheck to ensure main is merged, then docker build / push to the nextguild_test image, and finally stke:update rolls the image into ns-prjftchp-1605051-test StatefulSetPlus/next-guild-test via the v4 kubernetes URL.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why production stays manual, the dual-tag motivation, the meaning of rebaseCheck, and pitfalls. First, production remains manual on purpose: the live environment serves real QQ users and gray release / rollback matters; kubernetes.woa.com StatefulSetPlus offers rolling deploy and auto-batch options and someone must weigh them. Pushing the image to the registry is safe (ops can view it), but a human must press the deploy button. Second, the dual-tag motivation: time tags are immutable for rollback (any moment's image is restorable); latest provides convenience so downstream pipeline stages can reference it without variables. The cost is doubled storage; the benefit is both traceability and one-click deploy. Third, rebaseCheck via Orange CI's builtin type: git:rebaseCheck guarantees the test branch is rebased on the latest master; without it, the test environment could ship an image missing the latest fix and reproduce bugs awkwardly. Fourth, pitfalls. DOCKER_LATEST_TAG races when pipelines run in parallel; two concurrent pushes might have latest pointing to the wrong build, so we now always key deploy decisions off the time tag and keep latest only for smoke checks. git:changeLog depends on CHANGELOG.md format, and standard-version once changed its preset and broke release notes; we now pin the standard-version preset in the release script. stke:update occasionally fails on TKE API timeouts and Orange CI does not auto retry; we added timeout and retry settings to that step after manual reruns became annoying.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] .orange-ci.yml 全文
  - [ ] Dockerfile
  - [ ] README.md 里正式发布段落
- 🛠️ Hands-on
  - [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
  - [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本
- ⚠️ Common pitfalls
  - 并发 push 下 latest tag 竞争
  - CHANGELOG 格式变更导致 release notes 空
  - production 误开 stke:update 自动部署
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么 production 不自动部署？
  - [ ] 如果要加灰度流量切换你会怎么做？
  - [ ] 时区不一致如何影响 time tag？
- ⏱️ Estimated time: **3-5 小时**


#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `README.md`

---

## 📈 Observability (observability) — 3 Q&A

### Q1. How does trpc.withLog in your SSR work, how is traceparent constructed, and what benefits does it provide?

> Source: `tp-006` · scope: fullstack · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| W3C trace-context (traceparent) | 必须掌握 | 跨服务日志串联的关键协议。 |
| TypeScript 泛型包装异步调用 | 必须掌握 | withLog<T,R> 的签名设计。 |
| log4js context 与 SSR 请求隔离 | 必须掌握 | 每请求实例化 logger、避免 context 被覆写。 |
| @opentelemetry/core RandomIdGenerator / TraceFlags | 加分项 | trace id 与 sampled flag 的来源。 |

#### Tiered answers

**🟢 Elevator**: withLog is a generic wrapper: given a trpc proxy method and input, it injects traceparent and dev proxy into option.context, and throws on retCode != 0.

**🔵 Standard** (default):

withLog<T, R>(func, data, ctx?, logger?) is one of the default exports of src/server-side/trpc.ts. It does three things. First, getLogger() returns the request-scoped log4js logger and reads the traceId from logger.context.trace. Second, it builds option = { context: { ...ctx, traceparent: getTraceParent(trace) }, timeout: 60000 } and, under IsDev, adds proxy=1 to route the trpc client through the local proxy. Third, await func(data, option) yields { retCode, costTime, response, error }; if retCode !== 0 or error?.code !== 0 it throws new Error(JSON.stringify(error)), otherwise it logger.debug the cost and response and returns response. traceparent follows the W3C trace-context shape: `${version}-${traceId}-${spanId}-0${TraceFlags.SAMPLED.toString(16)}`, yielding 00-<32 hex>-<16 hex>-01. traceId comes from @opentelemetry/core's RandomIdGenerator and spanId is regenerated per call. The benefit is that a single SSR's frontend logs, atta logs and downstream trpc logs share one traceId; grep it and the chain is visible end to end.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why generics are mandatory, the meaning of each traceparent field, what IsDev proxy=1 does, and pitfalls. First, trpc proxy methods are strictly typed by pb: input has a specific type and the return is Response<R>. Without generics you either fall back to any and lose types or re-declare types at every call site. withLog<T, R>(func, data), written once, lets callers do await withLog(signProxy.BatchGetGuildSignedUserList.bind(signProxy), { guild_id: ... }, ...) and still receive the proper input and R-shaped return. Second, the four traceparent segments: version must be 00; traceId is the 32-hex end-to-end id; spanId is the 16-hex id for this span; flags is a one-byte bitmask whose LSB of 1 means sampled. We generate a fresh traceId per SSR when upstream does not send one and a fresh spanId per trpc call; if an upstream header already carries traceparent we reuse it from logger.context.trace. Third, IsDev proxy=1 makes the trpc client use the SSRF proxy (PrxServer @tcp -h 11.177.119.231 -p 8080) as a dev-time tunnel to the intranet and must never be on in production, hence the IsDev double guard. Fourth, pitfalls. Early code did parseInt(retCode, 10) !== 0, but retCode is already a number and certain Node versions hit radix issues, so we switched to retCode !== 0; the legacy trpcWithLog branch still carries parseInt for history. getTraceParent(trace) falls back to newRandomIdGenerator.generateTraceId() when trace is empty; we initially forgot the fallback and a blank traceId in traceparent was rejected downstream. Finally, the fixed 60 s timeout was too short for batch endpoints in the signing centre, so withLog now accepts an optional timeout passthrough.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/server-side/trpc.ts 全文
  - [ ] src/utils/report.ts 中 getTraceParent 实现
  - [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例
- 🛠️ Hands-on
  - [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
  - [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测
- ⚠️ Common pitfalls
  - 忘记 fallback 空 traceId
  - 直接把 ctx 透传而不注入 traceparent
  - 生产环境误开 proxy=1
- 🤔 Self-check questions (answer without notes)
  - [ ] 上游已经带 traceparent 时你怎么复用？
  - [ ] 如果想加 baggage 字段你怎么扩展？
  - [ ] retCode 的错误怎么分级上报？
- ⏱️ Estimated time: **4-6 小时**


#### Evidence

- `src/server-side/trpc.ts`
- `src/server-side/grayGroupInfo.ts`
- `src/server-side/sign.ts`
- `src/utils/report.ts`

---

### Q2. How are SSR logs written, and why use log4js together with @tencent/atta?

> Source: `tp-007` · scope: backend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| log4js appenders / layouts / categories 模型 | 必须掌握 | 回答前置知识。 |
| SSR 并发下的 logger 实例隔离 | 必须掌握 | AsyncLocalStorage / child logger 话题。 |
| UDP fire-and-forget 语义 | 加分项 | atta 为什么选 UDP。 |

#### Tiered answers

**🟢 Elevator**: log4js writes a local dateFile in json, while atta ships a field array to the aggregation platform over UDP. The two channels are decoupled.

**🔵 Standard** (default):

The logger initialises in src/utils/logger/index.ts. log4js.configure declares a custom json layout that flattens projectName, env, uid, trace_id, path and cost from logEvent.context into the top level before appending to a dateFile at /data/log/project/log/global.yyyy-MM-dd.log with three backups; a console appender also exists for local dev. The atta side lives in src/utils/logger/atta.ts: new Atta() plus initProtocol('udp'), and stdoutAppender receives loggingEvent and calls atta.send_fields(id, token, [projectName, level, ip, uid, ctx, payload, trace, env]) with eight fields over UDP to 04900055524, catching every error and returning false so that a dead atta never breaks the local pipeline. Each request obtains its own logger instance via getLogger() and calls addContext('trace', traceId); we do not share the global singleton.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why we do not share the logger singleton, the json-layout and context contract, why atta uses UDP, and pitfalls. First, log4js getLogger() returns the same instance by default, so concurrent SSRs calling addContext('uid', ...) overwrite each other. We call log4js.getLogger() per request and attach a fresh traceId, but even that is not fully isolated under log4js 4.x; a more thorough solution would be child loggers plus AsyncLocalStorage, which remains tech debt. Second, the json-layout contract pins uid, trace_id, path and cost at the top level because the atta aggregation platform slices by field and stable top-level names index cleanly; extra fields spread under ...logEvent. Third, atta uses UDP because it is fire-and-forget: fast and non-blocking. We accept UDP loss since the local dateFile is the source of truth and atta is aggregation icing. Fourth, pitfalls. Each atta construction opens a UDP socket, and in multi-process setups spawning one per worker is wasteful, so we do const atta = new Atta() at module scope to ensure a single instance. Early on we chained send_fields().then(...) without a catch and a UDP failure produced an unhandled rejection that crashed the Next process; we added .catch(() => false). log4js addLayout must run before configure or the json layout silently falls back to basic; we keep the two statements adjacent to avoid ordering bugs.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/utils/logger/index.ts
  - [ ] src/utils/logger/atta.ts
  - [ ] log4js 官方 layouts 与 context 文档
- 🛠️ Hands-on
  - [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
  - [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率
- ⚠️ Common pitfalls
  - 共享全局 logger 单例造成 context 覆写
  - atta send_fields 未 catch 抛 unhandled rejection
  - addLayout 晚于 configure 注册
- 🤔 Self-check questions (answer without notes)
  - [ ] 并发 SSR 下 trace 字段会不会错乱？
  - [ ] UDP 丢包的业务影响如何评估？
  - [ ] 日志脱敏怎么接入？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/utils/logger/index.ts`
- `src/utils/logger/atta.ts`
- `src/utils/logger/shared.ts`

---

### Q3. Your frontend monitoring has three tracks: Aegis, Next reportWebVitals, and Datong. Why so many, and how do their responsibilities split?

> Source: `tp-008` · scope: frontend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Aegis RUM（spa / reportApiSpeed / reportAssetSpeed） | 必须掌握 | 主监控通道。 |
| Next.js reportWebVitals 机制 | 必须掌握 | 性能指标收集原理。 |
| 大同 universal-report 事件模型 | 必须掌握 | 业务埋点规范。 |
| time-aligned 排障方法论 | 加分项 | 跨通道定位。 |

#### Tiered answers

**🟢 Elevator**: Aegis is RUM (errors, API and asset timing), reportWebVitals captures core Web Vitals, and Datong tracks business events (PV, impression, click). They target different concerns.

**🔵 Standard** (default):

In _app.tsx we first load aegis.min.js with next/script's beforeInteractive strategy, and inside useEffect we call new window.Aegis({ id: 'RiaWqsnTezUjYcdWpp', spa: true, reportApiSpeed: true, reportAssetSpeed: true, hostUrl: 'https://rumt-zh.com' }) to wire Aegis RUM for frontend errors, API timing, asset timing and PV. The same useEffect calls initUniversalReport to set up the Datong SDK and defines a STANDARD enum with PGIN/PGOUT/IMP/IMPEND/CLCK, which business code uses consistently to report semantic events such as the group-upgrade dialog close. Next.js exposes reportWebVitals as a named export in _app; after next build the framework feeds LCP/FID/CLS/web-vital into it for every page, and we forward to baseReport which posts to Datong analytics/v2_upload, aligning web vitals with business events on the same platform.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why not merge the three tracks, payload design trade-offs, pitfalls with spa: true, and the debug flow. First, the three platforms have fundamentally different data models: Aegis is technical RUM with automatic capture, auto-clustering JS stacks and API timings plus alerts; web-vitals is Google's standard metric triple (label / name / value) for performance; Datong is business telemetry with pgid / eid / publicParams / businessParams for funnels and A/B. Merging them would either lose Aegis's auto-capture or Datong's semantic model. Second, payload design. baseReport uses magic fields like A99 / A100 / A102 / A114 because the Datong /analytics/v2_upload protocol requires fixed names such as common.A8 / A99 / A100 / A119 / A120. We pin label to A8, name to A99, numberValue to A100 and the json log to A119 inside generatePayload, and expose a simple (name, value, log) => Promise via the reportMetricWithLogFactory(label) factory. Third, Aegis's spa: true hooks history.pushState, replaceState and popstate for auto PV, but Next.js Pages Router has router.events.on('routeChangeComplete') that Aegis does not listen to by default; we verified PV is still captured (because Next eventually calls pushState), but router.replace would miss, so we standardise on router.push. Fourth, the debug flow: a production error goes through Aegis stack -> atta logs by traceparent -> log4js dateFile by uid -> cross-check reportWebVitals perf curves around the error time. This requires sub-minute timestamp alignment across the three backends, so all our containers use Asia/Shanghai.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
  - [ ] src/utils/report.ts generatePayload 与 A 字段映射
  - [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举
- 🛠️ Hands-on
  - [ ] 写一个最小 reportWebVitals + 上报 demo
  - [ ] 为大同事件加一个 debug-echo 的转发通道
- ⚠️ Common pitfalls
  - useEffect 早于 Aegis SDK 加载导致 window.Aegis 未定义
  - router.replace 丢失 PV
  - A99/A100 字段混写导致指标错位
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不直接用一个通道？
  - [ ] Web Vitals 在 Hybrid WebView 里准吗？
  - [ ] Aegis 上报失败你怎么发现？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `pages/_app.tsx`
- `src/utils/report.ts`
- `src/utils/datong.ts`

---

## 🔒 Security (security) — 2 Q&A

### Q1. What does your Next.js 15 middleware do, and why only intercept /game-* paths rather than the whole site?

> Source: `tp-001` · scope: fullstack · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Next.js 15 middleware 生命周期 | 必须掌握 | 理解边缘函数何时执行、能做什么、不能做什么。 |
| req.cookies API 与 httpOnly/SameSite | 必须掌握 | 三件套 cookie 的可见性与安全策略。 |
| 302 redirect 与回跳参数设计 | 必须掌握 | 授权成功后如何回到原页面。 |

#### Tiered answers

**🟢 Elevator**: The middleware only checks the openid/access_token/appid cookie trio under the /game- prefix and 302s to /api/auth if any is missing. All other paths bypass it.

**🔵 Standard** (default):

middleware.ts first checks !pathname.startsWith('/game-') and calls NextResponse.next() to pass through; only the /game- branch enters the guard. It reads openid, access_token and appid from cookies, and if any is missing it clones nextUrl to build a new URL at /qunng/next/h5/api/auth, forwards itopencodeparam, gameid and channelid as is, and encodes the current basePath + pathname + search into a redirect query parameter, then returns NextResponse.redirect. There are two reasons to scope the middleware to /game-*. First, only the game guild entry needs this specific auth dance; other scenes like signing center, wallet and qunshare get their cookies elsewhere and should not be coupled to this path logic. Second, middleware runs on every request, so narrowing the prefix cuts edge CPU significantly, which matters on the internal CDN.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why middleware instead of getServerSideProps, the implementation, the callback parameter design, and pitfalls. First, with Pages Router getServerSideProps first enters the page component and then decides to redirect, so users see a flash; middleware runs at the edge before any page is matched, the 302 leaves cleanly. Next.js 15 middleware also exposes req.cookies.get('openid') synchronously, which is cheaper than parsing cookies again inside an API handler. Second, the implementation deliberately stays minimal: only the cookie-trio check runs here, no itopencodeparam decryption and no remote calls; all heavy lifting moves to /api/auth. openid is httpOnly false because some business scripts need to read it when building URLs, while access_token and appid stay httpOnly true to resist XSS theft. Third, the callback parameter. After auth succeeds the user should land on the page they originally wanted, so we join originalUrl.basePath + pathname + search rather than storing location.href directly, because basePath is the Next.js-configured /qunng/next/h5 and SSR and client paths differ slightly; nextUrl.clone() is needed to get a structured object. Fourth, two pitfalls. Originally we forgot to forward itopencodeparam, gameid and channelid, so they were lost on the redirect and /api/auth could not decrypt; we fixed it by explicitly calling authUrl.searchParams.set three times. The redirect value was also unbounded, so long marketing URLs occasionally exceeded the proxy gateway's URL limit; now /api/auth truncates the decoded value to 1024 chars before passing to checkurl.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] middleware.ts 全文
  - [ ] pages/api/auth.ts 全文
  - [ ] Next.js middleware 官方文档（matcher / request 对象）
- 🛠️ Hands-on
  - [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
  - [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行
- ⚠️ Common pitfalls
  - redirect 没透传原始 query 参数
  - 把长链直接塞进 redirect 导致超长
  - middleware 里做远端调用拖慢所有请求
- 🤔 Self-check questions (answer without notes)
  - [ ] middleware 里能不能调 DB 或远端接口？
  - [ ] matcher 配置和 pathname.startsWith 选哪个？
  - [ ] 如果 cookie 结构变了，middleware 与 /api/auth 怎么协同上线？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `middleware.ts`
- `pages/api/auth.ts`

---

### Q2. How does /api/auth prevent open-redirect attacks, and why use @tencent/checkurl instead of a custom regex?

> Source: `tp-002` · scope: fullstack · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| 开放重定向 (Open Redirect) 常见变体 | 必须掌握 | 理解我们为什么要防以及防哪些。 |
| @tencent/checkurl subhost 模式语义 | 必须掌握 | 具体 API 与白名单语义。 |
| httpOnly / SameSite / Secure 三元组 | 必须掌握 | cookie 下发策略选型。 |
| URL 标准解析（WHATWG URL） | 加分项 | 讨论 IDN、userinfo、端口等变体。 |

#### Tiered answers

**🟢 Elevator**: The decoded redirect value is handed to @tencent/checkurl in subhost mode, which only accepts qq.com and tencent.com subdomains; anything else returns 403.

**🔵 Standard** (default):

The flow is: once itopencodeparam yields openid/access_token/appid, we decodeURIComponent the query.redirect, then call checkurl with authorizedUrlConfig = { schemes: ['http','https'], rules: ['qq.com','tencent.com'], mode: 'subhost' }. On false we return res.status(403).json(...); on true we set httpOnly openid/access_token/appid cookies and res.redirect(302, redirect). We chose @tencent/checkurl because it parses the URL by structured field (scheme, host, path) and reliably handles common open-redirect tricks like //evil.com@qq.com back-slash spoofing, IDN confusables, port spoofing and raw IPs. A hand-rolled /qq\.com/ regex always misses suffix spoofing such as .evil.com.qq.com.attacker.xyz.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: attack surface, the subhost mode semantics, cookie strategy and pitfalls. First, the attack surface. Open-redirect typically plays out as: (a) a phishing site links to http://attacker.com/login?next=https://qq.com, which does not involve us; (b) attackers use us as a springboard like https://qun.qq.com/api/auth?redirect=https://attacker.com, which we must block; (c) nested spoofing such as https://qq.com@attacker.com or https://qq.com.attacker.com where host parsing is error-prone. Second, checkurl subhost mode requires the final part of the host to match one of the rules (subdomain friendly). Internally it uses new URL and compares hostname.split('.').slice(-n).join('.') against the whitelist; IDN confusables decoded via punycode are compared after. It also blocks URLs carrying userinfo and raw IPs. Third, the cookie strategy: all three cookies are set with path '/' and maxAge of 30 days; openid is httpOnly false because frontend JS uses it to build URLs and reports, while the other two are httpOnly true. Secure and SameSite are not set explicitly because we live on qun.qq.com where SSL is enforced upstream and SameSite Lax on cross-site redirects would break the embedded game WebView, so we rely on the browser default which aligns with modern Lax behaviour. Fourth, pitfalls. Early on we forgot decodeURIComponent, so encoded redirect values like %2F%2Fattacker.com looked like a path not a host and passed through; decoding first fixed it. checkurl's mode was once set to 'host', which blocked qun.qq.com itself, and subhost only fixed subdomain matching. Finally res.redirect(302, redirect) must come after setHeader('Set-Cookie', ...) or some browsers ignore the cookie.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] pages/api/auth.ts 全文
  - [ ] @tencent/checkurl README 与 subhost 模式说明
  - [ ] OWASP Open Redirect 指南
- 🛠️ Hands-on
  - [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
  - [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单
- ⚠️ Common pitfalls
  - redirect 没 decode 直接校验
  - 把 host 模式当 subhost 用导致误拦
  - Set-Cookie 写在 redirect 之后
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不能直接 /qq\.com/ 正则校验？
  - [ ] IDN 同形异义字符怎么防？
  - [ ] 如果白名单需要支持动态增减你怎么做？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `pages/api/auth.ts`

---

## ⚖️ Trade-off (trade-off) — 1 Q&A

### Q1. You bring in Redux Toolkit plus next-redux-wrapper but only attach one walletSlice. Why stay this minimal?

> Source: `tp-011` · scope: frontend · next-guild · depth: 中级

#### Knowledge points

| Name | Level | Why it matters |
|---|---|---|
| Redux Toolkit slice / configureStore | 必须掌握 | 实现基础。 |
| next-redux-wrapper HYDRATE 流程 | 必须掌握 | SSR 与客户端 state merge。 |
| 状态本地化 vs 全局化决策 | 必须掌握 | 本题核心 trade-off。 |
| Zustand / Jotai 对比 | 加分项 | 选型讨论。 |

#### Tiered answers

**🟢 Elevator**: Most state is page-local; SSR props plus component useState suffice. Only the wallet gift detail needs cross-page reuse, so only it lives in the store.

**🔵 Standard** (default):

src/store/store.ts defines makeStore = () => configureStore({ reducer: { [walletSlice.name]: walletSlice.reducer }, devTools: true }) and exports wrapper via createWrapper<AppStore>(makeStore) for next-redux-wrapper. walletSlice has exactly one giftDetail field and one setWalletState reducer, handling the gift-detail hand-off between the gift page and the income page. Every other piece of state is either injected once via getServerSideProps props or handled through useState plus props, with a few scenarios using window.sessionStorage. We have no global tree that needs to rerender wholesale, so we avoid Provider-subscription overhead. The restraint also pays off because, in the hybrid game-WebView scenario, a page may be killed and relaunched in a new session; next-redux-wrapper's HYDRATE is only meaningful on SSR, so the thinner the dependency the easier to maintain.

<details><summary>🔴 Deep dive (click to expand)</summary>

Four angles: why Redux at all instead of component state, the HYDRATE details with next-redux-wrapper, the trade-off against Zustand / Jotai, and future evolution. First, even with one slice Redux exists because gift detail has to travel from page A to B; the QQ Guild WebView's router may reuse or recreate the previous page instance on jump, URL-query JSON is ugly and localStorage bleeds across sessions. A Redux store sits as a stable singleton within the KeepAliveProvider lifecycle, which is a great fit. Second, next-redux-wrapper HYDRATE: makeStore runs on SSR, its state ships via __NEXT_DATA__ and the client wrapper receives a HYDRATE action to merge. walletSlice has no extraReducers for HYDRATE because giftDetail need not persist across sides (it is user-initiated local state and SSR is always empty); if the backend ever SSRs the gift-detail page, we would add a HYDRATE case. Third, Zustand/Jotai are lighter and Provider-less and match the project's minimalist tone, but next-redux-wrapper HYDRATE on Pages Router SSR is the mature choice, and Redux Toolkit's immer-plus-slice syntax keeps cognitive load low in team work. The project picked Redux early and kept it; no compelling gain to switch. Fourth, evolution: if state stays restrained I might fold walletSlice into a React Context and drop Redux; if new cross-page state in the signing centre appears, we add another slice rather than refactor.

</details>

#### Learning plan

- 📚 Must-read
  - [ ] src/store/store.ts 与 src/store/wallet.ts
  - [ ] next-redux-wrapper 官方 HYDRATE 文档
  - [ ] Redux Toolkit slice / extraReducers 章节
- 🛠️ Hands-on
  - [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
  - [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性
- ⚠️ Common pitfalls
  - 把本应是页面 state 的内容也放 store
  - 忘记 HYDRATE 导致 SSR 拿到的数据被覆盖
  - 多个 wrapper 实例冲突
- 🤔 Self-check questions (answer without notes)
  - [ ] 为什么不直接上 Zustand？
  - [ ] 如果 store 规模增长你怎么演进？
  - [ ] HYDRATE 对客户端初次渲染有哪些副作用？
- ⏱️ Estimated time: **3-4 小时**


#### Evidence

- `src/store/store.ts`
- `src/store/wallet.ts`

---

