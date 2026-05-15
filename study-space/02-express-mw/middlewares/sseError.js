// ============================================================
// 中间件 5：SSE 专用错误处理器（4 参签名！）
// 作用：捕获 SSE 端点链路里抛出的错误，按 SSE 协议格式返回
//
// ★Express 错误中间件必须是 4 参数 (err, req, res, next)
//   少一个参数 Express 就不当成错误中间件，照常按普通中间件路由
//
// 学习要点：
//   - 如果响应头还没发：可以正常 res.status(401).json() —— 但这只对非 SSE 端点
//   - 如果是 SSE 端点：要先 flushHeaders（如果还没 flush），再 event: error\ndata:...\n\n，最后 res.end()
//   - 千万不要在 SSE 端点上调用 res.status() 改状态码——头已经发出去了，会报 ERR_HTTP_HEADERS_SENT
// ============================================================

// 普通 JSON 错误（非 SSE 端点用）
export function jsonErrorHandler() {
  return (err, req, res, next) => {
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[ERR] ${req.id} ${code}: ${err.message}`);
    if (res.headersSent) {
      return next(err); // 响应头已发，交给 Express 默认处理（关连接）
    }
    res.status(status).json({
      ok: false,
      code,
      message: err.message,
      requestId: req.id,
    });
  };
}

// SSE 专用错误处理（按 SSE 协议发完后主动 end）
export function sseErrorHandler() {
  return (err, req, res, next) => {
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[SSE-ERR] ${req.id} ${code}: ${err.message}`);

    // 如果响应头还没发出去，需要先发 SSE 三件套——但这种场景下我们其实
    // 可以选择降级为普通 JSON 错误（因为流还没开始，浏览器还没切到流式解析）。
    // 这里按"客户端是 EventSource"假设：补三件套头后按 SSE 协议发错误。
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    // 按 SSE 协议格式：event: error\ndata: {...}\n\n
    const payload = {
      ok: false,
      code,
      message: err.message,
      requestId: req.id,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    };
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);

    // ★主动 end()——告诉浏览器"这次流真的结束了"。
    // 不 end 的话浏览器会一直等下一条数据，连接挂着浪费资源。
    res.end();
  };
}
