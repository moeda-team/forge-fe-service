"use client";
import { useEffect, useState } from "react";
import { useStore, KANBAN_COLS } from "@/lib/store";
import { forgeApi } from "@/lib/api";
import type { KanbanCard, OrchestrationRun } from "@/lib/types";

const CANVAS_STYLE: Record<string, { dot: string; chip: string; bar: string }> = {
  design: { dot: "bg-blue-500", chip: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  frontend: { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  backend: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  database: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  testing: { dot: "bg-rose-500", chip: "bg-rose-50 text-violet-700", bar: "bg-rose-500" },
  brand: { dot: "bg-fuchsia-500", chip: "bg-fuchsia-50 text-fuchsia-600", bar: "bg-fuchsia-500" },
};
const ZINC = { dot: "bg-zinc-400", chip: "bg-zinc-100 text-zinc-500", bar: "bg-zinc-400" };
const styleFor = (c?: string | null) => (c && CANVAS_STYLE[c] ? CANVAS_STYLE[c] : ZINC);

const COL_DOT: Record<string, string> = {
  backlog: "bg-zinc-400",
  todo: "bg-blue-500",
  progress: "bg-amber-500",
  done: "bg-emerald-500",
};

export default function Kanban() {
  const p = useStore((s) => s.current());
  const sendToKanban = useStore((s) => s.sendToKanban);
  const moveKanbanCard = useStore((s) => s.moveKanbanCard);
  const refreshProject = useStore((s) => s.refreshProject);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [run, setRun] = useState<OrchestrationRun | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);
  const [orchestrationError, setOrchestrationError] = useState("");
  const synced = Boolean(p && p.kanbanSyncedVer === (p.reqVersion || 1));

  const executeOrchestration = async (trigger: OrchestrationRun["trigger"] = "automatic") => {
    if (!p || orchestrating || !p.requirement || !synced) return;
    setOrchestrating(true);
    setOrchestrationError("");
    try {
      const nextRun = await forgeApi.runOrchestration(p.id, trigger);
      setRun(nextRun);
      await refreshProject(p.id);
    } catch (cause) {
      setOrchestrationError(cause instanceof Error ? cause.message : "AI orchestration failed");
      const latest = await forgeApi.getLatestOrchestration(p.id).catch(() => null);
      if (latest) setRun(latest);
    } finally {
      setOrchestrating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!p?.requirement || !synced) { setRun(null); return; }
    void forgeApi.getLatestOrchestration(p.id).then(async (latest) => {
      if (cancelled) return;
      setRun(latest);
      const missingVerification = latest && !latest.steps.some((step) => step.key === "verification");
      if (!latest || latest.requirementVersion < (p.reqVersion || 0) || missingVerification) await executeOrchestration("automatic");
    }).catch((cause) => { if (!cancelled) setOrchestrationError(cause instanceof Error ? cause.message : "Unable to read orchestration status"); });
    return () => { cancelled = true; };
    // Run only when the Requirement/Kanban source version changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, p?.reqVersion, p?.kanbanSyncedVer, Boolean(p?.requirement)]);
  if (!p) return null;
  const kb = p.kanban || { backlog: [], todo: [], progress: [], done: [] };
  const total = kb.backlog.length + kb.todo.length + kb.progress.length + kb.done.length;
  const syncRequirement = async () => {
    if (syncing || !p.requirement) return;
    setSyncing(true);
    try {
      const result = await sendToKanban(p.id);
      if (result) setSyncSummary(`${result.added} added · ${result.updated} updated · ${result.obsolete} obsolete`);
    } finally {
      setSyncing(false);
    }
  };

  const dropCard = async (status: KanbanCard["status"], index: number) => {
    if (!draggedId || movingId) return;
    const cardId = draggedId;
    setDraggedId(null);
    setMovingId(cardId);
    try {
      await moveKanbanCard(p.id, cardId, status, index);
    } catch {
      // The store restores the previous board and exposes the API error.
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-50">
      <header className="shrink-0 px-8 py-5 border-b border-zinc-200 bg-white flex items-center">
        <h1 className="text-xl font-semibold tracking-tight">Kanban</h1>
        <span className="ml-3 text-[11px] font-medium text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-1">{total} tasks</span>
        {!p.req ? (
          <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            No requirement
          </span>
        ) : synced ? (
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <span>✓</span> Requirement synced
          </span>
        ) : (
          <button
            type="button"
            onClick={syncRequirement}
            disabled={syncing}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-progress disabled:hover:border-amber-300 disabled:hover:bg-amber-50"
            title="Click to sync the latest Requirement"
          >
            {syncing ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
                Syncing requirement…
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Re-sync requirement
              </>
            )}
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {syncSummary && <span className="self-center text-[11px] text-zinc-500">{syncSummary}</span>}
          <span className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold ${run?.status === "failed" ? "bg-red-50 text-red-700" : run?.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>
            <span className="relative flex h-2 w-2">
              {(orchestrating || run?.status === "running") && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${run?.status === "failed" ? "bg-red-600" : run?.status === "completed" ? "bg-emerald-600" : "bg-violet-600"}`} />
            </span>
            {orchestrating ? "AI is orchestrating…" : run?.status === "completed" ? "AI orchestration complete" : run?.status === "failed" ? "Orchestration needs attention" : "AI orchestrates automatically"}
          </span>
        </div>
      </header>

      <div className="shrink-0 px-6 pt-6">
        <div data-tour="kanban-ai" className="flex items-start gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/90 to-white px-5 py-4 shadow-sm shadow-violet-100/50">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.3 14 16.2 14 18h-4c0-1.8-.5-2.7-1.5-3.5Z" />
            </svg>
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-sm font-semibold text-violet-700">This board is AI-powered</h2>
            <p className="mt-1 max-w-5xl text-[13px] leading-6 text-zinc-600">
              AI membaca requirement, menyusun prioritas dan dependency, lalu mengorkestrasi setiap task secara otomatis sampai selesai.
              Tidak ada tindakan manual yang wajib dilakukan—Anda cukup memantau progres dan meninjau hasil ketika diperlukan.
            </p>
          </div>
        </div>
        {(run || orchestrating || orchestrationError) && (
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div><h3 className="text-sm font-semibold text-zinc-900">Orchestration activity</h3><p className="mt-0.5 text-[11px] text-zinc-400">{run ? `Requirement v${run.requirementVersion} · ${run.trigger}` : "Preparing the latest Requirement"}</p></div>
              {run?.completedAt && <span className="ml-auto text-[11px] text-zinc-400">Completed {new Date(run.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              {run?.status === "failed" && <button type="button" onClick={() => void executeOrchestration("retry")} disabled={orchestrating} className="ml-auto rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">Retry</button>}
            </div>
            {orchestrationError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{orchestrationError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-7">
              {(run?.steps || []).map((step) => (
                <div key={step.key} className="rounded-xl border border-zinc-200 px-3 py-2.5">
                  <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${step.status === "completed" ? "bg-emerald-500" : step.status === "failed" ? "bg-red-500" : step.status === "running" ? "animate-pulse bg-violet-500" : "bg-zinc-300"}`} /><span className="truncate text-[11px] font-medium text-zinc-700">{step.label}</span></div>
                  {(step.fileCount !== undefined || step.taskCount !== undefined || step.checkCount !== undefined) && <div className="mt-1.5 text-[10px] text-zinc-400">{step.fileCount !== undefined ? `${step.fileCount} files` : step.checkCount !== undefined ? `${step.checkCount} checks` : `${step.taskCount} tasks updated`}</div>}
                </div>
              ))}
              {orchestrating && !run && [0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-zinc-100" />)}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-4">
        <div className="grid h-full min-w-[1040px] grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => {
            const cards = kb[col.key as keyof typeof kb] as KanbanCard[];
            return (
              <div key={col.key} className="h-full min-h-0 overflow-hidden bg-zinc-100/70 rounded-2xl border border-zinc-200 flex flex-col">
                <div className="shrink-0 px-4 py-3 flex items-center gap-2 border-b border-zinc-200/80 bg-zinc-100/95 rounded-t-2xl backdrop-blur">
                  <span className={`w-2 h-2 rounded-full ${COL_DOT[col.key]}`} />
                  <span className="text-sm font-semibold text-zinc-700">{col.label}</span>
                  <span className="ml-auto text-[11px] font-medium text-zinc-400 bg-white border border-zinc-200 rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div
                  className={`flex-1 min-h-0 overscroll-contain overflow-y-auto p-3 flex flex-col gap-2.5 ${draggedId ? "bg-zinc-200/40" : ""}`}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                  onDrop={(event) => { event.preventDefault(); void dropCard(col.key as KanbanCard["status"], cards.length); }}
                >
                  {cards.length === 0 ? (
                    <div className="text-center text-[12px] text-zinc-400 py-8 border border-dashed border-zinc-200 rounded-xl">Drop tasks here</div>
                  ) : (
                    cards.map((c, index) => (
                      <div
                        key={c.id}
                        onDragOver={(event) => { if (!c.obsolete) { event.preventDefault(); event.stopPropagation(); } }}
                        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); void dropCard(col.key as KanbanCard["status"], index); }}
                      >
                        <Card c={c} moving={movingId === c.id} onDragStart={() => setDraggedId(c.id)} onDragEnd={() => setDraggedId(null)} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Card({ c, moving, onDragStart, onDragEnd }: { c: KanbanCard; moving: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  const st = styleFor(c.canvas ?? undefined);
  return (
    <div
      draggable={!c.obsolete && !moving}
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", c.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      className={`group relative bg-white border border-zinc-200 rounded-xl p-3 pl-4 text-[13px] leading-relaxed transition ${c.obsolete ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-900 hover:shadow-sm cursor-grab active:cursor-grabbing"} ${moving ? "animate-pulse" : ""}`}
    >
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${st.bar}`} />
      <div className="text-zinc-800">{c.title}</div>
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        {c.canvas && <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${st.chip}`}>{c.canvas}</span>}
        {c.reqRef && <span className="text-[10px] font-mono text-zinc-400">{c.reqRef}</span>}
        {c.obsolete && <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">Obsolete</span>}
      </div>
    </div>
  );
}
