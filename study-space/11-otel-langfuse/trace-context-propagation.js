/**
 * 跨服务 Trace 传递演示
 *
 * 场景：服务 A 收到用户请求 → 调服务 B（LLM 代理）→ 返回结果
 * 问题：两个服务在不同进程，怎么让 Span 串成一条 Trace？
 * 答案：HTTP 请求带上 traceparent 头，服务 B 解析后创建子 Span
 */

const { trace, context, propagation, SpanStatusCode } = require('@opentelemetry/api');

// ── 模拟：服务 A ──────────────────────────────────────────────────────
async function serviceA(userQuestion) {
  const tracer = trace.getTracer('service-a');

  return tracer.startActiveSpan('service_a.handle_request', async (span) => {
    span.setAttribute('user.question', userQuestion);

    console.log('[服务A] 收到请求，创建根 Span');
    console.log(`  spanId: ${span.spanContext().spanId}`);

    // --- 关键步骤：把当前 Context 注入到 HTTP 头 ---
    // 真实场景里，你会在发 HTTP 请求前调用 propagation.inject
    const headers = {};
    propagation.inject(context.active(), headers);  // 把 traceId + spanId 写进 headers
    console.log(`  traceparent: ${headers.traceparent}`);

    // --- 模拟 HTTP 调用：把 headers 传给服务 B ---
    const result = await serviceB(userQuestion, headers);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  });
}

// ── 模拟：服务 B ──────────────────────────────────────────────────────
async function serviceB(question, incomingHeaders) {
  const tracer = trace.getTracer('service-b');

  // --- 关键步骤：从 HTTP 头恢复 Context ---
  // 真实场景里，你在收到 HTTP 请求后调用 propagation.extract
  const extractedContext = propagation.extract(context.active(), incomingHeaders);

  // 在恢复的 Context 下创建 Span → 自动挂到服务 A 的 Span 下面
  return context.with(extractedContext, () => {
    return tracer.startActiveSpan('service_b.llm_call', async (span) => {
      span.setAttribute('llm.model', 'claude-sonnet-4-6');
      span.setAttribute('llm.question', question);

      console.log('[服务B] 从 traceparent 恢复 Context，创建子 Span');
      console.log(`  spanId: ${span.spanContext().spanId}`);
      console.log(`  traceId: ${span.spanContext().traceId}`);  // 和服务 A 一致！
      console.log(`  parentSpanId: ${span.parentSpanId}`);       // 指向服务 A 的 Span

      // 模拟 LLM 调用
      await sleep(100);

      span.setAttribute('llm.response', `回答: ${question}`);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return `[服务B结果] ${question} 的回答`;
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── 主流程 ────────────────────────────────────────────────────────────
async function main() {
  // 初始化 SDK（简化为手动初始化 tracer）
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
  const sdk = new NodeSDK({ traceExporter: new ConsoleSpanExporter() });
  sdk.start();

  console.log('=== 跨服务 Trace 传递 ===\n');

  await serviceA('今天天气怎么样？');

  console.log('\n✅ 注意输出中服务 A 和 B 的 traceId 一致，B 的 parentSpanId = A 的 spanId');

  await sleep(1000);
  await sdk.shutdown();
}

main().catch(console.error);
