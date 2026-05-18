// ============================================================
// 簇 5 知识点 3：AbortController 取消 fetch
//
// 场景：用户快速切 tab，上一次的 fetch 请求还在飞，回来的数据会覆盖新 tab 的内容
// 解决：切 tab 时 abort() 旧请求，只保留最新的
//
// 对比"setTimeout 忽略结果"：
//   - setTimeout 忽略：TCP 连接还在，数据还在传，带宽白白浪费
//   - abort()：真正断开请求，Network 面板显示 (canceled)，释放资源
// ============================================================
import { useState, useRef, useCallback } from 'react';

// 模拟一个慢 API（延迟 2 秒返回）
function fakeFetch(tabId, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve({ tabId, content: `Tab ${tabId} 的内容加载完成（2秒后）`, time: new Date().toLocaleTimeString() });
    }, 2000);

    // ★ AbortController 的核心：signal 被 abort 时触发 abort 事件
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export function AbortControllerDemo() {
  const [activeTab, setActiveTab] = useState(1);
  const [content, setContent] = useState('点击 tab 加载内容');
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  // ★ 关键：用 ref 存当前的 AbortController，切 tab 时 abort 旧的
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0); // 递增 token，防竞态

  const addLog = useCallback((text, type = 'info') => {
    setLogs(prev => [...prev.slice(-10), { text, type, time: new Date().toLocaleTimeString() }]);
  }, []);

  const loadTab = useCallback(async (tabId) => {
    // 1. 取消上一次请求（如果还在飞）
    if (controllerRef.current) {
      controllerRef.current.abort();
      addLog(`⛔ 取消了上一次请求（tab 切换）`, 'warn');
    }

    // 2. 创建新的 AbortController
    const controller = new AbortController();
    controllerRef.current = controller;

    // 3. 递增 token（防止"旧请求的回调在 abort 前刚好返回"的竞态）
    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;

    setActiveTab(tabId);
    setStatus('loading');
    setContent('');
    addLog(`→ 发起请求: Tab ${tabId}（requestId=${thisRequestId}）`);

    try {
      const result = await fakeFetch(tabId, controller.signal);

      // ★ 双保险：即使没被 abort，也要检查 token 是否还是最新的
      if (thisRequestId !== requestIdRef.current) {
        addLog(`🗑️ 丢弃过期响应: Tab ${tabId}（requestId=${thisRequestId}，当前=${requestIdRef.current}）`, 'warn');
        return;
      }

      setContent(result.content);
      setStatus('done');
      addLog(`✅ 加载成功: ${result.content}`, 'ok');
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog(`⛔ 请求被取消: Tab ${tabId}`, 'warn');
        // 不更新 content — 被取消的请求不应影响 UI
      } else {
        setStatus('error');
        setContent(`加载失败: ${err.message}`);
        addLog(`❌ 加载出错: ${err.message}`, 'error');
      }
    }
  }, [addLog]);

  return (
    <div>
      <h2>知识点 3：AbortController 取消 fetch</h2>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>原理图：</h4>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12 }}>
{`场景：用户快速从 Tab1 切到 Tab2 再切到 Tab3

不用 AbortController：
  T=0s  发起 fetch(Tab1)   ─────────────── 2s 后返回，覆盖 UI ← 用户看到错内容！
  T=0.3s 发起 fetch(Tab2)  ─────────────── 2s 后返回，又覆盖
  T=0.6s 发起 fetch(Tab3)  ─────────────── 2s 后返回（只有这个是对的）

用了 AbortController：
  T=0s  发起 fetch(Tab1)   ─── 被 abort ✂️（TCP 断开，Network 显示 canceled）
  T=0.3s 发起 fetch(Tab2)  ─── 被 abort ✂️
  T=0.6s 发起 fetch(Tab3)  ─────────────── 2s 后返回 ✅（唯一有效的）

关键区别 vs "setTimeout 忽略结果"：
  - abort = 真正断开连接，释放带宽和服务端资源
  - 忽略 = 连接还在占着，数据还在传，只是前端不看了`}
        </pre>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>操作验证：快速点击不同 Tab</h4>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
          每次点击等 2 秒才返回。快速连续点 Tab1 → Tab2 → Tab3，观察日志里"取消"和"丢弃"的记录
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(id => (
          <button
            key={id}
            onClick={() => loadTab(id)}
            style={{
              padding: '8px 16px',
              background: activeTab === id ? '#2980b9' : '#f0f0f0',
              color: activeTab === id ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Tab {id}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #ddd', minHeight: 60 }}>
        {status === 'loading' && <span style={{ color: '#e67e22' }}>⏳ 加载 Tab {activeTab} 中...（2 秒）</span>}
        {status === 'done' && <span style={{ color: '#27ae60' }}>{content}</span>}
        {status === 'error' && <span style={{ color: '#c00' }}>{content}</span>}
        {status === 'idle' && <span style={{ color: '#888' }}>{content}</span>}
      </div>

      <div style={{ marginTop: 12, maxHeight: 180, overflow: 'auto', fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 6 }}>
        <strong>日志：</strong>
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.type === 'warn' ? '#e67e22' : l.type === 'ok' ? '#27ae60' : l.type === 'error' ? '#c00' : '#555' }}>
            [{l.time}] {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
