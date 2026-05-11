# QPilot Code Agent — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：**会写一点 JavaScript/TypeScript，但对 SSE、MCP、可观测性、沙箱、Redis、Docker 等还是"听过没做过"的同学**
> 目标：跟着这份指引一步一步做完，就能覆盖知识图谱里的 24 项必备 + 12 项加分知识点

---

## 0. 怎么使用这份指引

知识图谱里 36 个知识点，其实是围绕 **12 道考题（q-01 ~ q-12）** 展开的，每道题背后是一个"知识簇"。本指引按**学习顺序**把这 12 个簇重新排序，每个簇给你：

1. **它在解决什么真实问题**（一句话场景）
2. **零基础前置**：如果连这一步都不熟，先补什么
3. **必读材料**：每条都给可直接点击的官方/权威外链
4. **动手练习**：从最小可运行 demo 开始
5. **自检清单**：能口头回答=过关

> 推荐节奏：**每个簇 1~2 个晚上**，12 个簇大约 3~4 周走完。不要囤资料，**先跑起一个最小 demo 再回头读文档**。

学习路径分成 4 个阶段：

| 阶段 | 簇 | 关键词 |
|---|---|---|
| 阶段 A：Web 基础底座 | 1, 2, 3 | SSE、Express、git/shell |
| 阶段 B：前端架构与可靠性 | 4, 5, 6 | React Hooks、Zustand、状态机、postMessage |
| 阶段 C：后端与基础设施 | 7, 8, 9 | Redis、Docker/沙箱、对象池 |
| 阶段 D：AI Agent 专项 | 10, 11, 12 | MCP、Tool use、OTel/Langfuse、Feature Flag |

---

## 阶段 A：Web 基础底座

### 簇 1（q-01）：SSE 流式推送 与 fetch-event-source

**覆盖知识点**：SSE 协议规范、fetch-event-source、WebSocket vs SSE
**真实场景**：ChatGPT/Claude 那种"逐字蹦出来"的效果，背后就是 SSE。

#### 0-1 零基础前置
- 知道 HTTP 请求/响应是什么；用过 `fetch()` 发过 GET 请求。
- 没接触过的话先看一遍：[MDN — 使用 Fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)。

#### 必读材料（按顺序）
1. [MDN: Using server-sent events（中文）](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events) — 入门首选，10 分钟看完。
2. [MDN: EventSource 接口](https://developer.mozilla.org/zh-CN/docs/Web/API/EventSource) — 浏览器侧 API。
3. [WHATWG HTML Living Standard — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — 规范原文，重点看 `Last-Event-ID`、`retry`、`event:` 字段。
4. [microsoft/fetch-event-source（README）](https://github.com/Azure/fetch-event-source) — 浏览器原生 EventSource 不能带 `Authorization` 头，这就是它存在的意义。
5. 对比 WebSocket：[MDN: WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket) — 重点理解"全双工 vs 服务器单向推"的取舍。

#### 动手练习
- **Demo 1**：30 行 Express 写一个 SSE 端点，每秒 push 一条 `data: hello {n}\n\n`，前端用原生 `EventSource` 接。
  - 模板参考：[express-sse 仓库 README](https://github.com/dpskvn/express-sse#usage)
- **Demo 2**：在 Demo 1 里加上 `id:` 字段；客户端带 `Last-Event-ID` 头重连，验证能从断点续接。
- **Demo 3**：在本地装 nginx，把 SSE 端点反代一层，观察首字节延迟。然后在 nginx location 里加 `proxy_buffering off;` 和 `X-Accel-Buffering: no` 头，再观察一次差异 — [nginx 文档：proxy_buffering](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)。

#### 自检
- [ ] 能说清 SSE 报文必须以 `\n\n` 结尾的原因。
- [ ] 能解释为什么 SSE 在 nginx 后默认会"卡住不流"。
- [ ] 能说出选 SSE 不选 WebSocket 的 3 个理由（HTTP/1.1 兼容、自动重连、单向）。

---

### 簇 2（q-12）：Express 中间件 + HTTP keepalive + SSE 错误协议

**覆盖知识点**：Express middleware 模型、HTTP 长连接 keepalive、SSE 错误协议
**真实场景**：你已经能让 SSE 流起来了，但生产环境里要做日志、鉴权、超时、错误归一化 —— 都靠中间件。

#### 0-1 零基础前置
- 跑通过一个最小 Express 应用：`app.get('/hello', (req,res)=>res.send('hi'))`。
- 没跑过的话：[Express 5 分钟入门（中文）](https://www.expressjs.com.cn/starter/hello-world.html)。

#### 必读材料
1. [Express 路由指南（中文）](https://www.expressjs.com.cn/guide/routing.html)
2. [Express 中间件入门（中文）](https://www.expressjs.com.cn/guide/using-middleware.html) — 重点理解 `(req, res, next)` 三参签名。
3. [Express 编写自己的中间件（中文）](https://www.expressjs.com.cn/guide/writing-middleware.html)
4. [MDN: HTTP Connection 头](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Connection)
5. [MDN: HTTP Keep-Alive 头](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Keep-Alive)
6. [Node.js HTTP 文档 — keepAlive 选项](https://nodejs.org/api/http.html#new-agentoptions)
7. [HTML 规范：SSE 字段定义（含 `event: error` 用法）](https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream)

#### 动手练习
- 写一个**链式中间件**：`requestId → auth → rateLimit → handler`，让 4 个文件各导出一个中间件函数。
- 把簇 1 的 SSE demo 包到这条链上：在 `auth` 失败时不要抛 500，而是发一条 `event: error\ndata: {"code":"UNAUTHORIZED"}\n\n`，再 `res.end()`。
- 用 `curl -v` 观察响应头里 `Connection: keep-alive` 的差异；再用 `curl --http1.0` 强制关闭长连接，观察 SSE 行为。

#### 自检
- [ ] 能画出 Express 中间件的"洋葱模型"。
- [ ] 能解释 `next(err)` 与 `throw err` 在异步函数里的区别。
- [ ] 知道为什么 SSE 端点里**不能**用普通的全局错误中间件返回 JSON。

---

### 簇 3（q-06）：git 底层 + shell 严格模式

**覆盖知识点**：git plumbing 命令、shell `set -e` / `pipefail`、git stash -u 语义
**真实场景**：写一个"自动 commit + push"的脚本，结果在某些机器上静默失败 —— 都是 shell 错误处理 + git stash 的坑。

#### 0-1 零基础前置
- 会用 `git add / commit / push / pull`。
- 在 Windows 上**强烈建议安装 [Git Bash](https://git-scm.com/downloads/win) 或 WSL**，PowerShell 的 shell 语义和 bash 差别很大。

#### 必读材料
1. [Pro Git（中文）— 第 10 章 Git 内部原理](https://git-scm.com/book/zh/v2/Git-%E5%86%85%E9%83%A8%E5%8E%9F%E7%90%86-%E5%BA%95%E5%B1%82%E5%91%BD%E4%BB%A4%E4%B8%8E%E4%B8%8A%E5%B1%82%E5%91%BD%E4%BB%A4) — 重点看"底层命令 vs 上层命令"。
2. [git-stash 官方手册](https://git-scm.com/docs/git-stash) — 重点看 `-u`（include untracked）和 `pop` 的语义。
3. [Bash Reference Manual — Set Builtin](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html) — 找 `-e`、`-u`、`-o pipefail`。
4. [Aaron Maxwell — Use the Unofficial Bash Strict Mode](http://redsymbol.net/articles/unofficial-bash-strict-mode/) — 一篇文章学完"shell 严格模式"。
5. [ShellCheck 在线版](https://www.shellcheck.net/) — 把你写的脚本贴进去自动挑刺。

#### 动手练习
- 写一个 `safe-commit.sh`：
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  IFS=$'\n\t'
  git status --porcelain
  git add -A
  git commit -m "$1"
  ```
  故意去掉 `set -e`，把 `git commit` 换成会失败的命令，观察脚本是否"假成功"。
- 在仓库里建一个 untracked 文件，运行 `git pull` 制造冲突，再用 `git stash -u` / `git stash pop` 恢复 —— 全程不丢文件。
- 用 `git cat-file -p HEAD` 看一次 commit 对象的内容（plumbing 体感）。

#### 自检
- [ ] 能说清 `set -e` 在管道里**默认不生效**，要靠 `pipefail` 才能传播错误。
- [ ] 能解释 `git stash` 默认**不会**保存 untracked 文件，要 `-u`。
- [ ] 知道 `git commit` 实际上调用了哪几个 plumbing 命令（hash-object / write-tree / commit-tree / update-ref）。

---

## 阶段 B：前端架构与可靠性

### 簇 4（q-10）：React Hooks 单一职责 + Zustand

**覆盖知识点**：Hook 单一职责、Zustand selector/slice、依赖方向设计
**真实场景**：项目里有一个 500 行的 `useChatPage`，又拉数据又管表单又做校验，改一行就崩 —— 怎么拆？

#### 0-1 零基础前置
- 用过 `useState`、`useEffect`，知道"重渲染"的概念。
- 没用过 Zustand 没关系，它比 Redux 简单 10 倍。

#### 必读材料
1. [React 官方文档（中文）— 复用逻辑的自定义 Hook](https://zh-hans.react.dev/learn/reusing-logic-with-custom-hooks) — **必看**，整章。
2. [React 官方文档 — useState / useEffect / useReducer 对比](https://zh-hans.react.dev/reference/react/hooks)
3. [Dan Abramov — Why Do Hooks Rely on Call Order?](https://overreacted.io/why-do-hooks-rely-on-call-order/) — 解释为什么不能在 if 里写 hook。
4. [Zustand 官方仓库 README](https://github.com/pmndrs/zustand) — 5 分钟读完。
5. [Zustand 文档 — selector 与 shallow 对比](https://zustand.docs.pmnd.rs/guides/auto-generating-selectors)
6. [Zustand 文档 — slice 模式](https://zustand.docs.pmnd.rs/guides/slices-pattern) — 大 store 怎么拆。

#### 动手练习
- 找一个混合 hook（自己写一个 ~80 行的 `useUserDashboard`，里面同时做 fetch + 表单 + 校验），按"数据生命周期"拆成 `useUserData / useUserForm / useUserValidate` 三个，依赖方向单向：表单依赖数据、校验依赖表单。
- 用 Zustand 写两个 slice：`authSlice` 和 `chatSlice`，用 selector 让 `<AuthBar/>` 只在登录态变化时重渲染（用 React DevTools Profiler 验证）。
- 写最小单测：用 [Vitest](https://cn.vitest.dev/guide/) + [@testing-library/react-hooks 替代品 renderHook](https://testing-library.com/docs/react-testing-library/api/#renderhook) 测试 `useUserForm` 的 reset 行为。

#### 自检
- [ ] 能说出 hook 拆分的 3 个信号（参数太多、useEffect 太多、单测难写）。
- [ ] 能解释为什么 `useStore(s => s.user)` 比 `useStore().user` 性能更好。
- [ ] 能画出"UI → hook → store → service"的依赖箭头。

---

### 簇 5（q-09）：postMessage 安全 + 状态机思维 + AbortController

**覆盖知识点**：postMessage origin 校验、状态机/有限状态自动机、AbortController 取消语义
**真实场景**：在主页面里嵌一个预览 iframe，用户切换标签后旧请求还在飞回来覆盖新内容。

#### 0-1 零基础前置
- 知道什么是 iframe；用过 `addEventListener('message', ...)` 一次。

#### 必读材料
1. [MDN: Window.postMessage（中文）— 含安全章节](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage) — 重点看"安全问题"小节。
2. [OWASP — HTML5 Security Cheat Sheet（搜索 postMessage）](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
3. [MDN: AbortController（中文）](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
4. [MDN: AbortSignal — 含 fetch 集成示例](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)
5. [XState — Statecharts in 15 Minutes](https://stately.ai/docs/xstate) → 同时看一遍 [Visualizer 在线编辑器](https://stately.ai/editor)。
6. [React 官方文档 — useReducer](https://zh-hans.react.dev/reference/react/useReducer) — 不引第三方也能写状态机。

#### 动手练习
- 把一个用了 3 个 `setInterval` + 多个 `useEffect` 的小组件，重构成一个 `useReducer` 状态机，状态显式列出：`idle / loading / streaming / error / done`。
- 写一个 iframe 预览 demo：父子页 `postMessage`，**两侧都校验 `event.origin`**；再加一个 `inflightToken`，每次发请求前自增，回调里比对 token，丢弃过期响应。
- 把 fetch 用 `AbortController` 包一层，切换 tab 时调用 `controller.abort()`，验证 Network 面板里请求确实被 cancel。

#### 自检
- [ ] 能说出 `postMessage(msg, '*')` 的危险，以及"双向校验 origin"的具体写法。
- [ ] 能列举状态机相比"一堆 boolean flag"的 3 个好处。
- [ ] 能说清 `AbortController` 取消的 fetch 和"超时 setTimeout 后忽略结果"的本质区别。

---

### 簇 6（q-08）：vite base + nginx 反向代理

**覆盖知识点**：vite base/publicPath、反向代理 host/path、构建产物路径无关性
**真实场景**：本地 `npm run dev` 一切正常，部署到 `https://xxx.com/qpilot/` 子路径下，`/assets/index-abc.js` 404。

#### 0-1 零基础前置
- 用过 Vite 跑过 React 模板（`npm create vite@latest`）。

#### 必读材料
1. [Vite 官方文档（中文）— 公共基础路径](https://cn.vitejs.dev/guide/build.html#public-base-path) — `base` 选项。
2. [Vite 官方文档 — 部署静态站点](https://cn.vitejs.dev/guide/static-deploy.html)
3. [nginx 文档：proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) — **重点看**末尾有没有 `/` 的差别。
4. [nginx 文档：sub_filter](https://nginx.org/en/docs/http/ngx_http_sub_module.html) — 实在改不了前端时用它打补丁。
5. [Digital Ocean — How To Set Up nginx Reverse Proxy](https://www.digitalocean.com/community/tutorials/how-to-set-up-nginx-as-a-reverse-proxy)（英文，对反代头 `X-Forwarded-Host` 讲得清楚）。

#### 动手练习
- 用 Vite 创建一个项目，`vite.config.ts` 设 `base: '/qpilot/'`，跑 `npm run build`，把 `dist/` 挂到 nginx `location /qpilot/`，修复 404。
- 故意把 `base` 配错，观察 `index.html` 里 `<script src="...">` 路径变化。
- 给一个简单的 deploy 脚本加 stderr tail 面板：`npm run build 2>&1 | tee build.log`，前端读取最近 200 行展示。
- 阅读你公司项目里 `nginx.conf` 中带 `proxy_pass` 的那几行，画出请求路径变换：浏览器 `/qpilot/api/x` → nginx → 后端 `/api/x`。

#### 自检
- [ ] 能说清 `proxy_pass http://up;` 与 `proxy_pass http://up/;` 的路径处理差异。
- [ ] 能解释为什么 SPA 部署到子路径需要 `base` + `<BrowserRouter basename>` 双改。
- [ ] 知道"构建产物路径无关性"为什么是个伪命题（运行时总要解析 `<base href>` 或 import.meta.url）。

---

## 阶段 C：后端与基础设施

### 簇 7（q-05）：Redis 缓存与降级

**覆盖知识点**：Redis 故障与降级、缓存一致性模型、异步双写与队列
**真实场景**：Redis 挂了 30 秒，整个系统不能 503，得自动回落 Postgres 直查。

#### 0-1 零基础前置
- 在本机用 Docker 跑过一次 Redis：`docker run -p 6379:6379 redis`。
- 用过 `SET key value` / `GET key`。如果没有，先看 [Try Redis 在线交互](https://try.redis.io/)。

#### 必读材料
1. [Redis 官方文档 — Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) — RDB / AOF 区别。
2. [Redis 官方文档 — Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
3. [Redis 官方文档 — Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/) — 故障切换。
4. [Martin Kleppmann《Designing Data-Intensive Applications》](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/) — 第 5 章 Replication（**强烈建议买正版纸质书**；中文版《数据密集型应用系统设计》O'Reilly 中文站有售）。免费章节摘要：[作者博客](https://martin.kleppmann.com/2017/03/27/designing-data-intensive-applications.html)。
5. [AWS Cache-Aside Pattern](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/Strategies.html#Strategies.LazyLoading) — 读路径模板。
6. [ioredis 仓库 README](https://github.com/redis/ioredis) — Node.js 主流客户端。

#### 动手练习
- 用 ioredis 写一个 `cacheGet(key, loader)`：先 `GET`，miss 就调 `loader()` 写回 Redis 再返回；遇到 ECONNREFUSED 直接调 `loader()` 不抛错。
- 在 docker 里 `docker stop redis` 模拟挂掉，观察请求是否平稳降级；恢复后验证缓存能继续填充。
- 加一条 BullMQ 队列做"异步双写"：写 Postgres 成功后投递任务，worker 异步刷 Redis —— [BullMQ 文档](https://docs.bullmq.io/)。

#### 自检
- [ ] 能说出"读穿透 / 写穿透 / 雪崩"3 种缓存事故及对应防御。
- [ ] 能解释为什么"先删缓存再写库"和"先写库再删缓存"都不能完全保证一致。
- [ ] 知道 Redis Sentinel 与 Cluster 的核心区别。

---

### 簇 8（q-03）：Linux 沙箱（容器隔离 + 适配器）

**覆盖知识点**：Linux 容器隔离、适配器模式、供应商可替换性
**真实场景**：用户给 AI 一段代码让它跑，你不能跑在自家服务器上 —— 要扔进沙箱。今天用 e2b，明天可能换 Cloudflare，怎么不锁死？

#### 0-1 零基础前置
- 用过一次 `docker run -it ubuntu bash`。没有的话先做 [Docker 官方 10 分钟入门](https://docs.docker.com/get-started/)。

#### 必读材料
1. [e2b 官方文档 — Sandbox 概念](https://e2b.dev/docs) — 重点看 lifecycle、filesystem、process 三类 API。
2. [Linux man-pages: namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) — 7 种 namespace。
3. [Linux man-pages: cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html) — CPU/内存配额。
4. [Julia Evans — What even is a container?](https://jvns.ca/blog/2016/10/10/what-even-is-a-container/) — 用大白话解释容器。
5. [Refactoring Guru — Adapter Pattern（中文）](https://refactoringguru.cn/design-patterns/adapter)
6. （进阶）[firecracker microVM 简介](https://firecracker-microvm.github.io/) — AWS Lambda 用的轻量虚拟化。

#### 动手练习
- 设计一个 TS 接口：
  ```ts
  interface Sandbox {
    exec(cmd: string): Promise<{stdout:string; stderr:string; code:number}>;
    readFile(p: string): Promise<string>;
    writeFile(p: string, c: string): Promise<void>;
    dispose(): Promise<void>;
  }
  ```
  写两个实现：`DockerSandbox`（用 `docker exec`）和 `MockSandbox`（内存模拟）。业务代码只依赖接口。
- 把同一段业务测试，分别注入两个实现，跑同一份测试文件 —— 体会"供应商可替换"。
- 进阶：用 `unshare --pid --net --mount sh` 自己造一个迷你 namespace 隔离环境（仅 Linux）。

#### 自检
- [ ] 能说出 Docker 容器和虚拟机的本质区别（共享内核）。
- [ ] 能解释适配器模式与策略模式的区别。
- [ ] 能列出"换沙箱供应商"时哪些假设会被打破（文件系统持久化、网络、并发数）。

---

### 簇 9（q-04）：对象池 与 warm pool

**覆盖知识点**：分层镜像/初始化、对象池模式、动态扩缩策略
**真实场景**：每次 AI 任务起一个新沙箱要 3 秒冷启动，用户等不及 —— 预先 warm 5 个备用。

#### 0-1 零基础前置
- 做完簇 8（沙箱），有一个能 `create()` 出实例的 `SandboxFactory`。

#### 必读材料
1. [Apache Commons Pool — 文档首页](https://commons.apache.org/proper/commons-pool/) → [设计概念](https://commons.apache.org/proper/commons-pool/apidocs/org/apache/commons/pool2/impl/GenericObjectPool.html) — 经典对象池 API。
2. [generic-pool（Node.js 版）](https://github.com/coopernurse/node-pool) — JS 同学直接读这个 README。
3. [Cloudflare 博客 — How Workers Works（含 Isolate / warm 概念）](https://blog.cloudflare.com/cloud-computing-without-containers/)
4. [AWS Lambda — Provisioned Concurrency 文档](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html) — 工业级 warm pool。
5. [Martin Fowler — Object Pool Pattern](https://martinfowler.com/bliki/ObjectPool.html)（短文）

#### 动手练习
- 用 `generic-pool` 包装簇 8 的 `DockerSandbox`，初始 5 个 warm 实例，`acquire()` / `release()`。
- 写一个压测脚本：100 次顺序 acquire，对比"每次新建 vs 池命中"的 P50/P99（用 `console.time` 或 [autocannon](https://github.com/mcollina/autocannon)）。
- 加策略：**实例使用 N 次后销毁**（防内存泄漏积累），跑一晚上观察 RSS 是否平稳。
- 加策略：根据 acquire 等待队列长度动态扩缩（队列 > 3 就 +1，空闲 30s 就 -1）。

#### 自检
- [ ] 能说出对象池的 3 个核心配置（min / max / idleTimeout）。
- [ ] 能解释为什么 warm pool 不能简单等于"提前 new 一堆对象"。
- [ ] 知道 Lambda Provisioned Concurrency 与 K8s HPA 在扩缩思路上的差别。

---

## 阶段 D：AI Agent 专项

### 簇 10（q-02）：MCP 协议 + Tool use

**覆盖知识点**：MCP 协议核心、Tool-use 协议、错误归一化模式
**真实场景**：让 Claude 帮你读本地文件、调你的 API —— 标准做法是 MCP Server + Tool use。

#### 0-1 零基础前置
- 用过一次 Anthropic API（或 OpenAI 也行），知道 `messages` 数组结构。
- 没有的话：[Anthropic 快速上手（5 分钟）](https://docs.anthropic.com/en/docs/get-started)。

#### 必读材料
1. [Model Context Protocol — 官方主页](https://modelcontextprotocol.io/)
2. [MCP Specification（最新版）](https://modelcontextprotocol.io/specification/) — 重点看 Tools / Resources / Prompts 三类 capability。
3. [MCP — Build a server quickstart（TypeScript）](https://modelcontextprotocol.io/quickstart/server)
4. [MCP TypeScript SDK 仓库](https://github.com/modelcontextprotocol/typescript-sdk)
5. [Anthropic — Tool use 指南](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
6. [Anthropic — Messages API 参考](https://docs.anthropic.com/en/api/messages)
7. [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification) — MCP 底层协议。

#### 动手练习
- 用 MCP TS SDK 写最小 server，暴露 `read_file(path)` / `write_file(path, content)` 两个工具。
- 装 [Claude Desktop](https://claude.ai/download) → 编辑配置文件加这个 server，对话里说"帮我读 /tmp/a.txt"，验证工具被调用。
- 故意让工具抛 `ENOENT`、`EACCES`、超时 3 类错误，统一包装成 `{ ok: false, code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'TIMEOUT', message }` —— 这就是"错误归一化"。
- 给图谱里提到的 `mcp-catalog` 项目（如果存在你的工作区）新增一个 `list_dir` 工具，跑通 `tool_use → tool_result` 全链路。

#### 自检
- [ ] 能画出一次 Tool use 调用的 4 步：模型返回 `tool_use` block → 客户端执行 → 把 `tool_result` 回喂模型 → 模型继续生成。
- [ ] 能说清 MCP 与"自定义 HTTP API"相比的优势（标准 schema、跨客户端复用、能力发现）。
- [ ] 能写一个统一的错误码表，覆盖网络/权限/参数三类。

---

### 簇 11（q-11）：OpenTelemetry + Langfuse 可观测性

**覆盖知识点**：OTel Span/Attribute、W3C Trace Context、LLM 可观测性指标
**真实场景**：用户说"这次回答慢了 8 秒"，你得能定位是 LLM 慢、还是 tool 慢、还是网络慢。

#### 0-1 零基础前置
- 知道日志、指标、链路追踪的区别。可以先看 [OTel 官方 — Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)。

#### 必读材料
1. [OpenTelemetry 官方文档 — Concepts](https://opentelemetry.io/docs/concepts/) — Span / Trace / Attribute 基础。
2. [OTel — Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
3. [W3C Trace Context 规范](https://www.w3.org/TR/trace-context/) — 重点看 `traceparent` / `tracestate` 头格式。
4. [OTel JavaScript 入门](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
5. [Langfuse 官方文档](https://langfuse.com/docs)
6. [Langfuse — OpenTelemetry 集成](https://langfuse.com/docs/opentelemetry/get-started)
7. [Anthropic SDK + OTel 示例](https://github.com/Arize-ai/openinference) — OpenInference 是 LLM 语义约定的事实标准。

#### 动手练习
- 在簇 2 的 Express + 簇 10 的 Tool use 项目里接入 OTel SDK：手动创建一个 root span 包住整个请求。
- 在 LLM 调用前后用 `tracer.startActiveSpan('llm.call', ...)` 记录 input/output token、latency。
- 同时把 traces 推到 Langfuse Cloud（免费版够用），验证 Langfuse 里看到的 trace_id 与 OTel collector 里**完全一致**。
- 故意 `await new Promise(r => setTimeout(r, 9000))` 让一次 LLM 调用超时，看 trace 瀑布图能不能一眼定位卡点。
- 在 SSE 响应头里手动写入 `traceparent`，让浏览器侧也能拼上链路。

#### 自检
- [ ] 能背出 `traceparent` 头的 4 段：`version-traceId-spanId-flags`。
- [ ] 能列出 LLM 必埋的 5 个 attribute：model、prompt_tokens、completion_tokens、latency、cost。
- [ ] 能解释为什么"打日志带 trace_id"是最便宜的可观测性升级。

---

### 簇 12（q-07）：Feature Flag + 权限分层 + Blast Radius

**覆盖知识点**：Blast radius 思维、Feature flag 模式、前后端权限分层
**真实场景**：要给 5% 内测用户开"代码自动改写"功能；万一出问题只能炸 5%，不能炸全量。

#### 0-1 零基础前置
- 知道 JWT 鉴权、前端路由守卫的概念。

#### 必读材料
1. [Martin Fowler — Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) — **必看全文**，区分 Release / Experiment / Ops / Permission 四类 toggle。
2. [LaunchDarkly — Best practices for feature flags](https://docs.launchdarkly.com/guides/flags/feature-flag-hierarchy)
3. [Unleash 官方文档](https://docs.getunleash.io/) — 开源 feature flag 平台。
4. [OWASP Cheat Sheet — Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — **必看**，重点看"Deny by Default"和"Server-Side Enforcement"。
5. [OWASP — Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
6. [Google SRE Book — Reliable Product Launches at Scale（含 blast radius 概念）](https://sre.google/sre-book/reliable-product-launches/)

#### 动手练习
- 在 Express 项目里实现"双闸门"：
  - 闸门 1：feature flag（hardcoded 一个 `flags.json` 文件就够，5% 用户哈希命中）。
  - 闸门 2：白名单（DB 表 `allowed_users`）。
  - **前端**根据 flag 隐藏入口；**后端**只信白名单（**不能信前端**）。
- 给某个表单字段做"双态 UI"：A 组旧版、B 组新版，用同一个 flag 控制；做一个埋点对比改造前后用户的困惑度（点击次数 / 错误率）。
- 故意把后端白名单注释掉，看前端隐藏入口是否还能"防住"通过 curl 直接打 API 的人 —— 体会"前端只是 UX，后端才是安全"。
- 写一份"开关下线 checklist"：发布 → 灰度 5% → 50% → 100% → 移除代码里的 flag 分支。

#### 自检
- [ ] 能说清"前端 flag 隐藏 ≠ 权限控制"。
- [ ] 能列举 4 类 feature toggle 及典型生命周期。
- [ ] 能用一句话定义 blast radius，并说出 3 种缩小它的工程手段（灰度、熔断、隔离）。

---

## 全局自检：12 个一句话问题

走完全部 12 簇后，对自己提以下问题，每题口头 30 秒答出来即合格：

1. SSE 报文为什么必须 `\n\n` 结尾？
2. Express 里 `next(err)` 和 `throw err` 在 async 函数里的差别？
3. `set -euo pipefail` 各个 flag 分别防什么？
4. 自定义 hook 拆分的判断标准？
5. `postMessage` 三大安全坑？
6. Vite `base` 没配会怎样？
7. Redis 挂了如何不让请求 503？
8. Docker 容器为什么"轻"？
9. 对象池的 min/max/idleTimeout 怎么定？
10. 一次 Tool use 的 4 步报文？
11. `traceparent` 头长啥样？
12. Feature flag 与 Authorization 各自的边界？

---

## 学习效率 Tips

- **先做 demo 再读规范**：每个簇都从"最小可运行"开始，不要把规范从头读到尾。
- **每周写一篇 200 字小结**：用自己话写"这周学了什么 / 哪里还卡"，是最便宜的检索机制。
- **善用浏览器 Network / DevTools Performance 面板**：很多概念（SSE、keepalive、abort）肉眼可见。
- **遇到英文文档别躲**：MCP / OTel / Langfuse 中文资料还很少，借助浏览器自带翻译就行。
- **Windows 同学**：sandbox / nginx / shell 部分**强烈建议在 [WSL2](https://learn.microsoft.com/zh-cn/windows/wsl/install) 里做**，省去 90% 的环境坑。

---

> 学完后把每个簇下的 `[ ]` 勾上，回到 `knowledge-map.zh.md` 把对应知识点也勾上，就完成了一次完整的复盘。
