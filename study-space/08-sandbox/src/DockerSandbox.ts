/**
 * Docker 沙箱 — 真实 Docker 容器实现
 *
 * 前置条件：
 *   docker run -d --name my-sandbox ubuntu tail -f /dev/null
 *   → 启动一个常驻容器（tail -f 让容器不退出）
 *
 * 换供应商：
 *   把构造函数里的 `docker exec` 换成 `e2b.Sandbox.run()` 或
 *   `cloudflare:workers-dev`、`firecracker:startVm()`，
 *   业务代码（Demo.ts）完全不用改。
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { Sandbox, ExecResult } from './Sandbox';

const execAsync = promisify(exec);

export class DockerSandbox implements Sandbox {
  readonly type = 'docker';

  /** 容器名（构造函数传入，方便同时跑多个容器） */
  private containerName: string;

  constructor(containerName: string = 'my-sandbox') {
    this.containerName = containerName;
  }

  /** 在容器里执行命令 */
  async exec(cmd: string): Promise<ExecResult> {
    // docker exec 在容器里跑命令，stdout/stderr 分开拿
    const dockerCmd = `docker exec ${this.containerName} bash -c "${cmd.replace(/"/g, '\\"')}"`;
    console.log(`[DockerSandbox] 执行: ${cmd}`);

    try {
      const { stdout, stderr } = await execAsync(dockerCmd);
      return { stdout, stderr, code: 0 };
    } catch (err: any) {
      // exec 失败（非 0 退出码）会走这里
      return {
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? String(err),
        code: err.code ?? 1,
      };
    }
  }

  /** 从容器读文件（docker cp） */
  async readFile(path: string): Promise<string> {
    const { stdout } = await execAsync(
      `docker exec ${this.containerName} cat ${path}`
    );
    return stdout;
  }

  /** 向容器写文件（先本地写临时文件，再 docker cp 进去） */
  async writeFile(path: string, content: string): Promise<void> {
    const fs = require('fs/promises');
    const os = require('os');
    const pathMod = require('path');
    const tmpPath = pathMod.join(os.tmpdir(), `sandbox-${Date.now()}.tmp`);

    await fs.writeFile(tmpPath, content);
    await execAsync(`docker cp ${tmpPath} ${this.containerName}:${path}`);
    await fs.unlink(tmpPath);
  }

  /** 停掉并删除容器 */
  async dispose(): Promise<void> {
    try {
      await execAsync(`docker stop ${this.containerName}`);
      await execAsync(`docker rm ${this.containerName}`);
      console.log(`[DockerSandbox] 容器 ${this.containerName} 已销毁`);
    } catch {
      // 容器已经不在了，忽略
    }
  }
}
