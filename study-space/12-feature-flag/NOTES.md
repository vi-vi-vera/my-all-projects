# 12 Feature Flag + 权限双闸门 学习笔记

## 一句话心得

> Feature Flag 是功能的电闸，不发版就能控制开关；前端按 flag 隐藏入口（体验层），后端按 flag 拒绝请求（安全层）——两层缺一不可，前端只决定"看不看得到"，后端才决定"能不能用"。

---

## Feature Flag 是什么

本质是一个**开关配置**，让你不用发版就能控制功能的开关。相比发版：
- 发版：几十分钟，出错回滚也慢
- Flag：秒级开关，紧急情况 1 秒关掉

## 三种放量方式

| 方式 | 适用场景 |
|------|---------|
| `enabled: false` | 全量关闭（紧急回滚） |
| `whitelist: [...]` | 内测用户、VIP 先用 |
| `rollout: 10` | 灰度放量（1% → 10% → 50% → 100%） |

**优先级：whitelist > rollout > enabled**

---

## 灰度哈希算法

```js
function isFlagEnabled(flagName, userId) {
  const flag = FLAGS[flagName];
  if (!flag || !flag.enabled) return false;
  if (flag.whitelist.includes(userId)) return true;   // 白名单优先

  // 用 userId 做哈希，同一用户每次结果一致
  const hash = userId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (hash % 100) < flag.rollout;
}
```

**为什么用哈希不用 `Math.random()`？**
- 随机：用户刷新页面后可能看不到功能了，体验不稳定
- 哈希：同一用户每次结果一致，稳定可靠

---

## 双闸门模式（最重要）

```
用户 → 前端检查 flag → 隐藏/显示入口  ← 体验层（不是安全层！）
           ↓
       后端 API
           ↓
     requireFlag 中间件 → 真正的鉴权  ← 安全层
           ↓
       业务逻辑
```

**为什么前端检查不够？** 前端代码用户可以改。任何人都能直接 curl 绕过前端。**后端必须再检查一次。**

---

## Blast Radius 思维

> "这个 flag 如果出问题，最多影响多少用户？"

- 灰度 1%：出问题影响 1% 用户，风险可控
- 灰度 100%（全量）：出问题影响所有人
- 白名单先行：blast radius = 白名单用户数

**原则：新功能先小 blast radius 验证，再逐步放大。**

---

## Feature Flag 和 Authorization 的边界

| 场景 | 用 Flag | 用 Auth |
|------|---------|---------|
| 新功能灰度 | ✅ | |
| A/B 测试 | ✅ | |
| 付费功能限制 | | ✅ |
| 管理员才能操作 | | ✅ |
| 合规/安全要求 | | ✅ |

灰度是"这个用户被抽中了"，权限是"这个用户有资格"。

---

## 你项目中的实际使用

### qpilot-web-v2 — 自建白名单
```ts
const WHITELIST = ['dorabwzhang', 'jackqqxu', ...];
export function isInWebSearchWhitelist(staffName: string): boolean { ... }
// 另外还从无极平台（WujiService）动态拉取远程白名单
```

### yuheng-monorepo — 盘古 RBAC 权限平台
```ts
router.beforeEach(async (to) => {
  if (!permissionStore.panguData?.userAuthList?.includes(to.meta.panguAuthId)) {
    next('/result/403');
  }
});
// 角色+权限ID 模型，路由级守卫
```

### guild_web — 七彩石(Rainbow)配置中心 + 版本灰度
```ts
// Rainbow SDK 实时拉取配置，支持按 openid/uin 灰度标签
// 客户端版本比较：
export const isNewFeedSquare = (move_post_section: number) => { ... };
// 905版本以上 + 灰度频道 = 新功能
```

---

## 面试高频问题

**Q: 为什么不直接发版控制功能？**
> 发版慢（几十分钟），flag 秒级开关；出问题回滚发版更慢，flag 直接关掉 1 秒生效。

**Q: 灰度的哈希为什么要用 userId 而不是随机？**
> 保证同一个用户每次访问结果一致，不会"刷新一下功能就没了"。

**Q: flag 配置放哪里？**
> 小项目放数据库/配置文件；大公司用专门服务（LaunchDarkly、GrowthBook、七彩石），支持实时下发，不需要重启。

**Q: 前端隐藏了入口就安全了吗？**
> 不安全。前端代码可被篡改，curl 可绕过。后端必须再校验一次。

**Q: Flag 和 Auth 怎么区分？**
> Flag 是"这个功能对这位用户开放了没"，Auth 是"这位用户有没有权限做这个操作"。灰度放量用 Flag，付费/管理员用 Auth。

---

## 文件说明

- `server.js` — Express 服务，演示 flag 配置 + 灰度哈希 + 双闸门
