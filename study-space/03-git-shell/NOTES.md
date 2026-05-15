# 簇 3 学习笔记 — git plumbing + shell 严格模式

> 对应学习指引：簇 3（q-06）
> 完成日期：2026-05-15
> 练习环境：WSL Ubuntu（~/study-space/03-git-shell）

---

## 一、shell 严格模式 `set -euo pipefail`

### 四件套速记

| flag | 防什么 | 不写的后果 |
|---|---|---|
| `-e` | 命令失败继续跑 | 脚本"假成功"，CI 拿错版本代码部署 |
| `-u` | 引用未定义变量 | `$TYPO` 变空串，`rm -rf /$TYPO` = `rm -rf /` |
| `-o pipefail` | 管道中间段失败被掩盖 | `false \| echo hi` 退出码 0，`-e` 不触发 |
| `IFS=$'\n\t'` | 带空格文件名被拆 | `for f in $(ls)` 把 `my file.txt` 拆成 `my` 和 `file.txt` |

### 面试标准答案

> **Q：你写 shell 脚本会做什么防御措施？**
> 开头 `set -euo pipefail`。`-e` 命令失败立即退出；`-u` 未定义变量报错（防 rm 灾难）；`-o pipefail` 管道任一段失败都算失败。

### 关键陷阱：`-e` 对管道默认不生效

```bash
set -e
false | echo "hi"   # echo 返回 0 → 整条管道算成功 → -e 不触发
# 必须加 pipefail 才能让 false 的失败传播出来
```

---

## 二、git 对象模型（3 层）

```
commit  →  tree  →  blob
  │          │        │
  谁/何时    目录快照   文件内容
```

- `git cat-file -p HEAD` → 看 commit（含 tree 哈希、author、message）
- `git cat-file -p HEAD^{tree}` → 看 tree（文件名 + blob 哈希列表）
- `git cat-file -p <blob-hash>` → 看文件内容

### git commit 底层四步（面试高频）

1. **`hash-object`** — 文件内容 → blob 对象（存入 .git/objects/）
2. **`write-tree`** — 暂存区快照 → tree 对象
3. **`commit-tree`** — tree + 父 commit + message → commit 对象
4. **`update-ref`** — 移动分支指针到新 commit

> git 本质是 content-addressable 的对象数据库，文件内容的 SHA-1 哈希就是"地址"。

---

## 三、git stash 要点

- **默认不收 untracked 文件** → 要 `-u`（`--include-untracked`）
- `stash pop` 有冲突时**不会自动删 stash 条目** → 手动 `stash drop`
- stash 不是"安全箱"：是临时栈，多人协作 + 多 stash 容易搞混

---

## 四、自检清单

- [x] 能说清 `set -e` 在管道里默认不生效，要靠 `pipefail` 传播错误
- [x] 能解释 `git stash` 默认不保存 untracked 文件，要 `-u`
- [x] 知道 `git commit` 实际调用了 hash-object / write-tree / commit-tree / update-ref
- [x] 能口述 git 三层对象模型：commit → tree → blob

---

## 五、下一站

**簇 4（q-10）：React Hooks 单一职责 + Zustand** — 前端面试重头戏。
