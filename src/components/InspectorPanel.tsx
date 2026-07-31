"use client";
import { useState } from "react";
import { useCanvas } from "@/lib/store";

export default function InspectorPanel() {
  const setCanvasBg = useCanvas((s) => s.setCanvasBg);
  const setCanvasBgOpacity = useCanvas((s) => s.setCanvasBgOpacity);
  const toggleCanvasBg = useCanvas((s) => s.toggleCanvasBg);
  const canvasBg = useCanvas((s) => s.canvas.canvasBg);
  const canvasBgOpacity = useCanvas((s) => s.canvas.canvasBgOpacity);
  const showCanvasBg = useCanvas((s) => s.canvas.showCanvasBg);
  const [draft, setDraft] = useState({ color: canvasBg, value: canvasBg.toUpperCase() });
  const hexDraft = draft.color === canvasBg ? draft.value : canvasBg.toUpperCase();
  const setHexDraft = (value: string) => setDraft({ color: canvasBg, value });

  const commitHex = () => {
    const normalized = hexDraft.startsWith("#") ? hexDraft : `#${hexDraft}`;
    if (/^#[0-9a-f]{6}$/i.test(normalized)) setCanvasBg(normalized.toLowerCase());
    else setDraft({ color: canvasBg, value: canvasBg.toUpperCase() });
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-zinc-100 shrink-0">
        <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Page</span>
        <span className="text-zinc-400">⊞</span>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-5">
        {/* Background */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold">Canvas background</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showCanvasBg}
                onChange={toggleCanvasBg}
                className="accent-violet-600 w-3 h-3"
              />
              <span className="text-[11px] text-zinc-500">Show</span>
            </label>
          </div>

          <div className="flex items-center gap-2 border border-zinc-200 rounded-lg p-2">
            <input
              type="color"
              value={canvasBg}
              onChange={(e) => setCanvasBg(e.target.value)}
              className="w-8 h-8 rounded border border-zinc-200 bg-transparent cursor-pointer"
            />
            <input
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="flex-1 text-[12px] border border-zinc-200 rounded-md px-2 py-1.5 uppercase"
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Opacity</span>
            <span>{Math.round(canvasBgOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(canvasBgOpacity * 100)}
            onChange={(e) => setCanvasBgOpacity(Number(e.target.value) / 100)}
            className="w-full mt-1 accent-violet-600"
          />
        </section>
      </div>
    </aside>
  );
}
