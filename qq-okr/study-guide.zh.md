# QQ OKR（qq-okr） — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：会写一点 JS/TS，但对项目里的关键概念还停留在「听过没做过」的同学
> 目标：跟着做完，覆盖知识图谱里的所有知识点

---

## 0. 怎么使用这份指引

按 **阶段 → 簇** 的顺序往下走。每个簇都包含一段「真实场景」、一组必读材料（外链可点）、若干动手练习和 3 道自检。

每天定 1–2 个簇做完，先做 demo 再看规范；每个簇做完用末尾的「自检」给自己打分。所有问题都答得上来再进入下一个簇。

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：建立 OTel 心智模型 | `c1` | 两条上报分支如何共用一个 TracerProvider |
| 阶段 B：插桩落地与版本兼容 | `c2` · `c3` | 让 Claude Agent SDK 自己长出 span：手动插桩与 ESM 陷阱；OTel v1 / v2 字段差异与父子关系修复 |
| 阶段 C：数据口径、可靠性与安全边界 | `c4` | 数据口径、降级退出与上报边界 |

---

## 阶段 A：建立 OTel 心智模型

### 簇 1（c1）：两条上报分支如何共用一个 TracerProvider

**覆盖知识点**：OpenTelemetry SpanProcessor 与 TracerProvider 的关系、shouldExportSpan 的职责过滤、ProxyTracerProvider 与 getDelegate、instrumentation scope 作为过滤判据、Langfuse environment 分环境

**真实场景**：你想知道为什么伽利略和 Langfuse 能拿到同一个 trace_id，以及为什么不应该让 Langfuse 自己建一个 provider。

#### 0-1 零基础前置

- 知道 trace、span、attribute 是什么（任何一篇 OTel 入门文章即可） —— 入门链接：[doc](https://opentelemetry.io/docs/languages/js/instrumentation/)

#### 必读材料

1. [OpenTelemetry JavaScript 插桩官方指南（TracerProvider / SpanProcessor / Exporter 的关系）](https://opentelemetry.io/docs/languages/js/instrumentation/)
2. [Langfuse：与已有 OpenTelemetry 设置共存（含共享 provider 与独立 provider 的取舍）](https://langfuse.com/faq/all/existing-otel-setup)
3. [Langfuse OpenTelemetry 集成：span 属性如何映射成 trace / observation 字段](https://langfuse.com/docs/integrations/opentelemetry)
4. [Langfuse TypeScript SDK 高级用法（按 instrumentation scope 过滤、mask 敏感数据）](https://langfuse.com/docs/observability/sdk/typescript/advanced-usage)

#### 动手练习

- 本地起一个最小 Node 服务，建一个 TracerProvider 后挂两个 processor，打印两边收到的 span 是否同 trace_id
- 把 shouldExportSpan 改成全放行，观察非 AI span 混入 Langfuse 的样子，再改回按 scope 前缀过滤
- 故意对 trace.getTracerProvider() 直接调 addSpanProcessor，复现静默不生效并定位 getDelegate

#### 自检

- [ ] 为什么两个平台共用 provider 后 trace_id 一定相同，不需要任何透传代码？
- [ ] shouldExportSpan 应该用什么做判据，用 span 名会有什么后果？
- [ ] 如果 Langfuse 自建 provider，跨平台排查会多出哪一步？

---

## 阶段 B：插桩落地与版本兼容

### 簇 1（c2）：让 Claude Agent SDK 自己长出 span：手动插桩与 ESM 陷阱

**覆盖知识点**：ESM 命名空间对象只读与 monkeypatch 限制、OpenInference 手动插桩 API 语义、降级回落到原始 SDK 的边界设计、ESM 静态 import 与动态 import 的求值时机、monkey patch 与模块引用绑定的冲突

**真实场景**：你需要让 query() 调用自动产出 AGENT / LLM / TOOL span，但 ESM 模块不能直接 patch。

#### 0-1 零基础前置

- 理解 ESM 命名空间对象只读、不能直接赋值替换导出 —— 入门链接：[doc](https://opentelemetry.io/docs/languages/js/instrumentation/)

#### 必读材料

1. [OpenTelemetry JavaScript 插桩官方指南（自动插桩与手动插桩的区别）](https://opentelemetry.io/docs/languages/js/instrumentation/)
2. [Langfuse OpenTelemetry 集成文档（span 属性与 observation 类型映射）](https://langfuse.com/docs/integrations/opentelemetry)

#### 动手练习

- 写一个小脚本，分别用忽略返回值与接住返回值两种方式调 query，对比 span 数量差异
- 把 getInstrumentedClaudeAgentSDK 改成始终返回原始 SDK，确认业务功能不受影响，体会降级边界
- 在 main.ts 里把 startServer 改成静态 import，观察是否出现部分调用无 span 的现象

#### 自检

- [ ] 为什么忽略 manuallyInstrument 的返回值时，服务和 Agent 都正常却一条 span 都没有？
- [ ] 为什么 startServer 必须用动态 import 而不是顶部静态 import？
- [ ] 可观测关掉后业务行为为什么完全不变？这个边界是怎么实现的？

---

### 簇 2（c3）：OTel v1 / v2 字段差异与父子关系修复

**覆盖知识点**：OTel v1 与 v2 的 Span 字段差异、Proxy 做只读字段映射的手法、Langfuse markAppRootCandidate 的 root 判定、unmet peer 组合的风险管理、冒烟验证在可观测链路中的不可替代性

**真实场景**：伽利略锁 OTel v1、@langfuse/otel 按 v2 写，你要在不升级任何一方的前提下让它们共用 provider。

#### 必读材料

1. [Langfuse：与已有 OpenTelemetry 设置共存（版本与 provider 组合的注意事项）](https://langfuse.com/faq/all/existing-otel-setup)
2. [Langfuse OpenTelemetry 集成（observation level、status_message 与 metadata 映射规则）](https://langfuse.com/docs/integrations/opentelemetry)

#### 动手练习

- 构造一个只有 v1 字段的假 span，在有、无兼容层两种情况下喂给 processor，分别复现崩溃与 root 误标
- 临时删掉 parentSpanContext 映射，在后台勾 Is Root Observation，截图保存一堆子节点的样子
- 升级一个 @opentelemetry 小版本后按文档跑一次真实上报冒烟，记录先出问题的是哪个字段

#### 自检

- [ ] v1 到 v2 到底变了哪两个字段？各自缺失时的现象分别是什么？
- [ ] 为什么父子关系丢失不会报错，只能在 UI 上发现？
- [ ] 为什么升级依赖后不能只跑单测，必须跑真实上报冒烟？

---

## 阶段 C：数据口径、可靠性与安全边界

### 簇 1（c4）：数据口径、降级退出与上报边界

**覆盖知识点**：Anthropic prompt caching 的 usage 字段语义、OpenInference / Langfuse 的 prompt 与 cost 口径、LLM 成本归因（usage 明细 × 模型价目表）、Langfuse trace 等级取子 span 最高值的规则、observation 级属性与 trace 级属性的区别、Claude Agent SDK 的 PostToolUse / PostToolUseFailure 事件语义、AsyncLocalStorage 在请求级上下文中的作用与边界、Langfuse trace 级属性的合并规则与 broadcast 必要性、metadata 的落库形态（顶层 key 而非 attributes 平铺）、请求上下文与后台任务上下文的统一收敛、必填维度与可兜底维度的区分、旁路依赖的降级分层（配置 / 初始化 / 运行期）、BatchSpanProcessor 缓冲与 forceFlush 的必要性、优雅退出的超时与失败容忍、密钥通过环境变量注入与 zod 校验、LLM 可观测的数据出网与合规边界、上报属性的最小化原则

**真实场景**：你要让错误率、token、成本三个数字可信，同时保证上报永远不会拖垮服务，也不把敏感数据带出去。

#### 0-1 零基础前置

- 了解 Node.js AsyncLocalStorage 的基本用法与上下文继承边界 —— 入门链接：[doc](https://nodejs.org/api/async_context.html)

#### 必读材料

1. [Anthropic Prompt caching 文档（input_tokens / cache_read / cache_creation 的口径关系）](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
2. [Langfuse Model Usage & Cost Tracking（usage 明细与成本拆分规则）](https://langfuse.com/docs/observability/features/token-and-cost-tracking)
3. [Node.js 官方文档：Asynchronous context tracking（AsyncLocalStorage）](https://nodejs.org/api/async_context.html)
4. [Langfuse 数据留存文档（上报后数据会在平台上留多久）](https://langfuse.com/docs/administration/data-retention)
5. [Hardening self-hosted Langfuse（自托管实例的密钥与网络边界）](https://langfuse.com/self-hosting/configuration/hardening)

#### 动手练习

- 跑一次命中 cache 的长对话，对比修改前后 Langfuse 里 cache 明细与 cost 拆分的变化
- 在测试环境点一次取消发布，先在改前看整条 trace 标红，再在改后确认变成 Warning 且 statusMessage 为 business-intercept
- 发一次请求后立刻 kill 进程，对比有无 forceFlush 时最后一批 span 是否丢失
- 清空三个 LANGFUSE 环境变量后重启，确认服务正常启动且没有任何数据流出

#### 自检

- [ ] 为什么 cache 命中会让 Langfuse 倒推出的非缓存 input 变成负数？
- [ ] 业务拦截的 span 为什么既不能标 OK 也不能留 ERROR，而要走 WARNING？
- [ ] 上报出网这一件事，你在密钥、默认状态、额外属性上分别做了什么约束？

---

## 全局自检：4 个一句话问题

1. （c1）不看代码，画出从 Claude Agent SDK 到伽利略与 Langfuse 两条分支的数据流，并标出 trace_id 在哪里产生。
2. （c2）说出插桩失败的三种典型现象（零 span、部分 span、数据错乱）分别对应哪个原因。
3. （c3）升级依赖后，你按什么顺序验证上报仍然正确？列出要确认的三件事。
4. （c4）如果业务方说错误率突然涨了，你怎么判断是真实故障还是上报口径问题？

---

## 学习效率 Tips

- 可观测的第一性问题不是怎么收数据，而是这个数字代表什么：错误率、token、成本都要先和业务语义对齐才能看板化。
- 先把 trace_id 打通再谈字段细节，跨平台关联是最难补的一环，字段可以后补。
- 遇到版本错配，优先找最小差异面，本项目只有两个字段，穷举比猜测快。
- 判据要用稳定语义（Abandoned）而不是表面特征（工具名、文案），否则每加一个工具就要改一次。
- 所有适配逻辑收敛到单独一个文件，升级依赖时回归范围才可控。
- 改完上报一定要跑真实冒烟并在 UI 上看，单测里的假 span 和真实 SDK 产出的形状不同。

