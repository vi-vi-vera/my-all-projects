// ============================================================
// 中间件 3：auth
// 作用：校验 ?token=xxx，挂载 req.user
// 学习要点：
//   1. SSE 端点不能用 Authorization 头（浏览器原生 EventSource 不支持自定义头）
//      所以这里演示用 query 参数；生产里可用 cookie 或 fetch-event-source 库
//   2. 鉴权失败时——是 SSE 端点还是普通端点？两种返回格式完全不同！见 server.js 中的策略
// ============================================================
const FAKE_USERS = {
  'token-alice': { id: 'u1', name: 'Alice' },
  'token-bob':   { id: 'u2', name: 'Bob' },
};

export function auth() {
  return (req, res, next) => {
    const token = req.query.token;
    if (!token) {
      // 调用 next(err) 把错误抛给后续的错误中间件
      // ★关键：不要在这里直接 res.json()，因为我们不知道这是不是 SSE 端点
      const err = new Error('Missing token');
      err.code = 'UNAUTHORIZED';
      err.status = 401;
      return next(err);
    }

    const user = FAKE_USERS[token];
    if (!user) {
      const err = new Error('Invalid token');
      err.code = 'INVALID_TOKEN';
      err.status = 401;
      return next(err);
    }

    req.user = user;
    next();
  };
}
