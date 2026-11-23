# 卡 21 · 浏览器缓存 / CORS / Cookie

> 定级：L2（4.4 主线，能讲机制 + 踩过的坑）｜ 2026-11-23（D7）

## 3 句骨架

1. **HTML 走协商、静态资源走强缓存、资源名带 hash**——HTML 是版本清单，清单必须每次校验。
2. **CORS 是浏览器拦的，不是服务器拒的**：请求成功、响应被拦。要服务端写头，或前端代理变同源。
3. **CSRF 的前提是「凭证会自动带上」**——所以只有 Cookie 方案有这个问题；防御靠 SameSite + CSRF Token 双保险。

## 一、强缓存 vs 协商缓存

| | 强缓存 | 协商缓存 |
|---|---|---|
| 发不发请求 | **不发**，直接用本地 | **发**，问服务器变没变 |
| 头 | `Cache-Control: max-age` / `immutable` / `Expires` | `ETag` / `Last-Modified` |
| 命中 | 200（from cache） | **304 Not Modified**，无 body |
| 适合 | 带 hash 的 JS/CSS/图片 | **HTML**、接口、不带 hash 的资源 |

**正确组合**：

| 文件 | 头 |
|---|---|
| `index.html` | `Cache-Control: no-cache`（每次协商） |
| `/assets/*.[hash].js` | `Cache-Control: public, max-age=31536000, immutable` |

**`no-cache` 不等于不缓存**：是"可以存，但每次用前必须问服务器"。**`immutable`** = 内容永不变，别再来问。

**304 往返**：
```
响应 ETag: "v1" → 请求 If-None-Match: "v1"
没变 → 304 无 body；变了 → 200 + 新 body + 新 ETag
```
**ETag 优先于 Last-Modified**（后者秒级精度，一秒内改两次测不出）。

**"发版还是旧 JS"的根因**：不是 JS 被缓存，是 **HTML 被缓存** → 引用的还是旧 hash 文件名。

**三个坑**：CDN 边缘缓存 / Service Worker 第三层缓存 / HTML 设了 `max-age` 就锁死旧版本。

## 二、CORS

**本质**：同源策略（协议+域名+端口）由**浏览器**执行。请求发出去了、服务器返回 200，浏览器检查响应头缺 `Access-Control-Allow-Origin` → **拦下不给 JS 读**。
**诊断信号**：控制台 CORS 报错，但服务器日志里是 200。

**解法**：① 服务端写 CORS 头 ② 前端 dev 代理把跨域变同源（生产不靠它）。

| 情况 | 触发条件 | 服务器要回 |
|---|---|---|
| 简单请求 | GET/POST + 三种 CT（表单/ multipart / text/plain）+ 无自定义头 | `Access-Control-Allow-Origin` |
| 预检 | PUT/DELETE、**`application/json`**、自定义头 | 先 OPTIONS 回 `Allow-Methods` / `Allow-Headers` / `Max-Age` |
| 带 Cookie | `credentials: 'include'` / `withCredentials` | `Allow-Credentials: true` + **`Allow-Origin` 必须是具体源，不能 `*`** |

> `*` 与 credentials 互斥是规范强制的：`*` = 谁都能读，再带凭证 = 把用户凭证交给任何网站。
> 调试见"请求发了两次"，第一次 OPTIONS 是正常预检。

## 三、Cookie / SameSite / CSRF

**session 和 cookie 的关系**：session 在服务端，客户端只持有 **sessionId**，通常就在 Cookie 里。HTTP 请求只能带 Cookie，带不了"session"。

| 存储 | 随请求自动发 | 生命周期 | 跨标签 | JS 能读 |
|---|---|---|---|---|
| Cookie | **会** | 可设过期 | 共享 | 可 `HttpOnly` 禁掉 |
| localStorage | 不会 | 永久 | 共享 | **能** |
| sessionStorage | **不会** | 标签页关即失 | **不共享** | **能** |

**CSRF 场景**：恶意站点隐藏表单 POST 到银行站点 → Cookie 按**目标域名**匹配，不看来源页 → 自动带上 → 服务端认你 → 转账。

| SameSite | 跨站带 Cookie？ |
|---|---|
| Strict | 完全不带 |
| **Lax**（Chrome 默认） | 顶级导航 **GET** 带，POST/iframe/img 不带 |
| None | 都带，必须 `Secure` |

**SameSite 不够**：老浏览器、同站不同子域、**GET 型 CSRF**（Lax 放行顶级 GET）→ 生产 = `SameSite=Lax` + **CSRF Token**（攻击者跨域读不到页面，拿不到 token）。

**登录态放哪**：
- Cookie + `HttpOnly` + `Secure` + `SameSite` → XSS 偷不到，但有 CSRF
- localStorage + `Authorization` 头 → 无 CSRF，但 XSS 能读走

## 我的理解（原话 · 2026-11-23）

> "有缓存吧，一般都用 md5 来给文件命名，这样内容修改了文件名也会改，发版后浏览器就会自动拉取新文件。"

> "端口不一致，跨域了。"

> "sessionstorage 就是不会自动在请求带上啊，你问的有问题。"（这句是对的——我原题问的是服务端 session 存在 Cookie 里，表述含糊）

## 当天说错的

1. **304 说成 302** —— 302 是临时重定向（会去新地址再请求），304 才是"没改，用本地"。
2. **session / sessionStorage 混用** —— 服务端 session 靠 Cookie 里的 sessionId；`sessionStorage` 是 Web Storage，永不随请求发。
3. 缓存只答了"文件名带 hash"，**漏了 HTML 是入口**——发版不生效的根因几乎永远在 HTML。

## 追问备用

| 追问 | 答法 |
|---|---|
| 为什么 HTML 不能强缓存？ | 它是版本清单，缓存=锁死旧清单，新资源根本不会被引用 |
| 304 有 body 吗？ | 没有，只带头；但**仍花一个 RTT**，所以静态资源宁可用强缓存 |
| 预检结果能缓存吗？ | 能，`Access-Control-Max-Age` |
| 为什么带 Cookie 时不能用 `*`？ | 等于允许任意站点带用户凭证读响应 |
| CSRF 和 XSS 区别？ | CSRF 借用户的浏览器发请求（不偷数据）；XSS 在页面里执行脚本（能偷数据） |
