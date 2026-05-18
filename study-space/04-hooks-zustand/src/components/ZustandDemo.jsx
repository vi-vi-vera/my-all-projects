// ============================================================
// 组件：Zustand 演示 —— selector vs 整体取值的渲染差异
// ============================================================
import { useAppStore } from '../store/useAppStore';
import { useRef } from 'react';

// --- 用 selector 精确订阅（只有 userName 变了才重渲染）---
function AuthBar() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // ★ 关键：useAppStore(s => s.userName) 只订阅 userName 这一个字段
  const userName = useAppStore(s => s.userName);
  const isLoggedIn = useAppStore(s => s.isLoggedIn);
  const login = useAppStore(s => s.login);
  const logout = useAppStore(s => s.logout);

  return (
    <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 8, marginBottom: 12 }}>
      <strong>AuthBar（用 selector 精确订阅）</strong>
      <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>渲染次数: {renderCount.current}</span>
      <div style={{ marginTop: 8 }}>
        {isLoggedIn
          ? <span>👋 {userName} <button onClick={logout}>登出</button></span>
          : <button onClick={() => login('Alice')}>登录 Alice</button>
        }
      </div>
    </div>
  );
}

// --- 不用 selector，整体取值（任何 store 字段变了都重渲染）---
function ChatPanel() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // ★ 反面教材：useAppStore() 不传 selector → 订阅整个 store
  // 当 AuthBar 里 login/logout 改了 userName，ChatPanel 也会重渲染！
  const store = useAppStore();

  return (
    <div style={{ padding: 12, background: '#fff7f0', borderRadius: 8, marginBottom: 12 }}>
      <strong>ChatPanel（整体取值，无 selector）</strong>
      <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>渲染次数: {renderCount.current}</span>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => store.addMessage(`消息 ${store.messages.length + 1}`)}>
          发一条消息
        </button>
        <button onClick={store.clearMessages} style={{ marginLeft: 8 }}>清空</button>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          {store.messages.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
    </div>
  );
}

// --- 用 selector 的 ChatPanel（对比组）---
function ChatPanelOptimized() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // ★ 正确：只订阅 messages 和需要的 action
  const messages = useAppStore(s => s.messages);
  const addMessage = useAppStore(s => s.addMessage);
  const clearMessages = useAppStore(s => s.clearMessages);

  return (
    <div style={{ padding: 12, background: '#f0fff7', borderRadius: 8 }}>
      <strong>ChatPanel-Optimized（用 selector）</strong>
      <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>渲染次数: {renderCount.current}</span>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => addMessage(`消息 ${messages.length + 1}`)}>
          发一条消息
        </button>
        <button onClick={clearMessages} style={{ marginLeft: 8 }}>清空</button>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          {messages.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function ZustandDemo() {
  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2>Zustand 演示：selector vs 整体取值</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        点"登录/登出"观察 ChatPanel 和 ChatPanel-Optimized 的渲染次数差异
      </p>
      <AuthBar />
      <ChatPanel />
      <ChatPanelOptimized />
    </div>
  );
}
