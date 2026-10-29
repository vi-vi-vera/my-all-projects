# QQ OKR（qq-okr） — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (24 topics)


### 1. Anthropic prompt caching 的 usage 字段语义

> Related dimensions: 📈 `observability`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] Anthropic 官方文档 prompt caching 章节关于 usage 字段的说明
- [ ] Langfuse 文档关于 token 与 cost 计算、模型价格表的说明

#### 🛠️ Hands-on

- [ ] 跑一次长对话触发 cache 命中，对比修改前后 Langfuse 中 cache read / write 明细与 cost 拆分的变化
- [ ] 临时保留 llm.cost.total，观察 Langfuse 成本拆分里 input 与 output 是否为空，再删掉对比

---

### 2. AsyncLocalStorage 在请求级上下文中的作用与边界

> Related dimensions: 📈 `observability`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] Node.js 官方 AsyncLocalStorage 文档与 AsyncResource 的边界说明
- [ ] Langfuse 文档关于 user.id 与 langfuse.trace.metadata 命名空间的约定

#### 🛠️ Hands-on

- [ ] 在周报 worker 里故意去掉 projectId，跑到 Langfuse 后台按项目过滤，确认搜不到后再补回来对比
- [ ] 写一个最小 AsyncLocalStorage 示例，验证在 setTimeout 与 Promise 链里是否都能读到

---

### 3. BatchSpanProcessor 的异步导出语义

> Related dimensions: ⚡ `performance`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 配置说明（队列大小、定时、最大导出批量）
- [ ] Langfuse 关于采样与数据量控制的文档

#### 🛠️ Hands-on

- [ ] 用压测脚本连打 50 次对话，观察进程 CPU 与内存、Langfuse 收到的 span 数量与导出延迟
- [ ] 在 onEnd 里加一个计数与耗时打印，量化自己那段逻辑的实际开销

---

### 4. BatchSpanProcessor 缓冲与 forceFlush 的必要性

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 关于缓冲、flush 与 shutdown 的说明
- [ ] NestJS 生命周期钩子与优雅退出官方指南

#### 🛠️ Hands-on

- [ ] 本地发一次请求后立刻 kill 进程，对比有无 forceFlush 时 Langfuse 里最后一批 span 是否丢失
- [ ] 把 LANGFUSE_BASE_URL 故意写错，观察运行期导出失败时进程是否存活、日志长什么样

---

### 5. ESM 命名空间对象只读与 monkeypatch 限制

> Related dimensions: 📈 `observability`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] @arizeai/openinference-instrumentation-claude-agent-sdk 的 README 与 manuallyInstrument 源码
- [ ] MDN 关于 ES module namespace object 不可变的说明

#### 🛠️ Hands-on

- [ ] 写一个小脚本：分别用直接 patch 与接住返回值两种方式调用 query，对比 span 数量差异
- [ ] 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界

---

### 6. ESM 静态 import 与动态 import 的求值时机

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] Node.js ESM 模块生命周期文档（linking 与 evaluation）
- [ ] NestJS ConfigModule envFilePath 的加载时机说明

#### 🛠️ Hands-on

- [ ] 把 startServer 改成顶部静态 import，观察是否出现部分调用无 span 的现象并定位原因
- [ ] 把 dotenv 那两行删掉，确认 LANGFUSE_* 读不到时走的是跳过分支而不是报错

---

### 7. LLM 可观测的数据出网与合规边界

> Related dimensions: 🔒 `security`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] Langfuse 自托管部署与数据留存相关文档
- [ ] 公司关于内部数据出网与敏感字段的规范（以团队实际规范为准）

#### 🛠️ Hands-on

- [ ] 检查一次真实上报的 trace 内容，列出都落了哪些字段，确认没有密钥或敏感信息
- [ ] 把三个环境变量清空后重启，确认服务正常启动且没有任何数据流出

---

### 8. Langfuse trace 等级取子 span 最高值的规则

> Related dimensions: 📈 `observability`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] Langfuse 文档关于 observation level 与 status message 的映射规则
- [ ] docs/Langfuse 上报接入说明.md 第七节

#### 🛠️ Hands-on

- [ ] 在测试环境点一次取消发布，先在改前版本看整条 trace 是否标红，再在改后版本确认变成 Warning 且 statusMessage 为 business-intercept
- [ ] 构造一个工具真的执行失败的场景，确认它的 span 仍是 ERROR 且没被降级，验证不误伤

---

### 9. Langfuse trace 级属性的合并规则与 broadcast 必要性

> Related dimensions: 📈 `observability`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] Node.js 官方 AsyncLocalStorage 文档与 AsyncResource 的边界说明
- [ ] Langfuse 文档关于 user.id 与 langfuse.trace.metadata 命名空间的约定

#### 🛠️ Hands-on

- [ ] 在周报 worker 里故意去掉 projectId，跑到 Langfuse 后台按项目过滤，确认搜不到后再补回来对比
- [ ] 写一个最小 AsyncLocalStorage 示例，验证在 setTimeout 与 Promise 链里是否都能读到

---

### 10. OTel v1 与 v2 的 Span 字段差异

> Related dimensions: 📈 `observability`
> Appears in: `qa-03`

#### 📖 Must-read

- [ ] OpenTelemetry 2.0 升级说明中关于 instrumentationScope 与 parentSpanContext 的变更
- [ ] @langfuse/otel 源码里 markAppRootCandidate 的实现

#### 🛠️ Hands-on

- [ ] 构造一个只有 v1 字段的假 span，分别在有、无兼容层的情况下喂给 processor，观察崩溃与 root 误标两种现象
- [ ] 把 parentSpanContext 映射临时删掉，在 Langfuse 后台勾 Is Root Observation，复现一堆子节点的画面并截图留存

---

### 11. OpenInference / Langfuse 的 prompt 与 cost 口径

> Related dimensions: 📈 `observability`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] Anthropic 官方文档 prompt caching 章节关于 usage 字段的说明
- [ ] Langfuse 文档关于 token 与 cost 计算、模型价格表的说明

#### 🛠️ Hands-on

- [ ] 跑一次长对话触发 cache 命中，对比修改前后 Langfuse 中 cache read / write 明细与 cost 拆分的变化
- [ ] 临时保留 llm.cost.total，观察 Langfuse 成本拆分里 input 与 output 是否为空，再删掉对比

---

### 12. OpenInference 手动插桩 API 语义

> Related dimensions: 📈 `observability`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] @arizeai/openinference-instrumentation-claude-agent-sdk 的 README 与 manuallyInstrument 源码
- [ ] MDN 关于 ES module namespace object 不可变的说明

#### 🛠️ Hands-on

- [ ] 写一个小脚本：分别用直接 patch 与接住返回值两种方式调用 query，对比 span 数量差异
- [ ] 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界

---

### 13. OpenTelemetry SpanProcessor 与 TracerProvider 的关系

> Related dimensions: 📈 `observability`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] OpenTelemetry 官方概念文档 TracerProvider / SpanProcessor / Span Exporter
- [ ] @langfuse/otel README 中 LangfuseSpanProcessor 的用法与配置项

#### 🛠️ Hands-on

- [ ] 本地起一个最小 Node 服务，先建一个 TracerProvider 再挂两个 processor，打印两边收到的 span 是否同 trace_id
- [ ] 把 shouldExportSpan 改成全放行，观察 Langfuse 里混入的 HTTP span，再改回按 scope 前缀过滤

---

### 14. Proxy 做只读字段映射的手法

> Related dimensions: 📈 `observability`
> Appears in: `qa-03`

#### 📖 Must-read

- [ ] OpenTelemetry 2.0 升级说明中关于 instrumentationScope 与 parentSpanContext 的变更
- [ ] @langfuse/otel 源码里 markAppRootCandidate 的实现

#### 🛠️ Hands-on

- [ ] 构造一个只有 v1 字段的假 span，分别在有、无兼容层的情况下喂给 processor，观察崩溃与 root 误标两种现象
- [ ] 把 parentSpanContext 映射临时删掉，在 Langfuse 后台勾 Is Root Observation，复现一堆子节点的画面并截图留存

---

### 15. instrumentation scope 作为过滤判据

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] @langfuse/otel 文档关于 shouldExportSpan 与 environment 的说明
- [ ] OpenInference 语义约定中关于 span kind（AGENT / LLM / TOOL）的定义

#### 🛠️ Hands-on

- [ ] 把 shouldExportSpan 临时改成全部放行，跑一次请求后在 Langfuse 里数一数混入了多少 HTTP span
- [ ] 把 environment 写死成 development 再跑测试环境请求，确认后台环境过滤失效的样子

---

### 16. monkey patch 与模块引用绑定的冲突

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] Node.js ESM 模块生命周期文档（linking 与 evaluation）
- [ ] NestJS ConfigModule envFilePath 的加载时机说明

#### 🛠️ Hands-on

- [ ] 把 startServer 改成顶部静态 import，观察是否出现部分调用无 span 的现象并定位原因
- [ ] 把 dotenv 那两行删掉，确认 LANGFUSE_* 读不到时走的是跳过分支而不是报错

---

### 17. observation 级属性与 trace 级属性的区别

> Related dimensions: 📈 `observability`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] Langfuse 文档关于 observation level 与 status message 的映射规则
- [ ] docs/Langfuse 上报接入说明.md 第七节

#### 🛠️ Hands-on

- [ ] 在测试环境点一次取消发布，先在改前版本看整条 trace 是否标红，再在改后版本确认变成 Warning 且 statusMessage 为 business-intercept
- [ ] 构造一个工具真的执行失败的场景，确认它的 span 仍是 ERROR 且没被降级，验证不误伤

---

### 18. shouldExportSpan 的职责过滤

> Related dimensions: 📈 `observability`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] OpenTelemetry 官方概念文档 TracerProvider / SpanProcessor / Span Exporter
- [ ] @langfuse/otel README 中 LangfuseSpanProcessor 的用法与配置项

#### 🛠️ Hands-on

- [ ] 本地起一个最小 Node 服务，先建一个 TracerProvider 再挂两个 processor，打印两边收到的 span 是否同 trace_id
- [ ] 把 shouldExportSpan 改成全放行，观察 Langfuse 里混入的 HTTP span，再改回按 scope 前缀过滤

---

### 19. unmet peer 组合的风险管理

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] OpenInference 项目关于 instrumentation 与 semconv 的设计说明
- [ ] @langfuse/otel 的 peerDependencies 声明与 OTel 版本要求

#### 🛠️ Hands-on

- [ ] 在测试环境升级一个 @opentelemetry 包的小版本，按文档跑一遍冒烟，记录哪些字段先出问题
- [ ] 写一个最小 demo 对比自建埋点与插桩方案在新增调用点时的改动量

---

### 20. 侵入式埋点与 OTel 插桩的取舍

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] OpenInference 项目关于 instrumentation 与 semconv 的设计说明
- [ ] @langfuse/otel 的 peerDependencies 声明与 OTel 版本要求

#### 🛠️ Hands-on

- [ ] 在测试环境升级一个 @opentelemetry 包的小版本，按文档跑一遍冒烟，记录哪些字段先出问题
- [ ] 写一个最小 demo 对比自建埋点与插桩方案在新增调用点时的改动量

---

### 21. 密钥通过环境变量注入与 zod 校验

> Related dimensions: 🔒 `security`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] Langfuse 自托管部署与数据留存相关文档
- [ ] 公司关于内部数据出网与敏感字段的规范（以团队实际规范为准）

#### 🛠️ Hands-on

- [ ] 检查一次真实上报的 trace 内容，列出都落了哪些字段，确认没有密钥或敏感信息
- [ ] 把三个环境变量清空后重启，确认服务正常启动且没有任何数据流出

---

### 22. 必填维度与可兜底维度的区分

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] BullMQ worker 与 NestJS 请求上下文的关系说明
- [ ] docs/Langfuse 上报接入说明.md 第八节

#### 🛠️ Hands-on

- [ ] 在周报 worker 里去掉 projectId 跑一次，到后台按项目过滤确认搜不到，再补回对比
- [ ] 新写一个最小 worker 调 runQuery，验证不传 projectId 时 trace 里 userId 是否仍为 system

---

### 23. 旁路依赖的降级分层（配置 / 初始化 / 运行期）

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 关于缓冲、flush 与 shutdown 的说明
- [ ] NestJS 生命周期钩子与优雅退出官方指南

#### 🛠️ Hands-on

- [ ] 本地发一次请求后立刻 kill 进程，对比有无 forceFlush 时 Langfuse 里最后一批 span 是否丢失
- [ ] 把 LANGFUSE_BASE_URL 故意写错，观察运行期导出失败时进程是否存活、日志长什么样

---

### 24. 请求上下文与后台任务上下文的统一收敛

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] BullMQ worker 与 NestJS 请求上下文的关系说明
- [ ] docs/Langfuse 上报接入说明.md 第八节

#### 🛠️ Hands-on

- [ ] 在周报 worker 里去掉 projectId 跑一次，到后台按项目过滤确认搜不到，再补回对比
- [ ] 新写一个最小 worker 调 runQuery，验证不传 projectId 时 trace 里 userId 是否仍为 system

---

## ✨ Bonus (15 topics)


### 1. AI 可观测的数据量与统计口径影响

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] @langfuse/otel 文档关于 shouldExportSpan 与 environment 的说明
- [ ] OpenInference 语义约定中关于 span kind（AGENT / LLM / TOOL）的定义

#### 🛠️ Hands-on

- [ ] 把 shouldExportSpan 临时改成全部放行，跑一次请求后在 Langfuse 里数一数混入了多少 HTTP span
- [ ] 把 environment 写死成 development 再跑测试环境请求，确认后台环境过滤失效的样子

---

### 2. AsyncLocalStorage 的上下文继承边界

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] BullMQ worker 与 NestJS 请求上下文的关系说明
- [ ] docs/Langfuse 上报接入说明.md 第八节

#### 🛠️ Hands-on

- [ ] 在周报 worker 里去掉 projectId 跑一次，到后台按项目过滤确认搜不到，再补回对比
- [ ] 新写一个最小 worker 调 runQuery，验证不传 projectId 时 trace 里 userId 是否仍为 system

---

### 3. Claude Agent SDK 的 PostToolUse / PostToolUseFailure 事件语义

> Related dimensions: 📈 `observability`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] Langfuse 文档关于 observation level 与 status message 的映射规则
- [ ] docs/Langfuse 上报接入说明.md 第七节

#### 🛠️ Hands-on

- [ ] 在测试环境点一次取消发布，先在改前版本看整条 trace 是否标红，再在改后版本确认变成 Warning 且 statusMessage 为 business-intercept
- [ ] 构造一个工具真的执行失败的场景，确认它的 span 仍是 ERROR 且没被降级，验证不误伤

---

### 4. LLM 成本归因（usage 明细 × 模型价目表）

> Related dimensions: 📈 `observability`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] Anthropic 官方文档 prompt caching 章节关于 usage 字段的说明
- [ ] Langfuse 文档关于 token 与 cost 计算、模型价格表的说明

#### 🛠️ Hands-on

- [ ] 跑一次长对话触发 cache 命中，对比修改前后 Langfuse 中 cache read / write 明细与 cost 拆分的变化
- [ ] 临时保留 llm.cost.total，观察 Langfuse 成本拆分里 input 与 output 是否为空，再删掉对比

---

### 5. Langfuse environment 分环境

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] @langfuse/otel 文档关于 shouldExportSpan 与 environment 的说明
- [ ] OpenInference 语义约定中关于 span kind（AGENT / LLM / TOOL）的定义

#### 🛠️ Hands-on

- [ ] 把 shouldExportSpan 临时改成全部放行，跑一次请求后在 Langfuse 里数一数混入了多少 HTTP span
- [ ] 把 environment 写死成 development 再跑测试环境请求，确认后台环境过滤失效的样子

---

### 6. Langfuse markAppRootCandidate 的 root 判定

> Related dimensions: 📈 `observability`
> Appears in: `qa-03`

#### 📖 Must-read

- [ ] OpenTelemetry 2.0 升级说明中关于 instrumentationScope 与 parentSpanContext 的变更
- [ ] @langfuse/otel 源码里 markAppRootCandidate 的实现

#### 🛠️ Hands-on

- [ ] 构造一个只有 v1 字段的假 span，分别在有、无兼容层的情况下喂给 processor，观察崩溃与 root 误标两种现象
- [ ] 把 parentSpanContext 映射临时删掉，在 Langfuse 后台勾 Is Root Observation，复现一堆子节点的画面并截图留存

---

### 7. Proxy 与深拷贝在热路径上的取舍

> Related dimensions: ⚡ `performance`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 配置说明（队列大小、定时、最大导出批量）
- [ ] Langfuse 关于采样与数据量控制的文档

#### 🛠️ Hands-on

- [ ] 用压测脚本连打 50 次对话，观察进程 CPU 与内存、Langfuse 收到的 span 数量与导出延迟
- [ ] 在 onEnd 里加一个计数与耗时打印，量化自己那段逻辑的实际开销

---

### 8. ProxyTracerProvider 与 getDelegate

> Related dimensions: 📈 `observability`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] OpenTelemetry 官方概念文档 TracerProvider / SpanProcessor / Span Exporter
- [ ] @langfuse/otel README 中 LangfuseSpanProcessor 的用法与配置项

#### 🛠️ Hands-on

- [ ] 本地起一个最小 Node 服务，先建一个 TracerProvider 再挂两个 processor，打印两边收到的 span 是否同 trace_id
- [ ] 把 shouldExportSpan 改成全放行，观察 Langfuse 里混入的 HTTP span，再改回按 scope 前缀过滤

---

### 9. dotenv 与 Nest ConfigModule 的加载时机差

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] Node.js ESM 模块生命周期文档（linking 与 evaluation）
- [ ] NestJS ConfigModule envFilePath 的加载时机说明

#### 🛠️ Hands-on

- [ ] 把 startServer 改成顶部静态 import，观察是否出现部分调用无 span 的现象并定位原因
- [ ] 把 dotenv 那两行删掉，确认 LANGFUSE_* 读不到时走的是跳过分支而不是报错

---

### 10. metadata 的落库形态（顶层 key 而非 attributes 平铺）

> Related dimensions: 📈 `observability`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] Node.js 官方 AsyncLocalStorage 文档与 AsyncResource 的边界说明
- [ ] Langfuse 文档关于 user.id 与 langfuse.trace.metadata 命名空间的约定

#### 🛠️ Hands-on

- [ ] 在周报 worker 里故意去掉 projectId，跑到 Langfuse 后台按项目过滤，确认搜不到后再补回来对比
- [ ] 写一个最小 AsyncLocalStorage 示例，验证在 setTimeout 与 Promise 链里是否都能读到

---

### 11. span 属性体积与采样策略

> Related dimensions: ⚡ `performance`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 配置说明（队列大小、定时、最大导出批量）
- [ ] Langfuse 关于采样与数据量控制的文档

#### 🛠️ Hands-on

- [ ] 用压测脚本连打 50 次对话，观察进程 CPU 与内存、Langfuse 收到的 span 数量与导出延迟
- [ ] 在 onEnd 里加一个计数与耗时打印，量化自己那段逻辑的实际开销

---

### 12. 上报属性的最小化原则

> Related dimensions: 🔒 `security`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] Langfuse 自托管部署与数据留存相关文档
- [ ] 公司关于内部数据出网与敏感字段的规范（以团队实际规范为准）

#### 🛠️ Hands-on

- [ ] 检查一次真实上报的 trace 内容，列出都落了哪些字段，确认没有密钥或敏感信息
- [ ] 把三个环境变量清空后重启，确认服务正常启动且没有任何数据流出

---

### 13. 优雅退出的超时与失败容忍

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] OpenTelemetry BatchSpanProcessor 关于缓冲、flush 与 shutdown 的说明
- [ ] NestJS 生命周期钩子与优雅退出官方指南

#### 🛠️ Hands-on

- [ ] 本地发一次请求后立刻 kill 进程，对比有无 forceFlush 时 Langfuse 里最后一批 span 是否丢失
- [ ] 把 LANGFUSE_BASE_URL 故意写错，观察运行期导出失败时进程是否存活、日志长什么样

---

### 14. 冒烟验证在可观测链路中的不可替代性

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] OpenInference 项目关于 instrumentation 与 semconv 的设计说明
- [ ] @langfuse/otel 的 peerDependencies 声明与 OTel 版本要求

#### 🛠️ Hands-on

- [ ] 在测试环境升级一个 @opentelemetry 包的小版本，按文档跑一遍冒烟，记录哪些字段先出问题
- [ ] 写一个最小 demo 对比自建埋点与插桩方案在新增调用点时的改动量

---

### 15. 降级回落到原始 SDK 的边界设计

> Related dimensions: 📈 `observability`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] @arizeai/openinference-instrumentation-claude-agent-sdk 的 README 与 manuallyInstrument 源码
- [ ] MDN 关于 ES module namespace object 不可变的说明

#### 🛠️ Hands-on

- [ ] 写一个小脚本：分别用直接 patch 与接住返回值两种方式调用 query，对比 span 数量差异
- [ ] 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界

---

