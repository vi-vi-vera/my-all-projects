# QPilot Code Agent — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (24 topics)


### 1. Blast radius 思维

> Related dimensions: 🔒 `security`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Martin Fowler - Feature Toggles 文章
- [ ] OWASP Cheat Sheet - Authorization 章节

#### 🛠️ Hands-on

- [ ] 在小 Express 项目里实现「白名单 + feature flag」双闸门，前端按 flag 隐藏入口、后端按白名单拒绝请求
- [ ] 为某个表单字段做双态 UI，对比改造前后用户的困惑度

---

### 2. Express middleware 模型

> Related dimensions: 🧩 `feature`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] Express 官方文档 - Routing 与 Middleware
- [ ] MDN: Server-Sent Events 与 Connection 头部

#### 🛠️ Hands-on

- [ ] 写一个 SSE 端点，故意挂在 nginx 后面观察 X-Accel-Buffering 的影响
- [ ] 在 SSE 端点里手动注入 OTel span，验证下游 LLM 调用能拿到 trace_id

---

### 3. Feature flag 模式

> Related dimensions: 🔒 `security`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Martin Fowler - Feature Toggles 文章
- [ ] OWASP Cheat Sheet - Authorization 章节

#### 🛠️ Hands-on

- [ ] 在小 Express 项目里实现「白名单 + feature flag」双闸门，前端按 flag 隐藏入口、后端按白名单拒绝请求
- [ ] 为某个表单字段做双态 UI，对比改造前后用户的困惑度

---

### 4. HTTP 长连接 keepalive

> Related dimensions: 🧩 `feature`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] Express 官方文档 - Routing 与 Middleware
- [ ] MDN: Server-Sent Events 与 Connection 头部

#### 🛠️ Hands-on

- [ ] 写一个 SSE 端点，故意挂在 nginx 后面观察 X-Accel-Buffering 的影响
- [ ] 在 SSE 端点里手动注入 OTel span，验证下游 LLM 调用能拿到 trace_id

---

### 5. Hook 单一职责

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] React 官方文档 - Custom Hooks 章节
- [ ] Dan Abramov - 'Why Do React Hooks Rely on Call Order?'

#### 🛠️ Hands-on

- [ ] 把一个混做 fetch + 表单 + 校验的 hook 按数据生命周期拆成 3 个 hook
- [ ] 用 Zustand 实现两个 hook 的 store 隔离，写最小单测

---

### 6. Linux 容器隔离

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] e2b 官方文档 - Sandbox 概念与生命周期
- [ ] Linux man-pages: namespaces(7) 与 cgroups(7)

#### 🛠️ Hands-on

- [ ] 用 docker exec 包一个最小沙箱接口，支持 exec / read / write 三件事
- [ ] 把同一段业务代码挂到两个 docker 实例上，跑一遍灰度切换

---

### 7. MCP 协议核心

> Related dimensions: 🧩 `feature`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Anthropic - Model Context Protocol 官方文档
- [ ] Anthropic - Tool use API reference

#### 🛠️ Hands-on

- [ ] 用 MCP SDK 写最小 server，暴露 read_file / write_file 两个工具，接到 Claude Desktop 验证
- [ ] 在现有项目给 mcp-catalog 加一个新工具（如 list_dir），跑通 tool_use → tool_result

---

### 8. OTel Span / Attribute

> Related dimensions: 📈 `observability`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] OpenTelemetry 官方文档 - Trace Context Propagation
- [ ] Langfuse 官方文档 - Tracing 与 OpenTelemetry 集成

#### 🛠️ Hands-on

- [ ] 在一个 Express + Anthropic SDK 的小项目里接入 OTel + Langfuse，验证两边 trace_id 一致
- [ ] 故意让某次 LLM 调用超时，从 trace 里定位卡在哪一步

---

### 9. Redis 故障与降级

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Redis 官方文档 - Persistence 与 Replication 章节
- [ ] Martin Kleppmann《Designing Data-Intensive Applications》第 5 章 Replication

#### 🛠️ Hands-on

- [ ] 用 ioredis 写一个 cache-aside 包装器，实现 Redis miss 自动从 Postgres 回填
- [ ] 故意 kill 掉 Redis 一段时间，看降级路径是否正确触发

---

### 10. SSE 协议规范

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] WHATWG HTML Living Standard - Server-Sent Events
- [ ] MDN: Using Server-Sent Events

#### 🛠️ Hands-on

- [ ] 用 Express 写 30 行 SSE demo，支持 Last-Event-ID 续接
- [ ] demo 接到本地 nginx 反代后面，验证 X-Accel-Buffering 关闭后流式首字节

---

### 11. Tool-use 协议

> Related dimensions: 🧩 `feature`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Anthropic - Model Context Protocol 官方文档
- [ ] Anthropic - Tool use API reference

#### 🛠️ Hands-on

- [ ] 用 MCP SDK 写最小 server，暴露 read_file / write_file 两个工具，接到 Claude Desktop 验证
- [ ] 在现有项目给 mcp-catalog 加一个新工具（如 list_dir），跑通 tool_use → tool_result

---

### 12. W3C Trace Context

> Related dimensions: 📈 `observability`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] OpenTelemetry 官方文档 - Trace Context Propagation
- [ ] Langfuse 官方文档 - Tracing 与 OpenTelemetry 集成

#### 🛠️ Hands-on

- [ ] 在一个 Express + Anthropic SDK 的小项目里接入 OTel + Langfuse，验证两边 trace_id 一致
- [ ] 故意让某次 LLM 调用超时，从 trace 里定位卡在哪一步

---

### 13. Zustand selector / slice

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] React 官方文档 - Custom Hooks 章节
- [ ] Dan Abramov - 'Why Do React Hooks Rely on Call Order?'

#### 🛠️ Hands-on

- [ ] 把一个混做 fetch + 表单 + 校验的 hook 按数据生命周期拆成 3 个 hook
- [ ] 用 Zustand 实现两个 hook 的 store 隔离，写最小单测

---

### 14. fetch-event-source

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] WHATWG HTML Living Standard - Server-Sent Events
- [ ] MDN: Using Server-Sent Events

#### 🛠️ Hands-on

- [ ] 用 Express 写 30 行 SSE demo，支持 Last-Event-ID 续接
- [ ] demo 接到本地 nginx 反代后面，验证 X-Accel-Buffering 关闭后流式首字节

---

### 15. git plumbing 命令

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Pro Git book - 第 10 章 Git Internals
- [ ] git-stash(1) man page

#### 🛠️ Hands-on

- [ ] 写一个脚本，把 status + add + commit 合并成一条 set -e 命令，输出按分隔符切片
- [ ] 构造一个有 untracked 文件的仓库跑 pull，复现 stash -u / pop 的修复

---

### 16. postMessage origin 校验

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] MDN: Window.postMessage 与 origin 安全部分
- [ ] XState 文档 - Statecharts in 15 Minutes（状态机思维入门）

#### 🛠️ Hands-on

- [ ] 把一个含三个 setInterval + 多 useEffect 的小组件重构成 useReducer 状态机
- [ ] 写一个 iframe 预览 demo，加 origin 校验和 inflight token 保护

---

### 17. shell set -e / pipefail

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Pro Git book - 第 10 章 Git Internals
- [ ] git-stash(1) man page

#### 🛠️ Hands-on

- [ ] 写一个脚本，把 status + add + commit 合并成一条 set -e 命令，输出按分隔符切片
- [ ] 构造一个有 untracked 文件的仓库跑 pull，复现 stash -u / pop 的修复

---

### 18. vite base / publicPath

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Vite 官方文档 - Public Base Path
- [ ] nginx proxy_pass 与 sub_filter 章节

#### 🛠️ Hands-on

- [ ] 用一个 vite 项目 build 出 dist，挂到 nginx 的子路径下，修复 /assets 加载问题
- [ ] 给 deploy 加一个简单的 stderr tail 面板，故意制造 build 失败验证显示

---

### 19. 分层镜像/初始化

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Apache Commons Pool - 设计文档（对象池经典实现）
- [ ] Cloudflare 工程博客 - 关于 isolate 与 warm 实例的文章

#### 🛠️ Hands-on

- [ ] 本地用 docker 实现一个小型 warm pool（5 个实例），测对比冷启动 vs 池命中的耗时
- [ ] 给池加「使用 N 次后销毁」策略，跑一晚上看资源是否不再上涨

---

### 20. 反向代理 host/path

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Vite 官方文档 - Public Base Path
- [ ] nginx proxy_pass 与 sub_filter 章节

#### 🛠️ Hands-on

- [ ] 用一个 vite 项目 build 出 dist，挂到 nginx 的子路径下，修复 /assets 加载问题
- [ ] 给 deploy 加一个简单的 stderr tail 面板，故意制造 build 失败验证显示

---

### 21. 对象池模式

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Apache Commons Pool - 设计文档（对象池经典实现）
- [ ] Cloudflare 工程博客 - 关于 isolate 与 warm 实例的文章

#### 🛠️ Hands-on

- [ ] 本地用 docker 实现一个小型 warm pool（5 个实例），测对比冷启动 vs 池命中的耗时
- [ ] 给池加「使用 N 次后销毁」策略，跑一晚上看资源是否不再上涨

---

### 22. 状态机/有限状态自动机

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] MDN: Window.postMessage 与 origin 安全部分
- [ ] XState 文档 - Statecharts in 15 Minutes（状态机思维入门）

#### 🛠️ Hands-on

- [ ] 把一个含三个 setInterval + 多 useEffect 的小组件重构成 useReducer 状态机
- [ ] 写一个 iframe 预览 demo，加 origin 校验和 inflight token 保护

---

### 23. 缓存一致性模型

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Redis 官方文档 - Persistence 与 Replication 章节
- [ ] Martin Kleppmann《Designing Data-Intensive Applications》第 5 章 Replication

#### 🛠️ Hands-on

- [ ] 用 ioredis 写一个 cache-aside 包装器，实现 Redis miss 自动从 Postgres 回填
- [ ] 故意 kill 掉 Redis 一段时间，看降级路径是否正确触发

---

### 24. 适配器模式

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] e2b 官方文档 - Sandbox 概念与生命周期
- [ ] Linux man-pages: namespaces(7) 与 cgroups(7)

#### 🛠️ Hands-on

- [ ] 用 docker exec 包一个最小沙箱接口，支持 exec / read / write 三件事
- [ ] 把同一段业务代码挂到两个 docker 实例上，跑一遍灰度切换

---

## ✨ Bonus (12 topics)


### 1. AbortController 取消语义

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] MDN: Window.postMessage 与 origin 安全部分
- [ ] XState 文档 - Statecharts in 15 Minutes（状态机思维入门）

#### 🛠️ Hands-on

- [ ] 把一个含三个 setInterval + 多 useEffect 的小组件重构成 useReducer 状态机
- [ ] 写一个 iframe 预览 demo，加 origin 校验和 inflight token 保护

---

### 2. LLM 可观测性指标

> Related dimensions: 📈 `observability`
> Appears in: `q-11`

#### 📖 Must-read

- [ ] OpenTelemetry 官方文档 - Trace Context Propagation
- [ ] Langfuse 官方文档 - Tracing 与 OpenTelemetry 集成

#### 🛠️ Hands-on

- [ ] 在一个 Express + Anthropic SDK 的小项目里接入 OTel + Langfuse，验证两边 trace_id 一致
- [ ] 故意让某次 LLM 调用超时，从 trace 里定位卡在哪一步

---

### 3. SSE 错误协议

> Related dimensions: 🧩 `feature`
> Appears in: `q-12`

#### 📖 Must-read

- [ ] Express 官方文档 - Routing 与 Middleware
- [ ] MDN: Server-Sent Events 与 Connection 头部

#### 🛠️ Hands-on

- [ ] 写一个 SSE 端点，故意挂在 nginx 后面观察 X-Accel-Buffering 的影响
- [ ] 在 SSE 端点里手动注入 OTel span，验证下游 LLM 调用能拿到 trace_id

---

### 4. WebSocket vs SSE

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] WHATWG HTML Living Standard - Server-Sent Events
- [ ] MDN: Using Server-Sent Events

#### 🛠️ Hands-on

- [ ] 用 Express 写 30 行 SSE demo，支持 Last-Event-ID 续接
- [ ] demo 接到本地 nginx 反代后面，验证 X-Accel-Buffering 关闭后流式首字节

---

### 5. git stash -u 语义

> Related dimensions: ⚡ `performance`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Pro Git book - 第 10 章 Git Internals
- [ ] git-stash(1) man page

#### 🛠️ Hands-on

- [ ] 写一个脚本，把 status + add + commit 合并成一条 set -e 命令，输出按分隔符切片
- [ ] 构造一个有 untracked 文件的仓库跑 pull，复现 stash -u / pop 的修复

---

### 6. 供应商可替换性

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] e2b 官方文档 - Sandbox 概念与生命周期
- [ ] Linux man-pages: namespaces(7) 与 cgroups(7)

#### 🛠️ Hands-on

- [ ] 用 docker exec 包一个最小沙箱接口，支持 exec / read / write 三件事
- [ ] 把同一段业务代码挂到两个 docker 实例上，跑一遍灰度切换

---

### 7. 依赖方向设计

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-10`

#### 📖 Must-read

- [ ] React 官方文档 - Custom Hooks 章节
- [ ] Dan Abramov - 'Why Do React Hooks Rely on Call Order?'

#### 🛠️ Hands-on

- [ ] 把一个混做 fetch + 表单 + 校验的 hook 按数据生命周期拆成 3 个 hook
- [ ] 用 Zustand 实现两个 hook 的 store 隔离，写最小单测

---

### 8. 前后端权限分层

> Related dimensions: 🔒 `security`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] Martin Fowler - Feature Toggles 文章
- [ ] OWASP Cheat Sheet - Authorization 章节

#### 🛠️ Hands-on

- [ ] 在小 Express 项目里实现「白名单 + feature flag」双闸门，前端按 flag 隐藏入口、后端按白名单拒绝请求
- [ ] 为某个表单字段做双态 UI，对比改造前后用户的困惑度

---

### 9. 动态扩缩策略

> Related dimensions: ⚡ `performance`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Apache Commons Pool - 设计文档（对象池经典实现）
- [ ] Cloudflare 工程博客 - 关于 isolate 与 warm 实例的文章

#### 🛠️ Hands-on

- [ ] 本地用 docker 实现一个小型 warm pool（5 个实例），测对比冷启动 vs 池命中的耗时
- [ ] 给池加「使用 N 次后销毁」策略，跑一晚上看资源是否不再上涨

---

### 10. 异步双写与队列

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] Redis 官方文档 - Persistence 与 Replication 章节
- [ ] Martin Kleppmann《Designing Data-Intensive Applications》第 5 章 Replication

#### 🛠️ Hands-on

- [ ] 用 ioredis 写一个 cache-aside 包装器，实现 Redis miss 自动从 Postgres 回填
- [ ] 故意 kill 掉 Redis 一段时间，看降级路径是否正确触发

---

### 11. 构建产物路径无关性

> Related dimensions: 🧩 `feature`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] Vite 官方文档 - Public Base Path
- [ ] nginx proxy_pass 与 sub_filter 章节

#### 🛠️ Hands-on

- [ ] 用一个 vite 项目 build 出 dist，挂到 nginx 的子路径下，修复 /assets 加载问题
- [ ] 给 deploy 加一个简单的 stderr tail 面板，故意制造 build 失败验证显示

---

### 12. 错误归一化模式

> Related dimensions: 🧩 `feature`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] Anthropic - Model Context Protocol 官方文档
- [ ] Anthropic - Tool use API reference

#### 🛠️ Hands-on

- [ ] 用 MCP SDK 写最小 server，暴露 read_file / write_file 两个工具，接到 Claude Desktop 验证
- [ ] 在现有项目给 mcp-catalog 加一个新工具（如 list_dir），跑通 tool_use → tool_result

---

