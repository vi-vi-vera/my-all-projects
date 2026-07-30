/**
 * MCP 客户端测试
 * 模拟 Claude Desktop 的行为：spawn mcp-server.js，通过 stdio 发 JSON-RPC
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. 创建客户端
const client = new Client(
  { name: 'test-client', version: '0.1.0' },
  { capabilities: {} }
);

// 2. 指定要 spawn 的 server 进程
const transport = new StdioClientTransport({
  command: 'node',
  args: [join(__dirname, 'mcp-server.js')],
});

// 3. 连接
console.log('连接 MCP Server...');
await client.connect(transport);
console.log('✅ 已连接\n');

// 4. 列出工具
console.log('=== ListTools ===');
const { tools } = await client.listTools();
tools.forEach(t => console.log(`  ${t.name}: ${t.description}`));
console.log();

// 5. 调用 get_weather
console.log('=== CallTool: get_weather(上海) ===');
const w = await client.callTool({ name: 'get_weather', arguments: { city: '上海' } });
console.log('结果:', w.content[0].text);
console.log();

// 6. 调用 calc
console.log('=== CallTool: calc(100, 200) ===');
const c = await client.callTool({ name: 'calc', arguments: { a: 100, b: 200 } });
console.log('结果:', c.content[0].text);
console.log();

// 7. 未知工具 → 看 isError
console.log('=== CallTool: delete_database ===');
const err = await client.callTool({ name: 'delete_database', arguments: {} });
console.log('结果:', err.content[0].text, '| isError:', err.isError);

// 8. 断开
await client.close();
console.log('\n✅ 测试完成');
