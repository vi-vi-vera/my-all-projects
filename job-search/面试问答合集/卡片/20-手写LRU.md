# 卡 20 · 手写 LRU 缓存

> 定级：L4（Map 版 + 双向链表版都一次写出，测试全过）｜ 2026-11-22（D6）
> LeetCode 146。两种解法都要会：Map 版面试应急，链表版是“考代码功底”的正解。

## 3 句骨架

1. LRU 要两个能力：**O(1) 定位**（哈希表）+ **O(1) 移删**（双向链表）。
2. **“最近使用” = 移到链表头**；**“最久没用” = 留在链表尾**。get / put 都把它 `moveToHead`，尾部自然就是淘汰对象。
3. **虚拟头尾节点消灭所有边界判断**；map 和链表要**同步删**，漏一个就脏数据。

## 解法一：Map 有序性（应急，最快）

```js
class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);        // 重新插入 = 移到末尾 = 标记为最新
    return value;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);   // 最旧 = 第一个
    }
  }
}
```

**依赖**：JS Map 的**插入顺序**。换语言/禁用这个特性就失效 → 面试官会要链表版。

## 解法二：双向链表 + 哈希表（正解）

```js
class Node {
  constructor(key, value) { this.key = key; this.value = value; this.prev = null; this.next = null; }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();            // key -> Node
    this.head = new Node(0, 0);      // 虚拟头，最新在这边
    this.tail = new Node(0, 0);      // 虚拟尾，最旧在这边
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null; node.next = null;
  }
  _addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  _moveToHead(node) { this._remove(node); this._addToHead(node); }
  _removeTail() { const n = this.tail.prev; this._remove(n); return n; }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._moveToHead(node);
    return node.value;
  }
  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._moveToHead(node);
    } else {
      const node = new Node(key, value);
      this.map.set(key, node);
      this._addToHead(node);
      if (this.map.size > this.capacity) {
        const tail = this._removeTail();
        this.map.delete(tail.key);   // ← map 和链表同步删
      }
    }
  }
}
```

## 四个易错点

1. **`_addToHead` 顺序**：先让新节点指向旧的两个（`node.next/prev`），再让旧两个指回 node。反了会丢链。
2. **淘汰时同步删 map**：`_removeTail` 只摘了链表，不 `map.delete(tail.key)` 就脏。
3. **`put` 更新已存在的 key**：不是“重新插入”，是**改 value + moveToHead**。漏了 moveToHead，它就被误判为“旧”，下次被误淘汰。
4. **虚拟头尾的意义**：真实节点永远夹在 head/tail 之间，删头尾不用判空，代码短一半。

## 复杂度（必口述）

| 操作 | 复杂度 | 为什么 |
|---|---|---|
| get / put | **O(1)** | map 定位 O(1)，链表摘/插 O(1) |
| `_remove` | O(1) | 有 `prev` 指针，**不用从头找前驱**（这正是双向 vs 单链表的区别） |
| 空间 | **O(capacity)** | map + 链表节点数都 ≤ 容量 |

> 一句话：**“单链表删中间节点要 O(n) 找前驱，双向链表 O(1)——所以 LRU 必须双向。”**

## 复盘

Map 版和链表版都一次写出、测试全过。两个小瑕疵（不影响正确，但注意）：
- `get` 末尾多写了个 `return this`：两个分支都 return 了，那行是死代码，永远执行不到
- `put` 里外层 `const node = new Node(...)` 和 if 块里 `const node = this._removeTail()` **同名遮蔽**，读起来费劲，淘汰节点该换个名字（`tail`）
