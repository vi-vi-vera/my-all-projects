# Code Agent — 学习指引

> 适合人群：会写 Node/TypeScript，了解一点 LLM API，但还没系统做过 AI coding agent 后台的人。
> 目标：按阶段读完项目后，能独立讲清 Code Agent 的模块、工作流、安全边界和关键取舍。

## 0. 学习路线总览

| 阶段 | 主题 | 目标 |
|---|---|---|
| A | 入口与数据模型 | 看懂请求进来后会创建哪些对象 |
| B | Agent 主流程 | 看懂 Orchestrator 如何驱动 Claude Code |
| C | 安全边界 | 看懂 Prompt Guard 和工具权限各管什么 |
| D | 模板与 Remix | 看懂为什么有模板、模糊匹配和二创 |
| E | 验证部署 | 看懂代码如何变成可访问应用 |
| F | 观测与可靠性 | 看懂取消、心跳、trace 和配置热更新 |

推荐节奏：每天一个阶段，6 天可以建立完整理解；再用 2-3 天补动手 demo。

## 阶段 A：入口与数据模型

### 要读的文件

- `src/api/routes/agent.routes.ts`
- `src/core/database/schema.ts`
- `src/services/orchestration/session.service.ts`
- `src/services/workspace/workspace.service.ts`

### 你要搞懂的问题

1. `prepareConversation` 做了哪些事情？
2. `Session` 和本地 workspace 是什么关系？
3. 为什么 `Conversation` 和 `App` 不合并？
4. `/start` 为什么可以先返回？

### 动手练习

- 画一张图：`request -> session -> workspace -> conversation -> app`。
- 写一个最小 Express demo：`POST /tasks` 立即返回 taskId，后台更新任务状态，`GET /tasks/:id` 查询。

### 自检

- [ ] 能说出 `sessionId`、`conversationId`、`appId` 的区别。
- [ ] 能解释 `/api/agent/check` 为什么只在 deployed 时附带 appInfo。
- [ ] 能说明 workspace 删除和 session 删除之间的关系。

## 阶段 B：Agent 主流程

### 要读的文件

- `src/services/chat.service.ts`
- `src/services/orchestration/orchestrator.service.ts`
- `src/services/code/code.service.ts`
- `src/services/code/message.service.ts`

### 你要搞懂的问题

1. ChatService 为什么叫 facade？
2. Orchestrator 的主流程有哪些阶段？
3. CodeService 为什么只做执行，不做业务判断？
4. AI 输出如何变成数据库里的 message parts？

### 动手练习

- 用 EventEmitter 写一个三阶段任务：prepare、execute、deploy，并让两个监听器分别记录日志和耗时。
- 用 ReadableStream 模拟 token 流，把每个 chunk 批量写入内存数组。

### 自检

- [ ] 能复述 `runChatPipeline` 的 10 个阶段。
- [ ] 能解释 `MessageService.createMessagePersistenceHandler` 为什么要防抖写入。
- [ ] 能说明 `agentSessionId` 对多轮会话的意义。

## 阶段 C：安全边界

### 要读的文件

- `src/services/pre-process.service.ts`
- `src/prompts/pre-process.ts`
- `src/services/code/bash-guard.ts`
- `src/services/code/trusted-dirs.ts`
- `src/services/code/code.service.ts` 的 `canUseTool`

### 你要搞懂的问题

1. Prompt Guard 和工具权限边界分别防什么？
2. Guard 观察模式和阻断模式有什么区别？
3. 为什么路径类工具必须做 `path.resolve` 后再判断？
4. 为什么插件 skills 目录只能读不能写？

### 动手练习

- 写一个 `safeResolve(workspace, filePath)`，覆盖 `../x`、`/etc/passwd`、`./src/a.ts`。
- 写 10 条 Bash 命令，给每条标注 allow / deny 和原因。

### 自检

- [ ] 能说明“只靠 system prompt 不够”的原因。
- [ ] 能解释工作区外可信目录为什么只允许读。
- [ ] 能举出一个 prompt guard 放行但工具层仍应拦截的例子。

## 阶段 D：模板与 Remix

### 要读的文件

- `docs/template-system.md`
- `src/services/cache/template-matcher.service.ts`
- `src/services/template/template-executor.ts`
- `src/services/template/template-replacer.ts`
- `src/services/orchestration/remix.service.ts`
- `src/prompts/remix.prompt.ts`

### 你要搞懂的问题

1. `skeletonPrompt` 是什么？
2. 严格匹配和模糊匹配的区别是什么？
3. 为什么 fuzzy 不直接命中，而是转 LLM judge？
4. `need_modify` 为什么转 remix？
5. Remix 如何恢复源码？

### 动手练习

- 给 3 条相似 prompt 手工抽骨架，判断哪些可以共用模板。
- 写一个简单模板替换器，支持 `{{TMPL:TITLE:1}}` 和 `{{TMPL_RAND:COLOR:red|blue}}`。
- 模拟一个 `workspaces/app-1`，复制到新 workspace 后修改标题。

### 自检

- [ ] 能说出严格模板命中为什么可以放在 `/start` 响应前。
- [ ] 能解释 `miss`、`need_modify`、`strict` 三种分支。
- [ ] 能说明模板误命中的产品后果。

## 阶段 E：验证、打包、部署

### 要读的文件

- `src/services/validation/validation.service.ts`
- `src/services/orchestration/validation-loop.ts`
- `src/services/app.service.ts`
- `src/services/orchestration/deployment.service.ts`
- `src/services/workspace/bundler.ts`
- `src/services/preview/screenshot.service.ts`

### 你要搞懂的问题

1. 静态错误、打包错误、运行时错误分别怎么发现？
2. 自动修复为什么有最大轮数？
3. `publishWorkspaceToApp(skipRemoteSync: true)` 在验证阶段有什么用？
4. 源码和部署产物为什么分开存？

### 动手练习

- 写一个有语法错误的 mini app，用 bundler 捕获错误。
- 用 Puppeteer 打开本地页面，监听 console error。
- 把源码目录和 dist 目录分别上传到两个不同前缀。

### 自检

- [ ] 能讲出 `completed -> validating -> completed -> deploying -> deployed`。
- [ ] 能解释验证失败但继续部署的取舍。
- [ ] 能说明 `workspaces/{appId}` 和 `deployments/{appId}` 的区别。

## 阶段 F：观测、配置与可靠性

### 要读的文件

- `src/core/rainbow/index.ts`
- `src/config/model.ts`
- `src/services/monitor/task-monitor.service.ts`
- `src/core/langfuse/*`
- `src/core/galileo-report/*`
- `src/services/orchestration/orchestrator-listeners.ts`

### 你要搞懂的问题

1. 哪些行为由 Rainbow 配置控制？
2. taskMonitor 为什么要刷新 DB 心跳和文件心跳？
3. Langfuse tag / score / trace 分别解决什么问题？
4. 多实例下取消和孤儿任务修复有什么边界？

### 动手练习

- 写一个内存配置缓存，支持默认值和热更新。
- 给一个异步任务加 trace，每个阶段记录 duration。
- 模拟两个 worker，一个刷新心跳，一个 healer 修复超时任务。

### 自检

- [ ] 能区分 fail-fast 和 fallback。
- [ ] 能说明为什么 running 任务不能只靠内存 Map 监控。
- [ ] 能讲出一次失败任务应该从哪些地方查：conversation 状态、execution phase、tool calls、trace、日志。

## 最终自测

合上文档，尝试回答下面 8 个问题：

1. 用户请求 `/api/agent/start` 后，10 秒内系统可能处于哪些阶段？
2. 模板 strict 命中和 fuzzy remix 的本质差异是什么？
3. Claude 想写 `/tmp/a.sh` 或读 `~/.ssh/id_rsa`，项目如何处理？
4. 验证发现 JS runtime error 后，系统如何让 Claude 修？
5. 为什么源码要同步到 COS，而不仅仅部署 dist？
6. 如果任务卡在 running，系统如何判断它是不是孤儿任务？
7. 如果 Rainbow 模板阈值配置错了，最坏会发生什么？
8. 你会如何把取消能力升级成真正多实例可靠？

## 复盘表达模板

面试时可以按这个顺序讲：

1. **先讲业务目标**：自然语言生成前端应用，不只是聊天。
2. **再讲核心对象**：Session / Conversation / App / Workspace。
3. **讲主链路**：start/chat 入口、模板、guard、Agent、验证、部署。
4. **讲安全**：prompt guard + tool guard + sandbox。
5. **讲取舍**：模板快但有误命中，Agent 慢但灵活；验证提升质量但不能无限阻断。
6. **讲可靠性**：取消、心跳、孤儿修复、trace。

