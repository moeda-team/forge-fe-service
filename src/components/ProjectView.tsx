"use client";
import { useState } from "react";
import { useStore, STAGES } from "@/lib/store";
import type { Project } from "@/lib/types";

export default function ProjectView() {
  const projects = useStore((s) => s.projects);
  const addProject = useStore((s) => s.addProject);
  const openProject = useStore((s) => s.openProject);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const apiError = useStore((s) => s.apiError);
  const apiEnabled = useStore((s) => s.apiEnabled);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const closeCreate = () => {
    setCreating(false);
    setName("");
    setDescription("");
  };

  const submitProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addProject(name, description);
      closeCreate();
    } catch {
      // API error is rendered in the dialog.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header data-tour="projects-intro" className="px-8 py-6 border-b border-zinc-200 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-zinc-500 text-sm">every generation wrapped in one place</p>
        </div>
        <div className="flex items-center gap-2">
          {apiEnabled && user && (
            <button type="button" onClick={logout} className="rounded-xl border border-zinc-300 px-3 py-2.5 text-xs text-zinc-600 hover:border-zinc-900 hover:text-zinc-900" title={user.email}>
              Sign out
            </button>
          )}
          <button
            type="button"
            data-tour="new-project"
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            + New project
          </button>
        </div>
      </header>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} onOpen={() => openProject(p.id)} />
        ))}
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreate();
          }}
        >
          <form
            onSubmit={submitProject}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="create-project-title" className="text-lg font-semibold text-zinc-900">Create new project</h2>
                <p className="mt-1 text-sm text-zinc-500">Add the project details to start a workspace.</p>
              </div>
              <button type="button" onClick={closeCreate} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close">
                ×
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-800">Project name</span>
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Atlas"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-800">
                <span>Description</span>
                <span className="text-xs font-normal text-zinc-400">Optional</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this project about?"
                rows={4}
                className="w-full resize-none rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Deskripsi yang lebih detail membantu AI mengenali konteks, tujuan, dan kebutuhan project dengan lebih baik.
              </p>
            </label>

            {apiError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{apiError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeCreate} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Cancel
              </button>
              <button type="submit" disabled={!name.trim() || saving} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? "Creating…" : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-900 transition hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white grid place-items-center font-bold">{p.name[0]}</div>
        <span className="text-[11px] text-zinc-400">{p.updated}</span>
      </div>
      <div className="mt-4 font-semibold">{p.name}</div>
      <div className="text-xs text-zinc-500">{p.type}</div>
      <div className="mt-3 text-xs text-zinc-500 line-clamp-2">{p.desc}</div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-[11px] px-2 py-1 rounded-full border ${p.live ? "border-zinc-300 text-zinc-600" : "border-emerald-300 text-emerald-600"}`}>
          {p.live ? `In flight · ${STAGES[p.stage]}` : "Shipped"}
        </span>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-zinc-400">{p.prog}%</div>
          <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-violet-700" style={{ width: `${p.prog}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}
