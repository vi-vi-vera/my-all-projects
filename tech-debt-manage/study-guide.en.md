# 技术负债治理管理平台 — Beginner Study Guide

> Companion: `knowledge-map.en.md`
> Audience: you can write a little JS/TS, but most of the project's core concepts still feel like "heard of, never built"
> Goal: by following this guide end to end, you cover every topic in the knowledge map

---

## 0. How to use this guide

Walk down phase by phase, cluster by cluster. Each cluster gives you a real-world scenario, a list of must-read links (clickable), a few hands-on exercises, and three self-check questions.

Aim for one or two clusters per day. Do the hands-on first, then the spec. Use the self-check at the end of each cluster to gate yourself; only move on once you can answer all three.

| Phase | Clusters | Keywords |
|---|---|---|
| Phase A: 菜单如何从接口生成 | `c-route` | 动态菜单与启动等待 |
| Phase B: 列表、统计和 Excel | `c-table` | 通用表格与批量导入 |
| Phase C: 会话、权限和监控 | `c-request` | 请求结果、权限和监控 |
| Phase D: 静态资源如何发布 | `c-release` | 镜像构建与环境更新 |

---

## Phase A: 菜单如何从接口生成

### Cluster 1 (c-route): 动态菜单与启动等待

**Covered topics**: 动态路由, React.lazy, 顶层 await, 路由稳定性, 渐进渲染

**Scenario**: 打开后台时，侧栏不是写死的。你要看懂专项接口如何变成路由，以及接口慢或失败时页面停在哪里。

#### Must Read

1. [React Router 概览](https://reactrouter.com/6.30.1/start/overview)
2. [React.lazy](https://react.dev/reference/react/lazy)
3. [顶层 await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

#### Hands-On

- 用一份 JSON 生成两级菜单，未知类型落到兜底页
- 把接口延迟调到 3 秒，观察整页是否被顶层等待堵住

#### Self Check

- [ ] moduleId 为 99 时除了首页还有哪两条路由？
- [ ] 为什么失败后要判断当前是不是已经在错误页？
- [ ] 先渲染壳子再补菜单，会先遇到哪个路由问题？

---

## Phase B: 列表、统计和 Excel

### Cluster 1 (c-table): 通用表格与批量导入

**Covered topics**: 配置驱动界面, 受控分页, Redux Toolkit, SheetJS, 文件校验, 上传体积, 服务端分页, 一次拉全量

**Scenario**: 多个专项共用一张表。你要分清哪些状态属于表格，哪些导入导出逻辑必须留在专项页面。

#### Must Read

1. [TDesign Table](https://tdesign.tencent.com/react/components/table)
2. [Redux Toolkit 快速开始](https://redux-toolkit.js.org/tutorials/quick-start)
3. [SheetJS 文档](https://docs.sheetjs.com/)

#### Hands-On

- 配置三列和两个筛选项，确认重置后页码回到第一页
- 导入一个缺列表格，确认提交请求没有发出

#### Self Check

- [ ] fetchAllAtOnce 适合哪类数据，不适合哪类数据？
- [ ] 为什么解析 Excel 不放进 CommonTable？
- [ ] 网关允许的上传体积能说明接口超时也够用吗？

---

## Phase C: 会话、权限和监控

### Cluster 1 (c-request): 请求结果、权限和监控

**Covered topics**: Axios 拦截器, 登录态失效, 错误码映射, 伽利略, 环境隔离, Aegis, Cookie 会话, 开放重定向, 权限与登录分离

**Scenario**: HTTP 状态是 200 时业务仍可能失败。你要能区分登录过期、缺少权限，以及该去哪块监控里看。

#### Must Read

1. [Axios 拦截器](https://axios-http.com/docs/interceptors)
2. [Cookie 说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
3. [未校验跳转](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
4. [Aegis SDK](https://www.npmjs.com/package/aegis-web-sdk)

#### Hands-On

- 模拟 100001 和 100002 两种响应头，确认一个刷新、一个不跳转
- 在测试环境触发一次失败请求，并按环境找到对应监控应用

#### Self Check

- [ ] trpc-func-ret 不在响应体里，拦截器应该读哪里？
- [ ] 为什么鉴权地址只接受 https？
- [ ] 前端监控能不能单独证明后端根因？

---

## Phase D: 静态资源如何发布

### Cluster 1 (c-release): 镜像构建与环境更新

**Covered topics**: Orange CI, Nginx SPA, 镜像发布

**Scenario**: 这个仓库构建出静态文件。你要看懂测试为什么自动更新，正式为什么停在企业微信提醒。

#### Must Read

1. [Vite 构建](https://vitejs.dev/guide/build.html)
2. [Nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
3. [Docker 概述](https://docs.docker.com/get-started/introduction/)

#### Hands-On

- 本地执行正式构建，确认产物是 dist 而不是 Node 服务
- 刷新一个不存在的前端子路径，确认 Nginx 配置会回到 index.html

#### Self Check

- [ ] test 分支和 master 分支在更新负载上有什么差别？
- [ ] 镜像推送成功为什么不代表正式页面已经切换？
- [ ] client_max_body_size 解决的是哪一类请求？

---

## Global Self Check: 4 one-line questions

1. (c-route) 专项列表失败时，菜单是空的还是进入错误页？
2. (c-table) 新增专项时，哪些逻辑应该写成配置，哪些应该留成回调？
3. (c-request) 登录过期和缺少权限，页面下一步为什么不能一样？
4. (c-release) 正式环境要回滚时，你根据镜像标签的哪几段找到提交？

---

## Learning Tips

- 先读 projects.ts 的请求和 componentMap，再打开具体专项页面。
- CommonTable 只追分页、排序和回调，不要一开始读全部列配置。
- 用响应头里的业务码理解登录和权限，不要只看 HTTP 200。
- 发布问题时先核对负载镜像标签，再看构建日志。
- 2026 年移动端提交作者不是项目初始搭建者，学习时分开看。

