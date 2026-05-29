/**
 * 簇 7 主服务：Redis 缓存与降级 完整 Demo
 *
 * 启动步骤（无需 Docker！）：
 *   1. node server.js              # 用 Mock Redis，直接启动
 *   2. 浏览器打开 http://localhost:3000
 *
 * 如果想连真实 Redis：
 *   docker run -d -p 6379:6379 redis:7-alpine
 *   REDIS_REAL=1 node server.js
 *
 * 涵盖 5 个 Demo：
 *   Demo 1 - Cache-Aside（标准读写模式）
 *   Demo 2 - 缓存雪崩（大量 key 同时过期）
 *   Demo 3 - 缓存击穿（热点 key 过期瞬间大量请求穿透到 DB）
 *   Demo 4 - 缓存穿透（查询不存在的数据）
 *   Demo 5 - 降级（Redis 挂了，返回兜底数据）
 */

const express = require('express');
const MockRedis = require('./mock-redis');

const app = express();
app.use(express.json());

// ────────────────────────────────────────
// Redis 连接：默认用 Mock（无需 Docker）
// 设置环境变量 REDIS_REAL=1 可连真实 Redis
// ────────────────────────────────────────
let redis;

if (process.env.REDIS_REAL === '1') {
  // 连真实 Redis（需要先启动 Redis 服务）
  const Redis = require('ioredis');
  redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
  });
  redis.on('error', (err) => {
    console.log('[Redis] 连接异常:', err.message);
  });
  console.log('[启动] 使用真实 Redis（127.0.0.1:6379）');
} else {
  // 用 Mock Redis（纯内存，无需任何外部服务）
  redis = new MockRedis();
  console.log('[启动] 使用 Mock Redis（纯内存，无需 Docker）');
  console.log('[启动] 如需连真实 Redis，运行：REDIS_REAL=1 node server.js');
}

// ────────────────────────────────────────
// 模拟数据库（内存对象代替）
// ────────────────────────────────────────
const fakeDB = {
  1: { id: 1, name: '产品经理', salary: 30000 },
  2: { id: 2, name: '前端工程师', salary: 25000 },
  3: { id: 3, name: '后端工程师', salary: 28000 },
  // 注意：没有 id=999，用于演示"缓存穿透"
};

function queryDB(id) {
  return new Promise((resolve) => {
    // 模拟 DB 查询延迟 200ms
    setTimeout(() => {
      resolve(fakeDB[id] || null);
    }, 200);
  });
}

// ────────────────────────────────────────
// 工具：统一日志格式
// ────────────────────────────────────────
function log(tag, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${tag}] ${msg}`);
}

// ============================================================
// Demo 1：Cache-Aside（旁路缓存）— 标准读写模式
// ============================================================
// 读写流程：
//   读：先读缓存 → 命中返回 → 未命中读 DB → 写入缓存
//   写：先更新 DB → 再删除缓存（不是更新缓存！）
//
// 为什么删除而不是更新缓存？
//   两个并发写请求：写 A 成功 → 写 B 成功 → 更新缓存 B → 更新缓存 A
//   → 缓存里是 A，DB 里是 B，不一致！
//   删除缓存让下次读自动加载最新值，规避竞态。

app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user:${id}`;

  try {
    // ① 先读缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      log('Cache-Aside', `缓存命中 key=${cacheKey}`);
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // ② 缓存未命中，读 DB
    log('Cache-Aside', `缓存未命中，查询 DB id=${id}`);
    const data = await queryDB(Number(id));

    if (!data) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // ③ 写入缓存（设 60s 过期，防止数据脏读）
    await redis.setex(cacheKey, 60, JSON.stringify(data));
    log('Cache-Aside', `写入缓存 key=${cacheKey} ttl=60s`);

    return res.json({ source: 'database', data });
  } catch (err) {
    // Redis 挂了，降级：直接查 DB
    log('Cache-Aside', `Redis 异常，降级查 DB: ${err.message}`);
    const data = await queryDB(Number(id));
    return res.json({ source: 'database-fallback', data });
  }
});

// 更新用户（演示：先更新 DB，再删除缓存）
app.put('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, salary } = req.body;
  const cacheKey = `user:${id}`;

  // ① 先更新 DB（真实场景是 UPDATE users SET ...）
  fakeDB[id] = { ...fakeDB[id], name, salary };
  log('Cache-Aside:UPDATE', `DB 已更新 id=${id}`);

  // ② 再删除缓存（不是 set！）
  try {
    await redis.del(cacheKey);
    log('Cache-Aside:UPDATE', `已删除缓存 key=${cacheKey}`);
  } catch (err) {
    log('Cache-Aside:UPDATE', `删除缓存失败（可忽略）: ${err.message}`);
  }

  return res.json({ ok: true, data: fakeDB[id] });
});

// ============================================================
// Demo 2：缓存雪崩（大量 key 同时过期）
// ============================================================
// 现象：零点的秒杀活动，所有商品缓存都设了 1 小时过期 →
//       1:00 整点所有缓存同时失效 → 所有请求打向 DB → DB 被打挂
//
// 解法 1：过期时间加随机抖动（推荐）
// 解法 2：多级缓存（L1 内存 + L2 Redis）
// 解法 3：永不过期 + 后台刷新

app.get('/api/snow-crash', async (req, res) => {
  const cacheKey = 'seckill:stock';
  const jitter = Math.floor(Math.random() * 10) + 1; // 随机 1~10 秒

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      log('雪崩', `缓存命中 stock=${cached}`);
      return res.json({ source: 'cache', stock: Number(cached) });
    }

    // 模拟 DB 查询（慢！）
    log('雪崩', '缓存未命中，查询 DB（模拟慢查询 500ms）');
    await new Promise((r) => setTimeout(r, 500));
    const stock = 100;

    // ✅ 正确：加随机抖动，避免大量 key 同时过期
    await redis.setex(cacheKey, 60 + jitter, stock);
    log('雪崩', `写入缓存 ttl=${60 + jitter}s（加了 ${jitter}s 抖动）`);

    return res.json({ source: 'database', stock });
  } catch (err) {
    return res.json({ source: 'fallback', stock: 50 }); // 降级返回默认库存
  }
});

// ============================================================
// Demo 3：缓存击穿（热点 key 过期，大量请求同时穿透到 DB）
// ============================================================
// 现象：某明星离婚，话题缓存过期瞬间，10 万 QPS 同时打到 DB
// 雪崩是"大量 key 同时过期"，击穿是"一个热点 key 过期"
//
// 解法：互斥锁（只有一个请求查 DB，其他请求等缓存就绪）

const MUTEX_PREFIX = 'mutex:';
const MUTEX_TTL = 5; // 锁最多持有 5 秒，防止死锁

app.get('/api/hot-topic/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `topic:${id}`;
  const mutexKey = `${MUTEX_PREFIX}${cacheKey}`;

  try {
    // ① 先读缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      log('击穿', `缓存命中 key=${cacheKey}`);
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // ② 缓存未命中，尝试获取互斥锁
    //    SET NX = 只有 key 不存在才能设置成功（= 获取锁成功）
    const lockAcquired = await redis.set(
      mutexKey,
      '1',
      'NX',
      'EX',
      MUTEX_TTL
    );

    if (lockAcquired) {
      // ✅ 拿到锁，由我查 DB
      log('击穿', `获取锁成功，查询 DB id=${id}`);
      const data = await queryDB(Number(id));

      if (data) {
        await redis.setex(cacheKey, 60, JSON.stringify(data));
      }

      // 释放锁
      await redis.del(mutexKey);
      log('击穿', '查询完毕，已写入缓存，锁已释放');

      return res.json({ source: 'database', data });
    } else {
      // ❌ 没拿到锁，等待缓存就绪（自旋）
      log('击穿', '未获取锁，等待其他请求写入缓存...');
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 50)); // 等 50ms
        const fresh = await redis.get(cacheKey);
        if (fresh) {
          log('击穿', '缓存已就绪，返回缓存数据');
          return res.json({ source: 'cache-wait', data: JSON.parse(fresh) });
        }
      }
      // 超时兜底：直接查 DB
      log('击穿', '等待超时，降级查 DB');
      const data = await queryDB(Number(id));
      return res.json({ source: 'database-timeout', data });
    }
  } catch (err) {
    return res.json({ source: 'fallback', data: { id, name: '（降级）默认话题' } });
  }
});

// ============================================================
// Demo 4：缓存穿透（查询不存在的数据，缓存不生效）
// ============================================================
// 现象：恶意攻击，不断查询 id = -1 / 很大的数 / sql 注入字符串
//       缓存没有，DB 也没有 → 每次都打 DB → DB 被拖垮
// 缓存空对象也没用，因为攻击参数每次都不同，会撑爆 Redis 内存
//
// 解法 1：参数校验（第一道防线）
// 解法 2：空值缓存（适合"偶尔不存在"的场景）
// 解法 3：布隆过滤器（推荐，内存占用极小）

// 简易内存布隆过滤器（演示用，生产用 RedisBloom）
const bloomFilter = new Set();

function bloomAdd(id) {
  bloomFilter.add(`user:${id}`);
}
function bloomMaybeHas(id) {
  return bloomFilter.has(`user:${id}`);
}

// 预热：把存在的 id 加入布隆过滤器
[1, 2, 3].forEach((id) => bloomAdd(id));
log('穿透', `布隆过滤器已预热，已知存在的 id: 1,2,3`);

app.get('/api/user-safe/:id', async (req, res) => {
  const id = Number(req.params.id);
  const cacheKey = `user:${id}`;

  // ① 参数校验
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: '参数非法' });
  }

  // ② 布隆过滤器：如果一定不存在，直接返回
  if (!bloomMaybeHas(id)) {
    log('穿透', `布隆过滤器拦截：id=${id} 一定不存在`);
    return res.json({ source: 'bloom-filter', data: null });
  }

  try {
    // ③ 查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      // 空值缓存也存了，需要判断
      if (cached === '__NULL__') {
        return res.json({ source: 'cache-null', data: null });
      }
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // ④ 查 DB
    log('穿透', `布隆过滤器通过，查询 DB id=${id}`);
    const data = await queryDB(id);

    if (!data) {
      // ✅ 空值缓存：短期过期，防止多次穿透
      await redis.setex(cacheKey, 30, '__NULL__');
      return res.json({ source: 'database-null', data: null });
    }

    await redis.setex(cacheKey, 60, JSON.stringify(data));
    return res.json({ source: 'database', data });
  } catch (err) {
    return res.json({ source: 'fallback', data: null });
  }
});

// ============================================================
// Demo 5：缓存降级（Redis 挂了，系统不挂）
// ============================================================
// 核心思想：Redis 是"加速"，不是"必须"
// 降级策略：
//   1. 熔断：连续 N 次失败，暂时不访问 Redis，直接走 DB
//   2. 兜底数据：返回历史快照 / 默认值 / 本地内存缓存
//   3. 限流：降级期间限制 DB QPS，防止 DB 被打挂

let redisHealthy = true;
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;
const LOCAL_CACHE_TTL = 10000; // 本地内存缓存 10 秒

// 简易本地内存缓存（作为 Redis 的二级缓存）
const localCache = new Map();

app.get('/api/user-fallback/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user:${id}`;

  // ① 检查熔断状态
  if (!redisHealthy) {
    log('降级', `Redis 熔断中，走本地缓存 / DB`);
    const local = localCache.get(cacheKey);
    if (local && Date.now() - local.ts < LOCAL_CACHE_TTL) {
      return res.json({ source: 'local-cache', data: local.data });
    }
    const data = await queryDB(Number(id));
    localCache.set(cacheKey, { data, ts: Date.now() });
    return res.json({ source: 'database-degraded', data });
  }

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      consecutiveFailures = 0; // 成功则重置失败计数
      redisHealthy = true;
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    const data = await queryDB(Number(id));
    await redis.setex(cacheKey, 60, JSON.stringify(data));
    consecutiveFailures = 0;
    redisHealthy = true;
    return res.json({ source: 'database', data });
  } catch (err) {
    consecutiveFailures++;
    log('降级', `Redis 异常 (${consecutiveFailures}/${FAILURE_THRESHOLD}): ${err.message}`);

    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      redisHealthy = false;
      log('降级', '⚠️ Redis 熔断触发！后续请求直接走 DB + 本地缓存');
      // 30 秒后尝试恢复
      setTimeout(() => {
        redisHealthy = true;
        consecutiveFailures = 0;
        log('降级', 'Redis 熔断恢复，尝试重新访问');
      }, 30000);
    }

    // 降级：查 DB + 写本地缓存
    const data = await queryDB(Number(id));
    localCache.set(cacheKey, { data, ts: Date.now() });
    return res.json({ source: 'database-degraded', data });
  }
});

// 手动重置熔断状态（方便演示）
app.post('/api/reset-circuit', (req, res) => {
  redisHealthy = true;
  consecutiveFailures = 0;
  localCache.clear();
  log('降级', '熔断状态已重置');
  return res.json({ ok: true, message: '熔断已重置，Redis 恢复正常' });
});

// ============================================================
// 首页：所有 Demo 的可交互说明
// ============================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>簇 7：Redis 缓存与降级</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.8; }
    h1 { color: #c0392b; }
    h2 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 6px; margin-top: 32px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .tag-get { background: #e8f5e9; color: #2e7d32; }
    .tag-put { background: #e3f2fd; color: #1565c0; }
    .tag-post { background: #fff3e0; color: #e65100; }
    .tip { background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
    .danger { background: #fde8e8; border-left: 4px solid #e74c3c; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
    .ok { background: #e8f5e9; border-left: 4px solid #27ae60; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
    button { padding: 8px 16px; margin: 4px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: #fff; }
    button:hover { background: #f0f0f0; }
    input { padding: 6px; width: 60px; }
    #log { background: #1e1e1e; color: #0f0; padding: 12px; border-radius: 6px; height: 200px; overflow-y: auto; font-size: 12px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>🗄️ 簇 7：Redis 缓存与降级</h1>
  <p>打开 DevTools → Network，逐个跑 Demo，观察响应来源（<code>source</code> 字段）。</p>

  <!-- Demo 1 -->
  <h2>Demo 1：Cache-Aside（旁路缓存）</h2>
  <p>标准读写模式。<span class="tag tag-get">GET</span> <code>/api/user/:id</code></p>
  <div class="ok">✅ <strong>正确流程</strong>：读 → 缓存命中返回 → 未命中查 DB → 写缓存<br>
            写 → 先更新 DB → 再<strong>删除</strong>缓存（不是更新！）</div>
  <p>
    <button onclick="call('/api/user/1')">查用户 1（首次 DB，再刷缓存）</button>
    <button onclick="call('/api/user/2')">查用户 2</button>
    <button onclick="updateUser()">更新用户 1（观察缓存删除）</button>
  </p>
  <p>更新用户 1 的 name：<input id="newName" value="刘奕晨(v2)" /> <button onclick="updateUser()">发送 PUT</button></p>

  <!-- Demo 2 -->
  <h2>Demo 2：缓存雪崩</h2>
  <p>大量 key 同时过期，所有请求打向 DB。</p>
  <div class="danger">❌ <strong>错误</strong>：所有 key 设完全相同的 TTL<br>
             ✅ <strong>正确</strong>：TTL 加随机抖动（1~10s）</div>
  <p><button onclick="call('/api/snow-crash')">查询库存（观察 TTL 末尾的随机值）</button></p>
  <p>先 <code>docker stop study-redis</code> 清空缓存，再快速刷新模拟雪崩：</p>
  <pre>for i in (seq 1 10); curl http://localhost:3000/api/snow-crash; end</pre>

  <!-- Demo 3 -->
  <h2>Demo 3：缓存击穿</h2>
  <p>热点 key 过期瞬间，大量并发打到 DB。</p>
  <div class="ok">✅ <strong>解法</strong>：互斥锁（SET NX），只有一个请求查 DB，其余等待。</div>
  <p><button onclick="call('/api/hot-topic/1')">查询热点话题 1（观察锁竞争日志）</button></p>
  <p>开多个标签页同时点，观察只有一个人拿到锁：</p>

  <!-- Demo 4 -->
  <h2>Demo 4：缓存穿透</h2>
  <p>查询不存在的数据，缓存不生效，每次打 DB。</p>
  <div class="ok">✅ <strong>解法</strong>：① 参数校验 ② 空值缓存（短期）③ 布隆过滤器</div>
  <p>
    <button onclick="call('/api/user-safe/1')">查存在的用户 1（正常）</button>
    <button onclick="call('/api/user-safe/999')">查不存在的用户 999（空值缓存）</button>
    <button onclick="call('/api/user-safe/-1')">查 id=-1（参数校验拦截）</button>
  </p>

  <!-- Demo 5 -->
  <h2>Demo 5：缓存降级（Redis 挂了）</h2>
  <p>Redis 连续失败 N 次 → 熔断 → 走 DB + 本地内存缓存。</p>
  <div class="tip">💡 模拟 Redis 挂掉：<code>docker pause study-redis</code>（暂停）<br>
             恢复：<code>docker unpause study-redis</code> 然后 POST <code>/api/reset-circuit</code></div>
  <p>
    <button onclick="call('/api/user-fallback/1')">查用户 1（正常走缓存）</button>
    <button onclick="fetch('/api/reset-circuit', {method:'POST'}).then(r=>r.json()).then(d=>log(d))">重置熔断状态</button>
  </p>

  <h2>📋 实时请求日志</h2>
  <div id="log">点击上方按钮，日志会出现在这里...\n</div>

  <h2>📋 面试自检（口头 30 秒答出）</h2>
  <div class="tip">
    1. Cache-Aside 为什么"删缓存"而不是"更新缓存"？<br>
    2. 缓存雪崩 vs 击穿 vs 穿透 的区别？<br>
    3. 缓存击穿的互斥锁怎么实现（SET NX）？<br>
    4. 布隆过滤器有什么缺点（误判）？怎么补救？<br>
    5. Redis 挂了怎么降级（熔断 + 本地缓存 + 限流）？<br>
    6. 先更新 DB 还是先删除缓存，哪种顺序更安全？<br>
  </div>

  <script>
    const logDiv = document.getElementById('log');
    function log(msg) {
      const time = new Date().toLocaleTimeString();
      logDiv.textContent += '[ ' + time + ' ] ' + msg + '\\n';
      logDiv.scrollTop = logDiv.scrollHeight;
    }
    async function call(url) {
      log('→ GET ' + url);
      try {
        const r = await fetch(url);
        const d = await r.json();
        log('← ' + JSON.stringify(d));
      } catch(e) {
        log('← 错误: ' + e.message);
      }
    }
    async function updateUser() {
      const name = document.getElementById('newName').value;
      log('→ PUT /api/user/1 body=' + name);
      try {
        const r = await fetch('/api/user/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, salary: 30000 }),
        });
        const d = await r.json();
        log('← ' + JSON.stringify(d));
      } catch(e) {
        log('← 错误: ' + e.message);
      }
    }
    log('就绪，请点击上方按钮开始 Demo');
  </script>
</body>
</html>
  `);
});

// ────────────────────────────────────────
// 启动
// ────────────────────────────────────────
const PORT = 3000;

async function start() {
  try {
    await redis.connect();
    log('启动', 'Redis 连接成功');
  } catch (err) {
    log('启动', 'Redis 未启动（可稍后 docker-compose up -d 后自动重连）');
  }

  app.listen(PORT, () => {
    log('启动', `服务运行在 http://localhost:${PORT}`);
    log('启动', '请先执行：docker-compose up -d');
  });
}

start();
