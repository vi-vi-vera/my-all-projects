// ============================================================
// ✅ 拆分后 Hook 2/3：useUserForm — 只管"表单状态"
// 单一职责：表单字段 + 提交 + 重置
// 依赖方向：接收 initialData（来自 useUserData），单向依赖
// ============================================================
import { useState, useEffect } from 'react';

const fakeApi = {
  updateUser: (data) => new Promise(r => setTimeout(() => r({ ...data, updatedAt: Date.now() }), 500)),
};

export function useUserForm(initialData) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 初始数据到了，回填表单
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
    }
  }, [initialData]);

  const submit = async () => {
    setSubmitting(true);
    await fakeApi.updateUser({ name, email });
    setSubmitting(false);
  };

  const reset = () => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
    }
  };

  return { name, setName, email, setEmail, submitting, submit, reset };
}
