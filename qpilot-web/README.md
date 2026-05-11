# QPilot Web 面试复盘材料

> 由 `project-interview-coach` skill 基于 `qpilot-web-v2` 仓库（git@git.woa.com:qagent/qpilot-web-v2.git）扫描生成。
> 角色：全栈　|　目标级别：中级　|　基线：平实口吻 + 反 hallucination + 双语独立写作

## 文件结构

```
qpilot-web/
├── README.md                  # 本文件
├── interview-prep.zh.md       # 候选人模式（中文，project_pitch + highlights + 15 个 QA + dimension_coverage）
├── interview-prep.en.md       # 候选人模式（英文，独立写作，非翻译）
├── interviewer-pack.zh.md     # 面试官模式（中文，15 个问题 + stress probes + rubrics 评分量表）
├── interviewer-pack.en.md     # 面试官模式（英文）
├── knowledge-map.zh.md        # 知识图谱模式（中文，42 个去重 topic + 反向索引到 QA）
├── knowledge-map.en.md        # 知识图谱模式（英文）
└── data/
    ├── project-context.json   # Stage 1 产物：项目骨架 + sub_projects + highlights
    ├── tech-points.json       # Stage 2 产物：15 个 tech points（按 7 个 primary_dimension 拆分）
    ├── interview-data.json              # Stage 3a candidate
    ├── interview-data.interviewer.json  # Stage 3b interviewer
    └── interview-data.knowledge.json    # Stage 3c knowledge
```

## 三阶段产出说明

### Stage 1 — 项目扫描（project-context.json）
- `platform_name`：QPilot Web
- 4 个 sub_projects：apps/desktop · apps/mobile · packages/* 共享层 · web_bak（legacy）
- 14 个 modules + 7 个高亮特性

### Stage 2 — 技术点（tech-points.json）
15 个技术点全覆盖 7 个 primary_dimension（schema 强约束）：
- **architecture × 5**：ToolLoopAgent + UIMessageStream 主链路、Prisma 消息树、21 Zustand store 治理、App Router 路由组、pnpm catalog + lerna independent
- **performance × 2**：Token 预算 + 阶梯式上下文压缩、DNS 预连接 + cookie 水合
- **security × 1**：Edge Middleware + jose JWE 解 TAI 身份头
- **reliability × 1**：会话级 AbortController 注册表与停止链路
- **observability × 1**：Galileo OpenTelemetry + 4 个自定义 metric
- **trade-off × 3**：legacy 链路并存、web_bak 渐进迁移、Edge/Node runtime 选型
- **feature × 2**：React Query services/hooks 分层、html-to-figma SDK

### Stage 3a — Candidate（interview-prep.{zh,en}.md）
- **project_pitch** 三档：elevator / standard / deep_dive，全部双语
- **6 个 highlights**：每条带 STAR 双语 story + tech_keywords
- **15 个 QA**：1:1 对应 tech-points，每题包含
  - elevator / standard / deep_dive 三档双语答案（全部满足 word-budget floor，lint=0）
  - knowledge_points（2-4 个，必须掌握 + 加分项混合）
  - learning_plan（must_read / hands_on / common_pitfalls / mock_questions / time_estimate 五项必填）
  - 部分附 follow_ups
- **dimension_coverage**：`{architecture:5, performance:2, security:1, reliability:1, observability:1, "trade-off":3, feature:2}`

### Stage 3b — Interviewer（interviewer-pack.{zh,en}.md）
- 15 个问题（iq-01 ~ iq-15），与候选人 QA 1:1 但**不带模型答案**
- 每题附 1 个 stress probe（用于回答太顺时追问）
- 每题对应 rubric 包含 3 个评分维度（技术正确性 0.4 + 取舍意识 0.3 + 失败教训复盘能力 0.3）
- 每个维度三档（优秀 / 合格 / 不合格）双语指标，全部基于可观察行为

### Stage 3c — Knowledge（knowledge-map.{zh,en}.md）
- **42 个去重 topic**：26 个必须掌握 + 16 个加分项
- 每个 topic 反向索引到 `questions_using`（哪些 QA 用到这个知识点）
- `must_read` / `hands_on` 直接复用 candidate qa 的 learning_plan，避免漂移

## 校验状态

所有 JSON 通过 `schemas/interview-data.schema.json` JSON Schema 校验，
所有 markdown 通过 `python -m scripts.render_markdown` lint，
**word-budget warnings = 0**。

floor 阈值：
- standard.zh ≥ 110 CJK chars / standard.en ≥ 80 words
- deep_dive.zh ≥ 350 CJK chars / deep_dive.en ≥ 220 words

CJK 计数仅汉字字符（`[\u4e00-\u9fff\u3400-\u4dbf]`），标点与英文标识符不计。

## 使用建议

1. **候选人复盘**：先读 `interview-prep.zh.md` 的 project_pitch 三档建立 elevator pitch，再按 dimension 顺序过 15 个 QA 的 standard 答案；deep_dive 用于二面或刻意练习。
2. **面试官出题**：从 `interviewer-pack.zh.md` 选 5-8 题（覆盖 architecture / trade-off / reliability 各一题以上），按 rubric 即时打分。
3. **知识盲区扫描**：用 `knowledge-map.zh.md` 看必须掌握 26 项的反向索引，挑你最不熟的 3-5 项按 `must_read` + `hands_on` 排进周计划。
