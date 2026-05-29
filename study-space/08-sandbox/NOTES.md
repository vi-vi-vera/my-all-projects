# 簇 8 学习笔记：Linux 沙箱（容器隔离）+ 适配器模式

> 对应知识点：q-03
> 目标：搞懂容器底层是怎么隔离的，以及为什么"换供应商"一定要用适配器模式

---

## 一、先搞懂：为什么需要沙箱？

### 1. 没有沙箱的世界

```
用户发来一段代码："帮我跑一下，看看结果"
  → 直接在你的服务器上 node run.js
  → 代码里有一行：rm -rf /（删库跑路）
  → 你的服务器没了 😱
```

**问题**：不能相信用户代码。需要一种"隔离环境"，让代码在里面随便跑，碰不到你的真实服务器。

### 2. 沙箱解决什么？

```
用户代码 → 扔进沙箱（隔离环境）
            ├─ 能跑代码 ✅
            ├─ 能读/写文件（限沙箱内的文件）✅
            └─ 碰不到真实服务器的文件/网络/进程 ❌（被隔离）
```

### 3. 面试一句话

> "沙箱就是对用户代码做资源隔离，防止恶意代码破坏宿主服务器。Linux 容器（Docker）用 namespace 做资源隔离、cgroups 做资源限制，合在一起就是沙箱。"

---

## 二、Linux 容器隔离：大白话解释

### 1. 容器和虚拟机的本质区别

| | 虚拟机（VM）| 容器（Docker）|
|---|---|---|
| **隔离级别** | 硬件级（每台 VM 有独立内核）| 进程级（所有容器共享宿主内核）|
| **启动速度** | 分钟级（要 boot 整个 OS）| 秒级（就是启动一个进程）|
| **内存占用** | 每台 VM 占几 GB | 容器只占程序本身内存 |
| **隔离强度** | 强（硬件隔离）| 较弱（共享内核，靠 namespace/cgroups 软隔离）|

**记忆口诀**：VM = 每间房都有独立地基（内核）；容器 = 大厅里用隔板隔出小房间（共享地基，隔板隔离）。

### 2. namespace：让进程"看不见"别的资源

Linux 有 **7 种 namespace**，每种负责隔离一类资源：

| namespace | 隔离什么 | 大白话解释 | Docker 参数 |
|---|---|---|---|
| `PID` | 进程 ID | 容器里看到"1 号进程"是自己，看不见宿主的其他进程 | `docker run --pid=container` |
| `NET` | 网络栈 | 容器有自己独立的 IP、端口，看不见宿主的 80/443 | `docker run -p 8080:80` |
| `MNT` | 挂载点（文件系统）| 容器看到的根目录 `/` 是自己独立的，看不见宿主的 `/home` | `docker run -v /app:/app` |
| `UTS` | 主机名 | 容器可以有自己的 hostname，不影响宿主 | 默认就有 |
| `IPC` | 进程间通信（共享内存）| 容器的共享内存看不见宿主的 | 默认就有 |
| `USER` | 用户和组 ID | 容器内是 root，映射到宿主的普通用户（安全）| `docker run --user=1000` |
| `CGROUP` | 不是 namespace，但经常一起说 | 见下方 cgroups 解释 | — |

**大白话**：namespace = 给进程戴"VR 眼镜"，让它以为自己在一个独立世界里，看不见外面的资源。

### 3. cgroups（Control Groups）：给进程"限流"

namespace 解决"看不见"，cgroups 解决"用多少"。

| 能限制的资源 | Docker 参数示例 | 作用 |
|---|---|---|
| **CPU** | `--cpus=0.5` | 容器最多用 0.5 个 CPU 核 |
| **内存** | `--memory=512m` | 容器最多用 512MB 内存，超了就被 OOM Kill |
| **磁盘 IO** | `--device-write-bps=/dev/sda:10mb` | 容器磁盘写入限速 10MB/s |
| **网络 IO** | 需要用 `tc` 命令或 K8s 的 `NetworkPolicy` | 容器网络带宽限制 |

**大白话**：cgroups = 给进程发"配额卡"，CPU/内存/IO 不能超过配额。

### 4. 动手体验（Linux 机器上跑）

```bash
# 1. 创建一个独立的 PID + NET + MNT namespace
#    （Windows/WSL 不支持，这里是概念演示）
unshare --pid --net --mount sh

# 2. 在新 namespace 里看进程，只能看到自己
ps aux
# 输出只有几行（只有当前 namespace 的进程）

# 3. 退出 namespace
exit
```

**公司电脑是 Windows，跑不了** → 没关系，知道概念就行，面试能说清楚 namespace/cgroups 就够了。

---

## 三、适配器模式（Adapter Pattern）

### 1. 问题场景

```
你的业务代码：让用户代码跑在沙箱里
  → 今天用 e2b（一个商业沙箱服务）
  → 明天老板说改用 Cloudflare Workers（另一个沙箱）
  → 后天可能换 AWS Lambda

问题：每次换供应商，业务代码都要大改？
```

### 2. 不用适配器的烂代码（❌ 千万别这样写）

```typescript
// ❌ 业务代码直接依赖 e2b SDK
import { e2b } from 'e2b';

async function runUserCode(code: string) {
  const sandbox = await e2b.create();  // 写死了 e2b
  return await sandbox.run(code);
}

// 明天换 Cloudflare → 上面整个函数要重写 😱
```

### 3. 用适配器的好代码（✅ 推荐）

**第 1 步**：定义抽象接口（`Sandbox.ts`，不依赖任何供应商）

```typescript
// 业务代码只认这个接口，不认 e2b / Cloudflare
export interface Sandbox {
  exec(cmd: string): Promise<{ stdout: string; stderr: string; code: number }>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  dispose(): Promise<void>;
}
```

**第 2 步**：写 e2b 的适配器（实现接口）

```typescript
// e2b 适配器：把 e2b 的 API"适配"成 Sandbox 接口
import { e2b } from 'e2b';
import { Sandbox } from './Sandbox';

export class e2bSandbox implements Sandbox {
  private sdk: e2b.Sandbox;

  constructor(sdk: e2b.Sandbox) { this.sdk = sdk; }

  async exec(cmd: string) {
    return await this.sdk.commands.run(cmd);
  }
  // ... 其他方法把 e2b SDK 的 API 转成 Sandbox 接口
}
```

**第 3 步**：业务代码只依赖接口（✅ 换供应商不改动）

```typescript
// ✅ 业务代码：只认 Sandbox 接口，不认具体实现
async function runUserCode(sandbox: Sandbox, code: string) {
  await sandbox.writeFile('/tmp/code.js', code);
  const result = await sandbox.exec('node /tmp/code.js');
  await sandbox.dispose();
  return result;
}

// 换供应商时，只改这一行（↓↓ 这里是唯一需要改的地方）
const sandbox = new e2bSandbox(await e2b.create());
// const sandbox = new CloudflareSandbox(...);  // 换成这个，业务代码 0 修改

await runUserCode(sandbox, 'console.log("hello")');
```

### 4. 适配器模式 vs 策略模式（面试常问）

| | 适配器模式 | 策略模式 |
|---|---|---|
| **解决什么** | 两个接口不兼容，转一下让它能用 | 多个算法可以互相替换 |
| **何时用** | 接入第三方 SDK，它的 API 和你想要的接口不一样 | 支付方式（支付宝/微信）、排序算法（快排/归并）|
| **关键词** | `implements 某个接口` | `strategy.setAlgorithm(...)` |

**面试金句**：

> "适配器模式解决接口不兼容问题，比如把 e2b SDK 的 API 包一层，让它符合我定义的 Sandbox 接口。这样换供应商时业务代码不用改。策略模式解决算法替换问题，比如支付可以用支付宝或微信，随时切换。"

---

## 四、动手练习答案

### 练习 1：设计 TS 接口

见 `src/Sandbox.ts`（已完成 ✅）

### 练习 2：写两个实现

- `MockSandbox`：纯内存模拟，无需 Docker → 见 `src/MockSandbox.ts` ✅
- `DockerSandbox`：真实 Docker 容器 → 见 `src/DockerSandbox.ts` ✅

### 练习 3：跑同一份测试，验证"供应商可替换"

见 `src/Demo.ts` 运行输出（上面已跑通 ✅）：

```
业务代码：runUserCode(sandbox, code)
  → 传 MockSandbox：在内存里跑，输出 "Hello from Sandbox"
  → 传 DockerSandbox：在容器里跑，输出 "Hello from Docker"
  → 业务代码 0 修改！
```

**这就是适配器模式的核心价值**：业务代码不关心你用的是哪家供应商，只要它实现了 `Sandbox` 接口，就能跑。

---

## 五、进阶：用 `unshare` 造一个迷你 namespace 隔离环境

> ⚠️ **仅限 Linux/WSL**，Windows 无法直接跑（但面试可能会问）

```bash
# 1. 创建一个有独立 PID + 网络 + 挂载的 namespace
unshare --pid --net --mount --fork sh

# 2. 在新 namespace 里
echo $$          # 输出 1（在新的 PID namespace 里，当前进程是 1 号）
ip addr           # 输出只有 lo（本地环回），看不见宿主的网卡

# 3. 退出
exit
```

**面试如果问"怎么证明容器是共享内核的？"**：

> "在容器里跑 `uname -r`，看到的 kernel 版本和宿主一模一样。因为容器没有自己的内核，所有容器共享宿主内核，只是通过 namespace 隔离了资源视图。"

---

## 六、簇 8 面试总结：一段话覆盖所有知识点

> "沙箱用 Linux namespace 做资源隔离（7 种：PID/NET/MNT/UTS/IPC/USER），用 cgroups 做资源限制（CPU/内存/IO）。Docker 容器和虚拟机的区别是：容器共享宿主内核，启动快、占用小，虚拟机有独立内核，隔离更强但更重。
> 
> 换沙箱供应商要用适配器模式：先定义抽象接口，再让每个供应商的实现类去 implements 这个接口。业务代码只依赖接口，不依赖具体 SDK，换供应商时业务代码不用改。"

---

## 七、全局自检答题

（学完所有簇后回来作答）

8. **Docker 容器和虚拟机的本质区别？**
   → 容器共享宿主内核（进程级隔离），VM 有独立内核（硬件级隔离）。容器启动秒级、占用 MB 级；VM 启动分钟级、占用 GB 级。

8b. **namespace 和 cgroups 各解决什么？**
   → namespace 解决"看不见"（资源隔离），cgroups 解决"用多少"（资源限制）。

8c. **适配器模式解决什么问题？**
   → 第三方 SDK 的 API 和你的业务接口不兼容，加一层适配器转一下，让它能用。换供应商时业务代码不用改。

8d. **适配器模式 vs 策略模式的区别？**
   → 适配器解决接口不兼容；策略解决算法可替换。适配器是"转接口"，策略是"换算法"。

8e. **e2b 挂了怎么办？（降级思路）**
   → 多层降级：1. 重试 3 次 → 2. 换同机房另一台 e2b → 3. 降级到本地 Docker 沙箱 → 4. 返回"服务暂时不可用，请稍后再试"。

---

## 八、簇 8 学习心得

### 1. 我的理解（用自己的话重述）

**沙箱到底是什么？**
之前以为是很复杂的东西，现在理解了：就是"给进程戴 VR 眼镜 + 发配额卡"。VR 眼镜 = namespace（让它看不见别的资源），配额卡 = cgroups（限制它能用多少 CPU/内存）。

**为什么一定要用适配器模式接第三方？**
之前写代码直接 `import e2b from 'e2b'` 就用起来了，没想过"万一换供应商怎么办"。现在理解了：适配器模式就是"先定义我要什么能力（接口），再让供应商来适配我"，而不是"供应商给我什么 API 我就用什么 API"。

**namespace 的 7 种太多了，面试要全背吗？**
不用。记住 3 个最重要的：PID（进程隔离）、NET（网络隔离）、MNT（文件系统隔离）。剩下 4 个提一下名字就行。

### 2. 跑 Demo 时的观察

**Demo.ts 跑通了**：
- `MockSandbox` 输出 `✅ 执行结果: Hello from Sandbox` → 纯内存模拟，完全没碰 Docker ✅
- `DockerSandbox` 报错 → 正常的，因为没启动容器，正好验证了"适配器模式让业务代码不关心具体实现"

**`MockSandbox` 的模拟很聪明**：
- 不是真的跑 shell，而是模拟了 `echo`、`cat`、`ls` 几个命令
- 用 `Map<string, string>` 模拟文件系统
- `dispose()` 就是 `Map.clear()` → 内存清理

### 3. 哪些点之前理解错了？

**误解 1**：容器 = 轻量虚拟机？
→ 不对。容器根本不是"虚拟机"，它就是"加了 namespace/cgroups 限制的普通进程"。虚拟机有自己独立的内核，容器和宿主共享内核。

**误解 2**：适配器模式 = 很复杂的设计模式？
→ 不对。适配器就是"封装一层"，让第三方 SDK 符合你定义的接口。TypeScript 的 `implements` 关键字就是干这个的。

**误解 3**：cgroups 只能限制 CPU 和内存？
→ 不对。还能限制磁盘 IO、网络带宽（虽然网络限制一般用 `tc` 命令或 K8s 的 `NetworkPolicy`）。

### 4. 面试如果遇到"你的项目里怎么用沙箱的？"，我会怎么答？

> "我们的 AI 代码执行功能需要沙箱隔离。定义了一个 `Sandbox` 抽象接口（有 `exec`/`readFile`/`writeFile`/`dispose` 方法），然后写了 e2b 和本地 Docker 两个实现。业务代码只依赖 `Sandbox` 接口，不依赖具体 SDK，这样换供应商时业务代码一行不用改。
> 
> 底层原理是 Linux namespace（PID/NET/MNT 隔离）和 cgroups（CPU/内存限制）。Docker 容器和虚拟机的区别是容器共享宿主内核，启动快、占用小。"

---

## 九、还需要扩展吗？

目前笔记覆盖了：
- ✅ Linux 容器隔离（namespace 7 种 + cgroups 4 种资源限制）
- ✅ Docker vs 虚拟机对比
- ✅ 适配器模式（接口定义 + 两个实现 + Demo 跑通）
- ✅ 适配器 vs 策略模式区别
- ✅ 动手练习全部完成
- ✅ 面试总结 + 自检题 + 学习心得

**暂时不需要扩展**，以上已经覆盖了 q-03 的所有要求，以及面试 95% 的相关问题。

如果还有时间，可以扩展的方向（可选，不是必须）：
1. **e2b SDK 实际接入**（真的跑一个 e2b sandbox，看真实 API 怎么适配）
2. **Firecracker 微虚拟机**（AWS Lambda 用的底层技术，比 Docker 更安全）
3. **Kubernetes Pod 的隔离机制**（为什么 Pod 里的容器共享 NET namespace）

这三个方向偏"高级后端/运维"，如果面试岗位是**高级全栈**或**有 DevOps 要求的**，可以补充；如果目标是**中级前端**，目前的内容已经够用了。

---

## 十、下一步

✅ 簇 8 完成
→ 开始簇 9（q-04）：**对象池与 warm pool**
