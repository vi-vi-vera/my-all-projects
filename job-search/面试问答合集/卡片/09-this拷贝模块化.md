# 卡 09 · this / 深浅拷贝 / 模块化（提纲 4.1 收尾）

> 定级：L2（能推演，还需把规则变条件反射）｜ 2026-11-17

## 3 句骨架

1. **`this` 由「调用方式」决定，不是「函数定义在哪」**——四种绑定按优先级：`new` > `call/apply/bind` > `obj.fn()` > 独立调用。**箭头函数是唯一例外**：没有自己的 this，取定义时外层的，`call/bind` 改不了。
2. **浅拷贝复制第一层属性值**——值类型复制值，**引用类型复制地址**（所以嵌套共享）；深拷贝要处理三件事：循环引用、特殊内置对象、原型/不可枚举。
3. **CJS 是运行时 `require`（拍照、值拷贝、包在函数里）；ESM 是编译期 `import`（开窗、实时绑定、模块作用域）**。一个边走边加载，一个先画完地图再走。

## 一、this 四种绑定

| 优先级 | 形式 | this |
|---|---|---|
| 1 | `new Fn()` | 新对象 |
| 2 | `fn.call(o)` / `apply` / `bind` | `o` |
| 3 | `obj.fn()` | `obj`（**只看紧挨着的那个点**）|
| 4 | `fn()` 独立调用 | 严格 `undefined` / 非严格 `globalThis` |

**口诀：谁调用我，我就是谁；没人调用就是 undefined；箭头看定义处。**

```js
const g = obj.f          // 只是把函数拿出来
g()                      // ❌ 不是 obj.f() → this 丢失 → undefined
```

两个必答追问：
- `obj.a.b.fn()` → `this = obj.a.b`
- 对象方法用箭头函数 → 拿不到对象，拿到定义处的 this（常见 bug）

## 二、深浅拷贝

**判据一句话：改嵌套对象，原对象会不会跟着变？** 会变 = 浅。

**深拷贝必须处理三件事**

| 结构 | 做法 |
|---|---|
| **循环引用** | **WeakMap** 存「原对象 → 副本」，遇到拷过的直接返回 |
| **特殊对象**（Date/RegExp/Map/Set/ArrayBuffer）| `Object.prototype.toString.call` 判类型，分别构造 |
| 原型 / 不可枚举 / 函数 | 函数一般共享不拷；保原型用 `Object.create(Object.getPrototypeOf(obj))` |

**现成方案**：`structuredClone(obj)` —— 支持循环引用，**不支持函数和 DOM**
**`JSON.parse(JSON.stringify())` 四坑**：丢 `undefined`/函数/`Symbol`、Date 变字符串、循环引用报错、丢原型

## 三、模块化：CJS vs ESM

**是什么**：JS 拆文件后，需要一套「怎么交出去、怎么拿进来」的约定。**CJS 是 Node 2009 年自己造的；ESM 是 2015 年 ES6 写进语言标准的。**

| | CJS | ESM |
|---|---|---|
| 语法 | `require` / `module.exports` | `import` / `export` |
| 后缀 | `.cjs` 或无 `type` | `.mjs` 或 `"type": "module"` |
| **依赖确定时机** | **运行时**（执行到 require 才找）| **编译期**（先画完依赖图）|
| **导出语义** | **值的拷贝（拍照）** | **实时绑定（开窗）** |
| 环境 | 包在函数里跑（有 `__dirname`）、非严格、顶层 this = `module.exports` | 模块作用域、默认严格、顶层 this = `undefined`、用 `import.meta.url` |

**三个差异各对应一个坑**

**① 拍照 vs 开窗**
```js
// CJS：导出的是当时的值
let count = 0
setTimeout(() => count++, 100)
module.exports = { count }        // 对方永远读到 0
```
```js
// ESM：导出的是"读那个变量"的能力
export let count = 0
setTimeout(() => count++, 100)    // 对方读到 1
```

**② 运行时 vs 编译期**：CJS 的 `require` 能写进 `if`；ESM 的 `import` 必须在顶层（动态用 `await import()`）。代价/收益：ESM 能做 **tree-shaking**，CJS 不能。

**③ 包在函数里**：CJS 的 `require`/`module`/`__dirname` **是函数参数，不是全局变量**——这就是为什么 ESM 里没有它们。

## 四、执行顺序 / 缓存 / 循环依赖（今天最深的三个点）

**执行顺序**：`node b.js` 的入口是 **b**，b 从第一行跑，**执行到 `require('./a')` 才同步跳进 a**，a 的同步代码跑完再回到 b。

**缓存**：`require` 只执行一次，结果存在 `require.cache`。
> **但缓存的不是 exports 的快照，是 module 对象** → `module.exports` 事后被替换，**下次 require 会拿到新对象**；已经拿到的老引用不变。

**循环依赖：不会死锁，会拿到「半成品」**
```js
// a.js
exports.early = 1
const b = require('./b')     // 此时进 b
exports.late = 2

// b.js
const a = require('./a')     // ← cache 命中，返回 a 当前的 exports（只有 early）
console.log(a.late)          // undefined
```
**为什么不死锁**：Node **先占位、后执行**——模块一开始执行就进了 cache（exports 是空对象），所以循环回来看得到「正在构建中的 exports」。
> 这就是「老库把导出写在文件最后」的原因。

## 五、一条通用规则（今天最大的收获）

> **读到任何赋值，先看左边：**
> - `a.b = x` → 进对象里改属性 → **所有持有 a 的人都看得到**
> - `a = x` → 把槽位换个指向 → **只影响之后拿的人**

原型链（换 `Fn.prototype`）、CJS（换 `module.exports`）、浅拷贝、闭包——**全是这一条**。

## 六、ESM 命名空间只读 → 插桩要绕

```js
import * as sdk from 'some-sdk'
sdk.run = wrapper        // ❌ TypeError: read only property
```

`import * as` 拿到的是 **Module Namespace 对象**，规范规定属性只读、不可扩展——**防止 A 模块偷偷改 B 模块的导出**。

```js
const patched = { ...sdk }      // 浅拷贝出普通对象
patched.run = wrapped           // ✅
```
**覆盖边界**：只拦得到「外部通过命名空间访问」的调用；**SDK 内部自调用拦不到**。

**插桩（instrumentation）** = 在调用前后插入观测代码，**只观测不干预**（原样调用、原样返回、原样抛错），用来上报耗时/token/错误。对应卡 05 的「手动插桩 Claude Agent SDK」。

## 我的理解（原话 · 2026-11-17）

**this**
> 「箭头函数的 this 由定义时的外层 this 决定，call 和 bind 都改变不了。」

**深浅拷贝**
> 「浅拷贝只拷贝地址，深拷贝会递归拷贝完整值。」
> → 精修：**浅拷贝是复制第一层属性值**，引用类型才复制地址（所以嵌套共享）。

**模块化**
> 「CJS 和 ESM 都是为了解决 JS 模块化的问题，有两个主要是因为 Node 先出了一版，后面 ES 官方又出了一版。」

**问对的两个问题**（比答案更有价值）
> 「为什么 a 拿到的是老的 exports 对象而不是新的，难道不是在来源文件里执行完整个逻辑之后再导入的吗？」
> → 引出：**require 只等同步代码，异步不在"执行完"的范围里**。
> 「这两个文件的执行顺序是什么，是跑到 b 的 require 时才去 a 里执行吗？」
> → 引出：入口先跑、require 同步跳转、缓存先占位。

**当天答错的**
| 当时答的 | 正确 |
|---|---|
| `g()` 也输出 `'a'` | `undefined`（独立调用，this 丢失）|
| `exports.value = 2` → 打印 1 | 打印 **2**（改对象）|
| `module.exports = {n:2}` → 打印 2 | 打印 **1**（换对象）|
| 循环依赖会卡死 | **不死锁**，返回半成品 |

## 待补
- `call` / `apply` / `bind` 手写（含 bind 的 new 场景）
- `EventEmitter`、`LRU`、`防抖节流`、`深拷贝` 手写
