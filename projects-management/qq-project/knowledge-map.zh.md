# QQ 项目管理门户 (qq-project) — 知识图谱

> Mode: knowledge

## 📚 知识点全景

本图谱汇总 candidate 输出中的 `knowledge_points`，按掌握等级分组；每个知识点末尾标注关联维度与出处题目（反向索引），便于针对性补齐。


## 🔑 必须掌握（18 项）


### 1. Aegis V2 / 前端监控 SDK

> 关联维度：📈 `observability`
> 出现于：`q-06` · `iq-06`

#### 📖 必读材料

- [ ] src/hooks/useAegis.ts
- [ ] src/utils/request/index.ts 中 responseInterceptors
- [ ] Aegis V2 官方接入文档

#### 🛠️ 动手练习

- [ ] 实现一个最小 Aegis 上报封装，覆盖 onerror + axios 拦截器
- [ ] 为某个白名单接口跳过上报并验证降噪效果

---

### 2. Axios 拦截器与 transform hook

> 关联维度：🛡️ `reliability` · 📈 `observability`
> 出现于：`q-03` · `iq-03`

#### 📖 必读材料

- [ ] src/utils/request/index.ts 全文
- [ ] src/utils/request/axios-transform.ts
- [ ] Axios 官方拦截器与 transformRequest 文档

#### 🛠️ 动手练习

- [ ] 为 mock 后端写一个带重试和监控上报的 axios 封装
- [ ] 把 retcode != 0 接入 transformRequestHook 并自动上报

---

### 3. Cookie-based vs token-based 认证

> 关联维度：🔒 `security`
> 出现于：`q-09` · `iq-08`

#### 📖 必读材料

- [ ] 公司 TOF 认证接入文档
- [ ] src/utils/request/index.ts 中 401 分支

#### 🛠️ 动手练习

- [ ] 实现一个最小 401 拦截器，带 isRedirecting 防抖
- [ ] 对比 cookie 与 localStorage token 在 XSS 场景下的差异演示

---

### 4. Docker 多阶段 / cache 镜像

> 关联维度：🛡️ `reliability` · ⚡ `performance`
> 出现于：`q-10` · `iq-09`

#### 📖 必读材料

- [ ] Dockerfile 与 cache.dockerfile 对照阅读
- [ ] Docker 官方多阶段构建文档

#### 🛠️ 动手练习

- [ ] 把 cache.dockerfile 拆出 dev / prod 双版本
- [ ] 用 versioned tag 替换 latest 并验证回滚

---

### 5. Next.js Pages Router 与 ssr:false (NoSSR)

> 关联维度：⚖️ `trade-off` · 🏗️ `architecture`
> 出现于：`q-07` · `iq-07`

#### 📖 必读材料

- [ ] next.config.js 全文
- [ ] src/components/Dynamic.tsx
- [ ] src/pages/_app.tsx 与 _document.tsx
- [ ] Next.js 官方 dynamic 文档

#### 🛠️ 动手练习

- [ ] 用 next/dynamic 把一个组件改成 ssr:false
- [ ] 在 _document 里加一段静态资源预加载，验证不影响 NoSSR

---

### 6. OpenSpec 规格驱动开发

> 关联维度：🏗️ `architecture`
> 出现于：`q-04` · `iq-04`

#### 📖 必读材料

- [ ] openspec/AGENTS.md
- [ ] openspec/changes/add-view-management/proposal.md
- [ ] openspec/changes/add-view-management/design.md
- [ ] openspec/changes/add-view-management/specs/view-management/spec.md
- [ ] openspec/changes/add-view-management/tasks.md

#### 🛠️ 动手练习

- [ ] 按 OpenSpec 流程写一个『历史视图归档』小提案
- [ ] 把一个临时 issue 拆成 proposal/design/spec/tasks 四件套

---

### 7. Orange CI 分支策略与 secrets imports

> 关联维度：🛡️ `reliability`
> 出现于：`q-10` · `iq-09`

#### 📖 必读材料

- [ ] .orange-ci.yml 全文
- [ ] Orange CI 官方多分支与 imports 文档

#### 🛠️ 动手练习

- [ ] 为新分支策略加一个只跑 lint 的 job
- [ ] 排查一次 secrets imports 没继承导致的部署失败

---

### 8. React StrictMode 双 effect 模型

> 关联维度：⚖️ `trade-off` · 🛡️ `reliability`
> 出现于：`q-07` · `iq-07`

#### 📖 必读材料

- [ ] React 官方 StrictMode 与 useEffect 双触发文档
- [ ] next.config.js 中 reactStrictMode 配置说明

#### 🛠️ 动手练习

- [ ] 故意打开 reactStrictMode 观察 useEffect 双触发并修复一个 bug
- [ ] 排查一个 SDK 在双 init 下报错的最小复现

---

### 9. Zustand createWithEqualityFn / shallow

> 关联维度：🏗️ `architecture` · ⚡ `performance`
> 出现于：`q-02` · `iq-02`

#### 📖 必读材料

- [ ] Zustand 官方文档关于 selector 与 equalityFn 的章节
- [ ] src/store/useViewManageStore.ts
- [ ] src/store/index.ts

#### 🛠️ 动手练习

- [ ] 故意去掉 shallow 观察列表页 rerender 次数变化
- [ ] 为 useViewManageStore 加一个新 action 并保证浅比较仍然有效

---

### 10. humps camelize / decamelize 边界

> 关联维度：⚖️ `trade-off` · 🛡️ `reliability`
> 出现于：`q-03` · `q-08` · `iq-03`

#### 📖 必读材料

- [ ] humps 库 README 与已知 issue
- [ ] src/utils/request/index.ts 中 beforeRequestHook 部分

#### 🛠️ 动手练习

- [ ] 为某个 FormData 上传接口加 noTransform 跳过转换
- [ ] 写测试覆盖嵌套 5 层 body 的 camelize 正确性

---

### 11. 业务 retcode 与 HTTP 状态的差异

> 关联维度：📈 `observability` · 🛡️ `reliability`
> 出现于：`q-06` · `iq-06`

#### 📖 必读材料

- [ ] openspec/project.md 中接口契约段落
- [ ] src/utils/request/axios-transform.ts

#### 🛠️ 动手练习

- [ ] 为 mock 接口设计一组 retcode，并在前端区分『真错』『可预期失败』
- [ ] 把 retcode 上报字段标准化为 {msg, code, url, ext}

---

### 12. 前后端权限校验分工

> 关联维度：🔒 `security` · ⚖️ `trade-off`
> 出现于：`q-04` · `q-09` · `iq-04` · `iq-08`

#### 📖 必读材料

- [ ] src/store/useViewManageStore.ts 中 saveView 调用链
- [ ] src/components/NewBoard/BugPannel/ViewPush/index.tsx

#### 🛠️ 动手练习

- [ ] 为某按钮加 checkPermission 渲染禁用态
- [ ] 构造一个跨产品 viewId 越权场景并验证后端拦截

---

### 13. 前端 SSO 重定向与 redirectUrl 续接

> 关联维度：🔒 `security` · 🛡️ `reliability`
> 出现于：`q-09` · `iq-08`

#### 📖 必读材料

- [ ] src/utils/request/index.ts 中 SSO 跳转逻辑
- [ ] openspec/project.md 关于 External Dependencies 段落

#### 🛠️ 动手练习

- [ ] 为 SSO 跳转加 redirectUrl 参数并验证回跳
- [ ] 复现并修复一个 401 反复跳转的死循环

---

### 14. 前端重试策略与幂等性

> 关联维度：🛡️ `reliability` · ⚖️ `trade-off`
> 出现于：`q-03` · `iq-03`

#### 📖 必读材料

- [ ] src/utils/request/index.ts 中 responseInterceptorsCatch
- [ ] axios-retry 等社区方案的源码

#### 🛠️ 动手练习

- [ ] 为 POST 创建类接口加上幂等 token 设计
- [ ] 实现指数退避策略并对比固定 1 秒间隔

---

### 15. 状态域拆分 / Domain decomposition

> 关联维度：🏗️ `architecture`
> 出现于：`q-02` · `iq-02`

#### 📖 必读材料

- [ ] src/store/index.ts 入口文件
- [ ] src/store 下九个 store 的对照阅读

#### 🛠️ 动手练习

- [ ] 把一个 useState 驱动的本地组件改造成依赖某个 Zustand store
- [ ] 梳理 store 间显式调用关系，画一张依赖图

---

### 16. 递归分页 / 异步累加导出

> 关联维度：⚡ `performance` · ⚖️ `trade-off`
> 出现于：`q-05` · `iq-05`

#### 📖 必读材料

- [ ] src/hooks/useConfigManage.ts 全文
- [ ] src/utils/file.ts

#### 🛠️ 动手练习

- [ ] 实现一个 1 万行数据的导出，带 progress 提示
- [ ] 对比纯前端递归与 Web Worker 流式写盘的体感

---

### 17. 配置驱动 / Schema-driven UI

> 关联维度：🏗️ `architecture` · 🧩 `feature`
> 出现于：`q-01` · `iq-01`

#### 📖 必读材料

- [ ] src/materials/ 目录下任意一个 schema 文件
- [ ] .codebuddy/skills/config-page-development/SKILL.md

#### 🛠️ 动手练习

- [ ] 用现有 schema 结构新增一个简单配置页（如黑名单管理）
- [ ] 把一个老命令式列表页改造成 schema 驱动

---

### 18. 高阶组件与自定义 Hook 抽象 (useConfigCreate / useConfigManage)

> 关联维度：🏗️ `architecture`
> 出现于：`q-01` · `iq-01`

#### 📖 必读材料

- [ ] src/hooks/useConfigCreate.ts
- [ ] src/hooks/useConfigManage.ts
- [ ] src/components/power-design-react/

#### 🛠️ 动手练习

- [ ] 为表格加 exportRender 支持把状态徽标转成中文文本
- [ ] 实现一个最小版 useConfigCreate，覆盖 init/submit/validate

---

## ✨ 加分项（4 项）


### 1. Playwright + storageState 登录态分离

> 关联维度：🛡️ `reliability`
> 出现于：`q-09`

#### 📖 必读材料

- [ ] playwright.config.ts
- [ ] e2e/save-auth.spec.ts
- [ ] e2e/save-auth.ts

#### 🛠️ 动手练习

- [ ] 用 storageState 跑一个无需登录的用例
- [ ] 为内网 SSO 写一个保存登录态的脚本

---

### 2. QPilot AI Agent 入口注入 + 就绪轮询

> 关联维度：🧩 `feature` · 🛡️ `reliability`
> 出现于：`iq-10`

#### 📖 必读材料

- [ ] src/hooks/useQPilot.ts 全文
- [ ] QPilot SDK 官方接入文档

#### 🛠️ 动手练习

- [ ] 实现一个 200ms × 20 的轮询 + 失败降级方案
- [ ] 在卸载时验证 clearInterval 与 script 节点移除

---

### 3. SheetJS / xlsx 写盘

> 关联维度：⚡ `performance`
> 出现于：`q-05` · `iq-05`

#### 📖 必读材料

- [ ] SheetJS 官方文档 cell type 部分
- [ ] src/utils/file.ts

#### 🛠️ 动手练习

- [ ] 把一个长数字字段强制用 cellType='s' 输出
- [ ] 为带富文本的列加自定义 exportRender

---

### 4. TKE 部署与北极星服务发现

> 关联维度：🛡️ `reliability`
> 出现于：`q-10` · `iq-09`

#### 📖 必读材料

- [ ] start.sh / getBranch.sh
- [ ] 公司北极星接入文档

#### 🛠️ 动手练习

- [ ] 为 dev/prod 配两个北极星名字并通过 getBranch.sh 切换
- [ ] 排查一次 TKE 滚动发布失败的根因

---

