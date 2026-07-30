/**
 * 演示：Tool use 4 步流程（纯模拟版，不需要 API key）
 */

// ── 第一步：定义工具列表 ──────────────────────────────────────────────
const tools = [
  {
    name: 'get_weather',
    description: '查询某个城市的天气',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名，如"北京"' },
      },
      required: ['city'],
    },
  },
  {
    name: 'search_web',
    description: '搜索互联网',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
      },
      required: ['query'],
    },
  },
];

// ── 第二步：模拟 LLM 返回 tool_use ─────────────────────────────────────
console.log('=== 用户发消息 ===');
const userMessage = '北京今天天气怎么样？';
console.log(`用户: ${userMessage}\n`);

// LLM 不直接回答，而是返回"我要调这个工具"
const modelResponse = {
  stop_reason: 'tool_use',       // 不是 'end_turn'，说明还没说完
  content: [
    {
      type: 'tool_use',
      id: 'toolu_01ABC123',      // 这次调用的唯一 ID
      name: 'get_weather',       // 调哪个工具
      input: { city: '北京' },   // LLM 从用户消息里提取的参数
    },
  ],
};

console.log('LLM 返回:');
console.log(`  stop_reason = "${modelResponse.stop_reason}"`);
console.log(`  type       = "${modelResponse.content[0].type}"`);
console.log(`  id         = "${modelResponse.content[0].id}"`);
console.log(`  name       = "${modelResponse.content[0].name}"`);
console.log(`  input      = ${JSON.stringify(modelResponse.content[0].input)}`);
console.log();

// ── 第三步：宿主程序真正执行工具 ───────────────────────────────────────
console.log('=== 宿主程序执行工具 ===');

// 你的真实工具实现（查数据库、调 API、读文件...）
function get_weather({ city }) {
  // 模拟返回天气数据
  return { city, temp: 28, condition: '晴', humidity: '45%' };
}

const toolBlock = modelResponse.content[0];
const toolResult = get_weather(toolBlock.input);
console.log(`调用 ${toolBlock.name}(${JSON.stringify(toolBlock.input)})`);
console.log(`返回: ${JSON.stringify(toolResult)}`);
console.log();

// ── 第四步：把工具结果塞回 LLM ─────────────────────────────────────────
console.log('=== 把结果塞回给 LLM ===');

const nextMessages = [
  { role: 'user', content: userMessage },                        // 1. 原始用户消息
  { role: 'assistant', content: modelResponse.content },         // 2. LLM 的工具调用
  {
    role: 'user',                                                // 3. 工具执行结果
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolBlock.id,                               // 必须对上！
        content: JSON.stringify(toolResult),
      },
    ],
  },
];

nextMessages.forEach((m, i) => {
  const label = ['用户消息', 'LLM 工具调用', '工具结果'][i];
  console.log(`[${i}] ${label}: role=${m.role}`);
});

console.log('\n（LLM 收到天气数据后，生成最终回复："北京今天晴，28°C，适合出门！"）');
console.log('\n=== 4 步总结 ===');
console.log('1. 用户消息 + 工具列表 → 发给 LLM');
console.log('2. LLM 返回 stop_reason="tool_use" + 工具名和参数');
console.log('3. 宿主程序执行工具，拿到结果');
console.log('4. 结果用 tool_result 格式 + tool_use_id 塞回 LLM');
console.log('5. LLM 基于结果生成最终回答（stop_reason="end_turn"）');
