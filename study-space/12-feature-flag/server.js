/**
 * Feature Flag + 权限双闸门 演示
 *
 * 场景：新 AI 功能 "smart-reply" 灰度上线
 *   前端：按 flag 隐藏/显示入口（体验层，可被绕过）
 *   后端：按 flag 拒绝请求（安全层，真正的防线）
 */

const express = require('express');
const app = express();
app.use(express.json());

// ── Feature Flag 配置 ──────────────────────────────────────────────────
const FLAGS = {
  'smart-reply': {
    enabled: true,            // 总开关（false = 全关）
    rollout: 10,              // 灰度比例：10% 用户
    whitelist: ['user_001'],  // 白名单：优先通过
  },
};

// ── 核心判断逻辑：用户是否命中 flag ──────────────────────────────────
function isFlagEnabled(flagName, userId) {
  const flag = FLAGS[flagName];
  if (!flag || !flag.enabled) return false;
  if (flag.whitelist.includes(userId)) return true;
  const hash = userId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (hash % 100) < flag.rollout;
}

// ── API 1：前端查询 flag 状态（决定 UI 显不显示） ─────────────────────
app.get('/api/flags', (req, res) => {
  const userId = req.query.userId || 'anonymous';
  const result = {};
  for (const name of Object.keys(FLAGS)) {
    result[name] = isFlagEnabled(name, userId);
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
        message: `功能 ${flagName} 暂未对你开放`,
      });
    }
    next();
  };
}

// ── API 2：受 flag 保护的业务接口 ────────────────────────────────────
app.post('/api/smart-reply', requireFlag('smart-reply'), (req, res) => {
  const { message } = req.body;
  res.json({ reply: `[AI] 收到："${message}"，这是智能回复。` });
});

// ── 演示页面 ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>Feature Flag 演示</title>
<style>
  body { font-family: sans-serif; max-width: 600px; margin: 40px auto; }
  .box { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 12px 0; }
  .green { color: #16a34a; } .red { color: #dc2626; }
  button { padding: 6px 14px; cursor: pointer; margin: 4px; }
</style></head>
<body>
  <h2>Feature Flag + 权限双闸门</h2>
  <div class="box">
    <label>用户ID：<input id="uid" value="user_001" /></label>
    <button onclick="check()">查询 Flag</button>
    <div id="flagResult"></div>
  </div>
  <div class="box">
    <div id="entry"></div>
    <input id="msg" placeholder="输入消息..." style="width:250px;padding:4px;" />
    <button onclick="send()">发送 Smart Reply</button>
    <div id="replyResult"></div>
  </div>
  <div class="box">
    <strong>绕过前端直接调接口</strong><br>
    <small>即使前端隐藏入口，后端也会拦截</small><br>
    <button onclick="bypass()">用 user_999 直接调</button>
    <div id="bypassResult"></div>
  </div>
<script>
async function check() {
  const uid = document.getElementById('uid').value;
  const r = await fetch('/api/flags?userId=' + uid);
  const d = await r.json();
  const on = d.flags['smart-reply'];
  document.getElementById('flagResult').innerHTML =
    'smart-reply: <b class="' + (on ? 'green' : 'red') + '">' + (on ? '✅ 已开放' : '❌ 未开放') + '</b>';
  document.getElementById('entry').innerHTML = on
    ? '<b class="green">✅ 智能回复入口（前端显示）</b>'
    : '<b class="red">❌ 智能回复入口（前端隐藏）</b>';
}
async function send() {
  const uid = document.getElementById('uid').value;
  const msg = document.getElementById('msg').value || '你好';
  const r = await fetch('/api/smart-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
    body: JSON.stringify({ message: msg }),
  });
  const d = await r.json();
  document.getElementById('replyResult').innerHTML = r.ok
    ? '<b class="green">' + d.reply + '</b>'
    : '<b class="red">被拦截：' + d.message + '</b>';
}
async function bypass() {
  const r = await fetch('/api/smart-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'user_999' },
    body: JSON.stringify({ message: '绕过前端' }),
  });
  const d = await r.json();
  document.getElementById('bypassResult').innerHTML = r.ok
    ? '<b class="green">绕过去了</b>'
    : '<b class="red">✅ 被后端拦截：' + d.message + '</b>';
}
</script></body></html>`);
});

const PORT = 3012;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
