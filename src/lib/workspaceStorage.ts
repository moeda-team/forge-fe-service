import type { CNode, Guide, Project, Screen } from "./types";

export const WORKSPACE_STORAGE_KEY = "forge:workspace:v1";

export type PersistedCanvas = {
  screen?: string;
  zoom?: number;
  pan?: { x: number; y: number };
  guides?: Guide[];
  canvasBg?: string;
  canvasBgOpacity?: number;
  showCanvasBg?: boolean;
  showAlignmentGrid?: boolean;
  showRulers?: boolean;
  showMinimap?: boolean;
};

export type PersistedWorkspace = {
  version: 1;
  projects: Project[];
  currentId: string | null;
  aiLog: Record<string, { role: "ai" | "user"; text: string; at?: number }[]>;
  screens: Screen[];
  canvas: PersistedCanvas;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isScreen(value: unknown): value is Screen {
  return isRecord(value) && typeof value.name === "string" && typeof value.w === "number" && typeof value.h === "number" && Array.isArray(value.nodes) && value.nodes.every(isValidScreenNode);
}

export function loadWorkspace(): PersistedWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(WORKSPACE_STORAGE_KEY) ?? "null");
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.projects) || !Array.isArray(parsed.screens) || !parsed.screens.every(isScreen)) return null;
    return {
      version: 1,
      projects: parsed.projects as Project[],
      currentId: typeof parsed.currentId === "string" ? parsed.currentId : null,
      aiLog: isRecord(parsed.aiLog) ? parsed.aiLog as PersistedWorkspace["aiLog"] : {},
      screens: parsed.screens,
      canvas: isRecord(parsed.canvas) ? parsed.canvas as PersistedCanvas : {},
    };
  } catch {
    return null;
  }
}

export function saveWorkspace(workspace: PersistedWorkspace): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}

export function cloneScreens(screens: Screen[]): Screen[] {
  return JSON.parse(JSON.stringify(screens)) as Screen[];
}

export function withoutTransientCanvasData(canvas: PersistedCanvas): PersistedCanvas {
  return {
    screen: canvas.screen,
    zoom: canvas.zoom,
    pan: canvas.pan,
    guides: canvas.guides,
    canvasBg: canvas.canvasBg,
    canvasBgOpacity: canvas.canvasBgOpacity,
    showCanvasBg: canvas.showCanvasBg,
    showAlignmentGrid: canvas.showAlignmentGrid,
    showRulers: canvas.showRulers,
    showMinimap: canvas.showMinimap,
  };
}

export function isValidScreenNode(value: unknown): value is CNode {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.type === "string"
    && typeof value.x === "number"
    && typeof value.y === "number"
    && typeof value.w === "number"
    && typeof value.h === "number"
    && isRecord(value.props)
    && (value.children === undefined || (Array.isArray(value.children) && value.children.every(isValidScreenNode)));
}
