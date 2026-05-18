# 簇 5 学习笔记 — postMessage 安全 + 状态机 + AbortController

> 对应学习指引：簇 5（q-09）
> 完成日期：2026-05-18
> 配套代码：`src/demos/` + `public/iframe-child.html`

---

## 一、postMessage 安全（面试安全类必问）

### 三大安全坑

| 坑 | 后果 | 解法 |
|---|---|---|
| ① 发送方 `targetOrigin: '*'` | 任何窗口都能收到敏感数据 | 指定具体 origin：`postMessage(msg, 'https://trusted.com')` |
| ② 接收方不校验 `event.origin` | 恶意页面能注入消息（XSS 入口） | `if (event.origin !== allowedOrigin) return;` |
| ③ 接收方不校验 `event.source` | 同 origin 多 iframe 消息混淆 | `if (event.source !== iframeRef.contentWindow) return;` |

### 通信流程

```
父页面                              iframe 子页面
  │                                      │
  │  postMessage(msg, targetOrigin)      │
  │ ────────────────────────────→        │
  │                            校验 event.origin ✓
  │                            处理消息
  │  ←──────────────────────────         │
  │  event.source.postMessage(ack, origin)
  │                                      │
  校验 event.origin ✓
  校验 event.source ✓
```

### 面试答法

> "postMessage 三个安全点：发送方指定 targetOrigin 不用 `*`；接收方校验 `event.origin` 做白名单；接收方校验 `event.source` 确认来源窗口。双向都校验才安全。"

---

## 二、状态机 vs 一堆 boolean flag

### 核心问题：boolean 组合爆炸

```js
// 3 个 boolean → 2³=8 种组合，其中 5 种非法
loading=true && error=xxx   ← 矛盾！
loading=true && streaming=true  ← 矛盾！
```

### useReducer 状态机解法

```js
const [state, dispatch] = useReducer(reducer, { status: 'idle' });
// status: 'idle' | 'loading' | 'streaming' | 'error' | 'done'
```

### 状态转移图

```
idle → loading → streaming → done
                    ↘ error
```

### 状态机 3 个好处（面试必答）

1. **状态互斥**：不可能同时 loading 且 error，非法组合从源头消除
2. **转移可预测**：reducer 明确定义合法转移，非法 dispatch 直接忽略（防重复提交）
3. **UI 逻辑简单**：`if (status === 'loading')` 一行判断，不用组合 3 个 flag

### 什么时候该从 boolean 升级到状态机？

- 有 ≥3 个相关 boolean flag
- 出现过"非法状态组合"的 bug
- 按钮 disabled 逻辑写了 3 行以上条件判断

---

## 三、AbortController 取消 fetch

### 核心 API

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });  // 绑定
controller.abort();                          // 取消（真正断开 TCP）
```

### 解决的问题：竞态条件（Race Condition）

```
不用 abort：
  点 Tab1 → 2s 后返回覆盖 UI ← 错！
  点 Tab2 → 2s 后返回覆盖 UI ← 闪烁
  
用了 abort：
  点 Tab1 → 被 abort ✂️（canceled）
  点 Tab2 → 2s 后返回 ✅（唯一有效）
```

### 双保险模式：abort + requestId token

```js
// 保险 1：abort 旧请求
controllerRef.current.abort();

// 保险 2：递增 token，回调里校验
requestIdRef.current += 1;
const thisId = requestIdRef.current;
// ...回调里：
if (thisId !== requestIdRef.current) return; // 过期，丢弃
```

极端时序下 abort 可能来不及（响应已到内存），token 是最后一道防线。

### abort vs setTimeout 忽略（面试必答）

| 维度 | AbortController abort() | setTimeout 忽略结果 |
|---|---|---|
| TCP 连接 | **真正断开**（发 RST） | 连接还在传输 |
| 服务端资源 | 可以停止计算 | 不知道客户端不要了，白白算完 |
| Network 面板 | 显示 `(canceled)` | 显示正常完成 |
| 带宽 | 立刻释放 | 数据传完才释放 |

> "abort 是真取消，setTimeout 是假取消。大文件/AI 长生成场景差别极大。"

---

## 四、自检清单

- [x] 能说出 `postMessage(msg, '*')` 的危险 + "双向校验 origin" 的写法
- [x] 能列举状态机相比 boolean flag 的 3 个好处（互斥/可预测/UI 简单）
- [x] 能说清 AbortController 和 setTimeout 忽略的本质区别（真断开 vs 假忽略）
- [x] 知道竞态条件的双保险模式（abort + requestId token）
- [x] 知道 useReducer 是不引第三方也能写状态机的 React 内置方案

---

## 五、下一站

**簇 6（q-08）：Vite base + nginx 反向代理** — 解决"本地跑得好，部署到子路径 404"的经典问题。
