"use client";

import { useCallback, useEffect, useState } from "react";
import { forgeApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ArtifactKind, CanvasArtifact } from "@/lib/types";

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
