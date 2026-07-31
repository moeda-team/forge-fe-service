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

export const canvasRepository: CanvasRepository = new InMemoryCanvasRepository();
