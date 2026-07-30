# 10 MCP + Tool use 学习笔记

## 一句话心得

> Tool use 4 步走：你给 LLM 工具列表 → LLM 返回 stop_reason="tool_use" + 参数 → 你执行工具 → 结果用 tool_use_id 对应塞回；MCP 是这套流程的"标准插头"，写一次到处用。

---

## Tool use 4 步流程

```
用户消息 + 工具列表
       ↓
 [LLM] 判断要用哪个工具
       ↓
 stop_reason = "tool_use"     ← 不是 "end_turn"，说明还没说完
 content[0].type = "tool_use"
 content[0].id   = "toolu_xxx" ← 唯一 ID，用于后续对应
 content[0].input = { city: "北京" }
       ↓
 [你的程序] 真正执行工具
       ↓
 结果用 role=user + type=tool_result 格式发回
 tool_use_id 必须对应上面的 id
       ↓
 [LLM] 基于结果生成最终回答（stop_reason="end_turn"）
```

### stop_reason 三种状态

| stop_reason | 含义 | 你该做什么 |
|---|---|---|
| `"end_turn"` | LLM 说完了 | 直接展示给用户 |
| `"tool_use"` | 还没完，要执行工具 | 执行工具 → 结果塞回 → 继续对话 |
| `"max_tokens"` | token 用完 | 继续下一轮对话 |

### 为什么 tool_use_id 不能丢

LLM 可能一次返回多个 tool_use（同时调 get_weather 和 search_web），你并发执行后把结果塞回去，LLM 靠 id 区分哪个结果对应哪个调用。

### 工具执行失败怎么处理

**不抛异常**，返回时加 `isError: true`：

```js
return {
  content: [{ type: 'text', text: '查询失败：API 超时' }],
  isError: true,
};
```

LLM 看到 isError 会在回答里说明或尝试其他方式。

---

## MCP 是什么

**没有 MCP**：每个 AI 客户端自己定义工具格式，不通用。
**有了 MCP**：统一协议，写一个 MCP Server，所有 MCP 客户端都能接（Claude Desktop、Cursor、CodeBuddy...）。

### MCP Server 两个核心能力

| 能力 | Schema | 作用 |
|---|---|---|
| ListTools | `ListToolsRequestSchema` | 告诉客户端"我有哪些工具" |
| CallTool | `CallToolRequestSchema` | 执行具体工具，返回结果 |

### 传输方式

| 方式 | 场景 | 通信原理 |
|---|---|---|
| **stdio** | 本地工具（最常用） | 客户端 spawn 子进程，通过 stdin/stdout 发 JSON-RPC |
| HTTP/SSE | 远程工具 | 通过网络请求 |

### stdio 传输原理

```
客户端                          MCP Server (子进程)
  │                                    │
  │  spawn("node mcp-server.js")       │
  │ ─────────────────────────────────> │  启动
  │                                    │
  │  通过 stdin 发 JSON-RPC 命令       │
  │ ─────────────────────────────────> │  收到命令
  │                                    │
  │  从 stdout 读 JSON-RPC 响应        │
  │ <───────────────────────────────── │  返回结果
```

**为什么调试信息要写 stderr？**

stdout 是 MCP 协议专用通道，`console.log` 会污染 stdout，导致客户端解析 JSON-RPC 失败。调试信息必须走 stderr（`process.stderr.write(...)`）。

---

## 面试高频问题

**Q: Tool use 一次可以调多个工具吗？**
> 可以，LLM 的 content 里可以有多个 type=tool_use 块，你并发执行后一起塞 tool_result 回去。

**Q: 工具执行失败怎么处理？**
> 返回 `isError: true`，不要抛异常。LLM 看到 isError 会说明错误或换方式。

**Q: MCP 和直接调 API 有什么区别？**
> MCP 是协议，工具可复用；直接调 API 是私有实现。就像 REST API 和 HTML 表单提交的区别。

**Q: stdio 传输为什么不能用 console.log？**
> stdout 是协议通道，console.log 写到 stdout 会污染 JSON-RPC 消息。调试用 stderr。

---

## 文件说明

- `tool-use-sim.js` — 纯模拟 4 步流程，理解数据结构
- `mcp-server.js` — 真实 MCP Server（get_weather + calc）
- `mcp-client-test.js` — 测试客户端，验证 server 正常工作
