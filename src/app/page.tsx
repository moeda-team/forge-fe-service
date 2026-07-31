"use client";
import { useCallback, useEffect, useState } from "react";
import { getScreen, replaceScreens, SCREENS, useStore, useCanvas } from "@/lib/store";
import { loadWorkspace, saveWorkspace, withoutTransientCanvasData } from "@/lib/workspaceStorage";
import { hydrateWorkspace, importLocalWorkspace, persistCanvas } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ProjectView from "@/components/ProjectView";
import AIWorkspace from "@/components/AIWorkspace";
import Kanban from "@/components/Kanban";
import DesignCanvas from "@/components/DesignCanvas";
import ProductTour, { TOUR_STORAGE_KEY } from "@/components/ProductTour";
import AuthGate from "@/components/AuthGate";

export default function Home() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const prevView = useStore((s) => s.prevView);
  const canvasMode = useCanvas((s) => s.canvas.mode);
  const canvasScreen = useCanvas((s) => s.canvas.screen);
  const [navigationReady, setNavigationReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  const hydrate = useCallback(async () => {
    const recovery = loadWorkspace();
    const remote = await hydrateWorkspace();
    if (remote.projects.length === 0 && recovery?.projects.length) {
      try { await importLocalWorkspace(remote.workspaceId, recovery); } catch { /* one-time imports are intentionally safe to retry after refresh */ }
      const imported = await hydrateWorkspace();
      replaceScreens(imported.screens); useStore.setState({ projects: imported.projects, currentId: imported.projects[0]?.id ?? null, aiLog: imported.aiLog });
    } else { replaceScreens(remote.screens); useStore.setState({ projects: remote.projects, currentId: remote.projects[0]?.id ?? null, aiLog: remote.aiLog }); }
    setAuthenticated(true); setNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    try {
      const saved = window.sessionStorage.getItem("forge:location");
      const location = saved ? JSON.parse(saved) as { view?: string; canvasMode?: "board" | "screen"; canvasScreen?: string } : null;
      const reopenCanvas = window.location.hash === "#design" || location?.view === "design";
      if (reopenCanvas) {
        if (location?.canvasScreen) useCanvas.getState().setCanvasScreen(location.canvasScreen);
        useCanvas.getState().setCanvasMode("screen");
        setView("design");
      }
    } catch {
      window.sessionStorage.removeItem("forge:location");
    }
  }, [authenticated, setView]);

  useEffect(() => {
    if (!navigationReady) return;
    let timeout: number | undefined;
    const save = () => {
      if (timeout) window.clearTimeout(timeout);
      const projectState = useStore.getState();
      const canvasState = useCanvas.getState().canvas;
      saveWorkspace({
        version: 1,
        projects: projectState.projects,
        currentId: projectState.currentId,
        aiLog: projectState.aiLog,
        screens: SCREENS,
        canvas: withoutTransientCanvasData(canvasState),
      });
    };
    const scheduleSave = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(save, 250);
    };
    const unsubscribeStore = useStore.subscribe(scheduleSave);
    const unsubscribeCanvas = useCanvas.subscribe(scheduleSave);
    window.addEventListener("pagehide", save);
    scheduleSave();
    const saveRemoteCanvas = () => { const state = useStore.getState(); const screen = getScreen(useCanvas.getState().canvas.screen); if (state.currentId && screen?.projectId === state.currentId) void persistCanvas(state.currentId, screen, useCanvas.getState().canvas.guides).catch(() => undefined); };
    const remoteTimer = window.setInterval(saveRemoteCanvas, 2000);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      unsubscribeStore();
      unsubscribeCanvas();
      window.removeEventListener("pagehide", save);
      window.clearInterval(remoteTimer);
      saveRemoteCanvas();
      save();
    };
  }, [navigationReady]);

  useEffect(() => {
    if (!navigationReady) return;
    if (view === "design" && canvasMode !== "screen") {
      useCanvas.getState().setCanvasMode("screen");
      return;
    }
    window.sessionStorage.setItem("forge:location", JSON.stringify({ view, canvasScreen }));
    const nextHash = view === "design" ? "#design" : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [canvasMode, canvasScreen, navigationReady, view]);

  useEffect(() => {
    if (!navigationReady || view !== "projects" || tourStep !== null) return;
    if (window.localStorage.getItem(TOUR_STORAGE_KEY) === "complete") return;
    const timer = window.setTimeout(() => setTourStep(0), 0);
    return () => window.clearTimeout(timer);
  }, [navigationReady, tourStep, view]);

  const handleBack = () => {
    setView(prevView || "projects");
  };

  if (!authenticated) return <AuthGate onAuthenticated={hydrate} />;
  if (!navigationReady) return <div className="h-screen bg-zinc-50" />;

  return (
    <div className="h-screen flex bg-zinc-50 text-zinc-900">
      {view !== "projects" && view !== "design" && <Sidebar />}
      {view === "projects" && <ProjectView />}
      {view === "ai" && <AIWorkspace />}
      {view === "kanban" && <Kanban />}
      {view === "design" && <DesignCanvas onBack={handleBack} />}
      {tourStep !== null && <ProductTour step={tourStep} onStepChange={setTourStep} onClose={() => setTourStep(null)} />}
    </div>
  );
}
