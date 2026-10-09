# 技术负债治理管理平台 — 面试复盘材料

> React 18 · TypeScript · Vite 2 · TDesign React · Redux Toolkit · Axios · SheetJS · Nginx · Docker · Orange CI · TKEx · 伽利略
> Git 仓库：`git@git.woa.com:qq_management_system/tech-debt-manage.git`
> 角色：全栈　|　目标级别：中级

由 `project-interview-coach` 全阶段产出，覆盖**候选人 / 面试官 / 知识图谱 / 学习指引**四种视角。

2025-02-14 的 Initial commit 作者是 `yichenlliu`。菜单、通用表格、Excel 导入导出、登录态处理和测试/正式发布链路都在本人提交范围内。2026 年的移动端适配由其他同事提交，材料不把它算作本人成果。

## 文件清单

### 候选人视角（stage 3a）

| 文件 | 说明 |
|------|------|
| `data/interview-data.json` | 9 道候选人 Q&A，七维全覆盖 |
| `interview-prep.zh.md` | 中文面试备战材料 |
| `interview-prep.en.md` | 英文面试备战材料 |

### 面试官视角（stage 3b）

| 文件 | 说明 |
|------|------|
| `data/interview-data.interviewer.json` | 9 道题、压力追问和评分卡 |
| `interviewer-pack.zh.md` | 中文面试官出题包 |
| `interviewer-pack.en.md` | 英文面试官出题包 |

### 知识图谱视角（stage 3c）

| 文件 | 说明 |
|------|------|
| `data/interview-data.knowledge.json` | 25 个知识点，含反向索引 |
| `knowledge-map.zh.md` | 中文知识图谱 |
| `knowledge-map.en.md` | 英文知识图谱 |

### 学习指引（stage 3.5）

| 文件 | 说明 |
|------|------|
| `data/study-guide-data.json` | 4 个阶段、4 个学习簇 |
| `study-guide.zh.md` | 中文学习指引 |
| `study-guide.en.md` | 英文学习指引 |

### 中间物（data/）

| 文件 | 说明 |
|------|------|
| `data/project-context.json` | 项目上下文 |
| `data/tech-points.json` | 9 个技术点 |

## 维度覆盖

| 维度 | QA 数量 | 对应题目 |
|------|---------|----------|
| architecture | 2 | q-01 动态路由 · q-02 通用表格 |
| feature | 1 | q-03 Excel 导入导出 |
| performance | 1 | q-07 分页与一次拉全量 |
| reliability | 2 | q-04 tRPC 返回头 · q-09 发布节奏 |
| observability | 1 | q-05 伽利略 |
| trade-off | 1 | q-08 顶层 await |
| security | 1 | q-06 Cookie 与鉴权地址 |

原始扫描保留在仓库的 `.codebuddy/interview-coach/scan-bundle.json`，未放入本目录。
