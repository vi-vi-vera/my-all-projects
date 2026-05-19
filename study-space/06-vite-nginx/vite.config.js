import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ★ 关键配置：base
// 改成 '/qpilot/' 后，构建产物的资源路径都会带上这个前缀
// 默认是 '/'，部署到子路径时必须改

export default defineConfig({
  plugins: [react()],
  // base: '/qpilot/',  // ← 取消注释这行就能修复子路径 404
});
