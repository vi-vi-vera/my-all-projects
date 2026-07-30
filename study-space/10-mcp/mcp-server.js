/**
 * MCP Server 示例
 * 提供两个工具：get_weather（查天气）、calc（加法）
 *
 * 传输方式：stdio（标准输入/输出）
 * 客户端 spawn 这个进程，通过 stdin/stdout 发 JSON-RPC 消息
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── 1. 创建 MCP Server ────────────────────────────────────────────────
const server = new Server(
  { name: 'study-demo-server', version: '0.1.0' },
  { capabilities: { tools: {} } }  // 声明：我支持工具调用
);

// ── 2. 注册 ListTools：告诉客户端"我有哪些工具" ──────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: '查询某个城市的当前天气',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: '城市名，如"北京"' },
          },
          required: ['city'],
        },
      },
      {
        name: 'calc',
        description: '做两个数字的加法',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: '第一个数' },
            b: { type: 'number', description: '第二个数' },
          },
          required: ['a', 'b'],
        },
      },
    ],
  };
});

// ── 3. 注册 CallTool：真正执行工具 ────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_weather') {
    const weather = {
      city: args.city,
      temp: Math.floor(20 + Math.random() * 15),
      condition: ['晴', '多云', '小雨'][Math.floor(Math.random() * 3)],
    };
    return {
      content: [{ type: 'text', text: `${weather.city}天气：${weather.condition}，${weather.temp}°C` }],
    };
  }

  if (name === 'calc') {
    return {
      content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }],
    };
  }

  // 未知工具：不抛异常，用 isError 标记
  return {
    content: [{ type: 'text', text: `未知工具: ${name}` }],
    isError: true,
  };
});

// ── 4. 启动，通过 stdio 与客户端通信 ──────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

// 注意：stdout 归 MCP 协议用，调试信息必须写 stderr！
process.stderr.write('MCP Server 已启动\n');
