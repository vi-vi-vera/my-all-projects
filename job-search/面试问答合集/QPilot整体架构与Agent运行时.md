# QPilot 整体架构与 Agent 运行时

> 依据：2026-11-05 的 `backagent`（`7a2ddc01`）与 `web`（`9456fd9`）代码核对。
> 用途：面试讲「这套系统怎么搭的、模型怎么被调起来、上下文怎么管」时的底稿。
> 和 [`QPilot大功能原理笔记.md`](./QPilot大功能原理笔记.md) 的分工：那篇按功能讲，这篇按分层讲。

---

## 〇、先纠正一个容易讲错的点

网上流行的说法是「模型在后端跑、沙箱只执行工具」。在当前仓库里，这只对了一半：

| 链路 | 入口 | SDK 跑在哪 | 是否线上主链路 |
|---|---|---|---|
| **沙箱内 runner** | `/api/agent/sandbox/chat` | 沙箱里，`claude-code-runner.js` | **是** |
| out-of-sandbox | `/api/agent/claude-out-sandbox/chat` | 后端宿主进程，工具通过 MCP 落回沙箱 | 否，文档写明「不接入 dispatcher」 |

前端的 `agentAPI.getChatUrl()` 永远返回 `/api/agent/sandbox/chat`，且 `normalizeClaudeAgentRuntime()` 无条件归一成 `claude_agent_sdk`。所以**线上是沙箱内 runner**。

这条区别决定了很多下游结论：模型请求从沙箱出网、后端拿不到模型的内部状态、沙箱网络策略会直接影响模型可用性。

但有一点两条链路相同：**SSE 事件对象始终在后端进程里**。runner 在沙箱里，后端读它的 stdout，再把事件写进 `streamManager` 的 Emitter。所以「活跃流」能用一张进程内 Map 登记，也所以这张 Map 只在本实例有效。

---

## 一、全局分层

```
浏览器 web（React + Zustand + useChat）
  │ POST /api/agent/sandbox/chat   （Accept: text/event-stream）
  ▼
backagent（Express，无状态，可多副本）
  ├─ dispatcher        运行时归一，只认 claude_agent_sdk
  ├─ bootstrap         建/复用会话、抢会话锁、准备版本记录
  ├─ capabilities      定模型、定启用 skills、定安装的 MCP
  ├─ sandbox           向 OpenSandbox 要沙箱（复用优先，失效重建）
  ├─ stage             skills / MCP 配置 / CLAUDE.md 同步进沙箱
  ├─ runner            sandbox.commands.run(node claude-code-runner.js)
  │                      prompt 写 /tmp 文件，用 stdin 喂
  │                      stdout 逐行 JSON 事件
  ├─ adapter           SDK message → UI message chunks
  ├─ streamManager     进程内 Emitter + Redis 事件缓冲（断点续传）
  └─ SSE               写浏览器；同时落 message / version
```

沙箱内部：`query()` 起模型循环 → 模型请求出网 → 工具在沙箱本地执行 → 循环继续 → 事件写 stdout。

---

## 二、请求进来之后发生了什么

### 2.1 分发

`/api/agent/sandbox/chat` → `sandboxChatController` → `resolveAgentRuntimeChatDispatch()`。

分发函数做了件很关键的事：`normalizeClaudeAgentRuntime()` **无条件返回 `CLAUDE_AGENT_SDK`**。历史会话里存着 `deepagents_out_sandbox` 或 `openai_agents_sdk`，实际也跑 Claude——旧运行时的代码还在，但入口已经收口。

### 2.2 抢锁

`findOtherRunningConversation(sessionId, conversationId)` 查 Postgres：同一会话已有 RUNNING 就返回 423。

- `reason = session_locked`：有普通对话在跑；
- `reason = preview_starting`：有启动服务在跑。

前端把 423 翻译成「当前对话正在进行中，请稍候再发送」。这是**并发写同一沙箱的硬闸**，也是主聊天活跃判断漏判时的最后一道兜底。

### 2.3 准备沙箱

读状态的顺序：Redis 运行时状态 → 数据库 → OpenSandbox `getInfo` 校准是否真活着。复用优先，回收了才重建。重建后要从版本快照恢复工作区。

### 2.4 准备能力

模型、skills、MCP 三件事在这一步定下来，见第三、五、六节。

---

## 三、LLM 怎么被调起来

### 3.1 模型怎么定

优先级：请求 `model` → 项目默认 → 用户默认 → 运行时默认。

中间两层改写：

- **别名展开**：`opus-4-7` 这类短名补全成完整 id；
- **重定向表**：`venus-*` 系列统一映射到 `claude-*`（`sandbox-chat-capabilities.service.ts:25`）；
- 如果解析出来是 OpenAI 模型，会被强制换成非 OpenAI 的默认模型——这条链路只跑 Claude。

### 3.2 runner 里的 SDK 参数

```js
{
  permissionMode: 'acceptEdits',
  cwd: '/home/user/workspace',
  maxTurns: 100,
  systemPrompt: { type: 'preset', preset: 'claude_code' },  // + append
  settingSources: [...],
  allowedTools, disallowedTools,     // 按 workflow 分档
  mcpServers,                        // 安装的 MCP + 平台工具
  includePartialMessages: true,      // token 级增量
  model: 'sonnet' | ...,
  canUseTool: 拦截 git commit / push,
  sessionStore: HttpClaudeSessionStore,  // 回调后端存 transcript
}
```

四个值得单独讲的点：

**① `preset: 'claude_code'`。** system prompt 用 Claude Code 官方预设，不是自己拼一套。项目只在末尾 append：沙箱路径、工作区结构、启用的 skills 名单、当前 workflow 的约束。

**② `includePartialMessages: true`。** 前端能逐字出字的前提。关掉就只有整段返回。

**③ `canUseTool` 里唯一硬编码的安全策略。** Bash 命令里出现 `git commit` / `git push` 直接 deny，提示走受控的 `QPILOT_GIT_*` 通道。提示词之外的第二道闸。

**④ `sessionStore` 走 HTTP 而不是本地对象。** runner 在沙箱里，拿不到后端内存，所以 SDK 每轮 append 的条目通过 `/api/agent/sandbox/claude-session-store/*` 回传。鉴权用签名的 store token，不是用户登录态。

### 3.3 事件怎么回到浏览器

runner 把每条 SDK 消息序列化成**一行 JSON** 写 stdout。后端 `runRunnerWithStdin` 读回调，`runner-event-router` 分流：

| 事件 | 处理 |
|---|---|
| `trace-*`（heartbeat / timing / write-callback） | 只做观测，不进 UI |
| `error` | 转错误事件 |
| 其余 | `convertClaudeMessageToUIChunks` 转 UI chunk |

转换的目标是 AI SDK 的 UI message 协议：`text-delta`、`reasoning-*`、`tool-input-available`、`tool-output-available`。

两个细节：

- 找不到对应 `tool-input` 的孤儿 `tool-output` 直接丢弃（`runner-event-router.service.ts:604`）；
- 最后用 `createUIMessageStream` + `pipeUIMessageStreamToResponseWithFlush` 写 SSE，同时广播 Emitter、异步 `rPush` 进 Redis 做断点续传。

所以前端 `useChat` 消费的是平台自己的 UI 协议，不需要解析 Claude 的原始事件。

### 3.4 为什么用 stdout 而不是 RPC

好处是实现简单、天然有序、进程死了流就断了，不用额外心跳判活。
代价是没有背压控制——payload 大时 stdout 会堵，所以代码里专门加了一套 `trace-runner-write-callback` / `stdout_drain` 观测，用来定位「写阻塞」。这是可以被追问到的细节。

---

## 四、Tool use

### 4.1 工具白名单按 workflow 分三档

`sandbox-runner-request.service.ts:53` 起：

| workflow | 工具 |
|---|---|
| 常规 chat | Task / TaskOutput / TaskStop / Bash / BashOutput / KillShell / Glob / Grep / Read / Edit / Write / WebFetch / WebSearch / Skill / ListMcpResources / ReadMcpResource，**外加所有已安装 MCP 的 `mcp__<server>__*`** |
| service-start | 去掉 Skill 和 Task 类，只留 Bash / Read / Write / Edit / Glob / Grep，加 `qpilot_preview_fast_start`，禁 `sandbox_build_url` |
| deploy-preflight / git-write | 只有 Bash / BashOutput / KillShell / Glob / Grep / Read / Edit / Write，不给 MCP 通配 |

service-start 收得这么窄，是因为它是内部动作流：只该装依赖、起服务、写清单，不该让模型自由发挥。

### 4.2 一次工具调用的闭环

```
模型发 tool_use
  → SDK 在沙箱执行
  → tool_result 写回
  → 同一轮继续
```

后端对执行过程是透明的，只看到事件流。工具失败信息原样回到模型，让它自己纠正——这也是「好工具」的一条：**错误信息要能让模型自我修复**，不能只返回 failed。

### 4.3 为什么不全交给模型

三条边界在代码里是硬的，不靠提示词：

1. 白名单：不在列表里的工具，模型调不到；
2. `canUseTool`：Bash 里的 git 写操作直接 deny；
3. 令牌：部署、AI 写入这类动作要求签名令牌，模型自己拼不出来。

---

## 五、MCP

这里有两类，别混。

### 5.1 平台内置 MCP provider

`src/services/mcp-provider/` 提供：`deploy`、`knowledge`、`database`、`sandbox`、`session-metadata`、`web-fetch`。这些是平台自己实现的 MCP 工具，给模型「部署、查知识库、查库、操作沙箱」的能力。

老的 deploy 系列（`deploy_begin` / `deploy_setup_env` / `deploy_generate_yaml`…）在 `LEGACY_DEPLOY_MCP_TOOL_BLOCKLIST` 里被显式禁掉，换成受控的部署工具。这就是「部署从模型手写 curl 改成受控工具」的落点。

### 5.2 用户安装的 MCP

后端把安装记录转成 SDK 的 `mcpServers`：

- key 统一成 `installed_mcp_<installationId>`；
- stdio 拼 `command + args`，HTTP/SSE 拼 endpoint；
- `config` 与加密的 `secrets` 用 `{{key}}` 模板替换后注入；
- 工具白名单直接给 `mcp__<server>__*` 通配，不逐个枚举。

### 5.3 一句话区分

> MCP 是「工具怎么接进来」的协议；平台内置 provider 是自己实现的工具服务端；用户安装的 MCP 是第三方能力。三者都不是 harness——harness 是拥有循环、状态、权限和恢复的那一层。

---

## 六、Skills

### 6.1 三类来源

| 类型 | 来源 | 落盘位置 |
|---|---|---|
| 内置 | 仓库自带，`CORE_BUNDLED_SKILL_IDS` 8 个：init-project / ui-design / app-guideline / game-guideline / design-to-code / oa / project-runtime-diagnostics / user-upload | `/home/user/.claude/skills` |
| 市场 | 用户从技能市场安装，后端给 zip 地址 | 同上 |
| 项目级 | 仓库里的 `.claude/skills` | `/workspace/.claude/skills` |

内置技能是**强制预置**的，system prompt 会引导模型自动使用；市场技能按用户勾选装。

### 6.2 同步为什么不是全量

`bundled-skills.ts` 里有个 `.qpilot-skill-hash`：把技能内容 hash 写进沙箱，下次先比对，一致就跳过。技能目录动辄几十个文件，每轮全量写既慢又打沙箱。

另有一张 `SKILL_DEPENDENCIES` 依赖图：选中某个技能时，依赖（比如 `galileo-shared`）会被一起装。`HIDDEN_SKILL_IDS` 里的技能不对用户展示。

### 6.3 「渐进式加载」到底怎么渐进

不是把所有 `SKILL.md` 塞进 prompt，而是两层：

1. system prompt 里只放**名单**：`[Enabled Claude Skills]` + 每个技能名字（`prompt-context.ts:45`）；
2. 正文留在沙箱的 `SKILL.md` 里，模型需要时用 `Skill` 工具按需读取。

常驻上下文只有几十个 token 的名单，不是几万字文档。这是能同时开十几个技能而不炸上下文的原因。

---

## 七、上下文与窗口

这是最容易被问细的一块，分四个机制。

### 7.1 上下文从哪来：三种来源，显式降级

| 来源 | 含义 | 触发条件 |
|---|---|---|
| `claude_resume` | 用上一轮 `agentSessionId` 直接 resume | 正常连续对话 |
| `claude_continue` | 不指定 id，续这个 project 最近的 session | resume 不可用但 session 还在 |
| `thread_history` | 从数据库重建 transcript 塞进 prompt | session 丢了、跨版本 |

降级会记 `contextFallbackReason`（`session_store_probe_failed` / `resume_unavailable_*`），不是静默兜底。

### 7.2 上下文存哪

SDK 的 `SessionStore` 被实现成 HTTP 客户端，条目落 `claude_session_entries` 表，按 `projectId + threadId` 分 scope。

效果：沙箱回收、Pod 重启，transcript 都还在。
代价：每轮多一次 HTTP 往返，所以只在 SDK 主动 append/load 时发生。

### 7.3 窗口本身谁管

**代码没有自己实现 compaction。** 窗口是模型能力，压缩交给 `preset: claude_code` 的 SDK。

仓库只做两件外围的事：

1. **历史重建时裁剪**：`maxUserTurns = 20`、`maxChars = 60_000`（`utils/claude-chat-history.ts:3`）。超了从最早的用户轮次开始丢。
2. **大 prompt 转附件**：超过 8KB 不直接塞消息，转成附件；单条上限 500KB（`long-prompt-attachment.service.ts`）。

准确说法：**没有自己管窗口，只在「重建历史」这条降级路径上做了轮次和字符上限。**

### 7.4 截断为什么要动模型侧

用户改一条历史消息重发，只删数据库不够——模型侧 transcript 还在，下次 resume 会接着旧内容写。

`conversation-context-reset.service.ts` 按 provider 分别清：

- **Claude**：删掉整个 scope 的 `claude_session_entries`，`providerThreadId` 置空，下次**强制开新 session**；
- **OpenAI Agents**：清 session items，下次从已截断的 message 表重建。

代价写得很直白：用户会感觉「AI 失忆」。但这是「编辑重发」语义的必要代价——要它忘记被删的内容，只能重建。

---

## 八、前端架构

**技术栈**：Vite + React 18 + Zustand + AI SDK `useChat` + `@microsoft/fetch-event-source` + Radix/shadcn + Tailwind + `@pierre/diffs` / `@pierre/trees`。

**页面**：Homepage / Projects / Chat / OpenAIChat。主战场 Chat：左对话、右工作区，六个 Tab（preview / files / history / git / environment / deploy）。

**状态**：19 个 Zustand store 按域切分——会话、命令队列、预览、控制台、编辑器文件、版本、技能、MCP、布局。

**流**：`useChat` 配自定义 transport 打 SSE，消费后端的 UI message chunk。工具调用按 `tool-input-available` / `tool-output-available` 渲染成可展开卡片。

两个细节：

- **预览页常驻挂载**：只有它一直渲染，其他 Tab 条件渲染；切 Tab 只加 `hidden`，不重建 iframe。
- **文件同步独立于聊天流**：`useFileSync` 消费 `file-change` 事件做增量合并，不重拉整棵树。

---

## 九、取舍（面试可以直接讲）

| 决策 | 换来了什么 | 付出了什么 |
|---|---|---|
| 模型跑在沙箱里 | 工具执行零跨网络、文件天然隔离 | 后端拿不到模型内部状态；沙箱网络策略直接影响模型可用性；靠 stdout 和 SessionStore 回调拼全局 |
| 事件走 stdout JSONL | 实现简单、天然有序、进程死则流断 | 没有背压控制，大 payload 会堵，只能靠观测日志发现 |
| 上下文只做「降级重建 + 裁剪」 | 不维护自己的压缩逻辑 | 超长会话只能丢早期轮次，丢了找不回来 |
| 技能「名单 + 按需读文件」 | 上下文占用可控，能同时开很多技能 | 模型得先决定去读；读错技能表现为「没按我说的做」 |
| 工具白名单按 workflow 分档 | 内部动作流不会被模型自由发挥 | 每加一个 workflow 就要维护一份清单 |

---

## 十、五个高频追问

| 追问 | 答法 |
|---|---|
| 模型到底跑在哪 | 主链路在沙箱里。`/api/agent/sandbox/chat` 起 `claude-code-runner.js`，SDK 循环和模型请求都在沙箱；后端只起进程、喂 prompt、读 stdout。out-of-sandbox 是另一条没接 dispatcher 的链路。 |
| 为什么不用 WebSocket | 事件几乎都是单向 server→client，SSE 走 HTTP、续接简单、代理和 Ingress 不用特殊配置。 |
| 上下文窗口怎么管 | 不自研压缩。正常轮次靠 SDK 的 session；降级重建时按 20 轮 / 6 万字符裁剪；超大 prompt 转附件。 |
| 工具权限怎么收 | 三层：白名单（workflow 分档）、`canUseTool`（拦 git 写）、令牌（部署和 AI 写入要求签名）。 |
| 技能为什么不会撑爆上下文 | 常驻的只有名单，正文在沙箱文件里，靠 `Skill` 工具按需读。 |

---

## 十一、代码索引

| 想知道什么 | 看哪 |
|---|---|
| 请求入口与分发 | `src/api/controllers/sandbox-chat.controller.ts`、`src/services/agent-chat-dispatcher.service.ts` |
| 会话锁与并发 | `src/services/sandbox-chat/conversation-bootstrap.service.ts:280` |
| SDK 参数 | `src/services/sandbox-runner.service.ts:1673` |
| 沙箱内 runner 脚本 | `src/services/sandbox-runner.service.ts`（`SANDBOX_RUNNER_SCRIPT`） |
| 事件路由与转换 | `src/services/sandbox-chat/runner-event-router.service.ts`、`src/utils/claude-sdk-adapter.ts` |
| 工具白名单 | `src/services/sandbox-runner-request.service.ts:53` |
| 技能预置与依赖 | `src/services/bundled-skills.ts` |
| 技能名单注入 | `src/services/sandbox-chat/prompt-context.ts:45` |
| 上下文来源与降级 | `src/services/sandbox-chat/claude-context.service.ts` |
| 历史裁剪 | `src/utils/claude-chat-history.ts` |
| 截断清理 | `src/services/conversation-context-reset.service.ts` |
| 长 prompt 转附件 | `src/services/long-prompt-attachment.service.ts` |
| 模型与 MCP 解析 | `src/services/sandbox-chat-capabilities.service.ts` |
| 平台 MCP 工具 | `src/services/mcp-provider/tools/` |
| 前端 SSE 消费 | `web/src/hooks/useAgent.ts` |
| 前端预览状态 | `web/src/stores/usePreviewStore.ts` |
