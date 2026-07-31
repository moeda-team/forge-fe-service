"use client";
import { useState, useRef, useEffect } from "react";
import { useStore, STAGES } from "@/lib/store";
import RequirementPanel from "./RequirementPanel";

const MODELS = [
  { id: "gpt-4o", label: "GPT-4o", hint: "OpenAI" },
  { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", hint: "Anthropic" },
  { id: "claude-3-opus", label: "Claude 3 Opus", hint: "Anthropic" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", hint: "Google" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "OpenAI" },
  { id: "llama-3.1-70b", label: "Llama 3.1 70B", hint: "Meta" },
];

type AttachKind = "file" | "folder" | "knowledge";
const ATTACH_ORDER: AttachKind[] = ["knowledge", "folder", "file"];
const ATTACH_META: Record<AttachKind, { icon: string; label: string; active: string }> = {
  knowledge: { icon: "🧠", label: "Knowledge", active: "bg-zinc-900 text-white border-zinc-900" },
  folder: { icon: "📁", label: "Folder", active: "bg-zinc-900 text-white border-zinc-900" },
  file: { icon: "📎", label: "File", active: "bg-zinc-900 text-white border-zinc-900" },
};

function Dot() {
  return <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-zinc-900 border border-white" />;
}

export default function AIWorkspace() {
  const p = useStore((s) => s.current());
  const aiLog = useStore((s) => (p ? s.aiLog[p.id] : undefined));
  const sendChat = useStore((s) => s.sendChat);
  const setView = useStore((s) => s.setView);

  const [model, setModel] = useState("claude-3.5-sonnet");
  const [modelOpen, setModelOpen] = useState(false);
  const [modelQ, setModelQ] = useState("");
  const [attach, setAttach] = useState<Record<AttachKind, number>>({ file: 0, folder: 0, knowledge: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragFiles, setDragFiles] = useState(0);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // click-outside closes menu + model dropdown
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // focus search when model dropdown opens
  useEffect(() => { if (modelOpen) setTimeout(() => searchRef.current?.focus(), 30); }, [modelOpen]);

  if (!p) return null;
  const log = aiLog || [{ role: "ai" as const, text: `Requirement is live for ${p.name}. Ask me to draft the brief, generate the PRD, or run an impact analysis.` }];
  const activeModel = MODELS.find((m) => m.id === model)!;
  const attachCount = attach.file + attach.folder + attach.knowledge;

  const toggleAttach = (k: AttachKind) =>
    setAttach((a) => ({ ...a, [k]: a[k] > 0 ? 0 : 1 }));

  const autoGrow = () => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const submit = () => {
    const ta = taRef.current; if (!ta) return;
    const v = ta.value.trim();
    if (!v) return;
    const parts: string[] = [];
    if (attachCount > 0) parts.push(`[simulated context: ${attachCount} item(s) — ${Object.entries(attach).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(", ")}]`);
    sendChat((parts.join(" ") + " " + v).trim());
    ta.value = ""; autoGrow();
  };

  const sendQuickAction = (prompt: string) => {
    sendChat(prompt);
  };

  const focusRequirement = () => {
    document.querySelector<HTMLElement>('[data-tour="requirement-panel"]')?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  // drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const n = e.dataTransfer.files?.length || 0;
    if (n > 0) setAttach((a) => ({ ...a, file: a.file + n }));
    setDragFiles(0);
  };

  const filtered = MODELS.filter((m) => (m.label + m.hint).toLowerCase().includes(modelQ.toLowerCase()));

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-zinc-200">
        <div data-tour="ai-workspace" className="h-[68px] shrink-0 px-8 border-b border-zinc-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white grid place-items-center font-bold">{p.name[0]}</div>
          <div>
            <div className="font-semibold">{p.name} · AI Workspace</div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">{p.type} · {p.req ? "Requirement live" : "no requirement yet"}</div>
          </div>
          <span className="ml-auto flex items-center gap-2 text-[11px] text-zinc-500 border border-zinc-300 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            {p.live ? `In flight · ${STAGES[p.stage]}` : "Shipped"}
          </span>
          <div className="text-right">
            <div className="text-[11px] text-zinc-400">Stage</div>
            <div className="text-sm font-medium">{p.prog}%</div>
          </div>
          <div className="w-24 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-zinc-900" style={{ width: `${p.prog}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white px-7 py-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
          {log.map((m, i) => (
            <ChatMessage
              key={i}
              message={m}
              model={activeModel.label}
              showQuickActions={m.role === "ai" && i === 0}
              onQuickAction={sendQuickAction}
              onOpenRequirement={focusRequirement}
              onOpenKanban={() => setView("kanban")}
            />
          ))}
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-zinc-200 bg-white p-4">
          <div
            className={`mx-auto max-w-4xl border rounded-2xl bg-white px-2 py-2 transition-all duration-150 ${dragging ? "border-zinc-900 ring-2 ring-zinc-200 bg-zinc-50" : "border-zinc-300 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900"}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); setDragFiles(e.dataTransfer.items?.length || 0); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragging(false); setDragFiles(0); } }}
            onDrop={onDrop}
          >
            <div className="flex items-end gap-2">
              {/* + button → floating menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-9 h-9 shrink-0 rounded-xl border border-zinc-300 text-zinc-900 grid place-items-center text-lg leading-none hover:bg-zinc-100 transition"
                  title="Add attachment"
                >
                  +
                </button>
                {menuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-30 animate-pop origin-bottom-left">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">Attach</div>
                    {ATTACH_ORDER.map((k) => {
                      const meta = ATTACH_META[k];
                      const on = attach[k] > 0;
                      return (
                        <button
                          key={k}
                          onClick={() => toggleAttach(k)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${on ? meta.active : "hover:bg-zinc-50"}`}
                        >
                          <span className="relative text-[15px]">
                            {meta.icon}
                            {k === "knowledge" && <Dot />}
                          </span>
                          <span className="text-[13px] font-medium">{meta.label}</span>
                          {on && <span className="ml-auto text-[10px] font-semibold bg-white/80 rounded-full px-1.5">{attach[k]}</span>}
                        </button>
                      );
                    })}
                    <div className="border-t border-zinc-100 mt-1 pt-1 px-3 py-1.5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                      or drop files anywhere
                    </div>
                  </div>
                )}
              </div>

              {/* textarea (auto-grow) */}
              <textarea
                ref={taRef}
                rows={1}
                placeholder="Ask me anything about requirements..."
                onInput={autoGrow}
                onKeyDown={onKey}
                className="flex-1 outline-none text-sm bg-transparent px-1 py-1.5 resize-none leading-relaxed max-h-40"
              />

              {/* model searchable dropdown */}
              <div className="relative" ref={modelRef}>
                <button
                  type="button"
                  onClick={() => setModelOpen((o) => !o)}
                  className="text-[12px] rounded-xl border border-zinc-300 text-zinc-800 px-3 py-2 flex items-center gap-1.5 hover:border-zinc-900 hover:bg-zinc-50 transition"
                >
                  <span className="relative">
                    <span className="text-zinc-900">✦</span>
                    <Dot />
                  </span>
                  {activeModel.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {modelOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-30 animate-pop origin-bottom-right">
                    <div className="p-2 border-b border-zinc-100">
                      <input
                        ref={searchRef}
                        value={modelQ}
                        onChange={(e) => setModelQ(e.target.value)}
                        placeholder="Search models…"
                        className="w-full text-[13px] outline-none bg-zinc-50 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="max-h-56 overflow-auto py-1">
                      {filtered.length === 0 && <div className="px-3 py-3 text-[12px] text-zinc-400">No models found</div>}
                      {filtered.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setModel(m.id); setModelOpen(false); setModelQ(""); }}
                          className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-zinc-50 ${m.id === model ? "bg-zinc-50" : ""}`}
                        >
                          <span className="text-[13px] font-medium">{m.label}</span>
                          <span className="text-[10px] text-zinc-400">{m.hint}</span>
                          {m.id === model && <span className="text-emerald-600 text-[11px]">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* send */}
              <button
                type="button"
                onClick={submit}
                className="bg-zinc-900 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-black hover:scale-[1.03] active:scale-95 transition-transform duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                Send
              </button>
            </div>

            <p className="mt-2 px-1 text-[10px] text-zinc-400">Demo mode: model selection and attachments are local UI state; no provider or files are sent.</p>

            {/* drag overlay */}
            {dragging && (
              <div className="mt-2 rounded-xl border-2 border-dashed border-zinc-500 bg-zinc-50 py-3 text-center text-[12px] text-zinc-700">
                Drop {dragFiles > 0 ? `${dragFiles} file(s)` : "files"} to attach
              </div>
            )}
          </div>

          {/* active attachments summary */}
          {attachCount > 0 && (
            <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 mt-2 px-1">
              {ATTACH_ORDER.map((k) => attach[k] > 0 && (
                <span key={k} className={`text-[12px] rounded-full border px-3 py-1 flex items-center gap-1.5 ${ATTACH_META[k].active}`}>
                  <span>{ATTACH_META[k].icon}</span>{ATTACH_META[k].label} · {attach[k]}
                </span>
              ))}
              <span className="text-[11px] text-zinc-400">· using {activeModel.label}</span>
            </div>
          )}
        </div>
      </div>

      <RequirementPanel p={p} onOpenKanban={() => setView("kanban")} />
    </div>
  );
}

type ChatEntry = { role: "ai" | "user"; text: string; at?: number };

function MessageTime({ at }: { at?: number }) {
  if (!at) return null;
  return <span suppressHydrationWarning className="text-[10px] font-normal text-zinc-400">{new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>;
}

function ChatMessage({
  message,
  model,
  showQuickActions,
  onQuickAction,
  onOpenRequirement,
  onOpenKanban,
}: {
  message: ChatEntry;
  model: string;
  showQuickActions: boolean;
  onQuickAction: (prompt: string) => void;
  onOpenRequirement: () => void;
  onOpenKanban: () => void;
}) {
  const isAI = message.role === "ai";
  const isRequirementResult = isAI && message.text.startsWith("Requirement created for ");
  const [resultTitle, ...resultBody] = message.text.split(". ");

  if (!isAI) {
    return (
      <div className="ml-auto flex max-w-[78%] items-start gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-end gap-2">
            <span className="text-[11px] font-semibold text-zinc-800">You</span>
            <MessageTime at={message.at} />
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-3 text-[13px] leading-6 text-white shadow-sm">
            {message.text}
          </div>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">U</div>
      </div>
    );
  }

  return (
    <div className="flex max-w-[82%] items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-base text-white">✦</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-900">AI</span>
          <span className="text-[10px] text-zinc-500">({model})</span>
          <MessageTime at={message.at} />
        </div>

        {isRequirementResult ? (
          <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-zinc-300 bg-white shadow-sm">
            <div className="flex gap-3 p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-zinc-900 text-sm font-bold text-zinc-900">✓</span>
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900">{resultTitle}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-zinc-600">{resultBody.join(". ")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
              <button type="button" onClick={onOpenRequirement} className="rounded-lg bg-zinc-900 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-black">
                Open Requirement Panel
              </button>
              <button type="button" onClick={onOpenKanban} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-zinc-800 hover:border-zinc-900">
                View in Kanban ↗
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm border border-zinc-300 bg-zinc-50 px-4 py-3 text-[13px] leading-6 text-zinc-800 shadow-sm">
            {message.text}
            {showQuickActions && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
                {[
                  ["✎", "Draft the brief"],
                  ["▤", "Generate PRD"],
                  ["↗", "Run impact analysis"],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onQuickAction(label)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-800 transition hover:border-zinc-900 hover:bg-zinc-100"
                  >
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
