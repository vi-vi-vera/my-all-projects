// ============================================================
// 中间件 1：requestId
// 作用：给每个请求生成唯一 ID，挂到 req 上，并作为响应头 X-Request-Id 返回
// 学习要点：中间件的 3 参数签名 (req, res, next)；req 是"贯穿请求生命周期的口袋"，往上挂东西后面所有中间件都能拿到
// ============================================================
import { randomUUID } from 'node:crypto';

export function requestId() {
  // 返回的才是真正的中间件函数；外层套一层"工厂"是为了将来可以传配置（虽然这个简单 middleware 不需要）
  return (req, res, next) => {
    // 允许客户端透传自己的 trace id（典型场景：网关已经分配过，要保持链路一致）
    const id = req.headers['x-request-id'] || randomUUID();
    req.id = id;                       // 挂到 req，后续中间件用 req.id 即可
    res.setHeader('X-Request-Id', id); // 回传给客户端，方便排查
    next();                            // ★必须调，否则请求会卡死在这层
  };
}
