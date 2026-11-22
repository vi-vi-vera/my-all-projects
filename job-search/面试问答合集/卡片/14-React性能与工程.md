# 卡 14 · React 性能与工程

> 定级：L3（主场案例 + S3/S4 理论已补全）｜ 2026-11-22
> 主场案例 = yuheng「FormRender memo 比较函数漏比字段清单」，**你的真货**；308ms 级联是 albertmo 的，不归你。
> 完整取证见 `面试问答合集/React-memo与useMemo踩坑复盘.md`，本卡是浓缩口述版。

## 3 句骨架

1. **`memo` / `useMemo` 是「跳过工作」的优化，不能当正确性保证**——比较维度漏了就功能错（该更新不更新），引用不稳就白套（不该更新却更新），位置放错就崩溃（early return 之后）。
2. **自定义比较函数是「白名单」**：只比你写进去的 props，漏一个影响输出的就是 bug，而且**不报错**。
3. **动态表单的本质是「schema 是状态的函数」**——字段清单会变，不只是值会变；所以比较"值"没变 ≠ "表单"没变。

## 主场案例：FormRender 的 memo 比较函数（问题 ①，你的）

### 背景（QQ 搜索运营后台，模板卡片配置页）

- 页面是**运营后台**：运营给一批搜索词配置结果卡片（搜「奥运」出「热议话题」卡）
- 表单是 **schema 驱动**：`schema` 返回「字段清单」`editData` + 「默认值」`defaultData`，`FormRender` 按清单渲染
- **只有「热议话题」是动态表单**（`isDynamic`），其余 8 种是静态的

### 动态在哪

两个下拉框决定出现哪些字段：

```
dumpMethod（标题怎么跳）: 1=固定链接 → android/ios 链接；2=话题承接页 → 话题名称
indexType（内容从哪来）: 1=运营配置 → 3 个帖子 id；2/3=热门/最新 → 话题 id；4=网络承接页 → 话题名称
```

**字段清单（`editData`）随下拉框变，不只是值变。**

### 现象与根因链

```
切换「内容来源」下拉框
→ schema 重算 → 字段清单变了（要多出输入框）
→ 但 defaultData = { ...schemaDefault, ...data } 的内容没变（编辑态 data 把 schema 默认值盖住）
→ FormRender 的 memo 比较函数只比 defaultData → isEqual 判定"没变"
→ 跳过渲染 → 新输入框出不来
```

| 现象 | 为什么 |
|---|---|
| 只有热议话题出问题 | 只有它的字段清单会变 |
| 只有**编辑态**出问题 | 编辑态的 `data` 覆盖了 schema 默认值，掩盖了变化 |
| 新建态正常 | schema 默认值直接决定 defaultData，选项变则内容变 |

**本质：比较函数只比了「值」（defaultData），没比「字段清单」（editData），而动态表单变的恰恰是字段清单。**

### 当时的修复（你的 `35044e42`）

```tsx
// 父组件多传一个"纯 schema 默认值"（不含已保存的 data）
<FormRender editData={editData}
            defaultData={{ ...defaultData, ...data }}
            templateDefault={defaultData}      // ← 新增
            onChange={...} />

// 比较函数优先比它
React.memo(FormRenderComponent, (prev, next) =>
  prev.templateDefault
    ? isEqual(prev.templateDefault, next.templateDefault)
    : isEqual(prev.defaultData, next.defaultData)
);
```

### 复盘的局限（必须主动说）

1. `templateDefault` 是**间接信号**（碰巧会变），不是 `editData` 本身——某选项只改清单不改默认值时仍会漏
2. 只对热议话题有效，其他模板走 `isEqual(defaultData)` 分支
3. 两套比较逻辑并存，难维护

**更稳的做法**（复盘结论）：

```tsx
// 方案 A：比较函数补上字段清单
isEqual(prev.editData, next.editData) && isEqual(prev.defaultData, next.defaultData)
// 方案 B：字段清单变 = 换了一张表单 → 用 key 强制重建
<FormRender key={`${dumpMethod}-${sourceType}`} ... />   // 简单，但丢未同步的输入值
```

### 一句更深的教训（这是你案例的含金量）

> **死循环的真正切断点应放在更新源头（父组件 `isEqual` 守卫），而不是靠 `memo` 在下游兜底。**
> 用「抑制渲染」去压「状态更新环」，会埋下"该更新却不更新"的隐患。

## 连带案例：window.renderData（问题 ②，你的）

**现象**：异型卡片一次选多个组件，编辑其中一个时，另一个已填内容丢失（`5db7d836a`）；新建任务时预览带上一个任务的内容（`fc3f656f` 补置空）。

**推断根因**（与 ① 同源，未复现）：memo 拦住重渲染后，`FormRender` 手里的 `onChange` 是**上一次放行时的旧闭包**，里面的 `editData` 是旧快照 → `cloneDeep(editData)` 读到旧值 → 覆盖丢失。

**当时的方案**：引入 `window.renderData` 全局变量绕开。**代价**：生命周期脱离组件，靠人记得置空 → 后遗症就是"漏置空"。

**更优方案（分层）**：
| 方案 | 做法 | 定位 |
|---|---|---|
| B | `useRef` 保存最新值替代全局变量 | 改动最小 |
| D | `<TemplateConfig key={taskId}>` 任务切换即重建 | 消除漏清理 |
| A | 函数式 `setState(prev => ...)` | 长期，彻底消除过期闭包 |
| C | 状态上移，表单全受控 | 最彻底，改动大 |

## 60 秒口述（背这个）

> 「QQ 搜索运营后台，模板卡片配置页，表单按 schema 渲染。热议话题我做成了动态表单：两个下拉框决定出现哪些字段。
> 上线后发现**编辑已有任务时切换下拉框，新字段出不来**。原因是左侧表单组件之前为了压渲染死循环加了 `React.memo` 自定义比较函数，只比了 `defaultData`；编辑态下 defaultData 被已保存数据盖住，内容没变，比较判定"不用更新"，但变的其实是字段清单。
> 我当时的做法是新增 `templateDefault` 传 schema 自身的默认值，比较函数优先比它。复盘后我认为更稳的是把字段清单也纳入比较，或者用 `key` 在选项变化时重建组件。」

## 可能的追问

| 追问 | 答法要点 |
|---|---|
| 为什么不直接去掉 memo？ | 它和父组件 `isEqual` 守卫一起压住了死循环，去掉要先确认切断点已在守卫上 |
| 为什么用 templateDefault 不直接比 editData？ | 坦白：权宜之计，间接信号；复盘认为比 editData 或加 key 更稳 |
| 浅比较 vs 深比较怎么选？ | 浅快但依赖引用稳定；深慢且大对象有开销；动态表单用 key 重建更不容易漏 |
| 你怎么发现的？ | 编辑态才复现；定位到 defaultData 被 data 覆盖；对照新建态正常 |

## 边界（守住这几句）

- memo 比较函数是 **jackqqxu** 加的（`bc9f2e3e`）；你的贡献是 `374bb553`（`===`→`isEqual`）、`35044e42`（补 templateDefault）、`2ac43594`（schema 改函数）、`5db7d836a`/`fc3f656f`（全局变量方案）
- **死循环精确机制、问题②与①同源 = 读代码推断，没复现** → 说「我分析认为」，不当事实
- **308ms 级联（0aea7d0）是 albertmo 的，不是你的** → 讲成团队案例需先核实
- 没有量化数据，不报数字

---

# S3 · 性能与排查（2026-11-21 补）

## 总纲（这句定生死）

> **"卡"不是一个问题，是四类问题。先定位它在哪一类，再谈优化——一上来就开 Profiler 是最常见的错误。**

因为 Profiler **只看得到 React 那一段**。瓶颈在别处时，你会查两小时得出"React 没问题"。

## 四类卡

| 类型 | 表现 | 瓶颈在哪 |
|---|---|---|
| ① 渲染太多次 | 敲一个字一堆组件跟着跑 | JS 执行 / 反复 diff |
| ② 单次渲染太贵 | 一次渲染 100ms+，几千行 DOM | 单次工作量大、DOM 节点多 |
| ③ 主线程被别的活占了 | 流式消息、轮询、大 JSON 解析 | 非 React 的长任务 |
| ④ 布局 / 绘制 | JS 很快但滑动卡 | CSS：重排、阴影滤镜、无合成层 |

## 诊断顺序（三步，别跳）

1. **Performance 录一段火焰图**，看主线程时间花在哪：
   - 一片黄/橙 → JS 为主 → 再看是不是 React
   - JS 少、Layout/Paint 长 → ④ 样式
   - 有长任务但火焰里没 React → ③ 第三方/解析/定时器
   - React 占大头 + 很多小短块 → ① 重渲染
   - React 占大头 + 单块特别宽 → ② 单次太重
2. **确认是重渲染**：React DevTools Profiler / React Scan 高亮
3. **定位原因**（五原因表）→ 再选手段

## Profiler 只看三个数

| 看什么 | 判据 |
|---|---|
| 哪些组件亮了 | 亮 = 这次更新渲染了；**范围超预期 = 有问题** |
| 每个组件渲染**次数** | 敲一个字，500 个列表项都渲染 → 实锤 |
| 每个组件**每次耗时** | 次数多但 0.1ms 可能不值得优化；一次 20ms 才是重点 |

外加 **Why did this render** 一列：`Props changed` / `State changed` / `Parent rendered`（最多）/ `Hooks changed`。看到 `Props changed` 而内容没变 = 引用问题。

**最好用的判据**：改一个最局部的 state，看有多少组件跟着跑。只该动一个输入框却整列表都跑 → 引用不稳 / Context / 状态太高。

## 重渲染五原因（背下来）

| # | 原因 | 症状 | 修法 |
|---|---|---|---|
| 1 | 父渲染，子没 `memo` | Profiler 全是 `Parent rendered` | `React.memo`（前提 props 稳） |
| 2 | props 引用每次新建（内联对象/数组/箭头函数） | 加了 memo 还渲染，`Props changed` 但值一样 | `useMemo`/`useCallback` 稳引用，或**只传原始值** |
| 3 | Context value 每次新建 | Provider 一变，**所有** consumer 全渲染 | `useMemo` 包 value；按频率**拆 Context** |
| 4 | 状态放太高 | 输入一个字整页重渲染 | **状态下沉**：输入值放输入框自己组件 / 非受控 + ref |
| 5 | Hooks 依赖不稳 | effect 反复跑、useMemo 不生效 | 依赖写对；函数式 `setState` 减依赖 |

> 加分第 6 条：**selector 不精确**（Redux/Zustand 订阅整个 store）。

**精确性提醒**：`useEffect` 依赖变化 → effect 重跑，**这本身不会导致列表重渲染**，除非 effect 里 `setState`。别说混。

## 一道标准场景的完整答案："搜索框打字，500 行列表全重渲染"

分层修，每层一句代价：

| 层 | 手段 | 代价 |
|---|---|---|
| 1 切断触发源 | 输入值**下沉**到搜索框组件（或非受控 + `useRef`） | 需要把"要用搜索词的地方"改成回调/订阅，结构改动 |
| 2 切断传播 | 列表项 `React.memo` + props 引用稳定（回调 `useCallback`、过滤结果 `useMemo`） | 多一层比较开销；比较函数写错就是正确性 bug（**FormRender 案例**） |
| 3 让输入不被列表拖累 | `useDeferredValue` / `startTransition`（输入优先，列表更新降级） | 列表可能短暂显示旧结果 |
| 4 减少 DOM 数量 | **虚拟列表**（只渲染可视区） | 动态高度难做；滚动定位、锚点、Ctrl+F 都变复杂 |

## memo / useMemo / useCallback 决策树

```
先测：这里真的慢吗？（Profiler 有数才谈优化）
├─ 没测 → 不要加。memo 自己也要比较、也要存缓存
└─ 测到了
   ├─ 慢在"子组件被爹带着渲染"
   │   ├─ props 能稳定（只传原始值 / 稳定的回调）→ React.memo 有效
   │   └─ props 天然不稳定 → memo 白搭，先解决引用（useCallback/useMemo）或改传参形状
   ├─ 慢在"组件内部每次重算"（排序、过滤、解析）→ useMemo
   ├─ 慢在"effect 反复执行导致重复请求/重复 setState" → useCallback 稳函数 + 依赖写对
   └─ 慢在"DOM 太多" → memo 无效，要虚拟列表 / 分页
```

一句话边界：**`memo` 是跳过工作的优化，不是正确性保证**。它写错**不报错**，只会"该更新不更新"。

## Context 拆分

问题：Context 的 value **按引用比较**，Provider 每次渲染新建对象 → 所有 consumer 全渲染，哪怕用到的字段没变。

三种拆法：

| 拆法 | 做法 | 适合 |
|---|---|---|
| 按**变化频率**拆 | 高频的（输入/滚动）和低频的（用户信息/主题）分成两个 Context | 最常用 |
| 按**消费方**拆 | 只有某几个组件要的数据单独一个 Provider | 局部共享 |
| 加 **selector 层** | 用 `use-context-selector` 之类，只订阅用到的字段 | 字段多、消费方分散 |

还有一条更根本的：**能不下沉到 Context 的就别放**（状态四层归属，S4 讲）。

## 虚拟列表原理（30 秒能讲清）

核心只有三步：

1. **算窗口**：`scrollTop` + 容器高度 → 当前该显示第几项到第几项（`startIndex / endIndex`）
2. **只渲染这一段**：外面套一个总高度 = `总条数 × 单项高度` 的占位容器，撑出滚动条
3. **用 `transform: translateY(offset)` 把可见段推到正确位置**

难点（面试官爱追）：
- **动态高度**：先按估算值渲染，渲染后测量真实高度回填，并修正滚动位置
- **流式场景**：最后一条在持续变高 → 只更新它，其他项保持引用稳定，别整个列表重渲染
- **用户往上翻历史时不要强行滚到底**

## 308ms 级联案例（**albertmo 的，团队案例讲法**）

数据（React Scan）：FPS 80，主线程阻塞约 308ms（React 渲染 124ms + hook/effect 184ms），`AssistantMessageInner` 重渲染 20 次、`CheckpointCard` 10 次、`ChatInput` 2 次、`TooltipProvider` **124 次**。

**讲法**：只讲"我们团队怎么定位的"，不讲"我改的"。
> "我们 web 端有个 chat 页，点文件树里的文件会明显卡。用 React Scan 一看，一个 `TooltipProvider` 重渲染了 124 次——原因是上层传下来的对象每次新建，引用不稳，一层层把整棵子树带跑了。这类问题的共性就是：**根因是一个引用，症状是一百次重渲染**。"

**红线**：`0aea7d0` 是 albertmo 的，不认领。

---

# S4 · 工程与设计（2026-11-22 补）

## 一、状态四层归属（第一个问题，最重要）

| 层 | 什么状态 | 放哪 |
|---|---|---|
| L1 局部 | 一次交互内、只有这组件用：展开收起、输入草稿、hover | `useState` |
| L2 单页共享 | 多个兄弟组件要读、不跨路由 | 提升到最近公共父组件 |
| L3 跨页全局 | 用户/权限/主题/菜单 | Context（低频）/ Zustand（高频 + 精细订阅） |
| L4 服务端状态 | 列表/详情数据 | **React Query / SWR（是缓存，不是状态）** |
| 额外：URL | 要分享/刷新还在/能回退的 | query param |

**六句归层口诀**：

1. 要分享 / 回退 / 刷新还在 → **URL**
2. 会过期、要重试、要缓存 → **React Query**（不是 state）
3. 只有这组件用、一次交互内 → **useState**
4. 几个兄弟要读、同页 → **提升**
5. 跨页、低频 → **Context**；跨页、高频 + 精细订阅 → **Zustand**
6. 任何地方都可能触发 → 全局单例/Context，组件只做渲染壳

**关键观念**：服务端数据是**缓存**（会过期、要重试、要合并），不是 state。用 `useState` 管它 = 用抄写本冒充账本。

## 二、受控 vs 非受控

**核心一句话**：区别在“事实来源（single source of truth）”是谁——React state 还是 DOM。

| | 受控 | 非受控 |
|---|---|---|
| 事实来源 | state | DOM |
| 拿值 | 读 state | `ref.current.value` |
| 每次输入 | 重渲染 | 不重渲染 |
| 能做什么 | 实时校验/格式化/联动/回填/禁用 | 提交时取一次值 |
| 代价 | 渲染开销 | 值“感知不到”、程序化改值别扭 |

**判据**：
```
value + onChange            → 受控
defaultValue + onChange     → 非受控（事实来源在组件内部）
```

**口诀**：要“边输入边反应” → 受控；只在提交取一次、表单巨大 → 非受控（react-hook-form 就是这么做的）。

**我的 FormRender**：`editData + defaultData + onChange`、无 value 回传 → **偏非受控**（form-render 内部自己维护值，对外暴露非受控接口）。注意：运营后台代码不在当前仓库，说“从 API 形状看”，别说“读源码确认过”。

## 三、错误边界

**问题**：组件渲染时抛错 → React 默认**卸载整棵树 → 白屏**，且 `try/catch` 包不住（组件是 React 自己调的）。

**解法**：ErrorBoundary（`getDerivedStateFromError`）包住子组件，崩了显示备用 UI。

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div>这块挂了，请刷新</div>;
    return this.props.children;
  }
}
```

**抓不住**：事件处理器、异步（setTimeout/fetch 回调）、SSR 的错误。

**位置（必考）**：**别只放顶层**——那样一个小模块崩，整页白屏。正确 = 顶层一个（总闸）+ 关键模块各一个（分闸）。

## 四、状态库选型：Context / Zustand / React Query

| | Context | Zustand | React Query |
|---|---|---|---|
| 管什么 | 跨层级传值 | 全局状态 | **服务端数据缓存** |
| 在哪 | 组件树里 | React 之外（模块级） | —— |
| 用法 | 要 Provider 包裹 | 直接 import | `useQuery` |
| 重渲染 | **一变全变**（value 按引用比较） | **按 selector 订阅**，只订阅的字段变才重渲染 | 按 key 缓存/去重/重试 |
| 适合 | 低频、小、简单 | 高频、大、精细订阅、组件外要访问 | 会过期、要重试、要合并的数据 |

**Context 最大短板**：一变，所有 consumer 全重渲染。**Zustand 的价值**：`useStore(s => s.user)` 只订阅 user，别的字段变它不重渲染。

**选型结论**：服务端数据永远 React Query，不进 store；低频全局 Context 就够；高频 + 精细订阅才 Zustand。Redux（RTK）定位类似 Zustand，但样板更多，能说清“为什么选轻的”即可。

## 五、可配置化组件设计

**核心**：把“描述”和“渲染”分开。配置 = 纯数据（描述有什么），引擎 = 读配置画 UI（怎么画，只写一次）。

```js
const columns = [
  { key: 'name',   title: '名称', type: 'text' },
  { key: 'status', title: '状态', type: 'tag' },   // type 决定怎么画
];
<Table config={columns} data={data} />
```

**三个关键点**：

1. **默认值合并**：只填和默认不一样的，其余走默认
2. **配置校验**：错误配置在渲染前报出来，别渲染到一半炸
3. **可扩展**：新类型 = 注册渲染器，引擎不动

**挂我的案例**：FormRender 就是 schema 驱动的可配置表单——`editData`（字段清单）= 配置，引擎读它画表单；我那个 bug = 配置（结构）变了、引擎的 memo 比较没感知。
