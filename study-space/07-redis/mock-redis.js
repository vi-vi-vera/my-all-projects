/**
 * Mock Redis — 纯内存实现，无需 Docker / Redis 服务
 * 实现 server.js 用到的所有 ioredis API：
 *   get / set / setex / del / set(key, val, 'NX', 'EX', ttl) / ping
 * 支持 TTL 过期（定时器清理）
 */

class MockRedis {
  constructor() {
    this.data = new Map();       // key → { value, expireAt? }
    this.timer = setInterval(() => this._cleanup(), 1000);
  }

  /** 清理过期 key */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.data) {
      if (entry.expireAt && entry.expireAt < now) {
        this.data.delete(key);
      }
    }
  }

  /** GET key → String 或 null */
  async get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expireAt && entry.expireAt < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  /** SET key value（覆盖，清除 TTL） */
  async set(key, value, mode, duration) {
    // 兼容 ioredis 的两种写法：
    //   set(key, val, 'NX', 'EX', ttl)
    //   set(key, val)  ← 普通覆盖
    if (mode === 'NX') {
      // 只有 key 不存在才能设置（互斥锁语义）
      if (this.data.has(key)) return null;   // ioredis: NX 失败返回 null
      const ttlMs = (Number(duration) || 0) * 1000;
      this.data.set(key, {
        value,
        expireAt: ttlMs ? Date.now() + ttlMs : undefined,
      });
      return 'OK';
    }
    // 普通 SET（覆盖，清除 TTL）
    this.data.set(key, { value, expireAt: undefined });
    return 'OK';
  }

  /** SETEX key ttl value */
  async setex(key, ttl, value) {
    const ttlMs = (Number(ttl) || 0) * 1000;
    this.data.set(key, {
      value: String(value),
      expireAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
    return 'OK';
  }

  /** DEL key [key ...] */
  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.data.delete(key)) count++;
    }
    return count;
  }

  /** PING（ioredis 内部会调用） */
  async ping() {
    return 'PONG';
  }

  /** 断开"连接"（Mock 不用真的断） */
  disconnect() {
    clearInterval(this.timer);
  }

  /** ioredis 风格：on('error', ...) 不报错 */
  on() { return this; }
}

module.exports = MockRedis;
