# Code Agent — 知识图谱

> 这份图谱把 Code Agent 项目背后的知识点拆成“必须掌握”和“加分项”。每个知识点都标注它会在哪些面试题里出现，方便你反向复习。

## 必须掌握

### 1. Express 长任务接口设计

> 出现于：Q1, Q12, Q13

你需要能解释流式接口和异步接口的区别：SSE 适合实时展示，异步快返适合长任务和批量触发。重点不是会写 Express，而是知道响应发出后错误只能通过数据库状态或事件系统传递。

**必读**
- Express middleware / error handler 基础
- Server-Sent Events 协议
- HTTP 请求生命周期与 response headers sent

**练习**
- 写一个 `/start` 立即返回 taskId、后台 `setTimeout` 更新状态、`/check` 轮询的小 demo。
- 再写一个 `/stream` 用 SSE 每秒推送一条进度。

### 2. 任务状态机建模

> 出现于：Q2, Q8, Q9, Q12

Code Agent 的状态不是简单成功/失败，而是 running、completed、validating、deploying、deployed、failed、cancelled。状态机能防止并发覆盖，例如 cancelled 后部署失败不能再把状态改成 failed。

**必读**
- 有限状态机基础
- 数据库 CAS 更新思想
- 后台任务状态设计

**练习**
- 设计一张 task 表，写出 `updateIfStatus(id, from, patch)`。
- 模拟并发取消和部署失败，验证 cancelled 不被覆盖。

### 3. Session / Conversation / App 分层

> 出现于：Q2, Q9, Q10

Session 管工作区，Conversation 管任务，App 管产物。这个分层是理解项目的入口。

**必读**
- 一对多关系建模
- 级联删除
- 审计记录与业务实体分离

**练习**
- 画出 `sessions -> conversations -> messages/deployments/apps` 的关系图。
- 说明删除 session、删除 app、任务失败三种场景分别影响哪些数据。

### 4. Workspace 隔离

> 出现于：Q2, Q6, Q10, Q13

AI 写代码必须在隔离目录中进行。workspace 是代码执行的边界，也是二创恢复、打包验证、部署发布的源头。

**必读**
- Node.js path.resolve / path.relative 安全用法
- 路径遍历攻击
- 临时目录生命周期管理

**练习**
- 实现一个 `safeResolve(workspace, userPath)`，拒绝 `..` 和绝对路径越界。

### 5. Claude Code 工具调用模型

> 出现于：Q6, Q7, Q11

Claude Code 不只是返回文本，它能读写文件、运行命令、搜索文件。工具能力越强，边界越重要。

**必读**
- AI Agent tool calling 基础
- Claude Code / coding agent 的工作目录概念
- 工具 allow / deny 策略

**练习**
- 写一个简化版 tool runner：只允许 read/write 当前目录，拒绝 `/etc/passwd`。

### 6. Bash 命令安全

> 出现于：Q6

Bash 是最危险的工具之一。除了拒绝明显危险命令，还要考虑重定向、管道、环境变量、路径越界和间接执行脚本。

**必读**
- shell command injection 基础
- child_process 安全实践
- 最小权限原则

**练习**
- 给一个命令字符串做 allow/deny 判断，覆盖 `rm -rf`、`curl | sh`、写系统目录等 case。

### 7. Prompt Guard

> 出现于：Q5

Prompt Guard 是意图层安全，不等于工具层安全。它判断请求是否属于业务范围、是否有越狱倾向，并可生成标题描述。

**必读**
- LLM structured output
- Prompt injection / jailbreak 基础
- fail-open 与 fail-closed 取舍

**练习**
- 用 Zod 定义 `{ allowed, reason, title, description }` schema，让 LLM 输出结构化判断。

### 8. 模板骨架与占位符

> 出现于：Q3, Q15

模板系统的本质是把“变量”从 prompt 里拿出来，只比较“结构”。命中后再把变量填回模板代码。

**必读**
- hash 索引
- 模板渲染
- 占位符 schema 设计

**练习**
- 把“生成一个用 A/B/C 三张图片的翻牌游戏”解码成骨架和图片资源列表。

### 9. 向量召回的局限

> 出现于：Q4, Q15

向量检索只能给相似候选，不能直接代表业务可复用。模板系统中必须处理误召回。

**必读**
- embedding 与向量相似度基础
- topK / threshold 调参
- 召回率和准确率取舍

**练习**
- 准备 10 条相似 prompt，手工标注哪些真的能复用同一模板，观察相似度排序不等于业务判断。

### 10. LLM 二次判定

> 出现于：Q4, Q15

LLM judge 用来判断候选模板是否适合复用。它不是强依赖，失败时必须降级到 Agent，不能错误命中。

**必读**
- LLM as judge 的风险
- schema validation
- timeout / fallback 设计

**练习**
- 写一个 judge prompt，让模型在 `miss` 和 `need_modify` 间二选一，并处理非法输出。

### 11. Remix 二创

> 出现于：Q4, Q10

Remix 是“基于已有源码继续改”，不是重新生成。关键是源码恢复、prompt 重写和不覆盖当前工作区。

**必读**
- 源码快照与产物快照区别
- 派生应用数据模型
- 幂等恢复策略

**练习**
- 设计一个 `restoreIfNeeded(appId, workspace)` 函数，区分首次、空目录和已有代码。

### 12. 验证-修复循环

> 出现于：Q8, Q13

AI 生成代码后，系统要像 CI 一样检查，再把错误反馈给 AI 修。重点是有限轮次和失败兜底。

**必读**
- 静态分析、打包检查、运行时检查区别
- 自动修复 prompt 设计
- 验证失败是否阻断的产品取舍

**练习**
- 写一个 demo：检测 JS 语法错误，生成修复提示，再让模型修一轮。

### 13. 打包部署流水线

> 出现于：Q9

工作区源码要经过打包、资源处理、上传、截图，才变成可访问应用。

**必读**
- Vite 打包基础
- 对象存储静态托管
- CDN base href / 资源外置

**练习**
- 把一个简单 Vite 项目打包到目录，并用 Express 静态服务访问。

### 14. COS 源码与产物分离

> 出现于：Q9, Q10

`workspaces/{appId}` 保存源码，`deployments/{appId}` 保存可访问产物。这个分离支撑二创、模板、重建部署和跨环境迁移。

**必读**
- 对象存储 key 设计
- 源码包和发布包的生命周期
- 幂等上传和覆盖策略

**练习**
- 设计一套对象存储前缀，支持 app 源码、部署产物、模板和截图。

### 15. AbortController

> 出现于：Q12

取消长任务的关键是把同一个 AbortSignal 传到 LLM 流、工具执行和修复循环。

**必读**
- MDN AbortController
- fetch abort 行为
- Node.js 长任务取消模式

**练习**
- 写一个 SSE 流，另一个接口按 taskId 调 abort。

### 16. 多实例心跳

> 出现于：Q13

内存状态只能代表本实例。多实例系统要靠共享存储或数据库心跳判断任务是否还活着。

**必读**
- 分布式任务心跳
- 孤儿任务修复
- lease / ttl 思想

**练习**
- 用数据库 `updated_at` 模拟任务心跳，写一个 healer 修复超时任务。

### 17. 事件总线

> 出现于：Q7, Q11

事件总线适合把主流程和横切能力解耦，例如日志、trace、状态推进和阶段统计。

**必读**
- 发布订阅模式
- 横切关注点
- 事件驱动调试成本

**练习**
- 写一个本地 EventEmitter，在任务 started/completed 时分别记录日志和阶段耗时。

### 18. Langfuse / OTel 可观测性

> 出现于：Q7, Q14

AI 系统需要能追踪每次生成经过哪些阶段、用了什么模型、调用了哪些工具、失败在哪里。

**必读**
- OpenTelemetry trace/span/metric
- Langfuse trace/tag/score
- LLM observability 基础

**练习**
- 给一个三阶段任务加 trace，每阶段一个 span，失败时打 error tag。

### 19. Rainbow 远程配置

> 出现于：Q14

AI 参数和流程开关需要远程可调，但关键配置缺失时要 fail-fast。

**必读**
- feature flag
- 配置热更新
- fail-fast 与 fallback

**练习**
- 写一个内存配置缓存，支持启动加载和定时刷新。

### 20. 插件 skills 机制

> 出现于：Q11

插件不是直接把任意代码交给模型，而是通过受控目录和 allowlist 暴露能力。

**必读**
- 插件系统设计
- allowlist
- 只读资源挂载

**练习**
- 模拟一个插件目录，把 `skills/*/SKILL.md` 挂到工作区，并禁止写入。

## 加分项

### A1. 模板默认数据兜底

> 出现于：Q3, Q15

当用户资源数量不足时，模板可以用 `__defaults__/data.json` 补齐，避免页面残留占位符。

### A2. CDN 资源外置

> 出现于：Q9

某些运行时加载资源无法完全内联，需要上传 CDN 并注入 base href。

### A3. 多模型配置与 thinking 参数

> 出现于：Q14

模型别名、真实模型名、thinking mode、timeout、maxTurns 都由配置解析。

### A4. LLM 判断的评估与阈值校准

> 出现于：Q4, Q15

模糊匹配阈值必须基于真实样本校准，不能拍脑袋设置。

### A5. 跨环境 workspace 导入

> 出现于：Q9, Q10

模板或 app 跨环境迁移时，DB 元数据可能不完整，需要以 COS workspace 为事实来源兜底。

