/**
 * OTel 埋点演示：Trace + Span
 *
 * 核心概念：
 *   Trace = 一次请求的完整链路
 *   Span  = 链路中的一个步骤
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');

// ── 1. 初始化 OTel SDK ────────────────────────────────────────────────
const sdk = new NodeSDK({
  serviceName: 'ai-study-demo',
  traceExporter: new ConsoleSpanExporter(),  // 打印到控制台，方便学习
});
sdk.start();

const tracer = trace.getTracer('ai-demo', '1.0.0');

// ── 2. 模拟一次 AI 问答的完整 trace ──────────────────────────────────
async function handleUserQuestion(question) {
  return tracer.startActiveSpan('handle_question', async (rootSpan) => {
    rootSpan.setAttribute('user.question', question);
    rootSpan.setAttribute('session.id', 'sess_abc123');

    try {
      // 步骤 A：查缓存
      const cached = await tracer.startActiveSpan('cache.lookup', async (span) => {
        span.setAttribute('cache.key', `qa:${question}`);
        await sleep(30);
        const hit = false;
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
        span.setAttribute('llm.input_tokens', question.length * 2);
        await sleep(800);
        const response = `关于"${question}"：这是一个模拟回答。`;
        span.setAttribute('llm.output_tokens', response.length);
        span.setAttribute('llm.cost_usd', 0.0012);
        span.end();
        return response;
      });

      // 步骤 C：写缓存
      await tracer.startActiveSpan('cache.write', async (span) => {
        span.setAttribute('cache.key', `qa:${question}`);
        span.setAttribute('cache.ttl', 3600);
        await sleep(10);
        span.end();
      });

      rootSpan.setAttribute('response.source', 'llm');
      rootSpan.setStatus({ code: SpanStatusCode.OK });
      rootSpan.end();
      return llmResponse;

    } catch (err) {
      rootSpan.recordException(err);
      rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      rootSpan.end();
      throw err;
    }
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── 3. traceparent 头 ─────────────────────────────────────────────────
// 当你的服务 A 调服务 B 时，怎么让两边 span 串成同一条 trace？
// 答案：HTTP 请求里带上 traceparent 头
function showTraceparent() {
  console.log('\n=== traceparent 头 ===');
  const example = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  console.log(`traceparent: ${example}`);
  console.log('  00         = 版本（固定）');
  console.log('  4bf9...4736 = trace-id（32位hex，整条链路唯一）');
  console.log('  00f0...02b7 = parent-span-id（16位hex，上游 span ID）');
  console.log('  01          = 采样标记（01=采样，00=不采样）');
}

// ── 4. 主流程 ─────────────────────────────────────────────────────────
async function main() {
  console.log('=== OTel 埋点演示 ===\n');

  const answer = await handleUserQuestion('什么是对象池？');
  console.log('最终回答:', answer);

  showTraceparent();

  await sleep(1000); // 等 SDK flush
  await sdk.shutdown();
  console.log('\nSDK 已关闭');
}

main().catch(console.error);
