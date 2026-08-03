import type { ArtifactKind, CanvasArtifact, CNode, Guide, HistoryEntry, KanbanCard, OrchestrationRun, Project, Requirement, ScreenSettings } from "./types";

// API traffic is deliberately same-origin. The Next.js route handler proxies it to
// FORGE_API_URL, so refresh cookies stay first-party and secrets never enter JS.
const API_PREFIX = "/api/v1";
export const apiEnabled = process.env.NEXT_PUBLIC_FORGE_API_ENABLED === "true";

let accessToken: string | null = null;
let workspaceId: string | null = null;
let refreshInFlight: Promise<void> | null = null;

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function getAccessToken() { return accessToken; }
export function setAccessToken(token: string | null) { accessToken = token; }

type Envelope<T> = { data: T; meta?: { requestId?: string } };
type Failure = { error?: { code?: string; message?: string } };

async function refresh() {
  if (!refreshInFlight) refreshInFlight = (async () => {
    const response = await fetch(`${API_PREFIX}/auth/refresh`, { method: "POST", credentials: "include", cache: "no-store" });
    const payload = await response.json().catch(() => null) as Envelope<{ accessToken: string }> | Failure | null;
    if (!response.ok || !payload || !("data" in payload)) {
      accessToken = null;
      throw new ApiError(response.status, (payload as Failure | null)?.error?.code || "SESSION_EXPIRED", (payload as Failure | null)?.error?.message || "Your session has expired");
    }
    accessToken = payload.data.accessToken;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, "API_DISABLED", "Backend API is not enabled");
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as Envelope<T> | Failure | null;
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    await refresh();
    return request<T>(path, init, false);
  }
  if (!response.ok || !payload || !("data" in payload)) {
    if (response.status === 401) accessToken = null;
    const failure = payload as Failure | null;
    throw new ApiError(response.status, failure?.error?.code || "REQUEST_FAILED", failure?.error?.message || "Request failed");
  }
  return payload.data;
}

type Workspace = { id: string; name: string; role: string };
type ApiMe = { user: { id: string; email: string; name?: string }; workspaces: Workspace[] };
type RawProject = Record<string, unknown>;
type RawScreen = { id: string; name: string; width: number; height: number; revision?: number; settings?: Partial<ScreenSettings> };
type ApiRequirement = Requirement & { version?: number; updatedAt?: string; createdAt?: string };
type ApiRequirementVersion = ApiRequirement & { id: string; version: number; sentAt?: string | null; snapshots?: { version: number; requirementData: Requirement; sentAt: string }[] };
type ApiRequirementHistory = { current?: ApiRequirementVersion | null; history: ApiRequirementVersion[] };
type ApiChatHistory = { items: { id: string; role: "ai" | "user"; text: string; model?: string | null; at: number }[]; nextCursor?: string | null };

function requireWorkspace() {
  if (!workspaceId) throw new ApiError(409, "WORKSPACE_REQUIRED", "No workspace is available for this account");
  return workspaceId;
}

function apiCard(card: Record<string, unknown>): KanbanCard {
  return { id: String(card.id), title: String(card.title), canvas: card.canvas as string | null | undefined, reqRef: card.requirementRef as string | undefined, requirementKey: card.requirementKey as string | null | undefined, requirementVersion: card.requirementVersion as number | null | undefined, obsolete: Boolean(card.obsolete), order: Number(card.position ?? 0), status: String(card.status).toLowerCase() as KanbanCard["status"] };
}

function groupCards(cards: unknown): NonNullable<Project["kanban"]> {
  const grouped: NonNullable<Project["kanban"]> = { backlog: [], todo: [], progress: [], done: [] };
  for (const card of Array.isArray(cards) ? cards : []) {
    const mapped = apiCard(card as Record<string, unknown>);
    grouped[mapped.status]?.push(mapped);
  }
  for (const status of Object.keys(grouped) as Array<keyof typeof grouped>) grouped[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return grouped;
}

function toApiProject(raw: RawProject): ApiProjectDetail {
  const requirementDocument = raw.requirement as { content?: ApiRequirement; version?: number; updatedAt?: string } | null | undefined;
  const requirement = requirementDocument?.content ? { ...requirementDocument.content, version: requirementDocument.version, updatedAt: requirementDocument.updatedAt } : undefined;
  return {
    id: String(raw.id), name: String(raw.name), type: String(raw.type ?? "Project"), stage: Number(raw.stage ?? 0), prog: Number(raw.progress ?? 0), live: Boolean(raw.live), req: Boolean(requirement), owners: [], desc: String(raw.description ?? ""), updated: raw.updatedAt ? new Date(String(raw.updatedAt)).toLocaleDateString() : "now",
    reqVersion: requirement?.version, reqUpdatedAt: requirement?.updatedAt, requirement, kanban: groupCards(raw.kanban),
  };
}

function screen(raw: RawScreen): ApiScreen { return { id: raw.id, name: raw.name, w: raw.width, h: raw.height, revision: raw.revision ?? 0, settings: raw.settings }; }

// Keep this representation aligned with the backend's `Node` DTO.  Canvas UI
// state (such as `expanded` and `selected`) must never be persisted.
type StoredNode = Pick<CNode, "id" | "type" | "parentId" | "name" | "x" | "y" | "rotation" | "zIndex" | "visible" | "locked" | "props"> & {
  width: number;
  height: number;
  children?: never;
};

function flattenNodes(nodes: CNode[], parentId?: string): StoredNode[] {
  return nodes.flatMap((node) => {
    const { children, parentId: explicitParent } = node;
    const stored: StoredNode = {
      id: node.id,
      type: node.type,
      parentId: explicitParent ?? parentId,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.w,
      height: node.h,
      rotation: node.rotation,
      zIndex: node.zIndex,
      visible: node.visible,
      locked: node.locked,
      props: node.props,
    };
    return [stored, ...(children ? flattenNodes(children, node.id) : [])];
  });
}

function hydrateNodes(nodes: Array<StoredNode | Record<string, unknown>>): CNode[] {
  const mapped = new Map<string, CNode>();
  const roots: CNode[] = [];
  for (const raw of nodes) {
    const value = raw as Record<string, unknown>;
    const rest = { ...value };
    const width = rest.width;
    const height = rest.height;
    delete rest.width;
    delete rest.height;
    delete rest.children;
    mapped.set(String(value.id), { ...rest, id: String(value.id), type: value.type as CNode["type"], x: Number(value.x), y: Number(value.y), w: Number(width), h: Number(height), props: (value.props || {}) as CNode["props"] } as CNode);
  }
  for (const raw of nodes) {
    const node = mapped.get(String((raw as Record<string, unknown>).id))!;
    const parentId = node.parentId;
    const parent = parentId ? mapped.get(parentId) : undefined;
    if (parent) (parent.children ||= []).push(node); else roots.push(node);
  }
  const sort = (items: CNode[]) => { items.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)); items.forEach((item) => item.children && sort(item.children)); };
  sort(roots);
  return roots;
}

export const forgeApi = {
  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; user: ApiMe["user"] }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
    accessToken = result.accessToken;
    return result.user;
  },
  async register(name: string, email: string, password: string) {
    const result = await request<{ accessToken: string; user: ApiMe["user"] }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }, false);
    accessToken = result.accessToken;
    return result.user;
  },
  async me() { const result = await request<ApiMe>("/me"); workspaceId = result.workspaces[0]?.id ?? null; return result; },
  async logout() { try { await request("/auth/logout", { method: "POST" }, false); } finally { accessToken = null; workspaceId = null; } },
  async listProjects() { const result = await request<{ items: RawProject[] }>(`/workspaces/${requireWorkspace()}/projects`); return result.items.map(toApiProject); },
  async getProject(id: string) { return toApiProject(await request<RawProject>(`/projects/${id}`)); },
  async createProject(name: string, desc: string) { return toApiProject(await request<RawProject>(`/workspaces/${requireWorkspace()}/projects`, { method: "POST", body: JSON.stringify({ name, description: desc, type: "Project" }) })); },
  async uploadAsset(projectId: string, file: Blob, name = "asset") {
    const presigned = await request<{ asset: ApiAsset; uploadUrl: string }>(`/workspaces/${requireWorkspace()}/assets/presign`, { method: "POST", body: JSON.stringify({ projectId, filename: name, contentType: file.type || "application/octet-stream", size: file.size }) });
    const put = await fetch(presigned.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
    if (!put.ok) throw new ApiError(put.status, "ASSET_UPLOAD_FAILED", "Object storage rejected the upload");
    const asset = await request<ApiAsset>(`/workspaces/${requireWorkspace()}/assets/complete`, { method: "POST", body: JSON.stringify({ assetId: presigned.asset.id }) });
    const read = await request<{ url: string }>(`/workspaces/${requireWorkspace()}/assets/${asset.id}/url`);
    return { ...asset, url: read.url };
  },
  async getChatHistory(projectId: string, limit = 100, cursor?: string) { const result = await request<{ items: { id: string; role: string; text: string; model?: string | null; at: number }[]; nextCursor?: string | null }>(`/ai/chat/${projectId}?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`); return { ...result, items: result.items.map((item) => ({ ...item, role: item.role === "assistant" ? "ai" : "user" as const })) } as ApiChatHistory; },
  async getRequirementHistory(projectId: string) { const entries = await request<Array<{ id: string; version: number; content: Requirement; sentAt: string }>>(`/projects/${projectId}/requirement/history`); return { history: entries.map((entry) => ({ id: entry.id, version: entry.version, ...entry.content, sentAt: entry.sentAt })) }; },
  async chat(projectId: string, text: string, model?: string, attachments?: Record<string, number>) { const result = await request<{ role: string; text: string; mode: "gemini" | "local"; model?: string; requirement: { content: Requirement; version: number } }>("/ai/chat", { method: "POST", body: JSON.stringify({ projectId, text, model, attachments }) }); return { role: "ai", text: result.text, mode: result.mode, model: result.model, requirement: { ...result.requirement.content, version: result.requirement.version }, history: [] }; },
  syncKanban: (projectId: string) => request<KanbanSyncResult>(`/projects/${projectId}/kanban/sync`, { method: "POST" }),
  async reorderKanban(projectId: string, cards: { id: string; status: KanbanCard["status"]; order: number }[]) { return groupCards(await request<Record<string, unknown>[]>(`/projects/${projectId}/kanban/reorder`, { method: "PATCH", body: JSON.stringify({ cards: cards.map((card) => ({ id: card.id, status: card.status.toUpperCase(), position: card.order })) }) })); },
  async listScreens(projectId: string) { return (await request<RawScreen[]>(`/projects/${projectId}/canvas`)).map(screen); },
  async createScreen(projectId: string, name: string, w = 1440, h = 1024, settings?: Partial<ScreenSettings>) { return screen(await request<RawScreen>(`/projects/${projectId}/canvas/screens`, { method: "POST", body: JSON.stringify({ name, width: w, height: h, settings, nodes: [], guides: [] }) })); },
  async getScreenDocument(screenId: string) { const result = await request<{ id: string; nodes: StoredNode[]; guides: Guide[]; settings?: Partial<ScreenSettings>; revision: number }>(`/screens/${screenId}/nodes`); return { ...result, nodes: hydrateNodes(result.nodes) }; },
  async saveScreenDocument(screenId: string, input: { revision: number; name: string; w: number; h: number; nodes: CNode[]; guides: Guide[]; settings: Partial<ScreenSettings>; history?: Pick<HistoryEntry, "action" | "payload" | "inverse" | "affectedIds"> }) { return request<{ id: string; revision: number; stale: boolean; updatedAt: string }>(`/screens/${screenId}/document`, { method: "PUT", body: JSON.stringify({ ...input, width: input.w, height: input.h, nodes: flattenNodes(input.nodes) }) }); },
  async patchScreenDocument(screenId: string, input: { revision: number; name: string; w: number; h: number; addedNodes: CNode[]; updatedNodes: CNode[]; deletedIds: string[]; guides: Guide[]; settings: Partial<ScreenSettings>; history?: Pick<HistoryEntry, "action" | "payload" | "inverse" | "affectedIds"> }) { const current = await this.getScreenDocument(screenId); const nodes = new Map(current.nodes.map((node) => [node.id, node])); input.updatedNodes.forEach((node) => nodes.set(node.id, node)); input.addedNodes.forEach((node) => nodes.set(node.id, node)); input.deletedIds.forEach((id) => nodes.delete(id)); return this.saveScreenDocument(screenId, { ...input, nodes: Array.from(nodes.values()) }); },
  saveScreenNodes: (screenId: string, nodes: CNode[]) => request(`/screens/${screenId}/nodes`, { method: "PUT", body: JSON.stringify({ nodes: flattenNodes(nodes) }) }),
  saveScreenGuides: (screenId: string, guides: Guide[]) => request(`/screens/${screenId}/guides`, { method: "PUT", body: JSON.stringify({ guides }) }),
  async updateScreen(screenId: string, input: { name?: string; w?: number; h?: number; settings?: Partial<ScreenSettings> }) { return screen(await request<RawScreen>(`/screens/${screenId}`, { method: "PATCH", body: JSON.stringify({ name: input.name, width: input.w, height: input.h, settings: input.settings }) })); },
  deleteScreen: (screenId: string) => request<void>(`/screens/${screenId}`, { method: "DELETE" }),
  async duplicateScreen(screenId: string, name: string) { return screen(await request<RawScreen>(`/screens/${screenId}/duplicate`, { method: "POST", body: JSON.stringify({ name }) })); },
  getScreenHistory: (screenId: string, limit = 50) => request<ApiHistoryEntry[]>(`/screens/${screenId}/history?limit=${limit}`),
  saveScreenHistory: (screenId: string, entry: HistoryEntry) => request<ApiHistoryEntry>(`/screens/${screenId}/history`, { method: "POST", body: JSON.stringify({ action: entry.action, payload: entry.payload, inverse: entry.inverse, affectedIds: entry.affectedIds }) }),
  listArtifacts: (projectId: string) => request<CanvasArtifact[]>(`/projects/${projectId}/artifacts`),
  async orchestrateArtifacts(projectId: string, kinds?: ArtifactKind[]) { const result = await request<{ artifacts: CanvasArtifact[] }>(`/projects/${projectId}/artifacts/orchestrate`, { method: "POST", body: JSON.stringify(kinds ? { kinds } : {}) }); return result.artifacts; },
  getArtifactBundle: (projectId: string) => request<{ format: string; version: number; project: { id: string; name: string; requirementVersion: number }; exportedAt: string; artifacts: CanvasArtifact[] }>(`/projects/${projectId}/artifacts/bundle`),
  getLatestOrchestration: (projectId: string) => request<OrchestrationRun | null>(`/projects/${projectId}/orchestration/latest`),
  listOrchestrationRuns: (projectId: string, limit = 10) => request<OrchestrationRun[]>(`/projects/${projectId}/orchestration/runs?limit=${limit}`),
  runOrchestration: (projectId: string, trigger: OrchestrationRun["trigger"] = "automatic", kinds?: ArtifactKind[]) => request<OrchestrationRun>(`/projects/${projectId}/orchestration/run`, { method: "POST", body: JSON.stringify({ trigger, ...(kinds ? { kinds } : {}) }) }),
};

export type ApiScreen = { id: string; name: string; w: number; h: number; revision: number; settings?: Partial<ScreenSettings> };
export type ApiAsset = { id: string; projectId?: string | null; objectKey: string; filename?: string; contentType?: string; size: number };
type ApiHistoryEntry = { id: string; action: HistoryEntry["action"]; payload: unknown; inverse: unknown; affectedIds: string[]; createdAt: string };
export type KanbanSyncResult = { added: number; updated: number; obsolete: number; version: number };
type ApiProject = Omit<Project, "stage" | "reqUpdatedAt"> & { stage: number; reqUpdatedAt?: string | null };
type ApiProjectDetail = ApiProject & { requirement?: ApiRequirement | null; kanban?: Project["kanban"] };

export function mapProject(project: ApiProject | ApiProjectDetail): Project { const requirement = project.requirement as ApiRequirement | undefined; return { ...project, stage: Math.max(0, Math.min(4, project.stage)) as Project["stage"], owners: Array.isArray(project.owners) ? project.owners : [], reqUpdatedAt: project.reqUpdatedAt ? new Date(project.reqUpdatedAt).getTime() : undefined, requirement: requirement ? mapRequirement(requirement) : undefined, reqVersion: requirement?.version || project.reqVersion, kanban: project.kanban }; }
export function mapRequirement(requirement: ApiRequirement): Requirement { return { prd: requirement.prd, stories: requirement.stories || [], fr: requirement.fr || [], nfr: requirement.nfr || [], ac: requirement.ac || [], rules: requirement.rules || [] }; }
export function mapRequirementSnapshots(payload: ApiRequirementHistory) { const snapshots = new Map<number, { version: number; requirement: Requirement; sentAt: number }>(); for (const version of payload.history || []) { for (const snapshot of version.snapshots || []) snapshots.set(snapshot.version, { version: snapshot.version, requirement: mapRequirement(snapshot.requirementData), sentAt: new Date(snapshot.sentAt).getTime() }); if (!snapshots.has(version.version) && version.sentAt) snapshots.set(version.version, { version: version.version, requirement: mapRequirement(version), sentAt: new Date(version.sentAt).getTime() }); } return Array.from(snapshots.values()).sort((a, b) => a.version - b.version); }
