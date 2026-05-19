import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// ★ 关键：basename 要和 vite base 一致
// 部署到 /qpilot/ 时，改成 basename="/qpilot"
const BASE = '/';  // 修复时改为 '/qpilot'

function Home() {
  return <div><h2>首页</h2><p>当前路径：{window.location.pathname}</p></div>;
}

function About() {
  return <div><h2>关于</h2><p>当前路径：{window.location.pathname}</p></div>;
}

function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div style={{ fontFamily: '-apple-system, sans-serif', padding: 20, maxWidth: 600 }}>
        <h1 style={{ fontSize: 20 }}>簇 6：Vite base + 子路径部署</h1>
        <nav style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Link to="/">首页</Link>
          <Link to="/about">关于</Link>
        </nav>
        <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: '#888' }}>
          <strong>调试信息：</strong>
          <ul>
            <li>window.location.pathname: {window.location.pathname}</li>
            <li>import.meta.env.BASE_URL: {import.meta.env.BASE_URL}</li>
          </ul>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
