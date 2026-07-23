# 09 对象池 + warm pool 学习笔记

## 一句话心得

> 对象池 = 共享单车：提前备好几辆（min 预热），限制总数（max 防压垮），空闲太久自动回收（idleTimeout）。

---

## 三个核心参数

| 参数 | 作用 | 比喻 |
|---|---|---|
| `min` | 启动时预热，保证池里始终有这么多个 | 停车场至少停 2 辆备用 |
| `max` | 同时最多几个，超了就排队等 | 停车场最多 10 个位 |
| `idleTimeoutMillis` | 空闲超时自动销毁，节省资源 | 太久没人骑的车回库 |

---

## warm pool（预热池）

- 普通池：第一次来的请求要等 `create()` 完成才能用
- warm pool：启动时就把 `min` 个对象建好，**第一个请求来了直接用，零等待**
- generic-pool 设 `min > 0` 就是 warm pool，不需要额外配置

---

## 什么时候用对象池？

创建成本高的东西都值得：
- 数据库连接（pg、mysql2、mongodb）
- HTTP 长连接客户端
- Puppeteer 浏览器实例（爬虫场景必备）
- 线程/Worker（Node.js worker_threads）

---

## 面试高频问题

**Q: min/max/idleTimeout 怎么定？**

> 没有公式，要压测。一般 min=2~5（防冷启动抖动），max=CPU核数×2~4，idleTimeout=30s~5min。

**Q: 超过 max 会怎样？**

> 请求进入等待队列，超过 `acquireTimeoutMillis` 后抛 `TimeoutError`，要做好 try-catch 和降级。

**Q: 为什么不直接把 max 设很大？**

> 数据库有连接数上限（PostgreSQL 默认 100），开太多会被拒绝；而且每个连接占内存，多了反而慢。

---

## 文件说明

- `pool.js` — 基础演示：预热 + 并发 + idleTimeout
- `pool-overflow.js` — 超出 max 时排队等待的效果
