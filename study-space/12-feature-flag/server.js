/**
 * 演示：Feature Flag + 权限双闸门
 *
 * 场景：新 AI 功能"smart-reply"灰度上线
 *   - feature flag：控制谁能看到入口（灰度 / 白名单 / 全量）
 *   - 后端鉴权：即使前端没显示入口，直接调接口也要挡住
 *
 * 运行：node server.js
 * 测试：用 curl 或浏览器访问下面的 URL
 */

const express = require('express');
const app = express();
app.use(express.json());

// ── Feature Flag 配置（真实项目用 LaunchDarkly / GrowthBook / 自建） ─
const FLAGS = {
  'smart-reply': {
    enabled: true,             // 总开关（false = 所有人都看不到）
    rollout: 50,               // 灰度比例：50% 用户
    whitelist: ['user_001', 'user_vip_999'],  // 白名单：强制开启
  },
};

// ── 判断某用户是否命中某个 flag ──────────────────────────────────────
function isFlagEnabled(flagName, userId) {
  const flag = FLAGS[flagName];
  if (!flag || !flag.enabled) return false;         // 总开关
  if (flag.whitelist.includes(userId)) return true; // 白名单直接通过

  // 灰度：用 userId 做哈希，保证同一用户每次结果一样
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % 100) < flag.rollout;
}

// ── API：获取当前用户的 flag 状态（前端用来决定"显示不显示"） ─────────
app.get('/api/flags', (req, res) => {
  const userId = req.query.userId || 'anonymous';

  const result = {};
  for (const flagName of Object.keys(FLAGS)) {
    result[flagName] = isFlagEnabled(flagName, userId);
  }

  res.json({ userId, flags: result });
});

// ── 后端鉴权中间件（这才是真正的安全闸门） ───────────────────────────
function requireFlag(flagName) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || 'anonymous';

    if (!isFlagEnabled(flagName, userId)) {
      return res.status(403).json({
        error: 'feature_not_available',
        message: `功能 ${flagName} 对你还没有开放`,
      });
    }
    next();
  };
}

// ── 受 flag 保护的 API ────────────────────────────────────────────────
app.post(
  '/api/smart-reply',
  requireFlag('smart-reply'),  // 中间件：没 flag 就 403
  (req, res) => {
    const { message } = req.body;
    res.json({
      reply: `[AI 智能回复] 收到你的消息："${message}"，这里是自动生成的回复。`,
    });
  }
);

// ── 演示页面（模拟前端判断） ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>Feature Flag 演示</title>
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        button { padding: 8px 16px; cursor: pointer; margin: 4px; }
        .box { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .green { color: #16a34a; font-weight: bold; }
        .red { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>Feature Flag + 权限 演示</h2>

      <div class="box">
        <label>用户 ID：<input id="uid" value="user_001" /></label>
        <button onclick="checkFlags()">查询我的 Flag</button>
        <div id="flagResult"></div>
      </div>

      <div class="box">
        <div id="smartReplyEntry">（先查询 Flag）</div>
        <input id="msg" placeholder="输入消息..." style="width:300px;padding:6px;" />
        <button onclick="sendReply()">发送 Smart Reply</button>
        <div id="replyResult"></div>
      </div>

      <div class="box">
        <strong>尝试绕过前端直接调接口（blast radius 演示）</strong><br>
        <small>即使前端没显示入口，后端也会检查</small><br>
        <button onclick="bypassTest()">用 user_999 直接调 /api/smart-reply</button>
        <div id="bypassResult"></div>
      </div>

      <script>
        async function checkFlags() {
          const uid = document.getElementById('uid').value;
          const res = await fetch('/api/flags?userId=' + uid);
          const data = await res.json();
          const enabled = data.flags['smart-reply'];
          document.getElementById('flagResult').innerHTML =
            'smart-reply 功能：<span class="' + (enabled ? 'green' : 'red') + '">' +
            (enabled ? '✅ 已开放' : '❌ 未开放') + '</span>';
          document.getElementById('smartReplyEntry').innerHTML = enabled
            ? '<span class="green">✅ 智能回复入口（前端显示）</span>'
            : '<span class="red">❌ 智能回复入口（前端隐藏）</span>';
        }

        async function sendReply() {
          const uid = document.getElementById('uid').value;
          const msg = document.getElementById('msg').value || '你好';
          const res = await fetch('/api/smart-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
            body: JSON.stringify({ message: msg }),
          });
          const data = await res.json();
          document.getElementById('replyResult').innerHTML =
            res.ok ? '<span class="green">' + data.reply + '</span>'
                   : '<span class="red">被拒绝：' + data.message + '</span>';
        }

        async function bypassTest() {
          // user_999 不在白名单，且哈希值不命中 50% 灰度
          const res = await fetch('/api/smart-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'user_999' },
            body: JSON.stringify({ message: '我想绕过 flag' }),
          });
          const data = await res.json();
          document.getElementById('bypassResult').innerHTML =
            res.ok ? '<span class="green">成功（这个用户命中了灰度）</span>'
                   : '<span class="red">✅ 被后端拦截：' + data.message + '</span>';
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = 3012;
app.listen(PORT, () => {
  console.log(`\nFeature Flag 演示服务启动：http://localhost:${PORT}`);
  console.log('\n快速测试（curl）：');
  console.log(`  # 白名单用户（强制开启）`);
  console.log(`  curl "http://localhost:${PORT}/api/flags?userId=user_001"`);
  console.log(`  # 普通用户（看灰度）`);
  console.log(`  curl "http://localhost:${PORT}/api/flags?userId=user_123"`);
  console.log(`  # 调受保护接口`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/smart-reply \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -H "x-user-id: user_001" \\`);
  console.log(`    -d '{"message":"你好"}'`);
});
