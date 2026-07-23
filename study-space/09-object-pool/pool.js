/**
 * 演示：对象池（Object Pool）
 * 用 generic-pool 模拟"数据库连接池"
 *
 * 核心三参数：
 *   min          = 预热数量（池里最少保留几个）
 *   max          = 上限（同时最多几个）
 *   idleTimeout  = 空闲多久自动销毁（毫秒）
 */

const { createPool } = require('generic-pool');

// ── 1. 定义"如何创建/销毁一个连接" ──────────────────────────────────
let connId = 0;

const factory = {
  // 新建一个假连接（真实项目这里会是 new pg.Client() 之类）
  create() {
    const id = ++connId;
    console.log(`  [池] 创建连接 #${id}`);
    return Promise.resolve({ id, query: (sql) => `conn#${id} 执行: ${sql}` });
  },

  // 销毁一个连接
  destroy(conn) {
    console.log(`  [池] 销毁连接 #${conn.id}`);
    return Promise.resolve();
  },
};

// ── 2. 创建连接池 ────────────────────────────────────────────────────
const pool = createPool(factory, {
  min: 2,                  // 启动时预热 2 个连接
  max: 5,                  // 最多同时 5 个连接
  idleTimeoutMillis: 3000, // 空闲超过 3 秒就销毁
  acquireTimeoutMillis: 2000, // 等待超过 2 秒还拿不到连接就报错
});

// ── 3. 演示：并发请求 ────────────────────────────────────────────────
async function simulateRequest(reqName) {
  console.log(`${reqName} 请求连接...`);
  const conn = await pool.acquire();         // 从池里取一个连接
  console.log(`${reqName} 拿到连接 #${conn.id}`);

  // 模拟查询耗时 500ms
  await new Promise(r => setTimeout(r, 500));
  const result = conn.query('SELECT 1');
  console.log(`${reqName} 查询完成: ${result}`);

  pool.release(conn);                        // 用完放回池里
  console.log(`${reqName} 归还连接 #${conn.id}`);
}

// ── 4. 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log('=== 启动，等待预热... ===\n');
  // 等一会儿让 min=2 预热完成
  await new Promise(r => setTimeout(r, 200));
  console.log(`当前池中空闲连接数: ${pool.available}\n`);

  console.log('=== 同时发起 4 个并发请求 ===\n');
  await Promise.all([
    simulateRequest('请求A'),
    simulateRequest('请求B'),
    simulateRequest('请求C'),
    simulateRequest('请求D'),
  ]);

  console.log('\n=== 所有请求完成，等 4 秒看 idleTimeout ===\n');
  await new Promise(r => setTimeout(r, 4000));

  console.log(`\n4秒后池中连接数: ${pool.size}（min=2，会保留 2 个）`);

  // 关闭连接池（程序退出前必须调用）
  await pool.drain();
  await pool.clear();
  console.log('\n=== 连接池已关闭 ===');
}

main().catch(console.error);
