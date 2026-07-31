/**
 * LLM 专属埋点演示
 *
 * 通用 OTel 埋点 vs LLM 专属埋点：
 *
 * 通用：span.setAttribute('llm.model', 'xxx')  → 只是普通字符串属性
 * LLM 专属：遵循 GenAI Semantic Conventions，让 Langfuse 等平台自动识别
 *
 * Langfuse 的数据模型（比 OTel Span 更贴合 AI 场景）：
 *
 *   Trace
 *   └── Observation（可以是下面任意一种）
 *        ├── Generation  = 一次 LLM 调用（prompt → completion）
 *        ├── Span        = 一个业务步骤（和 OTel Span 同名但结构不同）
 *        └── Event       = 一个事件点（无耗时）
 *
 * Generation 必填字段：
 *   - name: 'gpt-4' 或 'chat-completion'
 *   - model: 'claude-sonnet-4-6'
 *   - input: 完整 prompt（包括 system prompt + user message）
 *   - output: 完整 completion
 *   - usage: { promptTokens, completionTokens, totalTokens }
 *   - costDetails: { input, output, total } (USD)
 *
 * 本文件演示 Langfuse SDK 的 Generation 埋点（需要 langfuse 账号的 key）
 * 如果你没有 Langfuse 账号，看代码结构理解即可。
 */

// ═══════════════════════════════════════════════════════════════════════
// Langfuse SDK 方式（需要 PUBLIC_KEY + SECRET_KEY）
// ═══════════════════════════════════════════════════════════════════════

/*
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: 'https://cloud.langfuse.com', // 或用自建的
});

// 创建一个 Trace（对应一次用户请求）
const trace = langfuse.trace({
  name: 'user-chat',
  userId: 'user_123',
  sessionId: 'sess_abc',
  metadata: { source: 'web' },
});

// 在 Trace 下创建一个 Generation（对应一次 LLM 调用）
const generation = trace.generation({
  name: 'chat-completion',
  model: 'claude-sonnet-4-6',
  input: [
    { role: 'system', content: '你是一个助手' },
    { role: 'user', content: '今天天气怎么样？' },
  ],
  // output 在 LLM 返回后设置
});

// 模拟 LLM 返回
const completion = { role: 'assistant', content: '今天晴天，28°C' };
generation.end({
  output: completion,
  usage: {
    promptTokens: 45,
    completionTokens: 12,
    totalTokens: 57,
  },
  costDetails: {
    input: 0.0002,   // $0.0002
    output: 0.00005,  // $0.00005
    total: 0.00025,
  },
});
*/

// ═══════════════════════════════════════════════════════════════════════
// OTel 方式（用 GenAI Semantic Conventions，Langfuse 也能识别）
// ═══════════════════════════════════════════════════════════════════════

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const sdk = new NodeSDK({ traceExporter: new ConsoleSpanExporter() });
sdk.start();

const tracer = trace.getTracer('llm-demo');

// GenAI Semantic Conventions 定义的属性名
const GenAIAttributes = {
  SYSTEM: 'gen_ai.system',                    // 'anthropic' | 'openai'
  REQUEST_MODEL: 'gen_ai.request.model',      // 模型名
  REQUEST_MAX_TOKENS: 'gen_ai.request.max_tokens',
  REQUEST_TEMPERATURE: 'gen_ai.request.temperature',
  USAGE_INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  USAGE_OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',
  RESPONSE_ID: 'gen_ai.response.id',
  RESPONSE_FINISH_REASON: 'gen_ai.response.finish_reason',  // 'stop' | 'tool_calls'
};

async function llmCall(prompt) {
  return tracer.startActiveSpan('chat completions', async (span) => {
    // 用 GenAI 标准属性名 → Langfuse/Jaeger 能自动识别这是 LLM 调用
    span.setAttribute(GenAIAttributes.SYSTEM, 'anthropic');
    span.setAttribute(GenAIAttributes.REQUEST_MODEL, 'claude-sonnet-4-6');
    span.setAttribute(GenAIAttributes.REQUEST_MAX_TOKENS, 4096);
    span.setAttribute(GenAIAttributes.REQUEST_TEMPERATURE, 0.7);

    // 记录 prompt（生产环境可能要截断，prompt 可能很长）
    span.setAttribute('llm.prompt', prompt);

    // 模拟 LLM 调用
    await sleep(500);
    const response = `这是 "${prompt}" 的模拟回答`;

    span.setAttribute(GenAIAttributes.USAGE_INPUT_TOKENS, prompt.length * 2);
    span.setAttribute(GenAIAttributes.USAGE_OUTPUT_TOKENS, response.length);
    span.setAttribute(GenAIAttributes.RESPONSE_FINISH_REASON, 'stop');
    span.setAttribute('llm.completion', response);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return response;
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== LLM 专属埋点（GenAI Semantic Conventions）===\n');

  const answer = await llmCall('什么是 Trace？');
  console.log('LLM 回答:', answer);

  console.log('\n✅ 注意 span 属性中 gen_ai.* 前缀的标准字段');
  console.log('这些字段会被 Langfuse/Galileo 自动识别为 LLM 调用');

  await sleep(1000);
  await sdk.shutdown();
}

main().catch(console.error);
