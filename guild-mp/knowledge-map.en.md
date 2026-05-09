# QQ 频道小程序 (guild_mp) — Knowledge Map

> Mode: knowledge

## 📚 Knowledge overview

Aggregated from the candidate output's `knowledge_points`, grouped by mastery level. Each topic lists related dimensions and the reverse index of source questions, so gaps can be filled efficiently.


## 🔑 Must master (25 topics)


### 1. CDN / 对象存储工程化上传与路径替换模式

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-03`

#### 📖 Must-read

- [ ] 微信官方文档 - image 组件 (https://developers.weixin.qq.com/miniprogram/dev/component/image.html)

#### 🛠️ Hands-on

- [ ] 为 demo 写 cdn.ts 支持 dev/prod 切换并模拟 CI 替换。

---

### 2. HTTP 请求封装的经典分层：拦截器 / 适配器 / 错误分发

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] axios / wx.request 的拦截器设计 (https://axios-http.com/docs/interceptors)
- [ ] guild_mp utils/httpClient 源码

#### 🛠️ Hands-on

- [ ] 实现一个 mini-axios：支持 interceptor + 统一错误分发。

---

### 3. JS 异常捕获：window.onerror / unhandledrejection / 小程序 App.onError

> Related dimensions: 📈 `observability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] Tencent Aegis 官网 / 接入文档 (https://aegis.qq.com/)
- [ ] MDN - Source map (https://developer.mozilla.org/en-US/docs/Glossary/Source_map)

#### 🛠️ Hands-on

- [ ] 在 demo 里接一个监控 SDK，构造错误并验证源码映射。

---

### 4. JSON vs binary 的协议演进风险对比

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] protobufjs 官方文档 (https://github.com/protobufjs/protobuf.js)
- [ ] Protocol Buffers Encoding (https://protobuf.dev/programming-guides/encoding/)

#### 🛠️ Hands-on

- [ ] 用 protoc 生成同一 proto 的 JSON 版本与 binary 版本，量化包体积差异。

---

### 5. Protocol Buffers：字段规则、wire format、兼容性原则

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] protobufjs 官方文档 (https://github.com/protobufjs/protobuf.js)
- [ ] Protocol Buffers Encoding (https://protobuf.dev/programming-guides/encoding/)

#### 🛠️ Hands-on

- [ ] 用 protoc 生成同一 proto 的 JSON 版本与 binary 版本，量化包体积差异。

---

### 6. TypeScript 泛型映射：keyof / mapped types / conditional types

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包异步化 requireAsync (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
- [ ] TypeScript Handbook - Mapped Types (https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

#### 🛠️ Hands-on

- [ ] 自己实现一个 10 行版 requireAsyncModule：带类型签名 + 缓存 + 超时。

---

### 7. app.json preloadRule 的 network / packages 语义与触发时机

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包加载 / 分包预下载 (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
- [ ] guild_mp docs/分包规则.md

#### 🛠️ Hands-on

- [ ] 空小程序压到 1.5M 以下，用 preloadRule 预加载一个分包并观察加载时序。

---

### 8. mini-stores 数据流与 miniprogram-computed 脏检查

> Related dimensions: ⚡ `performance`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] mini-stores 仓库 README (https://github.com/Tencent/mini-stores)
- [ ] Web Prefetch 相关 MDN 文档 (https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)

#### 🛠️ Hands-on

- [ ] demo 里实现 touchstart 预取并用 DevTools 网络面板量化首屏时间。

---

### 9. mock → 真接口的渐进式联调方法

> Related dimensions: 🧩 `feature`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] XState 官方文档（理解状态机） (https://stately.ai/docs/xstate)
- [ ] guild_mp docs/superpowers/specs / reviews 目录

#### 🛠️ Hands-on

- [ ] 自己写一个邮箱 + 验证码登录组件，带完整状态机与 mock 兜底。

---

### 10. setData 的性能模型与 Native Bridge 成本

> Related dimensions: ⚡ `performance`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] miniprogram-computed 官方 README (https://github.com/wechat-miniprogram/computed)
- [ ] guild_mp .codebuddy/rules/miniprogram-computed-data-rules.mdc

#### 🛠️ Hands-on

- [ ] 对比纯 setData 与 computed 在频繁更新下的 setData 次数。

---

### 11. skyline vs WebView 渲染器的差异

> Related dimensions: ⚡ `performance`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] 微信官方文档 - skyline 渲染引擎 (https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
- [ ] recycle-view / virtual-list 开源实现 (https://github.com/wechat-miniprogram/recycle-view)

#### 🛠️ Hands-on

- [ ] 实现一个能跑 5000 条消息的 virtual-list 并测帧率。

---

### 12. sourcemap 的安全与构建 / 上传流程

> Related dimensions: 📈 `observability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] Tencent Aegis 官网 / 接入文档 (https://aegis.qq.com/)
- [ ] MDN - Source map (https://developer.mozilla.org/en-US/docs/Glossary/Source_map)

#### 🛠️ Hands-on

- [ ] 在 demo 里接一个监控 SDK，构造错误并验证源码映射。

---

### 13. statusCode vs 业务 code 的错误分层

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] axios / wx.request 的拦截器设计 (https://axios-http.com/docs/interceptors)
- [ ] guild_mp utils/httpClient 源码

#### 🛠️ Hands-on

- [ ] 实现一个 mini-axios：支持 interceptor + 统一错误分发。

---

### 14. ticket / challenge-response 模式在风控中的作用

> Related dimensions: 🔒 `security`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] 腾讯防水墙 / 图灵盾官方文档（需内部权限）
- [ ] OWASP Automated Threats to Web Applications (https://owasp.org/www-project-automated-threats-to-web-applications/)

#### 🛠️ Hands-on

- [ ] 给 demo 接入一个开源 captcha SDK，走一遍『前端拿 ticket → 后端验证 → 接口放行』全流程。

---

### 15. 一次性 ticket 在业务链路里的防伪作用

> Related dimensions: 🧩 `feature`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] 微信小程序官方文档 - 页面跳转 API (https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)

#### 🛠️ Hands-on

- [ ] 写一个 mini 路由分发器，支持 4 种 type 并自带 fallback。

---

### 16. 乐观更新的回滚与一致性保证

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] React Query optimistic update 文档 (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

#### 🛠️ Hands-on

- [ ] 给 demo 加乐观点赞并故意让后端返回限频，验证回滚 + 冷却。

---

### 17. 前端路由分发器的职责分层：数据 / 协议 / 跳转

> Related dimensions: 🧩 `feature`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] 微信小程序官方文档 - 页面跳转 API (https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)

#### 🛠️ Hands-on

- [ ] 写一个 mini 路由分发器，支持 4 种 type 并自带 fallback。

---

### 18. 响应式派生：Vue / MobX computed 的脏检查机制

> Related dimensions: ⚡ `performance`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] miniprogram-computed 官方 README (https://github.com/wechat-miniprogram/computed)
- [ ] guild_mp .codebuddy/rules/miniprogram-computed-data-rules.mdc

#### 🛠️ Hands-on

- [ ] 对比纯 setData 与 computed 在频繁更新下的 setData 次数。

---

### 19. 小程序 Behavior 的注入机制

> Related dimensions: 🔒 `security`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] 腾讯防水墙 / 图灵盾官方文档（需内部权限）
- [ ] OWASP Automated Threats to Web Applications (https://owasp.org/www-project-automated-threats-to-web-applications/)

#### 🛠️ Hands-on

- [ ] 给 demo 接入一个开源 captcha SDK，走一遍『前端拿 ticket → 后端验证 → 接口放行』全流程。

---

### 20. 小程序 require / requireAsync API 与加载时序

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包异步化 requireAsync (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
- [ ] TypeScript Handbook - Mapped Types (https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

#### 🛠️ Hands-on

- [ ] 自己实现一个 10 行版 requireAsyncModule：带类型签名 + 缓存 + 超时。

---

### 21. 微信小程序主包与分包、pkg-* 工具分包的体积规则

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包加载 / 分包预下载 (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
- [ ] guild_mp docs/分包规则.md

#### 🛠️ Hands-on

- [ ] 空小程序压到 1.5M 以下，用 preloadRule 预加载一个分包并观察加载时序。

---

### 22. 意图信号（touchstart / hover）驱动的预取时序

> Related dimensions: ⚡ `performance`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] mini-stores 仓库 README (https://github.com/Tencent/mini-stores)
- [ ] Web Prefetch 相关 MDN 文档 (https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)

#### 🛠️ Hands-on

- [ ] demo 里实现 touchstart 预取并用 DevTools 网络面板量化首屏时间。

---

### 23. 登录 / 验证码类表单的状态机设计

> Related dimensions: 🧩 `feature`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] XState 官方文档（理解状态机） (https://stately.ai/docs/xstate)
- [ ] guild_mp docs/superpowers/specs / reviews 目录

#### 🛠️ Hands-on

- [ ] 自己写一个邮箱 + 验证码登录组件，带完整状态机与 mock 兜底。

---

### 24. 虚拟列表的可视窗口、回收与定高 / 变高测量

> Related dimensions: ⚡ `performance`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] 微信官方文档 - skyline 渲染引擎 (https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
- [ ] recycle-view / virtual-list 开源实现 (https://github.com/wechat-miniprogram/recycle-view)

#### 🛠️ Hands-on

- [ ] 实现一个能跑 5000 条消息的 virtual-list 并测帧率。

---

### 25. 错误码枚举集中管理的工程价值

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] React Query optimistic update 文档 (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

#### 🛠️ Hands-on

- [ ] 给 demo 加乐观点赞并故意让后端返回限频，验证回滚 + 冷却。

---

## ✨ Bonus (13 topics)


### 1. CI / CD 流水线钩子与产物替换

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-03`

#### 📖 Must-read

- [ ] 微信官方文档 - image 组件 (https://developers.weixin.qq.com/miniprogram/dev/component/image.html)

#### 🛠️ Hands-on

- [ ] 为 demo 写 cdn.ts 支持 dev/prod 切换并模拟 CI 替换。

---

### 2. CR followups 作为团队知识资产沉淀

> Related dimensions: 🧩 `feature`
> Appears in: `qa-12`

#### 📖 Must-read

- [ ] XState 官方文档（理解状态机） (https://stately.ai/docs/xstate)
- [ ] guild_mp docs/superpowers/specs / reviews 目录

#### 🛠️ Hands-on

- [ ] 自己写一个邮箱 + 验证码登录组件，带完整状态机与 mock 兜底。

---

### 3. IM 消息乐观更新、id 映射与失败重试

> Related dimensions: ⚡ `performance`
> Appears in: `qa-06`

#### 📖 Must-read

- [ ] 微信官方文档 - skyline 渲染引擎 (https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)
- [ ] recycle-view / virtual-list 开源实现 (https://github.com/wechat-miniprogram/recycle-view)

#### 🛠️ Hands-on

- [ ] 实现一个能跑 5000 条消息的 virtual-list 并测帧率。

---

### 4. list 的引用稳定性与 shallow compare

> Related dimensions: ⚡ `performance`
> Appears in: `qa-05`

#### 📖 Must-read

- [ ] miniprogram-computed 官方 README (https://github.com/wechat-miniprogram/computed)
- [ ] guild_mp .codebuddy/rules/miniprogram-computed-data-rules.mdc

#### 🛠️ Hands-on

- [ ] 对比纯 setData 与 computed 在频繁更新下的 setData 次数。

---

### 5. 分包下载失败 / 超时的兜底

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-01`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包加载 / 分包预下载 (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html)
- [ ] guild_mp docs/分包规则.md

#### 🛠️ Hands-on

- [ ] 空小程序压到 1.5M 以下，用 preloadRule 预加载一个分包并观察加载时序。

---

### 6. 前端向后兼容：未知 type 的 fallback 设计

> Related dimensions: 🧩 `feature`
> Appears in: `qa-13`

#### 📖 Must-read

- [ ] 微信小程序官方文档 - 页面跳转 API (https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)

#### 🛠️ Hands-on

- [ ] 写一个 mini 路由分发器，支持 4 种 type 并自带 fallback。

---

### 7. 前端安全的边界：客户端绝不是最终校验

> Related dimensions: 🔒 `security`
> Appears in: `qa-09`

#### 📖 Must-read

- [ ] 腾讯防水墙 / 图灵盾官方文档（需内部权限）
- [ ] OWASP Automated Threats to Web Applications (https://owasp.org/www-project-automated-threats-to-web-applications/)

#### 🛠️ Hands-on

- [ ] 给 demo 接入一个开源 captcha SDK，走一遍『前端拿 ticket → 后端验证 → 接口放行』全流程。

---

### 8. 幂等性与重试 / 退避策略

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-08`

#### 📖 Must-read

- [ ] axios / wx.request 的拦截器设计 (https://axios-http.com/docs/interceptors)
- [ ] guild_mp utils/httpClient 源码

#### 🛠️ Hands-on

- [ ] 实现一个 mini-axios：支持 interceptor + 统一错误分发。

---

### 9. 核心指标定义：FCP / 自定义业务指标

> Related dimensions: 📈 `observability`
> Appears in: `qa-10`

#### 📖 Must-read

- [ ] Tencent Aegis 官网 / 接入文档 (https://aegis.qq.com/)
- [ ] MDN - Source map (https://developer.mozilla.org/en-US/docs/Glossary/Source_map)

#### 🛠️ Hands-on

- [ ] 在 demo 里接一个监控 SDK，构造错误并验证源码映射。

---

### 10. 模块缓存与首次加载失败的重试 / 降级

> Related dimensions: 🏗️ `architecture`
> Appears in: `qa-02`

#### 📖 Must-read

- [ ] 微信官方文档 - 分包异步化 requireAsync (https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)
- [ ] TypeScript Handbook - Mapped Types (https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

#### 🛠️ Hands-on

- [ ] 自己实现一个 10 行版 requireAsyncModule：带类型签名 + 缓存 + 超时。

---

### 11. 类型生成：.d.ts 挂全局 namespace 的可维护性

> Related dimensions: ⚖️ `trade-off`
> Appears in: `qa-07`

#### 📖 Must-read

- [ ] protobufjs 官方文档 (https://github.com/protobufjs/protobuf.js)
- [ ] Protocol Buffers Encoding (https://protobuf.dev/programming-guides/encoding/)

#### 🛠️ Hands-on

- [ ] 用 protoc 生成同一 proto 的 JSON 版本与 binary 版本，量化包体积差异。

---

### 12. 请求并发 / TTL / 去重缓存策略

> Related dimensions: ⚡ `performance`
> Appears in: `qa-04`

#### 📖 Must-read

- [ ] mini-stores 仓库 README (https://github.com/Tencent/mini-stores)
- [ ] Web Prefetch 相关 MDN 文档 (https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)

#### 🛠️ Hands-on

- [ ] demo 里实现 touchstart 预取并用 DevTools 网络面板量化首屏时间。

---

### 13. 限频 / 冷却的 UI 反馈模式

> Related dimensions: 🛡️ `reliability`
> Appears in: `qa-11`

#### 📖 Must-read

- [ ] React Query optimistic update 文档 (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

#### 🛠️ Hands-on

- [ ] 给 demo 加乐观点赞并故意让后端返回限频，验证回滚 + 冷却。

---

