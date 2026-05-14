// ============================================================
// 簇 1 Demo 2：带 id 字段的 SSE，支持 Last-Event-ID 断点续传
// 学习目标：理解 SSE 重连机制 + 浏览器自动带 Last-Event-ID 头
// 运行：  node server.js
// 访问：  http://localhost:3000
//
// 验证步骤：
//   1. 启动后打开浏览器，等到收到 hello 5、hello 6 后
//   2. 在终端 Ctrl+C 杀掉服务
//   3. 立刻重新 npm start
//   4. 浏览器会自动重连，应从 hello 7 开始（不会回到 1）
//   5. 看终端打印：[SSE] 客户端带 Last-Event-ID = 6 重连，从 id=7 续推
// ============================================================

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// 模拟一个"全局事件流"——服务端任意时刻的当前 id（用进程内变量近似真实场景里的 DB/MQ）
// 注意：真实生产里 id 通常来自数据库自增 / Kafka offset 等，不是这种 setInterval 累加
let globalId = 0;
setInterval(() => { globalId += 1; }, 1000); // 每秒生产一个新事件

app.get('/events', (req, res) => {
  // 三件套响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // ★核心新增：读浏览器自动带上的 Last-Event-ID 头
  // 注意 Express 里 header 名都是小写
  const lastEventId = parseInt(req.headers['last-event-id'] || '0', 10);
  // 续推起点 = 客户端最后收到的 id + 1
  let cursor = lastEventId + 1;

  if (lastEventId > 0) {
    console.log(`[SSE] 客户端带 Last-Event-ID = ${lastEventId} 重连，从 id=${cursor} 续推`);
  } else {
    console.log(`[SSE] 新客户端连上，从 id=${cursor} 开始推`);
  }

  // 每秒检查：globalId 推进到哪了？把客户端落后的部分一次性补上
  const timer = setInterval(() => {
    while (cursor <= globalId) {
      // ★关键：带 id 字段 —— 浏览器收到后会自动记住这个值，重连时回传
      res.write(`id: ${cursor}\n`);
      res.write(`data: hello ${cursor}\n\n`);
      console.log(`[SSE] 推送 id=${cursor}`);
      cursor += 1;
    }
  }, 200); // 200ms 检查一次，让"补推"更迅速

  req.on('close', () => {
    clearInterval(timer);
    console.log('[SSE] 客户端断开');
  });
});

app.listen(3000, () => {
  console.log('服务已启动 → http://localhost:3000');
  console.log('提示：globalId 全局共享，杀掉服务并不会让它清零（除非你重启 node）');
});
