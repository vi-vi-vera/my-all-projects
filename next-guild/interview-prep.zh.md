# QQ 频道 Hybrid H5 (next-guild) — 面试备战材料

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | emoji |
|---|---|---|
| feature       | 1      | 🧩 |
| architecture  | 2 | 🏗️ |
| performance   | 1  | ⚡ |
| reliability   | 1  | 🛡️ |
| observability | 2| 📈 |
| trade-off     | 1 | ⚖️ |
| security      | 2     | 🔒 |

## 🎯 项目自我介绍

### 一句话（简历版）

QQ 频道的 Hybrid H5 门户，Next.js 15 Pages Router + TypeScript，BFF 路由表映射 oidb，内嵌 MSDK 游戏 WebView。

### 标准（30–60 秒）

next-guild 是 QQ 频道相关的 Hybrid H5 门户，覆盖签约中心、创作者钱包、违禁词、礼物榜、游戏频道聚合页等多条线，既跑在 QQ 内置 WebView，也跑在 MSDK 游戏 WebView。技术栈是 Next.js 15 Pages Router + TypeScript 4.9 + Redux Toolkit（只挂 walletSlice）+ antd-mobile + @tencent/exeditor3。架构上前端做三件事：一是 middleware.ts 在 /game-* 路径做 openid/access_token/appid 三件套 cookie 守卫，缺失就带回跳参数 302 到 /api/auth 解密 itopencodeparam 并 httpOnly 下发 cookie；二是 pages/api 两个 [...slug] 路由分别做 axios stream 透传代理与 path2cmdAndServiceType 映射后调 rpcsdk oidbRequest，把「后端协议名」收敛成「前端一张表」；三是 src/server-side 的 trpc.withLog 泛型封装，在 getServerSideProps 里统一注入 OpenTelemetry traceparent、IsDev 代理和 retCode 异常抛出。观测有 Aegis RUM + reportWebVitals + 大同 universal-report 三通道，后端有 log4js dateFile + @tencent/atta UDP 双通道。发版用 Orange CI 跑 master tag_push 和 test push 两条流水线，test 环境直接 stke:update 自动滚动发布到 TKE，正式走手动更新镜像。

### 深挖（2–3 分钟）

<details><summary>展开</summary>

next-guild 的定位是「QQ 频道业务的对外 H5 门户 + 游戏内 MSDK H5」，既要承受 QQ 客户端里的普通浏览场景，也要承受游戏 WebView 里的嵌入场景，所以整套工程在路由、请求、认证、样式四个层面都做了混合适配。路由上我们选 Next.js 15 Pages Router 加一个很薄的边缘中间件：中间件只拦游戏前缀路径做三件套 cookie 守卫，其它走正常页面，应用壳用 react-next-keep-alive 包裹组件做列表回详情的状态保留。请求层有三条独立路径：通用网关走频道的 http2rpc 网关自动带 bkn，频道网关走 oidb 协议同样带 bkn，游戏场景的内部接入走 msdk 内部桥接并在拦截器里自动把业务必备的三个查询参数拼到链接上；业务层一行条件表达式完成分发。认证链条是从中间件进入授权接口，授权接口用 msdk 解密拿到三件套用户凭证，再用 checkurl 以子域名白名单校验回跳地址，校验通过才用仅服务端可见的方式下发 cookie，并把浏览器回跳到用户原本要访问的页面。后端桥接最核心的是那一张两百多条的路径到命令字与服务类型的映射表，把冗长的后端路径名映射成两个短短的字段，交给内部包去拼 oidb 请求包；前端新增接口只需要加一行表项。观测上页面壳初始化 Aegis 接运行时用户监控，导出 Next 的 web-vitals 把性能指标推到大同的事件上报通道，大同这一侧则规范了页面进入、页面离开、曝光、曝光结束、点击五个标准事件名。服务端日志通过 log4js 以结构化 json 落到按日滚动的本地文件，字段里注入用户标识、链路追踪号、请求路径与耗时；atta 走 udp 再把同一份日志以字段数组形式推到聚合平台，两条通道相互解耦。发版走 Orange CI 的两条流水线：主分支打 tag 会构镜像、推仓库、企微广播、生成变更记录并建 release，但不自动发布生产；测试分支一经推送即先做主干合并校验，再构测试镜像并自动滚到 TKE 集群完成无人值守部署。Dockerfile 基于 Node 20 Alpine，构建期显式把 v8 堆上限调到 4 GB 避免 Next 构建内存爆栈，再通过一组 ARG 把环境、版本、部署目标注入镜像。

</details>

## ✨ 项目亮点

- **middleware.ts 在边缘做 /game-* 路径的 cookie 三件套守卫**（security · fullstack）
  middleware 只拦 /game- 前缀，缺失 openid/access_token/appid 就带 itopencodeparam/gameid/channelid + redirect 回跳参数 302 到 /api/auth；这样业务页拿到请求时 cookie 一定齐全，无需每个 page 都手写授权分支。
  > 关键词：`next-middleware` · `edge-guard` · `cookie-trio` · `redirect`
- **/api/auth 用 rpcsdk.msdk.decrypt + @tencent/checkurl 做授权兑换与防开放重定向**（security · fullstack）
  /api/auth 收到带 itopencodeparam 的请求后先用 rpcsdk 的 msdk.decrypt 解密拿到 openid/access_token/appid，再用 @tencent/checkurl 以 subhost 模式校验 redirect 是否属于 qq.com/tencent.com，避免被开放重定向利用；通过后 httpOnly 下发 cookie 并 302 回原 URL，winston 只记 info 级日志。
  > 关键词：`msdk-decrypt` · `checkurl` · `open-redirect` · `httpOnly` · `winston`
- **pages/api/v2/[...slug].ts：200+ 条 path2cmdAndServiceType 静态表把 BFF 收敛成一处**（architecture · fullstack）
  200 多个 trpc.xxx.xxx/HandleProcessN 的后端协议 path 在前端一张表里映射为 cmd 和 serviceType 两段（用下划线编码 _N 的重载），支持客户端用 x-oidb 请求头覆写 serviceType，最后交给 rpcsdk oidbRequest 去拼 oidb 包；前端开发新增接口只改这张表，不再一个 BFF 文件对一个接口。
  > 关键词：`bff` · `path-mapping` · `oidb` · `x-oidb` · `table-driven`
- **三类 axios 实例 + isInMSDK 分发，业务代码零感知**（architecture · frontend）
  src/common/ 下 request（gotrpc 网关，带 bkn）、oidbRequest（频道网关，带 bkn）、msdkRequest（MSDK 游戏 WebView，拦截器自动拼 itopencodeparam/gameid/channelid）三份实例；业务页一行 const request = isInGameWebview ? msdkRequest : oidbRequest; 就把差异压下来，后续只写 request.post(path, params) 无需关心跑在哪。
  > 关键词：`axios` · `isInMSDK` · `interceptor` · `env-dispatch`
- **src/server-side/trpc.withLog 通用 SSR trpc 封装 + OpenTelemetry traceparent**（observability · fullstack）
  withLog<T,R> 接 trpc proxy 方法，自动注入 option.context.traceparent（按 W3C trace-context 拼 00-traceId-spanId-01），IsDev 下打开 proxy=1，retCode!=0 或 error.code!=0 直接抛 JSON.stringify(error)；getLogger() 用 log4js addContext('trace', traceId) 和请求一对一串，让 SSR 链路可追。
  > 关键词：`trpc` · `withLog` · `traceparent` · `opentelemetry` · `ssr`
- **日志双通道：log4js dateFile + @tencent/atta UDP**（observability · backend）
  log4js 以 json layout 把 uid/trace_id/path/cost 字段注入 /data/log/project/log/global.yyyy-MM-dd.log，保留 3 份；atta 通道按字段数组 [project, level, ip, uid, ctx, payload, trace, env] 走 UDP 到 04900055524，两条通道解耦：atta 不可用本地日志仍在，本地盘满时 atta 仍能聚合。
  > 关键词：`log4js` · `atta` · `udp` · `json-layout` · `dual-channel`
- **前端监控三通道：Aegis RUM + reportWebVitals + 大同**（observability · frontend）
  _app.tsx 里用 Script beforeInteractive 加载 aegis.min.js，再 new window.Aegis({ spa: true, reportApiSpeed, reportAssetSpeed }) 接 RUM；导出 reportWebVitals 把 LCP/FID/CLS/web-vital 推到 baseReport 写大同 /analytics/v2_upload；另一条 universal-report 走 beacon，STANDARD 枚举统一页面进入/离开/曝光/曝光结束/点击五个事件名。
  > 关键词：`aegis` · `web-vitals` · `datong` · `universal-report` · `rum`
- **MSDK WebView 桥接：iframe src=__bridge_loaded__ 唤起回调**（feature · frontend）
  iOS MSDK 没有标准 jsbridge，我们用一个 display:none 的 iframe src=https://__bridge_loaded__ 触发原生回调 WVJBCallbacks，拿到 bridge.callHandler 后再 msdkCall 做 setScreenOrientation/setFullScreen/closeWebView；Android 直接 prompt(data) / alert 走协议字符串。copyText 里还用正则把 @{uin:xxx,nick:yyy} 还原成 @yyy 再写剪贴板。
  > 关键词：`msdk` · `webview-bridge` · `iframe` · `ios` · `copy-text`
- **Orange CI 双流水线：master tag_push 构镜像 + test push 自动 stke:update**（reliability · infra）
  $.tag_push 跑 docker login + build + push 双 tag（time + latest） + 企微通知 + git:comment + git:changeLog + git:release，一条龙把发版自动化；test.push 则是 git:rebaseCheck 保证合过主干，构建 nextguild_test 后 stke:update 自动滚到 ns-prjftchp-1605051-test 的 StatefulSetPlus/next-guild-test，test 环境完全免手动。
  > 关键词：`orange-ci` · `docker` · `stke` · `tke` · `release-automation`


## 🏗️ 架构（architecture）— 2 题

### Q1. pages/api/v2/[...slug].ts 里那张 200+ 条的 path 到 cmd 映射表你们是怎么设计的？为什么不每个接口写一个 BFF 文件？

> 来源：`tp-003` · scope: fullstack · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Next.js catch-all API route ([...slug]) | 必须掌握 | 路由骨架。 |
| oidb 协议 cmd + serviceType 模型 | 必须掌握 | 解释映射表为什么正好是 cmd_serviceType 结构。 |
| 表驱动设计 (table-driven) vs 代码驱动 | 必须掌握 | 抽象模式。 |
| @tencent/rpcsdk oidbRequest 入参 | 加分项 | 知道 payload / rpcContext / cookies / extra.ip 的作用。 |

#### 三档回答

**🟢 一句话**：一张静态表 path2cmdAndServiceType，把后端 trpc 路径映射成 cmd + serviceType，catch-all 路由一处调用 rpcsdk oidbRequest；新接口只加表项，不加文件。

**🔵 标准**（默认）：

pages/api/v2/[...slug].ts 是 Next.js 的 catch-all API route，拿到 req.query.slug 之后我们把它最后两段 join('/') 当作查询 key，比如 slug=['trpc.group_pro.cmd0xf57.GetGuildInfo','HandleProcess125']，拼出 last2='trpc.group_pro.cmd0xf57.GetGuildInfo/HandleProcess125'，再在表里查到 cmdAndServiceType='0xf57_125'，用下划线拆成 cmd='0xf57'、serviceType=125；客户端还可以通过 x-oidb 请求头（形如 {"uint32_service_type": 8}）覆写 serviceType，表里写的是默认值。最后调 @tencent/rpcsdk/dist/lib/node-common/sdk/oidbRequest 把 payload / rpcContext / cmd / serviceType / logger / cookies / extra.ip 交出去，等 oidbRes 回来再 res.status(200).json(oidbRes)。不写多个文件的核心原因是：oidb 协议本身是「按 cmd 路由 + serviceType 区分子命令」的，200 多个接口的 BFF 代码长得几乎一模一样，只是 cmd/serviceType 两个字段不同；映射成一张表就把冗余降到零，对齐的也正是 oidb 的协议模型。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么表驱动」、「具体实现细节」、「映射里那些 HandleProcess12x 的下划线后缀」、「踩过的坑」四个角度讲。第一，为什么表驱动。给每个接口写一个 BFF 文件最大的问题是「99% 重复代码 + 1% 差异」，差异只在 cmd、serviceType、payload 校验三点；我们连 payload 校验都下沉到 oidbRequest 里做（它会根据 cmd 查 proto schema 校验），所以文件维度根本不必要。同时表本身也是接口的「目录」，新人看一眼就知道项目里到底接了哪些后端服务，比翻目录好用。第二，具体实现。拿到 req 后我们先读 cookies.openid 写日志 context，然后 req.query.slug 是一个 string[]，由 Next.js 按路径段拆分；我们固定取最后两段是因为前面可能有版本/租户前缀，而后两段是「服务名 / 方法名」。查到的字符串用 split('_') 拆，[cmd, serviceType=2] 这种解构默认值 2 保证表项只写 '0xf57' 时仍能跑。第三，HandleProcess1/8/10/125 这些后缀表示 oidb serviceType 的重载，例如 0xf57_1、0xf57_125 都是 GetGuildInfo 但底层 serviceType 不同、业务语义也不同。所以我们的表键必须包含 HandleProcessN，因为同一 cmd 下 N 不同对应不同的下游处理逻辑。第四，踩过的坑。一是早期表键是完整 path，客户端一旦改了前缀（比如从 /qunng/next/h5/api/v2/trpc... 变成 /qunng/next/h5/api/v2/foo/trpc...）就全挂；改成固定取 slice(-2) 之后就稳了。二是 x-oidb 的 JSON parse 没 try-catch，客户端传了非法 JSON 就直接 500，后来包一层 try-catch、parse 失败只记 logger.error 不影响默认 serviceType。三是 cookies 透传：rpcsdk 的 oidbRequest 依赖 cookies 拿 skey/pskey 鉴权，所以我们把 req.cookies 原样 passthrough 不做裁剪；裁剪过一次把 skey 过滤掉，鉴权全挂。

</details>

#### 补齐方案

- 📚 必读
  - [ ] pages/api/v2/[...slug].ts 全文
  - [ ] src/common/msdkRequest.ts
  - [ ] Next.js catch-all & dynamic API route 文档
- 🛠️ 动手
  - [ ] 用表驱动重写一个 10+ 接口的 mock BFF
  - [ ] 为 x-oidb 覆写加一个 JSON schema 校验
- ⚠️ 常见踩坑
  - 把完整 path 当 key 导致前缀不稳
  - x-oidb parse 无 try-catch
  - 裁剪 cookies 破坏下游鉴权
- 🤔 自测题（合上文档自答）
  - [ ] 表越来越大怎么管理？要不要拆文件？
  - [ ] 新增接口的 review 流程是什么？
  - [ ] 如果后端加新 serviceType 前端怎么跟？
- ⏱️ 预估学习时长：**3-5 小时**


#### Evidence

- `pages/api/v2/[...slug].ts`
- `src/common/msdkRequest.ts`

---

### Q2. 你们在 src/common/ 下有三个 axios 实例（request / oidbRequest / msdkRequest），为什么不统一成一个？isInMSDK 是怎么决定走哪个的？

> 来源：`tp-005` · scope: frontend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| axios 实例与拦截器分层 | 必须掌握 | 理解为什么一个网关对应一个实例。 |
| WebView 环境探测（UA / bridge / feature） | 必须掌握 | isInMSDK 的实现空间。 |
| BFF 与前端参数透传策略 | 必须掌握 | query vs header 的选择。 |

#### 三档回答

**🟢 一句话**：三个 baseURL 和拦截器都不同：走哪个网关、要不要带 bkn、要不要在 URL 上拼 itopencodeparam。isInMSDK 判 UA 决定。

**🔵 标准**（默认）：

三个实例分工是：通用 request 走 http2rpc 网关路径，参数里自动挂 bkn；oidbRequest 走频道网关路径，参数里同样带 bkn；msdkRequest 走内部桥接路径，请求拦截器会自动从当前地址的查询串里取出三个业务必备参数，并根据链接里有没有问号动态选择分隔符拼到请求链接末尾。业务层选实例的方式是：在页面模块顶层加一行条件表达式，根据当前是否处于游戏场景拿到正确的那一份，后续所有接口调用保持一致写法，无需关心自己跑在哪个宿主。判定函数放在 os 工具里，项目当前把它固定返回真（意味着所有场景都走游戏侧处理），历史上它曾根据用户代理字符串匹配游戏内嵌环境的标识位。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么拆三份」、「MSDK 拦截器为什么拼在 URL」、「isInMSDK 当前固定 true 的含义」、「踩过的坑」四个角度讲。第一，拆三份不是过度设计，而是三类后端网关模型不同：http2rpc 需要 bkn 但接的是统一 http2rpc 协议；oidb 也要 bkn 但走的是频道系自己的 gotrpc 入口 cmd 不一样；MSDK 场景下用户在游戏 WebView 里，是另一套 cookie 体系（openid/access_token/appid 是 /api/auth 下发的），不能带 bkn，反而要每次把 itopencodeparam/gameid/channelid 透传，这是 msdkRequest 的拦截器的职责。如果统一成一个实例你必然要在每次调用处再写分支，反而更乱。第二，为什么把 itopencodeparam 拼在 URL 而不是 header。因为 BFF 那一层（pages/api/v2/[...slug].ts）最终要用 oidbRequest 再打后端，而这一层是 Next.js 的 serverless handler，它通过 req.query 拿参数更直接；header 虽然更「RESTful」，但需要后端 BFF 再显式 req.headers.get 和透传，维护成本反而高。第三，isInMSDK 当前固定返回 true 是一个业务决策：项目后期所有场景都走 MSDK 的授权体系（游戏 WebView 和普通 WebView 都受益于统一的 openid/access_token/appid）之后，不再需要两套路径。不过历史 UA 判定代码还保留着作为逃生口，未来如果需要对某些场景回退到非 MSDK 走 oidb 时一行就能打开。第四，踩过的坑。一是拦截器里 config.url?.includes('?') 用来判断要不要补 '?'，但如果 baseURL 带尾部 '/' 而 config.url 又是相对路径，拼出来可能是 '/api/v2//...&...'，解决办法是统一 baseURL 不带尾 '/'。二是 URLSearchParams 取值为空时返回 '' 不是 null，所以三个参数都要用 || '' 兜底。三是历史上 isInMSDK 根据 UA 判但 UA 在游戏内被某些机型改得不规范，误判率高，所以才把它收敛成固定 true。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/common/request.ts / oidbRequest.ts / msdkRequest.ts
  - [ ] src/utils/os.ts
  - [ ] pages/api/game-guild.ts 顶部的 request 选择逻辑
- 🛠️ 动手
  - [ ] 为 msdkRequest 加一个 response 拦截器统一处理 retcode
  - [ ] 实现一个 feature-detect 版 isInMSDK
- ⚠️ 常见踩坑
  - baseURL 尾 '/' 导致双斜杠
  - isInMSDK 仅靠 UA 判误判率高
  - 把 bkn 误加到 msdkRequest 后端拒绝
- 🤔 自测题（合上文档自答）
  - [ ] 如果新增一类场景，你会加第四个实例还是复用？
  - [ ] 为什么不用 fetch？axios 的增益是什么？
  - [ ] msdkRequest 响应失败怎么统一兜底？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/common/request.ts`
- `src/common/oidbRequest.ts`
- `src/common/msdkRequest.ts`
- `pages/api/game-guild.ts`
- `src/utils/os.ts`

---

## 🧩 功能（feature）— 1 题

### Q1. 游戏内 WebView（MSDK）你们是怎么和原生通信的？为什么 iOS 要用一个 iframe？

> 来源：`tp-009` · scope: frontend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| WKWebView decidePolicyForNavigationAction 拦截 | 必须掌握 | iframe jsbridge 的原生原理。 |
| iOS/Android 协议枚举差异 | 必须掌握 | 跨端封装要点。 |
| WVJBCallbacks 队列模型 | 必须掌握 | 竞态处理。 |
| Clipboard API 兼容 (execCommand copy) | 加分项 | copyText 的历史兼容。 |

#### 三档回答

**🟢 一句话**：iOS 没标准 jsbridge，用 display:none 的 iframe src=__bridge_loaded__ 触发原生注入 WebViewJavascriptBridge，拿到 callHandler 后才能调 MSDKCall。

**🔵 标准**（默认）：

判定函数识别苹果系列的设备，包括平板、手机、随身听以及新一代装有触屏的苹果桌面，视作苹果平板。苹果平台下我们先做桥接初始化：如果全局已经有桥接对象就直接回调；如果已经存在待回调队列就压入等待通知；两者都没有就自己创建队列，然后创建一个无显示样式的内嵌框架，把链接地址设成原生约定好的一个特殊协议载荷地址，插入到文档根上，在下一次事件循环里再把它移除。这个内嵌框架的链接是苹果游戏套件约定的信号，原生层看到这个请求就把桥接函数注入到全局。拿到桥接函数之后我们通过一个统一封装发出一段结构化文本协议，里面带着方法名和参数。安卓侧没有这种桥接限制，直接用提示框或警告框就会被原生层拦截，所以同一套封装在安卓下退到提示框或警告框，协议文本完全一致。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么 iOS 要 iframe 而不是 URL scheme」、「setupWebViewJavascriptBridge 的竞态处理」、「屏幕方向/全屏的封装」、「踩过的坑」四个角度讲。第一，iframe vs URL scheme。iOS 很多 WebView 社区 jsbridge 都是用 location.href='schema://...' 来通知 native，但这种方案 2019 年以后在部分 iOS 版本里会被 WKWebView 吞掉，并不可靠；MSDK 选择 iframe.src='https://__bridge_loaded__' 是因为它是一个可被 WKNavigationDelegate 拦截的 decidePolicyForNavigationAction 请求，native 识别 host 是 __bridge_loaded__ 就 inject bridge 并 cancel 这个请求，对业务侧完全无感。第二，竞态处理。业务代码调 msdkCall 的时机可能早于 bridge 就绪，所以 setupWebViewJavascriptBridge 支持三种情况：bridge 已在、bridge 待在（WVJBCallbacks 队列）、bridge 未在（我们是第一个）。第三种才创建 iframe。这保证多次调用 msdkCall 都不会重复创建 iframe，第二次调用时 bridge 已经在了直接走。第三，屏幕方向封装：setLandscapeScreen 在 iOS 传 screenOrientation:'3' 在 Android 传 '6'，是因为两端原生协议的枚举不一致；setLandscapeFullScreen = await setLandscapeScreen() + setFullScreen()，因为两个命令本身是独立的，而『全屏但竖屏』『横屏不全屏』业务都有场景，拆开更灵活。copyText 里的 @{uin:xxx,nick:yyy} 正则还原是因为频道场景内 at 人是结构化存储，复制到外部剪贴板时要退回可读的 @昵称。第四，踩过的坑。一是 Android 的 prompt 在某些机型被系统屏蔽没弹出 native handler，改成 alert 解决；但 alert 会弹 UI 的问题，有的版本把协议字符串打在 native 层并返回 undefined，体验不完美但能跑。二是 iframe 没 append 到 documentElement 而是 body 上时，在 document.readyState==='loading' 阶段 body 还没有，会抛错；改成 documentElement 以绕过。三是 setTimeout 0 移除 iframe 有极低概率比 iOS 注入还快，导致 bridge 还没就绪就被撤，我们线上没遇到，但规避办法是 setTimeout 50 或者用 MutationObserver 观察 window.WebViewJavascriptBridge 就绪才移除。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/utils/msdk.ts 全文
  - [ ] src/utils/os.ts 中 isiOS / isInMSDK
  - [ ] MSDK iOS/Android 官方 bridge 接入指南
- 🛠️ 动手
  - [ ] 自写一个 iOS jsbridge，用 iframe 触发 WKNavigationDelegate
  - [ ] 把 copyText 改成 Clipboard API 优先 + execCommand fallback
- ⚠️ 常见踩坑
  - iframe 插 body 抛错
  - prompt 被 Android 屏蔽
  - 重复创建 iframe 导致 bridge 被重置
- 🤔 自测题（合上文档自答）
  - [ ] bridge 未就绪前业务调用怎么兜底？
  - [ ] 为什么不用 window.webkit.messageHandlers？
  - [ ] copyText 在 HTTPS 场景下能否用 Clipboard API？
- ⏱️ 预估学习时长：**4-6 小时**


#### Evidence

- `src/utils/msdk.ts`
- `src/utils/os.ts`
- `pages/_app.tsx`

---

## ⚡ 性能（performance）— 1 题

### Q1. postcss-px-to-viewport 你们用 viewportWidth=1284 做基线，还 exclude 了 GameGuild 相关目录。为什么要这么配？

> 来源：`tp-012` · scope: frontend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| postcss-px-to-viewport 核心配置 | 必须掌握 | 回答主线。 |
| viewportWidth 与设计稿的关系 | 必须掌握 | 解释 1284 选择。 |
| selectorBlackList / exclude 两层 opt-out | 必须掌握 | 工程实务。 |
| Next.js CSS code-split | 加分项 | 与 purgecss 取舍的上下文。 |

#### 三档回答

**🟢 一句话**：普通 H5 以 iPad 设计稿 1284 宽为基线转 vw，保持跨屏一致；GameGuild 目录按自家尺寸硬写，所以整体排除。

**🔵 标准**（默认）：

postcss.config.js 里 postcss-px-to-viewport 的关键配置：viewportWidth: 1284（对齐设计稿的 iPad 宽度，vw 基线）、unitPrecision: 3、viewportUnit: 'vw'、selectorBlackList: ['.ignore','max-view']、minPixelValue: 1、mediaQuery: false；exclude 是正则数组 [/GameGuildMain/, /game-guild-main/, /GameGuildDetail/, /game-guild-detail/, /GameGuildComponents/]，大小写都覆盖。这样写的原因：第一，QQ 频道 H5 多数场景在 iPad 内嵌 WebView 展示，设计稿给的 1284 宽；在 iPhone 上 vw 自动缩放体验一致。第二，GameGuild 三个目录是游戏频道聚合页，UI 由各游戏业务单独设计，尺寸是固定像素级，不能被 viewport 单位等比缩放，否则在宽屏设备上按钮会变得很大；所以从 postcss 这一层整体排除，让这几个页面保持 px。第三，selectorBlackList 里 .ignore 和 max-view 是给少数需要保留 px 的类逃生用的（比如库组件），配合 exclude 形成『目录级 + 类级』双层 opt-out。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么是 1284 而不是 750/375」、「vw 基线下的首屏与包体积」、「目录级 exclude 的工程代价」、「踩过的坑」四个角度讲。第一，传统移动端常用 750 或 375 宽做 vw 基线，我们选 1284 是因为 QQ 频道的主要承载设备里包含 iPad 和横屏 WebView，设计稿就是 1284 宽；在 iPhone 上 vw 自动缩小一样可用。这意味着同一 px 值在 1284 宽设备上最接近设计稿（1:1），在更窄屏上被等比压缩。第二，首屏和包体积的关系。postcss-px-to-viewport 在编译期把所有 px 改成 vw，生成的 CSS 体积略大（字符更长）但带来更好的跨端表现，且 Next.js 的 CSS code-split 本来就按 route 拆，GameGuild 这种大页不会污染其它页面。我们没启用 @fullhuman/postcss-purgecss（配置里注释掉了），因为 antd-mobile + exeditor3 的 class 名部分是运行时生成，purge 风险大于收益；首屏性能主要靠 Next.js 的 RSC 风格 dynamic import（虽然 Pages Router 用的是 next/dynamic）和 Aegis 监控 LCP 来把关。第三，目录级 exclude 的代价是：GameGuildMain 和 game-guild-main 两种写法都要列，大小写和连字符可能被漏；我们在 postcss 里写了 5 条正则 + 在 package 目录也约定任何新增的游戏频道聚合页必须放在 GameGuild* 前缀下；这是一个社会约定层面的契约，比纯技术隔离脆弱但也现实。第四，踩过的坑。一是早期 selectorBlackList 只有 ['.ignore']，有个组件在 .max-view 下需要保持 px 结果被转 vw，改成两条解决。二是 unitPrecision 最早是 5 产生很长的小数 0.12345vw，浏览器渲染性能有极小开销，调成 3 更干净。三是 mediaQuery 一开始开着，@media 里的 px 也被转 vw 导致断点计算错乱，关掉后媒体查询恢复正常。

</details>

#### 补齐方案

- 📚 必读
  - [ ] postcss.config.js
  - [ ] postcss-px-to-viewport 官方文档
  - [ ] GameGuild* 目录下任意一个 .scss
- 🛠️ 动手
  - [ ] 搭一个 1284 基线 demo 并对比 750 基线在 iPhone 上的实际渲染
  - [ ] 为某个目录配 exclude 并写一个 lint 验证被排除
- ⚠️ 常见踩坑
  - mediaQuery 开启导致断点错乱
  - selectorBlackList 漏列
  - exclude 没覆盖大小写与连字符两种目录命名
- 🤔 自测题（合上文档自答）
  - [ ] viewportWidth 怎么选？你项目是 1284，别家为什么是 750？
  - [ ] vw 基线的极端窄/宽屏表现如何？
  - [ ] 何时应该启用 purgecss？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `postcss.config.js`

---

## 🛡️ 可靠性（reliability）— 1 题

### Q1. Orange CI 里 master 的 tag_push 和 test 的 push 两条流水线你们是怎么分工的？test 环境怎么做到推一下就自动更新？

> 来源：`tp-013` · scope: infra · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Orange CI YAML 触发器 (tag_push / push / pr) | 必须掌握 | 流水线划分的语法基础。 |
| Docker 双 tag 策略 (time + latest) | 必须掌握 | 可溯源与便利的平衡。 |
| TKE StatefulSetPlus 滚动发布 | 必须掌握 | production 部署模型。 |
| git:rebaseCheck / git:changeLog / git:release 内建步骤 | 加分项 | Orange CI 生态组件。 |

#### 三档回答

**🟢 一句话**：master tag_push 只构镜像发 release 不发布，正式发布手动；test push 跑 rebaseCheck + 构镜像 + stke:update 自动滚 TKE StatefulSetPlus。

**🔵 标准**（默认）：

两条流水线在 .orange-ci.yml 里用 YAML 顶级 key 区分：$:tag_push 是 master 打 tag 时跑的，流程是 docker login -> 生成 DOCKER_TIME_TAG（csighub.tencentyun.com/abcmouse/nextguild:<branch>_<时间>_<commit>） + DOCKER_LATEST_TAG -> docker build -> docker push 两 tag -> 企微消息 + git:comment 把镜像名回传 PR -> git:changeLog 从 CHANGELOG.md 抓最新段落 -> git:release 把它作为 Release Notes；整个过程不触发线上部署，production 仍需要手动到 kubernetes.woa.com 更新 StatefulSetPlus 镜像（README 里有链接）。test:push 是往 test 分支推代码时跑的，开头加 git:rebaseCheck 确保合过主干，后面 docker build/push 到 nextguild_test 镜像，最后一步 stke:update 用 v4 kubernetes 的 URL ns-prjftchp-1605051-test 的 StatefulSetPlus/next-guild-test，传入新 image 就自动滚动发布。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么正式发布不自动」、「双 tag 策略的动机」、「rebaseCheck 的意义」、「踩过的坑」四个角度讲。第一，正式发布保持手动是有意为之：频道业务的正式环境接的是真实 QQ 用户，灰度/回滚是重要能力；kubernetes.woa.com 的 StatefulSetPlus 支持『滚动发布/自动分批』两种模式，业务评估后选哪种；自动 push 镜像到 registry 是安全的（给运维看），但谁按下部署按钮必须有人工确认。第二，双 tag（time + latest）的动机：time tag 是不可变的，用于回滚（随时可精确还原某一时刻的镜像）；latest 是便利性，pipeline 后续 stage 可以用它而不用传变量。二者并存的代价是 storage 占两份，收益是「可溯源 + 可一键部署」同时满足。第三，rebaseCheck 用 Orange CI 内置 type: git:rebaseCheck 来保证 test 分支必须基于最新 master；没有这步，test 环境可能构出一个没有合最新修复的镜像，上了之后重现线上 bug 就很尴尬。第四，踩过的坑。一是 DOCKER_LATEST_TAG 在并行 pipeline 下会竞争，两次 push 同时跑时 latest 可能指向错的那个；后来把关键部署决策始终按 time tag 走，latest 仅作为 smoke-test 的快捷方式。二是 git:changeLog 依赖 CHANGELOG.md 格式规范，以前 standard-version 生成格式变过一次导致 release notes 空掉；现在 release 脚本固化了 standard-version preset。三是 stke:update 偶尔因 TKE API 超时失败，Orange CI 不会自动重试，需要手动点重跑，后来给那一步加了 timeout 和 retry 配置。

</details>

#### 补齐方案

- 📚 必读
  - [ ] .orange-ci.yml 全文
  - [ ] Dockerfile
  - [ ] README.md 里正式发布段落
- 🛠️ 动手
  - [ ] 为当前项目加一个 smoke-test stage 在 push 后跑
  - [ ] 为 stke:update 步骤加 retry 并写一段 fallback 告警脚本
- ⚠️ 常见踩坑
  - 并发 push 下 latest tag 竞争
  - CHANGELOG 格式变更导致 release notes 空
  - production 误开 stke:update 自动部署
- 🤔 自测题（合上文档自答）
  - [ ] 为什么 production 不自动部署？
  - [ ] 如果要加灰度流量切换你会怎么做？
  - [ ] 时区不一致如何影响 time tag？
- ⏱️ 预估学习时长：**3-5 小时**


#### Evidence

- `.orange-ci.yml`
- `Dockerfile`
- `README.md`

---

## 📈 可观测性（observability）— 3 题

### Q1. 你们 SSR 里的 trpc.withLog 是怎么工作的？traceparent 是怎么拼的？有什么好处？

> 来源：`tp-006` · scope: fullstack · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| W3C trace-context (traceparent) | 必须掌握 | 跨服务日志串联的关键协议。 |
| TypeScript 泛型包装异步调用 | 必须掌握 | withLog<T,R> 的签名设计。 |
| log4js context 与 SSR 请求隔离 | 必须掌握 | 每请求实例化 logger、避免 context 被覆写。 |
| @opentelemetry/core RandomIdGenerator / TraceFlags | 加分项 | trace id 与 sampled flag 的来源。 |

#### 三档回答

**🟢 一句话**：withLog 是一个泛型包装，拿 trpc proxy 方法 + 入参，在 option.context 里塞 traceparent 和开发代理，retCode != 0 抛错。

**🔵 标准**（默认）：

withLog<T, R>(func, data, ctx?, logger?) 是 src/server-side/trpc.ts 的默认导出之一。内部做三件事：第一，用 getLogger() 从 log4js 拿当前 request 的 logger，并通过 logger.context.trace 拿到之前挂上去的 traceId；第二，拼 option = { context: { ...ctx, traceparent: getTraceParent(trace) }, timeout: 60000 }，IsDev 下再加 proxy=1 让 trpc client 走本地代理；第三，await func(data, option) 拿到 { retCode, costTime, response, error }，retCode !== 0 或 error?.code !== 0 直接 throw new Error(JSON.stringify(error))，否则 logger.debug 打印耗时和响应并 return response。traceparent 是按 W3C trace-context 规范拼的：`${version}-${traceId}-${spanId}-0${TraceFlags.SAMPLED.toString(16)}` 即 00-<32 位 hex>-<16 位 hex>-01。traceId 来自 @opentelemetry/core RandomIdGenerator；spanId 每次调用新生成。好处是同一次 SSR 的前端日志、atta 日志、trpc 下游日志共用一个 traceId，排查时一搜全链路可见。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么必须是泛型」、「trace 头部各段字段的语义」、「开发代理开关的含义」、「踩过的坑」四个角度讲。第一，为什么必须是泛型。后端协议定义里每个接口都有严格的入参出参类型，如果在封装里不用泛型你只能退回到任意类型然后在每个调用点重复声明，既繁琐又容易把错误类型误传过去。用泛型写完一次以后，业务调用点直接把代理方法绑定后传进来就能自动推断出请求体约束和返回体类型，新增一个接口只需多写一行，完全不用再写类型定义。第二，trace 头部四段字段的语义：第一段是版本号，必须是固定的零零；第二段是贯穿整条调用链路的唯一标识，由三十二位十六进制字符构成；第三段是本次调用产生的小节标识，十六位十六进制；最后一段是一个字节的标志位掩码，最低位置一表示本条链路被采样、后续落到观测平台。我们每次服务端渲染时都生成一个新链路号，每次后端调用再生成一个新小节号；若上游某个请求头已经带了 trace 我们会在日志上下文里找到并复用。第三，开发代理开关。底层客户端识别到上下文里的代理标志位时会切到本地开发跳板地址，这是给内网机器打通外网常见的手段；生产环境绝不能打开，所以用环境变量双保险。第四，踩过的坑。一是早期用「字符串转整数再与零比较」的方式判重试码，不同版本解析行为有差异，后来改成数值严格相等；一段老代码里仍保留原写法作兼容。二是取 trace 为空时忘了用随机生成做兜底，结果传出一个空 trace 被下游直接拒收。三是固定六十秒超时对批量接口不够，后来让封装支持可选超时透传。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/server-side/trpc.ts 全文
  - [ ] src/utils/report.ts 中 getTraceParent 实现
  - [ ] src/server-side/grayGroupInfo.ts / sign.ts 调用样例
- 🛠️ 动手
  - [ ] 给一个 mock 异步函数套上 withLog 并校验 traceparent
  - [ ] 把 retcode 判断从 parseInt 改成严格等值并补单测
- ⚠️ 常见踩坑
  - 忘记 fallback 空 traceId
  - 直接把 ctx 透传而不注入 traceparent
  - 生产环境误开 proxy=1
- 🤔 自测题（合上文档自答）
  - [ ] 上游已经带 traceparent 时你怎么复用？
  - [ ] 如果想加 baggage 字段你怎么扩展？
  - [ ] retCode 的错误怎么分级上报？
- ⏱️ 预估学习时长：**4-6 小时**


#### Evidence

- `src/server-side/trpc.ts`
- `src/server-side/grayGroupInfo.ts`
- `src/server-side/sign.ts`
- `src/utils/report.ts`

---

### Q2. SSR 侧你们日志是怎么写的？为什么要同时用 log4js 和 @tencent/atta？

> 来源：`tp-007` · scope: backend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| log4js appenders / layouts / categories 模型 | 必须掌握 | 回答前置知识。 |
| SSR 并发下的 logger 实例隔离 | 必须掌握 | AsyncLocalStorage / child logger 话题。 |
| UDP fire-and-forget 语义 | 加分项 | atta 为什么选 UDP。 |

#### 三档回答

**🟢 一句话**：log4js 以 json 格式写本地 dateFile 文件，atta 再按字段数组 UDP 推到聚合平台，两条通道解耦。

**🔵 标准**（默认）：

日志初始化放在日志工具模块里：先声明一个自定义的结构化输出格式，把工程名、运行环境、用户标识、链路追踪号、请求路径、耗时这些字段从日志事件上下文里拍平到最外层，再追加写入到按天切分的本地文件，保留最近三份副本；同时挂一个控制台输出便于本地调试。atta 通道的实现是另起一个模块，在进程起时新建实例并初始化成无连接的上报协议；自定义的输出器拿到日志事件后按固定顺序把工程名、等级、来源地址、用户标识、上下文、正文、链路追踪号、运行环境八个字段推到聚合平台，并把所有可能的错误在回调里吞掉一律返回假，保证聚合通道失败时不会反过来让本地写盘链路跟着挂。每个请求都用工具函数拿一个独立的日志实例并挂上本次链路标识，不共享全局单例。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么不共享日志单例」、「结构化输出与上下文的约定」、「聚合通道为什么走无连接协议」、「踩过的坑」四个角度讲。第一，不共享单例是因为日志库默认返回同一个实例，如果在并发服务端渲染场景里多个请求同时挂载相同的上下文字段就会互相覆盖；我们在工具函数里每次都新拿一个引用并挂上链路号，约定链路号是本请求标识；但这个做法在现有日志库版本下其实也不是完全隔离的，更彻底的做法是派生子日志实例加上异步本地存储，那是我们还没来得及补的技术债。第二，结构化输出的字段约定。我们把用户标识、链路号、请求路径、耗时四个字段固化在输出对象的最外层，是因为聚合平台按字段切片做统计，外层命名稳定的字段可以直接建索引；业务额外想记的字段则顺着事件对象原样展开放在后面。第三，聚合通道走无连接协议是因为它是发射即忘的语义，性能好且不会阻塞主链路；丢包是业务能接受的——本地按天切分的文件作为真源，聚合平台作为二次汇总的补充。第四，踩过的坑。一是聚合客户端构造时会占用一个网络套接字，如果在多进程场景下每个工作进程都新建一次很浪费；我们把实例声明放到模块顶层保证只创建一次。二是早期没在上报链上挂住异常回调，聚合失败时会抛出未处理的拒绝让整个节点崩，后来补了一条捕获异常并返回假的兜底。三是自定义输出格式的注册必须早于日志配置调用，否则会静默退化到基础格式，为此我们把两句紧挨着写避免顺序错乱。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/utils/logger/index.ts
  - [ ] src/utils/logger/atta.ts
  - [ ] log4js 官方 layouts 与 context 文档
- 🛠️ 动手
  - [ ] 把 getLogger 改成基于 AsyncLocalStorage 的 child logger
  - [ ] 写一个 atta mock 跑 100 条日志观察 UDP 丢包率
- ⚠️ 常见踩坑
  - 共享全局 logger 单例造成 context 覆写
  - atta send_fields 未 catch 抛 unhandled rejection
  - addLayout 晚于 configure 注册
- 🤔 自测题（合上文档自答）
  - [ ] 并发 SSR 下 trace 字段会不会错乱？
  - [ ] UDP 丢包的业务影响如何评估？
  - [ ] 日志脱敏怎么接入？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/utils/logger/index.ts`
- `src/utils/logger/atta.ts`
- `src/utils/logger/shared.ts`

---

### Q3. 前端监控你们接了 Aegis、Next reportWebVitals、大同三条通道，为什么要这么多？各自职责怎么划分？

> 来源：`tp-008` · scope: frontend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Aegis RUM（spa / reportApiSpeed / reportAssetSpeed） | 必须掌握 | 主监控通道。 |
| Next.js reportWebVitals 机制 | 必须掌握 | 性能指标收集原理。 |
| 大同 universal-report 事件模型 | 必须掌握 | 业务埋点规范。 |
| time-aligned 排障方法论 | 加分项 | 跨通道定位。 |

#### 三档回答

**🟢 一句话**：Aegis 是 RUM（错误/接口/资源），reportWebVitals 抓核心 Web Vitals，大同是业务事件（PV/曝光/点击）。三个目标不同。

**🔵 标准**（默认）：

_app.tsx 里第一步是用 next/script 的 beforeInteractive 策略加载 aegis.min.js，等 useEffect 跑的时候 new window.Aegis({ id: 'RiaWqsnTezUjYcdWpp', spa: true, reportApiSpeed: true, reportAssetSpeed: true, hostUrl: 'https://rumt-zh.com' }) 接上 Aegis RUM，它负责前端错误、接口测速、静态资源测速、PV。同一个 useEffect 里还调 initUniversalReport 初始化大同 SDK，定义 STANDARD 枚举 PGIN/PGOUT/IMP/IMPEND/CLCK 五个事件名，业务侧统一用这些事件上报业务语义（如『群升级弹窗关闭』）。Next.js 的 reportWebVitals 是 _app 里的一个 named export，Next build 后框架会自动把每次页面加载的 LCP/FID/CLS/web-vital 指标传进来，我们 forward 到 baseReport 写到大同 analytics/v2_upload，把 web-vital 和业务事件对齐到同一个平台做分析。

<details><summary>🔴 深挖（点击展开）</summary>

我从「三通道为何不合并」、「负载设计的妥协」、「单页应用开关踩过的坑」、「排障流程」四个角度讲。第一，不合并是因为三个平台的「数据模型」根本不同：运行时用户监控平台偏技术侧自动采集，对脚本错误堆栈、接口耗时做自动聚类并给告警；性能指标走谷歌标准的三维上报，用于性能评估；大同是业务埋点，按页面标识、事件标识、公共参数、业务参数建模，用于漏斗和分流实验。如果合成一个软件开发套件，要么丢掉运行时监控的自动采集能力，要么丢掉业务埋点的语义建模。第二，负载设计的妥协。上报构造里出现了大量形如 艾九十九、艾一零零、艾一零二、艾一一四的魔法字段名，是因为大同上报接口协议就要求公共对象里的字段名必须是这种定长编码；我们在负载构造函数里把用户传入的标签塞到第一个字段、指标名塞到第九十九号、数值塞到第一百号、附带日志塞到第一百一十九号这样固定下来，业务侧再通过工厂函数拿到一个简单的「指标名加数值加可选日志」的接口。第三，单页应用开关会让运行时监控钩住浏览器的历史记录接口自动发页面访问事件，但 Next 的路由切换事件并不会被默认监听；我们实测发现绝大多数路由切换依然能被捕获（因为底层最终还是调了历史记录推入接口），但如果用了替换型路由就会漏，所以业务统一约定用推入型路由。第四，排障流程。线上报错先在运行时监控里查堆栈，再按链路号去聚合平台找服务端日志，按用户标识去本地按天切分的文件里翻更详细的上下文，最后看性能曲线与报错时间是否吻合。这条流程要求三端的时间戳在分钟级对齐，所以我们所有容器都统一到同一个时区。

</details>

#### 补齐方案

- 📚 必读
  - [ ] pages/_app.tsx 中 Aegis/reportWebVitals 初始化
  - [ ] src/utils/report.ts generatePayload 与 A 字段映射
  - [ ] src/utils/datong.ts initUniversalReport 与 STANDARD 枚举
- 🛠️ 动手
  - [ ] 写一个最小 reportWebVitals + 上报 demo
  - [ ] 为大同事件加一个 debug-echo 的转发通道
- ⚠️ 常见踩坑
  - useEffect 早于 Aegis SDK 加载导致 window.Aegis 未定义
  - router.replace 丢失 PV
  - A99/A100 字段混写导致指标错位
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不直接用一个通道？
  - [ ] Web Vitals 在 Hybrid WebView 里准吗？
  - [ ] Aegis 上报失败你怎么发现？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `pages/_app.tsx`
- `src/utils/report.ts`
- `src/utils/datong.ts`

---

## 🔒 安全（security）— 2 题

### Q1. 你们用 Next.js 15 的 middleware 做了什么？为什么只拦 /game-* 这一部分路径，而不是全站？

> 来源：`tp-001` · scope: fullstack · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Next.js 15 middleware 生命周期 | 必须掌握 | 理解边缘函数何时执行、能做什么、不能做什么。 |
| req.cookies API 与 httpOnly/SameSite | 必须掌握 | 三件套 cookie 的可见性与安全策略。 |
| 302 redirect 与回跳参数设计 | 必须掌握 | 授权成功后如何回到原页面。 |

#### 三档回答

**🟢 一句话**：middleware 只在 /game-* 前缀下检查 openid/access_token/appid 三件套 cookie，缺一个就 302 到 /api/auth；其它路径不经过它。

**🔵 标准**（默认）：

middleware.ts 的 pathname 判断 !pathname.startsWith('/game-') 就直接 NextResponse.next() 放行，其余进入守卫分支：检查 openid / access_token / appid 三件套 cookie 是否齐全，任何一个缺失就克隆 nextUrl 构造一个指向 /qunng/next/h5/api/auth 的新 URL，把 itopencodeparam、gameid、channelid 三个查询参数原样传过去，再把当前 basePath + pathname + search 编码成 redirect 参数一起带上，最后 NextResponse.redirect 返回 302。只拦 /game-* 的原因有两个：一是授权相关的只有游戏频道入口需要，其它业务场景（签约中心、钱包、qunshare）的 cookie 来源不同，不该被这条路径逻辑影响；二是 middleware 在每个请求都会执行，收窄前缀可以显著减少边缘函数的 CPU 开销，对内网 CDN 友好。

<details><summary>🔴 深挖（点击展开）</summary>

我可以从「为什么放在 middleware 而不是 getServerSideProps」、「具体实现」、「回跳参数设计」、「踩过的坑」四个角度讲。第一，为什么是 middleware。Pages Router 场景下 getServerSideProps 会先进页面组件再决定跳转，对用户来说是「闪一下再跳」，而 middleware 跑在更前置的 edge，可以在还没命中任何页面的时候就直接 302 出去，体验更干净、也避免页面模块白加载一次；而且 Next.js 15 的 middleware 对 cookie 的访问是同步的，从请求对象上直接拿，比在 API handler 里再解一层 cookie 成本更低。第二，具体实现：middleware 里只做最轻的 cookie 三件套判断，不解 itopencodeparam，也不调任何远端；所有「重活」都交给授权接口做。三件套里 openid 是仅供客户端脚本读取的普通 cookie，因为业务侧脚本有时要拿来拼上报和链接，其余两个是仅服务端可见的隔离字段防 XSS 偷取。第三，回跳参数设计。授权成功后用户应当回到他最初想访问的页面，所以我们把原始请求的 basePath、路径、查询串拼起来作为回跳参数，而不是直接存当前地址——因为 basePath 是 Next.js 配置的统一前缀，服务端和客户端看到的路径结构略有差异，必须用结构化对象去构造。第四，踩过两个坑：一是早期没把解密用的几个查询参数透传，重定向到授权接口后这些参数就丢了，授权接口根本无法解密；后来改成显式把三个参数逐一设置到新链接上。二是回跳参数没做长度限制，遇到个别营销长链会超过代理网关的链接上限，现在我们在授权接口前置加了一千余字符的截断，解码之后再做域名白名单校验。

</details>

#### 补齐方案

- 📚 必读
  - [ ] middleware.ts 全文
  - [ ] pages/api/auth.ts 全文
  - [ ] Next.js middleware 官方文档（matcher / request 对象）
- 🛠️ 动手
  - [ ] 用 Next.js 15 middleware 加一个只拦 /admin 的 role 检查
  - [ ] 为 middleware 加一个简单的基于 cookie 的白名单放行
- ⚠️ 常见踩坑
  - redirect 没透传原始 query 参数
  - 把长链直接塞进 redirect 导致超长
  - middleware 里做远端调用拖慢所有请求
- 🤔 自测题（合上文档自答）
  - [ ] middleware 里能不能调 DB 或远端接口？
  - [ ] matcher 配置和 pathname.startsWith 选哪个？
  - [ ] 如果 cookie 结构变了，middleware 与 /api/auth 怎么协同上线？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `middleware.ts`
- `pages/api/auth.ts`

---

### Q2. /api/auth 里你们怎么防开放重定向？为什么必须走 @tencent/checkurl 而不是自己写正则？

> 来源：`tp-002` · scope: fullstack · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| 开放重定向 (Open Redirect) 常见变体 | 必须掌握 | 理解我们为什么要防以及防哪些。 |
| @tencent/checkurl subhost 模式语义 | 必须掌握 | 具体 API 与白名单语义。 |
| httpOnly / SameSite / Secure 三元组 | 必须掌握 | cookie 下发策略选型。 |
| URL 标准解析（WHATWG URL） | 加分项 | 讨论 IDN、userinfo、端口等变体。 |

#### 三档回答

**🟢 一句话**：redirect 参数 decode 后交给 @tencent/checkurl 以 subhost 模式校验，只放行 qq.com/tencent.com 子域；不过就 403 拒绝。

**🔵 标准**（默认）：

整个流程是：先用 msdk 解密接口从客户端透传进来的授权凭证里取出用户的三件套，再取查询参数里的回跳地址并做一次解码，然后拿一份包含协议白名单、主机规则、匹配模式的授权配置调 checkurl 做校验；结果为假就直接返回四零三拒绝，为真才用仅服务端可见的形式下发三条 cookie，最后用三零二把浏览器重定向回原始地址。选 checkurl 的核心原因是它按链接结构字段级解析，能精确处理反斜杠欺骗、国际化域名同形异义字符、端口欺骗、纯数字 IP 这些常见的开放重定向变体；自己写一条简单的域名正则一定会漏形如「前缀点攻击域点目标域」这样的后缀欺骗，而一旦漏一个，门户就会被拿去当成钓鱼跳板。

<details><summary>🔴 深挖（点击展开）</summary>

我从「攻击面」、「子域名模式的语义」、「cookie 下发策略」、「踩过的坑」四个角度展开。第一，攻击面。开放重定向最常见的三种玩法：一是把钓鱼站拼成「攻击域问号后面接正规域」，这种跟我们无关；二是利用我们做跳板——访问我们的授权接口并把回跳地址指到攻击域，这是我们要防的核心；三是嵌套欺骗，比如「正规域后面跟一个艾特符号再接攻击域」「正规域后缀拼接攻击域」，这两种解析容易写错就放过。第二，子域名模式的语义。checkurl 在这个模式下要求主机的最后若干段必须精确落在规则里的域名上，支持任意子域；它内部会用标准链接解析器把链接拆成协议、主机、路径，然后从主机尾部往前逐段匹配白名单；国际化域名同形异义字符则走一次标点码解码再比较。它还会挡掉含用户信息的形式（链接中带艾特符号）和以数字 IP 直连的形式。第三，cookie 下发策略：三条 cookie 都设全站可见且有效期三十天，其中用户标识是客户端脚本可读的，因为业务侧脚本有时要拿它拼上报；其余两条仅服务端可见防脚本偷取。安全传输和跨站属性都沿用浏览器默认值，因为我们整站挂在频道域下，证书由上游网关强制打开，而跨站策略上默认值已经是新版浏览器的宽松模式，正好可以让游戏 WebView 在跨域跳转时也把 cookie 正常带上。第四，踩过的坑。一是早期没做解码，直接把带百分号编码的回跳地址交给 checkurl，解析器会把攻击主机当成路径的一部分放过；现在强制先解码再校验。二是模式一开始写成严格主机匹配想精确命中，结果所有子域都被挡下；切到子域名模式之后恢复正常。三是下发 cookie 的操作必须在重定向响应头之前设置，否则部分浏览器不会认这条 Set-Cookie 响应头。

</details>

#### 补齐方案

- 📚 必读
  - [ ] pages/api/auth.ts 全文
  - [ ] @tencent/checkurl README 与 subhost 模式说明
  - [ ] OWASP Open Redirect 指南
- 🛠️ 动手
  - [ ] 写一组 fixtures 覆盖 10+ 种开放重定向变体并跑过 checkurl
  - [ ] 手写一个小工具用 WHATWG URL 做 host 后缀白名单
- ⚠️ 常见踩坑
  - redirect 没 decode 直接校验
  - 把 host 模式当 subhost 用导致误拦
  - Set-Cookie 写在 redirect 之后
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不能直接 /qq\.com/ 正则校验？
  - [ ] IDN 同形异义字符怎么防？
  - [ ] 如果白名单需要支持动态增减你怎么做？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `pages/api/auth.ts`

---

## ⚖️ 取舍（trade-off）— 1 题

### Q1. 你们项目引入了 Redux Toolkit + next-redux-wrapper，但 store 只挂了一个 walletSlice。为什么这么克制？

> 来源：`tp-011` · scope: frontend · next-guild · 难度: 中级

#### 知识点

| 名称 | 等级 | 为什么会问 |
|---|---|---|
| Redux Toolkit slice / configureStore | 必须掌握 | 实现基础。 |
| next-redux-wrapper HYDRATE 流程 | 必须掌握 | SSR 与客户端 state merge。 |
| 状态本地化 vs 全局化决策 | 必须掌握 | 本题核心 trade-off。 |
| Zustand / Jotai 对比 | 加分项 | 选型讨论。 |

#### 三档回答

**🟢 一句话**：绝大多数状态是页面局部的，SSR props + 组件内 useState 就够了；只有钱包礼物明细要跨页复用才进 store。

**🔵 标准**（默认）：

src/store/store.ts 里 makeStore = () => configureStore({ reducer: { [walletSlice.name]: walletSlice.reducer }, devTools: true })，然后 createWrapper<AppStore>(makeStore) 导出 wrapper 给 next-redux-wrapper。walletSlice 只有一个 giftDetail 字段 + 一个 setWalletState reducer，管的是送礼页 -> 收入详情页之间传递的礼物明细。其它所有业务要么用 getServerSideProps 返回 props 一次性注入，要么用 useState + props 传递，甚至有几个场景直接用 window.sessionStorage；我们没有全局组件树需要『刷新整个树』的场景，所以不给组件引入 Provider 订阅开销。这种克制的另一个收益是：Hybrid 场景下页面在游戏 WebView 里可能被关掉、再打开走新 session，next-redux-wrapper 的 HYDRATE 模型只对 SSR 有意义，业务层越少依赖它越好维护。

<details><summary>🔴 深挖（点击展开）</summary>

我从「为什么还是要引入红色库而不是纯组件状态」、「走服务端渲染包装器的水合细节」、「对比柚子和基石的取舍」、「未来演进」四个角度讲。第一，虽然只用了一个切片，但引入红色库的动机是：礼物明细要从送礼页传到收入详情页，而频道内嵌浏览器的路由机制会让页面跳转时前一个页面实例可能被复用也可能被重建，用地址查询串传结构化数据太丑，用本地存储又有跨会话污染；红色库的存储容器在保活提供者的生命周期里是稳定的单例，正好匹配这种跨页短暂保留但不能落地的需求。第二，服务端渲染包装器的水合流程是：构造函数在服务端先跑一次，状态落地后随下一个数据字段送到客户端，客户端的包装器收到水合事件把状态合并回去。我们在钱包切片里没写额外的水合处理，因为礼物明细不需要跨端持久化——它是用户操作触发的本地状态，服务端渲染时永远是空；如果未来要让后端直接渲染礼物详情页，就要补一条水合分支。第三，对比柚子和基石这两个更轻量的方案：柚子更轻、不需要提供者、和项目其它部分的简洁风格一致，但服务端渲染包装器的水合方案在页面路由加服务端渲染的语境下是生态最成熟的方案，而且红色库配套的不可变代理加切片语法在多人协作时心智负担低。项目早期选了红色库就沿用下来，没有足够强的收益驱动切换。第四，未来演进：如果状态继续克制，我可能把钱包切片下沉成一个上下文提供者，干脆移除红色库；反之如果签约中心新增跨页状态，就再加一个切片而不是重构。

</details>

#### 补齐方案

- 📚 必读
  - [ ] src/store/store.ts 与 src/store/wallet.ts
  - [ ] next-redux-wrapper 官方 HYDRATE 文档
  - [ ] Redux Toolkit slice / extraReducers 章节
- 🛠️ 动手
  - [ ] 为 walletSlice 补一个 HYDRATE case 支持 SSR 注入
  - [ ] 做一个小 demo 对比 useState vs Zustand vs Redux 的可读性
- ⚠️ 常见踩坑
  - 把本应是页面 state 的内容也放 store
  - 忘记 HYDRATE 导致 SSR 拿到的数据被覆盖
  - 多个 wrapper 实例冲突
- 🤔 自测题（合上文档自答）
  - [ ] 为什么不直接上 Zustand？
  - [ ] 如果 store 规模增长你怎么演进？
  - [ ] HYDRATE 对客户端初次渲染有哪些副作用？
- ⏱️ 预估学习时长：**3-4 小时**


#### Evidence

- `src/store/store.ts`
- `src/store/wallet.ts`

---

