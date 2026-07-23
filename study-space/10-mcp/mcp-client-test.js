/**
 * MCP 客户端测试脚本
 * 模拟 Claude Desktop 的行为：spawn server 进程，发 JSON-RPC 消息
 *
 * 运行方式：node mcp-client-test.js
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 1. 创建客户端，指定要 spawn 的 server 程序 ───────────────────────
const client = new Client(
  { name: 'test-client', version: '0.1.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: [join(__dirname, 'mcp-server.js')],
});

// ── 2. 连接 ──────────────────────────────────────────────────────────
console.log('连接 MCP Server...');
await client.connect(transport);
console.log('✅ 已连接\n');

// ── 3. 列出所有工具 ──────────────────────────────────────────────────
console.log('=== 问 Server：你有哪些工具？ ===');
const { tools } = await client.listTools();
tools.forEach(t => {
  console.log(`  工具: ${t.name} — ${t.description}`);
});
console.log();

// ── 4. 调用 get_weather ──────────────────────────────────────────────
console.log('=== 调用 get_weather(上海) ===');
const weatherResult = await client.callTool({
  name: 'get_weather',
  arguments: { city: '上海' },
});
console.log('结果:', weatherResult.content[0].text);
console.log();

// ── 5. 调用 calc ─────────────────────────────────────────────────────
console.log('=== 调用 calc(100 + 200) ===');
const calcResult = await client.callTool({
  name: 'calc',
  arguments: { a: 100, b: 200 },
});
console.log('结果:', calcResult.content[0].text);
console.log();

// ── 6. 调用不存在的工具，看错误处理 ──────────────────────────────────
console.log('=== 调用不存在的工具 delete_database ===');
const errResult = await client.callTool({
  name: 'delete_database',
  arguments: {},
});
console.log('结果:', errResult.content[0].text, '| isError:', errResult.isError);

// ── 7. 断开连接 ──────────────────────────────────────────────────────
await client.close();
console.log('\n✅ 测试完成，连接已关闭');
