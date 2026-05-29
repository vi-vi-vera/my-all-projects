/**
 * 簇 8 Demo — 适配器模式演示
 *
 * 核心结论：
 *   业务代码只 import { Sandbox }，不 import DockerSandbox / MockSandbox。
 *   换供应商 = 换 new 后面的类名，业务逻辑 0 修改。
 *   这就是 Adapter 模式（也叫 Dependency Inversion）。
 *
 * 运行：
 *   npx ts-node src/Demo.ts
 */

import { Sandbox } from './Sandbox';
import { MockSandbox } from './MockSandbox';
import { DockerSandbox } from './DockerSandbox';

/**  ——— 业务代码：只认 Sandbox 接口 ———  */

/** 在沙箱里跑一段用户代码（业务不关心是 Docker 还是 Mock） */
async function runUserCode(sandbox: Sandbox, code: string): Promise<string> {
  // 1. 把代码写进沙箱
  await sandbox.writeFile('/tmp/user_code.sh', code);

  // 2. 执行（加 timeout 保护，防止死循环）
  const result = await sandbox.exec('bash /tmp/user_code.sh');

  if (result.code !== 0) {
    throw new Error(`代码执行失败（退出码 ${result.code}）:\n${result.stderr}`);
  }

  // 3. 读取执行结果
  const output = await sandbox.readFile('/tmp/result.txt').catch(() => result.stdout);
  return output.trim();
}

/**  ——— Demo 主流程 ——— */

async function main() {
  console.log('=== 簇 8 Demo：适配器模式 ===\n');

  // ════════════════════║
  // ║  切换点：换一个实现类，下面这行是唯一需要改的地方  ║
  // ║  业务函数 runUserCode() 完全不用动                        ║
  // ════════════════════╝

  // 方案 1：Mock（无需 Docker，直接跑）
  let sandbox: Sandbox = new MockSandbox();
  console.log('【方案 1】使用 MockSandbox（纯内存，无需 Docker）\n');

  try {
    const code1 = 'echo "Hello from Sandbox" > /tmp/result.txt';
    const result1 = await runUserCode(sandbox, code1);
    console.log('✅ 执行结果:', result1);
  } catch (err: any) {
    console.error('❌ 错误:', err.message);
  } finally {
    await sandbox.dispose();
  }

  console.log('\n' + '─'.repeat(50) + '\n');

  // 方案 2：Docker（需要先 docker run -d --name my-sandbox ubuntu tail -f /dev/null）
  console.log('【方案 2】使用 DockerSandbox（需要真实容器）');
  console.log('提示：如果没启动容器，会报错，这是正常的。\n');

  const dockerSandbox = new DockerSandbox('my-sandbox');
  try {
    const code2 = 'echo "Hello from Docker" > /tmp/result.txt';
    const result2 = await runUserCode(dockerSandbox, code2);
    console.log('✅ Docker 执行结果:', result2);
  } catch (err: any) {
    console.warn('⚠️ Docker 执行失败（可能是容器没启动）:', err.message);
    console.log('💡 修复：docker run -d --name my-sandbox ubuntu tail -f /dev/null');
  } finally {
    await dockerSandbox.dispose();
  }

  console.log('\n=== Demo 结束 ===');
  console.log('\n📌 适配器模式要点：');
  console.log('  1. 业务代码依赖抽象接口（Sandbox），不依赖具体实现');
  console.log('  2. 换供应商只需改 new 后面的类名，业务逻辑 0 修改');
  console.log('  3. 这就是 Dependency Inversion（依赖倒置）的核心思想\n');
}

main().catch(console.error);
