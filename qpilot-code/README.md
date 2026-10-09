# QPilot Code Agent — 面试复盘材料

> 企业级 AI 编程平台，包含后端 Agent 服务与前端工作台。
> 仓库已从 QQChannel 迁移到 g2，材料按 2026-09-23 的 master 重新核对。
> Git 仓库：
> - 后台 `backagent`：`https://git.woa.com/g2/coding-agent/qpilot-code/backagent`
> - 前端 `web`：`https://git.woa.com/g2/coding-agent/qpilot-code/web`

## 文件结构

```text
qpilot-code/
├── README.md
├── project-context.json
├── tech-points.json
├── raw-bundle.json
├── interview-data.json
├── interview-prep.zh.md
├── interview-prep.en.md
├── knowledge-data.json
├── knowledge-map.zh.md
├── knowledge-map.en.md
└── study-guide.zh.md
```

## 项目一句话

QPilot Code Agent 面向企业 AI 编程场景，把设计稿和自然语言需求转成可预览、可部署的多框架前端代码；后端负责 Agent 执行、OpenSandbox、Git、部署和观测，前端负责聊天、预览、部署面板和工具调用可视化。

## 迁移后需要改口的三件事

1. 沙箱执行层只使用 OpenSandbox SDK。`e2b` 只剩注释和旧字段说明，不再是可选后端。
2. `sandbox-warm-pool.service.ts` 仍在，但是空实现。`acquireWarmSandbox` 固定返回 `null`，预热交给 OpenSandbox 服务端。不要再讲进程内按时间段扩缩池，也不要讲十几秒变成一秒。
3. `feature-whitelist.ts` 和 Pod 内存双态灰度已经不在当前仓库。高风险入口改看两处：上传在解析 body 前校验 Origin；部署前仅当 `isEphemeralStorage` 为 true 时确认 `ephemeralReason`。

## 2026-08 至 2026-09 本人提交里可以讲的新增内容

- 工蜂仓库导入，以及多实例下导入成功后同步文件树。
- 项目列表按“我管理的 / 我参与的”分栏，支持置顶、重命名和转让管理员。
- 版本历史展示已发布版本，部署成功时记录 `sourceVersionId`。
- `/api/auth/me` 返回员工信息，平台域名收归到 `code.qpilot` / `test-code`。
- 前端正式环境 CI 部署迁移到 TKE。
- 聊天附件改走平台上传，不再直连旧 CDN。

`raw-bundle.json` 仍是迁移前的扫描快照，里面的 `backagent-web`、`feature-whitelist.ts` 和进程内预热池不要当成现状。

## 使用建议

1. 先读 `project-context.json` 建立 backagent / web 双仓库结构。
2. 再读 `interview-prep.zh.md`。讲沙箱、预热池和灰度时，以本页“需要改口的三件事”为准。
3. 用 `knowledge-map.zh.md` 补齐 AI Agent、沙箱、SSE、Git 写回、部署等知识点。
