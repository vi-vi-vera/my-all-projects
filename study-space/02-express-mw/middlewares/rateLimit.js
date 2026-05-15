// ============================================================
// 中间件 4：rateLimit
// 作用：同一个用户 10 秒内最多 N 次请求；超了走 RATE_LIMITED 错误
// 学习要点：
//   1. 演示中间件的"配置化"——工厂函数接受 { windowMs, max } 让调用方决定策略
//   2. 真实生产用 Redis（簇 7 会讲）；这里用内存 Map 仅作演示
// ============================================================
export function rateLimit({ windowMs = 10_000, max = 3 } = {}) {
  // 闭包里存计数：key = userId 或 IP，value = [timestamps]
  const hits = new Map();

  return (req, res, next) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);

    if (arr.length > max) {
      const err = new Error(`Rate limit exceeded: ${arr.length}/${max} in ${windowMs}ms`);
      err.code = 'RATE_LIMITED';
      err.status = 429;
      err.retryAfter = Math.ceil(windowMs / 1000);
      return next(err);
    }
    next();
  };
}
