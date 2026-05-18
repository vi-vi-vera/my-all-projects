# 簇 4 学习笔记 — React Hooks 单一职责 + Zustand

> 对应学习指引：簇 4（q-10）
> 完成日期：2026-05-18
> 配套代码：`src/hooks/` + `src/store/` + `src/components/`

---

## 一、Hook 拆分：为什么拆、怎么判断该拆

### 3 个拆分信号（面试必答）

| 信号 | 表现 |
|---|---|
| ① useEffect 太多（≥3） | 一个 Hook 里塞了 fetch + 表单回填 + 校验 三个 effect |
| ② 返回值太多（≥8 字段） | 调用方要记 12 个字段，根本记不住 |
| ③ 单测难写 | 想测校验逻辑，得先 mock API + 等 fetch + 改表单值 |

### 拆分原则：按"数据生命周期"

```
useUserData     → 数据从哪来（网络请求）
     ↓ user
useUserForm     → 数据怎么编辑（表单状态）
     ↓ name, email
useUserValidate → 数据对不对（纯计算，无副作用）
     ↓ errors, isValid
```

**依赖方向单向**：Data → Form → Validate，不能反向。

### 依赖架构图（面试画这个）

```
UI（组件）
  ↓ 调用
Hook（useUserData / useUserForm / useUserValidate）
  ↓ 读/写
Store（Zustand）
  ↓ 调用
Service（API / 网络请求）
```

---

## 二、Zustand 核心

### 为什么比 Redux 简单

| Redux | Zustand |
|---|---|
| Provider 包裹 | ❌ 不需要 |
| action type 字符串 | ❌ 不需要 |
| reducer switch-case | ❌ 不需要 |
| connect / mapStateToProps | ❌ 不需要 |
| 创建 store 要 20 行 | **1 行 `create()`** |

### 核心 API

```js
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));

// 组件里用 selector
const count = useStore(s => s.count);
```

### selector 性能优化（面试高频）

| 写法 | 行为 |
|---|---|
| `useStore(s => s.user)` ✅ | 只订阅 user 字段，其它字段变了不重渲染 |
| `useStore().user` ❌ | 订阅整个 store，任何字段变了都重渲染 |

**原理**：Zustand 对 selector 返回值做 `===` 浅比较，引用没变就跳过 re-render。

### slice 模式（大 store 怎么拆）

```js
const createAuthSlice = (set) => ({ isLoggedIn: false, login: (name) => set({...}) });
const createChatSlice = (set) => ({ messages: [], addMessage: (msg) => set({...}) });

const useAppStore = create((...args) => ({
  ...createAuthSlice(...args),
  ...createChatSlice(...args),
}));
```

每个 slice 独立文件，合并时用展开运算符。

---

## 三、React 18 StrictMode 双渲染

- 开发环境下 `<React.StrictMode>` 故意让组件渲染 2 次 + useEffect 执行 2 次
- 目的：检测副作用是否幂等（清理函数写没写对）
- 生产环境不生效
- 面试被问"为什么渲染两次" → 答 StrictMode 是加分点

---

## 四、自检清单

- [x] 能说出 Hook 拆分的 3 个信号（useEffect 多、返回值多、单测难）
- [x] 能解释 `useStore(s => s.user)` 比 `useStore().user` 性能好的原因（=== 浅比较）
- [x] 能画出 UI → Hook → Store → Service 的单向依赖箭头
- [x] 知道 Zustand slice 模式怎么拆合
- [x] 能解释 React 18 StrictMode 双渲染的目的

---

## 五、下一站

**簇 5（q-09）：postMessage 安全 + 状态机 + AbortController**
