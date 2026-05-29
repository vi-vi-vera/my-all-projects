/**
 * Mock 沙箱 — 纯内存模拟，无需 Docker / Linux
 *
 * 实现 Sandbox 接口，但所有"执行"都是模拟的。
 * 用途：
 *   1. 单元测试（不依赖外部服务）
 *   2. 快速验证业务代码逻辑
 *   3. 理解适配器模式（业务代码不知道自己用的是 Mock 还是 Docker）
 */
import { Sandbox, ExecResult } from './Sandbox';

export class MockSandbox implements Sandbox {
  readonly type = 'mock';

  /** 内存文件系统中模拟的文件 */
  private files: Map<string, string> = new Map();

  async exec(cmd: string): Promise<ExecResult> {
    console.log(`[MockSandbox] 模拟执行: ${cmd}`);

    // 模拟几类命令
    if (cmd.startsWith('echo ')) {
      const output = cmd.replace(/^echo\s+/, '').replace(/^["']|["']$/g, '');
      return { stdout: output + '\n', stderr: '', code: 0 };
    }
    if (cmd.startsWith('cat ')) {
      const path = cmd.replace(/^cat\s+/, '').trim();
      const content = this.files.get(path);
      if (content !== undefined) {
        return { stdout: content, stderr: '', code: 0 };
      }
      return { stdout: '', stderr: `cat: ${path}: No such file or directory\n`, code: 1 };
    }
    if (cmd.startsWith('ls')) {
      const entries = Array.from(this.files.keys()).join('\n');
      return { stdout: entries + '\n', stderr: '', code: 0 };
    }
    if (cmd.startsWith('bash ')) {
      // 模拟执行脚本：找到文件内容，把 echo 行的输出写到 /tmp/result.txt
      const scriptPath = cmd.replace(/^bash\s+/, '').trim();
      const scriptContent = this.files.get(scriptPath);
      if (!scriptContent) {
        return { stdout: '', stderr: `bash: ${scriptPath}: No such file or directory\n`, code: 1 };
      }
      // 简单模拟：找到脚本里的 echo "... > /tmp/result.txt
      const echoMatch = scriptContent.match(/echo\s+"([^"]+)"\s+>\s+(\S+)/);
      if (echoMatch) {
        const output = echoMatch[1];
        const outPath = echoMatch[2];
        this.files.set(outPath, output + '\n');
        return { stdout: '', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    }
    if (cmd.includes('&&') || cmd.includes(';')) {
      return { stdout: '', stderr: 'MockSandbox 不支持管道/链式命令\n', code: 1 };
    }

    // 默认：不知道这个命令，模拟"命令不存在"
    return {
      stdout: '',
      stderr: `MockSandbox: command not found: ${cmd}\n`,
      code: 127,
    };
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`MockSandbox: file not found: ${path}`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    console.log(`[MockSandbox] 写入文件: ${path} (${content.length} bytes)`);
  }

  async dispose(): Promise<void> {
    this.files.clear();
    console.log('[MockSandbox] 已销毁（内存已清理）');
  }
}
