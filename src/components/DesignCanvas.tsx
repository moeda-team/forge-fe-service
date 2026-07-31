"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useCanvas, getScreen, findNodeById, SCREENS, useStore } from "@/lib/store";
import type { CNode } from "@/lib/types";
import LayersPanel from "./LayersPanel";
import InspectorPanel from "./InspectorPanel";
import SelectedNodeInspector from "./SelectedNodeInspector";
import EditableText from "./EditableText";

type ToolKey = "move" | "hand" | "text" | "rect" | "ellipse" | "frame";
type FramePresetKey = "desktop" | "tablet" | "mobile";
const ZOOM_STEP = 1.25;
const TRACKPAD_ZOOM_SENSITIVITY = 0.004;
const FRAME_PRESETS: { key: FramePresetKey; label: string; w: number; h: number }[] = [
  { key: "desktop", label: "Desktop", w: 1440, h: 1024 },
  { key: "tablet", label: "Tablet", w: 768, h: 1024 },
  { key: "mobile", label: "Mobile", w: 390, h: 844 },
];
const TOOLBAR_ITEMS: { key: ToolKey; label: string; icon: string; shortcut?: string }[] = [
  { key: "move", label: "Move", icon: "", shortcut: "V" },
  { key: "hand", label: "Hand", icon: "✋", shortcut: "H" },
  { key: "rect", label: "Rectangle", icon: "", shortcut: "R" },
  { key: "ellipse", label: "Ellipse", icon: "○", shortcut: "O" },
  { key: "text", label: "Text", icon: "T", shortcut: "T" },
  { key: "frame", label: "Frame", icon: "", shortcut: "F" },
];

function NavigationArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.45 3.72 20.18 10.2a1.42 1.42 0 0 1-.1 2.66l-6.19 1.82-2.25 6.08a1.42 1.42 0 0 1-2.66.03L3.08 5.58a1.42 1.42 0 0 1 1.37-1.86Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RectangleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function CardsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h10a2 2 0 0 1 2 2v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

type SelectionLocation = { node: CNode; x: number; y: number };

function collectSelectionLocations(nodes: CNode[], selectedIds: Set<string>, baseX = 0, baseY = 0): SelectionLocation[] {
  const locations: SelectionLocation[] = [];
  nodes.forEach((node) => {
    const x = baseX + node.x;
    const y = baseY + node.y;
    if (selectedIds.has(node.id) && node.visible !== false) locations.push({ node, x, y });
    if (node.children?.length) locations.push(...collectSelectionLocations(node.children, selectedIds, x, y));
  });
  return locations;
}

function ToolGlyph({ tool, size = 16 }: { tool: (typeof TOOLBAR_ITEMS)[number]; size?: number }) {
  if (tool.key === "move") return <NavigationArrowIcon size={size} />;
  if (tool.key === "rect") return <RectangleIcon size={size} />;
  if (tool.key === "frame") return <CardsIcon size={size} />;
  return <span style={{ fontSize: size }}>{tool.icon}</span>;
}

function colorWithOpacity(color: string, opacity = 1) {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match || opacity >= 1) return color;
  const value = Number.parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${Math.max(0, Math.min(1, opacity))})`;
}

function OverflowBtn({ label, icon, items }: { label: string; icon: React.ReactNode; items: { key: string; label: string; icon: React.ReactNode; shortcut?: string; action: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!ref.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={label} aria-expanded={open} type="button" className="group relative w-10 h-10 flex items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100">
        {icon}
        <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {label}
        </span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 rounded-xl shadow-2xl py-1 w-48 z-50">
          {items.map((it) => (
            <button key={it.key} onMouseDown={(e) => { e.preventDefault(); it.action(); setOpen(false); }} className="w-full flex items-center gap-2 text-left text-[12px] px-3 py-1.5 hover:bg-zinc-50">
              <span className="w-4 h-4 flex items-center justify-center text-zinc-500">{it.icon}</span>
              <span className="flex-1 text-zinc-700">{it.label}</span>
              {it.shortcut && <span className="text-[10px] text-zinc-400 tabular-nums">{it.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesignCanvas({ onBack }: { onBack?: () => void } = {}) {
  const canvas = useCanvas((s) => s.canvas);
  const setPan = useCanvas((s) => s.setPan);
  const setCanvasScreen = useCanvas((s) => s.setCanvasScreen);
  const setZoomPan = useCanvas((s) => s.setZoomPan);
  const setSel = useCanvas((s) => s.setSel);
  const clearSel = useCanvas((s) => s.clearSel);
  const addNode = useCanvas((s) => s.addNode);
  const addShape = useCanvas((s) => s.addShape);
  const autoParentNode = useCanvas((s) => s.autoParentNode);
  const deleteNode = useCanvas((s) => s.deleteNode);
  const updateNode = useCanvas((s) => s.updateNode);
  const updateTextContent = useCanvas((s) => s.updateTextContent);
  const setGeom = useCanvas((s) => s.setGeom);
  const toggleAlignmentGrid = useCanvas((s) => s.toggleAlignmentGrid);
  const toggleRulers = useCanvas((s) => s.toggleRulers);
  const toggleMinimap = useCanvas((s) => s.toggleMinimap);
  const autoLayoutSelected = useCanvas((s) => s.autoLayoutSelected);
  const selectAllEligible = useCanvas((s) => s.selectAllEligible);
  const copySelected = useCanvas((s) => s.copySelected);
  const cutSelected = useCanvas((s) => s.cutSelected);
  const pasteClipboard = useCanvas((s) => s.pasteClipboard);
  const importFigmaClipboard = useCanvas((s) => s.importFigmaClipboard);
  const duplicateSelected = useCanvas((s) => s.duplicateSelected);
  const commitHistory = useCanvas((s) => s.commitHistory);
  const addGuide = useCanvas((s) => s.addGuide);
  const updateGuide = useCanvas((s) => s.updateGuide);
  const deleteGuide = useCanvas((s) => s.deleteGuide);
  const toggleNodeLock = useCanvas((s) => s.toggleNodeLock);
  const undo = useCanvas((s) => s.undo);
  const redo = useCanvas((s) => s.redo);
  const activeTool = useCanvas((s) => s.activeTool);
  const setActiveTool = useCanvas((s) => s.setActiveTool);
  const currentProjectId = useStore((s) => s.currentId);
  const activeToolLabel = TOOLBAR_ITEMS.find((tool) => tool.key === activeTool)?.label ?? "Move";

  const screen = getScreen(canvas.screen)!;
  const availableScreens = SCREENS.filter((item) => !item.projectId || item.projectId === currentProjectId);
  const selectionLocations = collectSelectionLocations(screen.nodes, new Set(canvas.selIds));
  const zoom = canvas.zoom;
  const pan = canvas.pan;
  const [aiCard, setAiCard] = useState<{ x: number; y: number; nid: string | null } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [framePreset, setFramePreset] = useState<FramePresetKey | null>(null);
  const [framePresetOpen, setFramePresetOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const dragNode = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean; textClick?: boolean } | null>(null);
  const resizing = useRef<{ id: string; handle: string; ox: number; oy: number; ow: number; oh: number; sx: number; sy: number } | null>(null);
  const panning = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const creating = useRef<{ id: string; x: number; y: number; tool: "frame" | "rect" | "ellipse" } | null>(null);
  const draggingGuide = useRef<{ id: string; orientation: "horizontal" | "vertical"; isNew?: boolean } | null>(null);
  const pendingTextEdit = useRef<string | null>(null);
  const marquee = useRef<{ sx: number; sy: number; cx: number; cy: number; additive: boolean } | null>(null);
  const preferInternalPaste = useRef(false);
  const previousTool = useRef<ToolKey>("move");
  const initialProjectScreenResolved = useRef(false);

  const selectTool = useCallback((tool: ToolKey) => {
    setActiveTool(tool);
    if (tool === "frame") {
      setFramePreset(null);
      setFramePresetOpen(true);
    } else {
      setFramePresetOpen(false);
    }
  }, [setActiveTool]);

  const selectFramePreset = useCallback((preset: FramePresetKey) => {
    setFramePreset(preset);
    setFramePresetOpen(false);
    setActiveTool("frame");
    vpRef.current?.focus();
  }, [setActiveTool]);

  useEffect(() => {
    if (initialProjectScreenResolved.current) return;
    initialProjectScreenResolved.current = true;
    if (currentProjectId === "ATL" && canvas.screen === "Dashboard") {
      setCanvasScreen("Atlas Design");
    }
  }, [canvas.screen, currentProjectId, setCanvasScreen]);

  useEffect(() => {
    if (!availableScreens.some((item) => item.name === canvas.screen)) {
      setCanvasScreen(availableScreens[0]?.name ?? "Dashboard");
    }
  }, [availableScreens, canvas.screen, setCanvasScreen]);

  useEffect(() => {
    const vp = vpRef.current; if (!vp) return;
    vp.focus();
    const rect = vp.getBoundingClientRect();
    const pad = 48;
    const zw = (rect.width - pad) / screen.w;
    const zh = (rect.height - pad) / screen.h;
    const z = Math.min(zw, zh, 1.2);
    setZoomPan(z, { x: (rect.width - screen.w * z) / 2, y: (rect.height - screen.h * z) / 2 });
  }, [screen.w, screen.h, setZoomPan]);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const onCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!(e.ctrlKey || e.metaKey)) {
        const current = useCanvas.getState().canvas;
        const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? vp.clientHeight : 1;
        const dx = e.shiftKey && Math.abs(e.deltaX) < Math.abs(e.deltaY) ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && Math.abs(e.deltaX) < Math.abs(e.deltaY) ? 0 : e.deltaY;
        useCanvas.getState().setPan({
          x: current.pan.x - dx * unit,
          y: current.pan.y - dy * unit,
        });
        return;
      }
      const rect = vp.getBoundingClientRect();
      const current = useCanvas.getState().canvas;
      const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const world = {
        x: (cursor.x - current.pan.x) / current.zoom,
        y: (cursor.y - current.pan.y) / current.zoom,
      };
      const nextZoom = Math.max(0.25, Math.min(32, current.zoom * Math.exp(-e.deltaY * TRACKPAD_ZOOM_SENSITIVITY)));
      useCanvas.getState().setZoomPan(nextZoom, {
        x: cursor.x - world.x * nextZoom,
        y: cursor.y - world.y * nextZoom,
      });
    };
    vp.addEventListener("wheel", onCanvasWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onCanvasWheel);
  }, []);

  const zoomFromCenter = useCallback((nextZoom: number) => {
    const vp = vpRef.current?.getBoundingClientRect(); if (!vp) return;
    const current = useCanvas.getState().canvas;
    const clamped = Math.max(0.25, Math.min(32, nextZoom));
    const center = { x: vp.width / 2, y: vp.height / 2 };
    const world = {
      x: (center.x - current.pan.x) / current.zoom,
      y: (center.y - current.pan.y) / current.zoom,
    };
    setZoomPan(clamped, {
      x: center.x - world.x * clamped,
      y: center.y - world.y * clamped,
    });
  }, [setZoomPan]);

  const startCreating = (e: React.MouseEvent) => {
    if (activeTool !== "frame" && activeTool !== "rect" && activeTool !== "ellipse" && activeTool !== "text") return false;
    if (activeTool === "frame" && !framePreset) {
      setFramePresetOpen(true);
      return true;
    }
    const vp = vpRef.current!.getBoundingClientRect();
    const x = (e.clientX - vp.left - pan.x) / zoom;
    const y = (e.clientY - vp.top - pan.y) / zoom;
    if (activeTool === "text") {
      e.preventDefault();
      addNode("text", { x, y });
      const id = useCanvas.getState().canvas.selIds[0];
      if (id) pendingTextEdit.current = id;
      setActiveTool("move");
      return true;
    }
    if (activeTool === "frame") addNode("frame", { x, y, w: 1, h: 1 });
    else addShape(activeTool, { x, y, w: 1, h: 1 });
    const id = useCanvas.getState().canvas.selIds[0];
    const created = id ? findNodeById(screen, id) : undefined;
    if (id && created) {
      creating.current = { id, x: created.x, y: created.y, tool: activeTool };
      resizing.current = { id, handle: "se", ox: created.x, oy: created.y, ow: 1, oh: 1, sx: e.clientX - vp.left, sy: e.clientY - vp.top };
    }
    return true;
  };

  const onNodeDown = (e: React.MouseEvent, n: CNode) => {
    if (n.type === "text") {
      e.stopPropagation();
      e.preventDefault();
      if (n.visible === false || n.locked) return;
      if (activeTool === "move" && editingId !== n.id && canvas.selIds.includes(n.id)) {
        vpRef.current?.focus();
        const vp = vpRef.current!.getBoundingClientRect();
        dragNode.current = { id: n.id, ox: n.x, oy: n.y, sx: e.clientX - vp.left, sy: e.clientY - vp.top, moved: false, textClick: true };
        return;
      }
      setSel(n.id, e.ctrlKey || e.metaKey, e.shiftKey);
      if (editingId !== n.id) pendingTextEdit.current = n.id;
      return;
    }
    if (startCreating(e)) {
      e.stopPropagation();
      vpRef.current?.focus();
      return;
    }
    if (n.visible === false || n.locked || editingId) return;
    e.stopPropagation();
    vpRef.current?.focus();
    setSel(n.id, e.ctrlKey || e.metaKey, e.shiftKey);
    const vp = vpRef.current!.getBoundingClientRect();
    dragNode.current = { id: n.id, ox: n.x, oy: n.y, sx: e.clientX - vp.left, sy: e.clientY - vp.top, moved: false };
  };
  const onNodeDblClick = (n: CNode) => {
    const isText = n.type === "text" || n.type === "button" || n.type === "card" || n.type === "row" || n.type === "section" || n.type === "input";
    if (isText) setEditingId(n.id);
  };
  const onResizeStart = (e: React.MouseEvent, n: CNode, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const vp = vpRef.current!.getBoundingClientRect();
    resizing.current = { id: n.id, handle, ox: n.x, oy: n.y, ow: n.w, oh: n.h, sx: e.clientX - vp.left, sy: e.clientY - vp.top };
  };
  const onVpMove = (e: React.MouseEvent) => {
    const vp = vpRef.current!.getBoundingClientRect();
    if (draggingGuide.current) {
      const position = draggingGuide.current.orientation === "vertical"
        ? (e.clientX - vp.left - pan.x) / zoom
        : (e.clientY - vp.top - pan.y) / zoom;
      updateGuide(draggingGuide.current.id, position);
    } else if (dragNode.current) {
      const screenDx = e.clientX - vp.left - dragNode.current.sx;
      const screenDy = e.clientY - vp.top - dragNode.current.sy;
      if (!dragNode.current.moved && Math.hypot(screenDx, screenDy) < 3) return;
      dragNode.current.moved = true;
      const nx = dragNode.current.ox + screenDx / zoom;
      const ny = dragNode.current.oy + screenDy / zoom;
      setGeom(dragNode.current.id, { x: nx, y: ny });
    } else if (resizing.current) {
      const dx = (e.clientX - vp.left - resizing.current.sx) / zoom;
      const dy = (e.clientY - vp.top - resizing.current.sy) / zoom;
      const { id, handle, ox, oy, ow, oh } = resizing.current;
      let x = ox, y = oy, w = ow, h = oh;
      if (handle.includes("e")) w = Math.max(1, ow + dx);
      if (handle.includes("s")) h = Math.max(1, oh + dy);
      if (handle.includes("w")) { w = Math.max(1, ow - dx); x = ox + ow - w; }
      if (handle.includes("n")) { h = Math.max(1, oh - dy); y = oy + oh - h; }
      setGeom(id, { x, y, w, h });
    } else if (panning.current) {
      setPan({ x: panning.current.px + (e.clientX - panning.current.sx), y: panning.current.py + (e.clientY - panning.current.sy) });
    } else if (marquee.current) {
      const vp = vpRef.current!.getBoundingClientRect();
      marquee.current.cx = e.clientX - vp.left;
      marquee.current.cy = e.clientY - vp.top;
      const left = Math.min(marquee.current.sx, marquee.current.cx);
      const top = Math.min(marquee.current.sy, marquee.current.cy);
      setSelectionBox({
        left,
        top,
        width: Math.abs(marquee.current.cx - marquee.current.sx),
        height: Math.abs(marquee.current.cy - marquee.current.sy),
      });
    }
  };
  const onVpDown = (e: React.MouseEvent) => {
    if (e.target !== vpRef.current && !(e.target as HTMLElement).dataset.vp) return;
    vpRef.current?.focus();
    if (activeTool === "frame" || activeTool === "rect" || activeTool === "ellipse") {
      startCreating(e);
      return;
    }
    if (activeTool === "text") {
      startCreating(e);
      return;
    }
    if (activeTool === "hand") {
      if (!(e.ctrlKey || e.metaKey)) clearSel();
      panning.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (activeTool === "move") {
      e.preventDefault();
      const vp = vpRef.current!.getBoundingClientRect();
      const point = { x: e.clientX - vp.left, y: e.clientY - vp.top };
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      if (!additive) clearSel();
      marquee.current = { sx: point.x, sy: point.y, cx: point.x, cy: point.y, additive };
      setSelectionBox({ left: point.x, top: point.y, width: 0, height: 0 });
      return;
    }
    if (!(e.ctrlKey || e.metaKey)) clearSel();
  };

  const insertImageSource = useCallback((src: string, name: string, point: { x: number; y: number }, index = 0) => {
    const commit = (naturalWidth = 320, naturalHeight = 240) => {
      const maxWidth = 480;
      const maxHeight = 360;
      const safeWidth = Math.max(1, naturalWidth);
      const safeHeight = Math.max(1, naturalHeight);
      const scale = Math.min(1, maxWidth / safeWidth, maxHeight / safeHeight);
      const w = Math.max(40, Math.round(safeWidth * scale));
      const h = Math.max(40, Math.round(safeHeight * scale));
      const offset = index * 24;
      addNode("image", { x: point.x + offset, y: point.y + offset, w, h });
      const id = useCanvas.getState().canvas.selIds[0];
      if (id) updateNode(id, { src, text: name, objectFit: "cover", imageScale: 1 });
      setActiveTool("move");
    };
    const probe = new window.Image();
    probe.onload = () => commit(probe.naturalWidth, probe.naturalHeight);
    probe.onerror = () => commit();
    probe.src = src;
  }, [addNode, setActiveTool, updateNode]);

  const readImageFile = useCallback((file: File, point: { x: number; y: number }, index = 0) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") insertImageSource(reader.result, file.name || "Image", point, index);
    };
    reader.readAsDataURL(file);
  }, [insertImageSource]);

  const onCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const vp = vpRef.current?.getBoundingClientRect();
    if (!vp) return;
    const current = useCanvas.getState().canvas;
    const dropPoint = {
      x: (e.clientX - vp.left - current.pan.x) / current.zoom,
      y: (e.clientY - vp.top - current.pan.y) / current.zoom,
    };
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length) {
      files.forEach((file, index) => readImageFile(file, dropPoint, index));
      return;
    }

    const imageUrl = e.dataTransfer.getData("text/uri-list").split("\n").find((line) => line && !line.startsWith("#"))
      || e.dataTransfer.getData("text/plain");
    if (/^(https?:|data:image\/|blob:)/i.test(imageUrl)) insertImageSource(imageUrl, "Image", dropPoint);
  };

  useEffect(() => {
    const onWindowBlur = () => { preferInternalPaste.current = false; };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") preferInternalPaste.current = false;
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const clipboard = e.clipboardData;
      if (!clipboard) return;
      const internal = useCanvas.getState().canvas.clipboard;
      if (preferInternalPaste.current && internal?.length) {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      const vp = vpRef.current?.getBoundingClientRect();
      if (!vp) return;
      const current = useCanvas.getState().canvas;
      const point = {
        x: (vp.width / 2 - current.pan.x) / current.zoom,
        y: (vp.height / 2 - current.pan.y) / current.zoom,
      };
      const plain = clipboard.getData("text/plain");
      const figmaPrefix = "FORGE_FIGMA_JSON:";
      if (plain.startsWith(figmaPrefix)) {
        try {
          const payload = JSON.parse(plain.slice(figmaPrefix.length));
          if (importFigmaClipboard(payload, point)) {
            e.preventDefault();
            preferInternalPaste.current = false;
            return;
          }
        } catch {
          // Let the regular image/SVG clipboard fallbacks handle malformed data.
        }
      }
      const imageFiles = Array.from(clipboard.items)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => !!file);
      if (imageFiles.length) {
        e.preventDefault();
        imageFiles.forEach((file, index) => readImageFile(file, point, index));
        return;
      }
      const html = clipboard.getData("text/html");
      const documentFragment = html ? new DOMParser().parseFromString(html, "text/html") : null;
      const svg = documentFragment?.querySelector("svg")?.outerHTML || (/^\s*<svg[\s>]/i.test(plain) ? plain : "");
      if (svg) {
        e.preventDefault();
        insertImageSource(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, "Figma selection", point);
        return;
      }
      const htmlImage = documentFragment?.querySelector("img")?.getAttribute("src");
      if (htmlImage && /^(https?:|data:image\/|blob:)/i.test(htmlImage)) {
        e.preventDefault();
        insertImageSource(htmlImage, "Figma selection", point);
        return;
      }
      if (internal?.length) {
        e.preventDefault();
        pasteClipboard();
      }
    };
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("paste", onPaste);
    };
  }, [importFigmaClipboard, insertImageSource, pasteClipboard, readImageFile]);

  useEffect(() => {
    const up = () => {
      if (creating.current) {
        const completedTool = creating.current.tool;
        const node = findNodeById(screen, creating.current.id);
        if (node && node.w < 5 && node.h < 5) {
          const preset = creating.current.tool === "frame"
            ? FRAME_PRESETS.find((item) => item.key === framePreset)
            : undefined;
          const w = preset?.w ?? (creating.current.tool === "frame" ? 360 : 200);
          const h = preset?.h ?? (creating.current.tool === "frame" ? 640 : 120);
          if (preset) {
            node.name = preset.label;
            node.props.name = preset.label;
          }
          setGeom(node.id, { x: creating.current.x - w / 2, y: creating.current.y - h / 2, w, h });
        }
        commitHistory(true, "ADD_FRAME", [creating.current.id]);
        if (completedTool === "frame" || completedTool === "rect" || completedTool === "ellipse") {
          setActiveTool("move");
          if (completedTool === "frame") setFramePreset(null);
        }
      } else if (dragNode.current || resizing.current) {
        const active = dragNode.current?.id ?? resizing.current?.id;
        if (dragNode.current?.textClick && !dragNode.current.moved && active) {
          pendingTextEdit.current = active;
        } else {
          if (active) autoParentNode(active);
          commitHistory(false, dragNode.current ? "MOVE_FRAMES" : "UPDATE_FRAME", active ? [active] : []);
        }
      } else if (draggingGuide.current) {
        commitHistory(!!draggingGuide.current.isNew, "SET_GUIDE", [draggingGuide.current.id]);
      }
      if (marquee.current) {
        const current = useCanvas.getState().canvas;
        const left = Math.min(marquee.current.sx, marquee.current.cx);
        const top = Math.min(marquee.current.sy, marquee.current.cy);
        const right = Math.max(marquee.current.sx, marquee.current.cx);
        const bottom = Math.max(marquee.current.sy, marquee.current.cy);
        if (right - left >= 3 || bottom - top >= 3) {
          const world = {
            left: (left - current.pan.x) / current.zoom,
            top: (top - current.pan.y) / current.zoom,
            right: (right - current.pan.x) / current.zoom,
            bottom: (bottom - current.pan.y) / current.zoom,
          };
          const ids = screen.nodes
            .filter((node) => node.visible !== false && !node.locked)
            .filter((node) => node.x < world.right && node.x + node.w > world.left && node.y < world.bottom && node.y + node.h > world.top)
            .map((node) => node.id);
          if (!marquee.current.additive) clearSel();
          const selected = new Set(useCanvas.getState().canvas.selIds);
          ids.forEach((id) => {
            if (!selected.has(id)) {
              setSel(id, true);
              selected.add(id);
            }
          });
        }
      }
      dragNode.current = null;
      resizing.current = null;
      panning.current = null;
      draggingGuide.current = null;
      creating.current = null;
      marquee.current = null;
      setSelectionBox(null);
      const textId = pendingTextEdit.current;
      pendingTextEdit.current = null;
      if (textId) setEditingId(textId);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [autoParentNode, clearSel, commitHistory, framePreset, screen, setActiveTool, setGeom, setSel]);

  useEffect(() => {
    if (!editingId) return;
    const focusEditor = () => {
      const editor = vpRef.current?.querySelector("textarea");
      if (!editor) return;
      editor.focus({ preventScroll: true });
      const end = editor.value.length;
      editor.setSelectionRange(end, end);
    };
    focusEditor();
    const frame = window.requestAnimationFrame(focusEditor);
    return () => window.cancelAnimationFrame(frame);
  }, [editingId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current) return;
      if (e.key === "Escape" && editingId) {
        e.preventDefault();
        setEditingId(null);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (editingId && !mod && !e.altKey) {
        const textNode = findNodeById(screen, editingId);
        if (textNode?.type === "text") {
          if (e.key.length === 1) {
            e.preventDefault();
            updateTextContent(editingId, (textNode.props.text ?? "") + e.key);
            return;
          }
          if (e.key === "Backspace") {
            e.preventDefault();
            updateTextContent(editingId, (textNode.props.text ?? "").slice(0, -1));
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            updateNode(editingId, { text: textNode.props.text ?? "" });
            setEditingId(null);
            setActiveTool("move");
            return;
          }
        }
      }
      if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); zoomFromCenter(useCanvas.getState().canvas.zoom * ZOOM_STEP); return; }
      if (mod && e.key === "-") { e.preventDefault(); zoomFromCenter(useCanvas.getState().canvas.zoom / ZOOM_STEP); return; }
      if (mod && e.key === "0") { e.preventDefault(); zoomFromCenter(1); return; }
      if (key === "z" && mod && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((key === "z" && mod && e.shiftKey) || (key === "y" && mod)) { e.preventDefault(); redo(); return; }
      if (mod && key === "a") {
        e.preventDefault();
        selectAllEligible();
        return;
      }
      if (!mod && e.shiftKey && key === "a") {
        e.preventDefault();
        autoLayoutSelected();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (canvas.selIds.length) { e.preventDefault(); canvas.selIds.forEach((id) => deleteNode(id)); }
        return;
      }
      if (!mod && e.shiftKey && key === "r") { e.preventDefault(); toggleRulers(); return; }
      if (!mod && !e.shiftKey && key === "f") { e.preventDefault(); selectTool("frame"); return; }
      if (!mod && !e.shiftKey && key === "r") { e.preventDefault(); setActiveTool("rect"); return; }
      if (!mod && !e.shiftKey && key === "o") { e.preventDefault(); setActiveTool("ellipse"); return; }
      if (!mod && !e.shiftKey && key === "t") { e.preventDefault(); setActiveTool("text"); return; }
      if (!mod && !e.shiftKey && key === "v") { e.preventDefault(); setActiveTool("move"); return; }
      if (!mod && !e.shiftKey && key === "h") { e.preventDefault(); setActiveTool("hand"); return; }
      if (mod && key === "c") { e.preventDefault(); preferInternalPaste.current = true; copySelected(); return; }
      if (mod && key === "x") { e.preventDefault(); preferInternalPaste.current = true; cutSelected(); return; }
      // Paste is handled through ClipboardEvent so external Figma SVG/PNG
      // data can be preferred over the clone's internal node clipboard.
      if (mod && key === "v") return;
      if (mod && (e.key === "d" || e.key === "D")) { e.preventDefault(); duplicateSelected(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canvas.selIds, editingId, screen, undo, redo, copySelected, cutSelected, pasteClipboard, duplicateSelected, autoLayoutSelected, selectAllEligible, deleteNode, selectTool, setActiveTool, toggleRulers, updateNode, updateTextContent, zoomFromCenter]);

  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (!e || !(e.target instanceof HTMLElement)) return;
      if (!rootRef.current || (document.activeElement !== document.body && !rootRef.current.contains(document.activeElement))) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (e.type === "keydown" && !e.repeat) {
          previousTool.current = activeTool;
          setActiveTool("hand");
        }
        if (e.type === "keyup") setActiveTool(previousTool.current);
      }
    };
    window.addEventListener("keydown", onSpace);
    window.addEventListener("keyup", onSpace);
    return () => {
      window.removeEventListener("keydown", onSpace);
      window.removeEventListener("keyup", onSpace);
    };
  }, [activeTool, setActiveTool]);

  const onContext = (e: React.MouseEvent, nid: string | null) => { e.preventDefault(); setAiCard({ x: e.clientX, y: e.clientY, nid }); };
  const finishEditing = (id: string, text: string) => {
    updateNode(id, { text });
    setEditingId(null);
    setActiveTool("move");
  };
  const cancelEditing = () => {
    setEditingId(null);
    setActiveTool("move");
  };

  const applyAI = (prompt: string) => {
    const id = aiCard?.nid; if (!id) return;
    const t = prompt.toLowerCase();
    const n = getScreen(canvas.screen)?.nodes.find((x) => x.id === id);
    if (t.includes("dark")) updateNode(id, { fill: "#18181b", color: "#fff" });
    else if (t.includes("chart")) updateNode(id, { text: (n?.props.text || "Card") + " 📊" });
    else if (t.includes("sidebar")) { setGeom(id, { x: 0 }); updateNode(id, { pad: 8, text: "☰ " + (n?.props.text || "Menu") }); }
    setAiCard(null);
  };

  const viewportRect = vpRef.current?.getBoundingClientRect();
  const viewportWorld = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    w: (viewportRect?.width ?? screen.w) / zoom,
    h: (viewportRect?.height ?? screen.h) / zoom,
  };
  const visibleRoots = screen.nodes.filter((node) => node.visible !== false);
  const miniMinX = Math.min(viewportWorld.x, ...visibleRoots.map((node) => node.x), 0);
  const miniMinY = Math.min(viewportWorld.y, ...visibleRoots.map((node) => node.y), 0);
  const miniMaxX = Math.max(viewportWorld.x + viewportWorld.w, ...visibleRoots.map((node) => node.x + node.w), screen.w);
  const miniMaxY = Math.max(viewportWorld.y + viewportWorld.h, ...visibleRoots.map((node) => node.y + node.h), screen.h);
  const miniScale = Math.min(200 / Math.max(1, miniMaxX - miniMinX), 120 / Math.max(1, miniMaxY - miniMinY));
  const fitCanvas = () => {
    const vp = vpRef.current?.getBoundingClientRect(); if (!vp) return;
    const roots = screen.nodes.filter((node) => node.visible !== false);
    if (!roots.length) {
      setZoomPan(1, { x: vp.width / 2, y: vp.height / 2 });
      return;
    }
    const minX = Math.min(...roots.map((node) => node.x));
    const minY = Math.min(...roots.map((node) => node.y));
    const maxX = Math.max(...roots.map((node) => node.x + node.w));
    const maxY = Math.max(...roots.map((node) => node.y + node.h));
    const next = Math.max(0.25, Math.min(32, Math.min((vp.width - 80) / Math.max(1, maxX - minX), (vp.height - 80) / Math.max(1, maxY - minY))));
    setZoomPan(next, { x: (vp.width - (maxX - minX) * next) / 2 - minX * next, y: (vp.height - (maxY - minY) * next) / 2 - minY * next });
  };
  const moreToolItems = [
    { key: "frame2", label: "Frame", icon: <CardsIcon size={14} />, shortcut: "F", action: () => selectTool("frame") },
    { key: "rect2", label: "Rectangle", icon: <RectangleIcon size={14} />, shortcut: "R", action: () => setActiveTool("rect") },
    { key: "ellipse2", label: "Ellipse", icon: <span>○</span>, shortcut: "O", action: () => setActiveTool("ellipse") },
    { key: "text2", label: "Text", icon: <span>T</span>, shortcut: "T", action: () => setActiveTool("text") },
    { key: "comment2", label: "Comment", icon: <span>💬</span>, action: () => {} },
    { key: "duplicate", label: "Duplicate", icon: <span>⧉</span>, shortcut: "⌘D", action: duplicateSelected },
    { key: "lock", label: "Lock / unlock", icon: <span>🔒</span>, action: () => canvas.selIds.forEach((id) => toggleNodeLock(id)) },
    { key: "delete", label: "Delete", icon: <span>🗑</span>, shortcut: "⌫", action: () => canvas.selIds.forEach((id) => deleteNode(id)) },
    { key: "grid", label: "Alignment grid", icon: <span>⊞</span>, action: () => toggleAlignmentGrid() },
    { key: "rulers", label: "Rulers", icon: <span>⏚</span>, shortcut: "⇧R", action: () => toggleRulers() },
    { key: "minimap", label: "Minimap", icon: <span>⊖</span>, action: () => toggleMinimap() },
    { key: "undo2", label: "Undo", icon: <span>↶</span>, shortcut: "⌘Z", action: undo },
    { key: "redo2", label: "Redo", icon: <span>↷</span>, shortcut: "⌘⇧Z", action: redo },
  ];

  return (
    <div ref={rootRef} className="flex-1 flex flex-col min-h-0 bg-zinc-100">
      {/* top bar */}
      <div className="h-11 px-3 items-center gap-2 border-b border-zinc-200 bg-white shrink-0 flex">
        <div className="flex items-center gap-2 px-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 text-white grid place-items-center text-xs font-bold">F</div>
            <span className="text-[13px] font-semibold">Forge</span>
          </div>
          <button onClick={() => {}} className="text-[12px] text-zinc-500 hover:text-zinc-700">+</button>
        </div>

        <div className="flex-1 flex justify-center">
          <label className="relative">
            <span className="sr-only">Design screen</span>
            <select
              value={canvas.screen}
              onChange={(event) => setCanvasScreen(event.target.value)}
              className="appearance-none rounded-lg border border-transparent bg-transparent py-1 pl-3 pr-7 text-[12px] font-medium text-zinc-800 outline-none hover:border-zinc-200 hover:bg-zinc-50 focus:border-violet-300"
            >
              {availableScreens.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">⌄</span>
          </label>
        </div>

        <span className="w-px h-6 bg-zinc-200 mx-1 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={undo} title="Undo" className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h12a4 4 0 0 1 0 8H9" /><path d="M7 3v6" /></svg>
          </button>
          <button onClick={redo} title="Redo" className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7H9a4 4 0 0 0 0 8h4" /><path d="M17 3v6" /></svg>
          </button>
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white grid place-items-center text-[10px] font-semibold ml-1">R</div>
          <button className="text-[12px] ml-2 border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-violet-700 text-white hover:bg-violet-800">Share</button>
          <button className="ml-1 w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100" title="Present">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
          </button>
          <span className="text-[11px] text-zinc-500 ml-1 tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
          <LayersPanel screenName={screen.name} onBack={onBack} />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 relative overflow-hidden bg-white">
              {canvas.showCanvasBg && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: canvas.canvasBg, opacity: canvas.canvasBgOpacity }} />}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              <div ref={vpRef} data-vp="1" tabIndex={0} onMouseDown={onVpDown} onMouseMove={onVpMove} onContextMenu={(e) => onContext(e, null)} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); }} onDragLeave={(e) => { if (e.target === e.currentTarget) setDragOver(false); }} onDrop={onCanvasDrop} className={`absolute inset-0 outline-none ${dragOver ? "ring-2 ring-violet-500 bg-violet-50/40" : ""}`} style={{ cursor: activeTool === "hand" ? (panning.current ? "grabbing" : "grab") : "default" }}>
                {canvas.showRulers && <>
                  <div onMouseDown={(e) => { e.stopPropagation(); const id = addGuide("horizontal", (e.clientY - vpRef.current!.getBoundingClientRect().top - pan.y) / zoom); draggingGuide.current = { id, orientation: "horizontal", isNew: true }; }} className="absolute z-30 top-0 left-5 right-0 h-5 bg-white/90 backdrop-blur border-b border-zinc-200 overflow-hidden cursor-row-resize" style={{ backgroundPosition: `${pan.x}px 0`, backgroundSize: `${50 * zoom}px 5px`, backgroundImage: `linear-gradient(to right, #d4d4d8 1px, transparent 1px)` }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const id = addGuide("vertical", (e.clientX - vpRef.current!.getBoundingClientRect().left - pan.x) / zoom); draggingGuide.current = { id, orientation: "vertical", isNew: true }; }} className="absolute z-30 top-5 left-0 bottom-0 w-5 bg-white/90 backdrop-blur border-r border-zinc-200 overflow-hidden cursor-col-resize" style={{ backgroundPosition: `0 ${pan.y}px`, backgroundSize: `5px ${50 * zoom}px`, backgroundImage: `linear-gradient(to bottom, #d4d4d8 1px, transparent 1px)` }} />
                  <div className="absolute z-40 top-0 left-0 w-5 h-5 bg-white border-r border-b border-zinc-200" />
                </>}
                {canvas.showAlignmentGrid && <div className="absolute inset-5 pointer-events-none opacity-30" style={{ backgroundImage: "linear-gradient(to right, #71717a 1px, transparent 1px), linear-gradient(to bottom, #71717a 1px, transparent 1px)", backgroundSize: "25% 25%" }} />}
                {selectionBox && (
                  <div
                    className="absolute z-30 pointer-events-none border border-violet-600 bg-violet-500/10"
                    style={selectionBox}
                  />
                )}
                {canvas.guides.map((guide) => (
                  <div
                    key={guide.id}
                    onMouseDown={(e) => { e.stopPropagation(); draggingGuide.current = { id: guide.id, orientation: guide.orientation }; }}
                    onDoubleClick={(e) => { e.stopPropagation(); deleteGuide(guide.id); }}
                    className={`absolute z-20 bg-sky-500 ${guide.orientation === "vertical" ? "top-0 bottom-0 w-px cursor-col-resize" : "left-0 right-0 h-px cursor-row-resize"}`}
                    style={guide.orientation === "vertical" ? { left: pan.x + guide.position * zoom } : { top: pan.y + guide.position * zoom }}
                    title="Drag guide · double-click to delete"
                  />
                ))}
                <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                  <div className="absolute overflow-visible" style={{ left: 0, top: 0 }}>
                    {screen.nodes.map((n) => (
                      <NodeView key={n.id} n={n} scale={1} onDown={onNodeDown} onDblClick={onNodeDblClick} onContext={(e, node) => onContext(e, node.id)} editingId={editingId} onTextChange={updateTextContent} onFinishEdit={finishEditing} onCancelEdit={cancelEditing} />
                    ))}
                  </div>
                  <div className="absolute left-0 top-0 z-[1000] overflow-visible pointer-events-none" data-selection-overlay="true">
                    {selectionLocations.map(({ node, x, y }) => (
                      <SelectionOverlay
                        key={node.id}
                        node={node}
                        x={x}
                        y={y}
                        zoom={zoom}
                        showDetails={selectionLocations.length === 1}
                        onResize={onResizeStart}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {canvas.selIds[0] && (
                <div className="absolute bottom-4 right-4 bg-white border border-zinc-200 rounded-xl shadow-2xl w-44 p-2">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Transform</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className="border border-zinc-200 rounded-lg px-2 py-1">X {Math.round(findNodeById(screen, canvas.selIds[0])?.x ?? 0)}</div>
                    <div className="border border-zinc-200 rounded-lg px-2 py-1">Y {Math.round(findNodeById(screen, canvas.selIds[0])?.y ?? 0)}</div>
                    <div className="border border-zinc-200 rounded-lg px-2 py-1">W {Math.round(findNodeById(screen, canvas.selIds[0])?.w ?? 0)}</div>
                    <div className="border border-zinc-200 rounded-lg px-2 py-1">H {Math.round(findNodeById(screen, canvas.selIds[0])?.h ?? 0)}</div>
                  </div>
                </div>
              )}

              {canvas.showMinimap && (
                <div className="absolute bottom-4 left-4 bg-white border border-zinc-200 rounded-xl shadow-2xl p-2">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Minimap</div>
                  <div
                    className="relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 cursor-crosshair"
                    style={{ width: 200, height: 120 }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const worldX = miniMinX + (e.clientX - rect.left) / miniScale;
                      const worldY = miniMinY + (e.clientY - rect.top) / miniScale;
                      const vp = vpRef.current?.getBoundingClientRect(); if (!vp) return;
                      setPan({ x: vp.width / 2 - worldX * zoom, y: vp.height / 2 - worldY * zoom });
                    }}
                  >
                    {visibleRoots.map((node) => <div key={node.id} className="absolute bg-white border border-zinc-400" style={{ left: (node.x - miniMinX) * miniScale, top: (node.y - miniMinY) * miniScale, width: Math.max(1, node.w * miniScale), height: Math.max(1, node.h * miniScale) }} />)}
                    <div className="absolute bg-sky-500/15 border border-sky-500" style={{ left: (viewportWorld.x - miniMinX) * miniScale, top: (viewportWorld.y - miniMinY) * miniScale, width: viewportWorld.w * miniScale, height: viewportWorld.h * miniScale }} />
                  </div>
                </div>
              )}
            </div>

            <div className="h-9 shrink-0 flex items-center justify-end gap-1 px-3 bg-white border-t border-zinc-200">
              <button onClick={() => zoomFromCenter(zoom * ZOOM_STEP)} className="text-[11px] border border-zinc-200 rounded px-2 py-0.5 hover:bg-zinc-50">+</button>
              <span className="text-[11px] tabular-nums w-10 text-center text-zinc-500">{Math.round(zoom * 100)}%</span>
              <button onClick={() => zoomFromCenter(zoom / ZOOM_STEP)} className="text-[11px] border border-zinc-200 rounded px-2 py-0.5 hover:bg-zinc-50">-</button>
              <button onClick={fitCanvas} className="text-[11px] border border-zinc-200 rounded px-2 py-0.5 hover:bg-zinc-50">Fit</button>
              <button onClick={() => zoomFromCenter(1)} className="text-[11px] border border-zinc-200 rounded px-2 py-0.5 hover:bg-zinc-50">100%</button>
            </div>
          </div>

          {canvas.selIds[0] ? <SelectedNodeInspector /> : <InspectorPanel />}
        </div>

      {aiCard && (
        <div className="fixed z-50 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-3" style={{ left: Math.min(aiCard.x, window.innerWidth - 270), top: Math.min(aiCard.y, window.innerHeight - 200) }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-violet-700">✦ AI</span>
            <button onClick={() => setAiCard(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
          </div>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {["Make it dark", "Add a chart", "Turn into sidebar"].map((s) => (
              <button key={s} onClick={() => applyAI(s)} className="text-[11px] border border-zinc-200 rounded-full px-2.5 py-1 hover:bg-zinc-50">{s}</button>
            ))}
          </div>
          <input placeholder="Describe a change…" className="w-full text-[12px] border border-zinc-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-400" onKeyDown={(e) => { if (e.key === "Enter") applyAI((e.target as HTMLInputElement).value); }} />
        </div>
      )}

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
        <div className="flex flex-col items-center">
          {framePresetOpen && (
            <div className="absolute bottom-full left-1/2 mb-12 w-72 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl">
              <div className="px-2 pb-2 pt-1 text-[11px] font-semibold text-zinc-700">Choose frame size</div>
              <div className="grid grid-cols-3 gap-1.5">
                {FRAME_PRESETS.map((preset) => {
                  const previewHeight = preset.key === "desktop" ? 34 : preset.key === "tablet" ? 42 : 48;
                  const previewWidth = preset.key === "desktop" ? 50 : preset.key === "tablet" ? 32 : 23;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => selectFramePreset(preset.key)}
                      className="flex min-w-0 flex-col items-center rounded-xl px-1 py-2 text-zinc-700 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <span className="mb-2 flex h-12 items-center justify-center">
                        <span className="block rounded-[3px] border-2 border-current bg-white" style={{ width: previewWidth, height: previewHeight }} />
                      </span>
                      <span className="text-[11px] font-medium">{preset.label}</span>
                      <span className="text-[9px] text-zinc-400">{preset.w} × {preset.h}</span>
                    </button>
                  );
                })}
              </div>
              <div className="px-2 pt-2 text-center text-[9px] text-zinc-400">Choose a preset, then click or drag on the canvas</div>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white border border-zinc-200 shadow-xl rounded-full px-2 py-1.5">
            {TOOLBAR_ITEMS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTool(t.key)}
                aria-label={`${t.label} tool`}
                aria-keyshortcuts={t.shortcut}
                aria-pressed={activeTool === t.key}
                className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition ${
                  activeTool === t.key
                    ? "bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-300"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
                title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
              >
                <ToolGlyph tool={t} size={t.key === "move" ? 24 : 18} />
                {activeTool === t.key && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-violet-600 ring-2 ring-white" />}
                <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {t.label}
                </span>
              </button>
            ))}
            <OverflowBtn label="More" icon={<span className="text-lg leading-none">⋯</span>} items={moreToolItems} />
          </div>
          <div className="text-[11px] text-center mt-0.5 text-zinc-500">{activeToolLabel}</div>
        </div>
      </div>
    </div>
  );
}

function NodeView({ n, scale, onDown, onDblClick, onContext, onTextChange, onFinishEdit, onCancelEdit, editingId }: { n: CNode; scale: number; onDown?: (e: React.MouseEvent, n: CNode) => void; onDblClick?: (n: CNode) => void; onContext?: (e: React.MouseEvent, n: CNode) => void; onTextChange?: (id: string, text: string) => void; onFinishEdit?: (id: string, text: string) => void; onCancelEdit?: () => void; editingId?: string | null }) {
  if (n.visible === false) return null;
  const padRaw = n.props.pad ?? 0;
  const padH = n.props.padH ?? padRaw;
  const padV = n.props.padV ?? padRaw;
  const padTop = n.props.padTop ?? padV;
  const padRight = n.props.padRight ?? padH;
  const padBottom = n.props.padBottom ?? padV;
  const padLeft = n.props.padLeft ?? padH;
  const positionsChildrenWithAutoLayout = !!n.props.autoLayout && !!n.children?.length;
  const strokeWidth = n.props.strokeVisible === false ? 0 : (n.props.strokeWidth ?? 0);
  const strokeColor = colorWithOpacity(n.props.strokeColor || "#000000", n.props.strokeOpacity ?? 1);
  const strokePosition = n.props.strokePosition ?? "inside";
  const strokeShadow = strokeWidth && strokePosition !== "center"
    ? `${strokePosition === "inside" ? "inset " : ""}0 0 0 ${strokeWidth}px ${strokeColor}`
    : "";
  const gradientColors = (n.props.gradientColors?.length ? n.props.gradientColors : [n.props.fill || "#ffffff", "#00000000"])
    .map((color) => colorWithOpacity(color, n.props.fillOpacity ?? 1));

  const base: React.CSSProperties = {
    position: "absolute",
    left: n.x * scale,
    top: n.y * scale,
    width: n.w * scale,
    height: n.h * scale,
    backgroundImage: n.props.fillMode === "gradient" && n.props.fillVisible !== false ? `linear-gradient(to right, ${gradientColors.join(", ")})` : "none",
    background: n.props.fillMode === "gradient"
      ? undefined
      : n.props.fillVisible === false
      ? "transparent"
      : colorWithOpacity(n.props.fill || "#ffffff", n.props.fillOpacity ?? 1),
    color: n.props.color,
    fontSize: (n.props.size || 14) * scale,
    fontFamily: n.props.fontFamily,
    letterSpacing: n.props.letterSpacing,
    lineHeight: n.props.lineHeight,
    paddingTop: (positionsChildrenWithAutoLayout ? 0 : padTop) * scale,
    paddingRight: (positionsChildrenWithAutoLayout ? 0 : padRight) * scale,
    paddingBottom: (positionsChildrenWithAutoLayout ? 0 : padBottom) * scale,
    paddingLeft: (positionsChildrenWithAutoLayout ? 0 : padLeft) * scale,
    borderRadius: n.props.shapeKind === "ellipse" ? "9999px" : (n.props.radius ?? (n.type === "text" || n.type === "image" ? 0 : 8)) * scale,
    display: n.type === "image" ? "block" : (n.props.autoLayout || n.type === "row" || n.type === "section" || n.type === "component" || !!n.children ? "flex" : "flex"),
    flexDirection: n.props.direction === "col" ? "column" : "row",
    alignItems: n.props.align === "stretch"
      ? "stretch"
      : n.props.align === "between"
      ? "space-between"
      : n.props.align === "center"
      ? "center"
      : n.props.align === "end"
      ? "flex-end"
      : "flex-start",
    justifyContent: n.props.justify === "stretch"
      ? "space-between"
      : n.props.justify === "between"
      ? "space-between"
      : n.props.justify === "center"
      ? "center"
      : n.props.justify === "end"
      ? "flex-end"
      : "flex-start",
    gap: n.props.gap ? n.props.gap * scale : 0,
    boxSizing: "border-box",
    border: strokeWidth && strokePosition === "center" ? `${strokeWidth}px solid ${strokeColor}` : "none",
    boxShadow: strokeShadow || undefined,
    overflow: n.props.wrap ? "visible" : "hidden",
    opacity: n.props.opacity ?? 1,
    filter: n.props.blur ? `blur(${n.props.blur}px)` : "none",
    transform: n.rotation ? `rotate(${n.rotation}deg)` : undefined,
    transformOrigin: "center",
  };
  const align: React.CSSProperties = n.props.text && !n.props.autoLayout && !n.children ? { justifyContent: "flex-start", textAlign: "left" } : {};
  const clip: React.CSSProperties = scale < 1 ? { overflow: "hidden" } : {};
  const editableText = n.type === "text" || n.type === "button" || n.type === "card" || n.type === "row" || n.type === "section" || n.type === "input";
  const editing = !!editingId && editingId === n.id;
  const textValue = (n.props.text || "").toString();

  const content = n.type === "input"
    ? <span className="opacity-50">{n.props.placeholder || "Input…"}</span>
    : editing && editableText
    ? <EditableText value={textValue} placeholder={n.props.placeholder} multiline={n.type === "text"} autoFocus={true} className="w-full h-full m-0 p-0 border-0 bg-transparent outline-none overflow-hidden" onChange={(val) => onTextChange?.(n.id, val)} onSave={(val) => onFinishEdit?.(n.id, val)} onCancel={onCancelEdit} />
    : n.children
    ? <div className="relative w-full h-full">{n.children.map((c) => <NodeView key={c.id} n={c} scale={scale} onDown={onDown} onDblClick={onDblClick} onContext={onContext} onTextChange={onTextChange} onFinishEdit={onFinishEdit} onCancelEdit={onCancelEdit} editingId={editingId} />)}</div>
    : n.type === "image" && n.props.src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={n.props.src} alt={n.props.text || "image"} className="w-full h-full pointer-events-none" draggable={false} style={{ transform: `scale(${n.props.imageScale || 1})`, transformOrigin: "center center", objectFit: (n.props.objectFit || "cover") as React.CSSProperties["objectFit"] }} />
    : n.type === "frame"
    ? (() => {
        const k = n.props.shapeKind || "rect";
        if (k === "ellipse") return null;
        if (k === "line") return <span className="block w-full h-px bg-zinc-400 self-center" />;
        if (k === "arrow") return <span className="block text-zinc-400 self-center">→</span>;
        if (k === "polygon") return <span className="block text-center text-zinc-400 self-center">⬠</span>;
        if (k === "star") return <span className="block text-center text-zinc-400 self-center">★</span>;
        return n.props.text ? <span className="text-[11px] text-zinc-400">{n.props.text}</span> : null;
      })()
    : n.type === "card"
    ? <span className="inline-flex items-center justify-center w-full h-full rounded-xl border border-zinc-200 bg-white text-[12px] text-zinc-700 shadow-sm">{n.props.text || "Card"}</span>
    : n.type === "button"
    ? <span className="inline-flex items-center justify-center w-full h-full rounded-lg bg-violet-700 text-white text-[12px]">{n.props.text || "Button"}</span>
    : <span style={{ fontWeight: (n.props.weight ?? 400) }}>{n.props.text || n.type}</span>;

  return (
    <div
      style={{ ...base, ...align, ...clip } as React.CSSProperties}
      className={n.locked ? "cursor-not-allowed" : "cursor-move"}
      onMouseDown={onDown ? (e) => onDown(e, n) : undefined}
      onDoubleClick={onDblClick ? (e) => { e.stopPropagation(); onDblClick(n); } : undefined}
      onContextMenu={onContext ? (e) => onContext(e, n) : undefined}
    >
      {content}
    </div>
  );
}

function SelectionOverlay({ node, x, y, zoom, showDetails, onResize }: { node: CNode; x: number; y: number; zoom: number; showDetails: boolean; onResize: (e: React.MouseEvent, n: CNode, handle: string) => void }) {
  const inverseZoom = 1 / Math.max(zoom, 0.01);
  const handleSize = 10 * inverseZoom;
  const halfHandle = handleSize / 2;
  const canResize = node.type !== "text" && !node.locked;
  const name = node.name || node.props.name || node.type.charAt(0).toUpperCase() + node.type.slice(1);
  const handles = [
    { key: "nw", left: -halfHandle, top: -halfHandle, cursor: "nwse-resize" },
    { key: "n", left: node.w / 2 - halfHandle, top: -halfHandle, cursor: "ns-resize" },
    { key: "ne", left: node.w - halfHandle, top: -halfHandle, cursor: "nesw-resize" },
    { key: "e", left: node.w - halfHandle, top: node.h / 2 - halfHandle, cursor: "ew-resize" },
    { key: "se", left: node.w - halfHandle, top: node.h - halfHandle, cursor: "nwse-resize" },
    { key: "s", left: node.w / 2 - halfHandle, top: node.h - halfHandle, cursor: "ns-resize" },
    { key: "sw", left: -halfHandle, top: node.h - halfHandle, cursor: "nesw-resize" },
    { key: "w", left: -halfHandle, top: node.h / 2 - halfHandle, cursor: "ew-resize" },
  ];

  return (
    <div
      className="absolute overflow-visible border-solid border-[#0d99ff] pointer-events-none"
      style={{
        left: x,
        top: y,
        width: node.w,
        height: node.h,
        borderWidth: 1.5 * inverseZoom,
        transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
        transformOrigin: "center",
      }}
    >
      {showDetails && (
        <>
          <div
            className="absolute left-0 whitespace-nowrap font-semibold text-[#0d99ff]"
            style={{ top: -28 * inverseZoom, fontSize: 13 * inverseZoom, lineHeight: `${18 * inverseZoom}px` }}
          >
            {name}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0d99ff] font-semibold leading-none text-white shadow-sm"
            style={{ bottom: -34 * inverseZoom, padding: `${5 * inverseZoom}px ${8 * inverseZoom}px`, fontSize: 11 * inverseZoom }}
          >
            {Math.round(node.w)} × {Math.round(node.h)}
          </div>
        </>
      )}

      <span
        className="absolute rounded-full border border-[#0d99ff] bg-white"
        title="Rotation handle"
        style={{
          width: 10 * inverseZoom,
          height: 10 * inverseZoom,
          left: node.w / 2 - 5 * inverseZoom,
          top: -30 * inverseZoom,
          borderWidth: 1.5 * inverseZoom,
        }}
      />
      <span
        className="absolute bg-[#0d99ff]"
        style={{ width: 1.5 * inverseZoom, height: 15 * inverseZoom, left: node.w / 2 - 0.75 * inverseZoom, top: -20 * inverseZoom }}
      />
      <span
        className="absolute rounded-full border border-[#0d99ff] bg-white"
        title="Anchor point"
        style={{
          width: 8 * inverseZoom,
          height: 8 * inverseZoom,
          left: node.w / 2 - 4 * inverseZoom,
          top: node.h / 2 - 4 * inverseZoom,
          borderWidth: 1.5 * inverseZoom,
        }}
      />

      {canResize && handles.map((handle) => (
        <span
          key={handle.key}
          onMouseDown={(event) => onResize(event, node, handle.key)}
          className="absolute pointer-events-auto border-[#0d99ff] bg-white"
          style={{
            left: handle.left,
            top: handle.top,
            width: handleSize,
            height: handleSize,
            borderWidth: 1.5 * inverseZoom,
            cursor: handle.cursor,
          }}
        />
      ))}
    </div>
  );
}

const INDENT = 14;
const ICONS: Record<string, string> = {
  frame: "▭",
  text: "T",
  button: "⬚",
  input: "▭",
  card: "▢",
  row: "▬",
  section: "⬛",
  image: "🖼",
  screen: "🏠",
  component: "🔷",
};

function LayerTree({ node, depth, onSelect, expandedKeys, onToggleExpand, onDelete, onReorder, isRoot, realChildren }: { node: CNode; depth: number; onSelect?: (id: string, additive?: boolean) => void; expandedKeys?: Record<string, boolean>; onToggleExpand?: (id: string) => void; onDelete?: (id: string) => void; onReorder?: (id: string, dir: number) => void; isRoot?: boolean; realChildren?: CNode[] }) {
  const selIds = useCanvas((s) => s.canvas.selIds);
  const hasKids = isRoot ? !!realChildren?.length : !!(node.children && node.children.length);
  const isSelected = selIds.includes(node.id);
  const expanded = expandedKeys?.[node.id] !== false;
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const indentGuide = depth > 0;

  const onDragStart = (e: React.DragEvent) => {
    dragIdRef.current = node.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.id);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdRef.current && dragIdRef.current !== node.id) setDragOverId(node.id);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    const from = e.dataTransfer.getData("text/plain");
    if (from && from !== node.id) onReorder?.(from, 1);
    dragIdRef.current = null;
  };
  const onDragEnd = () => { dragIdRef.current = null; setDragOverId(null); };

  return (
    <div>
      <div
        className={`group relative flex items-center gap-1 px-1.5 py-1 rounded-lg cursor-pointer ${isSelected ? "bg-violet-50 text-violet-700" : "hover:bg-zinc-50"} ${dragOverId === node.id ? "bg-violet-100" : ""}`}
        style={{ paddingLeft: 6 + depth * INDENT }}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={(e) => { e.stopPropagation(); onSelect?.(node.id, e.ctrlKey || e.metaKey || e.shiftKey); }}
      >
        {indentGuide && <span className="absolute border-l border-zinc-200" style={{ left: 12 + (depth - 1) * INDENT, height: 20, marginTop: 0 }} />}
        <button onClick={(e) => { e.stopPropagation(); onToggleExpand?.(node.id); }} className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-700">
          {hasKids ? <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2 8 6 4 10" className={expanded ? "rotate-90 transition-transform origin-center" : ""} /></svg> : <span className="text-[10px] leading-none opacity-0">·</span>}
        </button>
        <span className="text-[11px] w-4 text-center text-zinc-400">{ICONS[node.type] || "•"}</span>
        <span className="text-[12px] truncate flex-1">{node.props.text || node.type}</span>
        {!isRoot && <>
          <button onClick={(e) => { e.stopPropagation(); onReorder?.(node.id, 1); }} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 text-[10px]">↑</button>
          <button onClick={(e) => { e.stopPropagation(); onReorder?.(node.id, -1); }} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 text-[10px]">↓</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(node.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 text-[10px]" title="Delete layer">🗑️</button>
        </>}
      </div>
      {expanded && hasKids && (
        <div>
          {(isRoot ? realChildren : node.children)?.map((child) => (
            <LayerTree key={child.id} node={child} depth={depth + 1} onSelect={onSelect} expandedKeys={expandedKeys} onToggleExpand={onToggleExpand} onDelete={onDelete} onReorder={onReorder} realChildren={child.children} />
          ))}
        </div>
      )}
    </div>
  );
}
