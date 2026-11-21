# 卡 14 · React 性能与工程

> 定级：L2（有主场案例，理论待 S3/S4 补）｜ 2026-11-19
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

## 待补（S3 / S4 讲完补理论）

- S3：重渲染五原因、Profiler 怎么用、虚拟列表原理、Context 拆分、memo/useMemo 决策树
- S4：状态四层归属、受控 vs 非受控、错误边界位置、状态库选型（Context / Zustand / Redux）、可配置化组件设计
