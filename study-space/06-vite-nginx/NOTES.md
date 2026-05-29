# 簇 6 学习笔记：Vite base + nginx 反向代理 + 生产部署全家桶

> 对应知识点：q-08
> 目标：搞懂前端项目从 `npm run build` 到用户浏览器能访问，中间经历了什么

---

## 一、先搞懂一个问题：为什么需要 nginx？

### 1. 最简单的情况（不需要 nginx）

```
用户浏览器 → 访问 http://localhost:5173 → Vite 开发服务器直接返回页面
```

开发阶段没问题，但**生产环境不能这样**：

| 问题 | 说明 |
|---|---|
| Vite 是开发服务器 | 性能差，不支持 HTTPS，没有缓存优化 |
| 端口暴露 | 不能直接让用户访问 5173 端口 |
| 前后端不同端口 | 跨域问题 |
| 只有一个服务 | 无法同时挂多个项目 |

### 2. 生产标准方案

```
用户浏览器
    ↓ (80/443 端口，用户无感)
nginx（反向代理服务器）
    ├── 静态文件（HTML/JS/CSS/图片）→ 直接返回，极快
    ├── SPA 路由 → try_files 兜底返回 index.html
    ├── /api/* → 转发给后端 Node/Java 服务
    └── /ws/* → WebSocket 升级转发
```

**一句话理解**：nginx 是"前台接待"，所有请求先到它，它决定是直接返回文件，还是转给后端处理。

---

## 二、Vite `base` 配置：资源路径前缀

### 1. 问题场景

假设你要把项目部署到 `https://example.com/qpilot/`（子路径，不是根目录）

**不配 base 的后果**：

```html
<!-- Vite 打包出来的 index.html -->
<script src="/assets/index.a3f5.js"></script>
<!--                ↑ 绝对路径，从根目录开始 -->
```

用户访问 `https://example.com/qpilot/`，页面加载，但浏览器去 `https://example.com/assets/index.a3f5.js` 找 JS → **404**，因为真实路径是 `/qpilot/assets/index.a3f5.js`。

### 2. 配置 base 解决

```js
// vite.config.js
export default defineConfig({
  base: '/qpilot/',   // ← 所有资源路径自动加这个前缀
  plugins: [react()],
})
```

打包后：

```html
<script src="/qpilot/assets/index.a3f5.js"></script>
<!--                ↑ 正确 -->
```

### 3. React Router 也要配 basename

```jsx
// 错误：路由以为根路径是 /
<BrowserRouter>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
</BrowserRouter>

// 正确：告诉路由"我的根在 /qpilot/"
<BrowserRouter basename="/qpilot">
```

**两个必须一致**：`vite.config.js` 的 `base` 和 `BrowserRouter` 的 `basename` 必须相同，否则路由匹配不上。

### 4. 面试金句

> "Vite base 决定构建产物里所有资源路径的前缀。部署到子路径时必须设置，且要和 React Router 的 basename 一致。不配的话，JS/CSS 会从根路径加载，导致 404。"

---

## 三、nginx 反向代理：是什么、干什么用

### 1. 正向代理 vs 反向代理（最容易混淆）

**正向代理**（VPN 就是典型）：**代理客户端**
```
浏览器 → 正向代理 → 目标服务器
        ↑
   浏览器主动配置代理地址
```
场景：翻墙、公司内网访问外网。客户端知道自己在用代理。

**反向代理**（nginx 就是典型）：**代理服务器**
```
浏览器 → 反向代理(nginx) → 后端服务器
        ↑
   浏览器以为 nginx 就是目标服务器，不知道后面还有后端
```
场景：前后端分离、负载均衡、HTTPS 终结。客户端不知道后面还有后端。

**记忆口诀**：正向代理藏客户端，反向代理藏服务器。

### 2. nginx 反向代理的 4 大作用

| 作用 | 说明 |
|---|---|
| **端口统一** | 用户只访问 80/443，后端服务跑在任意端口（3000/8080），外界看不到 |
| **负载均衡** | 一个域名挂多台后端，nginx 分发请求 |
| **HTTPS 集中管理** | 证书只配在 nginx，后端走内网 HTTP，不用每台机器都配证书 |
| **静态文件加速** | nginx 直接返回静态文件，比 Node/Java 快 10 倍以上 |

### 3. 最核心配置：`proxy_pass`

```nginx
location /api/ {
    proxy_pass http://localhost:3000/;
    #                               ↑ 末尾有斜杠
}
```

**末尾 `/` 是天坑**，决定 nginx 转给后端时**是否剥掉匹配到的路径前缀**：

| `proxy_pass` 写法 | 用户访问 | 转发给后端的路径 |
|---|---|---|
| `http://localhost:3000/` | `/api/users` | `/users`（剥掉 `/api`）✅ 推荐 |
| `http://localhost:3000` | `/api/users` | `/api/users`（不剥）❌ 后端要多写一层 `/api` |

**面试必答**：末尾有 `/` 会剥前缀，让前后端路径解耦。生产环境几乎总是配 `/`。

### 4. 完整的最小可用配置

```nginx
server {
    listen 80;
    server_name localhost;

    # 静态文件（Vite 构建产物）
    location /qpilot/ {
        root /var/www;        # 实际文件路径：/var/www/qpilot/index.html
        try_files $uri $uri/ /qpilot/index.html;
        #                          ↑ SPA fallback，重点讲在下面
    }

    # API 转发给后端
    location /api/ {
        proxy_pass http://localhost:3000/;
        # 传递真实客户端信息（后端拿到的 IP 不是 127.0.0.1）
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 四、`try_files`：SPA 刷新不 404 的核心

### 1. 问题：为什么 SPA 刷新会 404？

React Router 的路由是**前端路由**，URL 变化是 `pushState` 改的，没有真的发 HTTP 请求：

```
用户点击"关于" → URL 变成 /qpilot/about → React Router 前端渲染 → 没问题
```

但用户按 **F5 刷新**：

```
浏览器真的发 HTTP GET /qpilot/about → nginx 去找 /qpilot/about 文件 → 不存在 → 404 ❌
```

**根因**：`/qpilot/about` 是前端虚拟路由，不是真实文件。

### 2. `try_files` 解法

```nginx
location /qpilot/ {
    root /var/www;
    try_files $uri $uri/ /qpilot/index.html;
    #         ①      ②       ③
}
```

**执行顺序**（按顺序找，找到就停）：

1. **`$uri`**：找同名文件 → `/var/www/qpilot/about`（不存在，继续）
2. **`$uri/`**：找同名目录的 index.html → `/var/www/qpilot/about/index.html`（不存在，继续）
3. **`/qpilot/index.html`**：兜底 → 返回 `index.html`，**HTTP 状态码 200** ✅

浏览器拿到 `index.html`，React Router 读取 URL `/qpilot/about`，渲染关于页 → 用户无感知。

### 3. 静态资源为什么不受影响？

`/qpilot/assets/index.a3f5.js` → 第 1 步 `$uri` 直接命中真实文件 → 不走兜底。

**只有找不到的路径才走兜底**，这正是 SPA 需要的语义。

### 4. 面试高频坑：`Unexpected token <`

**现象**：前端请求 `/api/users`，后端挂了或路径不对，nginx 返回了 `index.html`（被 try_files 兜底了）。

前端拿到 HTML 当 JSON 解析 → 报错 `Unexpected token < in JSON at position 0`。

**原因**：`/api/` 的 location 没生效，请求被匹配到了 `/` 的 location，走了 try_files。

**解法**：确保 API 路径的 location 写在前面，且 `proxy_pass` 正确。

### 5. 面试金句

> "try_files 按顺序找文件，最后兜底 SPA 的 index.html，是 SPA 刷新不 404 的标准方案。要注意 API 路径必须单独配置 location，不然 404 的接口会被兜底成 HTML，前端解析 JSON 时报 `Unexpected token <`，这是最高频的生产 bug 之一。"

---

## 五、负载均衡（Load Balancing）

### 1. 为什么需要

单机有上限（内存、CPU、端口数）。当流量超过单机上限，需要多台机器一起扛。

另外：单机挂了全站挂 → 多机有容错能力。

### 2. 基本配置

```nginx
# 定义后端机器组
upstream backend {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080 weight=2;   # 性能好的机器权重高
    server 10.0.0.4:8080 backup;     # 备用机，前面全挂才启用
}

server {
    location /api/ {
        proxy_pass http://backend/;
    }
}
```

### 3. 5 种调度算法

| 算法 | 配置 | 场景 |
|---|---|---|
| 轮询（默认） | 不写 | 机器性能一致 |
| 权重 | `weight=N` | 机器性能不一样 |
| ip_hash | `ip_hash;` | 同一用户固定打同一台（解决 session 问题） |
| least_conn | `least_conn;` | 长连接，谁空闲打谁 |
| fair（第三方） | `fair;` | 谁响应快打谁 |

### 4. 深坑：session 一致性

用户在 server-1 登录，session 存在 server-1 内存。下次请求轮询到 server-2，server-2 不认识 → 被踢回登录。

**3 种解法**：

| 解法 | 评价 |
|---|---|
| ip_hash | 简单但用户换网络（4G→WiFi）就掉，不推荐 |
| session 存 Redis | 主流方案，所有后端读同一份 session |
| JWT | 最现代，session 不存在服务端，根本无此问题 |

### 5. 健康检查

```nginx
upstream backend {
    server 10.0.0.1:8080 max_fails=3 fail_timeout=30s;
    # 30 秒内失败 3 次 → 标记为不健康 → 30 秒后再试
}
```

### 6. 面试金句

> "负载均衡用 nginx upstream 配置，默认轮询。session 一致性是核心考点——生产用 JWT 或 Redis 共享 session，不要用 ip_hash。配合 max_fails + fail_timeout 做健康检查，滚动发版时通过设置 backup 实现零停机。"

---

## 六、HTTPS 与 SSL Termination

### 1. 为什么在 nginx 做 HTTPS？

**反例**：每台后端服务各自配置 HTTPS

```
用户 ──HTTPS──→ Node 服务   （要装证书 + TLS 解密，浪费 CPU）
     ──HTTPS──→ Java 服务   （同上）
     ──HTTPS──→ Python 服务 （同上）
```

**正解**：nginx 统一终结 HTTPS（SSL Termination）

```
用户 ──HTTPS──→ nginx ──HTTP（内网明文）──→ 后端服务
      加密        解密 + 转发
```

好处：
- 证书只管一份
- 后端不用关心加密，写普通 HTTP 即可
- nginx 用 C 写的，TLS 性能远好于 Node/Java

### 2. 配置

```nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;

    ssl_certificate     /etc/nginx/certs/example.crt;
    ssl_certificate_key /etc/nginx/certs/example.key;

    ssl_protocols       TLSv1.2 TLSv1.3;   # 禁用不安全的 TLS 1.0/1.1
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # HTTP 强制跳 HTTPS
    # 写在另一个 server 块里
}
server {
    listen 80;
    return 301 https://$host$request_uri;   # 永久重定向
}
```

### 3. 证书来源

- **Let's Encrypt**：免费，90 天到期，`certbot` 自动续期，中小项目首选
- **云厂商 DV 证书**：国内方便，有免费版
- **OV/EV 证书**：企业级，浏览器地址栏显示公司名，贵

### 4. 面试金句

> "HTTPS 在 nginx 层做 SSL Termination，用户到 nginx 加密，nginx 到后端走内网 HTTP。证书用 Let's Encrypt + certbot 自动续期。要禁用 TLS 1.0/1.1，强制 80 跳 443。这样证书集中管理，后端不用处理加密。"

---

## 七、压缩（gzip / Brotli）

### 1. 为什么压缩？

文本资源（JS/CSS/HTML）压缩后体积能到原来的 **20%~30%**，首屏加载时间直接砍 70%。

### 2. gzip 配置

```nginx
http {
    gzip on;
    gzip_min_length 1k;           # 小于 1k 不压（压完更大）
    gzip_comp_level 6;             # 1-9，6 是性价比甜点
    gzip_types text/plain text/css application/javascript application/json;
    gzip_vary on;                  # 加 Vary 头，CDN 能正确区分
}
```

### 3. Brotli

比 gzip 再小 15%~20%，现代浏览器都支持：

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript;
```

### 4. 注意

- **图片/视频不要压**：已经是压缩格式，再压浪费 CPU 且可能更大
- **敏感接口考虑 BREACH 攻击**：理论风险，实战多数忽略

### 5. 面试金句

> "文本资源在 nginx 开 gzip，体积压到 1/4，首屏快 3 倍。配 Brotli 再省 15%。图片不要压。gzip_vary on 让 CDN 能区分压缩/未压缩版本，避免乱缓存。"

---

## 八、缓存策略

### 1. 浏览器缓存两种机制

| | 强缓存 | 协商缓存 |
|---|---|---|
| 触发条件 | `Cache-Control: max-age=N` | `ETag` / `Last-Modified` |
| 是否发请求 | **不发**，直接用本地副本 | **发**，带 `If-None-Match` 问服务器有没有更新 |
| 状态码 | 200 (from disk cache) | 304 Not Modified |
| 性能 | 最快 | 较快（省带宽但有一次请求） |

### 2. 生产标准配置

```nginx
# 带 hash 的静态资源 → 永久强缓存（内容变了 hash 就变，URL 自然变）
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML → 永远不缓存（每次都拿最新的，里面引用最新 hash 的 JS）
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

# 图片 → 缓存 1 个月
location ~* \.(png|jpg|gif|webp|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public";
}
```

**核心理念**：HTML 不缓存，带 hash 的资源永久缓存。发版只更新 HTML，浏览器自然加载新版本。

### 3. 反向代理缓存（nginx 级缓存）

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /api/products {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;   # 200 响应缓存 5 分钟
    add_header X-Cache-Status $upstream_cache_status;  # HIT / MISS
}
```

适合读多写少的接口，能把后端 QPS 降低 90%。

### 4. 面试金句

> "缓存策略：HTML 用 no-cache 走协商缓存，带 hash 的静态资源用 immutable 永久强缓存。这是 vite/webpack 文件名带 hash 的根本原因——发版只换 HTML，新 HTML 引用新 hash 文件，自然过渡。反代缓存适合读多写少的接口。"

---

## 九、限流（Rate Limiting）

### 1. 防什么？

- 爬虫刷接口
- CC 攻击（海量 HTTP 请求打挂服务器）
- 单个用户占满带宽（下载场景）

### 2. 配置

```nginx
# 定义限流 zone：每个 IP 每秒最多 10 个请求
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api/login {
        limit_req zone=api_limit burst=20 nodelay;
        #          ↑ 突发 20 个排队，nodelay 立即处理不排队
        proxy_pass http://backend/;
    }
}
```

### 3. 算法：漏桶 vs 令牌桶

| | 漏桶（nginx limit_req） | 令牌桶（Redis + Lua） |
|---|---|---|
| 原理 | 请求匀速流出，多的拒绝/排队 | 每秒生成 N 个令牌，有令牌才能通过 |
| 突发处理 | burst 参数控制排队量 | 更灵活，允许突发 |
| 适用 | nginx 层粗粒度 | 业务层细粒度 |

### 4. 连接数 + 带宽限制

```nginx
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

location /download/ {
    limit_conn conn_limit 3;    # 单 IP 最多 3 个并发连接
    limit_rate 500k;            # 单连接限速 500KB/s
}
```

### 5. 面试金句

> "nginx 限流用 limit_req（漏桶算法），按 IP 限流防爬虫和 CC 攻击。burst 控制突发容量，nodelay 让突发请求立即处理。细粒度限流一般在业务层用 Redis + Lua 实现令牌桶。"

---

## 十、CDN 与 nginx 的关系

### 1. CDN 是什么

**内容分发网络**：在全球各地部署边缘节点，把你的静态资源缓存到离用户最近的节点。

```
北京用户 → CDN 北京节点（命中缓存）→ 直接返回，几十毫秒
上海用户 → CDN 上海节点（命中缓存）→ 直接返回
广州用户 → CDN 广州节点（命中缓存）→ 直接返回
都不命中 → 回源到你的 nginx（origin）→ 返回并缓存
```

### 2. CDN 与 nginx 的配合要点

```nginx
# 1. 告诉 CDN 这个资源能缓存多久
add_header Cache-Control "public, max-age=31536000";

# 2. 让 CDN 区分压缩/未压缩版本
add_header Vary "Accept-Encoding";

# 3. 拿真实用户 IP（不然看到的都是 CDN 的 IP）
set_real_ip_from 0.0.0.0/0;
real_ip_header X-Forwarded-For;
```

### 3. 发版后 CDN 缓存刷新

| 方案 | 评价 |
|---|---|
| 等 max-age 过期 | 慢，不可控 |
| CDN 控制台手动刷新 | 快，但麻烦，有频率限制 |
| **文件名带 hash** | **最佳实践**，URL 变了自然 bypass 缓存 |

### 4. 面试金句

> "CDN 本质是分布式反向代理缓存。前端发版避免缓存问题靠文件名 hash，不要依赖 CDN 手动刷新。源站 nginx 要配 set_real_ip_from 拿真实用户 IP，不然限流和日志里的 IP 全是 CDN 的。"

---

## 十一、跨域（CORS）的 nginx 解法

### 1. 三种解法对比

| 解法 | 谁负责 | 推荐度 |
|---|---|---|
| 后端加 CORS 头 | 后端框架 | ⭐⭐⭐ |
| nginx 加 CORS 头 | nginx | ⭐⭐⭐⭐ |
| **反代同源** | nginx | ⭐⭐⭐⭐⭐ |

### 2. 反代同源（最推荐，从根上消除跨域）

```nginx
# 前端 https://app.example.com
# 后端 https://api.example.com  ← 跨域！

# 改成：/api/ 转发给真实后端
location /api/ {
    proxy_pass https://real-api.example.com/;
    # 前端代码里用相对路径 /api/xxx → 浏览器认为是同源 → 不触发 CORS
}
```

### 3. nginx 加 CORS 头（兜底）

```nginx
location /api/ {
    add_header Access-Control-Allow-Origin "https://app.example.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    # 预检请求直接返回，不打后端
    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://backend/;
}
```

`always` 关键字：即使后端返回 5xx，也带 CORS 头，方便前端读取错误信息。

### 4. 面试金句

> "跨域优先用 nginx 反代到同源，从根上消除 CORS 问题。一定要保留跨域时，用 nginx add_header 加 always 标志确保错误响应也带 CORS 头。预检请求 OPTIONS 在 nginx 直接 return 204，省一次后端调用。"

---

## 十二、WebSocket 反代

### 1. 坑点

WebSocket 用 `Upgrade` 头从 HTTP 协议升级到 WS 协议。nginx 默认不传递这个头 → 连接失败。

### 2. 配置（三件套）

```nginx
location /ws/ {
    proxy_pass http://backend/;

    # 这三行缺一不可
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # 长连接超时（默认 60s，WebSocket 要拉长）
    proxy_read_timeout 3600s;
}
```

### 3. 面试金句

> "nginx 反代 WebSocket 必须配三件套：proxy_http_version 1.1、Upgrade 头、Connection upgrade。而且 read_timeout 要设长，否则空闲连接会被 nginx 强制断开。"

---

## 十三、完整生产 nginx.conf 示例

这份配置覆盖了上面所有知识点，能直接背下来应对面试：

```nginx
worker_processes auto;

events {
    worker_connections 10240;
}

http {
    # 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;

    # 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # 反代缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

    # 负载均衡
    upstream backend {
        least_conn;
        server 10.0.0.1:8080 max_fails=3 fail_timeout=30s;
        server 10.0.0.2:8080 max_fails=3 fail_timeout=30s;
    }

    # HTTP 强跳 HTTPS
    server {
        listen 80;
        return 301 https://$host$request_uri;
    }

    # 主站
    server {
        listen 443 ssl http2;
        server_name app.example.com;

        ssl_certificate     /etc/nginx/certs/app.crt;
        ssl_certificate_key /etc/nginx/certs/app.key;
        ssl_protocols       TLSv1.2 TLSv1.3;

        # 静态资源：永久缓存
        location ~* \.(js|css|png|jpg|svg|woff2)$ {
            root /var/www/dist;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API：限流 + 缓存 + 反代
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_cache api_cache;
            proxy_cache_valid 200 5m;
            proxy_pass http://backend/;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 3600s;
        }

        # SPA fallback
        location / {
            root /var/www/dist;
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }
    }
}
```

---

## 十四、面试总结：一段话覆盖所有知识点

> "这个项目用 Vite 打包，配 base 支持子路径部署。生产用 nginx 做反向代理：静态文件和 SPA fallback（try_files）直接由 nginx 处理，API 通过 proxy_pass 转发后端 upstream 做负载均衡。HTTPS 在 nginx 层终结，证书用 Let's Encrypt。静态资源带 hash 配永久强缓存，HTML 配 no-cache。用 limit_req 做 IP 限流防 CC 攻击。跨域通过反代同源从根上解决。"

**这段话覆盖了**：Vite base、nginx 反代、负载均衡、HTTPS、缓存策略、限流、SPA fallback、跨域——8 个面试高频点。

---

## 十五、簇 6 实验清单

### 实验 1：验证 base 配置的影响

```bash
cd study-space/06-vite-nginx

# 1. 不配 base，构建，用 serve.js 模拟子路径部署
#    → 页面能打开但 JS/CSS 404

# 2. 取消 vite.config.js 里 base 的注释，改 basename
#    → 页面和资源都正常
```

### 实验 2：验证 try_files / SPA fallback

```bash
# 1. 构建后启动 serve.js
node serve.js /qpilot

# 2. 访问 http://localhost:3000/qpilot/ → 正常
# 3. 点"关于" → URL 变 /qpilot/about，页面正常
# 4. 按 F5 刷新 → 仍然是关于页，不 404 ✅
```

---

## 十六、全局自检答题

（学完所有簇后回来作答）

6. **Vite `base` 没配会怎样？**
   → 构建产物资源路径从根目录开始，部署到子路径时 JS/CSS 全部 404。

6b. **`proxy_pass` 末尾的 `/` 有什么影响？**
   → 有 `/` 剥前缀（`/api/users` → `/users`），无 `/` 不剥（`/api/users` → `/api/users`）。

6c. **SPA 刷新 404 怎么解决？**
   → nginx 配 `try_files $uri $uri/ /index.html`，找不到的路径兜底返回 index.html 让前端路由处理。

6d. **`Unexpected token < in JSON` 是什么原因？**
   → API 请求被 try_files 兜底返回了 HTML，前端当 JSON 解析失败。检查 API location 是否正确匹配。

6e. **HTTPS 为什么在 nginx 做？**
   → SSL Termination，证书集中管理，后端走内网 HTTP 不用处理加密，nginx TLS 性能远好于业务服务器。

6f. **负载均衡 session 一致性怎么解决？**
   → 用 JWT（无状态）或 Redis 共享 session，不要用 ip_hash（用户换网络会掉）。

---
