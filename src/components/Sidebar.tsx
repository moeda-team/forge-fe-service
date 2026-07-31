"use client";
import { useCanvas, useStore } from "@/lib/store";

const NAV = [
  { key: "ai", label: "AI Workspace", icon: "✦" },
  { key: "kanban", label: "Kanban", icon: "☰" },
] as const;

const CANVASES = ["Design Canvas", "Frontend Canvas", "Backend Canvas", "Database Canvas", "Testing Canvas", "Brand Canvas"];

function LayoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M3 9h18M10 9v12" />
    </svg>
  );
}

export default function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const current = useStore((s) => s.current());
  const setCanvasScreen = useCanvas((s) => s.setCanvasScreen);

  const openDesignCanvas = () => {
    setCanvasScreen(current?.id === "ATL" ? "Atlas Design" : "Dashboard");
    setView("design");
  };

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
      <div className="h-[68px] shrink-0 px-4 flex items-center gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setView("projects")}
          className="w-8 h-8 shrink-0 rounded-lg grid place-items-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          title="All projects"
          aria-label="Back to all projects"
        >
          ←
        </button>
        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white grid place-items-center font-bold">{current?.name?.[0] ?? "F"}</div>
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">{current?.name ?? "Project"}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 truncate">{current?.type ?? "Workspace"}</div>
        </div>
      </div>
      <nav className="p-3 flex flex-col gap-1">
        <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-zinc-400">Workspace</div>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              view === n.key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span className="w-4 text-center">{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-zinc-400">Canvases</div>
        {CANVASES.map((c) => (
          <button
            key={c}
            data-tour={c === "Design Canvas" ? "design-canvas-menu" : undefined}
            onClick={() => c === "Design Canvas" && openDesignCanvas()}
            aria-disabled={c !== "Design Canvas"}
            className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg transition ${
              c === "Design Canvas"
                ? view === "design"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
                : "text-zinc-400 cursor-not-allowed"
            }`}
          >
            <span className="w-4 h-4 inline-flex items-center justify-center">{c === "Design Canvas" ? <LayoutIcon /> : "·"}</span>
            <span>{c}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
