// ============================================================
// Zustand Store：全局状态管理
// 学习要点：
//   1. create() 一行创建 store，比 Redux 简单 10 倍
//   2. selector 用法：useStore(s => s.user) 比 useStore().user 性能好
//   3. slice 模式：大 store 拆成多个小 slice
// ============================================================
import { create } from 'zustand';

// --- authSlice：登录态 ---
const createAuthSlice = (set) => ({
  isLoggedIn: false,
  userName: '',
  login: (name) => set({ isLoggedIn: true, userName: name }),
  logout: () => set({ isLoggedIn: false, userName: '' }),
});

// --- chatSlice：聊天消息 ---
const createChatSlice = (set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
});

// --- 合并成一个 store ---
export const useAppStore = create((...args) => ({
  ...createAuthSlice(...args),
  ...createChatSlice(...args),
}));
