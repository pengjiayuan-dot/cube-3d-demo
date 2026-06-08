type MilestoneCardProps = {
  index: number;
  title: string;
  description: string;
  status: string;
};

export function MilestoneCard({ index, title, description, status }: MilestoneCardProps) {
  const isActive = status === "当前阶段";

  return (
    <article
      className={`rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 ${
        isActive
          ? "border-teal-300/40 bg-teal-300/10 shadow-[0_0_40px_rgba(20,184,166,0.12)]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10 font-mono text-sm text-white">
          {String(index).padStart(2, "0")}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isActive ? "bg-teal-300/15 text-teal-100" : "bg-white/10 text-slate-300"
          }`}
        >
          {status}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}
