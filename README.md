# AI 自动化写作平台（前端原型）

基于 **Vue 3 + Vite + Tailwind CSS** 的企业级蓝色主题写作平台前端原型，包含 **概览 Dashboard**、**创作工作台（多阶段工作流）**、**信源管理** 等页面与基础组件库雏形。

---

## 快速开始

### 环境要求

- Node.js 18+（建议 20+）
- npm 9+

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 构建与预览

```bash
npm run build
npm run preview
```

---

## 技术栈

- **Vue 3**（SFC + Composition API）
- **Vite**
- **Tailwind CSS**
- **Pinia**（状态管理）
- **Vue Router**（页面路由）
- **lucide-vue-next**（图标库）

---

## 设计规范与开发约定（重要）

本项目的 UI/组件实现严格遵循：

- `/.cursor/rules/designrules.mdc`
  - 企业级 **Blue-600（#1677FF）** 作为主色（hover：`blue-500`）
  - 仅使用 Slate 灰阶体系，不随意引入高饱和色
  - 容器最大宽度 **1600px**
  - **1920px 屏幕左右边距 160px**（建议使用 `min-[1920px]:px-40`）
  - 圆角不超过 12px（优先 `rounded-md / rounded-lg`）
- `/.cursor/rules/component-standard.mdc`
  - 组件必须使用 `<script setup>` 与 Composition API
  - 图标统一来自 `lucide-vue-next`
  - 多步骤工作流数据优先进入 Pinia Store

---

## 页面说明

### 概览（Dashboard）

- 路由：`/`
- 文件：`src/views/Dashboard.vue`
- 关键特性：
  - “行动中心”导向的 Hero 区与行动化指标卡
  - 点击建议可跳转创作（通过 `useEditorStore` 注入 prompt）

相关组件：
- `src/components/dashboard/DashboardHero.vue`
- `src/components/dashboard/ActionableStat.vue`
- `src/components/dashboard/CreationQueue.vue`

### 创作工作台（Editor）

- 路由：`/editor`
- 文件：`src/views/Editor.vue`
- 关键特性：
  - 顶部 Workflow Stepper（热点输入 → 大纲生成 → 正文创作 → 配图/审核）
  - 大纲/正文支持“流式输出”模拟（末尾蓝色呼吸光标）
  - 右侧包含“自动化配图”与“自动审核报告”模块（示例数据）

流式输出组件：
- `src/components/editor/StreamingOutput.vue`

### 信源管理（Sources）

- 路由：`/sources`
- 文件：`src/views/SourceManagement.vue`
- 关键特性：
  - 状态卡（活跃/今日采集/告警）
  - 搜索与筛选（平台/频率/状态）
  - 数据表（可插槽的通用表格组件）

表格组件：
- `src/components/ui/AppDataTable.vue`

---

## 目录结构（简要）

```
src/
  assets/                # 静态资源（例如 logo.svg）
  components/
    dashboard/           # Dashboard 相关组件
    editor/              # Editor 相关组件
    ui/                  # 通用 UI 组件（Button/Table 等）
  layouts/               # 布局组件（侧边栏等）
  router/                # vue-router 路由定义
  stores/                # Pinia store（编辑器工作流等）
  views/                 # 页面级组件
```

---

## 常见改动指南

### 替换侧边栏 Logo

- 文件：`src/assets/logo.svg`
- 使用位置：`src/layouts/AppLayout.vue`

### 调整 1920 屏幕左右边距

页面容器建议统一：

- `max-w-[1600px] mx-auto px-6 xl:px-10 min-[1920px]:px-40`

---

## 说明

- 当前为 **前端原型**：数据为模拟数据，未接入真实爬取/RAG/审核 API。
- 若后续接入后端接口，建议把：
  - 工作流状态、当前选题、生成大纲、正文内容、审核结果
  - 统一沉到 Pinia Store，并封装 API 层（`src/services/`）与类型（`src/types/`）。

