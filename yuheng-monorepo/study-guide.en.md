# Yuheng Operations Management System (yuheng-monorepo) — Study Guide

> Companion doc: `knowledge-map.en.md`
> Target audience: Developers with 1-2 years frontend experience wanting to systematically understand Monorepo + micro-frontend + engineering systems
> Goal: Confidently discuss project architecture, tech decisions, and implementation details in interviews

---

## 0. How to Use This Guide

| Phase | Theme | Clusters | Keywords |
|-------|-------|----------|----------|
| A | Package Management & Engineering | pnpm · TypeScript · Code Standards | workspace, strict mode, ESLint |
| B | Build Tools & Bundling | Vite · tsup | esbuild, ESM/CJS, exports |
| C | Micro-frontend & Deployment | Micro-FE · Nginx · Docker | route distribution, try_files, layer cache |
| D | CI/CD & Monitoring | CI/CD · Frontend Monitoring | ifModify, Aegis, Web Vitals |
| E | Architecture Evolution | CSS Isolation · Evolution | Module Federation, Turborepo |

**Pace**: Phase A-B is interview essential (1-2 weeks), C-D is bonus (1 week), E is advanced (3-5 days).

---

## Phase A: Package Management & Engineering

### Cluster 1 (c-pnpm): pnpm workspace Monorepo

**Scenario**: Managing 10+ sub-apps and 4 shared packages with inter-dependencies.

**Must Read**: pnpm Workspace docs, Motivation, Node.js module resolution
**Hands-on**: Create 3-package workspace, observe node_modules, use pnpm filter, add preinstall guard
**Self-check**: content-addressable store principle? workspace:* behavior? Why non-flat prevents phantom deps?

---

### Cluster 2 (c-typescript): TypeScript Strict Mode

**Scenario**: Working in a strict-mode TypeScript Monorepo, handling common type errors.

**Must Read**: TS Handbook Strict Mode, TypeScript Deep Dive
**Hands-on**: Migrate JS to strict TS, configure path aliases, verify cross-package type inference
**Self-check**: Handling optionals with strictNullChecks? Dealing with noUnusedLocals? tsconfig extends?

---

### Cluster 3 (c-lint): Full-Chain Code Standards

**Scenario**: Building complete code standards and Git Hooks for a multi-framework Monorepo.

**Must Read**: ESLint Overrides, Husky docs, Conventional Commits
**Hands-on**: Configure Vue+React ESLint overrides, set up Husky+lint-staged+CommitLint, test rejection
**Self-check**: Override priority? lint-staged mechanism? Bypassing hooks fallback?

---

## Phase B: Build Tools & Bundling

### Cluster 4 (c-vite): Vite Deep Dive

**Scenario**: Using Vite 4 for dev/build, needing to understand core mechanisms.

**Must Read**: Why Vite, Dep Pre-Bundling, esbuild docs
**Hands-on**: Create Vite project, configure proxy+env, analyze chunks, write plugin
**Self-check**: Why no bundling in dev? Pre-bundling purpose? Production bundler choice?

---

### Cluster 5 (c-tsup): tsup Library Bundling

**Scenario**: Designing package bundling with ESM/CJS, multi-entry, Tree Shaking.

**Must Read**: tsup docs, Node.js exports field, ESM vs CJS comparison
**Hands-on**: Multi-entry tsup config, exports subpath mapping, verify Tree Shaking, dts generation
**Self-check**: import vs require runtime difference? exports vs main/module? Tree Shaking prerequisites?

---

## Phase C: Micro-frontend & Deployment

### Cluster 6 (c-microfrontend): Micro-frontend Architecture

**Scenario**: Designing architecture for 10 independent sub-apps with tech freedom and low overhead.

**Must Read**: micro-frontends.org, qiankun docs, Module Federation
**Hands-on**: Nginx multi-SPA routing, qiankun demo, Module Federation demo
**Self-check**: Nginx vs qiankun vs MF trade-offs? JS sandbox implementations? Safe state sharing?

---

### Cluster 7 (c-nginx): Nginx & SPA Deployment

**Must Read**: Nginx beginner's guide, location matching rules
**Hands-on**: Deploy SPA with try_files, gzip, long-term caching, HTTP/2
**Self-check**: try_files parameters? location priority (= > ^~ > ~ > /)? sendfile+tcp_nopush?

---

### Cluster 8 (c-docker): Docker & Layer Caching

**Must Read**: Dockerfile Best Practices, multi-stage builds
**Hands-on**: Dockerfile with package.json-first strategy, compare COPY order, multi-stage, compare alpine
**Self-check**: How instructions affect layer cache? Why COPY package.json first? Alpine trade-offs?

---

## Phase D: CI/CD & Monitoring

### Cluster 9 (c-cicd): CI/CD Pipeline Design

**Hands-on**: Full pipeline, git-diff-based triggers, Docker cache layers, notifications
**Self-check**: Determining rebuild scope? Cache layers (npm/Docker/Remote)? Branch strategy?

---

### Cluster 10 (c-monitoring): Frontend Monitoring & Web Vitals

**Hands-on**: Integrate Sentry, implement error capture, web-vitals collection, Source Map upload
**Self-check**: FCP/LCP/CLS/FID meanings? Script Error causes? SDK sampling strategies?

---

## Phase E: Architecture Evolution

### Cluster 11 (c-css-isolation): Style Isolation

**Hands-on**: CSS Modules config, CSS variable theming, conflict simulation, Shadow DOM experiment
**Self-check**: CSS Modules compiled format? Vue scoped principle? Shadow DOM limitations?

---

### Cluster 12 (c-evolution): Architecture Evolution

**Hands-on**: Integrate Turborepo, Module Federation demo, Changesets, Vitest testing
**Self-check**: Turborepo Remote Cache? MF vs Nginx applicability? Evaluating upgrade ROI?

---

## 🎯 Global Self-Check

- [ ] Can you pitch this project in one sentence, 30 seconds, and 3 minutes?
- [ ] Can you draw the complete chain from git push to user seeing the page?
- [ ] Can you name top 3 technical highlights and top 3 improvements?
- [ ] Can you compare at least two micro-frontend approaches with recommendations?
- [ ] Can you explain the role of each tool in the pnpm → Vite → tsup → Nginx chain?

---

## 💡 Tips

1. Follow "Read → Do → Check" for each cluster
2. Progress by phase: A-B essential, C-D bonus, E advanced
3. Practice on real yuheng-monorepo code for interview examples
4. If self-check questions aren't fluent, revisit the materials
5. Before interviews, rehearse project_pitch (elevator/standard/deep_dive) until fluent
