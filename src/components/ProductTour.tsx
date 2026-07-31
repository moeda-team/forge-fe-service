"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

const TOUR_STORAGE_KEY = "forge:product-tour:v1";

const STEPS = [
  {
    target: '[data-tour="projects-intro"]',
    title: "Mulai dari sebuah project",
    description: "Setiap pekerjaan di Forge tersimpan dalam project agar requirement, task, dan seluruh canvas tetap terhubung.",
  },
  {
    target: '[data-tour="new-project"]',
    title: "Buat project baru",
    description: "Masukkan nama dan deskripsi. Deskripsi yang detail membantu AI memahami konteks project dengan lebih baik.",
  },
  {
    target: '[data-tour="ai-workspace"]',
    title: "Riset bersama AI",
    description: "Gunakan AI Workspace untuk menggali kebutuhan, melakukan research, dan menyusun PRD melalui percakapan.",
  },
  {
    target: '[data-tour="requirement-panel"]',
    title: "Requirement menjadi sumber utama",
    description: "AI merangkum PRD, user stories, acceptance criteria, dan business rules dalam satu dokumen yang selalu terhubung.",
  },
  {
    target: '[data-tour="kanban-ai"]',
    title: "Task diorkestrasi otomatis",
    description: "Kanban dibuat dari requirement dan dijalankan oleh AI. Anda cukup memantau progres dan meninjau hasilnya.",
  },
  {
    target: '[data-tour="design-canvas-menu"]',
    title: "Hasil muncul di setiap canvas",
    description: "AI menghasilkan Design, Frontend, Backend, Database, dan Testing Canvas berdasarkan task yang telah disusun.",
  },
] as const;

type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

export default function ProductTour({ step, onStepChange, onClose }: { step: number; onStepChange: (step: number) => void; onClose: () => void }) {
  const projects = useStore((state) => state.projects);
  const openProject = useStore((state) => state.openProject);
  const setView = useStore((state) => state.setView);
  const [rect, setRect] = useState<Rect | null>(null);
  const current = STEPS[step];

  const finish = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "complete");
    onClose();
  };

  useEffect(() => {
    const update = () => {
      const element = document.querySelector(current.target);
      if (!element) {
        setRect(null);
        return;
      }
      const next = element.getBoundingClientRect();
      setRect({
        top: next.top,
        left: next.left,
        right: next.right,
        bottom: next.bottom,
        width: next.width,
        height: next.height,
      });
    };
    update();
    const frame = window.requestAnimationFrame(update);
    const timer = window.setTimeout(update, 120);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [current.target, step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const next = () => {
    if (step === 1) {
      const project = projects.find((item) => item.id === "ATL") ?? projects[0];
      if (project) openProject(project.id);
    }
    if (step === 3) setView("kanban");
    if (step === STEPS.length - 1) {
      finish();
      return;
    }
    onStepChange(step + 1);
  };

  const previous = () => {
    if (step === 2) setView("projects");
    if (step === 4) setView("ai");
    onStepChange(Math.max(0, step - 1));
  };

  const gap = 10;
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const hole = rect ? {
    top: Math.max(8, rect.top - gap),
    left: Math.max(8, rect.left - gap),
    right: Math.min(viewportWidth - 8, rect.right + gap),
    bottom: Math.min(viewportHeight - 8, rect.bottom + gap),
  } : null;
  const popoverWidth = 340;
  const popoverHeight = 230;
  let popoverTop = Math.max(20, (viewportHeight - popoverHeight) / 2);
  let popoverLeft = Math.max(20, (viewportWidth - popoverWidth) / 2);
  if (hole) {
    if (viewportWidth - hole.right >= popoverWidth + 24) {
      popoverLeft = hole.right + 16;
      popoverTop = Math.min(Math.max(20, hole.top), viewportHeight - popoverHeight - 20);
    } else if (hole.left >= popoverWidth + 24) {
      popoverLeft = hole.left - popoverWidth - 16;
      popoverTop = Math.min(Math.max(20, hole.top), viewportHeight - popoverHeight - 20);
    } else if (viewportHeight - hole.bottom >= popoverHeight + 20) {
      popoverTop = hole.bottom + 14;
      popoverLeft = Math.min(Math.max(20, hole.left), viewportWidth - popoverWidth - 20);
    } else {
      popoverTop = Math.max(20, hole.top - popoverHeight - 14);
      popoverLeft = Math.min(Math.max(20, hole.left), viewportWidth - popoverWidth - 20);
    }
  }

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {hole ? (
        <>
          <div className="fixed left-0 right-0 top-0 bg-zinc-950/55" style={{ height: hole.top }} />
          <div className="fixed left-0 bg-zinc-950/55" style={{ top: hole.top, width: hole.left, height: hole.bottom - hole.top }} />
          <div className="fixed right-0 bg-zinc-950/55" style={{ top: hole.top, left: hole.right, height: hole.bottom - hole.top }} />
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/55" style={{ top: hole.bottom }} />
          <div className="pointer-events-none fixed rounded-2xl border-2 border-zinc-900 shadow-[0_0_0_4px_rgba(255,255,255,0.55)]" style={{ top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top }} />
        </>
      ) : <div className="fixed inset-0 bg-zinc-950/55" />}

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Product tour"
        className="fixed w-[340px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
        style={{ top: popoverTop, left: popoverLeft }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
            {step + 1} of {STEPS.length}
          </span>
          <button type="button" onClick={finish} className="text-xs font-medium text-zinc-400 hover:text-zinc-700">Skip tour</button>
        </div>
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white">✦</div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{current.title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-zinc-600">{current.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-5 bg-zinc-900" : "w-1.5 bg-zinc-200"}`} />)}
          </div>
          <div className="flex gap-2">
            {step > 0 && <button type="button" onClick={previous} className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100">Back</button>}
            <button type="button" onClick={next} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800">
              {step === STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export { TOUR_STORAGE_KEY };
