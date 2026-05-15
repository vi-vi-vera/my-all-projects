// ============================================================
// 簇 2 主服务：把所有中间件串成洋葱模型
// 运行：  node server.js
// 访问：  http://localhost:3001
//
// 测试场景（前端有按钮可一键触发）：
//   1. token-alice → 正常流，每秒收到一条 hello N
//   2. token-bob   → 同上（验证多用户独立计数）
//   3. （无 token） → 收到 event:error data:{code:UNAUTHORIZED}
//   4. token-wrong → 收到 event:error data:{code:INVALID_TOKEN}
//   5. 连续点 4 次同 token → 第 4 次收到 event:error data:{code:RATE_LIMITED}
// ============================================================

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

import { requestId }         from './middlewares/requestId.js';
import { logger }            from './middlewares/logger.js';
import { auth }              from './middlewares/auth.js';
import { rateLimit }         from './middlewares/rateLimit.js';
import { jsonErrorHandler, sseErrorHandler } from './middlewares/sseError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// === 全局中间件：每个请求都过 ===
app.use(requestId());
app.use(logger());
app.use(express.static(path.join(__dirname, 'public')));

// === 普通 JSON 端点：演示统一错误格式 ===
// 这里 auth 失败会通过 next(err) 抛给 jsonErrorHandler
app.get('/api/profile', auth(), (req, res) => {
  res.json({ ok: true, user: req.user });
});

// === SSE 端点：洋葱模型 ===
// 注意中间件顺序：requestId → logger（全局）→ auth → rateLimit → 业务 → sseErrorHandler
//   - auth 在前：未登录的请求不该消耗 rateLimit 配额
//   - rateLimit 在后：基于已登录用户做限流（req.user.id）
app.get(
  '/events',
  auth(),
  rateLimit({ windowMs: 10_000, max: 3 }), // 同用户 10 秒最多 3 次
  (req, res, next) => {
    // SSE 三件套（与簇 1 一致）
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log(`[SSE] ${req.id} ${req.user.name} 已连接`);

    // 业务：每秒推一条
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      try {
        res.write(`id: ${n}\n`);
        res.write(`data: ${JSON.stringify({ user: req.user.name, n })}\n\n`);
      } catch (e) {
        // 万一 write 失败（连接已断），交给错误处理器
        clearInterval(timer);
        return next(e);
      }
    }, 1000);

    // 心跳：每 25 秒发一条 SSE 注释行（":" 开头），保活反代/防火墙
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 25_000);

    // 主动 5 秒后注入一次错误——演示"流中途出错"如何让错误中间件接管
    // （生产代码不会主动抛错，这里只是教学。把这段注释掉就是正常流。）
    // setTimeout(() => {
    //   clearInterval(timer); clearInterval(heartbeat);
    //   const err = new Error('Simulated server failure');
    //   err.code = 'SERVER_ERROR';
    //   next(err);
    // }, 5000);

    req.on('close', () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    });
  },
  // ★这条路由专用的 SSE 错误处理器（4 参！）
  sseErrorHandler()
);

// === 全局兜底：JSON 错误处理器（4 参！必须放最后） ===
app.use(jsonErrorHandler());

app.listen(3001, () => {
  console.log('服务已启动 → http://localhost:3001');
  console.log('试试：');
  console.log('  http://localhost:3001/events?token=token-alice  (正常)');
  console.log('  http://localhost:3001/events                    (无 token → error)');
  console.log('  http://localhost:3001/events?token=token-wrong  (错 token → error)');
  console.log('  http://localhost:3001/api/profile?token=token-alice  (普通 JSON 端点)');
});
