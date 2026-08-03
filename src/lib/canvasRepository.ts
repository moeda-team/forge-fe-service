import type { Screen } from "./types";

export interface CanvasRepository {
  save(projectId: string, screens: Screen[]): Promise<void>;
  load(projectId: string): Promise<Screen[] | null>;
  delete(projectId: string): Promise<void>;
}

function copyScreens(screens: Screen[]): Screen[] {
  return JSON.parse(JSON.stringify(screens)) as Screen[];
}

export class InMemoryCanvasRepository implements CanvasRepository {
  private readonly documents = new Map<string, Screen[]>();

  async save(projectId: string, screens: Screen[]) {
    this.documents.set(projectId, copyScreens(screens));
  }

  async load(projectId: string) {
    const screens = this.documents.get(projectId);
    return screens ? copyScreens(screens) : null;
  }

  async delete(projectId: string) {
    this.documents.delete(projectId);
  }
}

export class LocalStorageCanvasRepository implements CanvasRepository {
  constructor(private readonly prefix = "forge:canvas:") {}

  async save(projectId: string, screens: Screen[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`${this.prefix}${projectId}`, JSON.stringify(copyScreens(screens)));
  }

  async load(projectId: string) {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(`${this.prefix}${projectId}`);
    if (!value) return null;
    try {
      const screens = JSON.parse(value) as Screen[];
      return Array.isArray(screens) ? copyScreens(screens) : null;
    } catch {
      // A corrupt browser entry must not prevent the canvas from opening.
      window.localStorage.removeItem(`${this.prefix}${projectId}`);
      return null;
    }
  }

  async delete(projectId: string) {
    if (typeof window !== "undefined") window.localStorage.removeItem(`${this.prefix}${projectId}`);
  }
}

export const canvasRepository: CanvasRepository = new LocalStorageCanvasRepository();
