import { Box, Braces, Compass, Cuboid, Play, Route, Sparkles } from "lucide-react";

import { MilestoneCard } from "@/components/MilestoneCard";
import { ScenePlaceholder } from "@/components/ScenePlaceholder";

const milestones = [
  {
    title: "项目框架",
    description: "Vite、React、TypeScript 与 Tailwind 已作为基础工程骨架。",
    status: "当前阶段",
  },
  {
    title: "3D 场景",
    description: "预留 React Three Fiber 场景入口，后续接入相机、灯光与控制器。",
    status: "下一步",
  },
  {
    title: "五魔方几何",
    description: "后续建立五边形面片、块体层级与颜色状态的数据结构。",
    status: "规划中",
  },
  {
    title: "交互控制",
    description: "后续补充旋转、缩放、层转动动画和调试面板。",
    status: "规划中",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.4),rgba(2,6,23,0.96))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-teal-300/30 bg-teal-300/10 text-teal-200">
              <Cuboid className="size-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Megaminx 3D Lab</p>
              <h1 className="text-lg font-semibold tracking-tight text-white">五魔方 3D 建模工作台</h1>
            </div>
          </div>
          <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-medium text-teal-100">
            本地预览框架
          </span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.94fr_1.06fr] lg:py-14">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">
                <Sparkles className="size-4 text-teal-200" />
                短期目标：先搭好可运行、可预览、可扩展的项目框架
              </div>
              <h2 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                为五魔方建模预留清晰的前端骨架。
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                当前页面只提供项目框架和 3D 画布占位，不包含具体五魔方模型实现。后续可以在
                <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-teal-100">src/scene</code>
                中逐步接入 Three.js 场景、几何结构和交互控制。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Play className="mb-3 size-5 text-teal-200" />
                <p className="text-sm text-slate-400">运行命令</p>
                <p className="mt-1 font-mono text-sm text-white">pnpm run dev</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Route className="mb-3 size-5 text-sky-200" />
                <p className="text-sm text-slate-400">预览路由</p>
                <p className="mt-1 font-mono text-sm text-white">/</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Braces className="mb-3 size-5 text-emerald-200" />
                <p className="text-sm text-slate-400">技术栈</p>
                <p className="mt-1 text-sm font-medium text-white">React + Vite + TS</p>
              </div>
            </div>
          </div>

          <ScenePlaceholder />
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-2 lg:grid-cols-4">
          {milestones.map((milestone, index) => (
            <MilestoneCard key={milestone.title} index={index + 1} {...milestone} />
          ))}
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>下一步建议：在 3D 场景入口中接入相机、灯光和 OrbitControls。</span>
          <span className="inline-flex items-center gap-2">
            <Box className="size-4 text-teal-200" />
            预留模块：src/components、src/pages、src/scene、src/hooks
          </span>
        </footer>
      </div>
    </main>
  );
}
