// ============================================================
// 簇 5 知识点 1：postMessage 双向 origin 校验
//
// 场景：主页面嵌一个 iframe，通过 postMessage 让 iframe 显示内容
// 安全要求：
//   1. 父→子：指定 targetOrigin（不用 '*'）
//   2. 子→父：校验 event.origin
//   3. 父收回复：校验 event.origin + event.source
// ============================================================
import { useRef, useState, useCallback, useEffect } from 'react';

export function PostMessageDemo() {
  const iframeRef = useRef(null);
  const [input, setInput] = useState('Hello from parent!');
  const [logs, setLogs] = useState([]);
  const [ack, setAck] = useState(null);

  const addLog = useCallback((text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  }, []);

  // ★ 父页面也要监听来自 iframe 的回复，并校验 origin
  useEffect(() => {
    function handleMessage(event) {
      // 安全检查：只接受来自我们 iframe 的消息
      if (event.source !== iframeRef.current?.contentWindow) {
        addLog(`⚠️ 忽略：event.source 不是我们的 iframe`, 'warn');
        return;
      }
      if (event.origin !== window.location.origin) {
        addLog(`⚠️ 拒绝：origin ${event.origin} 不匹配`, 'warn');
        return;
      }

      addLog(`← 收到 iframe 回复: ${JSON.stringify(event.data)}`, 'ok');
      if (event.data.type === 'ACK') {
        setAck(event.data);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const sendMessage = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      addLog('iframe 还没加载完', 'warn');
      return;
    }

    const msg = {
      type: 'UPDATE_CONTENT',
      payload: input,
      id: Date.now(), // 简单用时间戳做消息 ID
    };

    // ★★★ 关键安全点：第二个参数是 targetOrigin
    // 写 '*' = 任何页面都能收到你的消息（危险！）
    // 写具体 origin = 只有目标 origin 匹配才能收到
    iframe.contentWindow.postMessage(msg, window.location.origin);
    addLog(`→ 发送: ${JSON.stringify(msg)}`);
  };

  // 演示"危险写法"
  const sendDangerous = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    // ❌ 危险：targetOrigin 为 '*'
    iframe.contentWindow.postMessage(
      { type: 'UPDATE_CONTENT', payload: '⚠️ 这条用了 targetOrigin: "*"', id: Date.now() },
      '*'  // ← 任何 origin 的 iframe 都能收到！
    );
    addLog(`→ [危险] 发送了 targetOrigin='*' 的消息`, 'warn');
  };

  return (
    <div>
      <h2>知识点 1：postMessage 双向 origin 校验</h2>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>原理图：</h4>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
{`┌─ 父页面 ─────────────────────────────────────────┐
│                                                    │
│  iframe.contentWindow.postMessage(msg, origin)     │
│  ──────────────────→                               │
│                        ┌─ iframe 子页面 ──────┐    │
│                        │ event.origin 校验     │    │
│                        │ 处理 msg              │    │
│  ←──────────────────── │ event.source.postMsg  │    │
│  event.origin 校验     └──────────────────────┘    │
│  event.source 校验                                 │
└────────────────────────────────────────────────────┘

三大安全点：
  ① 发送方指定 targetOrigin（不用 '*'）
  ② 接收方校验 event.origin（白名单）
  ③ 接收方校验 event.source（确认来源窗口）`}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: '6px 10px' }}
          placeholder="输入要发给 iframe 的内容"
        />
        <button onClick={sendMessage} style={{ padding: '6px 12px' }}>
          ✅ 安全发送
        </button>
        <button onClick={sendDangerous} style={{ padding: '6px 12px', background: '#fee', border: '1px solid #c00' }}>
          ❌ 危险发送(*)
        </button>
      </div>

      {ack && (
        <div style={{ padding: 8, background: '#e8f5e9', borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
          ✅ 收到 iframe ACK：消息 ID {ack.id} 已渲染
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="/iframe-child.html"
        style={{ width: '100%', height: 200, border: '2px solid #e8d98a', borderRadius: 8 }}
        title="子页面"
      />

      <div style={{ marginTop: 12, maxHeight: 150, overflow: 'auto', fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 6 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.type === 'warn' ? '#c00' : l.type === 'ok' ? '#178a3f' : '#555' }}>
            [{l.time}] {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
