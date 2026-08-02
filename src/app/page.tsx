"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore, useCanvas } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import ProjectView from "@/components/ProjectView";
import AIWorkspace from "@/components/AIWorkspace";
import Kanban from "@/components/Kanban";
import ProductTour, { TOUR_STORAGE_KEY } from "@/components/ProductTour";
import AuthGate from "@/components/AuthGate";
import ArtifactCanvas from "@/components/ArtifactCanvas";

const DesignCanvas = dynamic(() => import("@/components/DesignCanvas"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-50" aria-label="Loading Design Canvas" />,
});

export default function Home() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const prevView = useStore((s) => s.prevView);
  const canvasMode = useCanvas((s) => s.canvas.mode);
  const canvasScreen = useCanvas((s) => s.canvas.screen);
  const [navigationReady, setNavigationReady] = useState(false);
  const [locationRestored, setLocationRestored] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const apiEnabled = useStore((s) => s.apiEnabled);
  const apiReady = useStore((s) => s.apiReady);
  const authRequired = useStore((s) => s.authRequired);
  const bootstrapApi = useStore((s) => s.bootstrapApi);
  const currentId = useStore((s) => s.currentId);
  const openProject = useStore((s) => s.openProject);
  const artifactKind = useStore((s) => s.artifactKind);
  const setArtifactCanvas = useStore((s) => s.setArtifactCanvas);

  useEffect(() => { void bootstrapApi(); }, [bootstrapApi]);

  useEffect(() => {
    setNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!navigationReady || (apiEnabled && !apiReady) || locationRestored) return;
    try {
      const saved = window.sessionStorage.getItem("forge:location");
      const location = saved ? JSON.parse(saved) as { view?: string; currentId?: string; canvasScreen?: string; artifactKind?: "frontend" | "backend" | "database" | "testing" } : null;
      const targetView = location?.view;
      if (!authRequired && location?.currentId && ["ai", "kanban", "design", "artifact"].includes(targetView || "")) {
        openProject(location.currentId);
        if (targetView === "artifact" && location.artifactKind) setArtifactCanvas(location.artifactKind);
        else if (targetView && targetView !== "ai") setView(targetView as "kanban" | "design");
      }
      const reopenCanvas = window.location.hash === "#design" || targetView === "design";
      if (reopenCanvas) {
        if (location?.canvasScreen) useCanvas.getState().setCanvasScreen(location.canvasScreen);
        useCanvas.getState().setCanvasMode("screen");
        setView("design");
      }
    } catch {
      window.sessionStorage.removeItem("forge:location");
    } finally {
      setLocationRestored(true);
    }
  }, [apiEnabled, apiReady, authRequired, locationRestored, navigationReady, openProject, setArtifactCanvas, setView]);

  useEffect(() => {
    if (!navigationReady || !locationRestored) return;
    if (view === "design" && canvasMode !== "screen") {
      useCanvas.getState().setCanvasMode("screen");
      return;
    }
    window.sessionStorage.setItem("forge:location", JSON.stringify({ view, currentId, canvasScreen, artifactKind }));
    const nextHash = view === "design" ? "#design" : view === "artifact" ? `#${artifactKind}` : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [artifactKind, canvasMode, canvasScreen, currentId, locationRestored, navigationReady, view]);

  useEffect(() => {
    if (!navigationReady || view !== "projects" || tourStep !== null) return;
    if (window.localStorage.getItem(TOUR_STORAGE_KEY) !== "complete") setTourStep(0);
  }, [navigationReady, tourStep, view]);

  const handleBack = () => {
    setView(prevView || "projects");
  };

  if (!navigationReady || !locationRestored || (apiEnabled && !apiReady)) return <div className="h-screen bg-zinc-50" />;
  if (apiEnabled && authRequired) return <AuthGate />;

  return (
    <div className="h-screen flex bg-zinc-50 text-zinc-900">
      {view !== "projects" && view !== "design" && !(view === "artifact" && artifactKind === "frontend") && <Sidebar />}
      {view === "projects" && <ProjectView />}
      {view === "ai" && <AIWorkspace />}
      {view === "kanban" && <Kanban />}
      {view === "design" && <DesignCanvas onBack={handleBack} />}
      {view === "artifact" && <ArtifactCanvas />}
      {tourStep !== null && <ProductTour step={tourStep} onStepChange={setTourStep} onClose={() => setTourStep(null)} />}
    </div>
  );
}
