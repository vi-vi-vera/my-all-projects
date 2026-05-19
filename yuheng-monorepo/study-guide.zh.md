# 宇恒运营管理系统 (yuheng-monorepo) — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：有 1-2 年前端经验，想系统理解 Monorepo + 微前端 + 工程化体系的开发者
> 目标：面试时能从容讲述项目架构、技术选型和实践细节

---

## 0. 怎么使用这份指引

| 阶段 | 主题 | 簇 | 关键词 |
|------|------|-----|--------|
| A | 包管理与工程基础 | pnpm · TypeScript · 代码规范 | workspace, strict mode, ESLint |
| B | 构建工具与打包 | Vite · tsup | esbuild, ESM/CJS, exports |
| C | 微前端与部署 | 微前端 · Nginx · Docker | 路由分发, try_files, 层缓存 |
| D | CI/CD 与监控 | CI/CD · 前端监控 | ifModify, Aegis, Web Vitals |
| E | 架构设计与演进 | CSS 隔离 · 架构演进 | Module Federation, Turborepo |

**学习节奏**：阶段 A-B 是面试必备（1-2 周），C-D 是加分项（1 周），E 是高阶（3-5 天）。

---

## 阶段 A：包管理与工程基础

### 簇 1（c-pnpm）：pnpm workspace Monorepo 实战

**覆盖知识点**：pnpm workspace 与 Monorepo

**真实场景**：你需要管理一个包含 10+ 子应用和 4 个公共包的大型前端项目，各包之间有依赖关系，需要统一安装、精准构建。

#### 0-1 零基础前置

- Node.js 基础（npm install/package.json）
- 了解 npm/yarn 的基本用法

#### 必读材料

1. [pnpm 官方文档 - Workspace](https://pnpm.io/workspaces)
2. [pnpm 官方文档 - Motivation](https://pnpm.io/motivation)
3. [Node.js 模块解析算法](https://nodejs.org/api/modules.html#all-together)

#### 动手练习

1. 创建一个 3 包 workspace 项目（1 个 app + 2 个 lib），配置 workspace 协议引用
2. 运行 pnpm install 后用 find 命令观察 node_modules 目录结构，对比 npm 的扁平结构
3. 使用 pnpm -F=<lib-name> run build 单独构建一个包
4. 在 package.json 中添加 preinstall 脚本阻止 npm install

#### 自检

- [ ] 能否解释 pnpm 的 content-addressable store 工作原理？
- [ ] workspace:* 协议在构建和发布时分别是什么行为？
- [ ] 为什么 pnpm 的非扁平 node_modules 能避免幽灵依赖？

---

### 簇 2（c-typescript）：TypeScript 严格模式实战

**覆盖知识点**：TypeScript 严格模式

**真实场景**：你在一个开启了 strict mode 的 TypeScript Monorepo 中工作，需要理解各严格选项的意义并处理常见类型错误。

#### 0-1 零基础前置

- JavaScript ES6+ 基础
- TypeScript 基础语法（type/interface/generic）

#### 必读材料

1. [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
2. [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

#### 动手练习

1. 将一个 JS 文件逐步迁移到 TypeScript strict mode，记录遇到的每个类型错误及解决方式
2. 配置 tsconfig path aliases 并验证 IDE 跳转和类型推导
3. 在 packages/shared 中定义类型，在 apps 中验证跨包类型推导是否正常

#### 自检

- [ ] strictNullChecks 开启后，可选属性和 undefined 如何正确处理？
- [ ] noUnusedLocals 报错时，如果变量确实需要声明但暂时未使用怎么办？
- [ ] 如何配置 tsconfig 继承（extends）实现 Monorepo 下的配置复用？

---

### 簇 3（c-lint）：全链路代码规范体系搭建

**覆盖知识点**：ESLint 多框架配置, Git Hooks 与提交规范

**真实场景**：你要为一个多框架（Vue + React）Monorepo 项目搭建完整的代码规范和 Git Hooks 体系。

#### 0-1 零基础前置

- ESLint 基本用法
- Git 基本操作

#### 必读材料

1. [ESLint 官方文档 - Configuration (overrides)](https://eslint.org/docs/latest/use/configure/configuration-files#how-do-overrides-work)
2. [Husky 官方文档](https://typicode.github.io/husky/)
3. [Conventional Commits 规范](https://www.conventionalcommits.org/)

#### 动手练习

1. 从零配置 ESLint overrides 支持 .vue 和 .tsx 文件的不同规则
2. 安装 Husky + lint-staged + CommitLint，验证 pre-commit 和 commit-msg hooks
3. 故意提交不合规 commit message，观察 commitlint 拦截行为
4. 配置 cspell 自定义词典，添加项目特有术语

#### 自检

- [ ] ESLint overrides 的优先级是怎样的？后面的 override 会覆盖前面的吗？
- [ ] lint-staged 如何做到只对暂存文件执行检查？
- [ ] 如果有人用 --no-verify 绕过 hooks，有什么兜底方案？

---

## 阶段 B：构建工具与打包

### 簇 4（c-vite）：Vite 构建工具深入理解

**覆盖知识点**：Vite 构建工具

**真实场景**：你在使用 Vite 4 作为开发和构建工具，需要理解其核心机制以便自定义配置和排查问题。

#### 必读材料

1. [Vite 官方文档 - Why Vite](https://vitejs.dev/guide/why.html)
2. [Vite 官方文档 - Dep Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
3. [esbuild 官方文档](https://esbuild.github.io/)

#### 动手练习

1. 从零创建 Vite + React 项目，观察 dev server 的 ES Module 加载方式
2. 配置 Vite proxy 代理后端 API，并添加环境变量配置
3. 分析 Vite build 产物的 chunk 分割策略
4. 编写一个简单的 Vite 插件（如自动注入版本号）

#### 自检

- [ ] Vite dev server 为什么不需要打包？它是如何处理 node_modules 依赖的？
- [ ] esbuild 预构建的作用是什么？什么时候会触发重新预构建？
- [ ] Vite 生产构建用的是什么工具？为什么不用 esbuild？

---

### 簇 5（c-tsup）：tsup 库打包与子路径导出

**覆盖知识点**：tsup 与库打包

**真实场景**：你需要为 Monorepo 中的公共包设计打包方案，要求支持 ESM/CJS 双格式、多入口和 Tree Shaking。

#### 必读材料

1. [tsup 官方文档](https://tsup.egoist.dev/)
2. [Node.js - Packages (exports field)](https://nodejs.org/api/packages.html#exports)
3. [ESM vs CJS 深度对比](https://blog.logrocket.com/commonjs-vs-es-modules-node-js/)

#### 动手练习

1. 使用 tsup 配置多入口（constants/utils/types）打包
2. 在 package.json 中配置 exports 字段映射子路径
3. 验证消费方 `import { x } from '@pkg/constants'` 的 Tree Shaking 效果
4. 配置 dts: true 生成类型声明并验证 IDE 类型提示

#### 自检

- [ ] ESM 的 import 和 CJS 的 require 在运行时有什么区别？
- [ ] package.json 的 exports 字段与 main/module 字段的关系？
- [ ] Tree Shaking 需要满足什么前提条件才能生效？

---

## 阶段 C：微前端与部署

### 簇 6（c-microfrontend）：微前端架构设计与实践

**覆盖知识点**：微前端架构模式

**真实场景**：你需要为 10 个独立子应用设计微前端架构，要求独立开发部署、技术栈自由、低运行时开销。

#### 必读材料

1. [Micro Frontends 概念](https://micro-frontends.org/)
2. [qiankun 官方文档](https://qiankun.umijs.org/zh/guide)
3. [Module Federation 概念](https://webpack.js.org/concepts/module-federation/)

#### 动手练习

1. 用 Nginx 配置 2 个 SPA 应用的路由分发
2. 搭建 qiankun 主应用 + 2 个子应用 demo
3. 搭建 Vite Module Federation 示例

#### 自检

- [ ] Nginx 路由分发 vs qiankun vs Module Federation 各自优缺点？
- [ ] 微前端的 JS 沙箱有哪些实现方式？
- [ ] 子应用间如何安全地共享全局状态？

---

### 簇 7（c-nginx）：Nginx 配置与 SPA 部署

**覆盖知识点**：Nginx 配置与优化

#### 必读材料

1. [Nginx 入门指南](https://nginx.org/en/docs/beginners_guide.html)
2. [Nginx location 匹配规则](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)

#### 动手练习

1. 配置 Nginx 部署一个 SPA（try_files）
2. 配置 gzip 压缩并验证
3. 为静态资源配置长缓存
4. 配置 HTTP/2

#### 自检

- [ ] try_files 的三个参数分别匹配什么？
- [ ] Nginx location 的匹配优先级？
- [ ] sendfile + tcp_nopush 组合的优化原理？

---

### 簇 8（c-docker）：Docker 容器化与层缓存

**覆盖知识点**：Docker 容器化部署

#### 必读材料

1. [Docker - Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
2. [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)

#### 动手练习

1. 编写 Dockerfile：先 COPY package.json 再 COPY 源码
2. 对比 COPY 顺序对缓存命中率的影响
3. 实现多阶段构建（build + production）
4. 对比 alpine vs 普通镜像大小

#### 自检

- [ ] Dockerfile 中每条指令如何影响层缓存？
- [ ] 为什么先 COPY package.json 能提升缓存命中率？
- [ ] Alpine 镜像的优势和潜在问题？

---

## 阶段 D：CI/CD 与监控

### 簇 9（c-cicd）：CI/CD 流水线设计

**覆盖知识点**：CI/CD 流水线设计

#### 动手练习

1. 配置 lint → test → build → deploy 完整流水线
2. 实现基于 git diff 的增量构建触发
3. 配置 Docker 缓存层
4. 添加构建通知

#### 自检

- [ ] 增量构建如何判断哪些包需要重新构建？
- [ ] CI 缓存有哪些层次？
- [ ] 如何设计分支策略保证主干稳定？

---

### 簇 10（c-monitoring）：前端监控与 Web Vitals

**覆盖知识点**：Web Vitals 与前端监控

#### 动手练习

1. 接入 Sentry 到 SPA 应用
2. 手动实现错误捕获上报
3. 使用 web-vitals 库采集指标
4. 配置 Source Map 上传

#### 自检

- [ ] FCP、LCP、CLS、FID 分别衡量什么？
- [ ] Script Error 的原因和解决方案？
- [ ] 监控 SDK 如何做采样？

---

## 阶段 E：架构设计与演进

### 簇 11（c-css-isolation）：微前端样式隔离实战

**覆盖知识点**：CSS 隔离方案

#### 动手练习

1. 配置 CSS Modules
2. 用 CSS 变量实现主题切换
3. 模拟类名冲突并解决
4. 尝试 Shadow DOM 封装

#### 自检

- [ ] CSS Modules 编译后的类名格式？如何调试？
- [ ] Vue scoped 的实现原理？
- [ ] Shadow DOM 为什么不适合大多数微前端场景？

---

### 簇 12（c-evolution）：架构演进与技术选型

**覆盖知识点**：架构演进与技术选型

#### 动手练习

1. 在 pnpm workspace 中集成 Turborepo
2. 搭建 Module Federation demo
3. 配置 Changesets 版本管理
4. 编写 Vitest 单元测试

#### 自检

- [ ] Turborepo Remote Cache 的原理？
- [ ] Module Federation vs Nginx 路由分发的适用场景？
- [ ] 如何评估架构升级的 ROI？

---

## 🎯 全局自检

- [ ] 能否用一句话、30 秒、3 分钟三种方式介绍这个项目？
- [ ] 能否画出从 git push 到用户看到页面的完整链路？
- [ ] 能否说出项目最大的三个技术亮点和三个待改进点？
- [ ] 能否对比至少两种微前端方案并给出选型建议？
- [ ] 能否解释 pnpm → Vite → tsup → Nginx 这条工具链中每一环的作用？

---

## 💡 学习 Tips

1. 每个簇按「读 → 做 → 查」的顺序学习：先读材料理解原理，再动手实践，最后用自检题验证理解
2. 不需要一次学完所有簇，按阶段逐步推进，阶段 A-B 是面试必备，C-D 是加分项，E 是高阶
3. 动手练习时尽量在 yuheng-monorepo 真实代码上操作，这样面试时能直接举例
4. 自检题如果不能流畅回答，说明需要回去重新阅读材料
5. 面试前重点复习 project_pitch 的三个版本（elevator / standard / deep_dive），做到脱口而出
