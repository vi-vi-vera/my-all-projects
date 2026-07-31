# QPilot 学习工作区（study-space）

> Git 仓库：`git@github.com:vi-vi-vera/my-all-projects.git`（monorepo 内 `study-space/`）
> 配套指引：[`../qpilot-code/study-guide.zh.md`](../qpilot-code/study-guide.zh.md)
> 知识图谱：[`../qpilot-code/knowledge-map.zh.md`](../qpilot-code/knowledge-map.zh.md)
>
> 这里是 12 个学习簇的动手工作区。每个簇一个子目录，做完后在下面打勾并写 1~2 句心得。

---

## 面试复盘：qpilot-code 项目核心技术点

> 以下基于 `qpilot-code-backagent` + `qpilot-web-v2` 源码验证（2026-07-31）。

### 一、沙箱 Git 操作性能问题

**现象**：切换到 OpenSandbox 沙箱后，Git 操作变得非常慢甚至超时。

**根因**：原模式逐条 `exec` 执行 Git 命令，但 OpenSandbox 每次 `exec` 都需要重新 `connect`，N 条命令 = N 次连接，累积延迟导致超时。

**解决**：合并多条命令到一次 `exec`，用 `set -e` + 分段标记：

```bash
set -e
# --- segment: git_init ---
git init && git remote add origin xxx
# --- segment: git_fetch ---
git fetch origin main
# --- segment: git_checkout ---
git checkout main
```

**代码位置**：`sandbox-tools.ts` + sandbox backend adapter 层（e2b 原生 SDK 有连接复用，OpenSandbox 自定义协议无连接池）

---

### 二、LLM 代码生成质量：Skill + 模板系统

**Skill 定义**：`builtin-skills.ts` → Skills Creator 内置技能

**流程**：
1. LLM 调用 Skill → 识别用户意图 + 技术栈类型（React/Vue/Node.js 等）
2. Skill 提供对应技术栈的**项目模板**（目录结构、配置文件、入口代码骨架）
3. LLM 在模板约束下生成完整项目代码

**Skill 加载**：`skills-loader.ts` 从 CDN 拉取 skill 文件，支持缓存和脚本检测

---

### 三、预览启动链路（三层兜底）

> ⚠️ **常见面试误区**：容易把"工具参数修复重试 2 次"和"预览启动 LLM 兜底"搞混，它们是两个独立系统。

**三层兜底架构**（`preview-runtime-orchestrator.service.ts`）：

```
① 复用检查：Redis 查运行时状态 → 健康检查端口 → 复用已有服务
       ↓ 不可复用
② 快路径：读 .qpilotcode manifest → executeDevStart()
       ↓ manifest 不存在或快启动失败
③ LLM 兜底：runPreviewStartFallback()
     - 沙箱内启动 Claude Runner（maxTurns: 100, permissionMode: acceptEdits）
     - prompt: "预览快速启动失败，失败原因：XXX，自动修复并启动服务"
     - 成功后 → backfillPreviewManifestIfValid() 将 .qpilotcode 写回磁盘
     - 超时 30 分钟
     - 排除了 Skill/ToolSearch/mcp 写 manifest 等工具
```

**`.qpilotcode` manifest 结构**：
```json
{
  "dev": {
    "run": "npm run dev",
    "install": "npm install",
    "port": 3000,
    "readinessPath": "/"
  }
}
```

**关键常量**：
- 分布式锁 TTL: 10 分钟（Redis `SET NX EX`）
- Claude Runner 超时: 30 分钟
- maxTurns: 100
- 使用的模型: `claude-sonnet-4-5`

---

### 四、工具参数修复（独立于预览启动）

**代码位置**：`chat-main-agent-v2/route.ts` → `createRepairToolCall()`

**场景**：LLM 生成的 tool call 参数 JSON 格式错误（代码作为字符串值时容易出问题）

**机制**：
1. `MAX_REPAIR_ATTEMPTS = 2`（连续失败 2 次后放弃）
2. 用 `claude-sonnet-4-5` 模型修复参数
3. 修复后用 Zod `safeParse` 验证
4. 成功则替换 toolCall 继续执行；失败则返回 null 让 LLM 换方式

**四个使用方**：CodeWriter Subagent / Code Subagent / Skill Subagent / 主 Orchestrator Agent

---

### 五、沙箱自动重连

**代码位置**：`sandbox.ts` → `withAutoReconnect()`

- `MAX_RECONNECTS = 2`
- 沙箱被回收时（检测 `sandbox was not found` / `502` 等模式）
- 自动重建沙箱，重新上传 Skills 文件，重新执行操作
- 沙箱池 TTL 5 分钟，每次操作前续期

---

### 六、语法预检 + 退出码提示

**代码位置**：`sandbox-tools.ts`

- **语法预检**：写入 `.js`/`.py` 文件后自动 `node --check` / `python -m py_compile` 验证
- **退出码提示**：
  - 127 → "command not found，请安装对应包"
  - 243 → "权限不足"
  - timeout → "命令超时，请拆分执行"

---

### 七、可观测性体系（四层）

> 面试高频追问："用户反馈项目启动不了，怎么快速定位？" —— 记住这四层 + 排查路径。

#### 排查路径（一句话）

> 先看 **业务阶段监控**定位卡在哪个环节（后台进程 vs LLM）→ 若是 LLM 问题去 **Langfuse** 捞 Trace → 若是基础设施问题去 **伽利略** 看日志/指标。

#### 第一层：`sandboxChatMonitorService` — 业务级阶段监控

**代码位置**：`qpilot-code-backagent/src/services/sandbox-chat-monitor.service.ts`

自建生命周期埋点，覆盖 **60+ 阶段**，按模块分类：

| 模块 | 阶段示例 |
|------|----------|
| `sandbox_chat` | request_received / conversation_created / runner_deploy / agent_run / finalization |
| `sandbox` | sandbox_init / sandbox_create / sandbox_workspace_restore / cos_sync_* |
| `preview_service` | service_fast_start / service_installing / service_launching / service_exposing / service_ready / service_failed |
| `git` | git_commit_* / git_push_* / git_clone_* |
| `version` | version_create / version_upload / version_sync / claude_context_sync |

每个阶段记录：`sessionId`/`conversationId`/`userId`（业务标识）+ `stage`/`status`（started/success/failed/warn）+ `elapsedMs`（耗时）+ `reason`/`error`（失败原因）+ `eventCode`（标准化事件码）。

- **超时检测**：每阶段有阈值 `DEFAULT_STAGE_TIMEOUTS_MS`（如 sandbox_init 120s、runner_deploy 180s）
- **卡死检测**：`STALL_ALERT_DEBOUNCE_MS = 10 分钟`，流式卡死自动上报并恢复
- **价值**：搜 sessionId → 看到完整阶段时间线 → 秒级定位卡在哪一步

#### 第二层：Langfuse — LLM 行为全链路追踪

**代码位置**：`qpilot-code-backagent/src/logger/langfuse.ts` + `langfuse-tracer.ts`

自建 Trace 树（不是简单接入）：

```
sandbox-chat (根 trace, chain)
├── sandbox-init (span)              沙箱初始化耗时
├── runner-deploy (span)             Claude Runner 部署
├── preview-service-start (span)     预览启动
│   └── preview-service:{phase}      安装→启动→暴露→就绪/失败
├── llm-turn-N (generation)          每轮 LLM（token 消耗 + 缓存命中率）
│   └── tool:{name} (tool)           每个工具调用
└── post-sync (span)                 后处理同步
```

**关键设计**：
- **Trace 传播**：`propagateAttributes` + `startActiveObservation` 建 root trace，生成 W3C `traceparent` 传给 Claude Code 原生 OTLP，串联前后端
- **Token 追踪**：累计 input/output tokens，记录 `cacheReadTokens`/`cacheCreationTokens`（缓存命中率）
- **降级**：无 API key 自动 no-op；trace 初始化超时（`TRACE_READY_TIMEOUT_MS = 1s`）自动禁用，不阻塞主流程

#### 第三层：伽利略 Galileo — 内部日志聚合 + 链路追踪

**代码位置**：`qpilot-web-v2/apps/desktop/src/shared/utils/galileo-logger.ts` + `instrumentation.ts`

- 服务端 `@tencent/galileo-node-sdk`，采样率 100%（`fraction: 1`）
- 客户端 `@tencent/aegis-web-sdk-v2`，自动注入 W3C `traceparent` 请求头（仅对 qpilot.woa.com 域名）
- 自建 4 个 OTel 指标：`api_request_duration`、`page_render_duration`、`chat_request_count`、`chat_error_count`

#### 第四层：SSE 实时调试日志

- `debugLogService`：按 sessionId 分组，实时推送调试日志到前端
- `systemEventService`：推送沙箱/服务状态事件（preview_starting / preview_ready / preview_error）

#### ⚠️ 易混淆点

Langfuse **不在前端 web 仓库**，前端 web 用的是伽利略 + OTel（`@opentelemetry/api`）。Langfuse 只在 backagent（后台）里做 LLM 追踪。

---

### 八、看门狗（Watchdog）卡死检测与恢复

**代码位置**：`qpilot-code-backagent/src/services/sandbox-chat-monitor.service.ts`（第 528-684 行）+ `resumableStreamService.ts`

> 面试高频追问："怎么区分真卡死和正常的慢？会误杀吗？多实例并发怎么办？"

#### 触发机制

`start()` 启动定时器，每 **60s**（`STALE_RUNNING_SWEEP_INTERVAL_MS`）扫一次数据库里"还在 running 但超过 60s 没更新"的对话（`findRunningChatsUpdatedBefore`，LIMIT 100）。

#### 判死逻辑（两个维度，防误判核心）

```
维度① hasActiveStream = probeActiveStream(streamKey)   ← 流还活着吗（关键）
维度② conversationAgeMs                                ← 卡了多久
判死条件：!hasActiveStream && conversationAgeMs >= 10 分钟
```

- **流还活着（哪怕很慢）→ 只发 warn 告警，绝不判死** → 不会误杀慢任务
- **流断了 + 超过 10 分钟 → 才判死** → 这才是真卡死（进程崩、Runner 挂）
- 分级阈值：每阶段有 `STAGE_STALL_THRESHOLDS_MS`（如 runner_deploy 180s），超过发 warn；恢复统一 `STALE_RUNNING_RECOVERY_MS = 10 分钟`；`STALL_ALERT_DEBOUNCE_MS = 10 分钟` 防告警刷屏

#### 「流在进程里还在不在」怎么判断（核心考点）

基于 `resumable-stream@2.2.12`（**Redis Pub/Sub** 实现），分两层：

1. **浅层**：Redis 里有没有 streamId（key = `resume-stream:active:{streamKey}`，TTL 1 小时）。有 key 只说明"曾注册过"，不代表现在活着（进程崩了 key 因 TTL 还残留）。
2. **深层（关键）**：`resumeExistingStream(streamId)` **主动向生产者进程发 ack 探针**：
   - 生产者进程活着 → 响应 ack → 返回 stream 对象 → **活着**（哪怕在慢慢生成）
   - 生产者已正常结束 → 返回 `null` → 判死，清 key
   - 生产者进程崩溃/内存态丢失 → 抛 `"Timeout waiting for ack"` → 判死，清 key

**本质**：不是靠"多久没更新"推测，而是**真实的存活探测（liveness probe）**——进程活着就能应答，死了就超时。避免僵死流被 TTL 锁住最多 1 小时。探测后 `getReader().cancel()`，因每次 resume 创建独立 subscriber，不影响真实读者（断线重连的前端）。

| 情况 | Redis 有 key | 响应 ack | 结果 |
|------|:---:|:---:|------|
| LLM 慢慢生成 | ✅ | ✅ | 活着（不判死） |
| 进程崩溃/OOM | ✅(残留) | ❌超时 | 判死 |
| 流已正常结束 | ✅ | 返回 null | 判死 |
| key 已过期 | ❌ | — | 判死 |

#### 「恢复」做了什么

`reportAndRecover`（第 639-684 行）**不是重试，是标记失败**：
1. 上报 failed 日志（`failureSource: sandbox_chat_watchdog`，伽利略里可区分是看门狗判的）
2. 补一条 `chat_completed / failed` 生命周期日志
3. `ConversationRepository.update(id, { status: FAILED })` — 把 running 改成 failed

**用户侧**：此时流已断（收不到 SSE），刷新后看到对话失败态，可重新发起。价值 = 避免对话永久挂 running 占资源。

#### 多实例（多 Pod）并发

- **单实例内**：有 `sweepRunning` 布尔锁防重入
- **跨实例**：**没有分布式锁**，多 Pod 会各自扫描，理论上可能重复恢复同一对话
- **为什么可接受**：恢复本质是幂等的状态更新（`UPDATE status='failed'`），多次执行结果一致，最多告警日志重复几条。对比预览启动（`preview-runtime-orchestrator`）有 Redis 分布式锁（TTL 10 分钟），看门狗因操作幂等、代价低，**有意不加锁**的权衡。

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
| 6 | q-08 Vite base + nginx | base / proxy_pass / 子路径部署 / 负载均衡 / HTTPS / 缓存 / 限流 / CORS / WebSocket | [`06-vite-nginx/`](./06-vite-nginx/) | ✅ | Vite base 配子路径前缀 + nginx 反代（静态/try_files/API转发/WebSocket）+ 负载均衡 upstream + HTTPS SSL Termination + 缓存策略（强缓存/协商缓存/hash文件名）+ 限流 limit_req + CORS 反代同源 + WebSocket 三件套，详见 [`06-vite-nginx/NOTES.md`](./06-vite-nginx/NOTES.md) |
| 7 | q-05 Redis 缓存与降级 | cache-aside / 雪崩 / 击穿 / 穿透 / 降级 / 持久化 / 集群 | [`07-redis/`](./07-redis/) | ✅ | Cache-Aside 先DB再删缓存 + 雪崩TTL抖动 + 击穿互斥锁SET-NX + 穿透布隆过滤器 + 降级熔断三级防御 + RDB/AOF混合持久化 + Sentinel/Cluster，详见 [`07-redis/NOTES.md`](./07-redis/NOTES.md) |
| 8 | q-03 Linux 沙箱 + 适配器 | namespace(7种) / cgroups(CPU/内存) / Adapter模式 / 依赖倒置 | [`08-sandbox/`](./08-sandbox/) | ✅ | namespace隔离资源视图 + cgroups限制资源用量 + 适配器模式（Sandbox接口+Mock/Docker实现+Demo验证），详见 [`08-sandbox/NOTES.md`](./08-sandbox/NOTES.md) |
| 9 | q-04 对象池 + warm pool | min/max/idle / 预热 / 扩缩 | [`09-object-pool/`](./09-object-pool/) | ✅ | 对象池 = 共享单车：min 预热备用，max 防压垮，idleTimeout 空闲回收；超出 max 排队等，超时报 TimeoutError，详见 [`09-object-pool/NOTES.md`](./09-object-pool/NOTES.md) |
| 10 | q-02 MCP + Tool use | JSON-RPC / stdio / 错误归一化 | [`10-mcp/`](./10-mcp/) | ✅ | Tool use 4 步：给 LLM 工具列表 → LLM 返回 stop_reason="tool_use" + 参数 → 宿主执行 → tool_result 用 tool_use_id 对应塞回；MCP 是标准协议，ListTools + CallTool 两个 Schema，stdio 传输 stdout 归协议/stderr 归调试，详见 [`10-mcp/NOTES.md`](./10-mcp/NOTES.md) |
| 11 | q-11 OTel + Langfuse | span / traceparent / 采样 / GenAI埋点 | [`11-otel-langfuse/`](./11-otel-langfuse/) | ✅ | OTel 采数据 + Langfuse/Galileo 看数据；startActiveSpan 自动建立父子 Span（Context栈）；propagation.inject/extract 跨服务传递 traceparent；采样策略 AlwaysOn/RatioBased/ParentBased/Tail-based；GenAI Conventions 标准属性让平台自动识别 LLM 调用，详见 [`11-otel-langfuse/NOTES.md`](./11-otel-langfuse/NOTES.md) |
| 12 | q-07 Feature Flag + 权限 | toggle / 灰度哈希 / 双闸门 | [`12-feature-flag/`](./12-feature-flag/) | ✅ | flag 是功能电闸：白名单优先 > 哈希灰度(hash(userId)%100<rollout，同用户稳定) > 总开关；前端隐藏入口（体验层）+ 后端 requireFlag 中间件拦截（安全层）= 双闸门；实际项目：qpilot-web 白名单、yuheng 盘古 RBAC、guild_web 七彩石+版本灰度，详见 [`12-feature-flag/NOTES.md`](./12-feature-flag/NOTES.md) |

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
