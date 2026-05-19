# QQ频道H5 (guild_h5) — 零基础学习指引

> 配套文档：`knowledge-map.zh.md`
> 适合人群：有前端基础，想了解 Hybrid H5 + MPA + 移动端监控的开发者

## 0. 学习路线

| 阶段 | 主题 | 关键词 |
|------|------|--------|
| A | MPA 架构与 Vite | 多入口, manualChunks, 代码分割 |
| B | Hybrid H5 开发 | JSBridge, mqq, 多平台适配 |
| C | 性能与监控 | 预请求, Oceanus, Aegis, 埋点 |
| D | 样式与主题 | 暗黑模式, CSS 变量, TailwindCSS |
| E | 部署与工程化 | Docker, STKE, OrangeCI, 多环境 |

---

## 阶段 A：MPA 架构与 Vite

### 簇 1：Vite MPA 多页面实战
**场景**：管理 63 个独立业务页面，各自独立构建部署。
- 📖 [Vite 多入口配置](https://vitejs.dev/guide/build.html#multi-page-app) / vite-plugin-mpa
- 🛠️ 创建 3 页面 MPA 项目 / 配置 manualChunks / 分析构建产物
- ✅ 自检：MPA vs SPA 适用场景？manualChunks 怎么避免重复打包？

---

## 阶段 B：Hybrid H5 开发

### 簇 2：JSBridge 与原生交互
**场景**：H5 运行在 QQ WebView 内，需要控制原生导航栏和分享。
- 📖 JSBridge 原理（URL Scheme / 注入对象）/ iOS vs Android 差异
- 🛠️ 实现简易 JSBridge / 封装 bridge 为 Promise / 处理 ready 时序
- ✅ 自检：JSBridge 的底层通信机制？iOS WKWebView 和 UIWebView 的区别？

### 簇 3：移动端多平台适配
**场景**：支持 iOS/Android/Mac/Win 四端，处理键盘/安全区/viewport。
- 📖 Viewport meta / safe-area-inset / 移动端 1px 问题
- 🛠️ 实现 rem 适配方案 / 处理 iOS 键盘顶起 / 安全区适配
- ✅ 自检：env(safe-area-inset-bottom) 怎么用？iOS 键盘顶起的根本原因？

---

## 阶段 C：性能与监控

### 簇 4：请求预取优化
**场景**：白屏时间长，需要将数据请求前置到 HTML 加载阶段。
- 📖 浏览器渲染流水线 / Critical Rendering Path / preload vs prefetch
- 🛠️ 在 index.html 中插入预请求 inline script / 对比有无预取的 FCP
- ✅ 自检：预取和正式请求的竞态如何处理？适用边界在哪？

### 簇 5：四通道监控体系
**场景**：需要覆盖错误/性能/业务/行为四个维度的监控。
- 📖 OpenTelemetry 概念 / Web Vitals / 前端埋点方案
- 🛠️ 接入 Sentry / 实现 PV/UV 上报 / 配置行为埋点
- ✅ 自检：链路追踪和性能监控的区别？如何避免上报影响性能？

---

## 阶段 D：样式与主题

### 簇 6：暗黑模式实现
**场景**：支持系统暗黑 + QQ 客户端主题通知 + 增值自定义主题色。
- 📖 prefers-color-scheme / CSS Custom Properties / Design Token
- 🛠️ 实现 CSS 变量日夜切换 / TailwindCSS dark:class 配置
- ✅ 自检：主题切换闪烁(FOUC)怎么解决？CSS 变量和 Less 变量区别？

---

## 阶段 E：部署与工程化

### 簇 7：Docker + Nginx + CI/CD
**场景**：构建产物部署到 K8s 集群，支持四环境自动化。
- 📖 Dockerfile 最佳实践 / Nginx 静态部署 / K8s 基本概念
- 🛠️ 编写前端 Dockerfile / 配置 Nginx alias / 多环境 Vite 配置
- ✅ 自检：Nginx location 和 alias 的区别？CDN 缓存如何版本化？

---

## 🎯 全局自检

- [ ] 能否用三种时长介绍这个项目？
- [ ] 能否画出从 QQ 客户端打开 H5 到数据展示的完整链路？
- [ ] 能否说出 Hybrid H5 与纯 Web H5 的三个核心区别？
- [ ] 能否解释请求预取如何与 Vue 生命周期配合？
