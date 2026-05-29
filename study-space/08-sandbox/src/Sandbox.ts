/**
 * 簇 8 核心接口 — 沙箱抽象
 *
 * 设计目标：
 *   业务代码只依赖这个接口，不依赖 Docker / e2b / Cloudflare 任何具体实现。
 *   换供应商 = 换一个实现类，业务代码一行不改。
 *   这就是适配器模式（Adapter Pattern）的核心价值。
 */

/** 沙箱执行结果 */
export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;   // 退出码，0 = 成功
}

/** 沙箱抽象接口 */
export interface Sandbox {
  /**
   * 在沙箱内执行一条命令
   * @example exec('ls -la /tmp')
   */
  exec(cmd: string): Promise<ExecResult>;

  /**
   * 从沙箱读文件
   * @example readFile('/tmp/output.json') → '{"ok":true}'
   */
  readFile(path: string): Promise<string>;

  /**
   * 向沙箱写文件
   * @example writeFile('/tmp/input.txt', 'hello')
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * 销毁沙箱（必须调用，否则资源泄漏）
   */
  dispose(): Promise<void>;
}

/** 沙箱工厂接口（对象池簇 9 会用到） */
export interface SandboxFactory {
  create(): Promise<Sandbox>;
  /** 可返回实现名称，方便日志 */
  readonly type: string;
}
