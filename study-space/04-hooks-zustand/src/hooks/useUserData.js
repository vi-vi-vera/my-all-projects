// ============================================================
// ✅ 拆分后 Hook 1/3：useUserData — 只管"拉数据"
// 单一职责：获取用户、处理 loading/error
// ============================================================
import { useState, useEffect } from 'react';

const fakeApi = {
  fetchUser: () => new Promise(r => setTimeout(() => r({ id: 'u1', name: 'Alice', email: 'alice@example.com' }), 800)),
};

export function useUserData() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fakeApi.fetchUser()
      .then(data => { if (!cancelled) { setUser(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { user, loading, error };
}
