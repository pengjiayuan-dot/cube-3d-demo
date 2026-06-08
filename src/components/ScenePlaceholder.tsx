import { MegaminxCanvas } from "@/scene/MegaminxCanvas";
import { MegaminxSingleFaceCanvas } from "@/scene/MegaminxSingleFaceCanvas";

export function ScenePlaceholder() {
  return (
    <div className="space-y-8">
      <section className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex h-full min-h-[472px] flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-100/70">Megaminx Draft</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">五魔方 3D 原型</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-300">
              可拖拽观察
            </span>
          </div>

          <div className="relative mx-auto h-[360px] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80 md:h-[430px]">
            <div className="absolute inset-x-6 top-6 z-10 flex items-center justify-between text-xs text-slate-400">
              <span>12 个五边形面</span>
              <span>正十二面体布局</span>
            </div>
            <MegaminxCanvas />
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">相机</p>
              <p className="mt-1 text-sm text-slate-200">Perspective</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">控制</p>
              <p className="mt-1 text-sm text-slate-200">OrbitControls</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">模型</p>
              <p className="mt-1 text-sm text-slate-200">静态五魔方原型</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative flex h-full min-h-[472px] flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-100/70">Single Face Draft</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">单面建模原型</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-300">
              可拖拽观察
            </span>
          </div>

          <div className="relative mx-auto h-[360px] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80 md:h-[430px]">
            <div className="absolute inset-x-6 top-6 z-10 flex items-center justify-between text-xs text-slate-400">
              <span>1 个中心块 · 5 个边块 · 5 个角块</span>
              <span>11 个独立几何体拼接</span>
            </div>
            <MegaminxSingleFaceCanvas />
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">中心块 (Center)</p>
              <p className="mt-1 text-sm text-slate-200">1 个正圆形</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">角块 (Corner)</p>
              <p className="mt-1 text-sm text-slate-200">5 个带圆弧缺口平行四边形</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">边块 (Edge)</p>
              <p className="mt-1 text-sm text-slate-200">5 个带圆弧缺口三角形</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
