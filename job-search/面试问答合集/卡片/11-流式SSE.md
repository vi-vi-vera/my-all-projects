# 卡 11 · 流式 SSE（提纲 1.5）

> 定级：L2–L3（主线有实战，partial JSON 无实战）｜ 2026-11-18

## 3 句骨架

1. **AI 对话是「一问一答的流」，不是「双向对讲」**——所以用 SSE（单向、复用 HTTP 基础设施、协议自带重连原语），不用 WebSocket。需要双向实时（中途插话、语音对讲）才上 WS。
2. **断线恢复要分两件事**：怎么发现断了（心跳 + `onerror` + `req.on close`）、怎么续上（应用级：存已生成内容 + 用 streamId 重新订阅，**不是 `Last-Event-ID`**）。
3. **流式的实现坑是一整条链**：应用 `flushHeaders` → 压缩排除 SSE → nginx `X-Accel-Buffering: no` → 云 LB / 网关确认。**少一层就退化成一次性返回。**

## 一、为什么 SSE 不用 WebSocket

**先分清两个问题**：为什么流式（所有方案共同动机）vs 为什么选 SSE（协议选型）。**被问的是后者。**

| 理由 | 说明 |
|---|---|
| **单向就够** | 输出是 server→client 单向；用户下次输入是新请求，不需要同一连接双向 |
| **复用 HTTP 基础设施** | 鉴权、网关、限流、日志、灰度、链路追踪全部照常工作；WS 要 `Upgrade`，很多企业网关不支持 |
| **协议自带重连** | `id:` + `Last-Event-ID` 让 `EventSource` 自动重连续传；WS 的心跳/重连/恢复全要自己写 |
| 实现成本低 | `res.write('data: ...\n\n')` vs 引库管连接池 |

**SSE 缺点（必须主动说）**：单向（想中途打断要另发请求）／只能文本／HTTP/1.1 同域 6 连接限制／**中间层可能缓冲**／`EventSource` 不能带 header 也不能 POST → 工程上常用 `fetch + ReadableStream` 替代。

> 判据：**需要双向实时才上 WS，否则 SSE 更轻。**

## 二、SSE 协议长什么样

纯文本，固定格式传：

```
data: {"delta":"你"}

id: 7
event: heartbeat
data: {"t":"..."}

```
规则：每行 `字段: 值`；**空行 = 一条消息结束**；四个字段 `data` / `id` / `event` / `retry`。

## 三、断线恢复（两件事）

**① 怎么发现断了**
- 客户端：`onerror`、reader 抛错、**心跳超时**
- 服务端：`req.on('close')`、写入 EPIPE
- **中间层空闲超时会静默断开，两端都不知道 → 心跳是必需品不是优化**

**② 怎么续上：协议级 vs 应用级**

> 类比：**收音机告诉你「你听到第 7 段」是协议级；要补上第 8 段的内容，得电台留录音（应用级）。**

AI 场景必须做应用级，因为 **token 是一次性的**（模型已经往下生了，不可能"从第 8 个字重生成"）→ 必须自己存已生成内容。

**用户项目的实现（代码事实）**：
- 用 Vercel `resumable-stream` + Redis
- `buildStreamKey(sessionId, scope)`，scope = `start-service` | `thread:<id>`
- `setActiveStreamId` 登记 → 重连时 `getActiveStreamId` → `resumeExistingStream(streamId)` 补发 + 续接 → `clearActiveStreamId`
- **不用 `Last-Event-ID`**：`resumeExistingStream(streamId)` 没有 offset 参数 → 位置不由客户端提供 → **服务端从头全量重放**
- 代价可接受：AI 消息体量小（KB 级）+ 前端**覆盖渲染**天然幂等
- **推论：前端必须「替换」渲染，不能「追加」**，否则重连会内容翻倍

**为什么没有 Last-Event-ID 也能对上**：
| | Last-Event-ID | streamId + 全量重放 |
|---|---|---|
| 坐标 | 每条事件 | 整条流 |
| 位置由谁提供 | 客户端 | 不需要 |
| 传输量 | 增量 | 全量 |
| 前端要求 | 按 seq 去重 | **覆盖渲染** |

## 四、`probeActiveStream`：僵尸流（项目独有的坑）

**为什么会有 streamId 但进程死了**：
1. streamId 存 Redis（跨进程、有 TTL ≈ 1h）
2. 真正生成的循环在某个 Node 进程内存里
3. 进程崩溃/发版/驱逐 → 内存循环没了，**但没人清 Redis 那条登记**
4. 后果：重连时 Redis 说"有活跃流"，实际没人写；且僵尸 key 会**挡住状态查询直到 TTL 过期**

**probe 四步**：
```
getActiveStreamState(streamKey)            // 拿 streamId + conversationId + lastProgressAt
→ conversationId 不匹配 → false（防串流）
→ lastProgressAt 超过 staleAfterMs → 清 key、false（快速路径）
→ resumeExistingStream(streamId)：
     null → 已完成 → 清 key
     undefined → 不存在 → 清 key
     抛 "Timeout waiting for ack" → 内存态丢了 → 清 key
     成功 → 立刻 reader.cancel() → true
```
**必须 cancel**：`resumable-stream@2.2.12` 每次 resume 创建独立 subscriber，不 cancel 会泄漏。

**发现的一致性问题**：`lastProgressAt` **只在 setActiveStreamId 时写一次，流式过程中不刷新** → `staleAfterMs` 判据实际算的是"注册后多久"，和任务层 `updated_at` 是**同一个病**；区别是流层有 probe 兜底，任务层没有。

## 五、partial JSON（无实战，讲方案）

三层递进：**等完整再渲染**（慢）→ **取关键字段展示**（有感知无全貌）→ **真解析**（写解析器或第三方库）。

**真实机制不是括号匹配，是「补全 + 重试」**：每来一个 chunk 拼到缓冲区 → 修复（补引号/括号/截断到最后一个完整值）→ `JSON.parse` → 失败就缩短重试。
- 修复式：`jsonrepair` / `partial-json`
- 增量式状态机：`streaming-json-parser` / AI SDK `streamObject`

**三个坑**：① 渲染必须**替换**不是追加（拿到的是全量）② **类型会变**（`12` → `"12` 截断成字符串）③ 最后必须**整段 schema 校验**（流式只解决体验，不解决正确性）
**流中断**：手里是半截 JSON，要能判断不完整，不能当成功结果入库。

**架构视角（更重要）**：**改协议比写解析器划算** —— 传"一条条完整小 JSON"（JSONL/事件流）就没有部分解析问题。
> **你们就是事件流**（AI SDK UI message stream，每个 `data:` 是完整事件），所以**没有这个问题**；这是架构选择带来的好处，要主动说明。

## 六、缓冲链（第 5 问）

```
浏览器 ← CDN/LB ← 公司网关 ← nginx ← Node 进程 ← res.write
```

| 层 | 处理 |
|---|---|
| Node | `res.flushHeaders()` |
| 压缩中间件 | **必须排除 SSE**（否则 gzip 攒包） |
| nginx | `X-Accel-Buffering: no` / `proxy_buffering off` |
| 云 LB / 网关 | 需确认是否透传流式 |
| 客户端 | 用原生 fetch + reader |

**项目已做**：`text/event-stream` + `no-cache` + `keep-alive` + `X-Accel-Buffering: no` + `flushHeaders()` + `sendHeartbeat()`；**且没有启用 compression 中间件**（绕开了 gzip 坑）。

**区分「缓冲」和「慢」（真考点）**：
- 首字节很晚、然后一次性全到 → **缓冲**
- 首字节正常、chunk 间隔稳定 → **模型慢**

**排查手法**：`curl -N` 直连后端 vs 过网关，对比 chunk 到达时间，一次定位层级。

## 我的理解（原话 · 2026-11-18）

> 「后台会拿当前的 streamId 去查对应的流的状态，如果没有活跃流了，让前端重新发起；如果有正在输出的流，就重新订阅、补发并续接；如果流结束了就拿到完整结果，如果出错了就返回错误。另外我们项目里有做流的 probe，如果流还在但进程死了会走这个逻辑判死。」

> 「处理方式一般分三个层次：最简单是等完整 JSON 再渲染，坏处是等待久；第二种取关键字段展示，用户对当前字段有感知但不知道完整内容；真正部分渲染要写解析器，记录已收数据做括号逗号匹配、入栈出栈，自己实现麻烦，最方便用第三方解析器。」

> 「会被缓冲，在服务层加个禁止缓存的配置就行。」
> → 偏薄：缓冲是**一条链**，且要能区分「缓冲」和「慢」。

## SSE vs WebSocket（2026-11-26 补）

| | SSE | WebSocket |
|---|---|---|
| 方向 | **单向**（服务端 → 客户端） | **全双工** |
| 协议 | 普通 HTTP（`text/event-stream`） | 需要 Upgrade 握手，独立协议 |
| 数据 | **只能文本**（二进制要编码） | 文本 + 二进制 |
| 重连 | `EventSource` **自动重连** | 要自己写心跳 + 重连 |
| 基础设施 | **复用 HTTP**：鉴权、代理、网关、日志都能用 | 要单独处理升级、代理透传 |
| 连接数 | HTTP/1.1 同域约 **6 个**上限 | 不受此限 |

**判据**：

```
单向推送 + 文本 + 想复用 HTTP 设施  → SSE（模型对话、进度、通知、日志流）
双向高频交互                        → WebSocket（协同编辑、IM 双向、游戏、实时游标）
```

**为什么 Agent 对话用 SSE**：本质是「发一次请求 → 通道挂起 → 流式回 → 结束关闭」，**不需要全双工**；而且省掉了维护连接状态、心跳、重连的整套代码。

**SSE 的短板要主动说**：单向、纯文本、HTTP/1.1 下并发连接有限（所以大屏看板那种多路流要小心），以及**代理层缓冲**（见本文上面那条缓冲链）。

## 待补
- Claude 侧 context 解析的四级优先级（见卡 12）
- HTTP/2 下 SSE 的连接数问题
