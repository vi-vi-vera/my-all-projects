// ============================================================
// ✅ 拆分后 Hook 3/3：useUserValidate — 只管"校验"
// 单一职责：接收表单值，输出 errors + isValid
// 依赖方向：依赖表单值（来自 useUserForm），单向
// ============================================================
import { useMemo } from 'react';

export function useUserValidate({ name, email }) {
  // useMemo：只有 name/email 变了才重新算 errors（避免每次渲染都跑正则）
  const errors = useMemo(() => {
    const e = {};
    if (name.trim().length < 2) e.name = '名字至少 2 个字符';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) e.email = '邮箱格式不对';
    return e;
  }, [name, email]);

  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid };
}
