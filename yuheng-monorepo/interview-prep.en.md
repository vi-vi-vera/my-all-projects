# Yuheng Operations Management System (yuheng-monorepo) — Interview Preparation

> Mode: candidate · Role: Frontend · Level: Mid-level

## 📊 Dimension Coverage

| Dimension | Count | IDs |
|-----------|-------|-----|
| 🏗️ architecture | 3 | q-01, q-02, q-06 |
| ⚡ performance | 2 | q-04, q-08 |
| 🛡️ reliability | 1 | q-05 |
| 🔒 security | 1 | q-09 |
| 👁️ observability | 1 | q-07 |
| ⚖️ trade-off | 2 | q-03, q-10 |

---

## 🎯 Project Pitch

### One-liner (Resume)

A frontend Monorepo for the QQ operations management platform, managing 10 micro-frontend sub-applications and 4 shared packages via pnpm workspace, supporting Vue 3 + React dual-framework development with OrangeCI incremental builds and Docker containerized deployment.

### Standard (30–60 seconds)

Yuheng is the QQ operations management system maintained by the XiaoShiJie frontend team, using a pnpm workspace Monorepo architecture to manage 10 sub-applications. The architecture follows a micro-frontend pattern — a React shell handles global routing and authentication while sub-apps (both Vue 3 and React) are independently developed and deployed. The shared layer consists of 4 packages: shared (constants/types/configs), utils, components, and theme-chalk, bundled via tsup into ESM/CJS dual formats. Engineering coverage spans ESLint + Prettier + CommitLint through Husky + lint-staged, CI uses OrangeCI with file-change-scoped incremental builds, and deployment is Docker + Nginx Alpine containerized with Aegis SDK for frontend monitoring.

### Deep Dive (2–3 minutes)

<details>
<summary>Expand</summary>

The Yuheng Operations Management System is the core operations backend for QQ business lines, serving daily management needs of multiple operations teams. The project uses a pnpm workspace Monorepo architecture containing 10 sub-applications (base-framework shell, qq-copilot AI assistant, lucy operations tool, qq-bff-gateway management, qq-qun group management, etc.) and 4 shared packages.

The architecture centers on a micro-frontend pattern: base-framework serves as the React shell handling unified authentication, permission management, and global navigation. Sub-applications achieve path isolation through Nginx route distribution (try_files ensures SPA routing fallback). During deployment, scripts/cp-dist.js aggregates all sub-app build artifacts into a unified dist directory, with Docker images based on Nginx Alpine.

A notable technical decision is Vue 3 and React 17 coexistence — lucy and qq-bff-gateway use Vue 3 + Pinia + TDesign Vue Next, while remaining React sub-apps use Redux Toolkit + TDesign React. ESLint overrides handle framework-specific rules, and shared packages export only framework-agnostic code.

For CI/CD, OrangeCI with incremental builds via ifModify detects file change scope and triggers only affected pipelines; package changes trigger full builds. cache.dockerfile caches node_modules. After CR approval, auto-rebase merge with WeCom bot notifications.

Engineering: TypeScript 5.2.2 strict mode, CommitLint, ls-lint, cspell, preinstall hook forcing pnpm. Monitoring via Aegis SDK for Web Vitals and error reporting.

</details>

---

## ✨ Highlights

1. **🏗️ pnpm workspace Monorepo managing 10+ sub-apps** — `pnpm` `workspace` `monorepo` `tsup` `esbuild`
2. **🏗️ Micro-frontend: Nginx route distribution + React shell** — `micro-frontend` `Nginx` `try_files` `SPA`
3. **⚖️ Vue 3 + React dual-framework coexistence** — `Vue 3` `React 17` `TDesign` `ESLint overrides`
4. **⚡ OrangeCI incremental builds + Docker containerization** — `OrangeCI` `Docker` `Nginx Alpine` `ifModify`
5. **🛡️ Full-chain engineering standards** — `ESLint` `CommitLint` `Husky` `TypeScript strict`

---

## 🏗️ Architecture — 3 Questions

### Q1. How is the Monorepo architecture designed? Why pnpm workspace?

> Source: `tp-001` · scope: infra · sub_project: root

**Standard**: pnpm workspace Monorepo with three package scopes (apps/packages/templates). Chosen for: content-addressable store + hard links (2-3x faster, 50%+ disk savings); non-flat node_modules preventing phantom dependencies; native workspace protocol (workspace:*); filter commands for precise CI builds. Shared packages bundled via tsup into ESM/CJS.

**Follow-ups**: shamefully-hoist and public-hoist-pattern usage? Scaling to 50+ packages?

---

### Q2. How is the micro-frontend architecture designed?

> Source: `tp-002` · scope: frontend · sub_project: base-framework

**Standard**: Shell + Nginx route distribution pattern. React shell handles auth/navigation, sub-apps independently built, cp-dist.js aggregates outputs, Nginx location blocks with try_files for SPA fallback. Communication via @infras/shared (build-time) and URL params (runtime). Pros: zero runtime overhead, tech freedom. Cons: no JS sandbox.

**Follow-ups**: Supporting independent canary releases? Bottlenecks vs qiankun?

---

### Q6. How are shared packages designed and bundled?

> Source: `tp-006` · scope: frontend · sub_project: packages/shared

**Standard**: @infras/shared bundled with tsup (esbuild), 4 sub-modules as independent entry points, package.json exports field for subpath mapping. `import { x } from '@infras/shared/constants'` with Tree Shaking. ESM/CJS dual-format + .d.ts declarations.

---

## ⚡ Performance — 2 Questions

### Q4. CI/CD pipeline and incremental builds?

> Source: `tp-004` · scope: infra · sub_project: ci

**Standard**: OrangeCI pipeline: MR → install → CommitLint → ESLint → scoped build → Docker → CDN → deploy. ifModify matches file changes to trigger paths (e.g., apps/qq-copilot/**). packages/** triggers full build. cache.dockerfile caches node_modules (install: 3-5min → 10s). Auto-rebase merge after CR + WeCom notifications.

---

### Q8. Nginx configuration for SPA routing and performance?

> Source: `tp-011` · scope: infra · sub_project: root

**Standard**: try_files for SPA fallback; location blocks for multi-app routing; gzip compression; sendfile + tcp_nopush for zero-copy; keepalive_timeout 1500; worker_processes 2 + epoll for high concurrency.

---

## 🛡️ Reliability — 1 Question

### Q5. Code quality and standards system?

> Source: `tp-007` · scope: infra · sub_project: root

**Standard**: Four layers: (1) Coding: ESLint + Prettier + TS strict; (2) File naming: ls-lint + cspell; (3) Commit: Husky pre-commit → lint-staged, commit-msg → CommitLint; (4) CI: full ESLint + type check + build. preinstall enforces pnpm via `npx only-allow pnpm`.

---

## 🔒 Security — 1 Question

### Q9. Style isolation in micro-frontend?

> Source: `tp-015` · scope: frontend · sub_project: root

**Standard**: Multi-layer: CSS Modules (.module.less, compile-time hash); BEM + app namespace prefix; Vue scoped style; theme-chalk CSS variables. Encountered TDesign modal mounting to body causing conflicts — resolved via attach container configuration.

---

## 👁️ Observability — 1 Question

### Q7. Frontend monitoring integration?

> Source: `tp-008` · scope: frontend · sub_project: root

**Standard**: @tencent/aegis-web-sdk monitoring: Web Vitals (FCP/LCP/CLS/FID); JS errors + Promise rejections; API success rate and latency; custom events. Micro-frontend: separate instances per app (different PROJECT_IDs), SPA mode auto-reports route PV.

---

## ⚖️ Trade-off — 2 Questions

### Q3. Managing Vue 3 + React coexistence?

> Source: `tp-003` · scope: frontend · sub_project: root

**Standard**: Historical evolution (early Vue 3 → later React). Strategy: ESLint overrides for .vue/.tsx; TDesign unified design; framework-agnostic shared packages; independent vite.config per app. Trade-off: tech freedom vs maintenance cost, onboarding difficulty, component reuse challenges.

---

### Q10. Redesigning the architecture — what changes?

> Source: `tp-002` · scope: fullstack · sub_project: root

**Standard**: Priority: (1) Turborepo (highest ROI via Remote Cache); (2) Testing (Vitest + Testing Library); (3) Module Federation (runtime sharing); (4) Unify to React; (5) Changesets for versioning. Current migration cost > status quo, so engineering-managed coexistence is pragmatic.
