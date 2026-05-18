# QPilot 学习工作区（study-space）

> 配套指引：[`../qpilot-code/study-guide.zh.md`](../qpilot-code/study-guide.zh.md)
> 知识图谱：[`../qpilot-code/knowledge-map.zh.md`](../qpilot-code/knowledge-map.zh.md)
>
> 这里是 12 个学习簇的动手工作区。每个簇一个子目录，做完后在下面打勾并写 1~2 句心得。

---

## 环境清单

完成一项打一个勾，**所有项打勾后再进簇 1**。

- [ ] Node.js LTS（≥ 20.x）— `node -v`
- [ ] Git for Windows（含 Git Bash）— `bash --version`
- [ ] Docker Desktop（≥ 24.x）— `docker -v`
- [ ] WSL2 + Ubuntu（簇 3 起强烈推荐）— `wsl -l -v`

> WSL2 安装：管理员 PowerShell 跑 `wsl --install`，重启后设 Linux 用户名密码即可。

---

## 进度看板

| # | 簇 | 关键词 | 目录 | 完成 | 一句话心得 |
|---|---|---|---|---|---|
| 1 | q-01 SSE 流式推送 | SSE / EventSource / fetch-event-source | [`01-sse/`](./01-sse/) | ✅ | 报文 `\n\n` 结尾 + EventSource 自动重连 + Last-Event-ID 续传，详见 [`01-sse/NOTES.md`](./01-sse/NOTES.md) |
| 2 | q-12 Express 中间件 | middleware / keepalive / SSE error | [`02-express-mw/`](./02-express-mw/) | ✅ | 洋葱模型 + 4参错误中间件 + SSE event:error 协议，详见 [`02-express-mw/NOTES.md`](./02-express-mw/NOTES.md) |
| 3 | q-06 git + shell 严格模式 | plumbing / set -euo pipefail / stash -u | [`03-git-shell/`](./03-git-shell/) | ✅ | 四件套防御 + git 三层对象模型 + stash -u，详见 [`03-git-shell/NOTES.md`](./03-git-shell/NOTES.md) |
| 4 | q-10 React Hooks + Zustand | 单一职责 / selector / slice | [`04-hooks-zustand/`](./04-hooks-zustand/) | ✅ | Hook 3 信号拆分 + Zustand selector 浅比较，详见 [`04-hooks-zustand/NOTES.md`](./04-hooks-zustand/NOTES.md) |
| 5 | q-09 postMessage + 状态机 | origin 校验 / FSM / AbortController | [`05-postmsg-fsm/`](./05-postmsg-fsm/) | ✅ | 双向 origin 校验 + useReducer 状态机 + abort 双保险，详见 [`05-postmsg-fsm/NOTES.md`](./05-postmsg-fsm/NOTES.md) |
| 6 | q-08 Vite base + nginx | base / proxy_pass / 子路径部署 | [`06-vite-nginx/`](./06-vite-nginx/) | ☐ |  |
| 7 | q-05 Redis 缓存与降级 | cache-aside / 雪崩 / 双写 | [`07-redis/`](./07-redis/) | ☐ |  |
| 8 | q-03 Linux 沙箱 + 适配器 | namespace / cgroups / Adapter | [`08-sandbox/`](./08-sandbox/) | ☐ |  |
| 9 | q-04 对象池 + warm pool | min/max/idle / 预热 / 扩缩 | [`09-object-pool/`](./09-object-pool/) | ☐ |  |
| 10 | q-02 MCP + Tool use | JSON-RPC / capability / 错误归一化 | [`10-mcp/`](./10-mcp/) | ☐ |  |
| 11 | q-11 OTel + Langfuse | span / traceparent / LLM 埋点 | [`11-otel-langfuse/`](./11-otel-langfuse/) | ☐ |  |
| 12 | q-07 Feature Flag + 权限 | toggle / blast radius / 后端鉴权 | [`12-feature-flag/`](./12-feature-flag/) | ☐ |  |

---

## 全局自检（12 个一句话问题）

每题口头 30 秒答出即合格。学完所有簇后回来作答。

1. SSE 报文为什么必须 `\n\n` 结尾？
2. Express 里 `next(err)` 和 `throw err` 在 async 函数里的差别？
3. `set -euo pipefail` 各个 flag 分别防什么？
4. 自定义 hook 拆分的判断标准？
5. `postMessage` 三大安全坑？
6. Vite `base` 没配会怎样？
7. Redis 挂了如何不让请求 503？
8. Docker 容器为什么"轻"？
9. 对象池的 min/max/idleTimeout 怎么定？
10. 一次 Tool use 的 4 步报文？
11. `traceparent` 头长啥样？
12. Feature flag 与 Authorization 各自的边界？

---

## 学习节奏

- **每个簇 1~2 个晚上**，约 2~3 小时。
- 三段式：**读（精选 1~2 篇）→ 跑（最小 demo）→ 答（自检 + 心得）**。
- 卡住别硬刚：把"卡在哪一步、报什么错"告诉 CodeBuddy，立即排查。
- **先做 demo 再读规范**，不要囤资料。
