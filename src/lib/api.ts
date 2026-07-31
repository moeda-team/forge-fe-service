import type { CNode, KanbanCard, Project, Requirement, Screen } from "./types";
import type { PersistedWorkspace } from "./workspaceStorage";

const API_URL = process.env.NEXT_PUBLIC_FORGE_API_URL ?? "http://localhost:4000";
type Envelope<T> = { data: T };
type Session = { accessToken: string; user: { id: string; email: string; name: string } };
let accessToken: string | null = null;
let activeWorkspaceId: string | null = null;
export const session = { get token() { return accessToken; }, clear() { accessToken = null; }, set(token: string) { accessToken = token; } };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers: { "content-type": "application/json", ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...init.headers } });
  const body = await response.json().catch(() => null) as Envelope<T> | { error?: { message?: string } } | null;
  if (!response.ok) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? "Forge API request failed");
  return (body as Envelope<T>).data;
}
export const authApi = {
  async register(name: string, email: string, password: string) { const result = await request<Session>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }); accessToken = result.accessToken; return result; },
  async login(email: string, password: string) { const result = await request<Session>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); accessToken = result.accessToken; return result; },
  async restore() { const result = await request<Session>("/api/v1/auth/refresh", { method: "POST", body: "{}" }); accessToken = result.accessToken; return result; },
  async logout() { await request<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST", body: "{}" }); accessToken = null; },
};
type RemoteProject = { id: string; name: string; type: string; description: string; stage: number; progress: number; live: boolean; updatedAt: string };
type RemoteRequirement = { version: number; content: Requirement; kanbanSyncedVersion: number | null; updatedAt: string } | null;
type RemoteCard = { id: string; title: string; canvas: string | null; requirementRef: string | null; status: "BACKLOG" | "TODO" | "PROGRESS" | "DONE" };
const statusMap = { BACKLOG: "backlog", TODO: "todo", PROGRESS: "progress", DONE: "done" } as const;
function projectFromRemote(project: RemoteProject, requirement: RemoteRequirement, cards: RemoteCard[]): Project {
  const kanban = { backlog: [] as KanbanCard[], todo: [] as KanbanCard[], progress: [] as KanbanCard[], done: [] as KanbanCard[] };
  cards.forEach((card) => kanban[statusMap[card.status]].push({ id: card.id, title: card.title, canvas: card.canvas, reqRef: card.requirementRef ?? undefined, status: statusMap[card.status] }));
  return { id: project.id, name: project.name, type: project.type, stage: project.stage as Project["stage"], prog: project.progress, live: project.live, req: !!requirement, requirement: requirement?.content, reqVersion: requirement?.version, reqUpdatedAt: requirement ? new Date(requirement.updatedAt).getTime() : undefined, kanbanSyncedVer: requirement?.kanbanSyncedVersion ?? undefined, kanban, owners: [], desc: project.description, updated: new Date(project.updatedAt).toLocaleDateString() };
}
function nestedNodes(nodes: Array<Record<string, unknown>>): CNode[] {
  const map = new Map<string, CNode>(); const roots: CNode[] = [];
  nodes.forEach((node) => map.set(String(node.id), { id: String(node.id), type: node.type as CNode["type"], parentId: typeof node.parentId === "string" ? node.parentId : undefined, name: typeof node.name === "string" ? node.name : undefined, x: Number(node.x), y: Number(node.y), w: Number(node.width), h: Number(node.height), rotation: Number(node.rotation ?? 0), zIndex: Number(node.zIndex ?? 0), visible: node.visible !== false, locked: node.locked === true, props: (node.props ?? {}) as CNode["props"], children: [] }));
  map.forEach((node) => { if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children!.push(node); else roots.push(node); }); return roots;
}
export async function hydrateWorkspace(): Promise<{ workspaceId: string; projects: Project[]; screens: Screen[]; aiLog: PersistedWorkspace["aiLog"] }> {
  const me = await request<{ workspaces: Array<{ id: string }> }>("/api/v1/me"); const workspaceId = me.workspaces[0]?.id; if (!workspaceId) throw new Error("No workspace is available");
  activeWorkspaceId = workspaceId;
  const listed = await request<{ items: RemoteProject[] }>(`/api/v1/workspaces/${workspaceId}/projects`);
  const data = await Promise.all(listed.items.map(async (project) => { const [requirement, cards, messages, screens] = await Promise.all([request<RemoteRequirement>(`/api/v1/projects/${project.id}/requirement`), request<RemoteCard[]>(`/api/v1/projects/${project.id}/kanban`), request<Array<{ role: "user" | "assistant"; content: string; createdAt: string }>>(`/api/v1/projects/${project.id}/chat`), request<Array<Record<string, unknown>>>(`/api/v1/projects/${project.id}/canvas`)]); return { project: projectFromRemote(project, requirement, cards), messages, screens: screens.map((screen) => ({ name: String(screen.name), w: Number(screen.width), h: Number(screen.height), projectId: project.id, nodes: nestedNodes((screen.nodes ?? []) as Array<Record<string, unknown>>) })) }; }));
  return { workspaceId, projects: data.map((entry) => entry.project), screens: data.flatMap((entry) => entry.screens), aiLog: Object.fromEntries(data.map((entry) => [entry.project.id, entry.messages.map((message) => ({ role: message.role === "assistant" ? "ai" as const : "user" as const, text: message.content, at: new Date(message.createdAt).getTime() }))])) };
}
export async function importLocalWorkspace(workspaceId: string, snapshot: PersistedWorkspace) { return request(`/api/v1/workspaces/${workspaceId}/imports/local-workspace`, { method: "POST", body: JSON.stringify(snapshot) }); }
export async function persistCanvas(projectId: string, screen: Screen, guides: unknown[] = []) { const flatten = (nodes: CNode[], parentId?: string): Array<Record<string, unknown>> => nodes.flatMap((node, index) => [{ id: node.id, type: node.type, parentId: node.parentId ?? parentId, name: node.name, x: node.x, y: node.y, width: node.w, height: node.h, rotation: node.rotation ?? 0, zIndex: node.zIndex ?? index, visible: node.visible !== false, locked: node.locked === true, props: node.props }, ...(node.children ? flatten(node.children, node.id) : [])]); return request(`/api/v1/projects/${projectId}/canvas/screens/${encodeURIComponent(screen.name)}`, { method: "PATCH", body: JSON.stringify({ name: screen.name, width: screen.w, height: screen.h, nodes: flatten(screen.nodes), guides }) }); }
export async function createProject(workspaceId: string, name: string, description = "") { return request<RemoteProject>(`/api/v1/workspaces/${workspaceId}/projects`, { method: "POST", body: JSON.stringify({ name, description }) }); }
export async function createCurrentWorkspaceProject(name: string, description = "") { if (!activeWorkspaceId) throw new Error("Workspace is not hydrated"); return createProject(activeWorkspaceId, name, description); }
export async function assistantMessage(projectId: string, message: string) { return request<{ message: string; requirement: { version: number; content: Requirement } }>(`/api/v1/projects/${projectId}/assistant/messages`, { method: "POST", body: JSON.stringify({ message }) }); }
export async function syncKanban(projectId: string) { return request<{ cards: RemoteCard[]; version: number }>(`/api/v1/projects/${projectId}/kanban/sync`, { method: "POST", body: "{}" }); }
