# my-all-projects

个人项目的面试复盘与知识整理归档。使用 [`project-interview-coach`](https://github.com/…/project-interview-coach) 技能生成，覆盖**候选人 / 面试官 / 知识图谱**三种视角。

## 项目目录

| 项目 | 说明 |
|---|---|
| [`qpilot-code/`](./qpilot-code) | QPilot Code Agent（企业级 AI 编程平台，backagent + backagent-web 全栈）的面试材料与知识图谱 |
| [`qpilot-web/`](./qpilot-web) | QPilot Web LLMOps 工作台 `qpilot-web-v2`（pnpm + lerna monorepo · Next.js 16 App Router · Vercel AI SDK 5 ToolLoopAgent · 桌面端/移动端双轨）的面试材料与知识图谱 |
| [`guild-mp/`](./guild-mp) | QQ 频道小程序 `guild_mp`（微信小程序 + 多分包 + Skyline 渲染）的面试材料与知识图谱 |
| [`guild_web/`](./guild_web) | QQ 频道 Web 平台 `guild_web`（pnpm + lerna monorepo · Nuxt 3 SSR/CSR · 5 宿主适配 · exeditor3 富文本）的面试材料与知识图谱 |

## 每个项目的标准产物

按产出视角分为三类，实际落地文件视是否完整跑全流程而定。

### 候选人视角（stage 3a）

| 文件 | 用途 |
|---|---|
| `interview-data.json` | 12+ 个 Q&A，含三档答案（初 / 中 / 高）、知识点清单、学习计划、追问 |
| `interview-prep.zh.md` / `interview-prep.en.md` | 候选人面试备战手册（双语） |

### 面试官视角（stage 3b-interviewer）

| 文件 | 用途 |
|---|---|
| `interview-data.interviewer.json` | 按技术点生成的题库 + 评分 rubric（权重和 = 1.0，三档指征覆盖 优秀 / 合格 / 不合格） |
| `interviewer-pack.zh.md` / `interviewer-pack.en.md` | 面试官问题清单 + 评分卡（双语） |

### 知识图谱视角（stage 3b-knowledge）

| 文件 | 用途 |
|---|---|
| `knowledge-data.json` | 聚合所有 Q&A 的知识点，按 `必须掌握 / 加分项` 分层，含反向索引 `questions_using` |
| `knowledge-map.zh.md` / `knowledge-map.en.md` | 知识地图（双语） |

### 中间物 / 原始扫描

| 文件 | 用途 |
|---|---|
| `project-context.json` | Stage 1：平台档案、模块结构、高亮提炼 |
| `tech-points.json` | Stage 2：面试技术点（按 architecture / performance / reliability / security / observability / feature 维度覆盖） |
| `raw-bundle.json` | 原始扫描结果（git 历史、依赖、文件结构） |

> 说明：`guild-mp/`、`guild_web/` 目录仅归档渲染后的双语 Markdown 与 `knowledge-data.json`；其 stage 0–3 中间 JSON 存放在原始工作区对应的 `<项目>/.codebuddy/interview-coach/` 目录下。`qpilot-web/` 完整归档了三阶段全部 JSON，统一放在 `qpilot-web/data/` 子目录下；其中 knowledge 模式数据使用 skill 标准命名 `interview-data.knowledge.json`（与 `knowledge-data.json` 等价）。

## 目录文件矩阵

| 文件 | qpilot-code | qpilot-web | guild-mp | guild_web |
|---|:-:|:-:|:-:|:-:|
| `project-context.json` | ✅ | ✅ | — | — |
| `tech-points.json` | ✅ | ✅ | — | — |
| `raw-bundle.json` | ✅ | — | — | — |
| `interview-data.json` | ✅ | ✅ | — | — |
| `interview-data.interviewer.json` | — | ✅ | — | — |
| `interview-data.knowledge.json` | — | ✅ | — | — |
| `interview-prep.{zh,en}.md` | ✅ | ✅ | ✅ | ✅ |
| `interviewer-pack.{zh,en}.md` | — | ✅ | ✅ | ✅ |
| `knowledge-data.json` | ✅ | — | ✅ | ✅ |
| `knowledge-map.{zh,en}.md` | — | ✅ | ✅ | ✅ |

## 复现方式

```bash
# 1. 扫描
python -m scripts.cli scan --workspace <项目路径> --depth medium --out <项目>/.codebuddy/interview-coach/scan-bundle.json

# 2. 候选人模式渲染
python -m scripts.cli render \
  --data <项目>/.codebuddy/interview-coach/interview-data.json \
  --templates templates \
  --out my-all-projects/<项目>

# 3. 知识图谱模式（纯 Python 聚合 + 渲染）
python -m scripts.cli run --mode knowledge \
  --data <项目>/.codebuddy/interview-coach/interview-data.json \
  --templates templates \
  --out my-all-projects/<项目>

# 4. 面试官模式渲染（需要先按 stage3-interviewer prompt 产出 interview-data.interviewer.json）
python -m scripts.cli render \
  --data <项目>/.codebuddy/interview-coach/interview-data.interviewer.json \
  --templates templates \
  --out my-all-projects/<项目>
```
