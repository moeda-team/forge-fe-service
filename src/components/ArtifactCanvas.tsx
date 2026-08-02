"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { forgeApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ArtifactFile, ArtifactKind, CanvasArtifact, Project } from "@/lib/types";

const LABELS: Record<ArtifactKind, { title: string; eyebrow: string; description: string }> = {
  frontend: { title: "Frontend Canvas", eyebrow: "UI implementation", description: "Pages, components, states, and frontend tasks derived from the latest requirement." },
  backend: { title: "Backend Canvas", eyebrow: "API & services", description: "API capabilities, business rules, security constraints, and backend tasks." },
  database: { title: "Database Canvas", eyebrow: "Data architecture", description: "Entities, persistence rules, migration checks, and database tasks." },
  testing: { title: "Testing Canvas", eyebrow: "Verification", description: "Acceptance scenarios, non-functional checks, release gates, and testing tasks." },
};

const STATUS_LABEL: Record<string, string> = { backlog: "Backlog", todo: "To do", progress: "In progress", done: "Done" };

export default function ArtifactCanvas() {
  const project = useStore((state) => state.current());
  const kind = useStore((state) => state.artifactKind);
  const apiEnabled = useStore((state) => state.apiEnabled);
  const [artifact, setArtifact] = useState<CanvasArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [copied, setCopied] = useState(false);
  const meta = LABELS[kind];
  const hasRequirement = Boolean(project?.requirement);

  const orchestrate = useCallback(async () => {
    if (!project || !apiEnabled || !project.requirement) return;
    setLoading(true);
    setError("");
    try {
      const generated = await forgeApi.orchestrateArtifacts(project.id, [kind]);
      setArtifact(generated.find((item) => item.kind === kind) || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Artifact orchestration failed");
    } finally {
      setLoading(false);
    }
  }, [apiEnabled, kind, project]);

  useEffect(() => {
    let cancelled = false;
    if (!project || !apiEnabled) { setLoading(false); return; }
    setLoading(true);
    setError("");
    void forgeApi.listArtifacts(project.id).then(async (items) => {
      if (cancelled) return;
      const current = items.find((item) => item.kind === kind) || null;
      const stale = current && current.requirementVersion < (project.reqVersion || 0);
      const missingFiles = current && !current.content.files?.length;
      const missingQuality = current && !current.content.quality;
      if ((!current || stale || missingFiles || missingQuality) && project.requirement) {
        const generated = await forgeApi.orchestrateArtifacts(project.id, [kind]);
        if (!cancelled) setArtifact(generated.find((item) => item.kind === kind) || null);
      } else {
        setArtifact(current);
      }
    }).catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load artifact canvas");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiEnabled, hasRequirement, kind, project]);

  useEffect(() => {
    const files = artifact?.content.files || [];
    if (!files.some((file) => file.path === selectedFile)) setSelectedFile(files[0]?.path || "");
  }, [artifact, selectedFile]);

  if (!project) return null;
  const synced = artifact?.requirementVersion === (project.reqVersion || 0);
  const files = artifact?.content.files || [];
  const currentFile = files.find((file) => file.path === selectedFile) || files[0];

  const copyFile = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Browser clipboard permission was denied");
    }
  };

  const downloadFile = () => {
    if (!currentFile) return;
    downloadBlob(currentFile.path.split("/").pop() || "artifact.txt", currentFile.content, "text/plain;charset=utf-8");
  };

  const downloadBundle = async () => {
    try {
      const bundle = await forgeApi.getArtifactBundle(project.id);
      downloadBlob(`${safeName(project.name)}-forge-artifacts.json`, JSON.stringify(bundle, null, 2), "application/json;charset=utf-8");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to export artifact bundle");
    }
  };

  if (kind === "frontend") {
    return <FrontendArtifactCanvas
      project={project}
      artifact={artifact}
      loading={loading}
      error={error}
      synced={synced}
      files={files}
      currentFile={currentFile}
      selectedFile={selectedFile}
      copied={copied}
      onSelectFile={setSelectedFile}
      onCopyFile={() => void copyFile()}
      onDownloadFile={downloadFile}
      onGenerate={() => void orchestrate()}
      onExport={() => void downloadBundle()}
    />;
  }

  return (
    <main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-zinc-50">
      <header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-zinc-200 bg-white/95 px-8 backdrop-blur">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{meta.eyebrow}</div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{meta.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {artifact && (
            <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${synced ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {synced ? `✓ Requirement v${artifact.requirementVersion} synced` : "Requirement changed"}
            </span>
          )}
          <button type="button" onClick={() => void orchestrate()} disabled={loading || !project.requirement} className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? "Orchestrating…" : artifact ? "Re-generate" : "Generate canvas"}
          </button>
          <button type="button" onClick={() => void downloadBundle()} disabled={!artifact} className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">Export bundle</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-8">
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-900 text-lg text-white">✦</div>
            <div>
              <h2 className="font-semibold text-zinc-900">AI-orchestrated canvas</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">{artifact?.content.summary || meta.description}</p>
              <p className="mt-2 text-xs text-zinc-400">This canvas updates automatically when a newer Requirement version is available.</p>
            </div>
          </div>
        </section>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!project.requirement ? (
          <EmptyState title="Requirement needed" description="Create a PRD or requirement in AI Workspace, then send it to Kanban. This canvas will be generated automatically." />
        ) : loading && !artifact ? (
          <div className="grid grid-cols-2 gap-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-white" />)}</div>
        ) : artifact ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {artifact.content.quality && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div><h2 className="font-semibold text-zinc-900">Quality gates</h2><p className="mt-0.5 text-xs text-zinc-400">Verified before linked Kanban tasks are completed.</p></div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${artifact.content.quality.status === "passed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{artifact.content.quality.status === "passed" ? "✓ All checks passed" : "Checks failed"}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {artifact.content.quality.checks.map((check) => (
                    <div key={check.key} className="rounded-xl border border-zinc-200 px-3.5 py-3">
                      <div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${check.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{check.passed ? "✓" : "×"}</span><span className="text-xs font-medium text-zinc-800">{check.label}</span></div>
                      <p className="mt-2 text-[10px] leading-4 text-zinc-400">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {files.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:col-span-2">
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                  <div><h2 className="font-semibold text-zinc-900">Generated files</h2><p className="mt-0.5 text-xs text-zinc-400">Preview, copy, or download the generated deliverables.</p></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void copyFile()} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">{copied ? "Copied" : "Copy"}</button>
                    <button type="button" onClick={downloadFile} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">Download</button>
                  </div>
                </div>
                <div className="grid min-h-[360px] grid-cols-[240px_minmax(0,1fr)]">
                  <aside className="border-r border-zinc-200 bg-zinc-50 p-2">
                    {files.map((file) => <button key={file.path} type="button" onClick={() => setSelectedFile(file.path)} className={`mb-1 w-full truncate rounded-lg px-3 py-2 text-left font-mono text-[11px] ${currentFile?.path === file.path ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200/60"}`} title={file.path}>{file.path}</button>)}
                  </aside>
                  <div className="min-w-0 bg-[#18181b]">
                    <div className="flex h-9 items-center justify-between border-b border-white/10 px-4 font-mono text-[10px] text-zinc-400"><span>{currentFile?.path}</span><span>{currentFile?.language}</span></div>
                    <pre className="max-h-[520px] overflow-auto p-5 text-[12px] leading-6 text-zinc-200"><code>{currentFile?.content}</code></pre>
                  </div>
                </div>
              </section>
            )}
            {artifact.content.sections.map((section, sectionIndex) => (
              <section key={`${section.title}-${sectionIndex}`} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-zinc-900">{section.title}</h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">{section.items.length}</span>
                </div>
                {section.items.length ? <ul className="space-y-2.5">{section.items.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-3 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm leading-5 text-zinc-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />
                    <span>{item}</span>
                  </li>
                ))}</ul> : <p className="text-sm text-zinc-400">No matching requirement items yet.</p>}
              </section>
            ))}

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900">Linked Kanban tasks</h2>
                <span className="text-xs text-zinc-400">Source of truth · Requirement v{artifact.requirementVersion}</span>
              </div>
              {artifact.content.tasks.length ? <div className="grid gap-3 md:grid-cols-2">{artifact.content.tasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium leading-5 text-zinc-800">{task.title}</h3>
                      <div className="mt-2 flex gap-2 text-[10px] font-medium text-zinc-400"><span>{STATUS_LABEL[task.status] || task.status}</span>{task.reqRef && <span>· {task.reqRef}</span>}</div>
                    </div>
                  </div>
                </article>
              ))}</div> : <p className="text-sm text-zinc-400">No Kanban tasks are assigned to this canvas yet. The architecture is still generated from the Requirement.</p>}
            </section>
          </div>
        ) : (
          <EmptyState title="Canvas is ready to generate" description={meta.description} />
        )}
      </div>
    </main>
  );
}

type FrontendCanvasProps = {
  project: Project;
  artifact: CanvasArtifact | null;
  loading: boolean;
  error: string;
  synced: boolean;
  files: ArtifactFile[];
  currentFile?: ArtifactFile;
  selectedFile: string;
  copied: boolean;
  onSelectFile: (path: string) => void;
  onCopyFile: () => void;
  onDownloadFile: () => void;
  onGenerate: () => void;
  onExport: () => void;
};

const FRONTEND_LAYERS = ["App Shell", "Navigation", "Dashboard", "Metric Cards", "Recent Activity", "Footer"];

function FrontendArtifactCanvas({ project, artifact, loading, error, synced, files, currentFile, selectedFile, copied, onSelectFile, onCopyFile, onDownloadFile, onGenerate, onExport }: FrontendCanvasProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mode, setMode] = useState<"inspect" | "flow">("inspect");
  const [leftTab, setLeftTab] = useState<"layers" | "components" | "pages">("layers");
  const [inspectorTab, setInspectorTab] = useState<"props" | "api" | "code" | "ai">("props");
  const [bottomTab, setBottomTab] = useState<"screen" | "component" | "request" | "tasks">("screen");
  const [selectedLayer, setSelectedLayer] = useState("Dashboard");
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 48, y: 48 });
  const [panning, setPanning] = useState(false);
  const [query, setQuery] = useState("");
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const sections = artifact?.content.sections || [];
  const layers = (sections.flatMap((section) => [section.title, ...section.items.slice(0, 2)]).slice(0, 9).length
    ? sections.flatMap((section) => [section.title, ...section.items.slice(0, 2)]).slice(0, 9)
    : FRONTEND_LAYERS).filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  const deviceWidth = device === "desktop" ? 760 : device === "tablet" ? 560 : 330;
  const fitCanvas = useCallback(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const nextZoom = Math.min(.9, Math.max(.5, (bounds.width - 80) / deviceWidth));
    setZoom(nextZoom);
    setPan({ x: Math.max(40, (bounds.width - deviceWidth * nextZoom) / 2), y: 48 });
  }, [deviceWidth]);

  const zoomCanvas = useCallback((next: number, clientX?: number, clientY?: number) => {
    const bounded = Math.min(1.6, Math.max(.3, next));
    const viewport = canvasViewportRef.current;
    if (!viewport || clientX === undefined || clientY === undefined) { setZoom(bounded); return; }
    const bounds = viewport.getBoundingClientRect();
    const pointX = clientX - bounds.left;
    const pointY = clientY - bounds.top;
    const ratio = bounded / zoom;
    setPan((value) => ({ x: pointX - (pointX - value.x) * ratio, y: pointY - (pointY - value.y) * ratio }));
    setZoom(bounded);
  }, [zoom]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.ctrlKey || event.metaKey) {
        zoomCanvas(zoom * Math.exp(-event.deltaY * .004), event.clientX, event.clientY);
      } else {
        setPan((value) => ({ x: value.x - event.deltaX, y: value.y - event.deltaY }));
      }
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [zoom, zoomCanvas]);
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f5f5] text-zinc-900">
      <header className="flex min-h-[62px] items-center gap-4 border-b border-zinc-200 bg-white px-5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-zinc-950 text-sm font-semibold text-white">F</div>
        <div className="min-w-0 border-l border-zinc-200 pl-4">
          <div className="truncate text-sm font-semibold">{project.name}</div>
          <div className="truncate text-[11px] text-zinc-400">Frontend Canvas · <span className="text-zinc-700">Dashboard</span></div>
        </div>
        <div className="ml-auto hidden items-center rounded-xl border border-zinc-200 bg-white p-1 xl:flex">
          {(["desktop", "tablet", "mobile"] as const).map((item) => <ToolbarChoice key={item} active={device === item} onClick={() => setDevice(item)}>{item === "desktop" ? "▣ Desktop" : item === "tablet" ? "▯ Tablet" : "▯ Mobile"}</ToolbarChoice>)}
        </div>
        <div className="hidden items-center rounded-xl border border-zinc-200 bg-white p-1 2xl:flex">
          {(["light", "dark"] as const).map((item) => <ToolbarChoice key={item} active={theme === item} onClick={() => setTheme(item)}>{item === "light" ? "Light" : "Dark"}</ToolbarChoice>)}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1">
          <button type="button" aria-label="Zoom out" onClick={() => zoomCanvas(zoom - .2)} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">−</button>
          <span className="w-10 text-center font-mono text-[10px] text-zinc-500">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoomCanvas(zoom + .2)} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">+</button>
          <button type="button" aria-label="Fit canvas" title="Fit canvas" onClick={fitCanvas} className="grid h-7 w-7 place-items-center rounded-lg text-[10px] text-zinc-500 hover:bg-zinc-100">Fit</button>
        </div>
        <button type="button" onClick={onGenerate} disabled={loading || !project.requirement} className="rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40">{loading ? "Syncing…" : artifact ? "Regenerate" : "Generate"}</button>
        <button type="button" onClick={onExport} disabled={!artifact} className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] lg:flex ${synced ? "border-zinc-900 text-zinc-800" : "border-red-200 text-red-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${synced ? "bg-red-600" : "bg-amber-500"}`} />{synced ? `Synced · v${artifact?.requirementVersion}` : "Needs update"}</button>
      </header>

      {error && <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">{error}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)_270px] max-xl:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-200 bg-white">
          <div className="flex border-b border-zinc-200 px-2 pt-2">
            {(["layers", "components", "pages"] as const).map((tab) => <button key={tab} type="button" onClick={() => setLeftTab(tab)} className={`border-b-2 px-2.5 py-2 text-[11px] capitalize ${leftTab === tab ? "border-red-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>)}
          </div>
          <div className="p-3"><div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3"><span className="text-zinc-400">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <p className="px-2 pb-2 pt-1 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">{leftTab === "layers" ? "Dashboard · Layers" : leftTab}</p>
            {leftTab === "components" ? files.map((file) => <SideItem key={file.path} active={selectedFile === file.path} label={file.path.split("/").pop() || file.path} meta={file.language} onClick={() => onSelectFile(file.path)} />) : leftTab === "pages" ? ["Dashboard", "Login", "Projects", "Settings"].map((page, index) => <SideItem key={page} active={index === 0} label={page} meta={index === 0 ? "/" : `/${page.toLowerCase()}`} onClick={() => setSelectedLayer(page)} />) : layers.map((layer, index) => <SideItem key={`${layer}-${index}`} active={selectedLayer === layer} label={layer} indent={index > 0} onClick={() => setSelectedLayer(layer)} />)}
            {!artifact && !loading && <p className="px-2 py-8 text-center text-xs leading-5 text-zinc-400">Generate the frontend artifact to populate real layers and components.</p>}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="flex min-h-12 items-center gap-3 border-b border-zinc-200 bg-white px-4">
            <div className="flex rounded-xl border border-zinc-200 p-1">
              <ToolbarChoice active={mode === "inspect"} onClick={() => setMode("inspect")}>Inspect</ToolbarChoice>
              <ToolbarChoice active={mode === "flow"} onClick={() => setMode("flow")}>Flow</ToolbarChoice>
            </div>
            <div className="ml-auto flex gap-4 font-mono text-[9px] uppercase tracking-wider text-zinc-400"><span>Route <b className="text-zinc-700">/dashboard</b></span><span>Req <b className="text-red-600">REQ-FE-001</b></span></div>
          </div>
          <div
            ref={canvasViewportRef}
            data-testid="frontend-canvas-viewport"
            onPointerDown={(event) => {
              if (event.button !== 0 && event.button !== 1) return;
              const target = event.target as HTMLElement;
              if (event.button === 0 && target.closest("[data-fc-selectable],button,input")) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              panStartRef.current = { pointerX: event.clientX, pointerY: event.clientY, panX: pan.x, panY: pan.y };
              setPanning(true);
            }}
            onPointerMove={(event) => {
              if (!panning) return;
              const start = panStartRef.current;
              setPan({ x: start.panX + event.clientX - start.pointerX, y: start.panY + event.clientY - start.pointerY });
            }}
            onPointerUp={(event) => { if (panning) event.currentTarget.releasePointerCapture(event.pointerId); setPanning(false); }}
            onPointerCancel={() => setPanning(false)}
            className={`relative min-h-0 flex-1 touch-none overflow-hidden bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] bg-[size:20px_20px] ${panning ? "cursor-grabbing select-none" : "cursor-grab"}`}
          >
            {loading && !artifact ? <FrontendLoading /> : mode === "flow" ? <FrontendFlow artifact={artifact} /> : (
              <div className="absolute left-0 top-0 origin-top-left transition-[width] duration-300" style={{ width: deviceWidth, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <div className={`overflow-hidden rounded-[22px] border shadow-[0_24px_70px_rgba(0,0,0,.12)] ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-white" : "border-zinc-200 bg-white"}`}>
                  <div className={`flex h-9 items-center gap-1.5 border-b px-4 ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><span className="ml-auto font-mono text-[9px] text-zinc-400">{device === "desktop" ? "Desktop · 1440px" : device === "tablet" ? "Tablet · 834px" : "Mobile · 390px"}</span></div>
                  <FrontendPreview theme={theme} device={device} selectedLayer={selectedLayer} onSelect={setSelectedLayer} />
                </div>
              </div>
            )}
          </div>
          <div className="h-[190px] shrink-0 border-t border-zinc-200 bg-white">
            <div className="flex h-10 items-center border-b border-zinc-200 px-3">
              {(["screen", "component", "request", "tasks"] as const).map((tab) => <button key={tab} type="button" onClick={() => setBottomTab(tab)} className={`h-full border-b-2 px-3 text-[11px] capitalize ${bottomTab === tab ? "border-red-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab === "request" ? "Requirement" : tab}</button>)}
            </div>
            <BottomPanel tab={bottomTab} artifact={artifact} project={project} selectedLayer={selectedLayer} />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-l border-zinc-200 bg-white max-xl:hidden">
          <div className="flex border-b border-zinc-200 px-2">
            {(["props", "api", "code", "ai"] as const).map((tab) => <button key={tab} type="button" onClick={() => setInspectorTab(tab)} className={`border-b-2 px-3 py-3 text-[11px] uppercase ${inspectorTab === tab ? "border-red-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>)}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4"><Inspector tab={inspectorTab} selectedLayer={selectedLayer} artifact={artifact} currentFile={currentFile} copied={copied} onCopy={onCopyFile} onDownload={onDownloadFile} /></div>
        </aside>
      </div>
    </main>
  );
}

function ToolbarChoice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${active ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>{children}</button>;
}

function SideItem({ active, label, meta, indent, onClick }: { active: boolean; label: string; meta?: string; indent?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`mb-1 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs ${indent ? "ml-3 w-[calc(100%-12px)]" : ""} ${active ? "border-zinc-200 bg-zinc-100 font-medium" : "border-transparent hover:bg-zinc-50"}`}><span className="grid h-4 w-4 place-items-center rounded border border-zinc-300 text-[8px] text-zinc-400">◇</span><span className="min-w-0 flex-1 truncate">{label}</span>{meta && <span className="font-mono text-[8px] text-zinc-400">{meta}</span>}</button>;
}

function FrontendPreview({ theme, device, selectedLayer, onSelect }: { theme: "light" | "dark"; device: "desktop" | "tablet" | "mobile"; selectedLayer: string; onSelect: (value: string) => void }) {
  const dark = theme === "dark";
  const selectable = (name: string) => `relative cursor-pointer outline outline-2 outline-offset-2 transition-all ${selectedLayer === name ? "outline-red-600" : "outline-transparent hover:outline-red-200"}`;
  return <div className={`min-h-[500px] ${dark ? "bg-zinc-950" : "bg-white"}`}>
    <div data-fc-selectable onClick={() => onSelect("Navigation")} className={`flex h-14 items-center border-b px-5 ${selectable("Navigation")} ${dark ? "border-zinc-800" : "border-zinc-200"}`}><b className="text-sm tracking-tight">FORGE</b><div className="ml-auto flex items-center gap-5 text-[10px] text-zinc-400"><span>Projects</span><span>Activity</span><span>Settings</span><i className="grid h-7 w-7 place-items-center rounded-full bg-red-600 not-italic text-white">R</i></div></div>
    <div className={`grid ${device === "mobile" ? "grid-cols-1" : "grid-cols-[130px_1fr]"}`}>
      {device !== "mobile" && <nav data-fc-selectable onClick={() => onSelect("App Shell")} className={`min-h-[445px] border-r p-3 ${selectable("App Shell")} ${dark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50"}`}>{["Overview", "Projects", "Canvas", "Tasks"].map((item, index) => <div key={item} className={`mb-1 rounded-lg px-2.5 py-2 text-[10px] ${index === 0 ? dark ? "bg-zinc-800 text-white" : "border border-zinc-200 bg-white" : "text-zinc-400"}`}>{item}</div>)}</nav>}
      <div data-fc-selectable onClick={() => onSelect("Dashboard")} className={`p-5 ${selectable("Dashboard")}`}>
        <div className="flex items-end justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[.16em] text-zinc-400">Workspace overview</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Build with clarity.</h2></div><button className="rounded-lg bg-red-600 px-3 py-2 text-[9px] font-semibold text-white">New project</button></div>
        <div onClick={(event) => { event.stopPropagation(); onSelect("Metric Cards"); }} className={`mt-5 grid gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-3"} ${selectable("Metric Cards")}`}>{[["Active projects","12"],["Tasks shipped","84"],["Canvas health","98%"]].map(([label,value]) => <div key={label} className={`rounded-xl border p-3 ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200"}`}><p className="font-mono text-[7px] uppercase tracking-wider text-zinc-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="text-[8px] text-red-600">↑ this week</p></div>)}</div>
        <div onClick={(event) => { event.stopPropagation(); onSelect("Recent Activity"); }} className={`mt-5 ${selectable("Recent Activity")}`}><p className="mb-2 text-xs font-semibold">Recent activity</p>{["Frontend canvas synced", "Login flow generated", "Requirement v3 approved"].map((item, index) => <div key={item} className={`mb-2 flex items-center gap-3 rounded-xl border p-3 ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200"}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 font-mono text-[8px] text-zinc-700">0{index + 1}</span><div><p className="text-[10px] font-medium">{item}</p><p className="text-[8px] text-zinc-400">Generated from requirement</p></div><span className="ml-auto font-mono text-[8px] text-zinc-400">{index + 1}h</span></div>)}</div>
      </div>
    </div>
  </div>;
}

function FrontendFlow({ artifact }: { artifact: CanvasArtifact | null }) {
  const nodes = artifact?.content.sections.slice(0, 5).map((section) => section.title) || ["Requirement", "App Shell", "Dashboard", "API Integration", "Ready for QA"];
  return <div className="mx-auto flex w-full max-w-sm flex-col items-center py-4">{nodes.map((node, index) => <div key={node} className="contents"><div className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-xs">◇</span><div><p className="text-xs font-semibold">{node}</p><p className="text-[10px] text-zinc-400">Frontend implementation node</p></div><span className="ml-auto rounded-full border border-zinc-200 px-2 py-1 font-mono text-[8px] text-zinc-400">REQ-{index + 1}</span></div>{index < nodes.length - 1 && <div className="h-7 w-px bg-zinc-300" />}</div>)}</div>;
}

function FrontendLoading() {
  return <div className="mx-auto mt-20 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-red-600"/><h2 className="mt-4 text-sm font-semibold">Preparing frontend canvas</h2><p className="mt-1 text-xs text-zinc-400">Loading layers, generated components, and requirement links…</p></div>;
}

function Inspector({ tab, selectedLayer, artifact, currentFile, copied, onCopy, onDownload }: { tab: "props" | "api" | "code" | "ai"; selectedLayer: string; artifact: CanvasArtifact | null; currentFile?: ArtifactFile; copied: boolean; onCopy: () => void; onDownload: () => void }) {
  if (tab === "code") return <div><InspectorHeader title={currentFile?.path.split("/").pop() || "Generated code"} subtitle={currentFile?.language || "tsx"}/><pre className="max-h-[480px] overflow-auto rounded-xl bg-zinc-950 p-3 text-[9px] leading-4 text-zinc-300"><code>{currentFile?.content || "Generate the artifact to inspect code."}</code></pre><div className="mt-3 flex gap-2"><SmallButton onClick={onCopy}>{copied ? "Copied" : "Copy"}</SmallButton><SmallButton onClick={onDownload}>Download</SmallButton></div></div>;
  if (tab === "api") return <div><InspectorHeader title="API connection" subtitle={selectedLayer}/>{[["Method","GET"],["Endpoint","/api/projects"],["Service","Forge API"],["State","React query"]].map(([key,value]) => <PropertyRow key={key} label={key} value={value}/>)}</div>;
  if (tab === "ai") return <div><InspectorHeader title="AI suggestions" subtitle="Context-aware"/>{["Improve accessibility", "Generate responsive state", "Extract component", "Generate tests"].map((item) => <button key={item} className="mb-2 flex w-full items-center gap-2 rounded-xl border border-zinc-200 p-3 text-left text-[11px] hover:border-zinc-400"><span className="text-red-600">✦</span>{item}<span className="ml-auto">›</span></button>)}</div>;
  return <div><InspectorHeader title={selectedLayer} subtitle="component · tsx"/><span className="mb-4 inline-flex rounded-full border border-zinc-200 px-2 py-1 font-mono text-[8px]">Selected</span>{[["display","flex"],["width","Fill container"],["gap","16 px"],["padding","20 px"],["radius","12 px"]].map(([key,value]) => <PropertyRow key={key} label={key} value={value}/>)}{artifact?.content.quality && <div className="mt-5 border-t border-zinc-200 pt-4"><p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-zinc-400">Quality checks</p>{artifact.content.quality.checks.slice(0, 4).map((check) => <div key={check.key} className="flex py-1.5 text-[10px]"><span className={check.passed ? "text-emerald-600" : "text-red-600"}>{check.passed ? "✓" : "×"}</span><span className="ml-2">{check.label}</span></div>)}</div>}</div>;
}

function InspectorHeader({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-4 flex items-center gap-3 border-b border-zinc-200 pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-zinc-50">◇</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">{subtitle}</p></div></div>; }
function PropertyRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center border-b border-zinc-100 py-2.5 text-[10px]"><span className="font-mono text-zinc-400">{label}</span><span className="ml-auto font-medium">{value}</span></div>; }
function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[10px] font-medium hover:bg-zinc-50">{children}</button>; }

function BottomPanel({ tab, artifact, project, selectedLayer }: { tab: "screen" | "component" | "request" | "tasks"; artifact: CanvasArtifact | null; project: Project; selectedLayer: string }) {
  const rows = tab === "tasks" ? artifact?.content.tasks.slice(0, 4).map((task) => [task.title, STATUS_LABEL[task.status] || task.status]) : tab === "request" ? [[`Requirement v${artifact?.requirementVersion || project.reqVersion || 0}`, artifact ? "Connected" : "Pending"], ["Source", "AI Workspace"]] : tab === "component" ? [["Selected", selectedLayer], ["Implementation", "React · TypeScript"], ["Sizing", "Responsive"]] : [["Screen", "Dashboard"], ["Route", "/dashboard"], ["Description", artifact?.content.summary || "Frontend screen generated from the latest requirement."]];
  return <div className="grid h-[149px] grid-cols-2 content-start gap-x-8 overflow-auto p-4">{rows?.map(([label,value], index) => <div key={`${label}-${index}`} className="flex border-b border-zinc-100 py-2 text-[10px]"><span className="max-w-[55%] truncate text-zinc-400">{label}</span><span className="ml-auto max-w-[45%] truncate font-medium">{value}</span></div>)}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-20 text-center"><h2 className="font-semibold text-zinc-900">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">{description}</p></div>;
}

function downloadBlob(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}
