# Code Agent — 面试备战材料

> Mode: candidate · Role: 后端 / 全栈 / AI Agent 平台 · Level: 中高级

## 维度覆盖统计

| 维度 | 数量 | 重点 |
|---|---:|---|
| architecture | 4 | 双入口、核心数据模型、Rainbow 配置、编排分层 |
| performance | 2 | 模板快速路径、模糊召回 |
| security | 2 | Prompt Guard、工具权限边界 |
| reliability | 2 | 验证修复、取消与心跳 |
| feature | 3 | Remix、插件 skills、源码/部署产物分离 |
| observability | 1 | 事件总线与 trace |
| trade-off | 2 | 模板 vs Agent、验证是否阻断 |

## 项目自我介绍

### 一句话

Code Agent 是一个云端 AI 代码生成后台：用户给一句需求，系统让 Claude Code 在隔离工作区里生成前端应用，并自动完成模板复用、二创、验证、部署和截图。

### 标准版

Code Agent 面向的是“用自然语言快速生成轻量前端应用”的场景。它的核心不是一个普通聊天接口，而是一条完整的代码生产流水线：Express 提供 `/api/agent/start` 和 `/api/agent/chat` 两种入口，前者立即返回任务 ID 后后台执行，后者通过 SSE 实时返回生成过程。进入任务后，系统会创建 session 和独立 workspace，生成 conversation 和 app 记录；非二创请求先走模板匹配，严格命中时直接下载模板工作区替换占位符，跳过从零生成。未命中时会经过 Prompt Guard，再让 Claude Code 在工作区里读写文件、运行命令。生成完成后还有静态检查、打包检查、浏览器运行时检查和有限轮次自动修复，最后打包部署到 COS、截图并更新 app 元信息。整个过程中 Langfuse、Galileo、execution_phases、taskMonitor 会记录 trace、阶段耗时、工具调用和活跃任务。

### 深挖版

<details><summary>展开</summary>

这个项目的设计核心是把“AI 写代码”从一次模型调用，拆成一个可恢复、可观测、可部署的后台任务。数据模型上，Session 表示用户工作空间，Conversation 表示一次生成任务，Message 保存用户消息、AI 输出和工具调用，App 保存最终产物元信息，Template 保存高频需求的模板骨架和工作区。入口层在 `agent.routes.ts`，`prepareConversation` 会统一做配置解析、session/workspace 准备、conversation 创建和 app 绑定。`/api/agent/start` 是生产上更适合批量调用的模式：只在响应前做严格模板匹配，未命中就立即返回 `conversationId`，后面的 guard、fuzzy、Claude 生成、验证和部署在后台执行；`/api/agent/chat` 则把 Claude 输出转成 AI SDK UI message 流，通过 SSE 推给前端。

主流程由 `ChatService` 和 `OrchestratorService` 分层承接。`ChatService` 是门面，负责组装 ConfigService、SessionService、RemixService、MessageService、CodeService、ValidationService、DeploymentService 等子服务；`OrchestratorService` 负责顺序协调：前置安全检查、消息和附件处理、插件下载、skills 软链、模型初始化、Claude Code 执行、验证修复和部署。真正执行 Claude 的是 `CodeService`，它用 `ai-sdk-provider-claude-code` 创建模型实例，并在 `canUseTool` 里做硬限制：Bash 命令必须过 `bash-guard`，Read/Write/Edit/Grep/Glob 必须在工作区或可信只读目录内，插件 skills 目录禁止写入。这一点很关键，因为 Agent 能调用工具后，安全不能只靠提示词。

模板系统是性能和成本优化的重点。它先用 `prompt-decode` 把 prompt 中的结构化资源抽出来，得到稳定的 `skeletonPrompt`，严格路径按 SHA-256 查库；严格命中时，`processTemplateHit` 下载模板工作区、替换 `{{TMPL:TYPE:N}}` 占位符和随机主题、渲染 title/description，再进入部署。严格没中时，系统在 guard 通过后用 trag 做向量召回，再让 LLM 判断是 miss 还是 `need_modify`；`need_modify` 不直接套模板，而是转成 remix，在模板源码基础上让 Agent 按用户原始需求修改，避免主题或素材误套。二创场景也走类似逻辑：根据 appid 从 COS 的 `workspaces/{appId}` 恢复源码，构造修改型 prompt，生成一个派生 app。

可靠性上，生成完成并不马上上线，而是先走验证-修复循环。`ValidationService` 做静态分析、打包检查和 Puppeteer 运行时检查；如果失败，`validation-loop` 会构造修复 prompt，让 Claude 再跑一轮，直到通过或达到配置的最大轮数。部署由 `DeploymentService` 推进状态，从 `completed` 到 `deploying` 再到 `deployed`；`AppService` 负责打包、CDN 资源外置、源码同步到 `workspaces/{appId}`、部署产物同步到 `deployments/{appId}`。观测层通过事件总线把主流程和横切能力解耦，监听器负责 conversation 状态推进、execution phases、Langfuse trace、Galileo summary 和工具调用记录。任务监控每 30 秒刷新数据库和 workspace 心跳，多实例下只修复超过阈值未更新的 running 任务，避免误杀其他实例的任务。

</details>

## 项目亮点

- **双入口生成模式**（architecture）
  `/api/agent/chat` 提供 SSE 实时流，`/api/agent/start` 提供立即返回的异步任务。两者共享 `prepareConversation` 和 Orchestrator 主流程，但响应模型不同，分别适配“实时看过程”和“触发后轮询”两类产品需求。

- **模板快速路径**（performance）
  对高频结构化需求，系统不每次都让 Claude 从零写，而是把 prompt 解码成骨架后严格匹配模板，命中后替换占位符并部署。这样把成本高、耗时长的生成动作变成稳定的模板渲染。

- **模糊模板转 Remix**（trade-off）
  模糊召回的候选不会直接命中，而是经过 LLM 判断。若判断为 `need_modify`，系统把模板当作代码基础，转成 remix 让 Agent 修改，避免把相似但主题不同的需求生硬套模板。

- **工具调用安全边界**（security）
  Claude 能用 Bash、Read、Write、Edit 等工具，但每次工具调用都会经过程序校验。Bash 有命令级规则，路径类工具不能越出 workspace，插件 skills 目录只读。这个设计把“工具调用越权”风险压在执行层。

- **验证-修复-部署闭环**（reliability）
  生成后自动做静态、打包、运行时检查，失败时让 Agent 带着错误报告修复。它不是一次性问答，而是一个能自检和自修复的生成系统。

- **源码和部署产物分离**（feature）
  源码同步到 `workspaces/{appId}`，部署文件同步到 `deployments/{appId}`。这让线上访问、二创恢复、模板复制、跨环境导入各有清晰的数据来源。

## 15 个面试 QA

### Q1. `POST /api/agent/start` 和 `POST /api/agent/chat` 为什么要同时存在？

**一句话**：它们服务不同交互形态：`chat` 适合实时展示生成过程，`start` 适合后台长任务和轮询。

**标准回答**：  
`/api/agent/chat` 是流式接口，服务端把 Claude 输出转成 AI SDK UI message 流，通过 SSE 推给前端，用户能看到文本、工具调用和推理过程。`/api/agent/start` 是异步接口，它只在响应前完成配置解析、session/workspace 准备、conversation/app 创建和严格模板匹配，未命中模板就立即返回 `conversationId`，后续 guard、模糊匹配、Agent 生成、验证、部署都在后台跑。这样前端可以用 `/api/agent/check` 轮询结果。两者共享 `prepareConversation` 和 Orchestrator，避免业务分叉。

**深挖**：  
双入口的难点是不能维护两套生成逻辑。项目把公共准备抽到 `prepareConversation`，把长流程收敛到 `ChatService` / `OrchestratorService`，路由层只处理响应时机差异。`chat` 需要先拿到 ReadableStream 再把流交给 SSE adapter；`start` 则要注意响应已经发出后，异步阶段的错误不能再写 HTTP response，只能落库到 conversation 状态并由 `/check` 暴露。模板严格命中是特例：`start` 会在返回前做 strict hash，因为它几乎 0 成本，命中后响应里带 `templateHit`，但模板执行和部署仍在后台完成。

### Q2. 这个项目的数据模型为什么分 Session、Conversation、App？

**一句话**：Session 管工作空间，Conversation 管一次任务，App 管最终产物，三者职责不同。

**标准回答**：  
Session 是用户的一次工作空间，决定本地 workspace 目录和 Claude Code 的 agentSessionId；Conversation 是一次生成或修改任务，有 running、completed、validating、deploying、deployed、failed、cancelled 等状态；App 是最终应用元信息，包括标题、描述、封面、预览图、父应用和来源。这样同一个 session 可以有多轮 conversation，app 可以被部署、二创、导入和模板化，不会把任务状态和产物信息混在一起。

**深挖**：  
如果只用一个“任务表”，会很快遇到边界混乱：工作区生命周期、AI 执行状态、部署结果、二创来源、应用元信息都会挤在一起。现在的结构让每层可以独立演进。Session 删除可以清理工作区；Conversation 失败不会删掉历史消息；App 可以按 appId 做公开访问和跨环境 workspace 导入；Message 和 ToolCall 可以作为审计与调试材料。数据库关系也支持级联删除：session 删除后 conversations、messages、deployments、apps 可以跟着清理。

### Q3. 模板严格匹配是怎么实现的？

**一句话**：把 prompt 解码成稳定骨架，对骨架算 SHA-256，命中后直接执行模板。

**标准回答**：  
模板匹配不直接拿原 prompt 比较，因为用户 prompt 里可能有图片 URL、头像 JSON、标题列表等变量。系统先用 `promptDecodeService.decode` 抽取结构化数据，生成 `skeletonPrompt` 和 `extractedItems`。然后对骨架算 SHA-256，到 `templates` 表按 `skeleton_hash` 查候选；为避免 hash 冲突，还会严格比对 `skeleton_prompt` 原文。命中后递增 hitCount，走 `processTemplateHit` 下载模板工作区、替换占位符、验证、部署。

**深挖**：  
严格匹配的价值是极快和确定。它不依赖向量库，也不依赖 LLM，因此可以放在 `/start` 响应前执行。代价是召回范围窄，只有骨架完全一致才命中。模板里的占位符如 `{{TMPL:IMAGE:1.url}}` 对应 prompt 解码出来的资源，执行时按 schema 和默认数据兜底替换。随机占位符用同一个 themeIndex 保证整套主题一致。

### Q4. 为什么模糊匹配后还要 LLM 二次判断？

**一句话**：向量相似不代表可以套模板，LLM 二次判断是为了减少误命中。

**标准回答**：  
trag 模糊召回只能说明“这个需求和某些模板语义接近”，但模板可能主题、素材、玩法细节不同。如果直接把高分候选当命中，很容易把用户想要的 IP 或场景换成模板原有内容。所以系统只把 score 超过低阈值的候选交给 LLM，判断结果只有 `miss` 和 `need_modify`。`miss` 走普通 Agent，`need_modify` 转 remix，让 Agent 基于模板代码修改，而不是直接替换部署。

**深挖**：  
这里的取舍很细：严格命中可以直接模板执行，因为骨架一致；模糊命中不直接执行，因为相似度无法保证需求细节一致。LLM judge 如果超时、报错、返回候选外 templateId，都会降级 miss，宁愿多花一次 Agent 生成成本，也不把错误模板上线。这是质量优先的失败策略。

### Q5. Prompt Guard 在系统里承担什么职责？

**一句话**：它在 Agent 运行前判断请求是否安全、是否属于目标业务，同时生成应用标题描述。

**标准回答**：  
`PreProcessService` 会用一次结构化 LLM 调用检查 prompt。它拦截越狱、提示注入、非前端游戏/互动应用类请求。多轮或二创时，它还会带上历史摘要和当前 app 的标题描述，帮助判断用户是在继续编辑还是跑题。通过时返回 title/description，后续写入 app 元信息；失败时抛 `PromptGuardError`，路由根据配置决定阻断或观察模式放行。

**深挖**：  
Guard 的位置很重要。严格模板命中因为是已知模板，可以直接走快速路径；严格未命中后先跑 guard，再跑 fuzzy，避免明显违规请求消耗向量检索和 LLM 判定资源。`PRE_PROCESS_GUARD_ENABLED` 可以远程配置：开启时真正阻断，关闭时变成观察模式，只打 tag 和日志，方便灰度验证误杀率。

### Q6. Claude Code 的工具调用如何防越权？

**一句话**：在工具执行入口做硬校验：Bash 看命令，文件工具看路径，插件目录限制只读。

**标准回答**：  
`CodeService.createClaudeCodeModel` 配置了 Claude Code 的工具列表和 `canUseTool` 钩子。Bash 会进入 `validateBashCommand`，危险命令或越界命令会被拒绝。Read/Write/Edit/Grep/Glob 会解析目标路径，默认必须在当前 workspace 内。`.claude/skills` 是插件软链目录，允许读，不允许写或 edit。工作区外的可信插件目录也只允许只读操作。这样即使模型想访问系统路径或改插件，也会被程序拦下。

**深挖**：  
这个设计比“在 prompt 里告诉模型不要乱动”可靠。Agent 一旦有工具，就必须假设模型可能犯错或被诱导。项目还配置了 Claude Code sandbox，禁止写 `/etc`、`/usr`、home 等目录，并禁止读 `.ssh`、`.aws`、`.gnupg` 等敏感目录。工具层校验和 sandbox 是两层防护：前者给出业务语义，后者兜底系统边界。

### Q7. OrchestratorService 为什么要用事件总线？

**一句话**：主流程只管编排，状态推进、埋点、阶段记录、工具追踪交给监听器。

**标准回答**：  
Orchestrator 会在 started、model_resolved、validation_started、deployment_started、completed、failed 等节点 emit 事件。监听器独立处理 Langfuse trace、Galileo summary、execution_phases、conversation 状态推进和工具调用记录。这样主流程不会堆满横切逻辑，也方便新增观测能力，不需要改核心流程。

**深挖**：  
事件总线的收益是解耦，但代价是排查时要知道“谁监听了什么”。这个项目里 ChatService 构造函数集中注册 ToolTrackingListener、LangfuseOrchestratorListener、AgentStartTelemetryListener、PhaseRecordingListener、ConversationStateListener，因此依赖关系还算集中。面试可以强调：事件总线只用于流程内横切事件，不承担业务决策，避免异步事件反过来影响主流程。

### Q8. 验证-修复循环怎么工作？

**一句话**：生成后先验证，发现错误就把错误报告变成修复 prompt，让 Agent 再改，最多跑配置的轮数。

**标准回答**：  
`ValidationService` 会先做静态检查，再调用 `publishWorkspaceToApp(skipRemoteSync: true)` 做本地打包，然后用 Puppeteer 加载页面捕获运行时错误。如果没有错误，conversation 从 validating 回到 completed 并进入部署。如果有错误且没超过最大修复轮次，系统构造 `fixPrompt`，再调用 `code.executeStreamChat` 让 Claude 修复，然后重新验证。

**深挖**：  
状态流转靠 CAS 控制：`COMPLETED -> VALIDATING -> RUNNING -> COMPLETED`，避免取消或失败时被并发覆盖。验证异常不会让流程永久卡住，会尽量把状态恢复到 completed 后继续部署。这个设计体现了取舍：验证提升质量，但不能让系统因为校验链路自身不稳定而完全不可用。

### Q9. 部署流程如何把代码变成可访问应用？

**一句话**：AppService 打包 workspace，同步源码和部署产物到 COS，再由 DeploymentService 推进状态并截图。

**标准回答**：  
部署时 `DeploymentService` 先把 conversation 从 completed 切到 deploying，然后调用 `appService.publishWorkspaceToApp`。AppService 会定位 session 的 workspace，安全扫描跳转逻辑，Vite 打包到本地部署目录，必要时把运行时资源外置到 CDN，生成公开 URL。源码异步同步到 `workspaces/{appId}`，部署产物同步到 `deployments/{appId}`。产物可访问后，截图服务打开 URL 截图并写回 app cover，最后状态进入 deployed。

**深挖**：  
源码和部署产物分离是关键。部署产物要稳定可访问，源码要支持二创、模板化、跨环境导入和重建部署。打包失败不是直接抛掉，bundleErrors 会返回给验证修复链路；如果没有可部署入口，状态会回退到 completed，而不是伪装 deployed。

### Q10. Remix 二创和普通生成有什么不同？

**一句话**：普通生成从空 workspace 开始，Remix 先恢复旧 app 源码，再让 Agent 修改。

**标准回答**：  
请求带 `appid` 时，`RemixService` 会检查源 app 是否存在；如果 DB 没有，也会尝试从 COS 判断 workspace 是否存在。首次二创会从 `workspaces/{appid}` 恢复代码到当前 session 的 workspace，并验证是否有有效代码文件。然后它用 `buildRemixPrompt` 包装用户需求，告诉 Agent 基于当前工作区修改，而不是从零生成。

**深挖**：  
Remix 的难点是恢复策略。恢复过早会覆盖用户当前改动，恢复过晚会导致 workspace 为空。项目用 `checkNeedRestore` 区分首次调用、工作区为空、工作区不可访问等情况。DB 缺元数据但 COS 有 workspace 时允许继续，这是为了兼容跨环境同步或历史数据缺失。

### Q11. 插件和 skills 是如何接入 Claude Code 的？

**一句话**：后端下载插件，把插件里的 skills 软链到 workspace，Claude Code 通过 Skill 工具发现。

**标准回答**：  
请求可以传 pluginIds 或 pluginUrls。Orchestrator 在资源准备阶段调用 `plugin.downloadAndExtractPlugins` 下载并解压插件，然后 `linkSkillsToWorkspace` 把插件 skills 软链到当前 workspace 的 `.claude/skills`。CodeService 在创建模型时扫描 workspace skills 和 plugin skills，形成 allowlist；如果有 skills，就把 `Skill` 加入内置工具列表。

**深挖**：  
软链方式比把绝对路径写进 system prompt 更稳。Claude Code 的 Skill 工具按项目配置发现能力，后端只负责准备目录和 allowlist。安全上，`.claude/skills` 被视为只读区，模型不能 Write/Edit，避免修改插件缓存造成跨任务污染。

### Q12. 任务取消是怎么做的？

**一句话**：每个活跃 conversation 注册 AbortController，取消时 abort 并把状态标为 cancelled。

**标准回答**：  
Orchestrator 有一个内存 Map：`conversationId -> AbortController`。启动流式或异步任务时注册，结束后注销。`POST /api/agent/cancel` 查 conversation 状态，只有 running、deploying 或已 cancelled 可以幂等处理；然后调用 `chatService.abortConversation`，触发 controller.abort，并把数据库状态更新为 cancelled。

**深挖**：  
当前设计主要解决单实例或请求打到同实例时的取消。多实例下，taskMonitor 通过数据库心跳避免误杀其他实例任务，但跨实例精准 abort 还需要共享信号，比如 Redis Pub/Sub。面试里可以主动说明这个边界：数据库状态能表达 cancelled，但真正中断本地进程还依赖对应实例收到取消信号。

### Q13. taskMonitor 为什么既刷数据库心跳又刷 workspace 心跳？

**一句话**：数据库心跳保护任务状态，workspace 心跳保护文件目录。

**标准回答**：  
taskMonitor 每 30 秒记录活跃任务，刷新 running conversation 的 `updated_at`，让其他实例知道任务还活着；同时刷新 session workspace 下的 `.heartbeat`，防止清理服务把长时间打包或生成中的目录删掉。它还会修复超过阈值没有更新的 running 任务，把它们标成 failed。

**深挖**：  
这是多实例下的防误杀设计。修复孤儿任务时会排除本实例内存里的 activeIds，并且只处理 `updated_at` 超过 2 分钟阈值的任务。这样即使另一个实例正在跑，只要它正常刷新 DB 心跳，就不会被当前实例修复掉。文件心跳则是另一条线，因为目录清理服务不看数据库状态，只看文件 mtime。

### Q14. Rainbow 远程配置在项目里解决了什么问题？

**一句话**：它把模型、超时、限流、模板阈值、验证开关从代码里拿出来，支持热更新。

**标准回答**：  
项目启动时 `initRainbow` 和 `loadAllConfigs` 会加载 model-config、cos-config、deployment-config、rate-limit-config、pipeline-config、template-rag-config 等配置，并开启 watcher。代码里通过 `getCachedXxxConfig()` 同步读取缓存。模型选择、Claude 超时、最大工具轮次、Prompt Guard 是否阻断、验证修复轮数、trag 阈值都可以远程调整。

**深挖**：  
AI 系统的运行参数变化很快，如果每次调模型或阈值都要发版，试错成本太高。Rainbow 配置的风险是启动时缺关键配置会导致运行异常，所以项目对 trag warmup 采取 fail-fast：启用模糊匹配但缺 token、collection、阈值时直接拒绝启动。对可降级配置，则 getter 返回 null，由业务 fallback。

### Q15. 模板路径和 Agent 路径最大的取舍是什么？

**一句话**：模板快且稳定，但覆盖范围有限；Agent 慢但灵活，能处理新需求。

**标准回答**：  
模板命中后可以跳过 LLM 代码生成，质量更稳定、成本更低、耗时更短，适合高频且结构一致的需求。但模板容易误用，尤其是模糊匹配时，相似不代表用户想要同一个主题或玩法。Agent 生成更慢、更贵，也可能失败，但它能处理新需求、复杂修改和二创。所以项目把严格命中、模糊召回、LLM judge、remix 和 agent 生成组合起来，让确定性高的走模板，不确定的走 Agent。

**深挖**：  
这里可以用“确定性分层”表达：strict 是确定性最高，直接模板；fuzzy 只是候选，必须 LLM 判断；need_modify 说明可复用代码结构但不能直接替换，所以转 remix；miss 说明不适合复用，走 Agent。失败策略也偏保守：trag 或 judge 出错只会降级 miss，不会错误命中模板。

