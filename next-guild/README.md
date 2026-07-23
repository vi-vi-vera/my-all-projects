# next-guild — 面试复盘材料

> QQ 频道相关的 Hybrid H5 门户（内部）。Next.js 15 Pages Router · TypeScript 4.9 · React 18 · Redux Toolkit（极简只挂 walletSlice）· next-redux-wrapper · antd-mobile 5 · @tencent/exeditor3 · @tencent/universal-report · @tencent/trpc-rpc-client · log4js + @tencent/atta UDP · Aegis RUM + Next reportWebVitals + 大同三通道监控 · Orange CI 双流水线（master tag_push + test push stke:update）· Node 20 Alpine Docker · TKE StatefulSetPlus · MSDK iOS/Android WebView 桥接 · postcss-px-to-viewport (1284 vw) · Whistle 本地代理 · standard-version（CHANGELOG 已到 v0.1.190）。
> Git 仓库：`待补充`

由 [`project-interview-coach`](https://github.com/codebuddy-skills/project-interview-coach) skill 四阶段产出，覆盖**候选人 / 面试官 / 知识图谱 / 学习指引**四种视角，全部产物 `python -m scripts.render_markdown` lint=0 通过。

## 文件清单

### 候选人视角（stage 3a）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.json`](./data/interview-data.json) | 11 道候选人 Q&A，七维全覆盖（architecture 2 / feature 1 / performance 1 / reliability 1 / observability 2 / trade-off 1 / security 2）；每题含三档双语答案（elevator/standard/deep_dive）+ 知识点 + 学习计划 |
| [`interview-prep.zh.md`](./interview-prep.zh.md) | 候选人备战手册（中文） |
| [`interview-prep.en.md`](./interview-prep.en.md) | 候选人备战手册（英文） |

### 面试官视角（stage 3b）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.interviewer.json`](./data/interview-data.interviewer.json) | 10 道面试官题库（每题带 2 条 stress_probes 追问）+ 10 份评分 rubric（每题 3 项 criteria，权重和 = 1.0，三档指征覆盖 优秀 / 合格 / 不合格） |
| [`interviewer-pack.zh.md`](./interviewer-pack.zh.md) | 面试官问题清单 + 评分卡（中文） |
| [`interviewer-pack.en.md`](./interviewer-pack.en.md) | 面试官问题清单 + 评分卡（英文） |

### 知识图谱视角（stage 3c）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.knowledge.json`](./data/interview-data.knowledge.json) | 41 个知识 topic，按「必须掌握 / 加分项」分层；含反向索引 `questions_using` 关联到候选人 Q&A |
| [`knowledge-map.zh.md`](./knowledge-map.zh.md) | 知识图谱（中文） |
| [`knowledge-map.en.md`](./knowledge-map.en.md) | 知识图谱（英文） |

### 学习指引（stage 3.5，study-guide）

| 文件 | 说明 |
|---|---|
| [`data/study-guide-data.json`](./data/study-guide-data.json) | 4 个阶段、7 个学习簇；每簇含场景、2-4 条 must_read 外链、2 条动手练习、3 道自检；额外 7 条 global_self_check 与 6 条阅读建议 |
| [`study-guide.zh.md`](./study-guide.zh.md) | 学习指引（中文） |
| [`study-guide.en.md`](./study-guide.en.md) | 学习指引（英文） |

### 中间物

| 文件 | 说明 |
|---|---|
| [`data/project-context.json`](./data/project-context.json) | Stage 1：1 sub_project / 28 modules / 13 highlights |
| [`data/tech-points.json`](./data/tech-points.json) | Stage 2：17 个面试技术点，8 个高价值（interview_value=高） |

> 原始 `scan-bundle.json`（git 历史、依赖、文件结构等）保留在 `<工作区>/next-guild/.codebuddy/interview-coach/scan-bundle.json`，未随归档进入本目录。

## 维度覆盖（candidate 模式 11 道 qa）

| 维度 | qa 数量 | 对应 qa |
|---|:-:|---|
| architecture | 2 | q-03（BFF 表驱动）· q-04（三类 axios） |
| feature | 1 | q-08（MSDK WebView 桥接） |
| performance | 1 | q-11（postcss-px-to-viewport 1284vw + GameGuild 排除） |
| reliability | 1 | q-09（Orange CI 双流水线 + stke:update） |
| observability | 2 | q-05（trpc.withLog + traceparent）· q-07（Aegis/web-vitals/大同三通道） |
| trade-off | 1 | q-10（Redux 极简 store + next-redux-wrapper HYDRATE） |
| security | 2 | q-01（middleware 边缘守卫）· q-02（checkurl 防开放重定向） |

## 复现方式

```bash
# 假定已在 project-interview-coach skill 根目录
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'   # Windows / PowerShell 必须

# 1. 扫描（产出 scan-bundle.json）
python -m scripts.cli scan --workspace <工作区>/next-guild --depth medium --projects auto --out <工作区>/next-guild/.codebuddy/interview-coach/scan-bundle.json

# 2. 渲染候选人材料
python -m scripts.render_markdown --data my-all-projects/next-guild/data/interview-data.json --templates templates --out my-all-projects/next-guild

# 3. 渲染面试官包
python -m scripts.render_markdown --data my-all-projects/next-guild/data/interview-data.interviewer.json --templates templates --out my-all-projects/next-guild

# 4. 聚合知识图谱（纯 Python，无 LLM 调用）
python -m scripts.cli aggregate --data my-all-projects/next-guild/data/interview-data.json --out my-all-projects/next-guild/data/interview-data.knowledge.json

# 5. 渲染知识图谱
python -m scripts.render_markdown --data my-all-projects/next-guild/data/interview-data.knowledge.json --templates templates --out my-all-projects/next-guild

# 6. 渲染学习指引
python -m scripts.render_markdown --data my-all-projects/next-guild/data/study-guide-data.json --templates templates --out my-all-projects/next-guild
```
