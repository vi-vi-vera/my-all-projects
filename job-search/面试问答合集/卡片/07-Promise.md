# 卡 07 · Promise（提纲 4.1 / 4.9 手写题）

> 定级：概念 L3 / 手写 all·race·allSettled L3（逻辑对，卡在拼写）｜ 2026-11-16

## 3 句骨架

1. **Promise 是「一件已经开始的事情的凭据」，不是「待执行的任务」**——executor 同步执行、`fetch()` 一调用就发请求，全是 **eager**；只有函数才是 lazy。想要并发控制，手里必须拿函数数组，不能是 Promise 数组。
2. **状态三态单向不可逆，出现两条传值通道**：`resolve(v)` 交给「它自己的 Promise」的后续回调；`return v` 交给「当前 then 产生的新 Promise」——把这两条接混，链上就会收到 `undefined`。
3. **`then` 永远返回新 Promise**，回调返回普通值=fulfilled、返回 Promise=展开等待、抛错=rejected。所以链式是一场接力，不是一起排队。

## 一、状态机

```
pending ──resolve(v)──→ fulfilled
   └─────reject(e)───→ rejected
```
① **settle 后不可变**（fulfilled 不会变 rejected）② **只有第一次生效**，后面的 resolve/reject 全是空操作

三种 settle 方式：`resolve()` / `reject()` / **executor 里抛错**（内部用 try/catch 包住）。
**什么都不做 → 永远 pending**（可用作“永不完成”的占位）。

## 二、then 的四个返回值

| then 里返回 | 新 Promise |
|---|---|
| 普通值 `v` | fulfilled(v) |
| **Promise** | **等它 settle，状态和值都传下去**（展开） |
| 抛错 / throw | rejected(错误) |
| 不返回 | fulfilled(undefined) |

## 三、错误传播

**`catch` 只抓上游，不抓自己。**

```js
p.then(onOk, onErr)        // onErr 管不到 onOk 抛的错
p.then(onOk).catch(onErr)  // ✅ 能管到
```
> 实践：用 `.then().catch()`，别用双参数版。
> `finally`：不接收值、不改变值、原样传递；但它自己抛错/返回 rejected 会**覆盖**原结果。

## 四、静态四兄弟

| 方法 | 成功 | 失败 | 返回 |
|---|---|---|---|
| `all` | 全部成功 | **一个失败立刻 reject，不产出任何数组** | 结果数组，**按传入顺序** |
| `allSettled` | **永不 reject** | —— | `[{status,value\|reason}]` |
| `race` | **第一个 settle**（成功失败都算）| 同左 | 那个结果 |
| `any` | 第一个成功 | 全失败才 reject（`AggregateError`）| 那个值 |

**空数组**：`all([])`/`allSettled([])` → 立刻 `[]`；`race([])` → **永远 pending**

## 五、五个坑

1. `race` 不是“第一个成功的”，是第一个 **settle** 的——先 reject 就整体 reject
2. `all` 短路后**其他 Promise 照样在跑**（没有取消能力），只是结果被丢弃
3. **executor 同步执行**，`resolve()` 不中断它（`p2` 照打）
4. **then 回调永远异步**（进微任务），哪怕 Promise 已 fulfilled
5. **thenable 鸭子类型**：有 `then` 方法的对象会被当成 Promise 展开（`Promise.resolve` 会主动调它的 then）

## 六、手写三件（2026-11-16 实写通过，逻辑全对）

### myAll
```js
function myAll(list) {
  return new Promise((resolve, reject) => {
    if (list.length === 0) return resolve([])      // 不处理会永远 pending
    const results = new Array(list.length)
    let count = 0
    list.forEach((item, i) => {
      Promise.resolve(item).then(                   // 统一成 Promise，兼容普通值/thenable
        (value) => {
          results[i] = value                        // 下标存 → 顺序与传入一致（不是 push）
          if (++count === list.length) resolve(results)
        },
        (reason) => reject(reason)                  // settle 后不可变，无需防覆盖
      )
    })
  })
}
```

### myAllSettled
```js
function myAllSettled(list) {
  return new Promise((resolve) => {                 // 永不 reject，省掉参数
    if (list.length === 0) return resolve([])
    const result = new Array(list.length)
    let count = 0
    const settle = (i, v) => {
      result[i] = v
      if (++count === list.length) resolve(result)
    }
    list.forEach((item, i) => {
      Promise.resolve(item).then(
        (v) => settle(i, { status: 'fulfilled', value: v }),
        (e) => settle(i, { status: 'rejected', reason: e })
      )
    })
  })
}
```

### myRace
```js
function myRace(list) {
  return new Promise((resolve, reject) => {
    if (list.length === 0) return                   // ★ 空数组必须永远 pending
    list.forEach((item) => {
      Promise.resolve(item).then(resolve, reject)   // resolve/reject 本身就是函数
    })
  })
}
```

**三个最容易写错的点**：① `results[i]=` 不是 `push`（顺序）② 空数组分支（all 提前 resolve，race 提前 return）③ **`forEach` 不是 `foreach`**（当天两处都拼错，现场编码直接报错 = 0 分）

## 七、eager vs lazy（面试高频，也决定并发池怎么写）

| 传什么 | 谁启动 | 何时启动 |
|---|---|---|
| **Promise 数组** | 早就启动了 | 传进来之前 |
| **函数数组** | 调用方（pool / myAllLazy） | 被 `fn()` 那一刻 |

> `myAll` 不是发令枪，是**终点收银台**——选手早在创建时跑出去了，它只管按号码牌（下标）记录。
> 这解释了为什么 all 短路后其他请求还在跑：**你从没控制过它们的启动。**

并发池里的执行点：
```js
Promise.resolve().then(() => tasks[i]())   // ★ 执行在这一行
```
为什么包一层：① `tasks[i]()` 同步抛错也能被 `.catch` 接住 ② 进微任务，避免 `run()` 递归爆栈

## 八、两条传值通道（当天最后悟出来的）

```
通道 A：resolve(v) → 让「那个 Promise」fulfilled → 它的 .then 收到 v
通道 B：return v   → 当前 then 回调的返回值 → 成为「新 Promise」的值 → 下一个 then 收到
```

```js
p.then(v => { outerResolve(v); return v })   // 两条都通
p.then(v => outerResolve(v))                  // A 通，B 断了 → 下一个 then 收到 undefined
p.then(v => { return outerResolve(v) })       // ⚠️ 显式 return undefined，B 明确断掉
```

**`return x` 的有效性分场景**：

| 场景 | `return x` 有用吗 |
|---|---|
| executor | ❌ 完全无意义（不会让 Promise 变成 x）|
| then 回调 | ⚠️ 有——决定下一个 then 收到什么 |
| async 函数 | ✅ 等价于 resolve(x) |

## 我的理解（原话 · 2026-11-16）

> 「resolve 只管改最后的状态，return 决定后续的执行要不要走。但如果使用了 `return resolve`，后续的 then 会变成 undefined，因为 return 的是 resolve 的结果。」

> 「传入 myAll 的数组项是在哪执行的？…为什么 `Promise.resolve(item)` 就能执行？」
> —— 这个问题问对了方向：**它不执行任何东西**，执行早在数组构造前就发生了，`Promise.resolve` 只做“统一成 Promise”这一件事。

**当天答错的（坑，重点看）**
| 当时答的 | 正确 |
|---|---|
| `all` 失败时输出 `[1]`，第三项不入数组 | **整体 reject `'e'`，不产出任何数组** |
| `race([new Promise(() => {}), Promise.reject('e')])` 要看谁先执行完 | `() => {}` **永远 pending，永不参与裁决** → 立刻 reject `'e'` |
| 以为 `new Promise(() => {})` 会“执行完返回” | executor 跑完 ≠ settle，**不调 resolve/reject 就永远 pending** |

## 待补
- **手写带重试的并发池**（D2 开头，串起 Promise + 事件循环 + 闭包）
- 可取消的 Promise（AbortController，串案例 3 的 cancel 状态机）
- `async/await` 的串行 vs 并行陷阱（`for await` / `Promise.all` 批量）
