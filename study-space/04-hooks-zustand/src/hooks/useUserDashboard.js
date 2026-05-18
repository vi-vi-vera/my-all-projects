// ============================================================
// ❌ 反面教材：一个"臃肿 Hook"，同时做 3 件事
// 面试信号：参数太多、useEffect 太多、单测难写 → 该拆了
// ============================================================
import { useState, useEffect } from 'react';

// 模拟 API
const fakeApi = {
  fetchUser: () => new Promise(r => setTimeout(() => r({ id: 'u1', name: 'Alice', email: 'alice@example.com' }), 800)),
  updateUser: (data) => new Promise(r => setTimeout(() => r({ ...data, updatedAt: Date.now() }), 500)),
};

export function useUserDashboard() {
  // === 第 1 块：数据获取（本应是独立 Hook） ===
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fakeApi.fetchUser()
      .then(data => { if (!cancelled) { setUser(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setFetchError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // === 第 2 块：表单管理（本应是独立 Hook） ===
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 用户数据加载完后，用它回填表单
  useEffect(() => {
    if (user) {
      setFormName(user.name);
      setFormEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await fakeApi.updateUser({ name: formName, email: formEmail });
    setSubmitting(false);
  };

  const resetForm = () => {
    if (user) {
      setFormName(user.name);
      setFormEmail(user.email);
    }
  };

  // === 第 3 块：校验逻辑（本应是独立 Hook） ===
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const e = {};
    if (formName.trim().length < 2) e.name = '名字至少 2 个字符';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(formEmail)) e.email = '邮箱格式不对';
    setErrors(e);
  }, [formName, formEmail]);

  const isValid = Object.keys(errors).length === 0;

  // === 返回一大坨（调用方要记住 15 个字段，崩溃）===
  return {
    user, loading, fetchError,
    formName, setFormName, formEmail, setFormEmail,
    submitting, handleSubmit, resetForm,
    errors, isValid,
  };
}
