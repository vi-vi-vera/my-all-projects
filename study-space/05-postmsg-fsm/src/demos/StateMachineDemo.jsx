// ============================================================
// 簇 5 知识点 2：状态机 vs 一堆 boolean flag
//
// 场景：一个"加载 → 流式输出 → 完成/出错"的 AI 对话气泡
// 用 useReducer 实现有限状态机（FSM），状态互斥，不会出非法组合
// ============================================================
import { useReducer, useEffect, useRef } from 'react';

// ★ 状态定义：5 种状态，互斥（任何时刻只能在一种）
// idle → loading → streaming → done
//                           ↘ error
const initialState = {
  status: 'idle',     // 'idle' | 'loading' | 'streaming' | 'error' | 'done'
  text: '',           // 流式累积的文本
  error: null,        // 错误信息
};

// ★ reducer：定义"在状态 X 下收到事件 Y 时，转移到状态 Z"
function chatReducer(state, action) {
  switch (action.type) {
    case 'START':
      // 只有 idle 或 done 或 error 才能重新开始
      if (state.status === 'loading' || state.status === 'streaming') return state;
      return { status: 'loading', text: '', error: null };

    case 'FIRST_TOKEN':
      // loading → streaming
      if (state.status !== 'loading') return state;
      return { ...state, status: 'streaming', text: action.token };

    case 'TOKEN':
      // streaming 状态下累积文本
      if (state.status !== 'streaming') return state;
      return { ...state, text: state.text + action.token };

    case 'DONE':
      if (state.status !== 'streaming') return state;
      return { ...state, status: 'done' };

    case 'ERROR':
      return { status: 'error', text: state.text, error: action.message };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// 模拟流式 AI 回答
function simulateStream(dispatch, signal) {
  const tokens = '这是一段模拟的AI流式回答，每个字符间隔100毫秒输出，用来演示状态机的状态转移过程。'.split('');
  let i = 0;

  dispatch({ type: 'START' });

  return new Promise((resolve) => {
    setTimeout(() => {
      if (signal?.aborted) { dispatch({ type: 'ERROR', message: '被用户取消' }); return resolve(); }
      dispatch({ type: 'FIRST_TOKEN', token: tokens[0] });
      i = 1;

      const timer = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(timer);
          dispatch({ type: 'ERROR', message: '被用户取消' });
          return resolve();
        }
        if (i >= tokens.length) {
          clearInterval(timer);
          dispatch({ type: 'DONE' });
          return resolve();
        }
        dispatch({ type: 'TOKEN', token: tokens[i] });
        i++;
      }, 100);
    }, 500); // 模拟 loading 延迟
  });
}

export function StateMachineDemo() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortRef = useRef(null);

  const startStream = () => {
    // 创建 AbortController（知识点 3 的前置体验）
    abortRef.current = new AbortController();
    simulateStream(dispatch, abortRef.current.signal);
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  // 状态对应的 UI 颜色
  const statusColors = {
    idle: '#888', loading: '#e67e22', streaming: '#2980b9', done: '#27ae60', error: '#c0392b'
  };

  return (
    <div>
      <h2>知识点 2：状态机 vs 一堆 boolean flag</h2>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>状态转移图：</h4>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12 }}>
{`  ┌─────┐   START    ┌─────────┐  FIRST_TOKEN  ┌───────────┐  DONE  ┌──────┐
  │ idle │ ────────→ │ loading │ ───────────→ │ streaming │ ─────→ │ done │
  └─────┘            └─────────┘              └───────────┘        └──────┘
     ↑                     │                        │                  │
     │                     │ ERROR                  │ ERROR            │
     │                     ▼                        ▼                  │
     │               ┌─────────┐              ┌─────────┐             │
     │               │  error  │              │  error  │             │
     │               └─────────┘              └─────────┘             │
     └───────────────────── RESET ────────────────────────────────────┘

✅ 关键：任何时刻只能在一个状态，不会出现 "loading=true 且 error=true" 这种矛盾`}
        </pre>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px' }}>对比：一堆 boolean 的问题</h4>
        <pre style={{ background: '#fff3f3', padding: 12, borderRadius: 6, fontSize: 12 }}>
{`// ❌ 一堆 boolean（3 个 flag 有 2³=8 种组合，其中 5 种是非法的）
const [loading, setLoading] = useState(false);
const [streaming, setStreaming] = useState(false);
const [error, setError] = useState(null);

// 容易写出 bug：
setLoading(true);
setError('oops');  // ← loading=true 且有 error？这是什么状态？

// ✅ 状态机：只有 5 种合法状态，dispatch 保证转移合法性`}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={startStream} disabled={state.status === 'loading' || state.status === 'streaming'}>
          ▶ 开始流式输出
        </button>
        <button onClick={cancel} disabled={state.status !== 'loading' && state.status !== 'streaming'}>
          ⏹ 取消
        </button>
        <button onClick={() => dispatch({ type: 'RESET' })}>
          🔄 重置
        </button>
        <span style={{ color: statusColors[state.status], fontWeight: 'bold', marginLeft: 12 }}>
          状态: {state.status}
        </span>
      </div>

      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #ddd', minHeight: 60, fontFamily: 'monospace' }}>
        {state.status === 'idle' && <span style={{ color: '#888' }}>点击"开始"查看状态转移</span>}
        {state.status === 'loading' && <span style={{ color: '#e67e22' }}>⏳ 加载中...</span>}
        {(state.status === 'streaming' || state.status === 'done') && <span>{state.text}</span>}
        {state.status === 'done' && <span style={{ color: '#27ae60' }}> ✅</span>}
        {state.status === 'error' && <span style={{ color: '#c00' }}>❌ {state.error}</span>}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <strong>观察要点：</strong>
        <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
          <li>loading 状态下"开始"按钮自动禁用 → <b>状态机天然防重复提交</b></li>
          <li>streaming 时点取消 → 状态从 streaming 转到 error → <b>一个 dispatch 搞定</b></li>
          <li>error 状态下点重置 → 回到 idle → <b>状态转移是确定性的</b></li>
        </ul>
      </div>
    </div>
  );
}
