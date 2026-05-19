# QQ频道H5静态页面仓库 (guild_h5) — 面试备战材料

> Mode: candidate · Role: 前端 · Level: 中级

## 📊 维度覆盖统计

| 维度 | 数量 | 标识 |
|------|------|------|
| 🏗️ architecture | 2 | q-01, q-02 |
| ⚡ performance | 1 | q-03 |
| 🛡️ reliability | 1 | q-06 |
| 🔒 security | 1 | q-08 |
| 👁️ observability | 1 | q-04 |
| ⚖️ trade-off | 1 | q-07 |
| ✨ feature | 1 | q-05 |

---

## 🎯 项目自我介绍

### 一句话（简历版）

QQ 频道所有 H5 页面的统一仓库，基于 Vite MPA 多页面架构管理 63 个独立业务页面，运行在 QQ 客户端 WebView 环境，通过 mqq bridge 深度适配原生交互，支持完整暗黑模式和四通道监控体系。

### 标准（30–60 秒）

guild_h5 是 QQ 频道的 H5 静态页面统一仓库，使用 Vue 3 + TypeScript + Vite 2.7 构建，采用 MPA 多页面架构管理 63 个独立业务页面（频道创建、排行榜、运营活动等）。项目深度适配 QQ 客户端 WebView——通过 mqq bridge 控制导航栏、分享和设备交互，支持 iOS/Android/Mac/Win 四端。样式方案采用 TailwindCSS + Less 混合，实现了完整的暗黑模式和 QQ 增值主题。监控覆盖四通道：Oceanus 链路追踪 + Aegis 性能 + 大同数据上报 + Atta 行为上报。部署采用 OrangeCI + Docker + STKE(K8s)，支持 dev/test/pre/prod 四环境自动化。

### 深挖（2–3 分钟）

<details>
<summary>展开详细版本</summary>

guild_h5 是 QQ 频道业务线的核心 H5 页面仓库，承载了频道从创建到运营的全部移动端页面需求。项目包含 63 个独立业务页面，通过 vite-plugin-mpa 实现多页面应用架构。

核心设计：(1) MPA 架构——每个页面独立入口/路由/状态，按需构建，manualChunks 提取公共依赖；(2) Hybrid 深度适配——mqq bridge 控制原生导航栏/分享/设备交互，hooks 封装简化开发；(3) 暗黑模式——useDarkMode + useGuildThemeToken 支持系统主题/QQ 增值自定义主题/CSS 变量切换；(4) 请求预取——HTML inline script 阶段发起核心请求，Vue 挂载后直接消费缓存，减少 200-500ms 白屏；(5) 四通道监控——Oceanus/Aegis/大同/Atta 分别覆盖链路/性能/业务/行为；(6) CI/CD——OrangeCI 四分支四环境，Docker+STKE 部署。

</details>

---

## ✨ 项目亮点

1. **🏗️ Vite MPA 多页面架构管理 63 个业务页面** — `Vite MPA` `多入口` `代码分割` `按需构建`
2. **🏗️ QQ 客户端 Hybrid H5 深度适配** — `Hybrid` `mqq` `JSBridge` `多平台`
3. **✨ 暗黑模式 + QQ 增值自定义主题** — `暗黑模式` `CSS变量` `主题Token`
4. **⚡ 请求预取减少白屏 200-500ms** — `预请求` `白屏优化` `缓存`
5. **👁️ 四通道监控全覆盖** — `Oceanus` `Aegis` `大同` `Atta`

---

## 🏗️ 架构 — 2 题

### Q1. 为什么选择 MPA 多页面架构而不是 SPA？

> 来源：`tp-001` · scope: frontend

**标准答案**：63 个页面分属不同业务线互不关联，从 QQ 客户端不同入口打开是独立页面场景，SPA 会导致不必要耦合和巨大 bundle。vite-plugin-mpa 扫描入口，manualChunks 提取公共依赖为 vendor chunk，页面间共享浏览器缓存。

### Q2. Hybrid H5 如何与 QQ 客户端交互？

> 来源：`tp-002` · scope: frontend

**标准答案**：QQ 注入 window.mqq 对象提供 JSBridge。导航栏控制、ARK 分享、设备信息获取等通过 bridge 调用。封装为 useNavBar 等 hooks。兼容性：iOS/Android 回调时序不同，低版本 QQ 需降级。

---

## ⚡ 性能 — 1 题

### Q3. 请求预取如何实现？

> 来源：`tp-005` · scope: frontend

**标准答案**：index.html inline script 在页面加载时发起 fetch 请求，结果存全局变量。Vue mount 后 API 层先检查缓存，命中则直接使用（90%+ 命中率）。数据请求与 JS 下载并行，减少 200-500ms 白屏。

---

## 👁️ 可观测性 — 1 题

### Q4. 四通道监控各自职责？

> 来源：`tp-004` · scope: frontend

**标准答案**：Oceanus 管 CGI 链路追踪，Aegis 管性能（Web Vitals + JS 错误），大同管业务指标（DAU/转化率），Atta 管行为埋点（曝光/点击）。技术问题→Oceanus+Aegis，业务问题→大同+Atta。

---

## ✨ 功能 — 1 题

### Q5. 暗黑模式方案设计？

> 来源：`tp-003` · scope: frontend

**标准答案**：三层——系统级 prefers-color-scheme + QQ bridge 通知；组件级 CSS 变量日夜间切换；增值主题 RGB Token 动态覆盖。TailwindCSS dark:class 配合。

---

## 🛡️ 可靠性 — 1 题

### Q6. CI/CD 和多环境管理？

> 来源：`tp-006` · scope: infra

**标准答案**：四分支映射四环境——master(tag)→正式、test→测试(自动)、bugfix/*→预发布(自动)、release/*→分支环境。Git Hooks 防误合并。Docker+STKE 部署。

---

## ⚖️ 权衡 — 1 题

### Q7. TailwindCSS 和 Less 为什么混用？

> 来源：`tp-015` · scope: frontend

**标准答案**：Tailwind 原子化 class 高效布局，Less 处理复杂组件样式，历史代码迁移成本高。Tailwind 低优先级不覆盖 Less，scoped/BEM 避免全局污染。

---

## 🔒 安全 — 1 题

### Q8. 请求层安全防护？

> 来源：`tp-010` · scope: frontend

**标准答案**：CSRF Token（从 cookie skey hash 计算 bkn）+ 请求重试 2 次 + 全局错误拦截 + loading 防重复提交。
