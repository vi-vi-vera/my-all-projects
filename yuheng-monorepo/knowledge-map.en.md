# Yuheng Operations Management System (yuheng-monorepo) — Knowledge Map

> Mode: knowledge

---

## 📚 Knowledge Overview

## 🔑 Must Master (9 Topics)

### 1. pnpm workspace & Monorepo
> Dimensions: 🏗️ `architecture` · Used in: `q-01`
- Must read: pnpm Workspace docs, pnpm Motivation, Node.js module resolution
- Hands-on: Create 3-package workspace, compare node_modules structures, use pnpm filter

### 2. Micro-frontend Architecture
> Dimensions: 🏗️ `architecture` · Used in: `q-02`, `q-09`
- Must read: micro-frontends.org, qiankun docs, Module Federation docs
- Hands-on: Nginx multi-SPA routing, qiankun demo, Module Federation demo

### 3. Nginx Configuration & Optimization
> Dimensions: ⚡ `performance` 🏗️ `architecture` · Used in: `q-02`, `q-08`
- Must read: Nginx beginner's guide, location matching rules, sendfile/epoll
- Hands-on: Deploy SPA with try_files, enable gzip, configure Cache-Control

### 4. Vite Build Tool
> Dimensions: ⚡ `performance` · Used in: `q-01`, `q-06`
- Must read: Why Vite, Plugin API, esbuild docs
- Hands-on: Build Vite project, configure proxy/env, write simple plugin

### 5. TypeScript Strict Mode
> Dimensions: 🛡️ `reliability` · Used in: `q-05`
- Must read: TS Handbook Strict Mode, Compiler Options, tsconfig guide
- Hands-on: Migrate JS to strict TS, fix strictNullChecks errors, configure path aliases

### 6. ESLint Multi-framework Config
> Dimensions: 🛡️ `reliability` ⚖️ `trade-off` · Used in: `q-03`, `q-05`
- Must read: ESLint Overrides, plugin-vue, plugin-react
- Hands-on: Configure Vue+React ESLint, write custom rule, Prettier integration

### 7. tsup & Library Bundling
> Dimensions: 🏗️ `architecture` · Used in: `q-06`
- Must read: tsup docs, package.json exports spec, ESM vs CJS
- Hands-on: Multi-entry tsup bundle, subpath exports, compare bundler outputs

### 8. Docker Containerized Deployment
> Dimensions: ⚡ `performance` 🏗️ `architecture` · Used in: `q-04`, `q-08`
- Must read: Dockerfile Best Practices, multi-stage builds, layer caching
- Hands-on: Write Dockerfile, implement node_modules cache layer, compare COPY order impact

### 9. CI/CD Pipeline Design
> Dimensions: ⚡ `performance` 🛡️ `reliability` · Used in: `q-04`
- Must read: CI/CD intro, GitHub Actions/GitLab CI, incremental build strategies
- Hands-on: Full pipeline config, file-change-based triggers, Docker auto-build

---

## ⭐ Bonus (6 Topics)

### 10. Git Hooks & Commit Standards
> 🛡️ `reliability` · `q-05` — Husky + lint-staged + CommitLint

### 11. Web Vitals & Frontend Monitoring
> 👁️ `observability` · `q-07` — Sentry/Aegis SDK, error capture, Lighthouse

### 12. CSS Isolation
> 🔒 `security` 🏗️ `architecture` · `q-09` — CSS Modules, BEM, Shadow DOM

### 13. Architecture Evolution
> ⚖️ `trade-off` · `q-10` — Turborepo, Module Federation, Changesets

### 14. Vue 3 Composition API
> `feature` · `q-03` — Composition API, Pinia, Vue Router 4

### 15. React Hooks & Redux Toolkit
> `feature` · `q-03` — Hooks, createSlice, React Router 6
