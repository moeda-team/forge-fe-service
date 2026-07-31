"use client";
import { useState, useMemo } from "react";
import { getScreen, useCanvas } from "@/lib/store";
import type { CNode } from "@/lib/types";

export type LayerNode = {
  id: string;
  name: string;
  type: CNode["type"];
  parentId?: string;
  children: LayerNode[];
  selected: boolean;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  editing: boolean;
};

const TYPE_ICON: Record<string, string> = {
  frame: "▭",
  text: "T",
  button: "⬚",
  input: "▭",
  card: "▢",
  row: "▬",
  section: "⬛",
  image: "🖼",
  component: "🔷",
  group: "🔸",
};

function matchesQuery(node: LayerNode, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  return node.children.some((c) => matchesQuery(c, lower));
}

function DisclosureArrow({ expanded, onToggle, hasChildren }: { expanded: boolean; onToggle: () => void; hasChildren: boolean }) {
  if (!hasChildren) return <span className="w-3 h-3 inline-block" />;
  return (
    <button
      onMouseDown={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-3 h-3 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-700"
      aria-label={expanded ? "Collapse" : "Expand"}
      type="button"
    >
      <svg viewBox="0 0 12 12" className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`} width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 2 8 6 4 10" />
      </svg>
    </button>
  );
}

function LayerIcon({ type }: { type: CNode["type"] }) {
  return <span className="w-4 text-center text-[12px] text-violet-700">{TYPE_ICON[type] || "●"}</span>;
}

function LayerLabel({
  name,
  editing,
  onStartEdit,
  onFinish,
}: {
  name: string;
  editing: boolean;
  onStartEdit: () => void;
  onFinish: (text: string) => void;
}) {
  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={name}
        onBlur={(e) => onFinish(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onFinish(e.currentTarget.value);
          if (e.key === "Escape") onFinish(name);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full bg-transparent outline-none text-[13px]"
      />
    );
  }
  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit();
      }}
      className="truncate block text-[13px]"
      title={name}
    >
      {name}
    </span>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3l18 18M9.5 9.5A3.002 3.002 0 0 0 12 15a3.002 3.002 0 0 0 2.5-5.5M6 6l12 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.5-1" />
    </svg>
  );
}

function LayerItem({
  node,
  depth,
  onSelect,
  onToggleExpand,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onReorder,
}: {
  node: LayerNode;
  depth: number;
  onSelect: (id: string, additive: boolean, range: boolean) => void;
  onToggleExpand: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, targetId: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`select-none ${node.visible ? "" : "opacity-50"}`}>
      <div
        tabIndex={-1}
        draggable={!node.locked}
        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", node.id); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onReorder(e.dataTransfer.getData("text/plain"), node.id); }}
        className={`group flex items-center gap-1 rounded-md py-1.5 pr-2 ${node.selected ? "bg-violet-100" : "hover:bg-zinc-100"}`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(node.id, e.ctrlKey || e.metaKey, e.shiftKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (node.locked) return;
          setEditing(true);
        }}
      >
        <span className="text-zinc-300 cursor-grab" title="Drag to reorder">⠿</span>
        <DisclosureArrow expanded={node.expanded} hasChildren={node.children.length > 0} onToggle={() => onToggleExpand(node.id)} />
        <LayerIcon type={node.type} />
        <div className="flex-1 min-w-0">
          <LayerLabel name={node.name} editing={editing} onStartEdit={() => setEditing(true)} onFinish={(text) => { setEditing(false); onRename(node.id, text); }} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0">
          <button onMouseDown={(e) => { e.stopPropagation(); onToggleVisibility(node.id); }} className="px-1 text-zinc-400 hover:text-zinc-700" aria-label={node.visible ? "Hide" : "Show"} title={node.visible ? "Hide" : "Show"} type="button">
            {node.visible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
          <button onMouseDown={(e) => { e.stopPropagation(); onToggleLock(node.id); }} className="px-1 text-zinc-400 hover:text-zinc-700" aria-label={node.locked ? "Unlock" : "Lock"} title={node.locked ? "Unlock" : "Lock"} type="button">
            {node.locked ? <LockIcon /> : <UnlockIcon />}
          </button>
          <button onMouseDown={(e) => { e.stopPropagation(); onDelete(node.id); }} className="px-1 text-zinc-400 hover:text-rose-600" aria-label="Delete" title="Delete" type="button">🗑</button>
        </div>
      </div>
      {node.expanded && node.children.length > 0 && (
        <div>
          {node.children.map((c) => (
            <LayerItem key={c.id} node={c} depth={depth + 1} onSelect={onSelect} onToggleExpand={onToggleExpand} onRename={onRename} onToggleVisibility={onToggleVisibility} onToggleLock={onToggleLock} onDelete={onDelete} onReorder={onReorder} />
          ))}
        </div>
      )}
    </div>
  );
}

function LayerTree({ nodes, onSelect, onToggleExpand, onRename, onToggleVisibility, onToggleLock, onDelete, onReorder, query }: { nodes: LayerNode[]; onSelect: (id: string, additive: boolean, range: boolean) => void; onToggleExpand: (id: string) => void; onRename: (id: string, name: string) => void; onToggleVisibility: (id: string) => void; onToggleLock: (id: string) => void; onDelete: (id: string) => void; onReorder: (id: string, targetId: string) => void; query: string }) {
  const visibleItems = useMemo(() => nodes.filter((n) => matchesQuery(n, query)), [nodes, query]);
  return (
    <div>
      {visibleItems.map((n) => (
        <LayerItem key={n.id} node={n} depth={0} onSelect={onSelect} onToggleExpand={onToggleExpand} onRename={onRename} onToggleVisibility={onToggleVisibility} onToggleLock={onToggleLock} onDelete={onDelete} onReorder={onReorder} />
      ))}
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-3 pt-3 pb-2">
      <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-2 bg-white">
        <span className="text-zinc-400 text-xs">🔍</span>
        <input placeholder="Search layers..." className="w-full bg-transparent outline-none text-[12px]" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function mapToLayerNodes(screenName: string, nodes: CNode[], selIds: string[]): LayerNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name ?? n.props.text ?? n.type,
    type: n.type,
    parentId: n.parentId,
    children: n.children ? mapToLayerNodes(screenName, n.children, selIds) : [],
    selected: selIds.includes(n.id),
    expanded: n.expanded !== false,
    visible: n.visible !== false,
    locked: !!n.locked,
    editing: false,
  }));
}

export default function LayersPanel({ screenName, onBack, palette, onAddNode }: { screenName: string; onBack?: () => void; palette?: { type: string; label: string; icon: string }[]; onAddNode?: (type: string) => void }) {
  const setSel = useCanvas((s) => s.setSel);
  const toggleNodeExpand = useCanvas((s) => s.toggleNodeExpand);
  const renameNode = useCanvas((s) => s.renameNode);
  const toggleNodeVisibility = useCanvas((s) => s.toggleNodeVisibility);
  const toggleNodeLock = useCanvas((s) => s.toggleNodeLock);
  const deleteNode = useCanvas((s) => s.deleteNode);
  const reorderNodeTo = useCanvas((s) => s.reorderNodeTo);
  const canvas = useCanvas((s) => s.canvas);
  const [query, setQuery] = useState("");

  const screen = getScreen(screenName);
  const layerNodes: LayerNode[] = useMemo(() => (screen ? mapToLayerNodes(screenName, screen.nodes, canvas.selIds) : []), [screenName, screen, canvas.selIds]);

  if (!screen) return null;

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 h-11 border-b border-zinc-200 shrink-0">
        <span className="text-[12px] font-semibold text-zinc-800">Layers</span>
        <div className="flex items-center gap-1">
          {onBack && (
            <button onClick={onBack} className="text-[11px] border border-zinc-200 rounded-md px-2 py-1 hover:bg-zinc-50" title="Back">
              ←
            </button>
          )}
        </div>
      </div>

      {palette && palette.length > 0 && (
        <div className="p-3 border-b border-zinc-200">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-2">Add component</div>
          <div className="grid grid-cols-2 gap-1.5">
            {palette.map((p) => (
              <button key={p.type} onClick={() => onAddNode?.(p.type)} className="text-[12px] border border-zinc-200 rounded-lg px-2 py-1.5 hover:bg-zinc-50 flex items-center gap-1.5">
                <span className="text-violet-600">{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <SearchBar value={query} onChange={setQuery} />

      <div className="flex-1 overflow-auto p-1">
        <LayerTree
          nodes={layerNodes}
          onSelect={(id, additive, range) => setSel(id, additive, range)}
          onToggleExpand={(id) => toggleNodeExpand(id)}
          onRename={(id, name) => renameNode(id, name)}
          onToggleVisibility={(id) => toggleNodeVisibility(id)}
          onToggleLock={(id) => toggleNodeLock(id)}
          onDelete={(id) => deleteNode(id)}
          onReorder={(id, targetId) => reorderNodeTo(id, targetId)}
          query={query}
        />
      </div>

      <div className="p-2 border-t border-zinc-200 text-[10px] text-zinc-400 text-center">Scroll to pan · ⌘/Ctrl+scroll to zoom</div>
    </aside>
  );
}
