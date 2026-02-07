# 左侧导航：页面可见切换说明

左侧导航栏中的菜单项可以通过配置**开关**控制显示或隐藏，便于在开发/调试阶段只保留需要的页面入口。

## 配置位置

**文件：** `src/layouts/AppLayout.vue`

在 `<script setup>` 中有一个集中配置对象 `navVisible`：

```ts
// 导航显示开关：调试时把某页设为 false 即可在侧栏隐藏
const navVisible: Record<string, boolean> = {
  overview: false,
  sources: false,
  knowledge: false,
  editor: false,
  publish: false,
  writingAssistant: true,
  newsAggregation: true,
};
```

## 如何切换

- **隐藏某页：** 将对应 key 设为 `false`，该页将不会出现在左侧导航中。
- **显示某页：** 将对应 key 设为 `true`，该页会出现在左侧导航中。

key 与下方 `menuItems` 中每条菜单的 `key` 一一对应，当前可选 key 如下：

| key | 对应菜单名 |
|-----|------------|
| `overview` | 概览 |
| `sources` | 信源管理 |
| `knowledge` | RAG 知识库 |
| `editor` | 创作工作台 |
| `publish` | 内容分发 |
| `writingAssistant` | 热点追踪 |
| `newsAggregation` | 监测日报 |

## 说明

- **仅影响侧栏显示**：设为 `false` 后，该页不会在左侧导航中显示，但路由仍然存在，直接访问对应 URL（如 `/sources`）仍可打开该页面。
- **新增菜单项时**：若在 `menuItems` 中新增了一项，需在 `navVisible` 中增加同名的 key，并设为 `true` 或 `false`，否则默认会显示（因为过滤逻辑是 `navVisible[item.key] !== false`）。

## 示例

只显示「热点追踪」和「监测日报」时，配置如下：

```ts
const navVisible: Record<string, boolean> = {
  overview: false,
  sources: false,
  knowledge: false,
  editor: false,
  publish: false,
  writingAssistant: true,
  newsAggregation: true,
};
```

全部显示时，将需要展示的项设为 `true` 即可。
