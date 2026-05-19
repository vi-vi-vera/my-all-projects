# 宇恒运营管理系统 (yuheng-monorepo) — 面试备战材料

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | 标识 |
|------|------|------|
| 🏗️ architecture | 3 | q-01, q-02, q-06 |
| ⚡ performance | 2 | q-04, q-08 |
| 🛡️ reliability | 1 | q-05 |
| 🔒 security | 1 | q-09 |
| 👁️ observability | 1 | q-07 |
| ⚖️ trade-off | 2 | q-03, q-10 |

---

## 🎯 项目自我介绍

### 一句话（简历版）

QQ 运营管理系统前端 Monorepo 大仓，使用 pnpm workspace 管理 10 个微前端子应用和 4 个公共包，支持 Vue 3 + React 双框架并行开发，通过 OrangeCI 实现增量构建与 Docker 容器化部署。

### 标准（30–60 秒）

宇恒是小世界前端团队负责的 QQ 运营管理系统，采用 pnpm workspace Monorepo 架构统一管理 10 个子应用。架构上是微前端模式——React 基座负责全局路由和权限，各子应用（包括 Vue 3 和 React）独立开发部署。公共层抽象了 4 个 npm 包：shared（常量/类型/配置）、utils、components 和 theme-chalk，通过 tsup 打包成 ESM/CJS 双格式。工程化方面从 ESLint + Prettier + CommitLint 到 Husky + lint-staged 全链路覆盖，CI 使用 OrangeCI 实现按文件变更范围增量构建，Docker + Nginx Alpine 容器化部署，前端监控通过 Aegis SDK 接入。

### 深挖（2–3 分钟）

<details>
<summary>展开详细版本</summary>

宇恒运营管理系统是 QQ 业务线的核心运营后台，服务于多个运营团队的日常管理需求。项目采用 pnpm workspace Monorepo 架构，包含 10 个子应用（base-framework 基座、qq-copilot AI 助手、lucy 运营工具、qq-bff-gateway 网关管理、qq-qun 群管理等）和 4 个公共包。

架构核心是微前端模式：base-framework 作为 React 基座负责统一的登录认证、权限管理和全局导航，各子应用通过 Nginx 路由分发实现路径隔离（try_files 保证 SPA 路由 fallback）。部署时 scripts/cp-dist.js 聚合所有子应用的构建产物到统一 dist 目录，Docker 镜像基于 Nginx Alpine 提供服务。

技术选型上的特殊点是 Vue 3 和 React 17 共存——lucy 和 qq-bff-gateway 使用 Vue 3 + Pinia + TDesign Vue Next，其余 React 子应用使用 Redux Toolkit + TDesign React。通过 ESLint overrides 分层处理不同框架的 lint 规则，公共包层只导出框架无关代码保证解耦。

CI/CD 方面使用 OrangeCI，核心优化是增量构建——通过 ifModify 检测文件变更范围，只触发受影响子应用的构建流水线；packages 变更则全量构建。cache.dockerfile 缓存 node_modules 层避免重复安装。CR 通过后自动 rebase 合并并通过企微机器人通知。

工程化体系覆盖完整：TypeScript 5.2.2 strict mode 保障类型安全，CommitLint 规范提交信息，ls-lint 统一文件命名，cspell 检查拼写，preinstall 钩子强制使用 pnpm 避免混用包管理器。前端监控通过 Aegis SDK 采集 Web Vitals 和错误上报。

</details>

---

## ✨ 项目亮点

1. **🏗️ pnpm workspace Monorepo 管理 10+ 子应用** — `pnpm` `workspace` `monorepo` `tsup` `esbuild`
   > 使用 pnpm workspace 统一管理 10 个子应用和 4 个公共包，workspace 协议实现本地依赖链接，preinstall 钩子强制统一包管理器，tsup 多入口打包公共包支持 ESM/CJS 双格式输出

2. **🏗️ 微前端：Nginx 路由分发 + React 基座** — `微前端` `Nginx` `try_files` `SPA` `路由分发`
   > React 基座管理全局认证与导航，Nginx try_files 实现多子应用路径隔离与 SPA fallback，构建产物聚合脚本实现统一部署

3. **⚖️ Vue 3 + React 双框架共存** — `Vue 3` `React 17` `TDesign` `ESLint overrides`
   > 同一 Monorepo 下 Vue 3 和 React 17 并行，ESLint overrides 分层配置，TDesign 统一设计语言，公共包层框架无关保证解耦

4. **⚡ OrangeCI 增量构建 + Docker 容器化** — `OrangeCI` `增量构建` `Docker` `Nginx Alpine` `ifModify`
   > ifModify 按文件变更范围精准触发子应用构建，cache.dockerfile 缓存 node_modules 加速，Docker Nginx Alpine 轻量部署

5. **🛡️ 全链路工程化规范体系** — `ESLint` `CommitLint` `Husky` `TypeScript strict`
   > ESLint + Prettier + CommitLint + Husky + lint-staged + ls-lint + cspell 覆盖从编码到提交全链路，TypeScript strict mode 保障类型安全

---

## 🏗️ 架构（architecture）— 3 题

### Q1. 请介绍这个项目的 Monorepo 架构是如何设计的？为什么选择 pnpm workspace？

> 来源：`tp-001` · scope: infra · sub_project: root

#### 知识点

| 知识点 | 重要度 |
|--------|--------|
| pnpm content-addressable store | 核心 |
| hard link vs symlink | 核心 |
| workspace 协议 | 核心 |
| 非扁平 node_modules | 核心 |
| 幽灵依赖 | 核心 |
| tsup 多入口打包 | 辅助 |

#### 标准答案

项目采用 pnpm workspace Monorepo 架构，pnpm-workspace.yaml 声明 apps/*、packages/*、templates/* 三个包范围。选择 pnpm 的核心原因：一是 content-addressable store + hard link 使安装速度比 npm/yarn 快 2-3 倍、磁盘节省 50%+；二是非扁平 node_modules 杜绝幽灵依赖；三是原生 workspace 协议 (workspace:*) 无需额外工具即可链接本地包；四是 filter 命令 (pnpm -F=<pkg>) 精准执行命令便于 CI 增量构建。公共包通过 tsup 打包成 ESM/CJS 双格式供子应用引用。

#### 深度答案

<details>
<summary>展开</summary>

Monorepo 架构分为三层：应用层（apps/ 下 10 个子应用）、公共包层（packages/ 下 4 个包：shared 导出常量/类型/工具/配置、utils 导出工具方法、components 导出公共组件、theme-chalk 导出主题样式）、模板层（templates/）。

选择 pnpm 而非 yarn/lerna/turborepo 的决策分析：
1. **依赖安装效率**：pnpm 使用全局 content-addressable store，相同版本的包只存储一份，通过 hard link 引用
2. **依赖安全性**：非 hoist 模式从根源避免幽灵依赖
3. **workspace 协议**：`"@infras/shared": "workspace:*"` 开发时直接链接源码
4. **CI 友好**：`pnpm -F=./apps/qq-copilot run build` 可精准构建单个包

对比：Lerna 已停维护；Yarn hoist 可能导致意外引用未声明依赖；Turborepo 引入额外学习成本，当前规模 pnpm workspace 已够。

</details>

#### 学习计划

- 📖 必读：pnpm 官方文档 - Workspace / Motivation / Node.js 模块解析算法
- 🛠️ 动手：创建 3 包 workspace 项目 / 对比 node_modules 结构 / 配置 tsup 多入口
- ⚠️ 易错点：workspace:* 在 CI 中需先 build packages / pnpm store 路径配置影响缓存
- ⏱️ 预计时间：3-5 天

#### 追问

- pnpm 的 shamefully-hoist 和 public-hoist-pattern 配置有什么作用？
- 如果包数量增长到 50+，当前方案需要做什么调整？

---

### Q2. 微前端架构是如何设计的？基座和子应用之间如何协作？

> 来源：`tp-002` · scope: frontend · sub_project: base-framework

#### 知识点

| 知识点 | 重要度 |
|--------|--------|
| 微前端架构模式 | 核心 |
| Nginx 路由配置 | 核心 |
| try_files | 核心 |
| SPA fallback | 核心 |
| 样式隔离 | 辅助 |
| JS 沙箱 | 辅助 |

#### 标准答案

微前端采用「基座 + Nginx 路由分发」模式。base-framework（React）作为基座负责统一登录、权限校验、全局导航。各子应用独立开发独立构建，构建产物通过 cp-dist.js 脚本聚合到统一 dist/ 目录。Nginx 配置 location 按路径匹配到对应子应用的静态资源，try_files 保证 SPA 路由 fallback。子应用间通过公共包 @infras/shared 共享类型和常量，基座通过 URL 参数传递上下文。优势是零运行时开销、技术栈自由，劣势是无 JS 沙箱隔离。

#### 深度答案

<details>
<summary>展开</summary>

选型考量：我们选择最轻量的 Nginx 路由分发而非 qiankun/Module Federation——子应用间业务耦合度低、用户一次只访问一个、避免沙箱框架的复杂度。

部署架构：用户请求 → Nginx (80端口) → 按 location 分发到 /base-framework、/qq-copilot、/lucy 等子目录。

构建流程：CI build → cp-dist.js 聚合 → Dockerfile COPY /dist → Nginx 服务。

Nginx 关键配置：`try_files $uri $uri/ /index.html` 保证刷新不 404，gzip + sendfile 优化传输。

通信方案：类型共享通过 @infras/shared 构建时链接，运行时通过 URL params 传递。

不足：无 CSS 隔离（依赖 BEM + CSS Modules）、无 JS 沙箱、未来可考虑 Module Federation。

</details>

#### 学习计划

- 📖 必读：Micro Frontends 概念 / Nginx location 规则 / qiankun vs MF 对比
- 🛠️ 动手：配置 Nginx 多 SPA 路由分发 / 搭建微前端 demo
- ⏱️ 预计时间：5-7 天

---

### Q6. 公共包是如何设计和打包的？子路径导出是如何实现的？

> 来源：`tp-006` · scope: frontend · sub_project: packages/shared

#### 知识点

| 知识点 | 重要度 |
|--------|--------|
| tsup | 核心 |
| esbuild | 核心 |
| package.json exports | 核心 |
| ESM/CJS 双格式 | 核心 |
| Tree Shaking | 核心 |

#### 标准答案

@infras/shared 使用 tsup（底层 esbuild）打包，按职责拆分为 4 个子模块（constants/types/utils/configs），每个是独立入口点，通过 package.json exports 字段映射子路径。使用时 `import { xxx } from '@infras/shared/constants'` 精准引入，支持 Tree Shaking。tsup 输出 ESM/CJS 双格式 + .d.ts 类型声明。

#### 学习计划

- 📖 必读：tsup 文档 / Node.js exports 规范 / esbuild 文档
- 🛠️ 动手：tsup 多入口打包 / 配置 exports 并验证 Tree Shaking
- ⏱️ 预计时间：2-3 天

---

## ⚡ 性能（performance）— 2 题

### Q4. CI/CD 流程是怎样的？增量构建是如何实现的？

> 来源：`tp-004` · scope: infra · sub_project: ci

#### 标准答案

CI 平台使用 OrangeCI，核心流程：MR 提交 → 安装依赖 → CommitLint → ESLint → 按范围构建 → Docker → CDN → 部署。增量构建通过 ifModify 实现：声明每个子应用的触发路径（如 apps/qq-copilot/**），MR 文件变更匹配该路径时才触发对应构建。packages/** 变更触发全量构建。cache.dockerfile 预构建 node_modules 缓存层，安装时间从 3-5 分钟降到 10 秒。CR 通过后自动 rebase 合并 + 企微通知。

#### 学习计划

- 📖 必读：Docker 多阶段构建 / CI/CD 概念 / Nginx 最佳实践
- 🛠️ 动手：编写 Dockerfile 缓存 node_modules / 配置增量触发
- ⏱️ 预计时间：3-5 天

---

### Q8. Nginx 是如何配置的？SPA 路由和性能优化分别怎么做？

> 来源：`tp-011` · scope: infra · sub_project: root

#### 标准答案

核心配置：(1) `try_files $uri $uri/ /index.html` SPA fallback；(2) location 按路径前缀映射子应用；(3) `gzip on` 压缩；(4) `sendfile on + tcp_nopush on` 零拷贝；(5) `keepalive_timeout 1500` 长连接；(6) `worker_processes 2 + epoll` 高并发。

---

## 🛡️ 可靠性（reliability）— 1 题

### Q5. 项目的代码规范和质量保障体系是怎样的？

> 来源：`tp-007` · scope: infra · sub_project: root

#### 标准答案

四层保障：(1) 编码阶段：ESLint + Prettier + TypeScript strict；(2) 文件命名：ls-lint + cspell；(3) 提交阶段：Husky pre-commit → lint-staged，commit-msg → CommitLint；(4) CI 阶段：全量 ESLint + 类型检查 + 构建。preinstall 通过 `npx only-allow pnpm` 强制统一包管理器。

---

## 🔒 安全（security）— 1 题

### Q9. 微前端环境下样式隔离是怎么做的？

> 来源：`tp-015` · scope: frontend · sub_project: root

#### 标准答案

多层策略：(1) CSS Modules（.module.less，编译时 hash）；(2) BEM + 子应用命名空间前缀；(3) Vue scoped style；(4) theme-chalk 统一 CSS 变量。实际遇到 TDesign 弹窗挂载 body 导致样式冲突，通过配置 attach 容器解决。

---

## 👁️ 可观测性（observability）— 1 题

### Q7. 前端监控是如何接入的？

> 来源：`tp-008` · scope: frontend · sub_project: root

#### 标准答案

使用 @tencent/aegis-web-sdk，监控：(1) Web Vitals（FCP/LCP/CLS/FID）；(2) JS 错误 + Promise 异常；(3) API 请求成功率和耗时；(4) 自定义事件打点。微前端场景下基座和子应用使用不同实例（不同 PROJECT_ID），SPA 模式自动上报路由切换 PV。

---

## ⚖️ 权衡（trade-off）— 2 题

### Q3. Vue 3 和 React 共存是怎么管理的？

> 来源：`tp-003` · scope: frontend · sub_project: root

#### 标准答案

历史演进导致双框架（早期 Vue 3 → 后期 React）。管理策略：ESLint overrides 分层配置 .vue/.tsx；TDesign 统一设计系统；公共包只导出框架无关代码；每个子应用独立 vite.config 和 tsconfig。Trade-off：技术栈自由 vs 维护成本高、新人上手慢、公共组件难复用。

---

### Q10. 如果重新设计架构，你会做什么改变？

> 来源：`tp-002` · scope: fullstack · sub_project: root

#### 标准答案

优先级排序：(1) Turborepo（Remote Cache 最高 ROI）；(2) 完善测试体系（Vitest + Testing Library）；(3) Module Federation（运行时共享减少包体积）；(4) 统一框架到 React；(5) Changesets 管理版本和 Changelog。当前阶段迁移成本 > 维持现状，所以通过工程化手段管理共存是务实选择。
