// ============================================================
// 组件：展示"拆分后"的 3 个 Hook 如何组合使用
// ============================================================
import { useUserData } from '../hooks/useUserData';
import { useUserForm } from '../hooks/useUserForm';
import { useUserValidate } from '../hooks/useUserValidate';

export function UserDashboard() {
  // 3 个 Hook 各司其职，依赖方向：Data → Form → Validate（单向箭头）
  const { user, loading, error } = useUserData();
  const { name, setName, email, setEmail, submitting, submit, reset } = useUserForm(user);
  const { errors, isValid } = useUserValidate({ name, email });

  if (loading) return <div style={{ padding: 20 }}>⏳ 加载用户数据...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>❌ {error}</div>;

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>用户资料（拆分后 3 个 Hook 组合）</h2>
      <div style={{ marginBottom: 12 }}>
        <label>姓名：</label>
        <input value={name} onChange={e => setName(e.target.value)} />
        {errors.name && <div style={{ color: 'red', fontSize: 12 }}>{errors.name}</div>}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>邮箱：</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: 220 }} />
        {errors.email && <div style={{ color: 'red', fontSize: 12 }}>{errors.email}</div>}
      </div>
      <button onClick={submit} disabled={!isValid || submitting}>
        {submitting ? '提交中...' : '保存'}
      </button>
      <button onClick={reset} style={{ marginLeft: 8 }}>重置</button>
    </div>
  );
}
