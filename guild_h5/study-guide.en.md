# QQ Guild H5 (guild_h5) — Study Guide

> Companion: `knowledge-map.en.md`
> For developers wanting to understand Hybrid H5 + MPA + mobile monitoring

## Learning Path

| Phase | Theme | Keywords |
|-------|-------|----------|
| A | MPA Architecture & Vite | Multi-entry, manualChunks, code splitting |
| B | Hybrid H5 Development | JSBridge, mqq, multi-platform |
| C | Performance & Monitoring | Prefetch, Oceanus, Aegis, tracking |
| D | Styling & Theming | Dark mode, CSS variables, TailwindCSS |
| E | Deployment & Engineering | Docker, STKE, OrangeCI, multi-env |

## Phase A: Vite MPA
- Build 3-page MPA project, configure manualChunks, analyze output
- Self-check: MPA vs SPA use cases? How to avoid duplicate bundling?

## Phase B: Hybrid H5
- Implement simple JSBridge, wrap as Promise, handle ready timing
- Mobile adaptation: rem, safe-area, keyboard handling
- Self-check: JSBridge communication mechanism? iOS vs Android differences?

## Phase C: Performance & Monitoring
- Implement HTML inline prefetch, compare FCP with/without
- Integrate Sentry, implement behavior tracking
- Self-check: Prefetch race conditions? Monitoring overhead control?

## Phase D: Styling
- CSS variables day/night, TailwindCSS dark:class, dynamic theme color
- Self-check: FOUC prevention? CSS variables vs Less variables?

## Phase E: Deployment
- Write frontend Dockerfile, Nginx alias config, multi-env Vite
- Self-check: Nginx location vs alias? CDN cache versioning?

## Global Self-Check
- [ ] Can you pitch this project in three lengths?
- [ ] Can you draw the complete flow from QQ client opening H5 to data display?
- [ ] Can you name three core differences between Hybrid H5 and pure Web H5?
