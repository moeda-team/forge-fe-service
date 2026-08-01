import type { ArtifactKind, CanvasArtifact, CNode, Guide, HistoryEntry, KanbanCard, OrchestrationRun, Project, Requirement, ScreenSettings } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_FORGE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "forge:access-token";

export const apiEnabled = Boolean(API_URL);

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "API_DISABLED", "Backend API URL is not configured");
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    if (response.status === 401) setAccessToken(null);
    throw new ApiError(response.status, payload?.error?.code || "REQUEST_FAILED", payload?.error?.message || "Request failed");
  }
  return payload as T;
}

export const forgeApi = {
  async login(email: string, password: string) {
    const result = await request<{ token: string; user: { id: string; email: string; name?: string } }>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    setAccessToken(result.token);
    return result.user;
  },
  async register(name: string, email: string, password: string) {
    const result = await request<{ token: string; user: { id: string; email: string; name?: string } }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ name, email, password }),
    });
    setAccessToken(result.token);
    return result.user;
  },
  me: () => request<{ id: string; email: string; name?: string }>("/api/auth/me"),
  listProjects: () => request<ApiProject[]>("/api/projects"),
  getProject: (id: string) => request<ApiProjectDetail>(`/api/projects/${id}`),
  createProject: (name: string, desc: string) => request<ApiProject>("/api/projects", {
    method: "POST", body: JSON.stringify({ name, desc, type: "Project" }),
  }),
  getChatHistory: (projectId: string, limit = 100, cursor?: string) =>
    request<ApiChatHistory>(`/api/ai/chat/${projectId}?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
  getRequirementHistory: (projectId: string) =>
    request<ApiRequirementHistory>(`/api/projects/${projectId}/requirement`),
  chat: (projectId: string, text: string, model?: string, attachments?: Record<string, number>) =>
    request<ApiChatResult>("/api/ai/chat", {
      method: "POST", body: JSON.stringify({ projectId, text, model, attachments }),
    }),
  syncKanban: (projectId: string) => request<KanbanSyncResult>(`/api/projects/${projectId}/kanban/sync`, { method: "POST" }),
  reorderKanban: (projectId: string, cards: { id: string; status: KanbanCard["status"]; order: number }[]) =>
    request<NonNullable<Project["kanban"]>>(`/api/projects/${projectId}/kanban/reorder`, {
      method: "PATCH", body: JSON.stringify({ cards }),
    }),
  listScreens: (projectId: string) => request<ApiScreen[]>(`/api/projects/${projectId}/screens`),
  createScreen: (projectId: string, name: string, w = 1440, h = 1024, settings?: Partial<ScreenSettings>) => request<ApiScreen>(`/api/projects/${projectId}/screens`, {
    method: "POST", body: JSON.stringify({ name, w, h, settings }),
  }),
  getScreenDocument: (screenId: string) => request<{ id: string; nodes: CNode[]; guides: Guide[]; settings?: Partial<ScreenSettings>; revision: number }>(`/api/screens/${screenId}/nodes`),
  saveScreenDocument: (screenId: string, input: {
    revision: number;
    name: string;
    w: number;
    h: number;
    nodes: CNode[];
    guides: Guide[];
    settings: Partial<ScreenSettings>;
    history?: Pick<HistoryEntry, "action" | "payload" | "inverse" | "affectedIds">;
  }) => request<{ id: string; name: string; w: number; h: number; revision: number; stale: boolean; updatedAt: string }>(`/api/screens/${screenId}/document`, {
    method: "PUT", body: JSON.stringify(input),
  }),
  saveScreenNodes: (screenId: string, nodes: CNode[]) => request(`/api/screens/${screenId}/nodes`, {
    method: "PUT", body: JSON.stringify({ nodes }),
  }),
  saveScreenGuides: (screenId: string, guides: Guide[]) => request(`/api/screens/${screenId}/guides`, {
    method: "PUT", body: JSON.stringify({ guides }),
  }),
  updateScreen: (screenId: string, input: { name?: string; w?: number; h?: number; settings?: Partial<ScreenSettings> }) => request<ApiScreen>(`/api/screens/${screenId}`, {
    method: "PATCH", body: JSON.stringify(input),
  }),
  deleteScreen: (screenId: string) => request<void>(`/api/screens/${screenId}`, { method: "DELETE" }),
  duplicateScreen: (screenId: string, name: string) => request<ApiScreen>(`/api/screens/${screenId}/duplicate`, {
    method: "POST", body: JSON.stringify({ name }),
  }),
  getScreenHistory: (screenId: string, limit = 50) => request<ApiHistoryEntry[]>(`/api/screens/${screenId}/history?limit=${limit}`),
  saveScreenHistory: (screenId: string, entry: HistoryEntry) => request<ApiHistoryEntry>(`/api/screens/${screenId}/history`, {
    method: "POST",
    body: JSON.stringify({ action: entry.action, payload: entry.payload, inverse: entry.inverse, affectedIds: entry.affectedIds }),
  }),
  listArtifacts: (projectId: string) => request<CanvasArtifact[]>(`/api/projects/${projectId}/artifacts`),
  orchestrateArtifacts: (projectId: string, kinds?: ArtifactKind[]) => request<CanvasArtifact[]>(`/api/projects/${projectId}/artifacts/orchestrate`, {
    method: "POST", body: JSON.stringify(kinds ? { kinds } : {}),
  }),
  getArtifactBundle: (projectId: string) => request<{ format: string; version: number; project: { id: string; name: string; requirementVersion: number }; exportedAt: string; artifacts: CanvasArtifact[] }>(`/api/projects/${projectId}/artifacts/bundle`),
  getLatestOrchestration: (projectId: string) => request<OrchestrationRun | null>(`/api/projects/${projectId}/orchestration/latest`),
  listOrchestrationRuns: (projectId: string, limit = 10) => request<OrchestrationRun[]>(`/api/projects/${projectId}/orchestration/runs?limit=${limit}`),
  runOrchestration: (projectId: string, trigger: OrchestrationRun["trigger"] = "automatic", kinds?: ArtifactKind[]) => request<OrchestrationRun>(`/api/projects/${projectId}/orchestration/run`, {
    method: "POST", body: JSON.stringify({ trigger, ...(kinds ? { kinds } : {}) }),
  }),
};

export type ApiScreen = { id: string; name: string; w: number; h: number; revision: number; settings?: Partial<ScreenSettings> };
type ApiHistoryEntry = { id: string; action: HistoryEntry["action"]; payload: unknown; inverse: unknown; affectedIds: string[]; createdAt: string };
export type KanbanSyncResult = { added: number; updated: number; obsolete: number; version: number };

type ApiRequirement = Requirement & { version?: number; updatedAt?: string; createdAt?: string };

type ApiRequirementVersion = ApiRequirement & {
  id: string;
  version: number;
  sentAt?: string | null;
  snapshots?: { version: number; requirementData: Requirement; sentAt: string }[];
};

type ApiRequirementHistory = {
  current?: ApiRequirementVersion | null;
  history: ApiRequirementVersion[];
};

type ApiChatHistory = {
  items: { id: string; role: "ai" | "user"; text: string; model?: string | null; at: number }[];
  nextCursor?: string | null;
};

type ApiProject = Omit<Project, "stage" | "reqUpdatedAt"> & {
  stage: number;
  reqUpdatedAt?: string | null;
};

type ApiProjectDetail = ApiProject & {
  requirement?: ApiRequirement | null;
  kanban?: Project["kanban"];
};

type ApiChatResult = {
  role: "ai";
  text: string;
  mode: "gemini" | "local";
  model?: string;
  requirement: ApiRequirement;
  history: { role: "ai" | "user"; text: string; at: number }[];
};

export function mapProject(project: ApiProject | ApiProjectDetail): Project {
  const detail = project as ApiProjectDetail;
  return {
    ...project,
    stage: Math.max(0, Math.min(4, project.stage)) as Project["stage"],
    owners: Array.isArray(project.owners) ? project.owners : [],
    reqUpdatedAt: project.reqUpdatedAt ? new Date(project.reqUpdatedAt).getTime() : undefined,
    requirement: detail.requirement ? mapRequirement(detail.requirement) : undefined,
    reqVersion: detail.requirement?.version || project.reqVersion,
    kanban: detail.kanban ? mapKanban(detail.kanban) : undefined,
  };
}

export function mapRequirement(requirement: ApiRequirement): Requirement {
  return {
    prd: requirement.prd,
    stories: requirement.stories || [],
    fr: requirement.fr || [],
    nfr: requirement.nfr || [],
    ac: requirement.ac || [],
    rules: requirement.rules || [],
  };
}

export function mapRequirementSnapshots(payload: ApiRequirementHistory) {
  const snapshots = new Map<number, { version: number; requirement: Requirement; sentAt: number }>();
  for (const version of payload.history || []) {
    for (const snapshot of version.snapshots || []) {
      snapshots.set(snapshot.version, {
        version: snapshot.version,
        requirement: mapRequirement(snapshot.requirementData as ApiRequirement),
        sentAt: new Date(snapshot.sentAt).getTime(),
      });
    }
    if (!snapshots.has(version.version) && version.sentAt) {
      snapshots.set(version.version, {
        version: version.version,
        requirement: mapRequirement(version),
        sentAt: new Date(version.sentAt).getTime(),
      });
    }
  }
  return Array.from(snapshots.values()).sort((a, b) => a.version - b.version);
}

function mapKanban(kanban: NonNullable<Project["kanban"]>) {
  const mapCards = (cards: KanbanCard[] = []) => cards.map((card) => ({ ...card, status: card.status }));
  return {
    backlog: mapCards(kanban.backlog),
    todo: mapCards(kanban.todo),
    progress: mapCards(kanban.progress),
    done: mapCards(kanban.done),
  };
}
