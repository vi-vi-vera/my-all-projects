// ============================================================
// 模拟 nginx 的极简静态服务器
// 用法：node serve.js /qpilot/
// 效果：把 dist/ 目录挂载到指定子路径下
//
// 这样你不用装 nginx 就能验证"子路径部署"的 404 问题
// ============================================================
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subpath = process.argv[2] || '/';

const app = express();

// 模拟 nginx 的 location /qpilot/ { root ... }
app.use(subpath, express.static(path.join(__dirname, 'dist')));

// SPA fallback：所有未匹配的路由都返回 index.html（模拟 try_files）
app.use(subpath, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(4000, () => {
  console.log(`静态服务已启动 → http://localhost:4000${subpath}`);
  console.log(`模拟部署路径：${subpath}`);
  console.log('');
  if (subpath !== '/') {
    console.log('⚠️  如果页面白屏/JS 404，说明 vite base 没配对！');
    console.log('   修复：vite.config.js 里 base: "' + subpath + '"');
  }
});
