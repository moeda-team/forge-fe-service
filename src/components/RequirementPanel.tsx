"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Project, ReqItem, Requirement, RequirementSnapshot } from "@/lib/types";

function itemText(x: string | ReqItem) {
  return typeof x === "string" ? x : x.text;
}

export default function RequirementPanel({ p, onOpenKanban }: { p: Project; onOpenKanban: () => void }) {
  const sendToKanban = useStore((s) => s.sendToKanban);
  const [sending, setSending] = useState(false);
  // timestamp is client-only to avoid SSR/CSR hydration mismatch
  const [ts, setTs] = useState("");
  useEffect(() => {
    if (p.reqUpdatedAt) setTs(new Date(p.reqUpdatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
  }, [p.reqUpdatedAt]);

  if (!p.req) {
    return (
      <div data-tour="requirement-panel" className="w-[420px] shrink-0 bg-zinc-50 border-l border-zinc-200 flex flex-col">
        <PanelHead />
        <div className="flex-1 flex flex-col items-center text-center gap-3 px-6 py-10 text-zinc-500">
          <div className="w-11 h-11 rounded-xl bg-white border border-zinc-200 grid place-items-center text-violet-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></svg>
          </div>
          <h4 className="font-semibold text-zinc-800">No Requirement yet</h4>
          <p className="text-[13px] leading-relaxed max-w-[320px]">This document is the single source of truth — every canvas reads from it. Describe the feature you want to build in the chat and the Requirement will be generated automatically.</p>
        </div>
      </div>
    );
  }

  if (!p.requirement) return null;
  const r = p.requirement;
  const curVer = p.reqVersion || 1;
  const synced = p.kanbanSyncedVer === curVer;
  const history = [...(p.requirementHistory || [])].sort((a, b) => b.version - a.version);
  const currentIsArchived = history.some((snapshot) => snapshot.version === curVer);
  const total = (p.kanban?.backlog.length || 0) + (p.kanban?.todo.length || 0) + (p.kanban?.progress.length || 0) + (p.kanban?.done.length || 0);

  const onSend = async () => {
    setSending(true);
    try {
      await sendToKanban(p.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-tour="requirement-panel" className="w-[420px] shrink-0 bg-zinc-50 border-l border-zinc-200 flex flex-col">
      <PanelHead />
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {history.map((snapshot) => (
          <SyncedRequirementCard
            key={snapshot.version}
            snapshot={snapshot}
            defaultOpen={synced && snapshot.version === curVer}
          />
        ))}

        {!synced || !currentIsArchived ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[12px] font-semibold text-zinc-800">Requirement v{curVer}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending changes</span>
              <span className="ml-auto text-[10px] text-amber-700">Not in Kanban yet</span>
            </div>
            <div className="bg-white px-4 py-4">
              <RequirementBody requirement={r} />
            </div>
          </div>
        ) : null}
      </div>

      {/* footer: meta + action */}
      <div className="m-3 p-3 bg-white border border-zinc-200 rounded-xl flex flex-wrap items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${synced ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="text-[10px] font-mono text-zinc-500">v{curVer}</span>
        <span className="text-[10px] font-mono text-zinc-500">auto-generated</span>
        <span className="text-[10px] font-mono text-zinc-500">source of truth</span>
        {ts && <span className="text-[10px] font-mono text-zinc-400">{ts}</span>}
        {sending ? (
          <button disabled className="ml-auto text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-violet-700 text-white opacity-85 cursor-progress flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…
          </button>
        ) : synced ? (
          <button disabled className="ml-auto text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white cursor-default flex items-center gap-1.5">
            <span>✓</span> Synced to Kanban
          </button>
        ) : (
          <button onClick={onSend} className="ml-auto text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-violet-700 text-white hover:bg-violet-800">
            {p.kanbanSyncedVer ? "Update Kanban" : "Send to Kanban"}
          </button>
        )}
      </div>

      {total > 0 && (
        <button onClick={onOpenKanban} className="mx-3 mb-3 text-left text-[12.5px] font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-3.5 py-2.5 hover:bg-violet-100">
          Extracted · {total} tasks → View Kanban
        </button>
      )}
    </div>
  );
}

function RequirementBody({ requirement: r }: { requirement: Requirement }) {
  return (
    <>
      <Section title="PRD"><p className={r._newPrd ? "req-new" : ""}>{r.prd}</p></Section>
      <Section title={`User Stories (${r.stories.length})`}>
        <ul>{r.stories.map((s, i) => <Li key={i} x={s} />)}</ul>
      </Section>
      <Section title={`Functional Requirements (${r.fr.length})`}>
        <ul>{r.fr.map((s, i) => <Li key={i} x={s} />)}</ul>
      </Section>
      <Section title={`Non-Functional Requirements (${r.nfr.length})`}>
        <ul>{r.nfr.map((s, i) => <Li key={i} x={s} />)}</ul>
      </Section>
      <Section title={`Acceptance Criteria (${r.ac.length})`}>
        <ul>{r.ac.map((s, i) => <Li key={i} x={s} />)}</ul>
      </Section>
      <Section title={`Business Rules (${r.rules.length})`}>
        <ul>{r.rules.map((s, i) => <Li key={i} x={s} />)}</ul>
      </Section>
    </>
  );
}

function SyncedRequirementCard({ snapshot, defaultOpen }: { snapshot: RequirementSnapshot; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [sentAt, setSentAt] = useState("");
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  useEffect(() => {
    setSentAt(new Date(snapshot.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
  }, [snapshot.sentAt]);

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-emerald-50"
        aria-expanded={open}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">✓</span>
        <span className="text-[12px] font-semibold text-zinc-800">Requirement v{snapshot.version}</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Sent to Kanban</span>
        {sentAt && <span className="ml-auto text-[10px] text-zinc-400">{sentAt}</span>}
        <span className={`text-[11px] text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <div className="border-t border-emerald-200 bg-white px-4 py-4">
          <RequirementBody requirement={snapshot.requirement} />
        </div>
      )}
    </div>
  );
}

function PanelHead() {
  return (
    <div className="h-[68px] shrink-0 px-5 border-b border-zinc-200 bg-white flex items-center">
      <h3 className="font-semibold text-sm">Requirement</h3>
      <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-700" /> AUTO
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

function Li({ x }: { x: string | ReqItem }) {
  const isNew = typeof x === "object" && x._new;
  return <li className={`mb-1 text-[13px] leading-relaxed ${isNew ? "req-new" : ""}`}>{itemText(x)}</li>;
}
