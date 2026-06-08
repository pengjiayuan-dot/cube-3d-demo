# 五魔方 3D 建模网站框架

这是一个用于五魔方 3D 建模短期目标的前端项目框架。当前阶段只提供可运行、可预览的 React/Vite 工程结构和 3D 工作台占位，不包含具体五魔方模型实现。

## 技术栈

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Three.js / React Three Fiber / Drei 依赖已预留

## 本地运行

```bash
pnpm install
pnpm run dev
```

默认开发地址通常是：

```text
http://localhost:5173/
```

## 常用命令

```bash
pnpm run check
pnpm run build
pnpm run preview
```

## 目录说明

- `src/pages`：页面组件。
- `src/components`：通用 UI 组件。
- `src/scene`：后续五魔方 3D 场景、几何和交互逻辑。
- `.trae/documents`：PRD 与技术架构文档。
