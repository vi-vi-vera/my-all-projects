# QQ OKR — 面试复盘材料（Langfuse 可观测接入）

> 由 `project-interview-coach` skill 基于 `qq-okr` 仓库扫描生成。
> Git 仓库：`https://git.woa.com/g2/qq-okr`（主干 `main`，材料基线 2026-10-22）
> 角色：全栈　|　目标级别：中级　|　口吻：平实 + 反 hallucination + 双语独立写作

## 我的职责边界（讲之前先说清）

QQ OKR 是腾讯内部的 OKR / 绩效协作平台（`qqx.woa.com`），体量很大：NestJS 11 + Prisma 7 + BullMQ 的后端、Next.js 前端、多个内部集成。**我只承担其中「AI 调用链接入 Langfuse 上报」这一块**（2026-10-13 首次提交 `4b25138c8`，到 2026-10-22 共 7 次改动）。

因此本目录的材料范围：

- ✅ 覆盖：Langfuse 与伽利略的双平台可观测、OpenInference 插桩、OTel v1/v2 兼容、span 属性与数据口径、降级与优雅退出。
- ❌ 不覆盖：OKR 业务建模、权限体系、前端工作台、周报业务规则等（这些不是我做的，面试时不要抢）。

被问到「这个项目你做了什么」时，标准答法见 `interview-prep.zh.md` 的 project_pitch；被追问到业务范围之外，直接说明边界并转到可观测话题。

## 文件结构

```text
qq-okr/
├── README.md                       # 本文件
├── interview-prep.zh.md            # 候选人模式（中文，project_pitch + 6 个 highlights + 13 个 QA）
├── interview-prep.en.md            # 候选人模式（英文，独立写作，非翻译）
├── knowledge-map.zh.md             # 知识图谱（中文，39 个去重 topic + 反向索引）
├── knowledge-map.en.md             # 知识图谱（英文）
├── study-guide.zh.md               # 学习路径（中文，3 阶段 4 簇 + 可点击外链 + 自检）
└── data/
    ├── project-context.json        # Stage 1：项目骨架 + sub_projects + highlights
    ├── tech-points.json            # Stage 2：13 个 tech points
    ├── interview-data.json         # Stage 3 candidate
    ├── interview-data.knowledge.json  # knowledge 聚合产物（Python 确定性生成）
    └── study-guide-data.json       # study-guide 模式数据
```

未产出 `interviewer-pack`：本轮以求职者视角为主（与 `qpilot-code` 目录保持一致）。

## 三阶段产出说明

### Stage 1 — 项目扫描（project-context.json）

- `platform_name`：QQ OKR（qq-okr）
- 3 个 sub_projects：`apps/server`（backend，本人工作区）· `apps/web`（frontend）· `apps/platform-server` + `apps/hr-export`（infra）
- server 侧登记 8 个 modules，其中 `integrations/langfuse` 是核心
- 7 个 highlights（trace_id 对齐、ESM 手动插桩、v1/v2 兼容层、业务拦截中性化、userId/projectId、cache 与成本、降级与优雅退出）

### Stage 2 — 技术点（tech-points.json）

13 个技术点，覆盖 6 个 primary_dimension：

- **observability × 6**：共用 TracerProvider 的 trace_id 对齐、ESM 手动插桩、OTel v1/v2 兼容层、业务拦截 Abandoned → WARNING、user.id / metadata.projectId 注入、cache token 与成本拆分
- **architecture × 2**：启动时序与动态 import、shouldExportSpan 的职责过滤
- **reliability × 2**：初始化降级 + 优雅退出 forceFlush、worker 场景显式传 projectId
- **trade-off × 1**：寄生 OTel 生态 vs 自建埋点（含 unmet peer 风险）
- **performance × 1**：批量异步导出与 span 处理开销
- **security × 1**：密钥 env 管理、默认关闭、上报最小化

### Stage 3 — Candidate（interview-prep.{zh,en}.md）

- **project_pitch** 三档双语：elevator（简历一句话）/ standard（30–60 秒）/ deep_dive（2–3 分钟）
- **6 个 highlights**：每条带 STAR 双语 story + tech_keywords
- **13 个 QA**（qa-01 ~ qa-13），1:1 对应 tech-points，每题含：
  - 三档双语答案（elevator / standard / deep_dive）
  - knowledge_points（2–3 个，必须掌握 + 加分项混合）
  - learning_plan（must_read / hands_on / common_pitfalls / mock_questions / time_estimate）
  - 部分题附 follow_ups（qa-01、qa-03）
  - evidence（真实文件路径 / 文档章节 / 提交号）
- **dimension_coverage**：`{observability:6, architecture:2, reliability:2, trade-off:1, performance:1, security:1, feature:0}`

### Knowledge（knowledge-map.{zh,en}.md）

由 `coach aggregate` 从 candidate JSON 确定性聚合：**39 个去重 topic**（24 个必须掌握 + 15 个加分项），每个 topic 反向索引到 `questions_using`，`must_read` / `hands_on` 直接复用 QA 的 learning_plan，避免漂移。

### Study guide（study-guide.zh.md）

3 个阶段 + 4 个簇：A 建立 OTel 心智模型 → B 插桩落地与版本兼容 → C 数据口径、可靠性与安全边界。每簇带前置、必读外链（全部 `https`，本次已逐个验证可访问）、动手练习与 3 道自检。

## 校验状态

- 全部 5 个 JSON 通过 `schemas/interview-data.schema.json` / `project-context.schema.json` / `tech-points.schema.json` 校验
- Markdown 由 `python -m scripts.cli render` 生成
- **word-budget warnings = 0**

floor / ceiling 阈值：

- standard.zh ≥ 110 CJK chars（≤ 300）· standard.en ≥ 80 words（≤ 180）
- deep_dive.zh ≥ 350 CJK chars · deep_dive.en ≥ 220 words（≤ 450）
- elevator.zh ≤ 50 CJK chars · elevator.en ≤ 35 words

CJK 计数仅汉字字符（`[\u4e00-\u9fff\u3400-\u4dbf]`），标点与英文标识符不计。

## 面试时的三条硬提醒

1. **版本号要背准**：`@langfuse/otel ^5.13.1`、插桩包 `^0.3.4`、伽利略锁的是 `sdk-trace-base@1.30`（OTel v1）、`@anthropic-ai/claude-agent-sdk 0.3.251`（精确锁版本）。
2. **说清「不做什么」**：缓存预热池、权限体系、前端工作台不是我做的；业务拦截的 `statusMessage` 目前写死 `business-intercept`，要精确到「用户取消」需要改三层传参，未做——主动说局限比被问出来好。
3. **不要吹成平台建设**：这是「接入 + 打磨上报口径」，不是自建可观测平台；价值点在于跨平台 trace_id 打通、错误率口径修正、成本口径修正这三件事。

## 使用建议

1. 先读 `interview-prep.zh.md` 的 project_pitch 三档，把 standard 练到 60 秒内自然说完。
2. 按 dimension 顺序过 13 个 QA：先 observability 6 题（最核心），再 architecture / reliability，最后 trade-off / performance / security。
3. 用 `knowledge-map.zh.md` 扫必须掌握的 24 项，挑最不熟的 3 项按 `study-guide.zh.md` 的簇排进周计划。
4. 英文场先背 `interview-prep.en.md` 的 elevator + 前 6 题的 standard。
