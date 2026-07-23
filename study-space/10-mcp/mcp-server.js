/**
 * 一个最简单的 MCP Server
 *
 * MCP = Model Context Protocol，AI 调工具的"标准插头"
 * 这个 server 提供两个工具：
 *   - get_weather：查城市天气（假数据）
 *   - calc：做简单加法
 *
 * 跑起来后可以被 Claude Desktop / Cursor / 任何 MCP 客户端连接
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── 1. 创建 MCP Server ────────────────────────────────────────────────
const server = new Server(
  {
    name: 'study-demo-server',  // server 名字
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},  // 声明"我支持工具调用"
    },
  }
);

// ── 2. 注册"列出工具"的处理器 ─────────────────────────────────────────
// 客户端问"你有哪些工具？"时，这里返回
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: '查询某个城市当前天气',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: '城市名，例如：北京、上海',
            },
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

// ── 3. 注册"执行工具"的处理器 ─────────────────────────────────────────
// 客户端说"帮我调 get_weather，city=北京"时，这里执行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_weather') {
    const { city } = args;
    // 真实场景这里调天气 API，现在用假数据
    const weather = {
      city,
      temp: Math.floor(20 + Math.random() * 15),
      condition: ['晴', '多云', '小雨'][Math.floor(Math.random() * 3)],
    };
    return {
      content: [
        {
          type: 'text',
          text: `${city}天气：${weather.condition}，${weather.temp}°C`,
        },
      ],
    };
  }

  if (name === 'calc') {
    const { a, b } = args;
    return {
      content: [
        {
          type: 'text',
          text: `${a} + ${b} = ${a + b}`,
        },
      ],
    };
  }

  // 未知工具：返回错误（而不是抛异常，这样客户端能优雅处理）
  return {
    content: [{ type: 'text', text: `未知工具: ${name}` }],
    isError: true,
  };
});

// ── 4. 启动，使用 stdio 通信 ──────────────────────────────────────────
// stdio = 标准输入/输出，是 MCP 最常用的传输方式
// 客户端会 spawn 这个进程，通过 stdin/stdout 发 JSON-RPC 消息
const transport = new StdioServerTransport();
await server.connect(transport);

// 注意：不要 console.log，stdout 是给 MCP 客户端用的！
// 要调试就写到 stderr
process.stderr.write('MCP Server 已启动，等待客户端连接...\n');
