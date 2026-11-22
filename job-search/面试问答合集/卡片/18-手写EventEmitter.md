# 卡 18 · 手写 EventEmitter（发布订阅）

> 定级：L4（第三版独立写出，6 条用例过 5 条，剩 1 处边界）｜ 2026-11-21（D5）
> 一句话：**结构合成一份，每条记录带 `once` 标记；emit 先摘后调，且用快照遍历。**

## 正确结构（就这一句是关键）

```js
this.events = new Map();   // name -> Array<{ fn, once }>
```

**不要 on 存一份、once 另存一份。** 两套结构就要在两处维护，`off` / `emit` 必然错位——前两版都栽在这里。

## 终版实现

```js
class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
  }

  on(name, fn)   { return this._add(name, fn, false); }
  once(name, fn) { return this._add(name, fn, true);  }

  _add(name, fn, once) {
    const arr = this.events.get(name) || [];
    this.events.set(name, arr);
    arr.push({ fn, once });
    if (arr.length > this.maxListeners) {
      console.warn(`MaxListenersExceeded: ${name} has ${arr.length}`);
    }
    return this;
  }

  off(name, fn) {
    const arr = this.events.get(name);
    if (arr) this.events.set(name, arr.filter(i => i.fn !== fn));
    return this;
  }

  emit(name, ...args) {
    const arr = this.events.get(name);
    if (!arr) return this;
    for (const item of arr.slice()) {          // 快照：防回调里 off 导致漏触发
      if (item.once) {
        const cur = this.events.get(name);     // ← 必须重新取，见坑 4
        const i = cur.indexOf(item);
        if (i > -1) cur.splice(i, 1);          // ← 先摘
      }
      item.fn(...args);                        // ← 后调
    }
    return this;
  }
}
```

## 四个坑（这题的全部难点）

| # | 坑 | 后果 | 正确做法 |
|---|---|---|---|
| 1 | once 里包了一层 wrapper，`off(name, fn)` 拿原函数匹配不到 | 解绑失效，或者**无脑删掉别人的注册** | 记录里直接存 `{ fn, once }`，别包 wrapper；或者 `wrapper.listener = fn` 让 off 两个都比 |
| 2 | `emit` 直接 `forEach` 原数组 | 回调里 off 掉某人 → 数组变短 → **后面的人被跳过** | `arr.slice()` 快照后再遍历 |
| 3 | once **先调后摘** | 回调里再 `emit` 同名事件 → **无限递归爆栈**；回调抛异常 → 永远摘不掉 | **先摘再调** |
| 4 | 摘除时用 emit 开头取到的局部 `arr` | 中途 `off` 会 `Map.set` **换一个新数组**，旧引用是野的 → splice 打在废弃数组上 → **once 永远摘不掉，下次还触发** | 摘除前 `this.events.get(name)` **重新取**，并且 `i > -1` 再 splice |

坑 4 是实测出来的（`indexOf` 返回 -1 时 `splice(-1,1)` 会删掉**最后一个**元素，删错人）。

## 复杂度（面试必问，按这个格式说）

| 操作 | 复杂度 | 说明 |
|---|---|---|
| `on` / `once` | **O(1)** 均摊 | 数组 push |
| `off` | **O(n)** | filter 重建数组，n = 该事件监听数 |
| `emit` | **O(k)**，有 m 个 once 时 **O(m·k)** | 每个 once 一次 indexOf + splice，都是 O(k) |
| 空间 | **O(n)** | n = 全部存着的回调数 |

> 不要说“空间 1”。空间永远是**存了多少东西**。

## 边界 & 加分

- 事件名用 `Map` 而不是 `{}`：普通对象有原型链，`__proto__` / `constructor` 会踩坑
- `maxListeners` 警告是 Node 的行为，加上显得懂 API 形状
- `return this` 支持链式调用
- `off` 后数组留空不删 key：无害，但如果要做 `listenerCount` 记得处理

## 我的三版演进（错在哪，记这个比记代码有用）

| 版 | 结构 | 挂在哪 |
|---|---|---|
| 1 | `events` 对象 + `onceEvents` 对象 | once 只能存一个（键值对覆盖）；off 无脑删 once；emit 未快照；先调后摘 |
| 2 | 两个数组 | once 里 `off` 再 `on`，把自己删了又当普通 on 注册 → **once 等于 on**；复杂度答成全 n、空间 1 |
| 3 | `Map<string, Array<{fn, once}>>` | 主流程对，剩坑 4（局部 arr 失效） |

## 一句话复盘

> 三个版本的差别不在“会不会写”，在**敢不敢先把数据结构定对**。on 和 once 看着是两个行为，本质是同一个存储上的一个布尔位。
