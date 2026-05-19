# QQ Guild H5 Pages Repository (guild_h5) — Interview Preparation

> Mode: candidate · Role: Frontend · Level: Mid-level

## 📊 Dimension Coverage

| Dimension | Count | IDs |
|-----------|-------|-----|
| 🏗️ architecture | 2 | q-01, q-02 |
| ⚡ performance | 1 | q-03 |
| 🛡️ reliability | 1 | q-06 |
| 🔒 security | 1 | q-08 |
| 👁️ observability | 1 | q-04 |
| ⚖️ trade-off | 1 | q-07 |
| ✨ feature | 1 | q-05 |

## 🎯 Project Pitch

### One-liner
A unified repository for all QQ Guild H5 pages, managing 63 independent business pages via Vite MPA architecture, running in QQ client WebView with deep native integration through mqq bridge, supporting full dark mode and four-channel monitoring.

### Standard (30-60s)
guild_h5 is the unified H5 static pages repository for QQ Guild, built with Vue 3 + TypeScript + Vite 2.7 using MPA multi-page architecture managing 63 independent business pages. Deep QQ WebView integration via mqq bridge for navigation, sharing, and device interaction across iOS/Android/Mac/Win. TailwindCSS + Less styling with full dark mode and QQ premium themes. Four-channel monitoring: Oceanus tracing + Aegis performance + Universal Report + Atta behavior. OrangeCI + Docker + STKE(K8s) deployment with four-environment automation.

## Key Questions

### Q1. Why MPA over SPA? (architecture)
63 pages are independent business modules opened from different QQ entries; MPA provides natural isolation, independent deployment, and smaller bundles. vite-plugin-mpa + manualChunks for shared vendor caching.

### Q2. Hybrid H5 native interaction? (architecture)
mqq JSBridge for navigation control, ARK sharing, device info. Encapsulated as hooks. iOS/Android bridge timing differences require graceful degradation.

### Q3. Request prefetch implementation? (performance)
HTML inline script initiates fetch during page load, Vue consumes cached data on mount. 90%+ hit rate, 200-500ms white-screen reduction.

### Q4. Four-channel monitoring? (observability)
Oceanus (CGI tracing), Aegis (performance/errors), Universal Report (business KPIs), Atta (behavior tracking). Technical→Oceanus+Aegis, Business→Report+Atta.

### Q5. Dark mode design? (feature)
Three layers: system prefers-color-scheme + QQ bridge, CSS variables day/night, premium RGB Token override. TailwindCSS dark:class.

### Q6. CI/CD multi-environment? (reliability)
Branch-to-env mapping: master→prod, test→test(auto), bugfix/*→pre(auto), release/*→branch. Docker+STKE deployment.

### Q7. TailwindCSS + Less mixed? (trade-off)
Tailwind for rapid layout, Less for complex component styles, legacy migration cost. Low specificity prevents conflicts.

### Q8. Request security? (security)
CSRF Token (bkn hash from cookie skey) + 2x retry + global error interception + loading dedup.
