/**
 * 演示：超出 max 限制时会发生什么
 * max=2，同时发起 3 个请求，第 3 个会排队等待
 */

const { createPool } = require('generic-pool');

let connId = 0;

const pool = createPool(
  {
    create() {
      const id = ++connId;
      console.log(`  [池] 创建连接 #${id}`);
      return Promise.resolve({ id });
    },
    destroy(conn) {
      console.log(`  [池] 销毁连接 #${conn.id}`);
      return Promise.resolve();
    },
  },
  {
    min: 1,
    max: 2,                      // 最多 2 个
    acquireTimeoutMillis: 3000,   // 等 3 秒拿不到就报错
  }
);

async function slowRequest(name, holdMs) {
  console.log(`${name}: 申请连接...`);
  const conn = await pool.acquire();
  console.log(`${name}: 拿到 #${conn.id}，持有 ${holdMs}ms`);
  await new Promise(r => setTimeout(r, holdMs));
  pool.release(conn);
  console.log(`${name}: 归还 #${conn.id}`);
}

async function main() {
  await new Promise(r => setTimeout(r, 100)); // 等预热

  console.log('max=2，同时发起 3 个请求，C 会排队...\n');
  await Promise.all([
    slowRequest('请求A', 1000),
    slowRequest('请求B', 1000),
    slowRequest('请求C', 500),   // C 要等 A 或 B 归还才能拿到连接
  ]);

  await pool.drain();
  await pool.clear();
}

main().catch(console.error);
