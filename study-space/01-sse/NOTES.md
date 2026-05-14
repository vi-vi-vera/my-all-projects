# 簇 1 学习笔记 — SSE 流式推送 与 fetch-event-source

> 对应学习指引：[`../qpilot-code/study-guide.zh.md`](../qpilot-code/study-guide.zh.md) 簇 1（q-01）
> 完成日期：2026-05-14
> 配套代码：[`./server.js`](./server.js) + [`./public/index.html`](./public/index.html)

---

## 一、这一簇解决什么问题？

ChatGPT、Claude、DeepSeek 这类 AI 产品，回答是**逐字蹦出来的**，不是整段一次性返回。这种"边算边吐"的体验，靠的是 **SSE（Server-Sent Events，服务器推送事件）**。

> **SSE 一句话定义**：服务端保持一条 HTTP 连接不关，按规定格式持续往里塞数据，浏览器边收边触发事件。

---

## 二、核心知识点

### 1. SSE 报文格式

```
data: hello 1\n\n         ← 最简单的一条消息
id: 42\ndata: hi\n\n      ← 带 id（断点续传）
event: chat\ndata: hi\n\n ← 带自定义事件名
retry: 5000\n\n           ← 让客户端 5 秒后重连
```

**4 个字段**：

| 字段 | 作用 |
|---|---|
| `data:` | 消息正文（必填） |
| `id:` | 消息 ID，浏览器自动记忆，断线重连时回传 |
| `event:` | 自定义事件名（默认是 `message`） |
| `retry:` | 重连间隔（毫秒） |

**最关键的规则**：**每条消息必须以 `\n\n`（两个换行）结尾**。
- 第一个 `\n` 表示当前字段行结束
- 第二个 `\n`（即"空行"）表示**整条消息**结束 → 浏览器才触发 `onmessage`

> 漏了一个 `\n`，浏览器会一直等下一行，**前端永远收不到消息**。新手最常踩。

### 2. 三件套响应头 + flushHeaders

```js
res.setHeader('Content-Type', 'text/event-stream'); // SSE 身份证，浏览器据此切流式解析
res.setHeader('Cache-Control', 'no-cache');         // 禁止缓存
res.setHeader('Connection', 'keep-alive');          // 长连接
res.flushHeaders();                                  // 立刻发送响应头，触发 onopen
```

**`flushHeaders()` 是关键**：Node 默认会等第一段 body 才发响应头，但 SSE 可能要等几秒才有第一条 data，提前 flush 才能让浏览器立即知道"这是事件流"。

### 3. 浏览器原生 EventSource

```js
const es = new EventSource('/events');
es.onmessage = (e) => console.log(e.data);
es.onerror   = ()  => console.log('断开了，浏览器会自动重连');
```

**它帮你做了什么**：
1. 发起 GET 请求
2. 按 `\n\n` 切分消息
3. 触发 `onmessage`
4. **断开后自动 ~3 秒重连**
5. **自动记住 `id:`，重连时自动加 `Last-Event-ID` 请求头**

**它的硬伤**：
- ❌ 只支持 GET，不能 POST
- ❌ **不能加自定义请求头**（包括 `Authorization`）→ 这就是 [fetch-event-source](https://github.com/Azure/fetch-event-source) 这个库存在的意义

### 4. 断点续传 Last-Event-ID 流程

```
T=0   浏览器 → 服务端: GET /events
T=1   服务端 → 浏览器: id: 1\ndata: hello 1\n\n
T=2   服务端 → 浏览器: id: 2\ndata: hello 2\n\n
T=3   [断网]
T=6   浏览器自动重连 → 服务端: GET /events
                                Last-Event-ID: 2   ← 浏览器自动加！
T=6   服务端读到 2，从 id=3 续推
```

服务端代码：
```js
const lastEventId = parseInt(req.headers['last-event-id'] || '0', 10);
let cursor = lastEventId + 1;
```

> ⚠️ 注意 Express 里 header 名都是**小写**：`last-event-id`，不是 `Last-Event-ID`。

### 5. SSE vs WebSocket

| 维度 | SSE | WebSocket |
|---|---|---|
| 方向 | 服务器→浏览器（单向） | 全双工 |
| 协议 | 普通 HTTP/1.1 或 HTTP/2 | 升级到 ws 协议 |
| 断线重连 | ✅ 浏览器自动 | ❌ 自己写 |
| 反代/CDN 友好 | ✅ 普通 HTTP | ⚠️ 要专门配 Upgrade 头 |
| 鉴权头 | ⚠️ 原生 EventSource 不支持 | ✅ 简单 |

**AI 对话场景选 SSE 的 3 个理由**：HTTP/1.1 兼容、自动重连、单向足够。

---

## 三、生产环境的 5 个隐藏坑（簇 1 demo 没覆盖，真实项目要注意）

### 坑 1：nginx 默认缓冲会卡住 SSE
- nginx `proxy_buffering on`（默认）→ 会缓存响应等够大小再吐 → 浏览器看到的是**一段一段攒出来**的，不是逐字
- 解决：location 块里加 `proxy_buffering off;` + 响应头 `X-Accel-Buffering: no`

### 坑 2：进程内 id 重启后清零
- 本 demo 的 `globalId` 是内存变量，重启即丢
- 真实场景：id 应来自**外部持久化数据源**（数据库自增、Kafka offset、Redis Stream entry ID）

### 坑 3：req.on('close') 不清理会内存爆炸
- 客户端断开后 Node **不会**自动停 `setInterval`
- 不清 → 每个断开的客户端都留一个永远跑的 timer

### 坑 4：原生 EventSource 不能带 Authorization
- 解决方案：用 [fetch-event-source](https://github.com/Azure/fetch-event-source)，它基于 `fetch` API，能自定义任意请求头

### 坑 5：长时间无消息会被反代/防火墙断开
- 很多反代 60 秒空闲就断
- 解决：服务端**每 30 秒发一条心跳注释行** `: ping\n\n`（冒号开头是 SSE 注释，浏览器会忽略，但能保活连接）

---

## 四、自检清单

- [x] 能说清 SSE 报文必须以 `\n\n` 结尾的原因（浏览器靠空行判断消息结束）
- [x] 能解释 SSE 在 nginx 后默认会卡住的原因（proxy_buffering）
- [x] 能说出选 SSE 不选 WebSocket 的 3 个理由（HTTP 兼容 / 自动重连 / 单向够用）
- [x] 能描述 Last-Event-ID 完整流程（浏览器自动记 id + 自动加请求头）
- [x] 知道原生 EventSource 不能加 Authorization 头，需要 fetch-event-source 库

---

## 五、踩过的坑 / 心得

1. **WSL 在 `/mnt/c/` 下跑 `npm install` 会报 EPERM**：因为 Linux 的 chmod 对 NTFS 文件系统不起作用。
   - **解决**：簇 1~2 用 PowerShell 跑 npm；进簇 3 起再用 WSL，并把代码挪到 WSL 原生盘（如 `~/study-space/`）。
2. **Chrome DevTools Block request URL 不能切断已建立的长连接**，只能拦截"未来"的新请求。
   - **正确的"模拟断网"方式**：DevTools → Network → 顶部下拉框选 **Offline**，或直接关 WiFi。
3. **ESM 模块里没有 `__dirname`**，要用 `path.dirname(fileURLToPath(import.meta.url))` 手动还原。
4. **`res.flushHeaders()` 不写不会立刻报错**，但浏览器的 `onopen` 触发会延迟，调试时会迷惑。
5. 浏览器自动重连**真的**不需要前端写一行代码，看代码以为它"死了"，结果 3 秒后自己活过来了 —— 这是 SSE 最让人惊喜的设计。

---

## 六、下一站

**簇 2（q-12）：Express 中间件 + HTTP keepalive + SSE 错误协议**

簇 1 学的是"流怎么动起来"，但当前代码生产上不了线（无日志、无鉴权、无限流、无心跳、无统一错误格式）。
簇 2 用 Express 中间件机制把这些工程化能力**像洋葱一样**层层套到 SSE 端点上。
