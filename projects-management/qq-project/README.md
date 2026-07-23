# qq-project — 面试复盘材料

> QQ 客户端的项目管理门户（内部）。Next.js 14 Pages Router · NoSSR SPA · React 18 · TDesign React 1.7 · Zustand 4（createWithEqualityFn + shallow）· Axios（humps camelize / 401 logout / Aegis 上报 / 重试 3×1s）· OpenSpec 规格驱动 · Orange CI + Docker（业务镜像 + cache 镜像）+ TKE + 北极星 · Playwright（storageState 登录态分离）· QPilot AI Agent 入口注入。
> Git 仓库：`待补充`

由 [`project-interview-coach`](https://github.com/codebuddy-skills/project-interview-coach) skill 三阶段产出，覆盖**候选人 / 面试官 / 知识图谱**三种视角，全部产物 `python -m scripts.render_markdown` lint=0 通过。

## 文件清单

### 候选人视角（stage 3a）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.json`](./data/interview-data.json) | 10 道候选人 Q&A，覆盖 architecture/feature/performance/reliability/observability/trade-off/security 七个维度（七维全覆盖），每题含三档答案（elevator/standard/deep_dive）双语 + 知识点 + 学习计划 |
| [`interview-prep.zh.md`](./interview-prep.zh.md) | 候选人备战手册（中文） |
| [`interview-prep.en.md`](./interview-prep.en.md) | 候选人备战手册（英文） |

### 面试官视角（stage 3b-interviewer）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.interviewer.json`](./data/interview-data.interviewer.json) | 10 道面试官题库（含 stress_probes 追问）+ 10 份评分 rubric（每题 3 项 criteria，权重 = 1.0，三档指征覆盖 优秀/合格/不合格） |
| [`interviewer-pack.zh.md`](./interviewer-pack.zh.md) | 面试官问题清单 + 评分卡（中文） |
| [`interviewer-pack.en.md`](./interviewer-pack.en.md) | 面试官问题清单 + 评分卡（英文） |

### 知识图谱视角（stage 3c-knowledge）

| 文件 | 说明 |
|---|---|
| [`data/interview-data.knowledge.json`](./data/interview-data.knowledge.json) | 22 个知识 topic，按「必须掌握 / 加分项」分层；含反向索引 `questions_using` 关联到候选人 Q&A 与面试官题库 |
| [`knowledge-map.zh.md`](./knowledge-map.zh.md) | 知识图谱（中文） |
| [`knowledge-map.en.md`](./knowledge-map.en.md) | 知识图谱（英文） |

### 中间物 / 原始扫描

| 文件 | 说明 |
|---|---|
| [`data/project-context.json`](./data/project-context.json) | Stage 1：平台档案、模块结构、8 个高亮提炼（1 个 sub_project / 16 个 modules） |
| [`data/tech-points.json`](./data/tech-points.json) | Stage 2：14 个面试技术点，按 architecture/reliability/feature/performance/observability/trade-off 维度覆盖；其中 6 个被标记为高价值（interview_value=高） |

> 原始 `scan-bundle.json`（包含 git 历史、依赖、文件结构等）保留在 `<工作区>/qq-project/.codebuddy/interview-coach/scan-bundle.json`，未随归档进入本目录。

## 维度覆盖（candidate 模式）

| 维度 | qa 数量 |
|---|:-:|
| architecture | 2 |
| feature | 1 |
| performance | 1 |
| reliability | 2 |
| observability | 1 |
| trade-off | 2 |
| security | 1 |

## 复现方式

```bash
# 假定已在 project-interview-coach skill 根目录
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'   # Windows / PowerShell 必须

# 1. 扫描（产出 scan-bundle.json）
python -m scripts.cli scan --workspace <工作区>/qq-project --depth medium --projects auto --out <工作区>/qq-project/.codebuddy/interview-coach/scan-bundle.json

# 2. 渲染候选人材料
python -m scripts.render_markdown --data my-all-projects/projects-management/qq-project/data/interview-data.json --templates templates --out my-all-projects/projects-management/qq-project

# 3. 渲染面试官包
python -m scripts.render_markdown --data my-all-projects/projects-management/qq-project/data/interview-data.interviewer.json --templates templates --out my-all-projects/projects-management/qq-project

# 4. 渲染知识图谱
python -m scripts.render_markdown --data my-all-projects/projects-management/qq-project/data/interview-data.knowledge.json --templates templates --out my-all-projects/projects-management/qq-project
```
