# 11 OTel + Langfuse 学习笔记

## 一句话心得

> OTel 是"采数据的"，Langfuse/Galileo 是"看数据的"。埋点 = 在关键位置插旗子记录耗时+属性；traceparent 头把跨服务的 Span 串成一条完整 Trace；GenAI Conventions 让监控平台自动识别 LLM 调用。

---

## 核心概念

| 概念 | 比喻 | 说明 |
|------|------|------|
| **Trace** | 一张订单的完整流转记录 | 一次用户请求从入口到出口的全链路 |
| **Span** | 订单流转中的一个环节 | 一次函数调用 / LLM 请求 / DB 查询，记录名称+耗时+属性 |
| **埋点** | 在每个中转站放传感器 | 用 `startActiveSpan` 在代码关键位置"插旗子" |
| **traceparent** | 订单号印在每张单据上 | HTTP 头，跨服务传递 traceId + spanId |

---

## Span 父子关系：Context 传播机制

`startActiveSpan` 不只是创建 Span，它还会把 Span **压入 Context 栈**，后续的子 Span 自动挂在它下面：

```
tracer.startActiveSpan('parent', async (parentSpan) => {
  // parentSpan 成为"当前活跃 Span"

  tracer.startActiveSpan('child', async (childSpan) => {
    // OTel 自动从 Context 拿到 parentSpan 作为父 Span
    // childSpan.parentSpanId = parentSpan.spanId ✅
    childSpan.end();
  });
  // childSpan 结束后，parentSpan 恢复为活跃 Span

  parentSpan.end();
});
```

**关键：不需要手动传 parentSpan，OTel 的 Context 栈自动处理父子关系。**

---

## 跨服务 Trace 传递

两个服务在不同进程，需要靠 traceparent 头传递 trace 信息：

```
服务 A                              服务 B
  │                                    │
  │  propagation.inject(context, headers)
  │  headers.traceparent = "00-{traceId}-{spanId}-01"
  │ ─────────────────────────────────> │
  │                                    │  propagation.extract(context, headers)
  │                                    │  在恢复的 Context 下创建 Span
  │                                    │  自动挂到服务 A 的 Span 下面
```

**两个核心 API：**
- `propagation.inject(context.active(), headers)` — 发请求前注入
- `propagation.extract(context.active(), headers)` — 收到请求后恢复

---

## traceparent 头格式

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             版本  ← trace-id (32位hex) →  ← parent-span-id (16位) → 采样
```

| 字段 | 长度 | 说明 |
|------|------|------|
| version | 2 位 hex | 固定 `00` |
| trace-id | 32 位 hex | 整条链路唯一 ID |
| parent-span-id | 16 位 hex | 上游 Span 的 ID |
| trace-flags | 2 位 hex | `01` = 采样，`00` = 不采样 |

---

## 采样策略

生产环境不能 100% 采样（数据量大、存储贵），需要选择性记录：

| 策略 | 采样器 | 场景 |
|------|--------|------|
| **全量采样** | `AlwaysOnSampler` | 本地开发、压测 |
| **比例采样** | `TraceIdRatioBasedSampler(0.1)` | 生产环境，10% 采样控制成本 |
| **父级感知** | `ParentBasedSampler` | 微服务，保证同一条 trace 采样决策一致 |
| **按错采样** | tail-based（Collector 层面） | 错误 100% 采 + 正常 1% 采，不丢错误信息 |

**ParentBased 原理：**
- 根 Span 按 10% 采样
- 如果根 Span 被采样 → 所有子 Span 自动采样
- 如果根 Span 没被采样 → 所有子 Span 也不采样
- **保证同一条 trace 在多个服务间不会出现半截的情况**

---

## OTel 基本用法

```js
// 1. 初始化 SDK
const sdk = new NodeSDK({
  serviceName: 'my-service',
  traceExporter: new ConsoleSpanExporter(), // 开发用
  sampler: new TraceIdRatioBasedSampler(0.1), // 生产用
});
sdk.start();

// 2. 获取 tracer
const tracer = trace.getTracer('my-module', '1.0.0');

// 3. 创建 span 埋点
tracer.startActiveSpan('operation.name', async (span) => {
  span.setAttribute('key', 'value'); // 记录属性

  try {
    const result = await doSomething();
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    span.end();
    throw err;
  }
});
```

---

## LLM 专属埋点：GenAI Semantic Conventions

通用 OTel 属性只是 key-value 字符串，GenAI Conventions 定义了标准属性名，让 Langfuse 等平台自动识别这是 LLM 调用：

| 属性名 | 说明 |
|--------|------|
| `gen_ai.system` | `'anthropic'` / `'openai'` |
| `gen_ai.request.model` | 模型名 |
| `gen_ai.request.max_tokens` | 最大 token 数 |
| `gen_ai.request.temperature` | 温度参数 |
| `gen_ai.usage.input_tokens` | 输入 token 数 |
| `gen_ai.usage.output_tokens` | 输出 token 数 |
| `gen_ai.response.finish_reason` | `'stop'` / `'tool_calls'` / `'length'` |

---

## Langfuse 数据模型

Langfuse 是专为 AI 场景设计的监控平台，数据模型比 OTel Span 更贴合 LLM 场景：

```
Trace（一次用户请求）
└── Observation
     ├── Generation  = 一次 LLM 调用（prompt → completion + tokens + cost）
     ├── Span        = 一个业务步骤（查缓存、写 DB）
     └── Event       = 一个事件点（无耗时）
```

**Generation 核心字段：** name, model, input（完整 prompt）, output（完整 completion）, usage（tokens）, costDetails（费用）

---

## 你项目中的实际使用

### qpilot-web-v2（Galileo Node SDK）
- 初始化：`instrumentation.ts` 中 `SetupGalileo(galileoConfig)`
- 自动埋点：Galileo SDK 内部处理，没有手写 `startActiveSpan`
- 自定义指标：`meter.createHistogram('api_request_duration')`、`meter.createCounter('chat_error_count')`
- 客户端监控：Aegis SDK，注入 `traceparent` 头

### next-guild（轻量使用）
- 只用 OTel 的 `RandomIdGenerator` 生成 traceparent 头
- tRPC 调用时注入：`context: { traceparent: getTraceParent(trace) }`
- 没有 OTel SDK，没有实际埋点

---

## 面试高频问题

**Q: 为什么 AI 应用比普通应用更需要监控？**
> LLM 调用是黑盒：相同 prompt 可能返回不同结果，费用不固定，延迟高且抖动大。没有 trace 根本不知道哪里出问题。

**Q: span 里应该记什么属性？**
> LLM span：model、input_tokens、output_tokens、cost、finish_reason
> 业务 span：user_id、session_id、cache.hit、response.source

**Q: 采样率怎么设？**
> 开发 100%，生产 1%~10%，或用 tail-based：错误全采 + 正常少量

**Q: 跨服务 trace 怎么串起来？**
> HTTP 请求带 traceparent 头，服务 B 用 propagation.extract 恢复 Context

**Q: Langfuse 和 Galileo 有什么区别？**
> Langfuse 专为 LLM 场景设计（prompt/token/cost 可视化），Galileo 是腾讯内部通用监控平台

---

## 文件说明

- `otel-demo.js` — 基础埋点：Trace → Span → 属性 → 错误处理
- `trace-context-propagation.js` — 跨服务 trace 传递：inject/extract
- `sampling-strategies.js` — 四种采样策略对比
- `llm-instrumentation.js` — LLM 专属埋点：GenAI Conventions + Langfuse 模型
