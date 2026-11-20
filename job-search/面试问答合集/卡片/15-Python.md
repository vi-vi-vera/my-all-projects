# 卡 15 · Python（提纲 1.12，JD 硬性要求）

> 定级：L2（能读能讲，写不熟）｜ 2026-11-19
> 定位：JD 写「Python（或后端主语言 + Python）」，主语言 TS/Node + Python 能上手即可，**不追精通**。

## 3 句骨架

1. **语法是 TS 的对照迁移**：list/dict/tuple/set、推导式、f-string、类型注解——唯一的认知差异是**类型注解运行时完全不检查**（TS 是约束，Python 是建议）。
2. **async/await 和 JS 一样，只多一条**：Python 的事件循环要**手动启动**（`asyncio.run()`），JS 是自动的。
3. **asyncio 是单线程 + 协作式多任务**：`await asyncio.sleep()` 是"让开"，`time.sleep()`/同步 IO 是"堵路"（阻塞整个事件循环），堵了就丢 `asyncio.to_thread()`。

## 一、容器与语法对照

| Python | TS | 要点 |
|---|---|---|
| `list` `[1,2]` | `array` | 可变、可重复 |
| `dict` `{"a":1}` | `object` / `Map` | 键要可 hash |
| `tuple` `(1,2)` | 只读元组 | **不可变**；函数多返回值 = tuple 解包 |
| `set` `{1,2}` | `Set` | 去重、无序 |

**推导式**（倒着读：for → if → 表达式）：
```python
[x * 2 for x in xs if x % 2 == 1]      # ≈ xs.filter(...).map(...)
```

**f-string** ≈ 模板字符串：`f"{name} 有 {n} 分"`

## 二、类型注解：TS 是约束，Python 是建议（关键差异）

```python
def greet(name: str) -> str: ...
greet(123)      # ✅ 不报错——注解运行时完全不检查
```
> 注解只给 IDE / mypy 看。**面试问“Python 类型和 TS 有什么不同”，就答这句。**

## 三、None 与判空

- Python **只有 `None`**（没有 `undefined`）
- 判空用 **`is`** 不是 `==`：`if x is None` / `if x is not None`
- `is` 比较身份（≈ `===`），`==` 比较值（可能被 `__eq__` 重载）

## 四、可变默认参数陷阱（定义时求值）

```python
def bad(items=[]):        # ❌ [] 在定义时只创建一次，调用间共享
    items.append(1)
# bad() → [1]，bad() → [1,1]

def good(items=None):     # ✅ None 哨兵
    if items is None:
        items = []
```
> 和 React `useRef` 同一个教训：**默认参数是"定义时"求值，不是"每次调用"求值。**

## 五、作用域：LEGB

```
查找顺序：L(局部) → E(闭包外层) → G(模块全局) → B(内建)
```
- 读变量自动往上找（和 JS 闭包一样）
- **改外层变量**必须声明 `nonlocal`（闭包）/ `global`（模块），否则赋值 = 新建局部变量
- **Python 闭包 vs JS 闭包的区别**：JS 闭包改外层变量是自然的；Python 里赋值默认新建局部变量，要改必须 `nonlocal`

## 六、asyncio（对照 Node）

| Python | Node/JS |
|---|---|
| `asyncio.run(main())` | Node 自动跑循环（Python 要**显式启动**）|
| `async def` / `await` | 一样 |
| `asyncio.gather(*tasks)` | `Promise.all(tasks)`（注意 `*` 展开）|
| `asyncio.Semaphore(2)` | **手写并发池的 limit** |
| `asyncio.sleep(1)` | `await new Promise(r => setTimeout(r, 1000))` |
| `time.sleep(1)` | 同步阻塞（≈ JS 死循环占满主线程）|
| `asyncio.to_thread(fn)` | `worker_threads` |
| `asyncio.TaskGroup` | 结构化并发（一个挂自动取消其他，3.11+）|

### 协程 = 会暂停的函数

**JS 的 async function 就是协程**；Python 里 `async def` 返回"协程对象"（≈ Promise）。
调用 `f()` 只是创建协程对象，**必须 `await` 或 `asyncio.run()` 才执行**。

### 阻塞 vs 非阻塞（最常考）

| 写法 | 效果 |
|---|---|
| `await asyncio.sleep(0.05)` | **暂停自己**，让出，0.05s 后恢复 |
| `time.sleep(1)` | **整个线程睡 1 秒**，事件循环停摆，别的协程全被拖住 |

> 判据：这个库是 `async def` 的吗？是 → 安全；不是（同步函数，如 `requests.get`）→ 用 `asyncio.to_thread()` 包一下。
> **asyncio 只解决"等 IO"的并发，不解决"算"的并发**（CPU 密集要线程/进程池）。

### Semaphore ≈ 手写并发池

```python
sem = asyncio.Semaphore(2)
async def work(sem, name):
    async with sem:              # 拿许可才进，出来自动还（异常也还）
        await asyncio.sleep(1)
        return f"{name} done"
```
> `async with sem` = 自动的 `acquire / try / finally / release`——**省掉的就是手写并发池里容易漏的 `running--`**。
> 面试句：**"并发控制这层，JS 我自己手写过（计数器 + pump + 重试），Python 用 asyncio.Semaphore，本质同一件事。"**

### gather 两个坑

```python
await asyncio.gather(*[f1(), f2()])      # ① 要 * 展开（签名是 gather(*coros)）
await asyncio.gather(*tasks, return_exceptions=True)   # ② 一个失败不拖累整体
```

## 我的理解（原话 · 2026-11-19）

> 「协程就是会暂停的函数，JS async function 就是协程。」

> 「会直接阻塞整个协程，正确写法是用 to_thread 把他交给另一个线程去跑。」
> → 精修：不是"阻塞整个协程"，是**阻塞整个事件循环**（单线程，一个同步调用把所有人都堵了）。

> 「async with sem = 拿到许可才进去，出来自动还，异常也还。」

## 待补（D4 · Python ②）
- FastAPI 跑通 SSE demo（路由 / Pydantic / StreamingResponse）
- LangGraph StateGraph 概念（节点 / 边 / checkpointer）
- Python 写反转链表、两数之和（算法变体）
