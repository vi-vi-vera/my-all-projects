# 宇恒运营管理系统 (yuheng-monorepo) — 知识图谱

> Mode: knowledge

---

## 📚 知识点全景

## 🔑 必须掌握（9 项）

### 1. pnpm workspace 与 Monorepo

> 关联维度：🏗️ `architecture`
> 出现于：`q-01`

#### 📖 必读材料

- [ ] pnpm 官方文档 - Workspace
- [ ] pnpm 官方文档 - Motivation (Why pnpm)
- [ ] Node.js 模块解析算法 (require.resolve)

#### 🛠️ 动手练习

- [ ] 创建 3 包 pnpm workspace 项目并配置依赖
- [ ] 对比 npm/yarn/pnpm 安装后的 node_modules 结构
- [ ] 使用 pnpm -F 命令精准构建单个包

---

### 2. 微前端架构模式

> 关联维度：🏗️ `architecture`
> 出现于：`q-02`, `q-09`

#### 📖 必读材料

- [ ] Micro Frontends 概念文档 (micro-frontends.org)
- [ ] qiankun 官方文档 - 设计理念
- [ ] Module Federation 官方文档

#### 🛠️ 动手练习

- [ ] 配置 Nginx 实现多 SPA 路由分发
- [ ] 搭建 qiankun 主应用 + 子应用 demo
- [ ] 实现 Module Federation 共享依赖 demo

---

### 3. Nginx 配置与优化

> 关联维度：⚡ `performance` 🏗️ `architecture`
> 出现于：`q-02`, `q-08`

#### 📖 必读材料

- [ ] Nginx 入门指南 (官方文档)
- [ ] Nginx location 匹配规则详解
- [ ] Linux sendfile/epoll 原理

#### 🛠️ 动手练习

- [ ] 配置 Nginx 部署 SPA 应用（try_files）
- [ ] 开启 gzip 并对比压缩前后体积
- [ ] 配置 Cache-Control 长缓存策略

---

### 4. Vite 构建工具

> 关联维度：⚡ `performance` `feature`
> 出现于：`q-01`, `q-06`

#### 📖 必读材料

- [ ] Vite 官方文档 - Why Vite
- [ ] Vite 官方文档 - Plugin API
- [ ] esbuild 官方文档 - Transform API

#### 🛠️ 动手练习

- [ ] 从零搭建 Vite + React/Vue 项目
- [ ] 配置 Vite 开发代理和环境变量
- [ ] 编写一个简单的 Vite 插件

---

### 5. TypeScript 严格模式

> 关联维度：🛡️ `reliability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] TypeScript Handbook - Strict Mode
- [ ] TypeScript Deep Dive - Compiler Options
- [ ] tsconfig.json 完全指南

#### 🛠️ 动手练习

- [ ] 将一个 JS 项目迁移到 TypeScript strict mode
- [ ] 修复 strictNullChecks 引入的类型错误
- [ ] 配置 path aliases 并验证跨包类型推导

---

### 6. ESLint 多框架配置

> 关联维度：🛡️ `reliability` ⚖️ `trade-off`
> 出现于：`q-03`, `q-05`

#### 📖 必读材料

- [ ] ESLint 官方文档 - Overrides
- [ ] eslint-plugin-vue 文档
- [ ] eslint-plugin-react 文档

#### 🛠️ 动手练习

- [ ] 配置支持 Vue + React 的 ESLint 规则
- [ ] 编写自定义 ESLint 规则
- [ ] 配置 Prettier 与 ESLint 集成

---

### 7. tsup 与库打包

> 关联维度：🏗️ `architecture`
> 出现于：`q-06`

#### 📖 必读材料

- [ ] tsup 官方文档
- [ ] package.json exports 规范 (Node.js)
- [ ] ESM vs CJS 模块系统对比

#### 🛠️ 动手练习

- [ ] 使用 tsup 打包多入口 TypeScript 库
- [ ] 配置 exports 子路径导出并验证 Tree Shaking
- [ ] 对比 tsup/rollup/webpack 打包产物

---

### 8. Docker 容器化部署

> 关联维度：⚡ `performance` 🏗️ `architecture`
> 出现于：`q-04`, `q-08`

#### 📖 必读材料

- [ ] Docker 官方文档 - Dockerfile Best Practices
- [ ] Docker 多阶段构建
- [ ] Docker 层缓存原理

#### 🛠️ 动手练习

- [ ] 编写 Dockerfile 部署 Node.js 应用
- [ ] 实现 node_modules 缓存层优化
- [ ] 对比不同 COPY 顺序对缓存的影响

---

### 9. CI/CD 流水线设计

> 关联维度：⚡ `performance` 🛡️ `reliability`
> 出现于：`q-04`

#### 📖 必读材料

- [ ] CI/CD 概念入门
- [ ] GitHub Actions / GitLab CI 文档
- [ ] 增量构建策略设计

#### 🛠️ 动手练习

- [ ] 配置完整 CI 流水线 (lint→test→build→deploy)
- [ ] 实现基于文件变更的增量触发
- [ ] 配置 Docker 镜像自动构建和推送

---

## ⭐ 加分项（6 项）

### 10. Git Hooks 与提交规范

> 关联维度：🛡️ `reliability`
> 出现于：`q-05`

#### 📖 必读材料

- [ ] Husky 官方文档 (v8)
- [ ] Conventional Commits 规范
- [ ] lint-staged 原理

#### 🛠️ 动手练习

- [ ] 从零配置 Husky + lint-staged + CommitLint
- [ ] 自定义 CommitLint 规则
- [ ] 模拟绕过 hook 并验证 CI 兜底

---

### 11. Web Vitals 与前端监控

> 关联维度：👁️ `observability`
> 出现于：`q-07`

#### 📖 必读材料

- [ ] Web Vitals 官方文档 (web.dev)
- [ ] Performance API (MDN)
- [ ] 前端错误监控最佳实践

#### 🛠️ 动手练习

- [ ] 接入 Sentry 或类似 SDK 到 SPA 应用
- [ ] 手动实现 JS 错误捕获和上报
- [ ] 使用 Lighthouse 分析页面性能

---

### 12. CSS 隔离方案

> 关联维度：🔒 `security` 🏗️ `architecture`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] CSS Modules 规范
- [ ] BEM 方法论
- [ ] Shadow DOM 与 Web Components

#### 🛠️ 动手练习

- [ ] 在 Vite 项目中配置 CSS Modules
- [ ] 实现 CSS 变量主题切换
- [ ] 对比 CSS Modules vs styled-components vs Tailwind

---

### 13. 架构演进与技术选型

> 关联维度：⚖️ `trade-off` 🏗️ `architecture`
> 出现于：`q-10`

#### 📖 必读材料

- [ ] Turborepo 官方文档 - Why Turborepo
- [ ] Module Federation 实践指南
- [ ] Changesets 文档

#### 🛠️ 动手练习

- [ ] 在现有 pnpm workspace 中集成 Turborepo
- [ ] 搭建 Module Federation 微前端 demo
- [ ] 配置 Changesets 版本管理

---

### 14. Vue 3 Composition API

> 关联维度：`feature`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] Vue 3 Composition API FAQ
- [ ] Pinia 官方文档
- [ ] Vue Router 4 导航守卫

#### 🛠️ 动手练习

- [ ] 使用 Composition API 重构 Options API 组件
- [ ] 实现 Pinia Store 的模块化设计
- [ ] 配置 Vue Router 全局前置守卫

---

### 15. React Hooks 与 Redux Toolkit

> 关联维度：`feature`
> 出现于：`q-03`

#### 📖 必读材料

- [ ] React Hooks 官方文档
- [ ] Redux Toolkit 官方教程
- [ ] React Router 6 嵌套路由

#### 🛠️ 动手练习

- [ ] 使用 createSlice 实现状态管理
- [ ] 用 createAsyncThunk 处理异步请求
- [ ] 实现 React Router 6 权限路由
