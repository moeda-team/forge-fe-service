"use client";
import { useState } from "react";
import { useCanvas, SCREENS, findNodeById } from "@/lib/store";

function GeometryInput({ label, value, min, wrap, disabled, onCommit }: { label: string; value: number; min?: number; wrap?: boolean; disabled?: boolean; onCommit: (value: number) => void }) {
  const formatValue = (number: number) => number.toFixed(2).replace(/\.00$/, "");
  const [draftState, setDraftState] = useState({ value, draft: formatValue(value) });
  const draft = draftState.value === value ? draftState.draft : formatValue(value);
  const setDraft = (next: string) => setDraftState({ value, draft: next });
  const [invalid, setInvalid] = useState(false);
  const commit = () => {
    let next = Number(draft);
    if (!Number.isFinite(next) || (min !== undefined && next < min)) {
      setInvalid(true);
      setDraft(formatValue(value));
      window.setTimeout(() => setInvalid(false), 500);
      return;
    }
    if (wrap) next = ((next % 360) + 360) % 360;
    onCommit(next);
  };
  return (
    <label className="text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <input disabled={disabled} inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} className={`w-full text-[12px] border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-700 disabled:bg-zinc-50 ${invalid ? "border-rose-500 animate-pulse" : "border-zinc-200"}`} />
    </label>
  );
}

function EyeIcon({ hidden = false }: { hidden?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

function FourDotsIcon() {
  return (
    <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
      <i className="w-1 h-1 rounded-full border border-current" />
      <i className="w-1 h-1 rounded-full border border-current" />
      <i className="w-1 h-1 rounded-full border border-current" />
      <i className="w-1 h-1 rounded-full border border-current" />
    </span>
  );
}

function DropletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5S5.5 9.2 5.5 14.4a6.5 6.5 0 0 0 13 0C18.5 9.2 12 2.5 12 2.5Z" />
    </svg>
  );
}

export default function SelectedNodeInspector() {
  const selIds = useCanvas((s) => s.canvas.selIds);
  const setGeom = useCanvas((s) => s.setGeom);
  const updateNode = useCanvas((s) => s.updateNode);
  const deleteNode = useCanvas((s) => s.deleteNode);
  const groupSelected = useCanvas((s) => s.groupSelected);
  const wrapSelectedInFrame = useCanvas((s) => s.wrapSelectedInFrame);
  const ungroupSelected = useCanvas((s) => s.ungroupSelected);
  const duplicateSelected = useCanvas((s) => s.duplicateSelected);
  const toggleNodeVisibility = useCanvas((s) => s.toggleNodeVisibility);
  const toggleNodeLock = useCanvas((s) => s.toggleNodeLock);
  const commitHistory = useCanvas((s) => s.commitHistory);
  const setSel = useCanvas((s) => s.setSel);
  const canvasScreen = useCanvas((s) => s.canvas.screen);

  const screen = SCREENS.find((s) => s.name === canvasScreen);
  const selectedNodes = screen ? selIds.map((id) => findNodeById(screen, id)).filter(Boolean) : [];
  const node = selectedNodes[0];

  const clear = () => setSel(null);

  if (!node) return null;

  const canGroup = selIds.length >= 2;
  const canUngroup = !!node.children && node.children.length > 0;
  const multi = selectedNodes.length > 1;
  const bounds = {
    x: Math.min(...selectedNodes.map((item) => item!.x)),
    y: Math.min(...selectedNodes.map((item) => item!.y)),
    w: Math.max(...selectedNodes.map((item) => item!.x + item!.w)) - Math.min(...selectedNodes.map((item) => item!.x)),
    h: Math.max(...selectedNodes.map((item) => item!.y + item!.h)) - Math.min(...selectedNodes.map((item) => item!.y)),
  };

  const textLike = node.type === "text" || node.type === "button" || node.type === "input" || node.type === "card" || node.type === "row" || node.type === "section" || node.type === "component";
  const isTextNode = node.type === "text";

  const set = (patch: Partial<typeof node.props>) => updateNode(node.id, patch);
  const autoDirection = node.props.direction === "col" ? "col" : "row";
  const autoHorizontal = autoDirection === "row" ? (node.props.justify ?? "start") : (node.props.align ?? "start");
  const autoVertical = autoDirection === "row" ? (node.props.align ?? "start") : (node.props.justify ?? "start");
  const setAutoPosition = (horizontal: "start" | "center" | "end", vertical: "start" | "center" | "end") => {
    if (autoDirection === "row") set({ justify: horizontal, align: vertical });
    else set({ align: horizontal, justify: vertical });
  };

  return (
    <aside className="w-64 shrink-0 border-l border-zinc-200 bg-white p-4 overflow-auto min-h-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold capitalize">{multi ? `${selectedNodes.length} selected` : node.type}</div>
          <div className="text-[10px] text-zinc-400">{multi ? "Bounding box" : node.name ?? "Current layer"}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clear} className="text-[10px] text-zinc-400 hover:bg-zinc-50 rounded px-1 py-0.5" title="Deselect">✕</button>
        </div>
      </div>

      {/* Position */}
      <section>
        <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Position</div>
        <div className="grid grid-cols-2 gap-2">
          <GeometryInput label="X" value={multi ? bounds.x : node.x} disabled={multi} onCommit={(value) => { setGeom(node.id, { x: value }); commitHistory(); }} />
          <GeometryInput label="Y" value={multi ? bounds.y : node.y} disabled={multi} onCommit={(value) => { setGeom(node.id, { y: value }); commitHistory(); }} />
        </div>
      </section>

      {/* Size */}
      <section>
        <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Size</div>
        <div className="grid grid-cols-2 gap-2">
          <GeometryInput label="W" value={multi ? bounds.w : node.w} min={1} disabled={multi || isTextNode} onCommit={(value) => { setGeom(node.id, { w: value }); commitHistory(); }} />
          <GeometryInput label="H" value={multi ? bounds.h : node.h} min={1} disabled={multi || isTextNode} onCommit={(value) => { setGeom(node.id, { h: value }); commitHistory(); }} />
        </div>
        {isTextNode && <p className="mt-1.5 text-[10px] text-zinc-400">Auto-sized from text content and typography.</p>}
        <div className="mt-2">
          <GeometryInput label="Rotation" value={node.rotation ?? 0} wrap disabled={multi} onCommit={(value) => { setGeom(node.id, { rotation: value }); commitHistory(); }} />
        </div>
      </section>

      {/* Align */}
      <section>
        <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Align</div>
        <div className="grid grid-cols-3 grid-rows-3 h-24 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          {(["start", "center", "end"] as const).flatMap((vertical) =>
            (["start", "center", "end"] as const).map((horizontal) => {
              const active = autoHorizontal === horizontal && autoVertical === vertical;
              return (
                <button
                  key={`${horizontal}-${vertical}`}
                  type="button"
                  title={`${horizontal} / ${vertical}`}
                  aria-label={`Align ${horizontal} ${vertical}`}
                  aria-pressed={active}
                  onClick={() => setAutoPosition(horizontal, vertical)}
                  className="group grid place-items-center rounded-lg hover:bg-white"
                >
                  {active ? (
                    <span className={`flex items-center justify-center gap-[2px] text-violet-600 ${autoDirection === "col" ? "flex-col" : ""}`}>
                      <span className={`${autoDirection === "row" ? "h-3 w-[3px]" : "h-[3px] w-3"} rounded-full bg-current`} />
                      <span className={`${autoDirection === "row" ? "h-5 w-[3px]" : "h-[3px] w-5"} rounded-full bg-current`} />
                      <span className={`${autoDirection === "row" ? "h-3 w-[3px]" : "h-[3px] w-3"} rounded-full bg-current`} />
                    </span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-zinc-400 group-hover:bg-zinc-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Auto layout */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400">Auto layout</span>
          {!isTextNode && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={!!node.props.autoLayout} onChange={(e) => set({ autoLayout: e.target.checked })} className="accent-violet-600 w-3 h-3" />
              <span className="text-[11px] text-zinc-500">{node.props.autoLayout ? "On" : "Off"}</span>
            </label>
          )}
        </div>
        {isTextNode ? (
          <div className="space-y-2">
            <p className="text-[11px] leading-relaxed text-zinc-500">Wrap text in a container to add background, stroke, padding, and radius.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => wrapSelectedInFrame(false)} className="text-[11px] border border-zinc-200 rounded-lg px-2 py-1.5 hover:bg-zinc-50">Create frame</button>
              <button onClick={() => wrapSelectedInFrame(true)} className="text-[11px] border border-violet-300 text-violet-700 rounded-lg px-2 py-1.5 hover:bg-violet-50">Add auto layout</button>
            </div>
          </div>
        ) : node.props.autoLayout ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <button onClick={() => set({ direction: "row" })} className={`text-[12px] h-8 px-2 rounded-lg border ${node.props.direction === "row" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-200 hover:bg-zinc-50"}`}>↔ Row</button>
              <button onClick={() => set({ direction: "col" })} className={`text-[12px] h-8 px-2 rounded-lg border ${node.props.direction === "col" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-200 hover:bg-zinc-50"}`}>↕ Col</button>
              <button onClick={() => set({ wrap: !node.props.wrap })} className={`text-[12px] h-8 px-2 rounded-lg border ${node.props.wrap ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-200 hover:bg-zinc-50"}`}>Wrap</button>
            </div>
            <label className="text-[11px]">
              <span className="text-zinc-500">Gap</span>
              <input type="number" value={node.props.gap ?? 0} onChange={(e) => set({ gap: Number(e.target.value) })} className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px]">
                <span className="text-zinc-500">Pad T/B</span>
                <input type="number" value={node.props.padV ?? node.props.pad ?? 0} onChange={(e) => set({ padV: Number(e.target.value) })} className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
              </label>
              <label className="text-[11px]">
                <span className="text-zinc-500">Pad L/R</span>
                <input type="number" value={node.props.padH ?? node.props.pad ?? 0} onChange={(e) => set({ padH: Number(e.target.value) })} className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
              </label>
            </div>
          </div>
        ) : null}
      </section>

      {/* Typography */}
      {textLike && (
        <section>
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Typography</div>
          <div className="space-y-2">
            <input value={node.props.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Text" className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px]">
                <span className="text-zinc-500">Size</span>
                <input type="number" value={node.props.size ?? 14} onChange={(e) => set({ size: Number(e.target.value) })} className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={node.props.color ?? "#18181b"} onChange={(e) => set({ color: e.target.value })} className="w-8 h-8 rounded border border-zinc-200 bg-transparent cursor-pointer" />
              <input value={node.props.color ?? "#18181b"} onChange={(e) => set({ color: e.target.value })} className="flex-1 text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
            </div>
          </div>
        </section>
      )}

      {/* Appearance */}
      <section className="!mt-0 -mx-4 border-t border-zinc-200 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-zinc-900">Appearance</span>
          <div className="flex items-center gap-3 text-zinc-700">
            <button type="button" onClick={() => toggleNodeVisibility(node.id)} title="Hide layer"><EyeIcon /></button>
            <button type="button" onClick={() => !isTextNode && set({ fillVisible: node.props.fillVisible === false })} title="Toggle fill" className={isTextNode ? "opacity-35" : ""}><DropletIcon /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-2 text-[12px]">
            <span className="text-zinc-400">▦</span>
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round((node.props.opacity ?? 1) * 100)}
              onChange={(e) => set({ opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
            <span className="text-zinc-500">%</span>
          </label>
          {!isTextNode ? (
            <label className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-2 text-[12px]">
              <span className="text-zinc-400">⌜</span>
              <input type="number" min={0} value={node.props.radius ?? 0} onChange={(e) => set({ radius: Math.max(0, Number(e.target.value)) })} className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
          ) : <div />}
        </div>
        <label className="mt-2 flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-2 text-[12px]">
          <span className="text-zinc-400">◌</span>
          <span className="text-zinc-500">Blur</span>
          <input type="number" min={0} max={40} value={node.props.blur ?? 0} onChange={(e) => set({ blur: Math.max(0, Math.min(40, Number(e.target.value))) })} className="min-w-0 flex-1 bg-transparent text-right outline-none" />
          <span className="text-zinc-500">px</span>
        </label>
      </section>

      {/* Fill */}
      {!isTextNode && <section className="!mt-0 -mx-4 border-t border-zinc-200 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-zinc-900">Fill</span>
          <div className="flex items-center gap-4 text-zinc-800">
            <button type="button" onClick={() => set({ fillMode: node.props.fillMode === "gradient" ? "solid" : "gradient", fillVisible: true })} title="Toggle solid / gradient"><FourDotsIcon /></button>
            <button type="button" onClick={() => set({ fillVisible: true })} className="text-xl leading-none" title="Add fill">＋</button>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${node.props.fillVisible === false ? "opacity-45" : ""}`}>
          <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg bg-zinc-100">
            <label className="relative ml-2 h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded border border-zinc-300" style={{ background: node.props.fill ?? "#ffffff" }}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(node.props.fill ?? "") ? node.props.fill : "#ffffff"} onChange={(e) => set({ fill: e.target.value, fillVisible: true })} className="absolute inset-0 opacity-0" />
            </label>
            <input
              value={(node.props.fill ?? "#ffffff").replace("#", "").toUpperCase()}
              onChange={(e) => set({ fill: `#${e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6)}`, fillVisible: true })}
              className="min-w-0 flex-1 bg-transparent px-2 text-[12px] font-medium uppercase outline-none"
              aria-label="Fill color"
            />
            <label className="flex h-full items-center border-l border-white px-2 text-[12px]">
              <input type="number" min={0} max={100} value={Math.round((node.props.fillOpacity ?? 1) * 100)} onChange={(e) => set({ fillOpacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })} className="w-8 bg-transparent text-right outline-none" aria-label="Fill opacity" />
              <span className="ml-1 text-zinc-500">%</span>
            </label>
          </div>
          <button type="button" onClick={() => set({ fillVisible: node.props.fillVisible === false })} className="grid h-8 w-8 place-items-center" title="Toggle fill visibility"><EyeIcon hidden={node.props.fillVisible === false} /></button>
          <button type="button" onClick={() => set({ fillVisible: false })} className="grid h-8 w-6 place-items-center text-xl" title="Remove fill">−</button>
        </div>
        {node.props.fillMode === "gradient" && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-1">
              <button onClick={() => set({ gradientType: "linear" })} className={`text-[11px] px-2 py-1 rounded-lg border ${node.props.gradientType !== "radial" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-200 hover:bg-zinc-50"}`}>Linear</button>
              <button onClick={() => set({ gradientType: "radial" })} className={`text-[11px] px-2 py-1 rounded-lg border ${node.props.gradientType === "radial" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-200 hover:bg-zinc-50"}`}>Radial</button>
            </div>
            <input value={node.props.gradientColors?.join(",") ?? (node.props.fill ?? "#ffffff,#00000000")} onChange={(e) => set({ gradientColors: e.target.value.split(",") })} placeholder="#ffffff,#00000000" className="w-full text-[12px] border border-zinc-200 rounded-md px-2 py-1.5" />
            <div className="h-8 rounded-lg border border-zinc-200" style={{ background: `linear-gradient(${node.props.gradientType === "radial" ? "radial(circle, var(--tw-gradient-stops))" : "to right"}, ${(node.props.gradientColors?.length ? node.props.gradientColors : [node.props.fill ?? "#ffffff", "#00000000"]).join(", ")})` }} />
          </div>
        )}
      </section>}

      {/* Stroke */}
      {!isTextNode && <section className="!mt-0 -mx-4 border-t border-zinc-200 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-zinc-900">Stroke</span>
          <div className="flex items-center gap-4 text-zinc-800">
            <FourDotsIcon />
            <button type="button" onClick={() => set({ strokeVisible: true, strokeWidth: node.props.strokeWidth || 1 })} className="text-xl leading-none" title="Add stroke">＋</button>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${node.props.strokeVisible === false ? "opacity-45" : ""}`}>
          <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg bg-zinc-100">
            <label className="relative ml-2 h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded" style={{ background: node.props.strokeColor ?? "#000000" }}>
              <input type="color" value={node.props.strokeColor ?? "#000000"} onChange={(e) => set({ strokeColor: e.target.value, strokeVisible: true, strokeWidth: node.props.strokeWidth || 1 })} className="absolute inset-0 opacity-0" />
            </label>
            <input value={(node.props.strokeColor ?? "#000000").replace("#", "").toUpperCase()} onChange={(e) => set({ strokeColor: `#${e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6)}`, strokeVisible: true })} className="min-w-0 flex-1 bg-transparent px-2 text-[12px] font-medium uppercase outline-none" aria-label="Stroke color" />
            <label className="flex h-full items-center border-l border-white px-2 text-[12px]">
              <input type="number" min={0} max={100} value={Math.round((node.props.strokeOpacity ?? 1) * 100)} onChange={(e) => set({ strokeOpacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })} className="w-8 bg-transparent text-right outline-none" aria-label="Stroke opacity" />
              <span className="ml-1 text-zinc-500">%</span>
            </label>
          </div>
          <button type="button" onClick={() => set({ strokeVisible: node.props.strokeVisible === false, strokeWidth: node.props.strokeWidth || 1 })} className="grid h-8 w-8 place-items-center" title="Toggle stroke visibility"><EyeIcon hidden={node.props.strokeVisible === false} /></button>
          <button type="button" onClick={() => set({ strokeVisible: false })} className="grid h-8 w-6 place-items-center text-xl" title="Remove stroke">−</button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={node.props.strokePosition ?? "inside"} onChange={(e) => set({ strokePosition: e.target.value as "inside" | "center" | "outside" })} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[12px] outline-none">
            <option value="inside">Inside</option>
            <option value="center">Center</option>
            <option value="outside">Outside</option>
          </select>
          <label className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-2 text-[12px]">
            <span className="text-zinc-500">☰</span>
            <input type="number" min={0} max={100} value={node.props.strokeWidth ?? 0} onChange={(e) => set({ strokeWidth: Math.max(0, Math.min(100, Number(e.target.value))), strokeVisible: true })} className="min-w-0 flex-1 bg-transparent outline-none" aria-label="Stroke width" />
          </label>
        </div>
      </section>}

      <section>
        <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Actions</div>
        <div className="flex flex-wrap gap-2">
          {canUngroup && <button onClick={ungroupSelected} className="text-[11px] border border-zinc-200 rounded-lg px-2 py-1 hover:bg-zinc-50">Ungroup</button>}
          {canGroup && <button onClick={() => groupSelected()} className="text-[11px] border border-zinc-200 rounded-lg px-2 py-1 hover:bg-zinc-50">Group</button>}
          <button onClick={duplicateSelected} className="text-[11px] border border-zinc-200 rounded-lg px-2 py-1 hover:bg-zinc-50">Duplicate</button>
          <button onClick={() => toggleNodeLock(node.id)} className="text-[11px] border border-zinc-200 rounded-lg px-2 py-1 hover:bg-zinc-50">{node.locked ? "Unlock" : "Lock"}</button>
          <button onClick={() => deleteNode(node.id)} className="flex items-center gap-1.5 text-[11px] text-rose-600 border border-rose-200 rounded-lg px-2 py-1 hover:bg-rose-50" title="Delete">
            <span className="text-base">🗑️</span>
            Delete
          </button>
        </div>
      </section>
    </aside>
  );
}
