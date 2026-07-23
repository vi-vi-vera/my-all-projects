/**
 * 演示：Tool use 4 步流程（纯模拟版，不需要 API key）
 *
 * 真实情况下，步骤 1/2/4 是模型自己做的
 * 步骤 3 是你（宿主程序）做的
 * 这里我们手动走一遍，理解数据结构
 */

// ── 你定义的工具列表（告诉模型"你有什么工具可以用"）───────────────
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

// ── 步骤 1：用户发消息，模型"看到"工具列表 ──────────────────────────
console.log('=== 步骤 1：用户发消息 ===');
const userMessage = '北京今天天气怎么样？';
console.log(`用户: ${userMessage}\n`);
console.log('（模型拿到工具列表，判断需要调 get_weather）\n');

// ── 步骤 2：模型返回"工具调用请求"，不是文字回答 ────────────────────
console.log('=== 步骤 2：模型输出工具调用请求 ===');
// 这是模型实际返回的数据结构（stop_reason = "tool_use"）
const modelResponse = {
  stop_reason: 'tool_use',  // 关键！不是 "end_turn"，说明还没完
  content: [
    {
      type: 'tool_use',
      id: 'toolu_01ABC123',          // 这次调用的唯一 ID
      name: 'get_weather',           // 调哪个工具
      input: { city: '北京' },       // 参数
    },
  ],
};
console.log('模型返回:', JSON.stringify(modelResponse, null, 2), '\n');

// ── 步骤 3：你（宿主程序）真正去执行工具 ────────────────────────────
console.log('=== 步骤 3：宿主程序执行工具 ===');

// 真实场景：这里可能是调天气 API、查数据库、读文件...
function get_weather({ city }) {
  // 模拟一个假的天气结果
  return { city, temp: 28, condition: '晴', humidity: '45%' };
}

const toolUseBlock = modelResponse.content[0];
const toolResult = get_weather(toolUseBlock.input);
console.log(`调用 ${toolUseBlock.name}(${JSON.stringify(toolUseBlock.input)})`);
console.log(`结果:`, toolResult, '\n');

// ── 步骤 4：把工具结果还给模型，模型生成最终回答 ─────────────────────
console.log('=== 步骤 4：把结果塞回给模型 ===');

// 下一轮对话要带上这些内容（工具调用 + 工具结果）
const nextMessages = [
  { role: 'user', content: userMessage },
  { role: 'assistant', content: modelResponse.content },  // 步骤 2 的内容
  {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolUseBlock.id,   // 对应步骤 2 的 id
        content: JSON.stringify(toolResult),
      },
    ],
  },
];

console.log('发给模型的完整消息链:');
nextMessages.forEach((m, i) => {
  const content = typeof m.content === 'string'
    ? m.content
    : JSON.stringify(m.content);
  console.log(`  [${i}] role=${m.role}: ${content.slice(0, 80)}...`);
});

console.log('\n（模型收到天气数据后，生成："北京今天晴，28°C，湿度45%，适合出门！"）');

console.log('\n=== 关键点总结 ===');
console.log('1. stop_reason="tool_use" 表示模型还没说完，等你执行工具');
console.log('2. tool_use_id 要对应，把结果交还给正确的调用');
console.log('3. 工具结果用 role=user + type=tool_result 格式传回');
console.log('4. 可能多轮：模型可以连续调多个工具再给最终回答');
