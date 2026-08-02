"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { forgeApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ArtifactFile, ArtifactKind, CanvasArtifact, Project } from "@/lib/types";
import { ApplicationFlowGraph, FlowBottom, FlowInspector, FlowSidebar, type FlowScope, type FlowState } from "./FrontendApplicationFlow";

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
  const setView = useStore((state) => state.setView);
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
      currentFile={currentFile}
      copied={copied}
      onCopyFile={() => void copyFile()}
      onDownloadFile={downloadFile}
      onGenerate={() => void orchestrate()}
      onExport={() => void downloadBundle()}
      onBack={() => setView("projects")}
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
  currentFile?: ArtifactFile;
  copied: boolean;
  onCopyFile: () => void;
  onDownloadFile: () => void;
  onGenerate: () => void;
  onExport: () => void;
  onBack: () => void;
};

function FrontendArtifactCanvas({ project, artifact, loading, error, synced, currentFile, copied, onCopyFile, onDownloadFile, onGenerate, onExport, onBack }: FrontendCanvasProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mode, setMode] = useState<"inspect" | "flow">("flow");
  const [leftTab, setLeftTab] = useState<"pages" | "data" | "components">("pages");
  const [flowScope, setFlowScope] = useState<FlowScope>("application");
  const [inspectorTab, setInspectorTab] = useState<"overview" | "props" | "data" | "actions" | "api" | "states" | "code">("api");
  const [bottomTab, setBottomTab] = useState<"overview" | "flow" | "requests" | "mappings" | "states" | "issues">("flow");
  const [inspectBottomTab, setInspectBottomTab] = useState<"screen" | "request" | "response" | "issues">("screen");
  const [flowState, setFlowState] = useState<FlowState>("success");
  const [selectedPage, setSelectedPage] = useState<"login" | "dashboard">("login");
  const [selectedLayer, setSelectedLayer] = useState("Login Form");
  const [selectedEndpoint, setSelectedEndpoint] = useState("POST /api/auth/login");
  const [environment, setEnvironment] = useState("Development");
  const [testingRequest, setTestingRequest] = useState(false);
  const [requestTested, setRequestTested] = useState(false);
  const [zoom, setZoom] = useState(0.67);
  const [pan, setPan] = useState({ x: 48, y: 48 });
  const [panning, setPanning] = useState(false);
  const [query, setQuery] = useState("");
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const deviceWidth = device === "desktop" ? 760 : device === "tablet" ? 560 : 330;
  const canvasContentWidth = mode === "flow" ? 1740 : deviceWidth;
  const fitCanvas = useCallback(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const nextZoom = Math.min(.9, Math.max(.3, (bounds.width - 80) / canvasContentWidth));
    setZoom(nextZoom);
    setPan({ x: Math.max(40, (bounds.width - canvasContentWidth * nextZoom) / 2), y: 48 });
  }, [canvasContentWidth]);

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
        <button type="button" onClick={onBack} title="Back to projects" aria-label="Back to projects" className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-zinc-950 text-sm font-semibold text-white transition-transform hover:scale-105">F</button>
        <div className="min-w-0 border-l border-zinc-200 pl-4">
          <div className="truncate text-sm font-semibold">{project.name}</div>
          <div className="truncate text-[11px] text-zinc-400">Frontend Canvas · <span className="text-zinc-700">{mode === "flow" ? "Authentication Flow" : `${selectedPage === "login" ? "Login" : "Dashboard"} · ${selectedLayer}`}</span></div>
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
        <label className="hidden rounded-xl border border-zinc-200 px-3 py-1 lg:block"><span className="block text-[8px] text-zinc-400">Environment</span><select aria-label="Environment" value={environment} onChange={(event) => setEnvironment(event.target.value)} className="bg-transparent text-[11px] font-medium outline-none"><option>Development</option><option>Staging</option><option>Production</option></select></label>
        <button type="button" onClick={() => { setTestingRequest(true); window.setTimeout(() => { setTestingRequest(false); setRequestTested(true); }, 650); }} disabled={testingRequest} className="hidden rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 lg:block">{testingRequest ? "Testing…" : "Test Flow"}</button>
        <button type="button" onClick={onGenerate} disabled={loading || !project.requirement} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 disabled:opacity-40">{loading ? "Syncing…" : artifact ? "Regenerate" : "Generate"}</button>
        <button type="button" onClick={onExport} disabled={!artifact} className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] lg:flex ${synced ? "border-zinc-900 text-zinc-800" : "border-red-200 text-red-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${synced ? "bg-red-600" : "bg-amber-500"}`} />{synced ? `Synced · v${artifact?.requirementVersion}` : "Needs update"}</button>
      </header>

      {error && <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">{error}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)_270px] max-xl:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-200 bg-white">
          {mode === "inspect" ? <div className="flex border-b border-zinc-200 px-2 pt-2">{(["pages", "data", "components"] as const).map((tab) => <button key={tab} type="button" onClick={() => setLeftTab(tab)} className={`border-b-2 px-3 py-2 text-[10px] capitalize ${leftTab === tab ? "border-blue-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>)}</div> : <div className="border-b border-zinc-200 px-4 py-3 text-xs font-semibold">Flows</div>}
          <div className="p-3"><div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3"><span className="text-zinc-400">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "flow" ? "Search flows" : leftTab === "data" ? "Search data sources…" : "Search…"} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></div>{mode === "flow" && <div className="mt-3 flex rounded-xl border border-zinc-200 p-1">{(["application","page","data"] as FlowScope[]).map((scope) => <ToolbarChoice key={scope} active={flowScope === scope} onClick={() => setFlowScope(scope)}>{scope[0].toUpperCase()+scope.slice(1)}</ToolbarChoice>)}</div>}{mode === "inspect" && leftTab === "data" && <button type="button" className="mt-3 rounded-lg border border-zinc-200 px-3 py-2 text-[10px] font-medium hover:bg-zinc-50">＋ Add data source</button>}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {mode === "flow" ? <FlowSidebar query={query} scope={flowScope} /> : <><p className="px-2 pb-2 pt-1 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">{leftTab}</p>{leftTab === "data" ? <DataSources selected={selectedEndpoint} onSelect={(endpoint) => { setSelectedEndpoint(endpoint); setInspectorTab("api"); }} /> : leftTab === "components" ? (selectedPage === "login" ? ["Login Form", "Email Input", "Password Input", "Remember Me", "Login Button", "Error Message"] : ["Dashboard Shell", "Metric Card", "Activity List", "New Project Button"]).map((item) => <SideItem key={item} active={selectedLayer === item} label={item} meta="tsx" onClick={() => setSelectedLayer(item)} />) : ["Login", "Dashboard"].map((page) => { const pageId = page.toLowerCase() as "login" | "dashboard"; return <SideItem key={page} active={selectedPage === pageId} label={page} meta={`/${pageId}`} onClick={() => { setSelectedPage(pageId); setSelectedLayer(pageId === "login" ? "Login Form" : "Dashboard Shell"); setSelectedEndpoint(pageId === "login" ? "POST /api/auth/login" : "GET /api/dashboard"); }} />; })}</>}
            {!artifact && !loading && <p className="px-2 py-8 text-center text-xs leading-5 text-zinc-400">Generate the frontend artifact to populate real layers and components.</p>}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="flex min-h-12 items-center gap-3 border-b border-zinc-200 bg-white px-4">
            <div className="flex rounded-xl border border-zinc-200 p-1">
              <ToolbarChoice active={mode === "inspect"} onClick={() => { setMode("inspect"); setLeftTab("pages"); setSelectedPage("login"); setSelectedLayer("Login Form"); setInspectorTab("overview"); }}>Inspect</ToolbarChoice>
              <ToolbarChoice active={mode === "flow"} onClick={() => { setMode("flow"); setInspectorTab("api"); }}>Flow</ToolbarChoice>
            </div>
            {mode === "flow" && <div className="flex rounded-xl border border-zinc-200 p-1">{(["application","page","data"] as FlowScope[]).map((scope) => <ToolbarChoice key={scope} active={flowScope === scope} onClick={() => setFlowScope(scope)}>{scope[0].toUpperCase()+scope.slice(1)}</ToolbarChoice>)}</div>}
            <div className="ml-auto flex gap-4 font-mono text-[9px] uppercase tracking-wider text-zinc-400"><span>{mode === "flow" ? "Login → Dashboard" : `${selectedPage === "login" ? "/login" : "/dashboard"} / ${selectedLayer}`}</span><span>REQ-AUTH-001</span>{mode === "flow" && <span className="text-emerald-600">● Healthy</span>}</div>
          </div>
          {mode === "flow" && <div className="flex h-10 items-center gap-2 border-b border-zinc-200 bg-white px-4"><span className="mr-auto font-mono text-[9px] text-zinc-400">Authentication Flow / Login / Submit Action</span>{(["live","loading","success","empty","error","unauthorized"] as FlowState[]).map((state) => <button key={state} onClick={() => setFlowState(state)} className={`rounded-lg px-2 py-1 text-[9px] capitalize ${flowState === state ? "bg-blue-600 font-semibold text-white" : "bg-zinc-100 text-zinc-500"}`}>{state}</button>)}</div>}
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
            {loading && !artifact ? <FrontendLoading /> : mode === "flow" ? <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}><ApplicationFlowGraph state={flowState} scope={flowScope}/></div> : (
              <div className="absolute left-0 top-0 origin-top-left transition-[width] duration-300" style={{ width: deviceWidth, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <div className={`overflow-hidden rounded-[22px] border shadow-[0_24px_70px_rgba(0,0,0,.12)] ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-white" : "border-zinc-200 bg-white"}`}>
                  <div className={`flex h-9 items-center gap-1.5 border-b px-4 ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><i className="h-1.5 w-1.5 rounded-full bg-zinc-300"/><span className="ml-auto font-mono text-[9px] text-zinc-400">{device === "desktop" ? "Desktop · 1440px" : device === "tablet" ? "Tablet · 834px" : "Mobile · 390px"}</span></div>
                  <FrontendPreview page={selectedPage} theme={theme} device={device} selectedLayer={selectedLayer} onSelect={setSelectedLayer} />
                </div>
              </div>
            )}
          </div>
          <div className="h-[190px] shrink-0 border-t border-zinc-200 bg-white">
            <div className="flex h-10 items-center border-b border-zinc-200 px-3">
              {mode === "flow" ? (["overview", "flow", "requests", "mappings", "states", "issues"] as const).map((tab) => <button key={tab} type="button" onClick={() => setBottomTab(tab)} className={`h-full border-b-2 px-3 text-[10px] capitalize ${bottomTab === tab ? "border-blue-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>) : (["screen","request","response","issues"] as const).map((tab) => <button key={tab} type="button" onClick={() => setInspectBottomTab(tab)} className={`h-full border-b-2 px-3 text-[10px] capitalize ${inspectBottomTab === tab ? "border-blue-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>)}
            </div>
            {mode === "flow" ? <FlowBottom /> : <BottomPanel tab={inspectBottomTab} page={selectedPage} artifact={artifact} project={project} selectedEndpoint={selectedEndpoint} requestTested={requestTested} environment={environment} />}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-l border-zinc-200 bg-white max-xl:hidden">
          <div className="flex flex-wrap gap-2 border-b border-zinc-200 p-3">{["Frontend Synced", "API Connected", "Backend Healthy", "6 actions connected"].map((status) => <span key={status} className="rounded-full border border-zinc-200 px-2 py-1 text-[8px] font-medium"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"/>{status}</span>)}</div>
          <div className="flex border-b border-zinc-200 px-2">
            {(["overview", "data", "actions", "api", "states", "code"] as const).map((tab) => <button key={tab} type="button" onClick={() => setInspectorTab(tab)} className={`border-b-2 px-1.5 py-3 text-[9px] uppercase ${inspectorTab === tab ? "border-blue-600 font-medium text-zinc-900" : "border-transparent text-zinc-400"}`}>{tab}</button>)}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">{mode === "flow" && inspectorTab === "api" ? <FlowInspector testing={testingRequest} tested={requestTested} onTest={() => { setTestingRequest(true); window.setTimeout(() => { setTestingRequest(false); setRequestTested(true); }, 650); }} /> : <Inspector tab={inspectorTab === "states" || inspectorTab === "overview" ? "props" : inspectorTab} selectedLayer={selectedLayer} artifact={artifact} currentFile={currentFile} copied={copied} onCopy={onCopyFile} onDownload={onDownloadFile} selectedEndpoint={selectedEndpoint} testing={testingRequest} tested={requestTested} onTest={() => { setTestingRequest(true); window.setTimeout(() => { setTestingRequest(false); setRequestTested(true); }, 650); }} />}</div>
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

function DataSources({ selected, onSelect }: { selected: string; onSelect: (endpoint: string) => void }) {
  const groups = [{ name: "Dashboard", endpoints: ["GET /api/dashboard", "GET /api/activity"] }, { name: "Projects", endpoints: ["POST /api/projects"] }];
  return <div><div className="mb-3 rounded-xl border border-zinc-200 p-3"><div className="flex items-center text-[11px] font-semibold">Forge Backend<span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">Connected</span></div><p className="mt-1 truncate font-mono text-[8px] text-zinc-400">Base URL: http://localhost:4000</p></div>{groups.map((group) => <div key={group.name} className="mb-3"><div className="mb-1 flex items-center px-2 text-[11px] font-semibold"><span className="mr-2 h-2 w-2 rounded-full border-2 border-blue-500"/>{group.name}<span className="ml-auto text-zinc-400">•••</span></div>{group.endpoints.map((endpoint) => { const [method, path] = endpoint.split(" "); return <button type="button" key={endpoint} onClick={() => onSelect(endpoint)} className={`mb-1 flex w-full items-center rounded-lg px-2 py-2 text-left ${selected === endpoint ? "bg-blue-50 ring-1 ring-blue-100" : "hover:bg-zinc-50"}`}><span className={`mr-2 rounded px-1.5 py-1 font-mono text-[8px] font-semibold ${method === "POST" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{method}</span><span className="truncate font-mono text-[9px]">{path}</span></button>; })}</div>)}</div>;
}

function FrontendPreview({ page, theme, device, selectedLayer, onSelect }: { page: "login" | "dashboard"; theme: "light" | "dark"; device: "desktop" | "tablet" | "mobile"; selectedLayer: string; onSelect: (value: string) => void }) {
  const dark = theme === "dark";
  const selectable = (name: string) => `relative cursor-pointer outline outline-2 outline-offset-2 transition-all ${selectedLayer === name ? "outline-blue-600" : "outline-transparent hover:outline-blue-200"}`;
  if (page === "login") return <LoginPagePreview dark={dark} device={device} selectedLayer={selectedLayer} onSelect={onSelect} />;
  return <div className={`min-h-[500px] ${dark ? "bg-zinc-950" : "bg-white"}`}>
    <div data-fc-selectable onClick={() => onSelect("Navigation")} className={`flex h-14 items-center border-b px-5 ${selectable("Navigation")} ${dark ? "border-zinc-800" : "border-zinc-200"}`}><b className="text-sm tracking-tight">FORGE</b><div className="ml-auto flex items-center gap-5 text-[10px] text-zinc-400"><span>Projects</span><span>Activity</span><span>Settings</span><i className="grid h-7 w-7 place-items-center rounded-full bg-red-600 not-italic text-white">R</i></div></div>
    <div className={`grid ${device === "mobile" ? "grid-cols-1" : "grid-cols-[130px_1fr]"}`}>
      {device !== "mobile" && <nav data-fc-selectable onClick={() => onSelect("App Shell")} className={`min-h-[445px] border-r p-3 ${selectable("App Shell")} ${dark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50"}`}>{["Overview", "Projects", "Canvas", "Tasks"].map((item, index) => <div key={item} className={`mb-1 rounded-lg px-2.5 py-2 text-[10px] ${index === 0 ? dark ? "bg-zinc-800 text-white" : "border border-zinc-200 bg-white" : "text-zinc-400"}`}>{item}</div>)}</nav>}
      <div data-fc-selectable onClick={() => onSelect("Dashboard")} className={`p-5 ${selectable("Dashboard")}`}>
        <div className="flex items-end justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[.16em] text-zinc-400">Workspace overview</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Build with clarity.</h2></div><button className="rounded-lg bg-blue-600 px-3 py-2 text-[9px] font-semibold text-white">New project</button></div>
        <div onClick={(event) => { event.stopPropagation(); onSelect("Metric Cards"); }} className={`mt-5 grid gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-3"} ${selectable("Metric Cards")}`}>{[["Active projects","12"],["Tasks shipped","84"],["Canvas health","98%"]].map(([label,value]) => <div key={label} className={`rounded-xl border p-3 ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200"}`}><p className="font-mono text-[7px] uppercase tracking-wider text-zinc-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="text-[8px] text-red-600">↑ this week</p></div>)}</div>
        <div onClick={(event) => { event.stopPropagation(); onSelect("Recent Activity"); }} className={`mt-5 ${selectable("Recent Activity")}`}><p className="mb-2 text-xs font-semibold">Recent activity</p>{["Frontend canvas synced", "Login flow generated", "Requirement v3 approved"].map((item, index) => <div key={item} className={`mb-2 flex items-center gap-3 rounded-xl border p-3 ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200"}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 font-mono text-[8px] text-zinc-700">0{index + 1}</span><div><p className="text-[10px] font-medium">{item}</p><p className="text-[8px] text-zinc-400">Generated from requirement</p></div><span className="ml-auto font-mono text-[8px] text-zinc-400">{index + 1}h</span></div>)}</div>
      </div>
    </div>
  </div>;
}

function LoginPagePreview({ dark, device, selectedLayer, onSelect }: { dark: boolean; device: "desktop" | "tablet" | "mobile"; selectedLayer: string; onSelect: (value: string) => void }) {
  const selected = (name: string) => `cursor-pointer outline outline-2 outline-offset-2 transition-all ${selectedLayer === name ? "outline-blue-500" : "outline-transparent hover:outline-blue-200"}`;
  return <div className={`min-h-[500px] ${dark ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-900"}`}>
    <header className={`flex h-14 items-center border-b px-6 ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"}`}><b className="text-sm tracking-tight">FORGE</b><div className="ml-auto flex items-center gap-5 text-[10px] text-zinc-400"><span>Product</span><span>Docs</span><span>Support</span></div></header>
    <main className={`grid min-h-[446px] ${device === "mobile" ? "place-items-center p-4" : "grid-cols-[1fr_1fr]"}`}>
      {device !== "mobile" && <section className="flex flex-col justify-between bg-blue-600 p-8 text-white"><div><span className="rounded-full border border-white/30 px-2 py-1 font-mono text-[8px]">FORGE WORKSPACE</span><h2 className="mt-8 max-w-[260px] text-3xl font-semibold leading-tight">Turn requirements into shipped products.</h2><p className="mt-3 max-w-[270px] text-[10px] leading-5 text-blue-100">Design, connect, test, and deliver every product surface from one workspace.</p></div><p className="text-[9px] text-blue-200">Trusted by modern product teams.</p></section>}
      <section className={`flex items-center justify-center p-6 ${dark ? "bg-zinc-950" : "bg-white"}`}>
        <div data-fc-selectable onClick={() => onSelect("Login Form")} className={`w-full max-w-[300px] rounded-2xl border p-6 shadow-sm ${selected("Login Form")} ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"}`}>
          <div className="mb-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-xs font-semibold text-white">F</span><h1 className="mt-4 text-xl font-semibold tracking-tight">Welcome back</h1><p className="mt-1 text-[10px] text-zinc-400">Sign in to continue to your workspace</p></div>
          <label data-fc-selectable onClick={(event) => { event.stopPropagation(); onSelect("Email Input"); }} className={`mb-3 block text-[9px] font-medium ${selected("Email Input")}`}>Email address<input readOnly value="rizal@forge.app" className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-[10px] outline-none ${dark ? "border-zinc-700 bg-zinc-950" : "border-zinc-200 bg-white"}`}/></label>
          <label data-fc-selectable onClick={(event) => { event.stopPropagation(); onSelect("Password Input"); }} className={`block text-[9px] font-medium ${selected("Password Input")}`}>Password<input readOnly value="••••••••••" className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-[10px] outline-none ${dark ? "border-zinc-700 bg-zinc-950" : "border-zinc-200 bg-white"}`}/></label>
          <div className="my-3 flex items-center text-[9px]"><label data-fc-selectable onClick={(event) => { event.stopPropagation(); onSelect("Remember Me"); }} className={`flex items-center gap-2 ${selected("Remember Me")}`}><input type="checkbox" checked readOnly className="accent-blue-600"/>Remember me</label><a className="ml-auto text-blue-600">Forgot password?</a></div>
          <button data-fc-selectable onClick={(event) => { event.stopPropagation(); onSelect("Login Button"); }} className={`h-10 w-full rounded-lg bg-blue-600 text-[10px] font-semibold text-white ${selected("Login Button")}`}>Sign in</button>
          <p className="mt-4 text-center text-[9px] text-zinc-400">Don&apos;t have an account? <span className="font-medium text-blue-600">Create one</span></p>
        </div>
      </section>
    </main>
  </div>;
}

function FrontendLoading() {
  return <div className="mx-auto mt-20 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-red-600"/><h2 className="mt-4 text-sm font-semibold">Preparing frontend canvas</h2><p className="mt-1 text-xs text-zinc-400">Loading layers, generated components, and requirement links…</p></div>;
}

function Inspector({ tab, selectedLayer, artifact, currentFile, copied, onCopy, onDownload, selectedEndpoint, testing, tested, onTest }: { tab: "props" | "data" | "actions" | "api" | "code"; selectedLayer: string; artifact: CanvasArtifact | null; currentFile?: ArtifactFile; copied: boolean; onCopy: () => void; onDownload: () => void; selectedEndpoint: string; testing: boolean; tested: boolean; onTest: () => void }) {
  if (tab === "code") return <div><InspectorHeader title={currentFile?.path.split("/").pop() || "Generated code"} subtitle={currentFile?.language || "tsx"}/><pre className="max-h-[480px] overflow-auto rounded-xl bg-zinc-950 p-3 text-[9px] leading-4 text-zinc-300"><code>{currentFile?.content || "Generate the artifact to inspect code."}</code></pre><div className="mt-3 flex gap-2"><SmallButton onClick={onCopy}>{copied ? "Copied" : "Copy"}</SmallButton><SmallButton onClick={onDownload}>Download</SmallButton></div></div>;
  if (tab === "data") return <div><InspectorHeader title="Data bindings" subtitle={selectedLayer}/>{[["activeProjects","Active Projects Card"],["tasks","Tasks Card"],["coverage","Coverage Card"],["activities","Recent Activity List"]].map(([key,value]) => <div key={key} className="mb-2 rounded-xl border border-zinc-200 p-3"><div className="flex items-center text-[10px]"><span className="mr-2 text-emerald-600">✓</span><b>{key}</b><span className="mx-2 ml-auto text-zinc-400">→</span><span>{value}</span></div><p className="ml-5 mt-1 font-mono text-[8px] text-zinc-400">Mapped automatically</p></div>)}</div>;
  if (tab === "actions") return <div><InspectorHeader title="Component actions" subtitle={selectedLayer}/>{[["On page load","Fetch dashboard"],["On click","Open project"],["On success","Update bindings"],["On error","Show error toast"]].map(([key,value]) => <PropertyRow key={key} label={key} value={value}/>)}</div>;
  if (tab === "api") { const [method, endpoint] = selectedEndpoint.split(" "); return <div><InspectorHeader title="Request configuration" subtitle={selectedLayer}/><label className="mb-3 block text-[9px] text-zinc-400">METHOD<input readOnly value={method} className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 px-3 text-[10px] font-semibold text-blue-700 outline-none"/></label><label className="mb-3 block text-[9px] text-zinc-400">ENDPOINT<input readOnly value={endpoint} className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-[10px] outline-none"/></label><label className="mb-3 block text-[9px] text-zinc-400">TRIGGER<select className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 px-2 text-[10px] outline-none"><option>On page load</option><option>On click</option><option>Manual</option></select></label><label className="mb-4 block text-[9px] text-zinc-400">AUTH<select className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 px-2 text-[10px] outline-none"><option>Bearer token</option><option>Public</option><option>API key</option></select></label><div className="mb-3 flex border-b border-zinc-200"><button className="border-b-2 border-blue-600 px-2 py-2 text-[9px] text-blue-700">Query Params</button><button className="px-2 py-2 text-[9px] text-zinc-400">Headers</button><button className="ml-auto text-[9px]">＋ Add param</button></div><button type="button" onClick={onTest} disabled={testing} className="w-full rounded-lg bg-blue-600 py-2.5 text-[10px] font-semibold text-white disabled:opacity-60">{testing ? "Testing request…" : "＋ Test Request"}</button>{tested && <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700">200 OK · 183 ms</div>}<p className="mb-2 mt-4 text-[10px] font-semibold">Response Preview</p><pre className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[8px] leading-4 text-zinc-600">{JSON.stringify(FRONTEND_RESPONSE, null, 2)}</pre></div>; }
  return <div><InspectorHeader title={selectedLayer} subtitle="component · tsx"/><span className="mb-4 inline-flex rounded-full border border-zinc-200 px-2 py-1 font-mono text-[8px]">Selected</span>{[["display","flex"],["width","Fill container"],["gap","16 px"],["padding","20 px"],["radius","12 px"]].map(([key,value]) => <PropertyRow key={key} label={key} value={value}/>)}{artifact?.content.quality && <div className="mt-5 border-t border-zinc-200 pt-4"><p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-zinc-400">Quality checks</p>{artifact.content.quality.checks.slice(0, 4).map((check) => <div key={check.key} className="flex py-1.5 text-[10px]"><span className={check.passed ? "text-emerald-600" : "text-red-600"}>{check.passed ? "✓" : "×"}</span><span className="ml-2">{check.label}</span></div>)}</div>}</div>;
}

function InspectorHeader({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-4 flex items-center gap-3 border-b border-zinc-200 pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-zinc-50">◇</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">{subtitle}</p></div></div>; }
function PropertyRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center border-b border-zinc-100 py-2.5 text-[10px]"><span className="font-mono text-zinc-400">{label}</span><span className="ml-auto font-medium">{value}</span></div>; }
function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[10px] font-medium hover:bg-zinc-50">{children}</button>; }

const FRONTEND_RESPONSE = { activeProjects: 12, tasks: 84, coverage: 98, activities: [{ id: 1, title: "Frontend canvas synced", time: "2m ago" }, { id: 2, title: "Login flow generated", time: "15m ago" }] };

function BottomPanel({ tab, page, artifact, project, selectedEndpoint, requestTested, environment }: { tab: "screen" | "request" | "response" | "issues"; page: "login" | "dashboard"; artifact: CanvasArtifact | null; project: Project; selectedEndpoint: string; requestTested: boolean; environment: string }) {
  if (tab === "response") return <div className="grid h-[149px] grid-cols-[280px_1fr] overflow-hidden"><div className="border-r border-zinc-200 p-4 text-[10px]"><p className="font-semibold">{selectedEndpoint}</p><PropertyRow label="Status" value={requestTested ? "● 200 OK" : "Not tested"}/><PropertyRow label="Time" value={requestTested ? "183 ms" : "—"}/><PropertyRow label="Environment" value={environment}/></div><pre className="overflow-auto p-4 font-mono text-[8px] leading-4 text-zinc-600">{JSON.stringify(FRONTEND_RESPONSE, null, 2)}</pre></div>;
  const rows = tab === "issues" ? [["No blocking issues", "All checks passed"], ["Accessibility", "Ready"], ["API mapping", "4 connected"]] : tab === "request" ? [["Endpoint", selectedEndpoint], ["Trigger", page === "login" ? "On submit" : "On page load"], ["Auth", page === "login" ? "Public endpoint" : "Bearer token"], ["Environment", environment]] : [["Screen", page === "login" ? "Login" : "Dashboard"], ["Route", page === "login" ? "/login" : "/dashboard"], ["Requirement", `v${artifact?.requirementVersion || project.reqVersion || 0}`], ["Description", page === "login" ? "Authentication page with email, password, remember-me, and sign-in action." : artifact?.content.summary || "Dashboard generated from the latest requirement."]];
  return <div className="grid h-[149px] grid-cols-2 content-start gap-x-8 overflow-auto p-4">{rows.map(([label,value], index) => <div key={`${label}-${index}`} className="flex border-b border-zinc-100 py-2 text-[10px]"><span className="max-w-[55%] truncate text-zinc-400">{label}</span><span className="ml-auto max-w-[45%] truncate font-medium">{value}</span></div>)}</div>;
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
