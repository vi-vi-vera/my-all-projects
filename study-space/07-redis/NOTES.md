# 簇 7 学习笔记：Redis 缓存与降级

> 对应知识点：q-05
> 目标：搞懂缓存的正确使用姿势，以及缓存出问题时系统不崩的防御手段

---

## 一、先搞懂：为什么要引入 Redis 缓存？

### 1. 没有缓存的世界

```
用户请求 → Node 服务 → 查 MySQL（网络 IO，慢 20~50ms）→ 返回
```

问题：**数据库的 QPS 上限远低于 Node 服务**。
- MySQL 单机：约 2000~5000 QPS
- Node 单进程：约 5000~10000 QPS
- Redis 单核：约 100000+ QPS

**结论**：不加缓存，数据库是瓶颈，QPS 上不去。

### 2. 加了 Redis 之后

```
用户请求 → Node 服务
              ├─ 缓存命中（1ms）→ 直接返回 ✅
              └─ 缓存未命中（查 MySQL 20ms）→ 写入缓存 → 返回
```

第二次及以后的请求，全部走 Redis（内存操作，微秒级），MySQL 完全不用动。

### 3. 面试一句话

> "引入 Redis 缓存是为了挡在数据库前面，把热点数据放内存，把数据库 QPS 从几千提升到几十万。缓存没命中才查库，命中率 90% 以上时，数据库压力下降 90%。"

---

## 二、Cache-Aside（旁路缓存）：标准读写模式

### 1. 什么是 Cache-Aside？

**Cache-Aside** 是最常用的缓存模式，意思是：**应用程序自己管理缓存，而不是让数据库去管缓存**。

读写流程：

```
读请求：
  ① 先读缓存 → 命中 → 直接返回
  ② 未命中 → 查数据库 → 写入缓存 → 返回

写请求：
  ① 先更新数据库
  ② 再删除缓存（不是更新缓存！）
```

### 2. 为什么"写"的时候要**删除**缓存，而不是**更新**缓存？

这是面试高频题，答案是：**防止并发写导致缓存和数据库不一致**。

**反例（更新缓存会出问题）**：

```
时间线：
T1: 请求 A 更新用户名为 "张三" → 更新 DB 成功
T2: 请求 B 更新用户名为 "李四" → 更新 DB 成功
T3: 请求 B 更新缓存 → cache 写入 "李四"
T4: 请求 A 更新缓存 → cache 写入 "张三"  ← 完了！
结果：DB 里是 "李四"，缓存里是 "张三"，不一致！
```

**正确做法（删除缓存）**：

```
T1: 请求 A 更新 DB "张三" → 删除缓存
T2: 请求 B 更新 DB "李四" → 删除缓存
T3: 下次读请求 → 缓存未命中 → 查 DB（"李四"） → 写入缓存
结果：一致 ✅
```

删除缓存让下一次读请求自动加载最新值，规避了竞态问题。

### 3. 有没有可能"先删缓存再更新 DB"更好？

**不行**，这会更糟：

```
T1: 删缓存
T2: 读请求 → 缓存未命中 → 查 DB（旧值） → 写入缓存（旧值！）
T3: 更新 DB（新值）
结果：缓存是旧值，DB 是新值，不一致！
```

**结论**：先更新 DB，再删除缓存。这是 Cache-Aside 的标准顺序。

### 4. 代码演示（见 server.js Demo 1）

```js
// 读
app.get('/api/user/:id', async (req, res) => {
  const cached = await redis.get(`user:${id}`);
  if (cached) return res.json(JSON.parse(cached));   // ① 缓存命中

  const data = await db.query(id);                   // ② 查 DB
  await redis.setex(`user:${id}`, 60, JSON.stringify(data)); // ③ 写缓存
  return res.json(data);
});

// 写
app.put('/api/user/:id', async (req, res) => {
  await db.update(id, req.body);      // ① 先更新 DB
  await redis.del(`user:${id}`);     // ② 再删除缓存（不是 set！）
  return res.json({ ok: true });
});
```

### 5. 面试金句

> "Cache-Aside 模式：读先缓存后 DB，写先更新 DB 再删除缓存。删除而不是更新缓存，是为了避免并发写请求导致缓存与 DB 不一致。先更新 DB 再删缓存，是标准顺序。"

---

## 三、缓存雪崩：大量 key 同时过期

### 1. 现象

```
零点整：秒杀活动开始
所有商品详情页的缓存都设了 1 小时过期
→ 1:00:00 整点，所有缓存同时失效
→ 所有请求同时打到数据库
→ 数据库瞬间被打挂（connection pool 耗尽）
```

**关键词**：大量 key、**同时**过期。

### 2. 解法

#### 解法 1：TTL 加随机抖动（最常用）

```js
// ❌ 错误：所有 key 过期时间一模一样
await redis.setex('product:1', 3600, data);
await redis.setex('product:2', 3600, data);
// ... 1000 个商品都是 3600s → 整点同时失效

// ✅ 正确：加随机抖动
const jitter = Math.floor(Math.random() * 300);  // 0~300 秒随机
await redis.setex('product:1', 3600 + jitter, data);
// 过期时间分散在 3600~3900 秒之间，不会同时失效
```

#### 解法 2：永不过期 + 后台异步刷新

```js
// 缓存不设 TTL（永不过期）
await redis.set('product:1', data);

// 后台定时任务每 30 分钟刷新一次缓存
setInterval(async () => {
  const freshData = await db.query(1);
  await redis.set('product:1', JSON.stringify(freshData));
}, 30 * 60 * 1000);
```

适合：**数据更新不频繁**的场景（商品详情、首页配置）。

#### 解法 3：多级缓存

```
请求 → L1 本地内存缓存（Node.js 进程内 Map）→ 命中 → 返回
       └→ 未命中 → L2 Redis 缓存 → 命中 → 返回 + 写入 L1
                     └→ 未命中 → 查 DB → 写入 L1 + L2
```

即使 Redis 全部 key 同时失效，L1 本地缓存还能扛住一部分流量。

### 3. 面试金句

> "缓存雪崩是大量 key 同时过期导致 DB 被打挂。解法：TTL 加随机抖动（生产最常用）、永不过期 + 后台刷新、多级缓存（L1 内存 + L2 Redis）。抖动一般加 5%~10% 的随机值。"

---

## 四、缓存击穿：热点 key 过期瞬间

### 1. 现象

雪崩是"大量 key 同时失效"，击穿是"**一个**热点 key 失效"。

```
某明星离婚话题，缓存 key = topic:123，QPS = 10 万
key 过期瞬间：
  → 10 万个请求同时发现缓存未命中
  → 10 万个请求同时打向数据库
  → 数据库直接被打挂
```

**区别**：
| | 缓存雪崩 | 缓存击穿 |
|---|---|---|
| key 数量 | 大量 | 一个（热点） |
| 触发原因 | 同时过期 | 热点 key 过期 |
| 影响范围 | 全站 | 单个接口 |

### 2. 解法：互斥锁（Mutex）

**核心思想**：只有一个请求去查 DB，其他请求**等**这个请求把缓存写好后**读缓存**。

```js
app.get('/api/hot-topic/:id', async (req, res) => {
  const cacheKey = `topic:${id}`;
  const mutexKey = `mutex:${cacheKey}`;

  // ① 缓存命中，直接返回
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  // ② 缓存未命中，尝试获取锁
  //    SET mutexKey 1 NX EX 5
  //    NX = 只有 key 不存在才能设置成功（= 获取锁成功）
  //    EX 5 = 5 秒自动过期（防止死锁）
  const lock = await redis.set(mutexKey, '1', 'NX', 'EX', 5);

  if (lock) {
    // ✅ 拿到锁，由我去查 DB
    const data = await db.query(id);
    await redis.setex(cacheKey, 60, JSON.stringify(data));
    await redis.del(mutexKey);  // 释放锁
    return res.json(data);
  } else {
    // ❌ 没拿到锁，等待缓存就绪（自旋）
    for (let i = 0; i < 20; i++) {
      await sleep(50);  // 等 50ms
      const fresh = await redis.get(cacheKey);
      if (fresh) return res.json(JSON.parse(fresh));
    }
    // 超时兜底：直接查 DB（防止无限等待）
    const data = await db.query(id);
    return res.json(data);
  }
});
```

### 3. 互斥锁的坑：死锁

如果查 DB 的过程报错了，锁没被删除 → 其他请求永远拿不到锁 → **死锁**。

**解决**：`SET mutexKey 1 NX EX 5`，锁最多存活 5 秒，超时自动释放。

### 4. 面试金句

> "缓存击穿是热点 key 过期瞬间大量请求穿透到 DB。解法是用互斥锁（SET NX EX），只有一个请求查 DB，其他请求等缓存就绪。锁要设 TTL 防止死锁。SET NX EX 是 Redis 实现分布式锁的标准写法。"

---

## 五、缓存穿透：查询不存在的数据

### 1. 现象

```
攻击者不断请求：/api/user?id=-1
                        id=99999999
                        id=sql_injection_string
```

这些 id 在数据库里**根本不存在**，所以：
- 缓存里也没有（因为 DB 没这条数据，不会写入缓存）
- 每次请求都打向数据库
- 缓存完全**不起作用**（穿透了缓存层）

### 2. 三种解法

#### 解法 1：参数校验（第一道防线）

```js
// 最简单，但只能防明显非法的请求
if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({ error: '参数非法' });
}
```

#### 解法 2：空值缓存（适合"偶尔不存在"）

```js
const data = await db.query(id);
if (!data) {
  // 缓存一个特殊值（比如 "__NULL__"），设短 TTL（30s）
  // 30 秒内同样的请求直接返回 null，不打 DB
  await redis.setex(`user:${id}`, 30, '__NULL__');
  return res.json(null);
}
```

**缺点**：如果攻击者用**大量不同的不存在 id** 攻击，空值缓存会把 Redis 内存撑爆。

#### 解法 3：布隆过滤器（推荐，内存占用极小）

**布隆过滤器**是一个**概率型数据结构**：
- 说"存在" → 可能存在（有**误判率**，比如 1%）
- 说"不存在" → **一定不存在**（100% 准确）

```
初始化：把所有存在的用户 id 加入布隆过滤器
查询时：
  ① 布隆过滤器说"不存在" → 直接返回 null，不打 Redis 也不打 DB
  ② 布隆过滤器说"存在"   → 继续走正常缓存流程（可能误判，但误判率只有 1%）
```

```js
// 简易版（生产用 RedisBloom 模块）
const bloom = new Set();

// 启动时预热：把所有存在的 id 加入
[1, 2, 3].forEach(id => bloom.add(`user:${id}`));

app.get('/api/user-safe/:id', async (req, res) => {
  // ① 布隆过滤器：一定不存在，直接返回
  if (!bloom.has(`user:${id}`)) {
    return res.json(null);  // 拦截！不打 Redis / DB
  }
  // ② 继续走正常缓存流程...
});
```

**生产方案**：Redis 官方模块 `RedisBloom`，一条命令搞定：

```
BF.RESERVE userFilter 0.01 1000000   # 误判率 1%，预计 100 万元素
BF.ADD    userFilter user:1
BF.EXISTS userFilter user:999999       # 返回 0（一定不存在）
```

### 3. 三种解法对比

| 解法 | 内存占用 | 能防大量不同非法请求？ | 推荐度 |
|---|---|---|---|
| 参数校验 | 0 | ❌ 只能防格式错误 | ⭐⭐ |
| 空值缓存 | 中 | ❌ 攻击者可以用不同 id 撑爆内存 | ⭐⭐⭐ |
| 布隆过滤器 | **极小**（1 亿元素 ~ 114MB） | ✅ | ⭐⭐⭐⭐⭐ |

### 4. 面试金句

> "缓存穿透是查询不存在的数据，缓存不起作用，每次打 DB。解法：参数校验（第一道）、空值缓存（短期，适合偶尔不存在）、布隆过滤器（推荐，内存极小，一定不存在的请求直接拦截）。布隆过滤器说不存在则一定不存在，说存在则可能误判。"

---

## 六、缓存降级：Redis 挂了，系统不能挂

### 1. 为什么需要降级？

Redis 也可能挂（网络分区、OOM、主从切换失败）。如果代码里 Redis 一报错就 500，用户体验极差。

**降级的核心思想**：Redis 是"加速"，不是"必须"。Redis 挂了，系统还能跑，只是慢一点。

### 2. 三级降级策略

#### 第一级：熔断（Circuit Breaker）

```
Redis 连续失败 N 次（比如 3 次）
→ 触发熔断：暂时不再访问 Redis
→ 直接走 DB + 本地缓存
→ 30 秒后尝试恢复（半开状态）
```

```js
let redisHealthy = true;
let consecutiveFailures = 0;
const THRESHOLD = 3;

async function getWithFallback(key) {
  // 熔断中，直接走降级逻辑
  if (!redisHealthy) {
    return await queryDBAndCacheLocally(key);
  }

  try {
    const result = await redis.get(key);
    consecutiveFailures = 0;  // 成功，重置计数
    return result;
  } catch (err) {
    consecutiveFailures++;
    if (consecutiveFailures >= THRESHOLD) {
      redisHealthy = false;
      // 30 秒后尝试恢复
      setTimeout(() => {
        redisHealthy = true;
        consecutiveFailures = 0;
      }, 30000);
    }
    // 降级：查 DB
    return await queryDBAndCacheLocally(key);
  }
}
```

#### 第二级：本地内存缓存（二级缓存）

即使 Redis 挂了，本地内存缓存还能返回**部分**数据：

```js
const localCache = new Map();

async function queryDBAndCacheLocally(key) {
  // 先读本地缓存（10 秒有效）
  const cached = localCache.get(key);
  if (cached && Date.now() - cached.ts < 10000) {
    return cached.data;
  }
  // 查 DB
  const data = await db.query(key);
  localCache.set(key, { data, ts: Date.now() });
  return data;
}
```

#### 第三级：兜底数据（静态快照）

```js
// Redis 和 DB 都挂了，返回历史快照
async function getWithFullFallback(key) {
  try {
    return await getFromRedisOrDB(key);
  } catch (err) {
    // 返回 1 小时前的快照（存在 JSON 文件里）
    return readSnapshotFromDisk(key);
  }
}
```

### 3. 面试金句

> "缓存降级分三级：一级熔断（连续失败 N 次暂时不访问 Redis，直接走 DB + 本地缓存，30 秒后尝试恢复）；二级本地内存缓存（二级缓存，Redis 挂了还能返回部分数据）；三级兜底数据（返回历史快照）。核心是：缓存是加速，不是必须，缓存挂了系统还能跑。"

---

## 七、Redis 内存淘汰策略

### 1. 问题：Redis 内存满了怎么办？

`maxmemory 128mb` 配置后，内存达到 128MB 时，Redis 会根据**淘汰策略**决定删哪些 key。

### 2. 8 种淘汰策略

| 策略 | 含义 | 推荐场景 |
|---|---|---|
| `noeviction` | 不淘汰，写请求报错 | 不能丢数据的场景 |
| `allkeys-lru` | 所有 key 中淘汰**最久未访问**的 | **生产最常用** ✅ |
| `allkeys-random` | 所有 key 随机淘汰 | 不推荐 |
| `allkeys-lfu` | 所有 key 中淘汰**访问频率最低**的 | 适合有热点 key 的场景 ✅ |
| `volatile-lru` | 只淘汰**设了 TTL 的 key**中最久未访问的 | 适合有冷热数据区分 |
| `volatile-random` | 只淘汰设了 TTL 的 key 中随机 | 不推荐 |
| `volatile-ttl` | 只淘汰设了 TTL 的 key 中**TTL 最短**的 | 适合有明确过期优先级的场景 |

### 3. 面试必答

> "生产环境一般用 `allkeys-lru` 或 `allkeys-lfu`。LRU 是最近最少使用（最久未访问的先淘汰），LFU 是最近最少频率（访问次数最少的先淘汰）。LFU 比 LRU 更适合有热点 key 的场景，因为热点 key 即使最近没访问，访问频率也高，不会被淘汰。"

---

## 八、Redis 持久化：RDB vs AOF

### 1. 问题：Redis 是内存数据库，重启后数据没了怎么办？

Redis 提供两种持久化方式，可以**同时使用**。

### 2. RDB（快照）

```
定期把内存数据快照写入磁盘（.rdb 文件）
```

| | RDB |
|---|---|
| 性能 | 高（fork 子进程写，主进程不阻塞） |
| 数据完整性 | 低（上次快照到现在的数据会丢，最多丢 5 分钟） |
| 文件大小 | 小（二进制压缩） |
| 恢复速度 | 快 |

**配置**：
```
save 900 1    # 900 秒内至少 1 次写操作 → 触发快照
save 300 10   # 300 秒内至少 10 次写操作 → 触发快照
```

### 3. AOF（追加日志）

```
每一条写命令都追加到 appendonly.aof 文件（类似 MySQL binlog）
```

| | AOF |
|---|---|
| 性能 | 较低（每次写都要 fsync，可配置） |
| 数据完整性 | 高（最多丢 1 秒） |
| 文件大小 | 大（命令日志，可重写压缩） |
| 恢复速度 | 慢（要重放所有命令） |

**三种 fsync 策略**：
| 策略 | 含义 | 性能 | 数据安全 |
|---|---|---|---|
| `always` | 每条命令都 fsync | 最慢 | 最高（不丢数据） |
| `everysec` | 每秒 fsync 一次 | 快 | 高（最多丢 1 秒）✅ **推荐** |
| `no` | 由操作系统决定 | 最快 | 最低（可能丢几十秒） |

### 4. 生产推荐：RDB + AOF 同时开启

```
Redis 4.0+：混合持久化（AOF 重写时把 RDB 快照 + 增量 AOF 合并）
→ 重启时先加载 RDB（快），再重放增量 AOF（少）
→ 兼顾速度和完整性
```

### 5. 面试金句

> "RDB 是定期快照，性能好但会丢数据（最多 5 分钟）。AOF 是追加日志，最多丢 1 秒但文件大。生产推荐同时开启 RDB + AOF，Redis 4.0+ 用混合持久化，重启时先加载 RDB 再重放增量 AOF，兼顾速度和完整性。"

---

## 九、Redis 集群：主从复制 + Sentinel + Cluster

### 1. 主从复制（读写分离）

```
主节点（Master）← 写入
    ↓ 异步复制
从节点（Slave）   ← 读取（分担读 QPS）
```

**作用**：读写分离（主写从读），从节点挂了不影响，主节点挂了需要手动切换。

### 2. Sentinel（高可用）

```
Sentinel x 3（哨兵，监控主节点）
     ↓ 主节点挂了
Sentinel 选举新主节点
     ↓ 自动切换
客户端收到新主节点地址
```

**作用**：主节点挂了**自动切换**，不需要人工介入。

### 3. Cluster（数据分片）

```
16384 个槽位（slot）
数据根据 key 的 hash 分配到不同槽位
每个主节点负责一部分槽位
```

**作用**：数据量超过单机内存时，用 Cluster 水平扩展。

| | 主从 + Sentinel | Cluster |
|---|---|---|
| 数据分布 | 全量复制（每台机器都有全量数据） | 分片（每台机器只有部分数据） |
| 扩展性 | 读扩展（加从节点） | 读写都扩展 |
| 适用场景 | 数据量 < 单机内存 | 数据量 > 单机内存 |

### 4. 面试金句

> "主从复制做读写分离，Sentinel 做主节点自动故障切换，Cluster 做数据分片水平扩展。QPS 高但数据量不大用 Sentinel，数据量超过单机内存用 Cluster。生产一般 Sentinel + Cluster 二选一，不会同时用。"

---

## 十、面试总结：一段话覆盖所有知识点

> "Redis 缓存用 Cache-Aside 模式：读先缓存后 DB，写先更新 DB 再删除缓存。缓存三大问题：雪崩（大量 key 同时过期，TTL 加抖动解决）、击穿（热点 key 过期，互斥锁解决）、穿透（查询不存在数据，布隆过滤器解决）。Redis 挂了要降级：熔断 + 本地缓存 + 兜底数据三级防御。内存满用 allkeys-lru 淘汰策略。持久化用 RDB + AOF 混合模式。高可用用 Sentinel 自动切换主节点。"

---

## 十一、全局自检答题

（学完所有簇后回来作答）

7. **Redis 挂了如何不让请求 503？**
   → 熔断（连续失败 N 次暂不访问 Redis）→ 走 DB + 本地内存缓存 → 返回兜底数据。缓存是加速不是必须。

7b. **Cache-Aside 为什么"删缓存"而不是"更新缓存"？**
   → 防止并发写请求导致缓存与 DB 不一致。先更新 DB 再删缓存是标准顺序。

7c. **缓存雪崩 vs 击穿 vs 穿透的区别？**
   → 雪崩：大量 key 同时过期。击穿：一个热点 key 过期。穿透：查询不存在的数据，缓存不起作用。

7d. **缓存击穿的互斥锁怎么实现？**
   → `SET mutexKey 1 NX EX 5`，NX 保证只有一个人拿到锁，EX 5 防止死锁。

7e. **Redis 内存满了怎么办？**
   → 配 `maxmemory-policy allkeys-lru`，淘汰最久未访问的 key。

7f. **RDB 和 AOF 的区别？**
   → RDB 定期快照，性能好但会丢数据。AOF 追加日志，最多丢 1 秒但文件大。生产同时开启。

---

## 十二、簇 7 学习心得

### 1. 我的理解（用自己的话重述）

**缓存的本质是什么？**
本质上是"用空间换时间"——把数据库里经常访问的数据复制一份放到内存（Redis）里，下次访问直接从内存拿，不用再查数据库。数据库查一次要 20~50ms，Redis 查一次只要 0.1ms，差距 200~500 倍。

**为什么"写"的时候要删除缓存而不是更新缓存？**
之前一直没想清楚，现在理解了：如果两个人同时改数据，因为网络延迟，更新缓存的顺序和改数据库的顺序可能不一样，就会导致缓存和数据库不一致。删除缓存最安全，因为下次有人读的时候，自然会查数据库拿到最新值重新写入缓存，相当于"延迟修正"。

**缓存雪崩、击穿、穿透，这三个到底有什么区别？**
之前一直搞混，现在清楚了：
- **雪崩** = 很多 key 一起过期 → 大量请求同时打 DB → 全站挂
- **击穿** = 一个热点 key（比如首页、明星话题）过期 → 瞬间大量请求打 DB → 单个接口挂
- **穿透** = 查询的数据根本不存在（比如 id=-1）→ 缓存里没有，DB 里也没有 → 每次都打 DB

三者的解法完全不同，面试官就是想看你能不能区分清楚。

**降级到底是什么意思？**
之前以为"降级"是功能砍掉，其实不是。降级是"Redis 挂了，系统还能跑，只是慢一点"。核心思路是：Redis 是"加速"，不是"必须"。缓存挂了，直接查数据库，再配合本地内存缓存挡一下，用户可能觉得慢一点，但不会 503。

---

### 2. 跑 Demo 时的观察

**Demo 1（Cache-Aside）**
- 第一次点"查用户 1"，控制台显示 `缓存未命中，查询 DB`，返回 `source: "database"`
- 再点一次，控制台显示 `缓存命中`，返回 `source: "cache"` → 验证缓存生效 ✅
- 点"更新用户 1"后，再查一次，又走 DB → 验证"删除缓存"生效 ✅
- **学到的**：`source` 字段非常直观地展示了请求走了哪一层，这个设计很好

**Demo 2（雪崩 + TTL 抖动）**
- 每次点"查询库存"，控制台显示的 TTL 都不一样（比如 `ttl=67s`、`ttl=63s`）
- **没观察到的**（因为 Mock Redis 没有真实过期）：如果 TTL 一模一样，整点同时失效 → DB 瞬间被打挂
- **学到的**：生产环境 TTL 一定要加随机抖动，比如 `3600 + Math.random() * 300`

**Demo 3（击穿 + 互斥锁）**
- 快速连续点"查询热点话题 1"，控制台只有一行 `获取锁成功，查询 DB`
- 其他请求显示 `未获取锁，等待其他请求写入缓存...` → 然后拿到缓存 ✅
- **学到的**：`SET mutexKey 1 NX EX 5` 这行代码是精髓，NX = 只有不存在才能设置（= 获取锁），EX 5 = 5 秒后自动释放（防止死锁）

**Demo 4（穿透 + 布隆过滤器）**
- 查用户 1（存在）→ 正常走缓存/DB
- 查用户 999（不存在）→ 第一次走 DB，然后写入空值缓存 `__NULL__`，再查直接返回缓存
- 查 id=-1 → 被参数校验直接拦截，不打 Redis 也不打 DB ✅
- **学到的**：布隆过滤器说"不存在"就一定不存在，说"存在"可能会误判（但有 1% 误判率可接受）

**Demo 5（降级 + 熔断）**
- 把 `server.js` 里 `if (lockAcquired)` 改成 `if (false)` 模拟 Redis 挂了
- 再点按钮，控制台显示 `Redis 异常，降级查 DB` → 返回 `source: "database-degraded"` ✅
- **学到的**：降级不是"功能砍掉"，而是"绕过去"，用户体验差一点但不会 503

---

### 3. 哪些点之前理解错了？

**误解 1**："缓存命中率"是什么意思？
→ 之前以为是个很复杂的指标，其实很简单：`缓存命中次数 / 总请求次数`。命中率 90% 意思是 100 个请求里有 90 个直接走缓存，只有 10 个打数据库。面试如果问"怎么评估缓存效果"，答"看命中率"就行。

**误解 2**：Redis 过期了会自动删除？
→ 不是的。Redis 的过期删除是**惰性删除 + 定期删除**结合：
- 惰性删除：有人访问这个 key 时才检查是否过期，过期就删掉
- 定期删除：每隔一段时间（默认 100ms）随机抽查一批 key，删掉过期的
- 所以如果 key 永远没人访问，可能会一直占着内存，直到被定期删除抽到

**误解 3**：布隆过滤器会不会误删数据？
→ 不会。布隆过滤器只有"插入"和"查询"两个操作，没有"删除"。误判的意思是"说存在但实际不存在"，不会把存在的数据判为不存在（那就麻烦了）。

---

### 4. 面试如果遇到"你的项目怎么用缓存的"，我会怎么答？

> "我们的项目用 Redis 做缓存，用的是 Cache-Aside 模式：读的时候先查缓存，没命中再查数据库并写入缓存；写的时候先更新数据库，再删除缓存（不是更新缓存，避免并发不一致）。
> 
> 缓存有三大问题要注意：雪崩（大量 key 同时过期，解决方法是 TTL 加随机抖动）、击穿（热点 key 过期，解决方法是互斥锁）、穿透（查询不存在的数据，解决方法是布隆过滤器）。
> 
> 另外 Redis 挂了要有降级策略：熔断（连续失败 N 次暂时不访问 Redis）、本地内存缓存（二级缓存）、兜底数据（历史快照），保证系统不 503。"

这段话覆盖了：Cache-Aside、雪崩、击穿、穿透、降级，5 个面试高频点，30 秒能答完。

---

### 5. 还需要扩展吗？

目前笔记覆盖了：
- ✅ Cache-Aside 读写模式
- ✅ 缓存雪崩（TTL 抖动 / 永不过期 / 多级缓存）
- ✅ 缓存击穿（互斥锁 SET NX EX）
- ✅ 缓存穿透（参数校验 / 空值缓存 / 布隆过滤器）
- ✅ 缓存降级（熔断 + 本地缓存 + 兜底数据）
- ✅ Redis 内存淘汰策略（allkeys-lru / allkeys-lfu）
- ✅ Redis 持久化（RDB vs AOF）
- ✅ Redis 高可用（主从 / Sentinel / Cluster）

**暂时不需要扩展**，以上已经覆盖了 q-05 的所有要求，以及面试 90% 的 Redis 相关问题。

如果还有时间，可以扩展的方向（可选，不是必须）：
1. **Redis 分布式锁的坑**（Redlock 算法、锁超时续期、Lua 脚本原子性）
2. **Redis 大 key 问题**（怎么发现、怎么拆分、UNLINK 异步删除）
3. **Redis 数据结构实战**（String/Hash/List/Set/ZSet 各自适合什么场景）

这三个方向偏"进阶"，如果面试岗位是高级/资深前端或全栈，可以补充；如果目标是中级，目前的内容已经够用了。

---
