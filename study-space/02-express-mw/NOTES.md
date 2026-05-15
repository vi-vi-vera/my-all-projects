# 簇 2 学习笔记 — Express 中间件 + HTTP keepalive + SSE 错误协议

> 对应学习指引：簇 2（q-12）
> 完成日期：2026-05-15
> 配套代码：`server.js` + `middlewares/` + `public/index.html`

---

## 一、这一簇解决什么问题？

簇 1 的 SSE 端点把"日志、鉴权、限流、业务"全堆在一个函数里。中间件机制把这些**横切关注点**拆成独立函数，像洋葱一样层层包裹业务核心。

---

## 二、核心知识点

### 1. Express 洋葱模型

```
请求进 → [requestId] → [logger] → [auth] → [rateLimit] → [handler] → 响应出
               ↓                                                ↑
               └──── next() 一层层向内，return 时一层层往外 ────┘
```

- **3 参签名** `(req, res, next)` = 普通中间件
- **4 参签名** `(err, req, res, next)` = 错误中间件（Express 靠**数参数个数**判断！）
- **`next()`**：放行到下一层；不调则请求挂死
- **`next(err)`**：跳过所有普通中间件，直接到最近的 4 参错误中间件

### 2. `next(err)` vs `throw err`（送命题）

| 场景 | `next(err)` | `throw err` |
|---|---|---|
| **同步** handler | ✅ 安全 | ✅ Express 4 能接住 |
| **async** handler | ✅ 安全 | ❌ Express 4 接不住！变成 unhandledRejection，浏览器挂死 |

**结论**：始终用 `try/catch + next(err)`。或用 `asyncHandler` 包装：
```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### 3. 工厂函数模式

```js
app.use(requestId());            // requestId() 返回真正的中间件
app.use(rateLimit({ max: 3 }));  // 工厂能传配置参数
```

几乎所有 Express 生态库（cors, helmet, compression）都这种风格。好处：调用方决定策略，不用改源码。

### 4. 洋葱模型的"出口"：res.on('finish')

```js
// ❌ next() 之后直接打日志 → 异步 handler 还没结束，耗时不对
// ✅ res.on('finish', () => { /* 响应真正发完才打 */ })
```

| 事件 | 含义 |
|---|---|
| `finish` | 响应正常发完（`res.end()` 之后） |
| `close` | TCP 关闭（可能正常、可能客户端强制断开） |

SSE 长连接场景：客户端关页面 → 只有 `close` 没有 `finish` → 靠 `!res.writableEnded` 判断是否异常断开。

### 5. SSE 错误协议（核心！）

**错误写法**：
```js
res.status(401).json({ error: 'unauthorized' });
// SSE 端点不能这么干！Content-Type 已是 text/event-stream
```

**正确写法**：
```js
res.write(`event: error\n`);
res.write(`data: ${JSON.stringify({ code: 'UNAUTHORIZED' })}\n\n`);
res.end();  // 主动结束流
```

前端用 `es.addEventListener('error', (e) => { if(e.data) { /* 业务错误 */ es.close(); } })`。

**关键区分**：
- `es.onerror`（无 data）= 网络层错误，让浏览器自动重连
- `es.addEventListener('error', e => e.data)` = 业务错误，前端主动 close 不重连

### 6. HTTP keepalive

- **HTTP/1.0**：默认每请求新开 TCP，要加 `Connection: keep-alive` 才复用
- **HTTP/1.1**：默认 keep-alive，加 `Connection: close` 才关
- **SSE 依赖长连接**：HTTP/1.0 下几乎无法用

### 7. 心跳保活

```js
res.write(`: heartbeat ${Date.now()}\n\n`);
```

冒号开头 = SSE 注释，浏览器忽略但 TCP 连接有数据流动，防止 nginx/防火墙 60s 空闲断连。**生产必备**。

---

## 三、5 个中间件设计要点

### requestId.js
- 优先透传网关已分配的 `x-request-id`，没有才 `randomUUID()`
- 响应头也写一份 → 前端/运维拿 ID 查日志

### logger.js
- 用 `res.on('finish')` 在响应**真正发完后**打日志（含准确耗时）
- 用 `res.on('close')` + `!res.writableEnded` 检测客户端异常断开

### auth.js
- **不做响应决策**：只判断 + 包装 Error + `next(err)` → 错误格式由下游错误中间件决定
- 单一职责：auth 不需要知道自己服务的是 SSE 还是 JSON 端点

### rateLimit.js
- **闭包**存 Map：工厂调一次创建 Map，所有请求共享
- **滑动窗口**：`filter(t => now - t < windowMs)` 只保留窗口内的时间戳
- 生产问题：内存 Map 不支持多进程/多实例 → 用 Redis（簇 7）

### sseError.js
- **两种错误处理器**：`jsonErrorHandler`（普通端点）+ `sseErrorHandler`（SSE 端点）
- SSE 版挂在**路由级别**，不是全局 → 避免 JSON 端点也按 SSE 格式返回
- `res.headersSent` 检查：防止重复发响应头导致 ERR_HTTP_HEADERS_SENT

---

## 四、中间件顺序的讲究

```
requestId → logger → auth → rateLimit → handler → sseErrorHandler
```

- auth 在 rateLimit 前 → 限流基于 userId（不是 IP），未登录请求不消耗配额
- sseErrorHandler 挂路由级 → 只对 SSE 端点生效
- jsonErrorHandler 挂全局最后 → 兜底所有非 SSE 错误

---

## 五、自检清单

- [x] 能画出 Express 中间件的洋葱模型
- [x] 能解释 `next(err)` 与 `throw err` 在 async 函数里的区别（throw → unhandledRejection）
- [x] 知道 SSE 端点里不能用普通全局错误中间件返回 JSON（要用 `event: error` + `res.end()`）
- [x] 能说清 4 参签名是 Express 识别错误中间件的唯一依据
- [x] 知道心跳注释行 `: ping\n\n` 的作用（保活反代连接）

---

## 六、踩过的坑 / 心得

1. **中间件顺序即策略**：auth 和 rateLimit 换个位置，限流逻辑就完全不同
2. **"不做决策"原则**：auth 只管判断和抛错，响应格式交给错误中间件 → 一个 auth 服务 N 种端点
3. **4 参签名是魔法**：少写一个 `next` 参数，Express 不当错误中间件，debug 半天找不到原因
4. **`res.on('finish')` vs `next()` 之后**：异步 handler 下 `next()` 是同步返回的，打日志要用事件回调
5. **闭包 + 滑动窗口**是最小限流实现，但生产要上 Redis

---

## 七、下一站

**簇 3（q-06）：git plumbing + shell 严格模式**
终于要用 WSL 了！学 `set -euo pipefail`、`git stash -u`、`git cat-file` 等底层命令。
