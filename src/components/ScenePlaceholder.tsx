import { Move3D } from "lucide-react";

export function ScenePlaceholder() {
  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/10 blur-3xl" />

      <div className="relative flex h-full min-h-[472px] flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-100/70">Scene Slot</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">3D 画布占位</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-300">
            WebGL Ready
          </span>
        </div>

        <div className="mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center">
          <div className="pentagon-frame relative flex size-72 items-center justify-center">
            <div className="absolute size-48 rotate-[18deg] rounded-[32%] border border-teal-200/40 bg-teal-200/[0.03]" />
            <div className="absolute size-60 rotate-[54deg] rounded-[32%] border border-sky-200/20" />
            <div className="absolute size-32 rotate-[90deg] rounded-[32%] border border-white/15" />
            <div className="flex size-20 items-center justify-center rounded-3xl border border-teal-300/40 bg-slate-950/80 text-teal-100 shadow-[0_0_36px_rgba(45,212,191,0.2)]">
              <Move3D className="size-9" />
            </div>
          </div>
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
            <p className="mt-1 text-sm text-slate-200">待接入五魔方</p>
          </div>
        </div>
      </div>
    </section>
  );
}
