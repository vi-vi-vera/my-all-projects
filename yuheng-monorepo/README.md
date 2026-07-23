# 宇恒运营管理系统 (yuheng-monorepo) — 面试复盘材料

> pnpm workspace Monorepo · 微前端(Nginx 路由分发) · Vue 3 + React 17 · TDesign · Vite 4 · Docker · OrangeCI
> Git 仓库：`待补充`

由 `project-interview-coach` skill 全阶段产出，覆盖**候选人 / 面试官 / 知识图谱 / 学习指引**四种视角。

---

## 文件清单

### 候选人视角（stage 3a）

| 文件 | 说明 |
|------|------|
| `interview-prep.zh.md` | 中文面试备战材料（项目介绍 + 10 道 Q&A + 亮点总结） |
| `interview-prep.en.md` | 英文面试备战材料 |

### 面试官视角（stage 3b）

| 文件 | 说明 |
|------|------|
| `interviewer-pack.zh.md` | 中文面试官出题包（10 题 + 压力追问 + 评分卡） |
| `interviewer-pack.en.md` | 英文面试官出题包 |

### 知识图谱视角（stage 3c）

| 文件 | 说明 |
|------|------|
| `knowledge-map.zh.md` | 中文知识图谱（15 个知识点 + 必读 + 动手练习） |
| `knowledge-map.en.md` | 英文知识图谱 |

### 学习指引（stage 3.5）

| 文件 | 说明 |
|------|------|
| `study-guide.zh.md` | 中文零基础学习指引（5 阶段 12 簇 + 自检题） |
| `study-guide.en.md` | 英文学习指引 |

### 中间物（data/）

| 文件 | 说明 |
|------|------|
| `data/project-context.json` | Stage 1 项目上下文（架构/子项目/亮点） |
| `data/tech-points.json` | Stage 2 技术点提取（15 个 tech points） |
| `data/interview-data.json` | Stage 3a 候选人数据（pitch + highlights + questions） |
| `data/interview-data.interviewer.json` | Stage 3b 面试官数据（question bank + rubrics） |
| `data/interview-data.knowledge.json` | Stage 3c 知识图谱数据 |
| `data/study-guide-data.json` | Stage 3.5 学习指引数据 |

---

## 维度覆盖

| 维度 | QA 数量 | 对应题目 |
|------|---------|----------|
| 🏗️ architecture | 3 | q-01, q-02, q-06 |
| ⚡ performance | 2 | q-04, q-08 |
| 🛡️ reliability | 1 | q-05 |
| 🔒 security | 1 | q-09 |
| 👁️ observability | 1 | q-07 |
| ⚖️ trade-off | 2 | q-03, q-10 |

---

## 技术栈概览

| 维度 | 技术选型 |
|------|----------|
| 包管理 | pnpm 8 + workspace |
| 前端框架 | Vue 3 (lucy, bff-gateway) + React 17 (base-framework, copilot, qun 等) |
| 状态管理 | Pinia (Vue) / Redux Toolkit (React) |
| UI 组件库 | TDesign Vue Next / TDesign React / @tencent/power-design-react |
| 构建工具 | Vite 4 (应用) + tsup (公共包) |
| TypeScript | 5.2.2 (strict mode) |
| 代码规范 | ESLint + Prettier + CommitLint + Husky + ls-lint + cspell |
| 部署 | Docker (Nginx Alpine) + OrangeCI + CDN-OA |
| 监控 | @tencent/aegis-web-sdk |

---

## 复现方式

```bash
# 克隆项目
git clone git@git.woa.com:qq_management_system/yuheng-monorepo.git

# 安装依赖
cd yuheng-monorepo && pnpm install

# 启动基座开发
pnpm dev:base

# 启动其他子应用
pnpm dev:copilot
pnpm dev:lucy
pnpm dev:gateway
```
