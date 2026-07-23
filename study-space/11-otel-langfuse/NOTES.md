# 11 OTel + Langfuse 学习笔记

## 一句话心得

> span 是一次操作的"日志条目 + 计时器"，traceparent 头把跨服务的 span 串成完整 trace；Langfuse 是专为 LLM 设计的 trace 可视化平台，能看到每次对话的 prompt/输出/token/费用。

---

## 核心概念

| 概念 | 比喻 | 说明 |
|---|---|---|
| **Trace** | 一张订单的完整流转记录 | 用户一次请求的全链路 |
| **Span** | 订单流转中的一个环节 | 一次函数调用/LLM 请求/DB 查询 |
| **traceparent** | 订单号印在每张单据上 | HTTP 头，跨服务传递 trace ID |

### traceparent 格式

```
traceparent: 00-<trace-id-32位hex>-<parent-span-id-16位hex>-<flags>
示例:        00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
                   ↑ 整个链路唯一 ID              ↑ 上游的 span ID    ↑ 01=采样
```

---

## OTel 基本用法（Node.js）

```js
// 1. 初始化 SDK
const sdk = new NodeSDK({ traceExporter: new ConsoleSpanExporter() });
sdk.start();

// 2. 获取 tracer
const tracer = trace.getTracer('my-service');

// 3. 创建 span
tracer.startActiveSpan('llm.call', async (span) => {
  span.setAttribute('llm.model', 'claude-sonnet-4-6');
  span.setAttribute('llm.tokens', 500);

  try {
    const result = await callLLM();
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    throw err;
  }
});
```

---

## Langfuse 是什么？怎么接入？

Langfuse 是专门给 AI 应用用的监控面板，能看到：
- 每次对话的 prompt 和 response 原文
- token 用量和费用
- 耗时（哪个步骤最慢）
- 成功/失败率

接入方式（不需要自己架服务器）：

```js
// 把 exporter 换成 Langfuse 的 OTLP endpoint
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'https://cloud.langfuse.com/api/public/otel/v1/traces',
    headers: {
      Authorization: 'Basic ' + btoa(`${PUBLIC_KEY}:${SECRET_KEY}`),
    },
  }),
});
```

然后去 langfuse.com 注册账号，创建项目拿到 key 就能看了。

---

## 面试高频问题

**Q: 为什么 AI 应用比普通应用更需要监控？**
> LLM 调用是黑盒：相同 prompt 可能返回不同结果，费用不固定，延迟高且抖动大。没有 trace 根本不知道哪里出问题。

**Q: span 里应该记什么属性？**
> 对 LLM span，最有价值的：model 名、input_tokens、output_tokens、cost、stop_reason。对业务 span：用户 ID、请求来源、cache hit/miss。

**Q: 采样率怎么设？**
> 生产环境不能 100% 采样（太贵），通常 1%~10%，或者只采样出错的请求（tail-based sampling）。

---

## 文件说明

- `otel-demo.js` — 手动埋点演示：trace → span → 属性 → 错误处理
