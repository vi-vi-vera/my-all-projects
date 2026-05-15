// ============================================================
// 中间件 2：logger
// 作用：打访问日志，含 method/url/status/耗时/requestId
// 学习要点：洋葱模型的"出口"逻辑——监听 res.on('finish') 在响应结束后打日志
// ============================================================
export function logger() {
  return (req, res, next) => {
    const start = Date.now();

    // 'finish' 事件：当响应头和 body 都发完时触发（不论成功还是异常）
    // 这就是"洋葱模型出口"——next() 之后的代码不能直接写在这里，因为 next() 是同步返回的，
    // 那时候 handler 可能还没结束（异步），所以用事件回调
    res.on('finish', () => {
      const ms = Date.now() - start;
      const id = req.id || '-';
      console.log(
        `[${new Date().toISOString()}] ${id} ${req.method} ${req.url} → ${res.statusCode} ${ms}ms`
      );
    });

    // 'close' 事件：客户端中途断开（SSE 长连接最常见）
    res.on('close', () => {
      if (!res.writableEnded) {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.id} ${req.method} ${req.url} ✗ CLIENT_ABORTED after ${ms}ms`);
      }
    });

    next();
  };
}
