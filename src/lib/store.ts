import { create } from "zustand";
import type { ArtifactKind, Project, Requirement, ReqItem, KanbanCard, Screen, CNode, NodeType, Guide, Tool, HistoryEntry, ScreenSettings, ViewKey } from "./types";
import { ApiError, apiEnabled, forgeApi, mapProject, mapRequirement, mapRequirementSnapshots, setAccessToken, type KanbanSyncResult } from "./api";
import { layoutAutoLayout, layoutCanvasNodes, measureCanvasText } from "./canvasLayout";

export const STAGES = ["Brief", "Design", "Build", "Launch", "Scale"];

function reqCount() {
  return { stories: 4, fr: 6, nfr: 3, ac: 4, rules: 4 };
}

export function generateRequirement(p: Project): Requirement {
  p.req = true;
  p.reqVersion = (p.reqVersion || 0) + 1;
  p.reqUpdatedAt = Date.now();
  const c = reqCount();
  return {
    prd: `${p.name} is a ${p.type.toLowerCase()} whose goal is to deliver a rapi, on-brand experience for its audience. Success is measured by clarity, consistency, and a single source of truth that every canvas consumes.`,
    stories: [
      `As a ${p.type.toLowerCase() === "brand system" ? "brand" : "user"}, I want a clear ${p.type.toLowerCase()} so that I can achieve my goal without friction.`,
      `As the team, I want the Requirement to stay the source of truth so that Design, Frontend, Backend, Database, and Testing never drift.`,
      `As a reviewer, I want acceptance criteria attached to each story so that done is unambiguous.`,
      `As an engineer, I want every canvas to link back to a requirement item so that impact is traceable.`,
    ].slice(0, c.stories),
    fr: [
      "The system shall generate PRD, user stories, FR, NFR, acceptance criteria, and business rules from conversation.",
      "The AI Workspace shall be the only entry point for creating requirements.",
      "Every canvas shall read the latest Requirement and display a sync badge when stale.",
      "The user shall not edit Design before a Requirement exists.",
      "Advancing a project shall bump its stage and progress automatically.",
      "Generated artifacts shall be persisted per project and survive navigation.",
    ].slice(0, c.fr),
    nfr: [
      "Performance: generated screens must render without layout shift.",
      "Accessibility: text contrast meets WCAG AA.",
      "Consistency: all canvases consume one shared token set.",
    ].slice(0, c.nfr),
    ac: [
      "Given a generated Requirement, when a canvas opens, it shows the linked items.",
      "Given a stale canvas, when the Requirement updates, a sync badge appears.",
      "Given a reviewer, when all AC pass, the story is marked done.",
      "Given an export, when sent to Kanban, every item becomes a task.",
    ].slice(0, c.ac),
    rules: [
      "Requirement is the single source of truth.",
      "Every canvas is a different visualization of the same Requirement.",
      "Design is locked until a Requirement exists.",
      "Changes flow from the Requirement to every canvas automatically.",
    ].slice(0, c.rules),
  };
}


function seedProjects(): Project[] {
  const base: Project[] = [
    { id: "ATL", name: "Atlas", type: "Brand system", stage: 1, prog: 40, live: true, req: false, owners: ["AK", "DN"], desc: "Identity, tokens, and the marketing site rebuild.", updated: "2h" },
    { id: "MRD", name: "Meridian", type: "Landing page", stage: 2, prog: 65, live: true, req: false, owners: ["KM"], desc: "Conversion-focused launch page with a11y pass.", updated: "5h" },
    { id: "NW", name: "Northwind", type: "Component lib", stage: 3, prog: 80, live: true, req: false, owners: ["AB", "DN"], desc: "shadcn-style blocks + token resolver.", updated: "1d" },
    { id: "PLS", name: "Pulse", type: "Email campaign", stage: 4, prog: 100, live: false, req: false, owners: ["RI"], desc: "Lifecycle series — shipped to ESP.", updated: "3d" },
    { id: "CB", name: "Cobalt", type: "Mobile screen", stage: 0, prog: 10, live: true, req: false, owners: ["AN"], desc: "Onboarding flow for the iOS app.", updated: "4h" },
    { id: "LM", name: "Lumen", type: "Ad set", stage: 2, prog: 55, live: true, req: false, owners: ["KM", "RI"], desc: "Square + story variants for Q3 push.", updated: "6h" },
    { id: "VX", name: "Vertex", type: "Dashboard", stage: 1, prog: 30, live: true, req: false, owners: ["AB"], desc: "Ops dashboard — widgets + filters.", updated: "1d" },
    { id: "HL", name: "Halo", type: "Social kit", stage: 3, prog: 75, live: true, req: false, owners: ["DN", "AN"], desc: "Reels + carousels for the launch.", updated: "8h" },
  ];
  // Atlas gets a live requirement already generated (mirrors the HTML app behavior)
  const atl = base[0];
  atl.req = true;
  atl.requirement = generateRequirement(atl);
  atl.reqUpdatedAt = Date.now() - 60000;
  return base;
}

interface StoreState {
  projects: Project[];
  apiEnabled: boolean;
  apiReady: boolean;
  authRequired: boolean;
  apiError: string | null;
  user: { id: string; email: string; name?: string } | null;
  bootstrapApi: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  currentId: string | null;
  view: ViewKey;
  prevView?: ViewKey;
  artifactKind: ArtifactKind;
  setView: (v: ViewKey) => void;
  setArtifactCanvas: (kind: ArtifactKind) => void;
  addProject: (name: string, desc?: string) => Promise<string | undefined>;
  openProject: (id: string) => void;
  current: () => Project | undefined;
  aiLog: Record<string, { role: "ai" | "user"; text: string; at?: number }[]>;
  sendChat: (text: string, model?: string, attachments?: Record<string, number>) => Promise<void>;
  sendToKanban: (id: string) => Promise<KanbanSyncResult | void>;
  moveKanbanCard: (projectId: string, cardId: string, status: KanbanCard["status"], index: number) => Promise<void>;
  refreshProject: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  projects: seedProjects(),
  apiEnabled,
  apiReady: !apiEnabled,
  authRequired: false,
  apiError: null,
  user: null,
  bootstrapApi: async () => {
    if (!apiEnabled) return;
    try {
      const session = await forgeApi.me();
      const projects = await forgeApi.listProjects();
      set({ user: session.user, projects: projects.map(mapProject), currentId: null, apiReady: true, authRequired: false, apiError: null, view: "projects" });
    } catch (error) {
      const authRequired = error instanceof ApiError && error.status === 401;
      set({ apiReady: true, authRequired, apiError: authRequired ? null : errorMessage(error), projects: [], currentId: null });
    }
  },
  login: async (email, password) => {
    set({ apiError: null });
    try {
      const user = await forgeApi.login(email, password);
      await forgeApi.me();
      const projects = await forgeApi.listProjects();
      set({ user, projects: projects.map(mapProject), currentId: null, authRequired: false, apiReady: true, view: "projects" });
    } catch (error) {
      set({ apiError: errorMessage(error) });
      throw error;
    }
  },
  register: async (name, email, password) => {
    set({ apiError: null });
    try {
      const user = await forgeApi.register(name, email, password);
      await forgeApi.me();
      const projects = await forgeApi.listProjects();
      set({ user, projects: projects.map(mapProject), currentId: null, authRequired: false, apiReady: true, view: "projects" });
    } catch (error) {
      set({ apiError: errorMessage(error) });
      throw error;
    }
  },
  logout: () => {
    void forgeApi.logout();
    setAccessToken(null);
    set({ user: null, projects: [], currentId: null, authRequired: true, view: "projects", apiError: null });
  },
  currentId: "ATL",
  view: "projects",
  artifactKind: "frontend",
  setView: (v) => {
    const st = get();
    set({ view: v, prevView: v === "design" && st.view !== "design" ? st.view : st.prevView });
  },
  setArtifactCanvas: (kind) => set({ artifactKind: kind, view: "artifact" }),
  addProject: async (name, desc = "") => {
    const cleanName = name.trim();
    if (!cleanName) return undefined;
    if (apiEnabled) {
      try {
        const created = mapProject(await forgeApi.createProject(cleanName, desc.trim()));
        set((st) => ({ projects: [created, ...st.projects], apiError: null }));
        return created.id;
      } catch (error) {
        set({ apiError: errorMessage(error) });
        throw error;
      }
    }
    const id = `PRJ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const project: Project = {
      id,
      name: cleanName,
      type: "Project",
      stage: 0,
      prog: 0,
      live: true,
      req: false,
      owners: [],
      desc: desc.trim(),
      updated: "now",
    };
    set((st) => ({ projects: [project, ...st.projects] }));
    return id;
  },
  openProject: (id) => {
    set({ currentId: id, view: "ai", apiError: null });
    if (apiEnabled) void loadProjectDetail(id, set);
  },
  current: () => get().projects.find((p) => p.id === get().currentId),
  aiLog: {},
  sendChat: async (text, model, attachments) => {
    const st = get();
    const p = st.current();
    if (!p) return;
    const now = Date.now();
    const log = st.aiLog[p.id] || [{ role: "ai" as const, text: `Requirement is live for ${p.name}. Ask me to draft the brief, generate the PRD, or run an impact analysis.`, at: now - 1 }];
    log.push({ role: "user", text, at: now });
    set({ aiLog: { ...st.aiLog, [p.id]: [...log] }, apiError: null });
    if (apiEnabled) {
      try {
        const response = await forgeApi.chat(p.id, text, model, attachments);
        const projects = get().projects.map((project) => project.id === p.id ? {
          ...project,
          req: true,
          requirement: mapRequirement(response.requirement),
          reqVersion: response.requirement.version || (project.reqVersion || 0) + 1,
          reqUpdatedAt: Date.now(),
        } : project);
        const currentLog = get().aiLog[p.id] || log;
        set({
          projects,
          aiLog: { ...get().aiLog, [p.id]: [...currentLog, { role: "ai", text: response.text, at: Date.now() }] },
          apiError: null,
        });
      } catch (error) {
        const currentLog = get().aiLog[p.id] || log;
        set({
          aiLog: { ...get().aiLog, [p.id]: [...currentLog, { role: "ai", text: `Request failed: ${errorMessage(error)}`, at: Date.now() }] },
          apiError: errorMessage(error),
        });
        throw error;
      }
      return;
    }
    if (!p.req) {
      p.requirement = generateRequirement(p);
      log.push({ role: "ai", text: `Requirement created for ${p.name}. PRD, user stories, FR/NFR, acceptance criteria, and business rules are written and live in the panel.`, at: Date.now() });
    } else {
      applyReqEdit(p, text);
      log.push({ role: "ai", text: aiReply(p, text), at: Date.now() });
    }
    set({ aiLog: { ...st.aiLog, [p.id]: [...log] } });
  },
  sendToKanban: async (id) => {
    if (apiEnabled) {
      try {
        const result = await forgeApi.syncKanban(id);
        await loadProjectDetail(id, set);
        set({ apiError: null });
        return result;
      } catch (error) {
        set({ apiError: errorMessage(error) });
        throw error;
      }
      return;
    }
    const st = get();
    const p = st.projects.find((x) => x.id === id);
    if (!p || !p.requirement) return;
    backfillKanban(p);
    clearNewFlags(p);
    const version = p.reqVersion || 1;
    p.kanbanSyncedVer = version;
    const snapshot = cloneRequirement(p.requirement);
    p.requirementHistory = [
      ...(p.requirementHistory || []).filter((entry) => entry.version !== version),
      { version, requirement: snapshot, sentAt: Date.now() },
    ].sort((a, b) => a.version - b.version);
    set({ projects: [...st.projects] });
  },
  moveKanbanCard: async (projectId, cardId, targetStatus, requestedIndex) => {
    const state = get();
    const project = state.projects.find((item) => item.id === projectId);
    if (!project?.kanban) return;
    const statuses: KanbanCard["status"][] = ["backlog", "todo", "progress", "done"];
    const previous = Object.fromEntries(statuses.map((status) => [status, project.kanban![status].map((card) => ({ ...card }))])) as NonNullable<Project["kanban"]>;
    const next = Object.fromEntries(statuses.map((status) => [status, project.kanban![status].map((card) => ({ ...card }))])) as NonNullable<Project["kanban"]>;
    let moving: KanbanCard | undefined;
    let sourceStatus: KanbanCard["status"] | undefined;
    let sourceIndex = -1;
    for (const status of statuses) {
      const found = next[status].findIndex((card) => card.id === cardId);
      if (found >= 0) {
        sourceStatus = status;
        sourceIndex = found;
        moving = next[status].splice(found, 1)[0];
        break;
      }
    }
    if (!moving || moving.obsolete) return;
    let targetIndex = Math.max(0, Math.min(requestedIndex, next[targetStatus].length));
    if (sourceStatus === targetStatus && sourceIndex < requestedIndex) targetIndex = Math.max(0, targetIndex - 1);
    moving.status = targetStatus;
    next[targetStatus].splice(targetIndex, 0, moving);
    for (const status of statuses) next[status].forEach((card, order) => { card.status = status; card.order = order; });
    set((current) => ({ projects: current.projects.map((item) => item.id === projectId ? { ...item, kanban: next } : item), apiError: null }));
    try {
      const cards = statuses.flatMap((status) => next[status].map((card, order) => ({ id: card.id, status, order })));
      const persisted = await forgeApi.reorderKanban(projectId, cards);
      set((current) => ({ projects: current.projects.map((item) => item.id === projectId ? { ...item, kanban: persisted } : item), apiError: null }));
    } catch (error) {
      set((current) => ({ projects: current.projects.map((item) => item.id === projectId ? { ...item, kanban: previous } : item), apiError: errorMessage(error) }));
      throw error;
    }
  },
  refreshProject: async (id) => loadProjectDetail(id, set),
}));

async function loadProjectDetail(
  id: string,
  set: (partial: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>)) => void,
) {
  try {
    const [projectPayload, chatPayload, requirementPayload] = await Promise.all([
      forgeApi.getProject(id),
      forgeApi.getChatHistory(id),
      forgeApi.getRequirementHistory(id),
    ]);
    const detail = {
      ...mapProject(projectPayload),
      requirementHistory: mapRequirementSnapshots(requirementPayload),
    };
    set((state) => ({
      projects: state.projects.map((project) => project.id === id ? { ...project, ...detail } : project),
      aiLog: chatPayload.items.length
        ? { ...state.aiLog, [id]: chatPayload.items.map(({ role, text, at }) => ({ role, text, at })) }
        : state.aiLog,
      apiError: null,
    }));
  } catch (error) {
    set({ apiError: errorMessage(error) });
    if (error instanceof ApiError && error.status === 401) set({ authRequired: true, user: null });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected API error";
}

function aiReply(p: Project, text: string): string {
  const t = text.toLowerCase();
  if (t.includes("brief")) return `Tight brief for ${p.name}: objective, audience, constraints from the ${STAGES[p.stage]} stage, one success metric. Pushed to the Requirement.`;
  if (t.includes("prd") || t.includes("requirement") || t.includes("generat")) return `Requirement for ${p.name} is the source of truth — PRD, user stories, FR/NFR, and acceptance criteria are listed in the panel.`;
  return `Captured your update to the Requirement for ${p.name}. It's highlighted as unsynced until you send it to Kanban.`;
}

function applyReqEdit(p: Project, v: string) {
  if (!p.requirement) return;
  const t = v.toLowerCase();
  p.reqVersion = (p.reqVersion || 1) + 1;
  p.reqUpdatedAt = Date.now();
  const r = p.requirement;
  if (t.includes("story") || t.includes("user")) r.stories.push({ text: `As a stakeholder, I want ${v.slice(0, 60).trim()} so that the team captures the latest need.`, _new: true });
  else if (t.includes("prd")) { r._newPrd = true; r.prd = `${r.prd} (Updated ${new Date().toLocaleDateString()}: ${v.slice(0, 70).trim()})`; }
  else if (t.includes("fr") || t.includes("functional")) r.fr.push({ text: `The system shall ${v.slice(0, 70).trim()} (added via chat).`, _new: true });
  else if (t.includes("nfr") || t.includes("non-functional")) r.nfr.push({ text: `${v.slice(0, 70).trim()} (added via chat).`, _new: true });
  else if (t.includes("accept") || t.includes("ac")) r.ac.push({ text: `Given the update, ${v.slice(0, 60).trim()} is accepted.`, _new: true });
  else r.rules.push({ text: `Rule: ${v.slice(0, 70).trim()} (added via chat).`, _new: true });
}

function clearNewFlags(p: Project) {
  const r = p.requirement;
  if (!r) return;
  r._newPrd = false;
  (["stories", "fr", "nfr", "ac", "rules"] as const).forEach((k) => {
    (r[k] || []).forEach((it) => { if (it && typeof it === "object") (it as ReqItem)._new = false; });
  });
}

function cloneRequirement(requirement: Requirement): Requirement {
  const cloneItem = (item: string | ReqItem): string | ReqItem =>
    typeof item === "string" ? item : { text: item.text };
  return {
    prd: requirement.prd,
    stories: requirement.stories.map(cloneItem),
    fr: requirement.fr.map(cloneItem),
    nfr: requirement.nfr.map(cloneItem),
    ac: requirement.ac.map(cloneItem),
    rules: requirement.rules.map(cloneItem),
  };
}

const KANBAN_COLS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

function kbCanvasFor(text: string) {
  const t = text.toLowerCase();
  if (/design|screen|wireframe|flow|token|component/.test(t)) return "design";
  if (/frontend|page|route|state|hook|form/.test(t)) return "frontend";
  if (/backend|endpoint|controller|service|api/.test(t)) return "backend";
  if (/database|table|column|schema|migration/.test(t)) return "database";
  if (/test|e2e|unit|integration|smoke|regression/.test(t)) return "testing";
  return null;
}

function kbSplitReq(p: Project) {
  const r = p.requirement;
  if (!r) return [];
  const txt = (x: string | ReqItem) => (typeof x === "string" ? x : x.text);
  const out: { title: string; canvas: string | null; reqRef: string; status: KanbanCard["status"] }[] = [];
  (r.stories || []).forEach((s, i) => out.push({ title: txt(s).replace(/^As [a-z]+,? /i, "").slice(0, 80), canvas: "design", reqRef: `story ${i + 1}`, status: "todo" }));
  (r.fr || []).forEach((f) => out.push({ title: txt(f).slice(0, 80), canvas: kbCanvasFor(txt(f)), reqRef: "FR", status: "progress" }));
  (r.nfr || []).forEach((n) => out.push({ title: txt(n).slice(0, 80), canvas: kbCanvasFor(txt(n)), reqRef: "NFR", status: "done" }));
  (r.ac || []).forEach((a, i) => out.push({ title: txt(a).slice(0, 80), canvas: kbCanvasFor(txt(a)), reqRef: `AC ${i + 1}`, status: "done" }));
  (r.rules || []).forEach((ru) => out.push({ title: txt(ru).slice(0, 80), canvas: null, reqRef: "BR", status: "backlog" }));
  return out;
}

export function backfillKanban(p: Project) {
  if (!p.requirement && p.req) p.requirement = generateRequirement(p);
  p.kanban = p.kanban || { backlog: [], todo: [], progress: [], done: [] };
  // if a previous fill dropped everything into backlog, re-distribute cleanly
  const allInBacklog = p.kanban.backlog.length > 0 && p.kanban.todo.length === 0 && p.kanban.progress.length === 0 && p.kanban.done.length === 0;
  if (allInBacklog) { p.kanban.todo = []; p.kanban.progress = []; p.kanban.done = []; p.kanban.backlog = []; }
  const existing = [...p.kanban.backlog, ...p.kanban.todo, ...p.kanban.progress, ...p.kanban.done];
  const seen = new Set(existing.map((c) => c.title));
  kbSplitReq(p).forEach((item) => {
    if (seen.has(item.title)) return;
    const card: KanbanCard = { id: "k" + Math.random().toString(36).slice(2, 8), title: item.title, canvas: item.canvas, reqRef: item.reqRef, status: item.status };
    p.kanban![item.status].push(card);
  });
}

function seedScreens(): Screen[] {
  const mk = (name: string, nodes: CNode[], w = 390, h = 720, projectId?: string): Screen => ({ name, w, h, nodes, projectId });
  const nid = (t: NodeType, x: number, y: number, w: number, h: number, props: CNode["props"], extra: Partial<CNode> = {}): CNode => ({
    id: "n" + Math.random().toString(36).slice(2, 8), type: t, x, y, w, h, name: props.text || t, props, ...extra,
  });
  // New design files start with a clean canvas; content is added by the user.
  const dashboard = mk("Dashboard", []);
  const login = mk("Login Page", [
    { id: "atlas-login", type: "frame", name: "Atlas · Login", x: 0, y: 0, w: 1440, h: 1024, expanded: true, props: { name: "Atlas · Login", fill: "#f4f4f5", pad: 0, radius: 0 }, children: [
      { id: "login-hero", type: "frame", name: "Brand panel", x: 0, y: 0, w: 680, h: 1024, expanded: true, props: { name: "Brand panel", fill: "#18181b", pad: 0, radius: 0 }, children: [
        { id: "login-hero-image", type: "image", name: "Atlas auth illustration", x: 0, y: 0, w: 680, h: 1024, props: { name: "Atlas auth illustration", text: "Atlas AI orchestration illustration", src: "/assets/atlas-auth-hero.png", objectFit: "cover", imageScale: 1, opacity: 0.82, fill: "transparent", pad: 0, radius: 0 } },
        { id: "login-brand", type: "text", name: "Atlas", x: 72, y: 64, w: 90, h: 30, props: { text: "Atlas", size: 24, weight: 700, color: "#ffffff", fill: "transparent", pad: 0 } },
        { id: "login-hero-title", type: "text", name: "Hero title", x: 72, y: 374, w: 470, h: 116, props: { text: "Build better products,\ntogether.", size: 44, lineHeight: 56, weight: 650, color: "#ffffff", fill: "transparent", pad: 0 } },
        { id: "login-hero-copy", type: "text", name: "Hero description", x: 72, y: 516, w: 460, h: 54, props: { text: "Turn requirements into production-ready experiences\nwith one connected workspace.", size: 16, lineHeight: 26, color: "#a1a1aa", fill: "transparent", pad: 0 } },
      ] },
      { id: "login-card", type: "frame", name: "Login card", x: 830, y: 190, w: 440, h: 644, expanded: true, props: { name: "Login card", fill: "#ffffff", pad: 0, radius: 24, strokeColor: "#e4e4e7", strokeWidth: 1, strokeVisible: true }, children: [
        { id: "login-title", type: "text", name: "Welcome back", x: 48, y: 48, w: 250, h: 40, props: { text: "Welcome back", size: 30, weight: 650, color: "#18181b", fill: "transparent", pad: 0 } },
        { id: "login-subtitle", type: "text", name: "Login subtitle", x: 48, y: 98, w: 320, h: 22, props: { text: "Sign in to continue to your workspace.", size: 14, color: "#71717a", fill: "transparent", pad: 0 } },
        { id: "login-email-label", type: "text", name: "Email label", x: 48, y: 164, w: 100, h: 20, props: { text: "Email address", size: 13, weight: 600, color: "#27272a", fill: "transparent", pad: 0 } },
        { id: "login-email", type: "frame", name: "Email input", x: 48, y: 194, w: 344, h: 50, expanded: true, props: { name: "Email input", fill: "#ffffff", radius: 10, strokeColor: "#d4d4d8", strokeWidth: 1, strokeVisible: true, pad: 0 }, children: [
          { id: "login-email-value", type: "text", name: "Email value", x: 16, y: 15, w: 180, h: 20, props: { text: "name@company.com", size: 14, color: "#a1a1aa", fill: "transparent", pad: 0 } },
        ] },
        { id: "login-password-label", type: "text", name: "Password label", x: 48, y: 278, w: 100, h: 20, props: { text: "Password", size: 13, weight: 600, color: "#27272a", fill: "transparent", pad: 0 } },
        { id: "login-password", type: "frame", name: "Password input", x: 48, y: 308, w: 344, h: 50, expanded: true, props: { name: "Password input", fill: "#ffffff", radius: 10, strokeColor: "#d4d4d8", strokeWidth: 1, strokeVisible: true, pad: 0 }, children: [
          { id: "login-password-value", type: "text", name: "Password value", x: 16, y: 15, w: 100, h: 20, props: { text: "••••••••", size: 14, color: "#71717a", fill: "transparent", pad: 0 } },
        ] },
        { id: "login-forgot", type: "text", name: "Forgot password", x: 270, y: 376, w: 122, h: 20, props: { text: "Forgot password?", size: 13, weight: 600, color: "#6d28d9", fill: "transparent", pad: 0 } },
        { id: "login-submit", type: "frame", name: "Sign in button", x: 48, y: 422, w: 344, h: 52, expanded: true, props: { name: "Sign in button", fill: "#6d28d9", radius: 10, pad: 0 }, children: [
          { id: "login-submit-label", type: "text", name: "Sign in", x: 146, y: 16, w: 54, h: 20, props: { text: "Sign in", size: 14, weight: 650, color: "#ffffff", fill: "transparent", pad: 0 } },
        ] },
        { id: "login-create", type: "text", name: "Create account", x: 86, y: 512, w: 270, h: 20, props: { text: "New to Atlas? Create an account", size: 13, color: "#71717a", fill: "transparent", pad: 0 } },
      ] },
    ] },
  ], 1440, 1024, "ATL");
  const register = mk("Register Page", [
    { id: "atlas-register", type: "frame", name: "Atlas · Register", x: 0, y: 0, w: 1440, h: 1024, expanded: true, props: { name: "Atlas · Register", fill: "#f4f4f5", pad: 0, radius: 0 }, children: [
      { id: "register-card", type: "frame", name: "Register card", x: 170, y: 92, w: 480, h: 840, expanded: true, props: { name: "Register card", fill: "#ffffff", pad: 0, radius: 24, strokeColor: "#e4e4e7", strokeWidth: 1, strokeVisible: true }, children: [
        { id: "register-brand", type: "text", name: "Atlas", x: 48, y: 42, w: 80, h: 28, props: { text: "Atlas", size: 22, weight: 700, color: "#18181b", fill: "transparent", pad: 0 } },
        { id: "register-title", type: "text", name: "Create account", x: 48, y: 100, w: 280, h: 40, props: { text: "Create your account", size: 30, weight: 650, color: "#18181b", fill: "transparent", pad: 0 } },
        { id: "register-subtitle", type: "text", name: "Register subtitle", x: 48, y: 150, w: 360, h: 22, props: { text: "Start building connected products with Atlas.", size: 14, color: "#71717a", fill: "transparent", pad: 0 } },
        { id: "register-name-label", type: "text", name: "Name label", x: 48, y: 210, w: 100, h: 20, props: { text: "Full name", size: 13, weight: 600, color: "#27272a", fill: "transparent", pad: 0 } },
        { id: "register-name", type: "frame", name: "Name input", x: 48, y: 240, w: 384, h: 50, expanded: true, props: { name: "Name input", fill: "#ffffff", radius: 10, strokeColor: "#d4d4d8", strokeWidth: 1, strokeVisible: true, pad: 0 }, children: [
          { id: "register-name-value", type: "text", name: "Name value", x: 16, y: 15, w: 140, h: 20, props: { text: "Andi Pratama", size: 14, color: "#a1a1aa", fill: "transparent", pad: 0 } },
        ] },
        { id: "register-email-label", type: "text", name: "Email label", x: 48, y: 318, w: 110, h: 20, props: { text: "Email address", size: 13, weight: 600, color: "#27272a", fill: "transparent", pad: 0 } },
        { id: "register-email", type: "frame", name: "Email input", x: 48, y: 348, w: 384, h: 50, expanded: true, props: { name: "Email input", fill: "#ffffff", radius: 10, strokeColor: "#d4d4d8", strokeWidth: 1, strokeVisible: true, pad: 0 }, children: [
          { id: "register-email-value", type: "text", name: "Email value", x: 16, y: 15, w: 190, h: 20, props: { text: "name@company.com", size: 14, color: "#a1a1aa", fill: "transparent", pad: 0 } },
        ] },
        { id: "register-password-label", type: "text", name: "Password label", x: 48, y: 426, w: 100, h: 20, props: { text: "Password", size: 13, weight: 600, color: "#27272a", fill: "transparent", pad: 0 } },
        { id: "register-password", type: "frame", name: "Password input", x: 48, y: 456, w: 384, h: 50, expanded: true, props: { name: "Password input", fill: "#ffffff", radius: 10, strokeColor: "#d4d4d8", strokeWidth: 1, strokeVisible: true, pad: 0 }, children: [
          { id: "register-password-value", type: "text", name: "Password value", x: 16, y: 15, w: 110, h: 20, props: { text: "••••••••", size: 14, color: "#71717a", fill: "transparent", pad: 0 } },
        ] },
        { id: "register-terms", type: "text", name: "Terms agreement", x: 48, y: 530, w: 370, h: 42, props: { text: "By creating an account, you agree to our Terms\nand Privacy Policy.", size: 12, lineHeight: 19, color: "#71717a", fill: "transparent", pad: 0 } },
        { id: "register-submit", type: "frame", name: "Create account button", x: 48, y: 602, w: 384, h: 52, expanded: true, props: { name: "Create account button", fill: "#6d28d9", radius: 10, pad: 0 }, children: [
          { id: "register-submit-label", type: "text", name: "Create account", x: 137, y: 16, w: 112, h: 20, props: { text: "Create account", size: 14, weight: 650, color: "#ffffff", fill: "transparent", pad: 0 } },
        ] },
        { id: "register-login", type: "text", name: "Sign in link", x: 117, y: 696, w: 250, h: 20, props: { text: "Already have an account? Sign in", size: 13, color: "#71717a", fill: "transparent", pad: 0 } },
      ] },
      { id: "register-hero", type: "frame", name: "Register illustration panel", x: 760, y: 0, w: 680, h: 1024, expanded: true, props: { name: "Register illustration panel", fill: "#18181b", pad: 0, radius: 0 }, children: [
        { id: "register-hero-image", type: "image", name: "Atlas auth illustration", x: 0, y: 0, w: 680, h: 1024, props: { name: "Atlas auth illustration", text: "Atlas AI orchestration illustration", src: "/assets/atlas-auth-hero.png", objectFit: "cover", imageScale: 1, opacity: 0.84, fill: "transparent", pad: 0, radius: 0 } },
        { id: "register-hero-title", type: "text", name: "Register hero title", x: 64, y: 720, w: 500, h: 104, props: { text: "One workspace.\nEvery product layer.", size: 40, lineHeight: 50, weight: 650, color: "#ffffff", fill: "transparent", pad: 0 } },
        { id: "register-hero-copy", type: "text", name: "Register hero description", x: 64, y: 846, w: 500, h: 48, props: { text: "Research, orchestrate, design, build, and test\nwith an AI-powered team.", size: 15, lineHeight: 23, color: "#d4d4d8", fill: "transparent", pad: 0 } },
      ] },
    ] },
  ], 1440, 1024, "ATL");
  const settings = mk("Settings", [
    nid("text", 24, 32, 200, 28, { text: "Settings", size: 22, color: "#18181b" }),
    nid("row", 24, 90, 342, 56, { name: "row", fill: "#fff" }, { children: [
      nid("text", 40, 108, 200, 18, { text: "Notifications", size: 14, color: "#18181b" }),
      nid("text", 300, 108, 50, 18, { text: "On", size: 13, color: "#71717a" }),
    ]}),
  ]);
  const atlasDesign = mk("Atlas Design", [
    { ...login.nodes[0], x: 0, y: 0 },
    { ...register.nodes[0], x: 1560, y: 0 },
  ], 3000, 1024, "ATL");
  return [dashboard, atlasDesign, settings];
}

export const SCREENS = seedScreens();
const ATLAS_TEMPLATE_NODES = JSON.parse(JSON.stringify(SCREENS.find((screen) => screen.name === "Atlas Design")?.nodes || [])) as CNode[];
const DEFAULT_SCREEN_SETTINGS: ScreenSettings = {
  canvasBg: "#f5f5f5",
  canvasBgOpacity: 1,
  showCanvasBg: true,
  showAlignmentGrid: false,
  showRulers: true,
  showMinimap: false,
};

interface CanvasStore {
  canvas: { screen: string; mode: "board" | "screen"; selIds: string[]; history: HistoryEntry[]; idx: number; canvasBg: string; canvasBgOpacity: number; showCanvasBg: boolean; zoom: number; pan: { x: number; y: number }; guides: Guide[]; showAlignmentGrid: boolean; showRulers: boolean; showMinimap: boolean; clipboard: CNode[] | null };
  activeTool: Tool;
  saveStatus: "idle" | "saving" | "saved" | "error";
  setActiveTool: (t: Tool) => void;
  setCanvasScreen: (s: string) => void;
  createScreen: (name: string) => Promise<void>;
  renameScreen: (name: string) => Promise<void>;
  duplicateScreen: (name: string) => Promise<void>;
  deleteScreen: () => Promise<void>;
  setCanvasMode: (m: "board" | "screen") => void;
  setSel: (id: string | null, additive?: boolean, range?: boolean) => void;
  clearSel: () => void;
  setZoom: (z: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setZoomPan: (zoom: number, pan: { x: number; y: number }) => void;
  toggleAlignmentGrid: () => void;
  toggleRulers: () => void;
  toggleMinimap: () => void;
  addNode: (type: NodeType, geom?: { x: number; y: number; w?: number; h?: number }) => void;
  autoParentNode: (id: string) => void;
  dropNodeInAutoLayout: (id: string, point: { x: number; y: number }, position?: { x: number; y: number }) => boolean;
  previewAutoLayoutReorder: (id: string, point: { x: number; y: number }) => boolean;
  duplicateSelected: () => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, props: Partial<CNode["props"]>) => void;
  updateTextContent: (id: string, text: string) => void;
  setGeom: (id: string, geom: { x?: number; y?: number; w?: number; h?: number; rotation?: number }) => void;
  setScreenSize: (w: number, h: number) => void;
  reorderNode: (id: string, dir: number) => void;
  reorderNodeTo: (id: string, targetId: string) => void;
  groupSelected: () => void;
  autoLayoutSelected: () => void;
  wrapSelectedInFrame: (autoLayout?: boolean) => void;
  ungroupSelected: () => void;
  selectAllEligible: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  replaceSelectedWithClipboard: () => void;
  importFigmaClipboard: (payload: unknown, point: { x: number; y: number }) => number;
  addShape: (kind: "rect" | "line" | "arrow" | "ellipse" | "polygon" | "star" | "frame", geom?: { x: number; y: number; w?: number; h?: number }) => void;
  setCanvasBg: (color: string) => void;
  setCanvasBgOpacity: (opacity: number) => void;
  toggleCanvasBg: () => void;
  pushHistory: (action?: HistoryEntry["action"], affectedIds?: string[]) => void;
  commitHistory: (replaceCurrent?: boolean, action?: HistoryEntry["action"], affectedIds?: string[]) => void;
  undo: () => void;
  redo: () => void;
  addGuide: (orientation: Guide["orientation"], position: number) => string;
  updateGuide: (id: string, position: number) => void;
  deleteGuide: (id: string) => void;
  toggleNodeVisibility: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  toggleNodeExpand: (id: string) => void;
  renameNode: (id: string, name: string) => void;
}

const MIN_W = 1;
const MIN_H = 1;

function uuid(prefix = "n") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return prefix + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type FigmaPaint = {
  type?: string;
  visible?: boolean;
  opacity?: number;
  color?: { r?: number; g?: number; b?: number };
  gradientStops?: { color?: { r?: number; g?: number; b?: number; a?: number } }[];
};

type FigmaRestNode = {
  id?: string;
  name?: string;
  type?: string;
  visible?: boolean;
  opacity?: number;
  rotation?: number;
  children?: FigmaRestNode[];
  absoluteBoundingBox?: { x?: number; y?: number; width?: number; height?: number };
  size?: { x?: number; y?: number };
  relativeTransform?: number[][];
  fills?: FigmaPaint[] | string;
  strokes?: FigmaPaint[] | string;
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    letterSpacing?: number;
    lineHeightPx?: number;
    fills?: FigmaPaint[];
  };
  layoutMode?: string;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
};

type ForgeFigmaEnvelope = {
  format?: string;
  version?: number;
  nodes?: FigmaRestNode[];
  assets?: Record<string, string>;
};

function byteToHex(value = 0) {
  return Math.max(0, Math.min(255, Math.round(value * 255))).toString(16).padStart(2, "0");
}

function figmaColor(color?: { r?: number; g?: number; b?: number; a?: number }) {
  if (!color) return "#000000";
  return `#${byteToHex(color.r)}${byteToHex(color.g)}${byteToHex(color.b)}`;
}

function firstVisiblePaint(paints?: FigmaPaint[] | string) {
  return Array.isArray(paints) ? paints.find((paint) => paint.visible !== false) : undefined;
}

function figmaAlign(value?: string): CNode["props"]["align"] {
  if (value === "CENTER") return "center";
  if (value === "MAX") return "end";
  if (value === "SPACE_BETWEEN") return "between";
  return "start";
}

function figmaNodeType(node: FigmaRestNode, hasImage: boolean): NodeType {
  if (hasImage) return "image";
  if (node.type === "TEXT") return "text";
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") return "component";
  if (node.type === "INSTANCE") return "instance";
  if (node.type === "GROUP" || node.type === "BOOLEAN_OPERATION") return "group";
  if (node.type === "SECTION") return "section";
  return "frame";
}

function figmaShapeKind(type?: string) {
  if (type === "RECTANGLE" || type === "ROUNDED_RECTANGLE") return "rect";
  if (type === "ELLIPSE") return "ellipse";
  if (type === "LINE") return "line";
  if (type === "REGULAR_POLYGON") return "polygon";
  if (type === "STAR") return "star";
  if (type === "VECTOR") return "rect";
  return undefined;
}

function figmaBounds(node: FigmaRestNode) {
  const box = node.absoluteBoundingBox;
  return {
    x: box?.x ?? node.relativeTransform?.[0]?.[2] ?? 0,
    y: box?.y ?? node.relativeTransform?.[1]?.[2] ?? 0,
    w: Math.max(MIN_W, box?.width ?? node.size?.x ?? 100),
    h: Math.max(MIN_H, box?.height ?? node.size?.y ?? 100),
  };
}

function convertFigmaNode(node: FigmaRestNode, assets: Record<string, string>, parentBox?: ReturnType<typeof figmaBounds>): CNode {
  const bounds = figmaBounds(node);
  const fill = firstVisiblePaint(node.fills) ?? firstVisiblePaint(node.style?.fills);
  const stroke = firstVisiblePaint(node.strokes);
  const gradient = fill?.type?.startsWith("GRADIENT") ? fill : undefined;
  const hasImage = !!(node.id && assets[node.id]);
  const type = figmaNodeType(node, hasImage);
  const isContainer = ["FRAME", "GROUP", "SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE", "BOOLEAN_OPERATION"].includes(node.type ?? "");
  const shapeKind = isContainer || type === "text" || hasImage ? undefined : figmaShapeKind(node.type);
  const radius = node.cornerRadius ?? node.rectangleCornerRadii?.[0] ?? 0;
  const fillOpacity = Math.max(0, Math.min(1, fill?.opacity ?? gradient?.gradientStops?.[0]?.color?.a ?? 1));
  const children = node.children?.map((child) => convertFigmaNode(child, assets, bounds));
  const name = node.name || (type === "text" ? "Text" : node.type || "Layer");

  return {
    id: uuid("figma"),
    type,
    name,
    x: parentBox ? bounds.x - parentBox.x : bounds.x,
    y: parentBox ? bounds.y - parentBox.y : bounds.y,
    w: bounds.w,
    h: bounds.h,
    rotation: node.rotation ?? 0,
    visible: node.visible !== false,
    expanded: !!children?.length,
    props: {
      name,
      text: type === "text" ? (node.characters ?? "") : "",
      src: hasImage && node.id ? assets[node.id] : undefined,
      objectFit: hasImage ? "cover" : undefined,
      imageScale: hasImage ? 1 : undefined,
      shapeKind,
      fill: fill?.type === "SOLID" ? figmaColor(fill.color) : type === "text" || !fill ? "transparent" : "#ffffff",
      fillVisible: !!fill && fill.visible !== false,
      fillOpacity,
      fillMode: gradient ? "gradient" : "solid",
      gradientType: fill?.type === "GRADIENT_RADIAL" ? "radial" : "linear",
      gradientColors: gradient?.gradientStops?.map((stop) => figmaColor(stop.color)),
      color: type === "text" ? figmaColor(fill?.color) : "#18181b",
      opacity: node.opacity ?? 1,
      strokeColor: stroke ? figmaColor(stroke.color) : undefined,
      strokeWidth: stroke ? (node.strokeWeight ?? 1) : 0,
      strokeOpacity: stroke?.opacity ?? 1,
      strokeVisible: !!stroke,
      strokePosition: node.strokeAlign === "OUTSIDE" ? "outside" : node.strokeAlign === "CENTER" ? "center" : "inside",
      radius,
      size: node.style?.fontSize,
      fontSize: node.style?.fontSize,
      fontFamily: node.style?.fontFamily,
      weight: node.style?.fontWeight,
      letterSpacing: node.style?.letterSpacing,
      lineHeight: node.style?.lineHeightPx,
      autoLayout: node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL",
      direction: node.layoutMode === "VERTICAL" ? "col" : "row",
      gap: node.itemSpacing ?? 0,
      padTop: node.paddingTop ?? 0,
      padRight: node.paddingRight ?? 0,
      padBottom: node.paddingBottom ?? 0,
      padLeft: node.paddingLeft ?? 0,
      justify: figmaAlign(node.primaryAxisAlignItems),
      align: figmaAlign(node.counterAxisAlignItems),
      layoutSizingHorizontal: node.layoutMode === "HORIZONTAL"
        ? (node.primaryAxisSizingMode === "FIXED" ? "fixed" : "hug")
        : (node.counterAxisSizingMode === "FIXED" ? "fixed" : "hug"),
      layoutSizingVertical: node.layoutMode === "VERTICAL"
        ? (node.primaryAxisSizingMode === "FIXED" ? "fixed" : "hug")
        : (node.counterAxisSizingMode === "FIXED" ? "fixed" : "hug"),
      pad: 0,
    },
    children,
  };
}

function cloneNode(node: CNode, offset = 0, copyName = false): CNode {
  const currentName = node.name ?? node.props.name ?? node.props.text ?? node.type;
  return {
    ...node,
    id: uuid(),
    name: copyName ? `Copy of ${currentName}` : currentName,
    x: node.x + offset,
    y: node.y + offset,
    props: { ...node.props, name: copyName ? `Copy of ${currentName}` : node.props.name },
    children: node.children?.map((child) => cloneNode(child)),
  };
}

function flattenNodes(nodes: CNode[]): CNode[] {
  const out: CNode[] = [];
  nodes.forEach((node) => {
    out.push(node);
    if (node.children) out.push(...flattenNodes(node.children));
  });
  return out;
}

function removeNode(nodes: CNode[], id: string): boolean {
  const rootIndex = nodes.findIndex((node) => node.id === id);
  if (rootIndex >= 0) {
    nodes.splice(rootIndex, 1);
    return true;
  }
  for (const node of nodes) {
    if (node.children && removeNode(node.children, id)) return true;
  }
  return false;
}

function findSiblingArray(nodes: CNode[], id: string): CNode[] | undefined {
  if (nodes.some((node) => node.id === id)) return nodes;
  for (const node of nodes) {
    if (node.children) {
      const found = findSiblingArray(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

type NodeLocation = {
  node: CNode;
  parent: CNode | null;
  siblings: CNode[];
  absX: number;
  absY: number;
};

type NodeAncestry = NodeLocation & { ancestors: CNode[] };

function findNodeLocation(nodes: CNode[], id: string, parent: CNode | null = null, baseX = 0, baseY = 0): NodeLocation | undefined {
  for (const node of nodes) {
    const absX = baseX + node.x;
    const absY = baseY + node.y;
    if (node.id === id) return { node, parent, siblings: nodes, absX, absY };
    if (node.children) {
      const found = findNodeLocation(node.children, id, node, absX, absY);
      if (found) return found;
    }
  }
  return undefined;
}

function findNodeAncestry(nodes: CNode[], id: string, ancestors: CNode[] = [], baseX = 0, baseY = 0): NodeAncestry | undefined {
  for (const node of nodes) {
    const absX = baseX + node.x;
    const absY = baseY + node.y;
    if (node.id === id) return { node, parent: ancestors[ancestors.length - 1] ?? null, siblings: nodes, absX, absY, ancestors };
    if (node.children) {
      const found = findNodeAncestry(node.children, id, [...ancestors, node], absX, absY);
      if (found) return found;
    }
  }
  return undefined;
}

function containsNode(root: CNode, id: string): boolean {
  return !!root.children?.some((child) => child.id === id || containsNode(child, id));
}

function frameLocations(nodes: CNode[], baseX = 0, baseY = 0): NodeLocation[] {
  const frames: NodeLocation[] = [];
  nodes.forEach((node) => {
    const absX = baseX + node.x;
    const absY = baseY + node.y;
    if (node.type === "frame" && !node.props.shapeKind && node.visible !== false && !node.locked) {
      frames.push({ node, parent: null, siblings: nodes, absX, absY });
    }
    if (node.children) frames.push(...frameLocations(node.children, absX, absY));
  });
  return frames;
}

function measureTextNode(node: CNode, text: string) {
  return measureCanvasText(node, text);
}

function resizeAutoLayoutContainer(node: CNode) {
  layoutAutoLayout(node);
}

export function findParentNode(screen: Screen, id: string) {
  return findNodeLocation(screen.nodes, id)?.parent ?? null;
}

function relayoutNodeAndAncestors(screen: Screen, id: string) {
  let currentId: string | undefined = id;
  const visited = new Set<string>();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const location = findNodeLocation(screen.nodes, currentId);
    if (!location) break;
    if (location.node.props.autoLayout) resizeAutoLayoutContainer(location.node);
    currentId = location.parent?.id;
  }
}

export type AutoLayoutDropPreview = {
  parentId: string;
  index: number;
  direction: "row" | "col";
  x: number;
  y: number;
  w: number;
  h: number;
};

export function getAutoLayoutDropPreview(screen: Screen, draggedId: string, point: { x: number; y: number }): AutoLayoutDropPreview | null {
  const dragged = findNodeLocation(screen.nodes, draggedId);
  if (!dragged) return null;
  const target = frameLocations(screen.nodes)
    .filter(({ node, absX, absY }) => node.props.autoLayout && node.id !== draggedId && !containsNode(dragged.node, node.id)
      && point.x >= absX && point.x <= absX + node.w && point.y >= absY && point.y <= absY + node.h)
    .sort((a, b) => a.node.w * a.node.h - b.node.w * b.node.h)[0];
  if (!target) return null;
  const direction = target.node.props.direction === "col" ? "col" : "row";
  const children = (target.node.children ?? []).filter((child) => child.id !== draggedId);
  const localMain = direction === "row" ? point.x - target.absX : point.y - target.absY;
  let index = children.findIndex((child) => localMain < (direction === "row" ? child.x + child.w / 2 : child.y + child.h / 2));
  if (index < 0) index = children.length;
  const base = target.node.props.pad ?? 0;
  const padH = target.node.props.padH ?? base;
  const padV = target.node.props.padV ?? base;
  const start = direction === "row" ? (target.node.props.padLeft ?? padH) : (target.node.props.padTop ?? padV);
  const end = direction === "row" ? target.node.w - (target.node.props.padRight ?? padH) : target.node.h - (target.node.props.padBottom ?? padV);
  const marker = index === 0 ? start : index >= children.length
    ? end : direction === "row" ? children[index].x - (target.node.props.gap ?? 10) / 2 : children[index].y - (target.node.props.gap ?? 10) / 2;
  return direction === "row"
    ? { parentId: target.node.id, index, direction, x: target.absX + marker, y: target.absY, w: 2, h: target.node.h }
    : { parentId: target.node.id, index, direction, x: target.absX, y: target.absY + marker, w: target.node.w, h: 2 };
}

function alignNodeOrChildren(nodes: CNode[], node: CNode) {
  const direction = node.props.direction === "col" ? "col" : "row";
  const horizontal = direction === "row" ? (node.props.justify ?? "start") : (node.props.align ?? "start");
  const vertical = direction === "row" ? (node.props.align ?? "start") : (node.props.justify ?? "start");
  const offset = (position: string, available: number, size: number) =>
    position === "center" ? (available - size) / 2 : position === "end" ? available - size : 0;

  if (node.children?.length) {
    const base = node.props.pad ?? 0;
    const horizontalPad = node.props.padH ?? base;
    const verticalPad = node.props.padV ?? base;
    const left = node.props.padLeft ?? horizontalPad;
    const right = node.props.padRight ?? horizontalPad;
    const top = node.props.padTop ?? verticalPad;
    const bottom = node.props.padBottom ?? verticalPad;
    const bounds = relBounds(node.children);
    const targetX = left + Math.max(0, offset(horizontal, Math.max(0, node.w - left - right), bounds.w));
    const targetY = top + Math.max(0, offset(vertical, Math.max(0, node.h - top - bottom), bounds.h));
    const dx = targetX - bounds.x;
    const dy = targetY - bounds.y;
    node.children.forEach((child) => {
      child.x += dx;
      child.y += dy;
    });
    return;
  }

  const location = findNodeLocation(nodes, node.id);
  if (!location?.parent || location.parent.props.autoLayout) return;
  const parent = location.parent;
  const base = parent.props.pad ?? 0;
  const horizontalPad = parent.props.padH ?? base;
  const verticalPad = parent.props.padV ?? base;
  const left = parent.props.padLeft ?? horizontalPad;
  const right = parent.props.padRight ?? horizontalPad;
  const top = parent.props.padTop ?? verticalPad;
  const bottom = parent.props.padBottom ?? verticalPad;
  node.x = left + Math.max(0, offset(horizontal, Math.max(0, parent.w - left - right), node.w));
  node.y = top + Math.max(0, offset(vertical, Math.max(0, parent.h - top - bottom), node.h));
}

function relBounds(nodes: CNode[]) {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const w = Math.max(MIN_W, Math.max(...nodes.map((n) => n.x + n.w)) - x);
  const h = Math.max(MIN_H, Math.max(...nodes.map((n) => n.y + n.h)) - y);
  return { x, y, w, h };
}

function toLocal(n: CNode, p: { x: number; y: number }) {
  return { ...n, x: n.x - p.x, y: n.y - p.y, w: Math.max(MIN_W, n.w), h: Math.max(MIN_H, n.h) };
}

export function getScreen(name: string): Screen | undefined { return SCREENS.find((s) => s.name === name); }

const canvasSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const canvasSaveQueues = new Map<string, Promise<void>>();
const canvasDesiredRevisions = new Map<string, number>();
const lastRemoteHistoryId = new Map<string, string>();
const lastSavedCanvasRoots = new Map<string, Map<string, string>>();

type CompactCanvasSnapshot = {
  version: 2;
  screen: Pick<Screen, "id" | "projectId" | "name" | "w" | "h" | "nodes">;
  guides: Guide[];
  zoom: number;
  pan: { x: number; y: number };
};

function snapshotString(screen: Screen, guides: Guide[], zoom: number, pan: { x: number; y: number }) {
  const snapshot: CompactCanvasSnapshot = {
    version: 2,
    screen: { id: screen.id, projectId: screen.projectId, name: screen.name, w: screen.w, h: screen.h, nodes: screen.nodes },
    guides,
    zoom,
    pan,
  };
  return JSON.stringify(snapshot);
}

function normalizeSnapshotValue(value: unknown, fallback: Screen, guides: Guide[], zoom: number, pan: { x: number; y: number }) {
  try {
    const parsed = (typeof value === "string" ? JSON.parse(value) : value) as CompactCanvasSnapshot & { screens?: Screen[] };
    if (parsed?.version === 2 && parsed.screen?.nodes) return JSON.stringify(parsed);
    const source = parsed?.screens?.find((item) => (fallback.id && item.id === fallback.id) || item.name === fallback.name) || fallback;
    return snapshotString(source, parsed?.guides || guides, parsed?.zoom || zoom, parsed?.pan || pan);
  } catch {
    return snapshotString(fallback, guides, zoom, pan);
  }
}

function applySnapshotValue(value: unknown, currentScreen: Screen) {
  try {
    const parsed = (typeof value === "string" ? JSON.parse(value) : value) as CompactCanvasSnapshot & { screens?: Screen[] };
    const source = parsed.version === 2
      ? parsed.screen
      : parsed.screens?.find((item) => (currentScreen.id && item.id === currentScreen.id) || item.name === currentScreen.name);
    if (!source) return null;
    const target = SCREENS.find((item) => (source.id && item.id === source.id) || item.name === source.name) || currentScreen;
    target.nodes = source.nodes;
    target.w = source.w;
    target.h = source.h;
    return { guides: parsed.guides || [], zoom: parsed.zoom || 1, pan: parsed.pan || { x: 0, y: 0 } };
  } catch {
    return null;
  }
}

function resolvedSettings(settings?: Partial<ScreenSettings>): ScreenSettings {
  return { ...DEFAULT_SCREEN_SETTINGS, ...(settings || {}) };
}

function syncCanvasToScreen(screen: Screen | undefined, canvas: CanvasStore["canvas"]) {
  if (!screen) return;
  screen.guides = canvas.guides;
  screen.history = canvas.history;
  screen.settings = {
    ...resolvedSettings(screen.settings),
    canvasBg: canvas.canvasBg,
    canvasBgOpacity: canvas.canvasBgOpacity,
    showCanvasBg: canvas.showCanvasBg,
    showAlignmentGrid: canvas.showAlignmentGrid,
    showRulers: canvas.showRulers,
    showMinimap: canvas.showMinimap,
    zoom: canvas.zoom,
    pan: canvas.pan,
  };
}

function serializableCanvasNodes(nodes: CNode[]): CNode[] {
  const clone = JSON.parse(JSON.stringify(nodes)) as CNode[];
  const visit = (items: CNode[]) => items.forEach((node) => {
    if (node.props.assetId) delete node.props.src;
    if (node.props.src?.startsWith("blob:")) delete node.props.src;
    if (node.children) visit(node.children);
  });
  visit(clone);
  return clone;
}

function canvasForScreen(canvas: CanvasStore["canvas"], screen: Screen, history: HistoryEntry[] = []) {
  layoutCanvasNodes(screen.nodes);
  const settings = resolvedSettings(screen.settings);
  const baselinePayload = snapshotString(screen, screen.guides || [], settings.zoom || 1, settings.pan || { x: 0, y: 0 });
  const baseline: HistoryEntry = {
    id: `baseline:${screen.id || screen.name}`,
    timestamp: Date.now(),
    action: "UPDATE_FRAME" as const,
    payload: baselinePayload,
    inverse: baselinePayload,
    affectedIds: [],
  };
  const effectiveHistory = history[0]?.id.startsWith("baseline:") ? history : [baseline, ...history];
  return {
    ...canvas,
    screen: screen.name,
    mode: "screen" as const,
    selIds: [],
    guides: screen.guides || [],
    history: effectiveHistory,
    idx: effectiveHistory.length - 1,
    canvasBg: settings.canvasBg,
    canvasBgOpacity: settings.canvasBgOpacity,
    showCanvasBg: settings.showCanvasBg,
    showAlignmentGrid: settings.showAlignmentGrid,
    showRulers: settings.showRulers,
    showMinimap: settings.showMinimap,
    zoom: settings.zoom || 1,
    pan: settings.pan || { x: 0, y: 0 },
  };
}

const remoteCanvasLoads = new Map<string, Promise<void>>();
const remoteCanvasProgress = new Map<string, number>();
const remoteCanvasProgressListeners = new Map<string, Set<(progress: number) => void>>();

function reportRemoteCanvasProgress(projectId: string, progress: number) {
  const next = Math.max(0, Math.min(100, Math.round(progress)));
  remoteCanvasProgress.set(projectId, next);
  remoteCanvasProgressListeners.get(projectId)?.forEach((listener) => listener(next));
}

export function loadRemoteCanvas(projectId: string, onProgress?: (progress: number) => void) {
  if (onProgress) {
    const listeners = remoteCanvasProgressListeners.get(projectId) ?? new Set();
    listeners.add(onProgress);
    remoteCanvasProgressListeners.set(projectId, listeners);
    onProgress(remoteCanvasProgress.get(projectId) ?? 0);
  }
  let load = remoteCanvasLoads.get(projectId);
  if (!load) {
    reportRemoteCanvasProgress(projectId, 3);
    load = loadRemoteCanvasOnce(projectId).finally(() => {
      if (remoteCanvasLoads.get(projectId) === load) remoteCanvasLoads.delete(projectId);
    });
    remoteCanvasLoads.set(projectId, load);
  }
  return load.finally(() => {
    if (!onProgress) return;
    const listeners = remoteCanvasProgressListeners.get(projectId);
    listeners?.delete(onProgress);
    if (!listeners?.size) remoteCanvasProgressListeners.delete(projectId);
  });
}

async function loadRemoteCanvasOnce(projectId: string) {
  if (!apiEnabled) return;
  reportRemoteCanvasProgress(projectId, 8);
  let screens = await forgeApi.listScreens(projectId);
  reportRemoteCanvasProgress(projectId, 18);
  if (!screens.length) {
    screens = [await forgeApi.createScreen(projectId, "Design Canvas")];
    reportRemoteCanvasProgress(projectId, 25);
  }
  let completedScreens = 0;
  const documents = await Promise.all(screens.map(async (screen) => {
    const [document, remoteHistory] = await Promise.all([
      forgeApi.getScreenDocument(screen.id),
      forgeApi.getScreenHistory(screen.id),
    ]);
    completedScreens += 1;
    reportRemoteCanvasProgress(projectId, 25 + completedScreens / Math.max(1, screens.length) * 55);
    const fallback: Screen = { id: screen.id, projectId, name: screen.name, w: screen.w, h: screen.h, nodes: Array.isArray(document.nodes) ? document.nodes : [] };
    const settings = resolvedSettings(document.settings || screen.settings);
    const history: HistoryEntry[] = remoteHistory.slice().reverse().map((entry) => ({
      id: entry.id,
      timestamp: new Date(entry.createdAt).getTime(),
      action: entry.action,
      payload: normalizeSnapshotValue(entry.payload, fallback, document.guides || [], settings.zoom || 1, settings.pan || { x: 0, y: 0 }),
      inverse: normalizeSnapshotValue(entry.inverse, fallback, document.guides || [], settings.zoom || 1, settings.pan || { x: 0, y: 0 }),
      affectedIds: entry.affectedIds,
    }));
    return { screen, document, history };
  }));
  reportRemoteCanvasProgress(projectId, 85);
  const remoteScreens: Screen[] = documents.map(({ screen, document, history }) => ({
    id: screen.id,
    projectId,
    name: screen.name,
    w: screen.w,
    h: screen.h,
    nodes: Array.isArray(document.nodes) ? document.nodes : [],
    guides: document.guides || [],
    settings: document.settings || screen.settings || DEFAULT_SCREEN_SETTINGS,
    revision: document.revision ?? screen.revision ?? 0,
    history,
  }));
  remoteScreens.forEach((screen) => lastSavedCanvasRoots.set(screen.id!, new Map(screen.nodes.map((node) => [node.id, JSON.stringify(serializableCanvasNodes([node])[0])]))));
  reportRemoteCanvasProgress(projectId, 90);

  const project = useStore.getState().projects.find((item) => item.id === projectId);
  if (project?.name.trim().toLowerCase() === "atlas" && remoteScreens.every((screen) => screen.nodes.length === 0)) {
    const target = remoteScreens[0];
    const targetDocument = documents[0];
    if (target && targetDocument) {
      target.name = "Atlas Login & Register";
      target.w = 3000;
      target.h = 1024;
      target.nodes = JSON.parse(JSON.stringify(ATLAS_TEMPLATE_NODES)) as CNode[];
      await Promise.all([
        forgeApi.saveScreenNodes(target.id!, target.nodes),
        forgeApi.updateScreen(target.id!, { name: target.name, w: target.w, h: target.h, settings: resolvedSettings(target.settings) }),
      ]);
      targetDocument.screen.name = target.name;
      reportRemoteCanvasProgress(projectId, 96);
    }
  }
  const kept = SCREENS.filter((screen) => screen.projectId !== projectId);
  SCREENS.splice(0, SCREENS.length, ...kept, ...remoteScreens);
  const first = remoteScreens[0];
  if (first) {
    const firstHistory = documents.find((item) => item.screen.id === first.id)?.history || [];
    if (firstHistory.length) lastRemoteHistoryId.set(first.id!, firstHistory[firstHistory.length - 1].id);
    useCanvas.setState((state) => ({
      canvas: canvasForScreen(state.canvas, first, firstHistory),
      saveStatus: "saved",
    }));
  }
  reportRemoteCanvasProgress(projectId, 100);
}

function scheduleRemoteCanvasSave() {
  if (!apiEnabled || typeof window === "undefined") return;
  const projectId = useStore.getState().currentId;
  const state = useCanvas.getState();
  const screen = getScreen(state.canvas.screen);
  if (!projectId || !screen?.id || screen.projectId !== projectId) return;
  syncCanvasToScreen(screen, state.canvas);
  const existing = canvasSaveTimers.get(screen.id);
  if (existing) clearTimeout(existing);
  useCanvas.setState({ saveStatus: "saving" });
  canvasSaveTimers.set(screen.id, setTimeout(() => {
    canvasSaveTimers.delete(screen.id!);
    const latestState = useCanvas.getState();
    const latestScreen = SCREENS.find((item) => item.id === screen.id) || screen;
    if (latestState.canvas.screen === latestScreen.name) syncCanvasToScreen(latestScreen, latestState.canvas);
    const history = latestScreen.history || latestState.canvas.history;
    const latestHistory = history.length ? history[history.length - 1] : undefined;
    const pendingHistory = latestHistory && lastRemoteHistoryId.get(latestScreen.id!) !== latestHistory.id
      ? { action: latestHistory.action, payload: latestHistory.payload, inverse: latestHistory.inverse, affectedIds: latestHistory.affectedIds }
      : undefined;
    // History contains two full snapshots. Avoid sending large inline images
    // three times in a single autosave request.
    const includeHistory = pendingHistory && JSON.stringify(pendingHistory).length <= 512_000;
    let revision = Math.max(latestScreen.revision || 0, canvasDesiredRevisions.get(latestScreen.id!) || 0) + 1;
    latestScreen.revision = revision;
    canvasDesiredRevisions.set(latestScreen.id!, revision);
    const document = {
      revision,
      name: latestScreen.name,
      w: Math.round(latestScreen.w),
      h: Math.round(latestScreen.h),
      nodes: serializableCanvasNodes(latestScreen.nodes),
      guides: JSON.parse(JSON.stringify(latestScreen.guides || [])) as Guide[],
      settings: { ...resolvedSettings(latestScreen.settings) },
      ...(includeHistory ? { history: pendingHistory } : {}),
    };
    const savedRoots = lastSavedCanvasRoots.get(latestScreen.id!) || new Map<string, string>();
    const currentRoots = new Map(document.nodes.map((node) => [node.id, JSON.stringify(node)]));
    const addedNodes = document.nodes.filter((node) => !savedRoots.has(node.id));
    const updatedNodes = document.nodes.filter((node) => savedRoots.has(node.id) && savedRoots.get(node.id) !== currentRoots.get(node.id));
    const deletedIds = Array.from(savedRoots.keys()).filter((id) => !currentRoots.has(id));
    const patchDocument = { ...document, addedNodes, updatedNodes, deletedIds };
    delete (patchDocument as Partial<typeof patchDocument>).nodes;
    const previous = canvasSaveQueues.get(latestScreen.id!) || Promise.resolve();
    const job = previous.catch(() => undefined).then(async () => {
      let saved;
      try {
        saved = await forgeApi.patchScreenDocument(latestScreen.id!, patchDocument);
        if (saved.stale) {
          revision = saved.revision + 1;
          document.revision = revision;
          latestScreen.revision = revision;
          canvasDesiredRevisions.set(latestScreen.id!, revision);
          patchDocument.revision = revision;
          saved = await forgeApi.patchScreenDocument(latestScreen.id!, patchDocument);
        }
      } catch (error) {
        if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) throw error;
        await Promise.all([
          forgeApi.saveScreenNodes(latestScreen.id!, document.nodes),
          forgeApi.saveScreenGuides(latestScreen.id!, document.guides),
          forgeApi.updateScreen(latestScreen.id!, { name: document.name, w: document.w, h: document.h, settings: document.settings }),
        ]);
        saved = { revision, stale: false };
      }
      if (saved.stale) throw new Error("Canvas changed in another session and could not be synchronized.");
      lastSavedCanvasRoots.set(latestScreen.id!, currentRoots);
      if (includeHistory && latestHistory) lastRemoteHistoryId.set(latestScreen.id!, latestHistory.id);
      latestScreen.revision = Math.max(latestScreen.revision || 0, saved.revision);
      if (canvasDesiredRevisions.get(latestScreen.id!) === revision) useCanvas.setState({ saveStatus: "saved" });
    }).catch((error) => {
      if (canvasDesiredRevisions.get(latestScreen.id!) === revision) useCanvas.setState({ saveStatus: "error" });
      useStore.setState({ apiError: errorMessage(error) });
    }).finally(() => {
      if (canvasSaveQueues.get(latestScreen.id!) === job) canvasSaveQueues.delete(latestScreen.id!);
    });
    canvasSaveQueues.set(latestScreen.id!, job);
  }, 600));
}

export function findNodeById(screen: Screen, id: string): CNode | undefined {
  const stack = [...screen.nodes];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.id === id) return n;
    if (n.children) stack.push(...n.children);
  }
  return undefined;
}

export const useCanvas = create<CanvasStore>((set, get) => ({
  canvas: { screen: "Dashboard", mode: "screen", selIds: [], history: [], idx: -1, canvasBg: "#f5f5f5", canvasBgOpacity: 1, showCanvasBg: true, zoom: 1, pan: { x: 0, y: 0 }, guides: [], showAlignmentGrid: false, showRulers: true, showMinimap: false, clipboard: null as CNode[] | null, tool: "move" },
  activeTool: "move",
  saveStatus: "idle",
  setActiveTool: (t) => set({ activeTool: t }),
  setCanvasScreen: (s) => {
    const current = get();
    const previous = getScreen(current.canvas.screen);
    syncCanvasToScreen(previous, current.canvas);
    const next = getScreen(s);
    if (!next) return;
    set({ canvas: canvasForScreen(current.canvas, next, next.history || []), saveStatus: "saved" });
  },
  createScreen: async (name) => {
    const projectId = useStore.getState().currentId;
    if (!projectId || !name.trim()) return;
    const created = await forgeApi.createScreen(projectId, name.trim(), 1440, 1024, DEFAULT_SCREEN_SETTINGS);
    const screen: Screen = { ...created, projectId, nodes: [], guides: [], settings: created.settings || DEFAULT_SCREEN_SETTINGS, history: [] };
    SCREENS.push(screen);
    set((state) => ({ canvas: canvasForScreen(state.canvas, screen), saveStatus: "saved" }));
  },
  renameScreen: async (name) => {
    const state = get();
    const screen = getScreen(state.canvas.screen);
    const nextName = name.trim();
    if (!screen?.id || !nextName || nextName === screen.name) return;
    await forgeApi.updateScreen(screen.id, { name: nextName });
    screen.name = nextName;
    set({ canvas: { ...state.canvas, screen: nextName }, saveStatus: "saved" });
  },
  duplicateScreen: async (name) => {
    const state = get();
    const source = getScreen(state.canvas.screen);
    const nextName = name.trim();
    if (!source?.id || !nextName) return;
    syncCanvasToScreen(source, state.canvas);
    await Promise.all([
      forgeApi.saveScreenNodes(source.id, source.nodes),
      forgeApi.saveScreenGuides(source.id, source.guides || []),
      forgeApi.updateScreen(source.id, { settings: resolvedSettings(source.settings) }),
    ]);
    const created = await forgeApi.duplicateScreen(source.id, nextName);
    const document = await forgeApi.getScreenDocument(created.id);
    const duplicate: Screen = {
      ...created,
      projectId: source.projectId,
      nodes: document.nodes || [],
      guides: document.guides || [],
      settings: document.settings || created.settings || DEFAULT_SCREEN_SETTINGS,
      history: [],
    };
    SCREENS.push(duplicate);
    set({ canvas: canvasForScreen(state.canvas, duplicate), saveStatus: "saved" });
  },
  deleteScreen: async () => {
    const state = get();
    const screen = getScreen(state.canvas.screen);
    const projectId = useStore.getState().currentId;
    const projectScreens = SCREENS.filter((item) => item.projectId === projectId);
    if (!screen?.id || projectScreens.length <= 1) return;
    await forgeApi.deleteScreen(screen.id);
    const index = SCREENS.indexOf(screen);
    if (index >= 0) SCREENS.splice(index, 1);
    const next = SCREENS.find((item) => item.projectId === projectId)!;
    set({ canvas: canvasForScreen(state.canvas, next, next.history || []), saveStatus: "saved" });
  },
  setCanvasMode: (m) => set({ canvas: { ...get().canvas, mode: m } }),
  setSel: (id, additive = false, range = false) => {
    const st = get();
    const sc = getScreen(st.canvas.screen);
    const target = id && sc ? findNodeById(sc, id) : undefined;
    if (target && (target.visible === false || target.locked)) return;
    let next: string[] = id ? [id] : [];
    if (additive) {
      next = id ? (st.canvas.selIds.includes(id) ? st.canvas.selIds.filter((x) => x !== id) : [...st.canvas.selIds, id]) : st.canvas.selIds;
    } else if (range && id && sc && st.canvas.selIds.length) {
      const eligible = flattenNodes(sc.nodes).filter((node) => node.visible !== false && !node.locked);
      const anchor = eligible.findIndex((node) => node.id === st.canvas.selIds[st.canvas.selIds.length - 1]);
      const end = eligible.findIndex((node) => node.id === id);
      if (anchor >= 0 && end >= 0) next = eligible.slice(Math.min(anchor, end), Math.max(anchor, end) + 1).map((node) => node.id);
    }
    return set({ canvas: { ...st.canvas, selIds: next } });
  },
  clearSel: () => set({ canvas: { ...get().canvas, selIds: [] } }),
  setZoom: (z) => set((st) => {
    const clamped = Math.max(0.05, Math.min(32, z));
    return { canvas: { ...st.canvas, zoom: clamped } };
  }),
  setPan: (pan) => set((st) => ({ canvas: { ...st.canvas, pan } })),
  setZoomPan: (zoom: number, pan: { x: number; y: number }) => set((st) => ({ canvas: { ...st.canvas, zoom: Math.max(0.05, Math.min(32, zoom)), pan } })),
  toggleAlignmentGrid: () => { set((st) => ({ canvas: { ...st.canvas, showAlignmentGrid: !st.canvas.showAlignmentGrid } })); scheduleRemoteCanvasSave(); },
  toggleRulers: () => { set((st) => ({ canvas: { ...st.canvas, showRulers: !st.canvas.showRulers } })); scheduleRemoteCanvasSave(); },
  toggleMinimap: () => { set((st) => ({ canvas: { ...st.canvas, showMinimap: !st.canvas.showMinimap } })); scheduleRemoteCanvasSave(); },
  groupSelected: () => {
    const st = get();
    const ids = st.canvas.selIds.slice().sort((a, b) => {
      const na = getScreen(st.canvas.screen)?.nodes.find((n) => n.id === a);
      const nb = getScreen(st.canvas.screen)?.nodes.find((n) => n.id === b);
      if (!na || !nb) return 0;
      return (na.x - nb.x) || (na.y - nb.y);
    });
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const nodes = ids.map((id) => sc.nodes.find((n) => n.id === id)).filter(Boolean) as CNode[];
    if (nodes.length < 2) return;
    const b = relBounds(nodes);
    const direction = nodes.every((n) => Math.abs(n.y - b.y) < 8 && Math.abs((n.y + n.h) - (b.y + b.h)) < 8) ? "row" : "col";
    const container: CNode = { id: uuid("g"), type: "group", name: "Group", x: b.x, y: b.y, w: Math.max(MIN_W, b.w), h: Math.max(MIN_H, b.h), props: { name: "Group", fill: "transparent", pad: 8, color: "#18181b", text: "", direction }, children: nodes.map((n) => toLocal(n, b)) };
    sc.nodes = sc.nodes.filter((n) => !ids.includes(n.id));
    sc.nodes.push(container);
    set({ canvas: { ...st.canvas, selIds: [container.id] } });
    get().pushHistory("GROUP", [container.id, ...ids]);
  },
  autoLayoutSelected: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen);
    if (!sc || !st.canvas.selIds.length) return;
    if (st.canvas.selIds.length === 1) {
      get().wrapSelectedInFrame(true);
      return;
    }
    const locations = st.canvas.selIds
      .map((id) => findNodeAncestry(sc.nodes, id))
      .filter((location): location is NodeAncestry => !!location && location.node.visible !== false && !location.node.locked);
    if (locations.length < 2) return;
    const selectedIds = new Set(locations.map((location) => location.node.id));
    const topLevelLocations = locations.filter((location) => !location.ancestors.some((ancestor) => selectedIds.has(ancestor.id)));
    if (topLevelLocations.length < 2) return;
    const commonParent = [...topLevelLocations[0].ancestors].reverse()
      .find((ancestor) => topLevelLocations.every((location) => location.ancestors.includes(ancestor)));
    const siblings = commonParent?.children ?? sc.nodes;
    const commonLocation = commonParent ? findNodeLocation(sc.nodes, commonParent.id) : undefined;
    const baseX = commonLocation?.absX ?? 0;
    const baseY = commonLocation?.absY ?? 0;
    const nodes = topLevelLocations.map((location) => ({
      ...location.node,
      x: location.absX - baseX,
      y: location.absY - baseY,
    }));
    const bounds = relBounds(nodes);
    const horizontalSpan = Math.max(...nodes.map((node) => node.x + node.w / 2)) - Math.min(...nodes.map((node) => node.x + node.w / 2));
    const verticalSpan = Math.max(...nodes.map((node) => node.y + node.h / 2)) - Math.min(...nodes.map((node) => node.y + node.h / 2));
    const direction = horizontalSpan >= verticalSpan ? "row" : "col";
    const ordered = [...nodes].sort((a, b) => direction === "row" ? (a.x - b.x) || (a.y - b.y) : (a.y - b.y) || (a.x - b.x));
    const wrapperId = uuid("frame");
    const wrapper: CNode = {
      id: wrapperId,
      type: "frame",
      name: "Frame",
      x: bounds.x - 10,
      y: bounds.y - 10,
      w: bounds.w,
      h: bounds.h,
      rotation: 0,
      expanded: true,
      props: {
        name: "Frame",
        text: "",
        fill: "transparent",
        color: "#18181b",
        pad: 10,
        gap: 10,
        radius: 0,
        autoLayout: true,
        direction,
        layoutSizingHorizontal: "hug",
        layoutSizingVertical: "hug",
      },
      children: ordered.map((node) => ({ ...node, parentId: wrapperId })),
    };
    resizeAutoLayoutContainer(wrapper);
    const selected = new Set(nodes.map((node) => node.id));
    const directIndexes = topLevelLocations
      .filter((location) => location.siblings === siblings)
      .map((location) => siblings.findIndex((node) => node.id === location.node.id))
      .filter((index) => index >= 0);
    const insertAt = directIndexes.length ? Math.min(...directIndexes) : siblings.length;
    const affectedParents = new Set(topLevelLocations.map((location) => location.parent?.id).filter((id): id is string => !!id));
    topLevelLocations.forEach((location) => removeNode(sc.nodes, location.node.id));
    const remaining = siblings.filter((node) => !selected.has(node.id));
    remaining.splice(Math.max(0, insertAt), 0, wrapper);
    siblings.splice(0, siblings.length, ...remaining);
    affectedParents.forEach((id) => { if (id !== commonParent?.id) relayoutNodeAndAncestors(sc, id); });
    if (commonParent?.props.autoLayout) relayoutNodeAndAncestors(sc, commonParent.id);
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: [wrapper.id] } });
    get().pushHistory("GROUP", [wrapper.id, ...nodes.map((node) => node.id)]);
  },
  wrapSelectedInFrame: (autoLayout = false) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc || st.canvas.selIds.length !== 1) return;
    const location = findNodeLocation(sc.nodes, st.canvas.selIds[0]);
    if (!location || location.node.locked || location.node.visible === false) return;
    const index = location.siblings.findIndex((node) => node.id === location.node.id);
    if (index < 0) return;
    const wrapperId = uuid("frame");
    const child = { ...location.node, parentId: wrapperId, x: autoLayout ? 10 : 0, y: autoLayout ? 10 : 0 };
    const wrapper: CNode = {
      id: wrapperId,
      type: "frame",
      name: "Frame",
      x: location.node.x - (autoLayout ? 10 : 0),
      y: location.node.y - (autoLayout ? 10 : 0),
      w: location.node.w,
      h: location.node.h,
      rotation: 0,
      expanded: true,
      props: {
        name: "Frame",
        text: "",
        fill: "transparent",
        color: "#18181b",
        pad: autoLayout ? 10 : 0,
        gap: autoLayout ? 10 : undefined,
        radius: 0,
        autoLayout,
        direction: "row",
        layoutSizingHorizontal: autoLayout ? "hug" : undefined,
        layoutSizingVertical: autoLayout ? "hug" : undefined,
      },
      children: [child],
    };
    if (autoLayout) resizeAutoLayoutContainer(wrapper);
    location.siblings.splice(index, 1, wrapper);
    set({ canvas: { ...st.canvas, selIds: [wrapper.id] } });
    get().pushHistory("GROUP", [wrapper.id, child.id]);
  },
  ungroupSelected: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const ids = [...st.canvas.selIds];
    const targets = ids
      .map((id) => findNodeLocation(sc.nodes, id))
      .filter((location): location is NodeLocation => !!location && !!location.node.children?.length && !location.node.locked);
    if (!targets.length) return;
    const inserted: string[] = [];
    const affectedParents = new Set<string>();
    targets.forEach((location) => {
      const wrapper = location.node;
      const index = location.siblings.findIndex((node) => node.id === wrapper.id);
      if (index < 0) return;
      const local = (wrapper.children ?? []).map((child) => ({
        ...child,
        parentId: location.parent?.id,
        x: child.x + wrapper.x,
        y: child.y + wrapper.y,
      }));
      location.siblings.splice(index, 1, ...local);
      inserted.push(...local.map((c) => c.id));
      if (location.parent) affectedParents.add(location.parent.id);
    });
    affectedParents.forEach((id) => relayoutNodeAndAncestors(sc, id));
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: inserted } });
    get().pushHistory("UNGROUP", [...ids, ...inserted]);
  },
  selectAllEligible: () => set((st) => {
    const sc = getScreen(st.canvas.screen); if (!sc) return {};
    const ids: string[] = [];
    const stack = [...sc.nodes];
    while (stack.length) {
      const n = stack.shift()!;
      if ((n.visible === false) || n.locked) { if (n.children) stack.push(...n.children); continue; }
      ids.push(n.id);
      if (n.children) stack.push(...n.children);
    }
    return { canvas: { ...st.canvas, selIds: ids } };
  }),
  copySelected: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return {};
    const selected = st.canvas.selIds.map((id) => findNodeLocation(sc.nodes, id)).filter((item): item is NodeLocation => !!item);
    if (!selected.length) return;
    set({ canvas: { ...st.canvas, clipboard: selected.map((item) => ({ ...cloneNode(item.node), x: item.absX, y: item.absY })) } });
  },
  cutSelected: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return {};
    const selected = st.canvas.selIds.map((id) => findNodeLocation(sc.nodes, id)).filter((item): item is NodeLocation => !!item && item.node.visible !== false && !item.node.locked);
    if (!selected.length) return;
    const affectedParents = new Set(selected.map((item) => item.parent?.id).filter((id): id is string => !!id));
    selected.forEach((item) => removeNode(sc.nodes, item.node.id));
    affectedParents.forEach((id) => relayoutNodeAndAncestors(sc, id));
    const next = { ...st.canvas, selIds: [], clipboard: selected.map((item) => ({ ...cloneNode(item.node), x: item.absX, y: item.absY })) };
    set({ canvas: next });
    get().pushHistory("DELETE_FRAME", selected.map((item) => item.node.id));
  },
  pasteClipboard: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const buf = st.canvas.clipboard; if (!buf?.length) return;
    const offset = 20;
    const ids: string[] = [];
    const affectedParents = new Set<string>();
    buf.forEach((n) => {
      const targetParent = n.parentId ? findNodeById(sc, n.parentId) : undefined;
      const keepsAutoLayoutParent = !!targetParent?.props.autoLayout;
      const clone = cloneNode(n, keepsAutoLayoutParent ? 0 : offset);
      ids.push(clone.id);
      if (keepsAutoLayoutParent && targetParent) {
        clone.parentId = targetParent.id;
        targetParent.children = [...(targetParent.children ?? []), clone];
        affectedParents.add(targetParent.id);
      } else {
        clone.parentId = undefined;
        sc.nodes.push(clone);
      }
    });
    affectedParents.forEach((id) => relayoutNodeAndAncestors(sc, id));
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: ids } });
    ids.forEach((id) => {
      const pasted = findNodeById(sc, id);
      if (pasted && !pasted.parentId && (pasted.type !== "frame" || pasted.props.shapeKind)) get().autoParentNode(id);
    });
    get().pushHistory("PASTE", ids);
  },
  replaceSelectedWithClipboard: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc || !st.canvas.clipboard?.length || !st.canvas.selIds.length) return;
    const selectedSet = new Set(st.canvas.selIds);
    const targets = st.canvas.selIds
      .map((id) => findNodeLocation(sc.nodes, id))
      .filter((item): item is NodeLocation => !!item && !item.node.locked && item.node.visible !== false)
      .filter((item) => !st.canvas.selIds.some((otherId) => {
        if (otherId === item.node.id || !selectedSet.has(otherId)) return false;
        const other = findNodeById(sc, otherId);
        return !!other && containsNode(other, item.node.id);
      }));
    if (!targets.length) return;
    const replacements: string[] = [];
    const affectedParents = new Set<string>();
    targets.forEach((target, index) => {
      const template = st.canvas.clipboard![index % st.canvas.clipboard!.length];
      const replacement = cloneNode(template);
      replacement.x = target.node.x;
      replacement.y = target.node.y;
      replacement.parentId = target.parent?.id;
      const targetIndex = target.siblings.findIndex((node) => node.id === target.node.id);
      if (targetIndex < 0) return;
      target.siblings.splice(targetIndex, 1, replacement);
      replacements.push(replacement.id);
      if (target.parent?.props.autoLayout) affectedParents.add(target.parent.id);
    });
    affectedParents.forEach((id) => relayoutNodeAndAncestors(sc, id));
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: replacements } });
    get().pushHistory("PASTE", [...st.canvas.selIds, ...replacements]);
  },
  importFigmaClipboard: (payload, point) => {
    const envelope = payload && typeof payload === "object" ? payload as ForgeFigmaEnvelope : undefined;
    if (envelope?.format !== "forge-figma-json" || !Array.isArray(envelope.nodes) || !envelope.nodes.length) return 0;
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return 0;
    const assets = envelope.assets && typeof envelope.assets === "object" ? envelope.assets : {};
    const imported = envelope.nodes.map((node) => convertFigmaNode(node, assets));
    const minX = Math.min(...imported.map((node) => node.x));
    const minY = Math.min(...imported.map((node) => node.y));
    imported.forEach((node) => {
      node.x = point.x + node.x - minX;
      node.y = point.y + node.y - minY;
      sc.nodes.push(node);
    });
    const ids = imported.map((node) => node.id);
    set({ canvas: { ...st.canvas, selIds: ids }, activeTool: "move" });
    get().pushHistory("PASTE", ids);
    return imported.length;
  },
  autoParentNode: (id) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const location = findNodeLocation(sc.nodes, id);
    if (!location || location.node.locked) return;
    // Preserve explicit groups; auto-parenting is only for root nodes and
    // direct children that move between frames.
    if (location.parent && (location.parent.type !== "frame" || location.parent.props.shapeKind)) return;

    const centerX = location.absX + location.node.w / 2;
    const centerY = location.absY + location.node.h / 2;
    const target = frameLocations(sc.nodes)
      .filter(({ node, absX, absY }) =>
        node.id !== id &&
        !containsNode(location.node, node.id) &&
        centerX >= absX &&
        centerX <= absX + node.w &&
        centerY >= absY &&
        centerY <= absY + node.h
      )
      .sort((a, b) => (a.node.w * a.node.h) - (b.node.w * b.node.h))[0];

    const currentParentIsFrame = !!location.parent && location.parent.type === "frame" && !location.parent.props.shapeKind;
    if (!target && !currentParentIsFrame) return;
    if (target?.node.id === location.parent?.id) return;

    const sourceIndex = location.siblings.findIndex((node) => node.id === id);
    if (sourceIndex < 0) return;
    location.siblings.splice(sourceIndex, 1);
    if (location.parent?.props.autoLayout) resizeAutoLayoutContainer(location.parent);
    if (target) {
      location.node.x = location.absX - target.absX;
      location.node.y = location.absY - target.absY;
      location.node.parentId = target.node.id;
      target.node.children = [...(target.node.children ?? []), location.node];
      target.node.expanded = true;
      if (target.node.props.autoLayout) resizeAutoLayoutContainer(target.node);
    } else {
      location.node.x = location.absX;
      location.node.y = location.absY;
      location.node.parentId = undefined;
      sc.nodes.push(location.node);
    }
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas } });
  },
  dropNodeInAutoLayout: (id, point, position) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return false;
    const source = findNodeLocation(sc.nodes, id);
    if (!source || source.node.locked) return false;
    const preview = getAutoLayoutDropPreview(sc, id, point);
    const sourceAutoParent = source.parent?.props.autoLayout ? source.parent : null;
    if (!preview && !sourceAutoParent) return false;
    if (preview && sourceAutoParent && preview.parentId === sourceAutoParent.id) {
      const siblings = sourceAutoParent.children ?? [];
      const from = siblings.findIndex((child) => child.id === id);
      if (from < 0) return false;
      const [moved] = siblings.splice(from, 1);
      siblings.splice(Math.max(0, Math.min(preview.index, siblings.length)), 0, moved);
      resizeAutoLayoutContainer(sourceAutoParent);
      relayoutNodeAndAncestors(sc, sourceAutoParent.id);
      sc.nodes = [...sc.nodes];
      set({ canvas: { ...st.canvas, selIds: [id] } });
      get().pushHistory("MOVE_FRAMES", [id, sourceAutoParent.id]);
      return true;
    }

    const sourceParentId = source.parent?.id;
    const sourceIndex = source.siblings.findIndex((child) => child.id === id);
    if (sourceIndex < 0) return false;
    source.siblings.splice(sourceIndex, 1);
    source.node.parentId = undefined;
    if (sourceAutoParent) {
      if (source.node.props.layoutSizingHorizontal === "fill") source.node.props.layoutSizingHorizontal = "fixed";
      if (source.node.props.layoutSizingVertical === "fill") source.node.props.layoutSizingVertical = "fixed";
      resizeAutoLayoutContainer(sourceAutoParent);
      relayoutNodeAndAncestors(sc, sourceAutoParent.id);
    }

    if (preview) {
      const target = findNodeById(sc, preview.parentId);
      if (!target?.props.autoLayout || target.id === id || containsNode(source.node, target.id)) {
        source.siblings.splice(sourceIndex, 0, source.node);
        return false;
      }
      source.node.parentId = target.id;
      target.children = target.children ?? [];
      target.children.splice(Math.max(0, Math.min(preview.index, target.children.length)), 0, source.node);
      resizeAutoLayoutContainer(target);
      relayoutNodeAndAncestors(sc, target.id);
    } else {
      source.node.x = position?.x ?? source.absX;
      source.node.y = position?.y ?? source.absY;
      sc.nodes.push(source.node);
    }
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: [id] } });
    get().pushHistory("MOVE_FRAMES", [id, ...(sourceParentId ? [sourceParentId] : []), ...(preview ? [preview.parentId] : [])]);
    return true;
  },
  previewAutoLayoutReorder: (id, point) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return false;
    const source = findNodeLocation(sc.nodes, id);
    const preview = getAutoLayoutDropPreview(sc, id, point);
    if (!source?.parent?.props.autoLayout || !preview || preview.parentId !== source.parent.id) return false;
    const siblings = source.parent.children ?? [];
    const from = siblings.findIndex((child) => child.id === id);
    if (from < 0) return false;
    const [moved] = siblings.splice(from, 1);
    const to = Math.max(0, Math.min(preview.index, siblings.length));
    siblings.splice(to, 0, moved);
    if (from === to) return false;
    resizeAutoLayoutContainer(source.parent);
    relayoutNodeAndAncestors(sc, source.parent.id);
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas } });
    return true;
  },
  duplicateSelected: () => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const copies = st.canvas.selIds
      .map((id) => findNodeLocation(sc.nodes, id))
      .filter((item): item is NodeLocation => !!item && item.node.visible !== false && !item.node.locked)
      .map((item) => ({ item, copy: { ...cloneNode(item.node, 0, true), x: item.node.x + 20, y: item.node.y + 20 } }));
    if (!copies.length) return;
    const affectedParents = new Set<string>();
    copies.forEach(({ item, copy }) => {
      const sourceIndex = item.siblings.findIndex((node) => node.id === item.node.id);
      copy.parentId = item.parent?.id;
      item.siblings.splice(sourceIndex < 0 ? item.siblings.length : sourceIndex + 1, 0, copy);
      if (item.parent?.props.autoLayout) affectedParents.add(item.parent.id);
    });
    affectedParents.forEach((id) => relayoutNodeAndAncestors(sc, id));
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: copies.map(({ copy }) => copy.id) } });
    get().pushHistory("ADD_FRAME", copies.map(({ copy }) => copy.id));
  },
  addShape: (kind, geom) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const node: CNode = { id: uuid(), type: "frame", x: geom?.x ?? 40, y: geom?.y ?? 80 + sc.nodes.length * 8, w: geom?.w ?? 200, h: geom?.h ?? 120, rotation: 0, name: kind === "ellipse" ? "Ellipse" : "Rectangle", props: { text: "", fill: "#ffffff", color: "#18181b", pad: 0, shapeKind: kind || "rect" } };
    sc.nodes.push(node);
    set({ canvas: { ...st.canvas, selIds: [node.id] } });
    get().autoParentNode(node.id);
    get().pushHistory("ADD_FRAME", [node.id]);
  },
  addNode: (type, geom) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const isFrame = type === "frame";
    const isText = type === "text";
    const isImage = type === "image";
    const node: CNode = { id: uuid(), type, x: geom?.x ?? 40, y: geom?.y ?? 80 + sc.nodes.length * 8, w: geom?.w ?? (isFrame ? 360 : 200), h: geom?.h ?? (isFrame ? 640 : isText ? 28 : 120), rotation: 0, name: isFrame ? "Frame" : isText ? "Text" : type, props: { text: type === "button" ? "Button" : "", fill: isFrame ? "#ffffff" : isText || isImage ? "transparent" : type === "button" ? "#7c3aed" : "#fff", color: type === "button" ? "#fff" : "#18181b", placeholder: type === "input" ? "Input…" : undefined, pad: isFrame || isText || isImage ? 0 : 12, radius: isImage ? 0 : undefined, src: isImage ? "" : undefined, objectFit: isImage ? "cover" : undefined, imageScale: isImage ? 1 : undefined } };
    if (isText) Object.assign(node.props, { fontFamily: "Inter", weight: 400, textAlign: "left", textVerticalAlign: "top", paragraphSpacing: 0, textDecoration: "none", textCase: "original", listStyle: "none" });
    if (isText) Object.assign(node, measureTextNode(node, ""));
    sc.nodes.push(node);
    set({ canvas: { ...st.canvas, selIds: [node.id] } });
    get().autoParentNode(node.id);
    get().pushHistory("ADD_FRAME", [node.id]);
  },
  deleteNode: (id) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const target = findNodeById(sc, id);
    if (!target || target.locked || target.visible === false) return;
    const parentId = findNodeLocation(sc.nodes, id)?.parent?.id;
    removeNode(sc.nodes, id);
    if (parentId) relayoutNodeAndAncestors(sc, parentId);
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas, selIds: st.canvas.selIds.filter((selectedId) => selectedId !== id) } });
    get().pushHistory("DELETE_FRAME", [id]);
  },
  updateNode: (id, props) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const target = findNodeById(sc, id); if (!target || target.locked) return;
    const nextProps = { ...props };
    if (target.type === "frame" && props.autoLayout === true && !target.props.autoLayout) {
      nextProps.gap = props.gap ?? target.props.gap ?? 10;
      nextProps.padTop = props.padTop ?? target.props.padTop ?? 10;
      nextProps.padRight = props.padRight ?? target.props.padRight ?? 10;
      nextProps.padBottom = props.padBottom ?? target.props.padBottom ?? 10;
      nextProps.padLeft = props.padLeft ?? target.props.padLeft ?? 10;
      nextProps.layoutSizingHorizontal = props.layoutSizingHorizontal ?? target.props.layoutSizingHorizontal ?? "hug";
      nextProps.layoutSizingVertical = props.layoutSizingVertical ?? target.props.layoutSizingVertical ?? "hug";
    }
    if (target.type === "text") {
      (["fill", "fillMode", "gradientType", "gradientColors", "strokeColor", "strokeWidth", "pad", "padV", "padH", "padTop", "padRight", "padBottom", "padLeft", "radius", "autoLayout"] as const)
        .forEach((key) => delete nextProps[key]);
    }
    target.props = { ...target.props, ...nextProps };
    if (target.type === "text" && ["text", "size", "fontSize", "fontFamily", "weight", "letterSpacing", "lineHeight", "paragraphSpacing", "textCase", "verticalTrim", "listStyle", "truncateText"].some((key) => key in nextProps)) {
      const measured = measureTextNode(target, target.props.text ?? "");
      target.w = measured.w;
      target.h = measured.h;
      const location = findNodeLocation(sc.nodes, target.id);
      if (location?.parent) resizeAutoLayoutContainer(location.parent);
    }
    if (target.type === "frame" && target.props.autoLayout && ["autoLayout", "direction", "align", "justify", "gap", "pad", "padV", "padH", "padTop", "padRight", "padBottom", "padLeft", "layoutSizingHorizontal", "layoutSizingVertical"].some((key) => key in nextProps)) {
      resizeAutoLayoutContainer(target);
    } else if (!target.props.autoLayout && ["align", "justify"].some((key) => key in nextProps)) {
      alignNodeOrChildren(sc.nodes, target);
    }
    relayoutNodeAndAncestors(sc, target.id);
    set({ canvas: { ...st.canvas } });
    get().pushHistory("UPDATE_FRAME", [id]);
  },
  updateTextContent: (id, text) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const target = findNodeById(sc, id); if (!target || target.type !== "text" || target.locked) return;
    target.props = { ...target.props, text };
    const measured = measureTextNode(target, text);
    target.w = measured.w;
    target.h = measured.h;
    relayoutNodeAndAncestors(sc, target.id);
    set({ canvas: { ...st.canvas } });
  },
  setGeom: (id, geom) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const location = findNodeLocation(sc.nodes, id);
    const n = location?.node; if (!n || n.locked) return;
    const positionedByParent = !!location?.parent?.props.autoLayout;
    if (!positionedByParent && geom.x !== undefined) n.x = geom.x;
    if (!positionedByParent && geom.y !== undefined) n.y = geom.y;
    if (n.type !== "text" && geom.w !== undefined) {
      n.w = Math.max(MIN_W, geom.w);
      if (n.props.layoutSizingHorizontal === "fill" || n.props.layoutSizingHorizontal === "hug") n.props.layoutSizingHorizontal = "fixed";
      if (n.type === "frame" && n.props.autoLayout) n.props.layoutSizingHorizontal = "fixed";
    }
    if (n.type !== "text" && geom.h !== undefined) {
      n.h = Math.max(MIN_H, geom.h);
      if (n.props.layoutSizingVertical === "fill" || n.props.layoutSizingVertical === "hug") n.props.layoutSizingVertical = "fixed";
      if (n.type === "frame" && n.props.autoLayout) n.props.layoutSizingVertical = "fixed";
    }
    if (geom.w !== undefined || geom.h !== undefined) relayoutNodeAndAncestors(sc, n.id);
    if (geom.rotation !== undefined) n.rotation = ((geom.rotation % 360) + 360) % 360;
    set({ canvas: { ...st.canvas } });
  },
  setScreenSize: (w: number, h: number) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    sc.w = w; sc.h = h;
    set({ canvas: { ...st.canvas } });
    get().pushHistory("UPDATE_FRAME");
  },
  setCanvasBg: (color: string) => { set((st) => ({ canvas: { ...st.canvas, canvasBg: color } })); scheduleRemoteCanvasSave(); },
  setCanvasBgOpacity: (opacity: number) => { set((st) => ({ canvas: { ...st.canvas, canvasBgOpacity: Math.max(0, Math.min(1, opacity)) } })); scheduleRemoteCanvasSave(); },
  toggleCanvasBg: () => { set((st) => ({ canvas: { ...st.canvas, showCanvasBg: !st.canvas.showCanvasBg } })); scheduleRemoteCanvasSave(); },
  toggleNodeVisibility: (id: string) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const node = findNodeById(sc, id); if (!node) return;
    node.visible = !(node.visible !== false);
    set({ canvas: { ...st.canvas, selIds: node.visible === false ? st.canvas.selIds.filter((selectedId) => selectedId !== id) : st.canvas.selIds } });
    get().pushHistory("TOGGLE_VISIBILITY", [id]);
  },
  toggleNodeLock: (id: string) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const node = findNodeById(sc, id); if (!node) return;
    node.locked = !node.locked;
    set({ canvas: { ...st.canvas, selIds: node.locked ? st.canvas.selIds.filter((selectedId) => selectedId !== id) : st.canvas.selIds } });
    get().pushHistory("UPDATE_FRAME", [id]);
  },
  toggleNodeExpand: (id: string) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const node = findNodeById(sc, id); if (!node) return;
    node.expanded = !(node.expanded !== false);
    set({ canvas: { ...st.canvas } });
  },
  renameNode: (id: string, name: string) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const node = findNodeById(sc, id); if (!node) return;
    node.name = name;
    node.props = { ...node.props, name };
    set({ canvas: { ...st.canvas } });
    get().pushHistory("UPDATE_FRAME", [id]);
  },
  reorderNode: (id, dir) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc) return;
    const siblings = findSiblingArray(sc.nodes, id); if (!siblings) return;
    const i = siblings.findIndex((n) => n.id === id); if (i < 0) return;
    const j = i + dir; if (j < 0 || j >= siblings.length) return;
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    const parent = findNodeLocation(sc.nodes, id)?.parent;
    if (parent?.props.autoLayout) relayoutNodeAndAncestors(sc, parent.id);
    sc.nodes = [...sc.nodes];
    set({ canvas: { ...st.canvas } });
    get().pushHistory("MOVE_FRAMES", [id, ...(parent ? [parent.id] : [])]);
  },
  reorderNodeTo: (id, targetId) => {
    const st = get();
    const sc = getScreen(st.canvas.screen); if (!sc || id === targetId) return;
    const siblings = findSiblingArray(sc.nodes, id);
    const targetSiblings = findSiblingArray(sc.nodes, targetId);
    if (!siblings || siblings !== targetSiblings) return;
    const from = siblings.findIndex((node) => node.id === id);
    const to = siblings.findIndex((node) => node.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = siblings.splice(from, 1);
    siblings.splice(to, 0, moved);
    set({ canvas: { ...st.canvas } });
    get().pushHistory("UPDATE_FRAME", [id, targetId]);
  },
  pushHistory: (action = "UPDATE_FRAME", affectedIds = []) => {
    set((st) => {
    const history = st.canvas.history.slice(0, st.canvas.idx + 1);
    const screen = getScreen(st.canvas.screen);
    if (!screen) return {};
    const payload = snapshotString(screen, st.canvas.guides, st.canvas.zoom, st.canvas.pan);
    const inverse = st.canvas.idx >= 0 ? st.canvas.history[st.canvas.idx].payload : payload;
    if (st.canvas.idx >= 0 && st.canvas.history[st.canvas.idx].payload === payload) return {};
    history.push({ id: uuid("history"), timestamp: Date.now(), action, payload, inverse, affectedIds });
    let idx = history.length - 1;
    if (history.length > 100) { history.shift(); idx = 99; }
      return { canvas: { ...st.canvas, history, idx } };
    });
    scheduleRemoteCanvasSave();
  },
  commitHistory: (replaceCurrent = false, action = "MOVE_FRAMES", affectedIds = []) => {
    if (!replaceCurrent) {
      get().pushHistory(action, affectedIds);
      return;
    }
    set((st) => {
      if (st.canvas.idx < 0) return {};
      const history = [...st.canvas.history];
      history[st.canvas.idx] = {
        ...history[st.canvas.idx],
        action,
        affectedIds: affectedIds.length ? affectedIds : history[st.canvas.idx].affectedIds,
        payload: getScreen(st.canvas.screen) ? snapshotString(getScreen(st.canvas.screen)!, st.canvas.guides, st.canvas.zoom, st.canvas.pan) : history[st.canvas.idx].payload,
      };
      return { canvas: { ...st.canvas, history } };
    });
    scheduleRemoteCanvasSave();
  },
  undo: () => {
    const st = get();
    if (st.canvas.idx <= 0) return;
    const entry = st.canvas.history[st.canvas.idx];
    const screen = getScreen(st.canvas.screen); if (!screen) return;
    const snap = applySnapshotValue(entry.inverse, screen); if (!snap) return;
    set({ canvas: { ...st.canvas, idx: st.canvas.idx - 1, selIds: [], guides: snap.guides, zoom: snap.zoom, pan: snap.pan } });
    scheduleRemoteCanvasSave();
  },
  redo: () => {
    const st = get();
    if (st.canvas.idx >= st.canvas.history.length - 1) return;
    const idx = st.canvas.idx + 1;
    const value = st.canvas.history[idx].payload;
    const screen = getScreen(st.canvas.screen); if (!screen) return;
    const snap = applySnapshotValue(value, screen); if (!snap) return;
    set({ canvas: { ...st.canvas, idx, selIds: [], guides: snap.guides, zoom: snap.zoom, pan: snap.pan } });
    scheduleRemoteCanvasSave();
  },
  addGuide: (orientation, position) => {
    const id = uuid("guide");
    set((st) => ({ canvas: { ...st.canvas, guides: [...st.canvas.guides, { id, orientation, position }] } }));
    get().pushHistory("SET_GUIDE", [id]);
    return id;
  },
  updateGuide: (id, position) => { set((st) => ({
    canvas: { ...st.canvas, guides: st.canvas.guides.map((guide) => guide.id === id ? { ...guide, position } : guide) },
  })); scheduleRemoteCanvasSave(); },
  deleteGuide: (id) => {
    set((st) => ({ canvas: { ...st.canvas, guides: st.canvas.guides.filter((guide) => guide.id !== id) } }));
    get().pushHistory("SET_GUIDE", [id]);
  },
}));

export { KANBAN_COLS };
