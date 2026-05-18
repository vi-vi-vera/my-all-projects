import { useState } from 'react';
import { PostMessageDemo } from './demos/PostMessageDemo';
import { StateMachineDemo } from './demos/StateMachineDemo';
import { AbortControllerDemo } from './demos/AbortControllerDemo';
import './App.css';

function App() {
  const [tab, setTab] = useState(1);

  const tabs = [
    { id: 1, label: '1. postMessage 安全' },
    { id: 2, label: '2. 状态机' },
    { id: 3, label: '3. AbortController' },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, "Segoe UI", sans-serif', padding: '20px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>簇 5：postMessage 安全 + 状态机 + AbortController</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>每个 tab 是一个独立知识点，逐个看完即通关</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 8 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              background: tab === t.id ? '#2c3e50' : '#f5f5f5',
              color: tab === t.id ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 'bold' : 'normal',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 1 && <PostMessageDemo />}
      {tab === 2 && <StateMachineDemo />}
      {tab === 3 && <AbortControllerDemo />}
    </div>
  );
}

export default App;
