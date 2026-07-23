# 10 MCP + Tool use 学习笔记

## 一句话心得

> Tool use 4 步走：模型看工具列表 → 返回 stop_reason="tool_use" + JSON 参数 → 你执行工具 → 结果塞回模型，id 必须对应；MCP 是这套流程的"标准插头"，让任意 AI 客户端都能接你的工具。

---

## Tool use 4 步流程

```
用户消息 + 工具列表
        ↓
  [模型] 判断要用哪个工具
        ↓
  stop_reason = "tool_use"
  content[0].type = "tool_use"
  content[0].id   = "toolu_xxx"  ← 这个 id 很关键
  content[0].input = { city: "北京" }
        ↓
  [你的程序] 真正执行工具，拿到结果
        ↓
  把结果作为 role=user / type=tool_result 发回
  tool_use_id 必须对应步骤 2 的 id
        ↓
  [模型] 生成最终回答
```

### 关键：stop_reason 判断

| stop_reason | 含义 |
|---|---|
| `"end_turn"` | 模型说完了，直接显示 |
| `"tool_use"` | 还没完，等你执行工具后继续 |
| `"max_tokens"` | token 用完了，需要继续对话 |

---

## MCP 是什么

**没有 MCP**：每个 AI 自己定义一套工具调用格式，不通用
**有了 MCP**：统一协议，一个 MCP Server 可以接入所有支持 MCP 的客户端（Claude Desktop、Cursor、Windsurf...）

### MCP 传输方式

| 方式 | 场景 |
|---|---|
| `stdio` | 本地工具（客户端 spawn 子进程）最常用 |
| `HTTP/SSE` | 远程工具，需要网络访问 |

### MCP Server 骨架

```js
// 1. 声明有工具
ListToolsRequestSchema → 返回工具列表

// 2. 执行工具
CallToolRequestSchema → 根据 name 执行，返回 { content: [{type:'text', text:'...'}] }

// 3. 注意：stdout 属于 MCP 协议，调试信息要写 stderr！
```

---

## 面试高频问题

**Q: Tool use 一次可以调多个工具吗？**
> 可以，模型 content 里可以有多个 type=tool_use 块，你并发执行，然后一起发 tool_result 回去。

**Q: 工具执行失败怎么处理？**
> 返回时加 `isError: true`，模型会知道工具出错，会在回答里说明或尝试其他方法。不要抛异常。

**Q: MCP 和直接调 API 有什么区别？**
> MCP 是协议，让工具可复用；直接调 API 是私有实现，只能自己用。就像 REST API 和 HTML 表单提交的区别。

---

## 文件说明

- `tool-use-sim.js` — 纯模拟 4 步流程，理解数据结构
- `mcp-server.js` — 真实 MCP Server（get_weather + calc）
- `mcp-client-test.js` — 测试客户端，验证 server 正常工作
