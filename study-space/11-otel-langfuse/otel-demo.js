/**
 * 演示：OpenTelemetry 手动埋点（不依赖 Langfuse，纯本地输出）
 *
 * 核心概念：
 *   Trace = 一次完整的请求链路（从用户问到 AI 回答）
 *   Span  = 链路中的一个步骤（一次 LLM 调用、一次 DB 查询）
 *   traceparent = 跨服务传递 trace ID 的 HTTP 头
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const {
  ConsoleSpanExporter,
} = require('@opentelemetry/sdk-trace-node');

// ── 1. 初始化 OTel SDK（把 span 打印到控制台，方便看） ────────────────
const sdk = new NodeSDK({
  serviceName: 'ai-study-demo',
  traceExporter: new ConsoleSpanExporter(),
});
sdk.start();

const tracer = trace.getTracer('ai-demo-tracer', '1.0.0');

// ── 2. 模拟一次完整的"用户问 AI"的链路 ──────────────────────────────
async function handleUserQuestion(question) {
  // 创建根 span（一个 trace 的入口点）
  return tracer.startActiveSpan('handle_question', async (rootSpan) => {
    // 给 span 加属性，方便后续搜索和分析
    rootSpan.setAttribute('user.question', question);
    rootSpan.setAttribute('session.id', 'sess_abc123');

    try {
      // 步骤 A：先查 Redis 缓存
      const cached = await tracer.startActiveSpan('cache.lookup', async (span) => {
        span.setAttribute('cache.key', `qa:${question}`);
        await sleep(30); // 模拟 30ms 延迟
        const hit = false; // 假设没命中
        span.setAttribute('cache.hit', hit);
        span.end();
        return hit ? '缓存结果' : null;
      });

      if (cached) {
        rootSpan.setAttribute('response.source', 'cache');
        rootSpan.end();
        return cached;
      }

      // 步骤 B：调 LLM
      const llmResponse = await tracer.startActiveSpan('llm.call', async (span) => {
        span.setAttribute('llm.model', 'claude-sonnet-4-6');
        span.setAttribute('llm.input_tokens', question.length * 2); // 假数据

        await sleep(800); // 模拟 800ms LLM 延迟

        const response = `关于"${question}"：这是一个模拟的 AI 回答。`;
        span.setAttribute('llm.output_tokens', response.length);
        span.setAttribute('llm.total_cost_usd', 0.0012);
        span.end();
        return response;
      });

      // 步骤 C：写缓存
      await tracer.startActiveSpan('cache.write', async (span) => {
        span.setAttribute('cache.key', `qa:${question}`);
        span.setAttribute('cache.ttl_seconds', 3600);
        await sleep(10);
        span.end();
      });

      rootSpan.setAttribute('response.source', 'llm');
      rootSpan.setStatus({ code: SpanStatusCode.OK });
      rootSpan.end();
      return llmResponse;

    } catch (err) {
      // 记录错误到 span
      rootSpan.recordException(err);
      rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      rootSpan.end();
      throw err;
    }
  });
}

// ── 3. traceparent 头是什么 ───────────────────────────────────────────
function showTraceparentFormat() {
  console.log('\n=== traceparent 头格式 ===');
  const example = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  //               版本  ← trace id (32位hex) →  ← span id (16位hex) → flags
  console.log(`traceparent: ${example}`);
  console.log('  版本: 00（固定）');
  console.log('  trace-id: 4bf92f3577b34da6a3ce929d0e0e4736 （这个请求的唯一ID）');
  console.log('  parent-span-id: 00f067aa0ba902b7 （上游 span 的 ID）');
  console.log('  flags: 01 = 采样（00 = 不采样）');
  console.log('\n服务 A 调服务 B 时，把这个头带上，');
  console.log('Langfuse/Jaeger 就能把两个服务的 span 串成一个 trace。');
}

// ── 工具函数 ─────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── 主流程 ───────────────────────────────────────────────────────────
async function main() {
  console.log('=== OTel 埋点演示 ===\n');
  console.log('模拟一次 AI 问答的完整 trace...\n');

  const answer = await handleUserQuestion('什么是对象池？');
  console.log('最终回答:', answer);

  showTraceparentFormat();

  console.log('\n（等 SDK flush span 到控制台）\n');
  await sleep(1000);

  await sdk.shutdown();
  console.log('\n=== SDK 已关闭 ===');
}

main().catch(console.error);
