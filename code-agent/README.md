# Code Agent 项目沉淀

> 来源项目：`/data/workspace/light-app/code-agent`
> Git 仓库：`https://git.woa.com/QQChannel/AIApp/LightApp/code-agent.git`
> 角色视角：后端 / 全栈 / AI Agent 平台
> 目标：把 Code Agent 的业务架构、关键工作流、面试表达、知识地图和学习路线沉淀成可复用材料。

## 文件结构

```text
code-agent/
├── README.md                  # 本文件
├── interview-prep.zh.md       # 候选人视角：项目介绍、亮点、15 个 QA
├── interviewer-pack.zh.md     # 面试官视角：15 个问题、追问、评分要点
├── knowledge-map.zh.md        # 知识图谱：必须掌握 / 加分项
├── study-guide.zh.md          # 学习指引：按阶段补齐知识
└── data/
    ├── project-context.json   # 项目骨架、模块、核心实体、主工作流
    └── tech-points.json       # 15 个技术点与维度覆盖
```

## 项目一句话

Code Agent 是一个基于 Claude Code 的云端代码生成后台：用户给一句自然语言需求，系统创建隔离工作区，让 Agent 写或修改前端应用，再自动完成安全门禁、模板命中、验证修复、打包部署、截图和状态追踪。

## 核心业务对象

| 对象 | 存在哪里 | 作用 |
|---|---|---|
| Session | `sessions` 表 + 本地 workspace | 一次用户工作空间，绑定工作区目录和 Claude agent session |
| Conversation | `conversations` 表 | 一次生成或修改任务，承载 running / deployed / failed 等状态 |
| Message | `messages` 表 | 用户消息、AI 输出、工具调用和工具结果 |
| App | `apps` 表 | 最终应用元信息：标题、描述、预览图、封面、父应用 |
| Template | `templates` 表 + COS templates 前缀 | 高频需求的模板骨架和工作区，用于快速复用 |

## 模块速览

| 模块 | 关键文件 | 说明 |
|---|---|---|
| 启动与 HTTP 服务 | `src/index.ts`, `src/server.ts` | 初始化 Rainbow、数据库、trag、监控、清理任务和 Express |
| Agent 路由 | `src/api/routes/agent.routes.ts` | `/start`、`/chat`、`/check`、`/cancel` 的主入口 |
| 服务门面 | `src/services/chat.service.ts` | 组装配置、会话、消息、插件、Agent、验证、部署 |
| 主编排器 | `src/services/orchestration/orchestrator.service.ts` | 从安全检查到部署的完整生成流水线 |
| Claude 执行器 | `src/services/code/code.service.ts` | 创建 Claude Code 模型，限制工具权限，录制流式输出 |
| 模板系统 | `src/services/cache/template-matcher.service.ts`, `src/services/template/*` | 严格匹配、模糊召回、模板替换、模板管理 |
| 二创 Remix | `src/services/orchestration/remix.service.ts` | 从 COS 恢复旧应用源码，在已有代码上修改 |
| 验证与修复 | `src/services/validation/*`, `src/services/orchestration/validation-loop.ts` | 静态、打包、运行时检查和自动修复 |
| 部署与截图 | `src/services/app.service.ts`, `src/services/orchestration/deployment.service.ts` | 打包、COS 同步、CDN 资源外置、截图 |
| 观测与监控 | `src/core/langfuse/*`, `src/core/galileo-report/*`, `src/services/monitor/*` | trace、score、阶段耗时、活跃任务和孤儿任务修复 |

## 最重要的工作流

### 1. 新建应用：`POST /api/agent/start`

1. 路由层解析请求、用户、配置。
2. 创建或复用 session，准备本地 workspace。
3. 创建 conversation 和 app 记录。
4. 非 remix 请求先做模板严格匹配。
5. 未严格命中时立即返回 `sessionId / conversationId / appId`。
6. 后台继续执行 guard、模糊模板判断、Agent 生成。
7. Claude Code 在 workspace 内写代码。
8. 验证-修复循环检查产物。
9. 打包、上传 COS、截图，任务状态进入 `deployed`。

### 2. 流式应用生成：`POST /api/agent/chat`

主流程和 `/start` 相同，但响应方式不同：它把 Claude 输出转换为 AI SDK UI message 流，通过 SSE 推给前端。适合需要实时展示 AI 正在做什么的页面。

### 3. 模板命中

1. `prompt-decode` 把用户 prompt 变成骨架。
2. 对骨架算 SHA-256，查 `templates` 表。
3. 命中后下载模板 workspace。
4. 替换 `{{TMPL:...}}` 占位符和随机主题。
5. 跳过 Claude 从零写代码，直接验证和部署。

### 4. 二创 Remix

1. 请求带 `appid`，或模糊模板判断为 `need_modify`。
2. 系统从 COS 的 `workspaces/{appId}` 恢复源码。
3. 构造“基于当前应用修改”的 prompt。
4. Claude 在已有代码上继续改。
5. 生成新的 app 记录和部署产物。

## 项目亮点

1. **异步快返 + 后台长任务**：`/start` 把同步阶段压到最小，后台跑长任务，前端轮询状态。
2. **模板复用体系**：严格 hash、trag 模糊召回、LLM 二次判断，兼顾速度和准确性。
3. **工具调用安全边界**：不只靠 prompt，Bash 和文件工具都有程序级拦截。
4. **验证-修复-部署闭环**：生成后自动检查，发现问题后让 Agent 修复，减少坏产物。
5. **源码和部署产物分离**：源码支持二创、迁移、模板化；部署产物支持线上访问。
6. **全链路可观测**：任务状态、阶段耗时、工具调用、Langfuse trace、Galileo summary 都能追。

## 使用建议

1. 先读 `interview-prep.zh.md` 的项目介绍，建立完整心智模型。
2. 再按 `knowledge-map.zh.md` 扫知识点，优先补安全、长任务编排、模板系统和部署链路。
3. 如果要准备面试，按 `interviewer-pack.zh.md` 里的问题自测：每题先说 1 分钟，再展开到 3 分钟。
4. 如果要接手代码，按 `study-guide.zh.md` 的学习顺序，从 API 路由一路读到 Orchestrator。
