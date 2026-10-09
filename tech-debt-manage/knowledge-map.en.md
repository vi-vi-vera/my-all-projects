# 技术负债治理管理平台 — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (17 topics)


### 1. Axios 拦截器

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Axios interceptors
- [ ] tRPC HTTP 映射

#### 🛠️ Hands-on

- [ ] 模拟 100001 和 100002 两个响应头，确认页面行为不同

---

### 2. Cookie 会话

> Related dimensions: 🔒 `security`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Cookie 与 withCredentials
- [ ] 开放重定向

#### 🛠️ Hands-on

- [ ] 构造一条非 https 的错误头，确认页面不会跳走

---

### 3. Nginx SPA

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Docker 多阶段与静态站点镜像
- [ ] Nginx try_files

#### 🛠️ Hands-on

- [ ] 把一次测试分支推送跟到镜像标签和负载更新

---

### 4. Orange CI

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Docker 多阶段与静态站点镜像
- [ ] Nginx try_files

#### 🛠️ Hands-on

- [ ] 把一次测试分支推送跟到镜像标签和负载更新

---

### 5. React.lazy

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] React Router 嵌套路由
- [ ] React.lazy 与 Suspense

#### 🛠️ Hands-on

- [ ] 用一份 JSON 菜单生成两级路由，并给未知类型一个兜底页

---

### 6. SheetJS

> Related dimensions: 🧩 `feature`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] SheetJS 读取与写出
- [ ] Blob 下载

#### 🛠️ Hands-on

- [ ] 上传一个三列表格，校验缺列并导出当前页

---

### 7. 伽利略

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] 前端监控接入
- [ ] 区分脚本错误和接口错误

#### 🛠️ Hands-on

- [ ] 在测试环境触发一次接口失败，并在监控里找到这条记录

---

### 8. 动态路由

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-01`

#### 📖 Must-read

- [ ] React Router 嵌套路由
- [ ] React.lazy 与 Suspense

#### 🛠️ Hands-on

- [ ] 用一份 JSON 菜单生成两级路由，并给未知类型一个兜底页

---

### 9. 受控分页

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] TDesign Table 分页与排序
- [ ] 受控组件和状态提升

#### 🛠️ Hands-on

- [ ] 做一个三列配置表，支持服务端分页和返回详情后恢复筛选

---

### 10. 开放重定向

> Related dimensions: 🔒 `security`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Cookie 与 withCredentials
- [ ] 开放重定向

#### 🛠️ Hands-on

- [ ] 构造一条非 https 的错误头，确认页面不会跳走

---

### 11. 文件校验

> Related dimensions: 🧩 `feature`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] SheetJS 读取与写出
- [ ] Blob 下载

#### 🛠️ Hands-on

- [ ] 上传一个三列表格，校验缺列并导出当前页

---

### 12. 服务端分页

> Related dimensions: ⚡ `performance`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] 分页参数设计
- [ ] 前端聚合与后端聚合

#### 🛠️ Hands-on

- [ ] 同一张表分别按页和全量请求，比较返回体积

---

### 13. 环境隔离

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] 前端监控接入
- [ ] 区分脚本错误和接口错误

#### 🛠️ Hands-on

- [ ] 在测试环境触发一次接口失败，并在监控里找到这条记录

---

### 14. 登录态失效

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Axios interceptors
- [ ] tRPC HTTP 映射

#### 🛠️ Hands-on

- [ ] 模拟 100001 和 100002 两个响应头，确认页面行为不同

---

### 15. 路由稳定性

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] ES modules 顶层 await
- [ ] React Router 动态路由

#### 🛠️ Hands-on

- [ ] 把等待改到组件内，比较空菜单闪动和首屏时间

---

### 16. 配置驱动界面

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] TDesign Table 分页与排序
- [ ] 受控组件和状态提升

#### 🛠️ Hands-on

- [ ] 做一个三列配置表，支持服务端分页和返回详情后恢复筛选

---

### 17. 顶层 await

> Related dimensions: 🏗️ `architecture` · ⚖️ `trade-off`
> Appears in: `q-01` · `q-08`

#### 📖 Must-read

- [ ] React Router 嵌套路由
- [ ] React.lazy 与 Suspense
- [ ] ES modules 顶层 await

#### 🛠️ Hands-on

- [ ] 用一份 JSON 菜单生成两级路由，并给未知类型一个兜底页
- [ ] 把等待改到组件内，比较空菜单闪动和首屏时间

---

## ✨ Bonus (8 topics)


### 1. Aegis

> Related dimensions: 📈 `observability`
> Appears in: `q-05`

#### 📖 Must-read

- [ ] 前端监控接入
- [ ] 区分脚本错误和接口错误

#### 🛠️ Hands-on

- [ ] 在测试环境触发一次接口失败，并在监控里找到这条记录

---

### 2. Redux Toolkit

> Related dimensions: 🏗️ `architecture`
> Appears in: `q-02`

#### 📖 Must-read

- [ ] TDesign Table 分页与排序
- [ ] 受控组件和状态提升

#### 🛠️ Hands-on

- [ ] 做一个三列配置表，支持服务端分页和返回详情后恢复筛选

---

### 3. 一次拉全量

> Related dimensions: ⚡ `performance`
> Appears in: `q-07`

#### 📖 Must-read

- [ ] 分页参数设计
- [ ] 前端聚合与后端聚合

#### 🛠️ Hands-on

- [ ] 同一张表分别按页和全量请求，比较返回体积

---

### 4. 上传体积

> Related dimensions: 🧩 `feature`
> Appears in: `q-03`

#### 📖 Must-read

- [ ] SheetJS 读取与写出
- [ ] Blob 下载

#### 🛠️ Hands-on

- [ ] 上传一个三列表格，校验缺列并导出当前页

---

### 5. 权限与登录分离

> Related dimensions: 🔒 `security`
> Appears in: `q-06`

#### 📖 Must-read

- [ ] Cookie 与 withCredentials
- [ ] 开放重定向

#### 🛠️ Hands-on

- [ ] 构造一条非 https 的错误头，确认页面不会跳走

---

### 6. 渐进渲染

> Related dimensions: ⚖️ `trade-off`
> Appears in: `q-08`

#### 📖 Must-read

- [ ] ES modules 顶层 await
- [ ] React Router 动态路由

#### 🛠️ Hands-on

- [ ] 把等待改到组件内，比较空菜单闪动和首屏时间

---

### 7. 错误码映射

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-04`

#### 📖 Must-read

- [ ] Axios interceptors
- [ ] tRPC HTTP 映射

#### 🛠️ Hands-on

- [ ] 模拟 100001 和 100002 两个响应头，确认页面行为不同

---

### 8. 镜像发布

> Related dimensions: 🛡️ `reliability`
> Appears in: `q-09`

#### 📖 Must-read

- [ ] Docker 多阶段与静态站点镜像
- [ ] Nginx try_files

#### 🛠️ Hands-on

- [ ] 把一次测试分支推送跟到镜像标签和负载更新

---

