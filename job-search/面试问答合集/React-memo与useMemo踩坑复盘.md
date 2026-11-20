# React memo / useMemo 踩坑复盘

> 来源：2026-11-20 对 `yuheng-monorepo`（远程 `git@git.woa.com:qq_management_system/yuheng-monorepo.git`）与 `qpilot/web` 两个仓库的提交逐条读 diff。
> 归属：提纲「前端保底线」中 React 渲染 / hooks / 性能一类题；通用理论见 [`卡片/13-React渲染与Hooks-上.md`](./卡片/13-React渲染与Hooks-上.md)，本文是**真实案例**。
> 本仓库只存了面试材料（`my-all-projects/yuheng-monorepo/`），不是源码；源码需从上面的远程地址克隆。

## 先看这几条（防踩坑）

| 项 | 结论 |
|---|---|
| 你记忆里的「useMemo 导致页面问题」 | 在 yuheng 里**实际是 `React.memo` 的自定义比较函数**，仓库里没有任何 `useMemo` 的修复提交 |
| 真正与 `useMemo` 有关的两条 | 都在 `qpilot/web`，作者是 **albertmo**，**不是你** |
| 你本人的提交 | 只有 yuheng 的 `374bb553`、`35044e42`、`5db7d836a`、`fc3f656f` 等（作者 `yichenlliu`） |
| 推断 vs 事实 | 标「推断」的部分是读代码推出的，**未运行复现**，面试时用「我分析认为」表述 |

## 四个问题总览

| # | 仓库 | 关键提交 | 现象 | 故障类型 | 作者 |
|---|---|---|---|---|---|
| ① | yuheng | `bc9f2e3e` → `374bb553` → `35044e42` | 编辑态切换下拉框，新字段不出现 | `memo` 比较函数漏比属性 | 加 memo：jackqqxu；改深比较、补修复：**你** |
| ② | yuheng | `5db7d836a`、`fc3f656f` | 多组件编辑时内容丢失、预览串数据 | 过期闭包（与①同源，推断） | **你** |
| ③ | web | `0aea7d0` | 点文件树 Chat 页卡顿 | 引用不稳击穿 `memo` | albertmo |
| ④ | web | `2782cf9` | 特定时刻可能崩溃 | `useMemo` 在 early return 之后 | albertmo |

---

## 一、先讲原理：memo / useMemo 怎么工作

四个问题共用同一套机制，先讲清楚再看案例。

### 1. 渲染模型

- 组件是函数，**父组件重渲染时，默认所有子组件跟着重渲染**，即使传给子组件的内容没变。
- 重渲染 = 把函数再跑一遍，函数体里每次新建的对象、数组、函数，都是**全新引用**。

### 2. 三个「跳过工作」的工具

| 工具 | 缓存什么 | 靠什么判断「没变」 | 没变时 |
|---|---|---|---|
| `React.memo(组件)` | 组件的渲染结果 | 新旧 **props** 逐项比较 | 跳过该组件重渲染 |
| `useMemo(fn, deps)` | 一个计算出的值 | 新旧 **deps** 逐项比较 | 返回上次的值 |
| `useCallback(fn, deps)` | 一个函数本身 | 同 `useMemo` | 返回同一个函数引用 |

默认都用 `Object.is` **浅比较**（比引用，不比内容）：

```js
Object.is(1, 1)          // true  基本类型比值
Object.is({a:1}, {a:1})  // false 内容一样，但是两个对象
```

### 3. 引用稳定性

```tsx
function Parent() {
  const obj = { a: 1 };            // 每次渲染都是新对象
  const fn = () => {};             // 每次渲染都是新函数
  return <Child obj={obj} fn={fn} />;   // Child 套了 memo 也白套
}
```

要让 `memo` 起作用，传下去的东西必须引用稳定，这才是 `useMemo` / `useCallback` 的用途。

### 4. 自定义比较函数

```tsx
memo(Comp, (prevProps, nextProps) => /* true = 没变，跳过渲染 */);
```

- 返回 `true` 表示**不要更新**（与 `shouldComponentUpdate` 语义相反）。
- 它是**白名单**：只比你写进去的 props。漏写一个，那个 prop 变了也不会更新，**而且不报错**。

### 5. 三种故障

```
┌────────────────────────────────────────────────────────┐
│ A. 比较太窄：该更新时不更新（功能错）     → 问题 ①②     │
│    比较函数漏掉了会影响输出的 props                      │
├────────────────────────────────────────────────────────┤
│ B. 引用不稳：不该更新时却更新（性能差）   → 问题 ③       │
│    传下去的对象/函数每次都是新引用，memo 被击穿           │
├────────────────────────────────────────────────────────┤
│ C. Hooks 位置错：直接崩溃                 → 问题 ④       │
│    hook 放在条件返回之后，调用数量不稳定                  │
└────────────────────────────────────────────────────────┘
```

---

## 二、问题 ①：yuheng 的 `FormRender` memo 比较函数

### 1. 业务背景（时间久远，这里写细一点）

**项目定位：** `apps/qq-search` 是 **QQ 搜索的运营后台**，不是用户看到的搜索页。运营在这里建「任务」，任务生效后才改变用户在 QQ 里搜索看到的结果。

**这个页面：** 「模板卡片配置」，路径 `pages/template/manage`。运营给一批搜索关键词配置一张结果卡片。比如用户搜「奥运」，结果顶部出现一张「热议话题」卡，卡片的标题、图标、点击跳转、展示哪些帖子，都由运营配置。

支持两类业务，协议完全隔离（`manage/README.md` 有说明）：

| 页面类型 | 枚举 | 说明 |
|---|---|---|
| 联想直达页 | `Page.PAGE_DIRECT` | 输入联想时出的卡片，只用「游戏和机器人主题」一个模板 |
| 网络搜索结果页 | `Page.PAGE_RESULT` | 结果页卡片，可一次选**多个**模板组合成一张「异型卡片」 |

**模板：** `TEMPLATE_OPTIONS` 注册了 9 种（通用头部、头部主题、横向列表、纵向列表、banner、帖子广场、游戏和机器人主题、纵向列表 2.0、热议话题）。**只有热议话题带 `isDynamic: true`**，即表单字段会随选项变化，其余 8 种是静态表单。

> 这解释了为什么问题只出在热议话题上：它是唯一的动态表单。

### 2. 组件结构

```
pages/template/manage/index.tsx          ← ① 页面层：协议 ⇄ 表单数据的转换
  └─ components/task-manage              ← ② 通用任务壳：表格 + 抽屉 + 两步流程
       └─ 抽屉第二步 children → pages/template/components/template-config
            ├─ FormRender × N            ← ③ 左侧：每个模板一张表单
            └─ TemplateRender × N        ← ④ 右侧：手机预览（所见即所得）
```

- **① `manage/index.tsx`**：`addOrEditTaskParams`（提交时把表单数据转后端协议）、`transformEditTaskData`（编辑时把后端协议转回表单数据）。
- **② `task-manage`**：所有任务类页面共用的壳。抽屉第一步填基础信息（关键词、生效时间、选哪些模板），点「下一步」后抽屉内容换成 `children`，也就是 `TemplateConfig`。抽屉设了 `destroyOnClose={true}`，**关闭即销毁**，所以每次打开任务，`TemplateConfig` 都是全新挂载。
- **③ `FormRender`**：纯「按配置渲染表单」的组件，输入 schema，输出 TDesign `<Form>`。
- **④ `TemplateRender`**：把表单内容渲染成手机里的卡片样子。

### 3. 核心概念：schema 驱动表单

每个模板有 `schema.ts`，包含两样东西：

```ts
{
  editData: [                       // 字段清单：渲染哪些输入框
    { type: 'Input',  name: '标题',     key: 'title',     required: true, maxlength: 21 },
    { type: 'Select', name: '内容来源', key: 'indexType', options: [...] },
  ],
  defaultData: {                    // 初始值：每个字段里填了什么
    title: '热议话题',
    indexType: 0,
  }
}
```

`FormRender` 按 `editData[i].type` 分发渲染（`fnMap` 里有 Input / Select / Jump / Icon / Text / List / Label / Button / PostSquare 9 种），用 `defaultData` 作为表单初始值：

```tsx
<Form form={form} initialData={defaultData} onValuesChange={onValuesChange}>
  {editData.map(item => fnMap[item.type](item, ...))}
</Form>
```

> **命名陷阱：** `FormRender` 的 prop `editData` 是「**字段清单**」；父组件 `TemplateConfig` 里的 state `editData` 是「整张卡片所有模板的最终数据」。两者同名但不是一回事。

### 4. 热议话题：一个会「变形」的表单

2024-10-21 `2ac43594`（你）把 schema 从固定对象改成函数：

```ts
hotTopicSchema(dumpMethod, indexType, topicName)  // 返回 { editData, defaultData }
```

参数来自用户在表单里选的两个下拉框：

- `dumpMethod`：**标题怎么跳**。1 = 跳固定链接，2 = 跳网络搜索话题承接页。
- `indexType`：**内容从哪来**。1 = 运营配置，2 = 热门 tab，3 = 最新 tab，4 = 网络承接页。

选不同的值，字段清单不同：

| 选择 | 多出的输入框 |
|---|---|
| `dumpMethod = 1`（固定链接） | android 链接、ios 链接 |
| `dumpMethod = 2`（话题承接页） | 话题名称 |
| `indexType = 1`（运营配置） | 3 个帖子 id |
| `indexType = 2 / 3`（热门 / 最新） | 话题 id |
| `indexType = 4`（网络承接页） | 话题名称（来源） |

改成动态的原因（取自 `面试案例.md` 案例 8）：原来所有字段摆在一张表单上，没选中的字段也会空着被提交，运营也不知道哪些是当前选项真正要填的。

**所以动态的核心是：字段清单（`editData`）随下拉选择变化，不只是值变化。**

### 5. 数据怎么流动

```
用户在 FormRender 里改「内容来源」下拉框
 → TDesign Form 触发 onValuesChange
  → FormRender 调 onChange(newValues)
   → 父组件 TemplateConfig.handleOnChange(value, index)
      ① setSourceType / setDumpMethod / setTopicName   ← 更新「当前选项」状态
      ② setEditData(newEditData)                        ← 更新整张卡片数据（驱动右侧预览）
      ③ onChange?.(newEditData)
   → 父组件重新渲染
      handleFormRender() 里重新调 hotTopicSchema(dumpMethod, sourceType, topicName)
      得到新的 { editData: 字段清单, defaultData }，作为 props 传给 FormRender
   → FormRender 应当重新渲染，显示新输入框       ← 这一步被 memo 比较函数拦住
```

### 6. 提交演变（按时间）

| 时间 | 提交 | 作者 | 改动 |
|---|---|---|---|
| 2023-08-17 | `0db617bb` | hoichen | 初始：`export default React.memo(FormRenderComponent)`，默认浅比较所有 props |
| 2024-07-29 | `bc9f2e3e` | jackqqxu | **止死循环**：memo 加比较函数 `prev.defaultData === next.defaultData`；父组件 `handleOnChange` 加 `isEqual` 守卫；`FormRender` 加 `if (!editData) return null` |
| 2024-10-21 | `2ac43594` | 你 | 热议话题 schema 改成函数（动态配置） |
| 2024-10-22 | `374bb553` | 你 | 比较函数 `===` 改 `isEqual(defaultData)`（深比较），同提交有调试日志 `console.log(123132123123, ...)`；此时父组件传参仍是 `defaultData={data \|\| defaultData}` |
| 2024-10-23 | `bb2f3fd9` | 你 | 父组件传参改成 `defaultData={{ ...defaultData, ...data }}`（**每次渲染新对象**） |
| 2024-10-30 | `35044e42` | 你 | **修动态表单不更新**：新增 `templateDefault` prop，比较函数优先用它 |
| 2024-11-20 | `9cadf9ec` | 你 | 传参改成 `each?.data === null \|\| isDynamic ? { ...defaultData, ...data } : { ...data }`，删调试日志 |

> **更正（相对我之前口头讲的版本）：**
> 1. `bc9f2e3e` 当时父组件传的是 `defaultData={data || defaultData}`（引用稳定），不是每次新对象。`{...defaultData, ...data}` 是 `bb2f3fd9`（10-23）才引入的。
> 2. `374bb553`（10-22）**早于** `bb2f3fd9`（10-23），已用 `merge-base --is-ancestor` 核对。所以 `374bb553` 改成 `isEqual` 时，传参还是引用相对稳定的 `data || defaultData`，**不是**在配合 `{...defaultData, ...data}`。它改深比较的动机，我只能从 diff 看出是「`===` 改 `isEqual`」，**具体原因没有证据，不要在面试里编**。
> 3. 自 `bb2f3fd9` 起传下去的是每次新建的对象，此后如果比较函数还是 `===` 就会永远不相等；而此时已经是 `isEqual`，所以才没有退化成「每次都重渲染」，这是**事后推演**，不是当时的动机。

### 7. 原因：为什么编辑态才出问题

`defaultData` 的组成是：

```tsx
defaultData={{ ...defaultData, ...data }}
//            ↑ schema 的默认值    ↑ 任务里已保存的数据（后者覆盖前者）
```

**新建任务：** `data` 是 `null`，`defaultData` 完全来自 schema。切换下拉框 → schema 重算 → `defaultData` 里出现新的键（比如 `feedIds: ['','','']`）→ `isEqual` 判定不同 → 放行重渲染，表现正常。

**编辑任务：** `data` 是后端回填的完整数据，已经包含所有字段，会把 schema 默认值盖住。

```
用户切换「内容来源」
→ schema 变了（字段清单变了，需要多出输入框）
→ 但 { ...schemaDefault, ...data } 的内容没变（data 把它盖住了）
→ isEqual(prev.defaultData, next.defaultData) === true
→ memo 判定「没变，跳过渲染」
→ FormRender 不重渲染，新输入框出不来
```

| 现象 | 原因 |
|---|---|
| 只有热议话题出问题 | 只有它的字段清单会变 |
| 只有编辑态出问题 | 编辑态的 `data` 覆盖了 schema 默认值，掩盖了变化 |
| 新建态正常 | schema 默认值直接决定 `defaultData`，选项变则内容变 |

**本质：比较函数只比了「值」（`defaultData`），没比「字段清单」（`editData`），而动态表单变的恰恰是字段清单。**

### 8. 解决方案（`35044e42`）

```tsx
// 父组件：多传一个「纯 schema 默认值」（不含已保存的 data）
<FormRender
  editData={editData}
  defaultData={{ ...defaultData, ...data }}
  templateDefault={defaultData}      // 新增
  onChange={...}
/>

// 比较函数：优先比 templateDefault
React.memo(FormRenderComponent, (prev, next) =>
  prev.templateDefault
    ? isEqual(prev.templateDefault, next.templateDefault)
    : isEqual(prev.defaultData, next.defaultData)
);
```

`templateDefault` 来自 `hotTopicSchema(...)` 的返回值，不含用户已保存的 `data`，不会被覆盖。选项一变，schema 多出 `feedIds` / `topicId` 之类的键，它就变，`memo` 放行。

同提交的配套修改：

```tsx
// 只在有值时才更新状态，避免被 undefined 覆盖
value.data?.dumpMethod && setDumpMethod(value.data?.dumpMethod);
value.data?.indexType && setSourceType(value.data?.indexType);
value.data?.topicName && setTopicName(value.data?.topicName);
```

### 9. 方案的局限（复盘）

1. **间接信号：** `templateDefault` 只是碰巧会变，不是 `editData` 本身。如果某个选项只改字段清单、不改 schema 默认值，仍会漏。
2. **只对热议话题有效：** 其他模板没有 `templateDefault`，走 `isEqual(defaultData)` 分支。
3. **两套比较逻辑并存：** 后来人难懂为什么分叉，只能靠那段注释。

更直接的做法：

```tsx
// 方案 A：比较函数里补上字段清单
isEqual(prev.editData, next.editData) && isEqual(prev.defaultData, next.defaultData)

// 方案 B：不用比较函数，用 key 强制重建（字段清单变 = 换了一张表单）
<FormRender key={`${dumpMethod}-${sourceType}`} ... />
```

方案 B 更简单，但会丢失表单里用户已输入但未同步的值，需要权衡。

### 10. 死循环的机制（推断，未运行验证）

`bc9f2e3e` 之前的环：

```
onValuesChange → onChange → 父组件 setEditData → 重渲染 → FormRender 重渲染
→ （表单值被重新处理，再次触发 onValuesChange）→ onChange → ……
```

真正切断环的是父组件的 `isEqual` 守卫（内容没变就不再 `setState`）。`memo` 比较函数只是辅助，减少 `FormRender` 无谓重渲染。这也是后来问题的伏笔：用「抑制渲染」去压一个「状态更新环」，副作用很大。

### 11. 总结与知识点

- **一句话：** 给 `FormRender` 加的 `React.memo` 自定义比较函数只比了 `defaultData`，没比字段清单（`editData`）和 `onChange`。动态表单在编辑态下，值被已保存数据盖住，比较判定没变，导致新字段不出现。
- **教训：** 自定义比较函数是白名单，漏一个影响输出的 prop 就是 bug，且不报错。
- **更深一层：** 死循环的真正切断点应放在更新源头（`isEqual` 守卫），而不是靠 `memo` 在下游兜底。

| 知识点 | 要点 |
|---|---|
| 自定义比较函数 | 返回 `true` = 不更新；只比写进去的 props |
| 引用相等与深比较 | `Object.is` 对新建对象永远 `false`；`isEqual` 是深比较，有开销 |
| 受控与非受控表单 | TDesign `Form` 的 `initialData` 只在初始化生效，之后不随 props 同步 |
| schema 驱动表单 | 字段清单与字段值分离；动态表单本质是「schema 是状态的函数」 |
| `key` | 改变 `key` 会销毁重建组件，是重置内部状态最直接的手段 |
| `destroyOnClose` | 抽屉关闭即销毁，所以每次打开任务都是新挂载 |

---

## 三、问题 ②：`window.renderData` 全局变量

### 背景与现象

异型卡片（网络搜索结果页）一次选多个组件，编辑其中一个时，**另一个已经填写的内容会丢失**（`5db7d836a`，2024-11-21，你）。之后新建任务时，预览会闪一下或带上上一个任务的内容（`fc3f656f`，2025-04-15，你）。

### 当时的方案

```tsx
// 引入全局变量记录实时数据
if (!window.renderData) {
  window.renderData = handleDefaultLayout(content);
}
const handleOnChange = (value, index) => {
  let newEditData = cloneDeep(window.renderData);   // 原来是 cloneDeep(editData)
  ...
  if (!isEqual(newEditData, editData)) {
    window.renderData = [...newEditData];
    setEditData(newEditData);
    ...
  }
};
```

约定：每次进入编辑要手动 `window.renderData = null`。提交里的注释写的是：「`setEditData` 会触发组件重新渲染，`editData` 被重置，导致数据丢失」。

后遗症：新建任务的入口漏了置空，残留上一个任务的数据，预览跳变。`fc3f656f` 补了一行 `window.renderData = null`（只有一行改动，其余 814 行是 `pnpm-lock.yaml`）。

### 原因（推断：与问题 ① 同源）

`FormRender` 的比较函数里**没有 `onChange`**，而父组件传的是：

```tsx
onChange={(value) => handleOnChange({ templateId, data: value }, index)}
```

这是**每次渲染新建的箭头函数**，闭包里捕获了当次渲染的 `editData`、`dumpMethod` 等 state。`memo` 拦住重渲染后，`FormRender` 手里持有的永远是「上一次放行时」的旧 `onChange`，里面的 `editData` 是旧快照：

```
选了 A、B 两个组件
 编辑 A → 父组件 editData 更新为 [A', B]
 但 B 的 FormRender 被 memo 拦住，手里 onChange 闭包里还是旧的 editData = [A, B]
 编辑 B → handleOnChange 里 cloneDeep(editData) 读到旧的 [A, B]
 → splice 得到 [A, B'] → A 的修改被覆盖丢失
```

| | 比较函数漏了什么 | 症状 |
|---|---|---|
| 问题 ① | `editData`（字段清单） | 新字段出不来 |
| 问题 ② | `onChange`（闭包旧值） | 编辑别的组件时，之前的修改丢失 |

> 这是读代码推出的结论，**没有运行复现**。面试时说「我分析认为」，不要当既定事实。

### 更好的方案（按推荐程度）

| 方案 | 做法 | 优点 | 局限 |
|---|---|---|---|
| **B（改动最小）** | `useRef` 保存最新值，替代 `window.renderData` | 作用域收回到组件内，随组件销毁，不用手动置空 | 仍是命令式绕行 |
| **D** | 给 `<TemplateConfig key={taskId ?? 'new'} />` 加 `key` | 任务一换整组件重建，从根上消除「漏清理」 | 只解决残留，不解决闭包 |
| **A（长期）** | 函数式 `setState(prev => ...)`，`prev` 永远是最新值 | 彻底消除过期闭包 | 副作用要和纯计算拆开，不能放进 `setState` 回调 |
| **C（最彻底）** | 状态上移，`editData` 作为唯一数据源，表单全受控 | 不再有两份数据竞争 | 要重构 `FormRender`，改动面大 |

```tsx
// 方案 B 示意
const editDataRef = useRef(editData);
editDataRef.current = editData;
const handleOnChange = (value, index) => {
  const next = handleDefaultLayout(
    editDataRef.current.map((item, i) => (i === index ? value : item))
  );
  editDataRef.current = next;      // 立即更新，下一次 onChange 能读到
  setEditData(next);
  onChange?.(next);
};

// 方案 A 示意（拆开副作用）
setEditData(prev => {
  const next = handleDefaultLayout(prev.map((item, i) => (i === index ? value : item)));
  return isEqual(next, prev) ? prev : next;   // 没变就返回原引用
});
```

**建议：** 立刻可做用 B + D（不到十行，消除「漏清理」这一类 bug）；长期正确用 A 或 C，需先补回归测试。

### 总结与知识点

用全局可变状态绕开闭包问题，代价是生命周期脱离组件，要靠人记得清理。知识点：过期闭包、函数式 `setState`、`useRef` 保存最新值、`key` 重置组件状态。

---

## 四、问题 ③：web 的引用不稳导致级联重渲染

> **作者：albertmo，不是你。** 提交 `0aea7d0`（2026-04-16）。要当作自己的经历讲，需先和同事核实参与程度。

### 背景与现象

Chat 页点击文件树里的文件，页面明显卡顿。React Scan 数据：FPS 降到 80，主线程阻塞约 308ms（React 渲染 124ms + hook/effect 开销 184ms），`AssistantMessageInner` 重渲染 20 次、`CheckpointCard` 10 次、`ChatInput` 2 次、`TooltipProvider` 124 次。

### 原因（因果链，已核对代码）

先看事实：`AssistantMessage` **早就套了 `memo`**，比较函数里有一项：

```tsx
prev.onRestoreClick === next.onRestoreClick
```

而 `onRestoreClick` 的来源链：

```
useAgent 里的 reloadMessages
 → 被 useCheckpoint 引用
  → handleConfirmRestore
   → ChatPanel 里 onRestoreClick={handleConfirmRestore}
    → 传给每个 AssistantMessage
```

修复前 `reloadMessages` 是普通 `const reloadMessages = async () => {...}`，**每次 `useAgent` 所在组件渲染都是新函数**：

```
点文件树 → files 变化 → useAgent 所在组件重渲染
→ reloadMessages 新引用 → onRestoreClick 新引用
→ AssistantMessage 的 memo 比较 onRestoreClick 不相等
→ memo 失效，20 个 AssistantMessage 全部重渲染
```

另有三条旁路：

- `UnsavedChangesContext` 的 `value` 是每次渲染新建的对象字面量，所有 Context 消费者（含 `ChatInput`）都重渲染，**`memo` 拦不住 Context 更新**。
- `useFileChangeConfirm` 的 `handleConfirm` / `handleCancel` 依赖了 `files` 等高频变化值，回调引用跟着变。
- `useFileSync` 内部订阅了 `[isLoadingFile, files]`，6 个调用方被迫订阅了不需要的数据。

### 解决方案

| 修复 | 切断的链路 |
|---|---|
| `reloadMessages` 用 `useCallback(..., [refreshSession, setChatMessages])` | 文件变化 → onRestoreClick 新引用 → 20 个消息重渲染 |
| Context `value` 用 `useMemo`，依赖数组覆盖所有字段 | 回调新引用 → Context 新对象 → `ChatInput` 重渲染 |
| 回调内部改用 `store.getState()` / `ref` 按需读取，依赖缩减为 `[useSandbox, clearDeletedPaths]` / `[]` | 回调引用因 `files` 变化而变 |
| `useFileSync` 去掉订阅；`useAgent` 用布尔选择器 `hasAnyFiles` / `isLoadingFile` | 从源头消除 `useAgent` 因文件内容变化而重渲染 |
| `CheckpointCard`、`VersionDiffDialog` 加 `React.memo` | 纵深防御 |

```tsx
// Context value：修复前每次渲染都是新对象
const value = { checkUnsavedChanges, hasChanges, ... };
// 修复后
const value = useMemo(() => ({ checkUnsavedChanges, hasChanges, ... }),
  [checkUnsavedChanges, hasChanges, ...]);
```

### 总结与知识点

- **这不是「缺 `memo`」，而是 `memo` 已在，但传给它的 props 引用不稳。**
- 治本是切断源头（让 `useAgent` 不再因 `files` 变化而重渲染），治标是稳定引用并加 `memo` 做防线。
- 预期阻塞时间从约 308ms 降到 50ms 以下，是提交文档里的预期值，**没看到修复后的实测数据**。
- 稳定引用的隐含代价：依赖数组漏写会读到旧值。作者选择用 `getState()` 按需读取来避开。

| 知识点 | 要点 |
|---|---|
| 引用相等 | `Object.is`；每次渲染新建的对象 / 函数会击穿 `memo` |
| Context 重渲染 | `value` 引用变，所有消费者重渲染，`memo` 拦不住 |
| 订阅粒度 | 订阅整个 `files` 任何变化都重渲染；用布尔选择器或 `getState()` 按需读 |
| 定位手段 | React Scan、Profiler |

---

## 五、问题 ④：`useMemo` 放在 early return 之后

> **作者：albertmo，不是你。** 提交 `2782cf9`（2026-04-13），属于对上一个 UI 改版提交做 Code Review 后的遗留问题修复之一（共 8 项，这是 P0）。

### 原因

```tsx
function AssistantMessageInner({ message, isLoading, isLastMessage }) {
  if (!message.parts.length && (!isLoading || !isLastMessage)) {
    return null;                              // ← 条件返回在前
  }
  const fileToolGroups = useMemo(...);        // ← hook 在后
}
```

React 靠 **hook 的调用顺序**把状态与每个 hook 对应。`message.parts` 从有变空（或反过来）时，某次渲染提前 `return null`，少执行若干 hook，调用数量对不上，React 报「Rendered fewer hooks than expected」类错误。属于特定时刻才触发、平时不易发现的隐患。

### 解决方案

把所有 `useMemo` 挪到 early return 之前，`if (...) return null` 放最后。同提交新增的两个 `useMemo`（`explorationGroups`、`explorationGroupByStartIndex`）也遵循这个顺序：

```tsx
const explorationGroups = useMemo(() => groupConsecutiveExplorationTools(message.parts), [message.parts]);
const explorationGroupByStartIndex = useMemo(() => new Map(...), [explorationGroups]);

if (!message.parts.length && (!isLoading || !isLastMessage)) {
  return null;      // 所有 hook 都调用完，再提前返回
}
```

### 总结与知识点

- 与 `memo` / `useMemo` 的缓存语义**无关**，是 Rules of Hooks 问题；`useMemo` 只是碰巧被放错位置的那个 hook。
- `eslint-plugin-react-hooks` 的 `rules-of-hooks` 规则能静态检出，值得确认项目是否开启。
- 卡 13 里的说法可直接引用：**hook 的「调用」不能被条件包住，hook 的「内部逻辑」可以有条件。**

---

## 六、整体对照

| 问题 | 故障类型 | 症状 | 一句话根因 | 最短修法 |
|---|---|---|---|---|
| ① | 比较太窄 | 表单字段不出现 | 比较函数没覆盖 `editData` | 比较里补 `editData`，或加 `key` |
| ② | 过期闭包（①的副产品，推断） | 编辑内容丢、预览串数据 | memo 拦住后读到旧闭包，用全局变量绕过 | `useRef` + `key`，长期用函数式 `setState` |
| ③ | 引用不稳 | 点文件树卡顿 | 函数、对象引用每次变，`memo` 被击穿 | `useCallback` / `useMemo` + 缩小订阅 |
| ④ | Hooks 位置错 | 特定时刻崩溃 | hook 在 early return 之后 | hook 一律写最前面 |

**一条贯穿的结论：`memo` / `useMemo` 只是「跳过工作」的优化，不能当正确性保证。** 比较维度漏了就功能错，引用不稳就白套，位置放错就崩溃。`面试问题提纲` 里的判据同样适用：**只在测量到重渲染成本时才用**。yuheng 这个案例是反面教材：为压死循环加了 `memo`，反而埋下「不更新」的隐患。

---

## 七、面试口述

### 60 秒版（主讲问题 ①）

> 这是 QQ 搜索的运营后台，模板卡片配置页，表单是按 schema 渲染的。热议话题这个模板我做成了动态表单：标题怎么跳、内容从哪来这两个下拉框，决定表单出现哪些字段。
>
> 上线后发现编辑已有任务时，切换下拉框新字段出不来。原因是左侧表单组件之前为了压一个渲染死循环，加了 `React.memo` 的自定义比较函数，只比较 `defaultData`。编辑态下 `defaultData` 被已保存数据盖住，内容没变，比较判断「不用更新」，但变的其实是字段清单。
>
> 我当时的做法是新增一个 `templateDefault`，传 schema 自身的默认值，比较函数优先比它。事后复盘我觉得更稳的做法是把字段清单也纳入比较，或者用 `key` 在选项变化时重建组件。

### 可能的追问

| 追问 | 答法要点 |
|---|---|
| 为什么不直接去掉 memo？ | 当时它和父组件 `isEqual` 守卫一起压住了渲染死循环，去掉要先确认环的切断点已经在守卫上；现在会优先保留守卫、去掉自定义比较 |
| 为什么用 `templateDefault` 而不是直接比 `editData`？ | 坦白：是当时的权宜之计，它是间接信号；复盘后认为比 `editData` 或加 `key` 更稳 |
| 浅比较和深比较怎么选？ | 浅比较快但依赖引用稳定；深比较慢且大对象有开销；动态表单场景用 `key` 重建比比较函数更不容易漏 |
| 你怎么发现的？ | 编辑态才复现；定位到 `defaultData` 被 `data` 覆盖；对照新建态正常 |

### 边界（守住这几句）

- `bc9f2e3e` 的 `memo` 比较函数是 jackqqxu 加的，**不是你**；你的贡献是 `374bb553`（改深比较）、`35044e42`（补 `templateDefault`）、`5db7d836a` / `fc3f656f`（全局变量方案与补丁）。
- 问题 ③④ 的作者是 albertmo，要当作自己的经历需先核实。
- 死循环的精确机制、问题 ① 与 ② 同源，是读代码推断，**没有运行复现**，不要当既定事实。
- 没有性能或错误率的量化数据，不报数字。

---

## 附：检索与取证方式

- 远程仓库用 `git clone --bare --filter=blob:none` 拉历史（不检出文件）。
- 在提交信息与 diff 里搜 `useMemo` / `memo`，yuheng 全仓库 `-S` / `-G` 只匹配到 2026 年他人代码，**没有你的 `useMemo` 修复**。
- 本地 `g2/qpilot/web` 的 `docs/fix-chat-ui-review-issues.md`、`docs/chat-page-rerender-cascade-optimization.md` 是问题 ④③ 的作者文档，可对照阅读。
- 提交 `9cadf9ec`（2024-11-20）的 diff 已读：删调试日志，传参改为 `each?.data === null || isDynamic ? {...defaultData, ...data} : {...data}`（让非动态模板的编辑态不被 schema 默认值覆盖）。
