/**
 * 采样策略演示
 *
 * 生产环境不能 100% 采样（数据量太大，存储贵），需要选择性地记录。
 * OTel 支持多种采样器，可以组合使用。
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  AlwaysOnSampler,
  AlwaysOffSampler,
} = require('@opentelemetry/sdk-trace-base');

// ═══════════════════════════════════════════════════════════════════════
// 策略 1：始终采样（开发/测试环境）
// ═══════════════════════════════════════════════════════════════════════
function alwaysOn() {
  return new AlwaysOnSampler();
  // 结果：100% 采样，所有 trace 都记录
  // 场景：本地开发、压测
}

// ═══════════════════════════════════════════════════════════════════════
// 策略 2：按比例采样（生产环境常用）
// ═══════════════════════════════════════════════════════════════════════
function ratioBased() {
  return new TraceIdRatioBasedSampler(0.1);
  // 结果：约 10% 的 trace 被采样
  // 原理：对 traceId 做哈希，落在 [0, 0.1) 区间的才采样
  // 好处：同一 traceId 的所有 span 要么全采要么全不采，不会出现半截 trace
  // 场景：生产环境，控制成本
}

// ═══════════════════════════════════════════════════════════════════════
// 策略 3：ParentBased（微服务场景最常用）
// ═══════════════════════════════════════════════════════════════════════
function parentBased() {
  return new ParentBasedSampler({
    // 没有父 Span（即根 Span）时，用比例采样
    root: new TraceIdRatioBasedSampler(0.1),
  });
  // 结果：
  //   - 根 Span 按 10% 采样
  //   - 如果根 Span 被采样了，所有子 Span 自动采样（保持 trace 完整）
  //   - 如果根 Span 没被采样，所有子 Span 也不采样
  // 场景：微服务，保证同一条 trace 在多个服务间采样决策一致
}

// ═══════════════════════════════════════════════════════════════════════
// 策略 4：按错误采样（tail-based sampling）
// ═══════════════════════════════════════════════════════════════════════
// 注意：OTel SDK 不支持真正的 tail-based sampling（需要 collector 层面实现）
// 思路：先缓存所有 trace，等 trace 结束后再决定是否采样
// 规则：出错的 trace 100% 采样，正常的 trace 1% 采样
// 好处：不丢失任何错误信息，又控制了正常请求的数据量
// 工具：OTel Collector 的 tail_sampling processor

// ═══════════════════════════════════════════════════════════════════════
// 演示：运行两种策略对比
// ═══════════════════════════════════════════════════════════════════════

async function demo() {
  console.log('=== 采样策略对比 ===\n');

  // 方案 A：100% 采样
  console.log('【方案A】AlwaysOnSampler — 开发环境');
  const sdkA = new NodeSDK({
    sampler: alwaysOn(),
    traceExporter: new ConsoleSpanExporter(),
  });
  sdkA.start();
  const tracerA = require('@opentelemetry/api').trace.getTracer('demo-a');
  await runTrace(tracerA, 'always-on');
  await sdkA.shutdown();

  await sleep(500);

  // 方案 B：10% 采样
  console.log('\n【方案B】TraceIdRatioBasedSampler(0.1) — 生产环境');
  console.log('（注意：只有约 10% 的 trace 会出现在控制台）');
  const sdkB = new NodeSDK({
    sampler: ratioBased(),
    traceExporter: new ConsoleSpanExporter(),
  });
  sdkB.start();
  const tracerB = require('@opentelemetry/api').trace.getTracer('demo-b');
  // 跑 10 次，看哪些被采样
  let sampled = 0;
  for (let i = 0; i < 10; i++) {
    await runTrace(tracerB, `request-${i + 1}`);
    sampled++;
  }
  console.log(`实际导出: ${sampled} 次（ConsoleSpanExporter 只导出被采样的 span）`);
  await sdkB.shutdown();

  console.log('\n=== 总结 ===');
  console.log('1. AlwaysOn: 全量，开发用');
  console.log('2. RatioBased(0.1): 10%，生产控制成本');
  console.log('3. ParentBased: 保证同一条 trace 采样一致，微服务必备');
  console.log('4. Tail-based: 错误全采 + 正常少量，collector 层面实现');
}

async function runTrace(tracer, name) {
  return tracer.startActiveSpan(name, async (span) => {
    await sleep(50);
    span.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

demo().catch(console.error);
