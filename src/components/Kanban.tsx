"use client";
import { useEffect, useState } from "react";
import { useStore, KANBAN_COLS } from "@/lib/store";
import { forgeApi } from "@/lib/api";
import type { KanbanCard, OrchestrationRun } from "@/lib/types";

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
  const completion = total ? Math.round(kb.done.length / total * 100) : 0;
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

  const moveCardDirect = async (cardId: string, status: KanbanCard["status"]) => {
    if (movingId) return;
    setMovingId(cardId);
    try {
      await moveKanbanCard(p.id, cardId, status, kb[status].length);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f5f5f5]">
      <header className="shrink-0 px-8 pb-5 pt-7 flex items-start gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-zinc-950">Execution Board</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">Requirement → board → executed</p>
        </div>
        <span className="mt-0.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[10px] text-zinc-500">{total} tasks</span>
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
        <div className="ml-auto flex items-center gap-3">
          {syncSummary && <span className="self-center text-[11px] text-zinc-500">{syncSummary}</span>}
          <div className="min-w-36 text-right"><div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Overall progress</div><div className="mt-1 text-lg font-semibold text-zinc-950">{completion}%</div></div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold ${run?.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : run?.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-700"}`}>
            <span className="relative flex h-2 w-2">
              {(orchestrating || run?.status === "running") && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${run?.status === "failed" ? "bg-red-600" : run?.status === "completed" ? "bg-emerald-600" : "bg-violet-600"}`} />
            </span>
            {orchestrating ? "AI is orchestrating…" : run?.status === "completed" ? "AI orchestration complete" : run?.status === "failed" ? "Orchestration needs attention" : "AI orchestrates automatically"}
          </span>
        </div>
      </header>

      <div className="shrink-0 px-8">
        <div className="grid grid-cols-4 gap-3">
          {KANBAN_COLS.map((column) => {
            const count = kb[column.key as keyof typeof kb].length;
            return <div key={column.key} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${COL_DOT[column.key]}`} /><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-400">{column.label}</span></div><div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{count}</div></div>;
          })}
        </div>
        <div data-tour="kanban-ai" className="mt-3 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.3 14 16.2 14 18h-4c0-1.8-.5-2.7-1.5-3.5Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-zinc-900">AI-powered execution</h2>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">Requirement diprioritaskan, dipecah menjadi task, dan diorkestrasi otomatis.</p>
          </div>
        </div>
        {(run || orchestrating || orchestrationError) && (
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-5 py-3">
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

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-8 pb-7 pt-5">
        <div className="grid h-full min-w-[1040px] grid-cols-4 items-start gap-4">
          {KANBAN_COLS.map((col) => {
            const cards = kb[col.key as keyof typeof kb] as KanbanCard[];
            return (
              <div key={col.key} className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center gap-2 px-2 pb-3">
                  <span className={`w-2 h-2 rounded-full ${COL_DOT[col.key]}`} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">{col.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-400">{cards.length}</span>
                </div>
                <div
                  className={`flex min-h-[140px] flex-1 flex-col gap-3 overflow-y-auto overscroll-contain rounded-[24px] border border-zinc-200 p-3 transition-colors ${draggedId ? "bg-zinc-200/70" : "bg-zinc-200/45"}`}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                  onDrop={(event) => { event.preventDefault(); void dropCard(col.key as KanbanCard["status"], cards.length); }}
                >
                  {cards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 px-3 py-8 text-center font-mono text-[10px] text-zinc-400">Drop tasks here</div>
                  ) : (
                    cards.map((c, index) => (
                      <div
                        key={c.id}
                        onDragOver={(event) => { if (!c.obsolete) { event.preventDefault(); event.stopPropagation(); } }}
                        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); void dropCard(col.key as KanbanCard["status"], index); }}
                      >
                        <Card c={c} moving={movingId === c.id} onMove={(status) => void moveCardDirect(c.id, status)} onDragStart={() => setDraggedId(c.id)} onDragEnd={() => setDraggedId(null)} />
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

function Card({ c, moving, onMove, onDragStart, onDragEnd }: { c: KanbanCard; moving: boolean; onMove: (status: KanbanCard["status"]) => void; onDragStart: () => void; onDragEnd: () => void }) {
  const progress = c.status === "done" ? 100 : c.status === "progress" ? 64 : c.status === "todo" ? 24 : 0;
  const statusLabel = c.status === "progress" ? "In progress" : c.status === "todo" ? "Task" : c.status.charAt(0).toUpperCase() + c.status.slice(1);
  return (
    <div
      draggable={!c.obsolete && !moving}
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", c.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      className={`group relative rounded-[26px] border border-zinc-200 bg-white p-4 text-[13px] leading-relaxed transition duration-200 ${c.obsolete ? "cursor-not-allowed opacity-50" : "cursor-grab hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)] active:cursor-grabbing"} ${moving ? "animate-pulse" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-wide text-zinc-400">{c.reqRef || c.id.slice(0, 8).toUpperCase()}</span>
        <span className={`ml-auto h-2 w-2 rounded-full ${COL_DOT[c.status]} ${c.status === "progress" ? "animate-pulse" : ""}`} />
      </div>
      <TaskPreview canvas={c.canvas} generating={c.status === "progress"} />
      <div className="mt-4 text-[15px] font-medium leading-[1.35] text-zinc-950">{c.title}</div>
      <div className="mt-2 font-mono text-[10px] leading-5 text-zinc-400">{c.canvas ? `${c.canvas.charAt(0).toUpperCase()}${c.canvas.slice(1)}` : "System"} · {c.reqRef || statusLabel}</div>
      {c.obsolete && <span className="mt-2 inline-block rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">Obsolete</span>}
      {c.status === "progress" ? <>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-red-600 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="mt-2 font-mono text-[10px] text-zinc-500">rendering <b className="font-medium text-red-600">{progress}%</b> · generating<span className="mt-1 block">composing task output…</span></div>
      </> : <div className="mt-4">
        {c.status === "backlog" && <TaskAction label="Queue →" onClick={() => onMove("todo")} />}
        {c.status === "todo" && <TaskAction label="▶ Run" onClick={() => onMove("progress")} />}
        {c.status === "done" && <TaskAction label="↩ Reopen" onClick={() => onMove("progress")} secondary />}
      </div>}
    </div>
  );
}

function TaskPreview({ canvas, generating }: { canvas?: string | null; generating: boolean }) {
  return <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-[18px] border border-zinc-200 bg-zinc-50">
    <div className="absolute inset-[10%] rounded-xl bg-zinc-100">
      <span className={`absolute left-[10%] top-[36%] h-[8%] w-[46%] rounded-full ${canvas === "design" ? "bg-blue-500" : "bg-zinc-900"}`} />
      <span className="absolute left-[10%] top-[54%] h-[6%] w-[68%] rounded-full bg-zinc-400" />
      <span className="absolute bottom-[12%] right-[10%] h-[18%] w-[18%] rounded-lg border border-zinc-300 bg-white" />
    </div>
    {generating && <div className="absolute inset-0 overflow-hidden bg-white/55"><span className="kanban-scan-line absolute left-0 right-0 top-0 h-[34%] border-y border-red-400 bg-gradient-to-b from-transparent via-red-200/80 to-transparent shadow-[0_0_18px_rgba(239,68,68,0.22)]" /><span className="kanban-scan-radar absolute left-1/2 top-1/2 h-2/3 w-2/3 rounded-full border border-red-200" /></div>}
  </div>;
}

function TaskAction({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) {
  return <button type="button" onClick={(event) => { event.stopPropagation(); onClick(); }} className={`flex h-10 w-full items-center justify-center rounded-2xl text-[12px] font-semibold transition ${secondary ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>{label}</button>;
}
