import { UserDashboard } from './components/UserDashboard';
import { ZustandDemo } from './components/ZustandDemo';
import './App.css';

function App() {
  return (
    <div style={{ fontFamily: '-apple-system, "Segoe UI", sans-serif', padding: '20px 40px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>簇 4：React Hooks 单一职责 + Zustand</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
        上半部分：Hook 拆分 | 下半部分：Zustand selector 性能对比
      </p>
      <hr />
      <UserDashboard />
      <hr style={{ margin: '24px 0' }} />
      <ZustandDemo />
    </div>
  );
}

export default App;
