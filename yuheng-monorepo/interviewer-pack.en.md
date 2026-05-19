# Yuheng Operations Management System (yuheng-monorepo) — Interviewer Pack

> Mode: interviewer · Role: Frontend · Level: Mid-level
> This material is for interviewers to select questions and score candidates. **No standard answers included.**

---

## 🏗️ Architecture — 3 Questions

### Q1. Describe your Monorepo architecture. Why pnpm workspace over alternatives?

> id: `iq-01` · source: `tp-001` · scope: infra · difficulty: mid

#### Stress Probes
1. Has pnpm's non-flat node_modules caused compatibility issues? How did you handle them?
2. If packages grow to 50+, can pnpm workspace still meet requirements? What would you consider?

#### Rubric

| Criteria | Weight | Excellent | Pass | Fail |
|----------|--------|-----------|------|------|
| Architecture understanding | 0.40 | Clearly describes three-layer architecture, workspace protocol and non-flat safety | States basic usage and main reasons | Cannot explain structure or pnpm differences |
| Technical depth | 0.35 | Explains from content-addressable store, hard links, phantom deps principles | Knows fast/space-efficient/isolated but unclear on principles | Surface-level only |
| Alternative comparison | 0.25 | Compares Lerna/Yarn/Turborepo/Nx based on project context | Mentions one or two alternatives | Unaware of alternatives |

---

### Q2. How is your micro-frontend implemented? Shell-to-sub-app communication?

> id: `iq-02` · source: `tp-002` · scope: frontend · difficulty: mid

#### Stress Probes
1. Is there JS sandbox isolation? What if one sub-app pollutes globals?
2. Compared to qiankun/Module Federation, where are bottlenecks?

#### Rubric

| Criteria | Weight | Excellent | Pass | Fail |
|----------|--------|-----------|------|------|
| Architecture design | 0.40 | Draws complete request chain, explains rationale and deployment | Describes shell/sub-app responsibilities | Cannot articulate core design |
| Nginx understanding | 0.30 | Explains try_files logic, location priority | Knows try_files is for SPA | Doesn't understand Nginx role |
| Limitation awareness | 0.30 | Proactively identifies no-sandbox/no-sharing limitations | Acknowledges when probed | Believes no issues |

---

### Q6. Shared package design? tsup advantages? Subpath exports?

> id: `iq-06` · source: `tp-006` · scope: frontend · difficulty: mid

#### Stress Probes
1. If sub-app uses one util from @infras/shared, does entire package bundle? Tree Shaking guarantee?
2. What if build:pkg is forgotten after modifying packages? Prevention mechanisms?

#### Rubric

| Criteria | Weight | Excellent | Pass | Fail |
|----------|--------|-----------|------|------|
| Design principles | 0.35 | States framework-agnostic, single responsibility, on-demand import | Knows about shared package abstraction | Unaware of design considerations |
| Bundle config | 0.35 | Explains tsup advantages, ESM/CJS necessity, exports syntax | Knows tsup is used but unclear on details | Unfamiliar with library bundlers |
| Tree Shaking | 0.30 | Explains prerequisites (ESM + sideEffects) and multi-entry advantages | Knows the concept | Unfamiliar |

---

## ⚡ Performance — 2 Questions

### Q4. CI pipeline incremental builds and acceleration?

> id: `iq-04` · source: `tp-004` · scope: infra · difficulty: mid

#### Stress Probes
1. If ifModify misjudges and skips a needed build, what happens? Fallback mechanisms?
2. When does cache.dockerfile invalidate? How to control cache image size?

#### Rubric

| Criteria | Weight | Excellent | Pass | Fail |
|----------|--------|-----------|------|------|
| CI flow | 0.35 | Describes complete stages and artifacts | Knows CI exists but unclear | Cannot describe |
| Incremental principle | 0.40 | Explains ifModify mechanism and packages full-build reasoning | Knows file-change scoping | Doesn't understand concept |
| Optimization | 0.25 | Names Docker cache, store reuse, parallel builds | Knows caching is used | No awareness |

---

### Q8. Nginx config for SPA routing and performance?

> id: `iq-08` · source: `tp-011` · scope: infra · difficulty: mid

#### Stress Probes
1. Long-term caching with frequent code updates — caching strategy design?
2. Security concerns in current Nginx config? Hardening approach?

#### Rubric

| Criteria | Weight | Excellent | Pass | Fail |
|----------|--------|-----------|------|------|
| Routing config | 0.40 | Explains try_files logic, location priority, root vs alias | Knows try_files for SPA | Unfamiliar |
| Performance | 0.35 | Explains sendfile/tcp_nopush/gzip/epoll principles | Knows gzip is on | No awareness |
| Improvements | 0.25 | Proposes HTTP/2, Brotli, Cache-Control, CDN | One or two optimization points | Believes it's sufficient |

---

## ⚖️ Trade-off — 2 Questions

### Q3. Why Vue 3 + React coexist? Management challenges?

> id: `iq-03` · source: `tp-003` · scope: frontend · difficulty: mid

### Q10. Redesigning the architecture — what changes?

> id: `iq-10` · source: `tp-002` · scope: fullstack · difficulty: senior

---

## 🛡️ Reliability — Q5 | 👁️ Observability — Q7 | 🔒 Security — Q9

See Chinese version for full rubrics. Same structure with localized criteria.
