export type Stage = 0 | 1 | 2 | 3 | 4;

export interface ReqItem {
  text: string;
  _new?: boolean;
}

export interface Requirement {
  prd: string;
  _newPrd?: boolean;
  stories: (string | ReqItem)[];
  fr: (string | ReqItem)[];
  nfr: (string | ReqItem)[];
  ac: (string | ReqItem)[];
  rules: (string | ReqItem)[];
}

export interface RequirementSnapshot {
  version: number;
  requirement: Requirement;
  sentAt: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  canvas?: string | null;
  reqRef?: string;
  requirementKey?: string | null;
  requirementVersion?: number | null;
  obsolete?: boolean;
  order?: number;
  status: "backlog" | "todo" | "progress" | "done";
}

export interface Project {
  id: string;
  name: string;
  type: string;
  stage: Stage;
  prog: number;
  live: boolean;
  req: boolean;
  requirement?: Requirement;
  reqVersion?: number;
  reqUpdatedAt?: number;
  kanbanSyncedVer?: number;
  requirementHistory?: RequirementSnapshot[];
  kanban?: { backlog: KanbanCard[]; todo: KanbanCard[]; progress: KanbanCard[]; done: KanbanCard[] };
  owners: string[];
  desc: string;
  updated: string;
}

export type ViewKey = "projects" | "ai" | "kanban" | "design" | "artifact";

export type ArtifactKind = "frontend" | "backend" | "database" | "testing";

export interface ArtifactContent {
  summary: string;
  sections: { title: string; items: string[] }[];
  tasks: { id: string; title: string; status: string; reqRef: string | null }[];
  files?: ArtifactFile[];
  quality?: ArtifactQualityReport;
}

export interface ArtifactQualityReport {
  status: "passed" | "failed";
  checkedAt: string;
  checks: { key: string; label: string; passed: boolean; detail: string }[];
}

export interface ArtifactFile {
  path: string;
  language: string;
  content: string;
}

export interface CanvasArtifact {
  id: string;
  projectId: string;
  kind: ArtifactKind;
  requirementVersion: number;
  status: string;
  content: ArtifactContent;
  createdAt: string;
  updatedAt: string;
}

export interface OrchestrationStep {
  key: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  fileCount?: number;
  taskCount?: number;
  checkCount?: number;
  error?: string;
}

export interface OrchestrationRun {
  id: string;
  projectId: string;
  requirementVersion: number;
  status: "running" | "completed" | "failed";
  trigger: "automatic" | "manual" | "retry";
  steps: OrchestrationStep[];
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NodeType = "frame" | "frame_group" | "text" | "button" | "input" | "card" | "row" | "section" | "image" | "component" | "line" | "arrow" | "polygon" | "star" | "svg" | "instance" | "group";

export type Tool = "move" | "hand" | "text" | "rect" | "ellipse" | "frame";

export interface CNode {
  id: string;
  type: NodeType;
  parentId?: string;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  zIndex?: number;
  visible?: boolean;
  locked?: boolean;
  selected?: boolean;
  expanded?: boolean;
  children?: CNode[];
  props: {
    name?: string;
  text?: string;
    fill?: string;
    fillOpacity?: number;
    fillVisible?: boolean;
    color?: string;
    size?: number;
    pad?: number;
    placeholder?: string;
    src?: string;
    objectFit?: string;
    imageScale?: number;
    shapeKind?: string;
    direction?: "row" | "col";
    autoLayout?: boolean;
    layoutSizingHorizontal?: "hug" | "fixed" | "fill";
    layoutSizingVertical?: "hug" | "fixed" | "fill";
    gap?: number;
    wrap?: boolean;
    align?: "start" | "center" | "end" | "stretch" | "between";
    justify?: "start" | "center" | "end" | "between" | "stretch";
    padV?: number;
    padH?: number;
    padTop?: number;
    padRight?: number;
    padBottom?: number;
    padLeft?: number;
    fillMode?: "solid" | "gradient";
    gradientType?: "linear" | "radial";
    gradientColors?: string[];
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeVisible?: boolean;
    strokePosition?: "inside" | "center" | "outside";
    blur?: number;
    weight?: number;
    opacity?: number;
    radius?: number;
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    letterSpacing?: number;
    lineHeight?: number;
    paragraphSpacing?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    textVerticalAlign?: "top" | "center" | "bottom";
    textDecoration?: "none" | "underline" | "line-through";
    textCase?: "original" | "upper" | "lower" | "title";
    verticalTrim?: boolean;
    listStyle?: "none" | "bulleted" | "numbered";
    truncateText?: boolean;
  };
}

export interface Screen {
  id?: string;
  revision?: number;
  name: string;
  w: number;
  h: number;
  nodes: CNode[];
  projectId?: string;
  guides?: Guide[];
  settings?: Partial<ScreenSettings>;
  history?: HistoryEntry[];
}

export interface ScreenSettings {
  canvasBg: string;
  canvasBgOpacity: number;
  showCanvasBg: boolean;
  showAlignmentGrid: boolean;
  showRulers: boolean;
  showMinimap: boolean;
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface Guide {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
  locked?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: "ADD_FRAME" | "DELETE_FRAME" | "UPDATE_FRAME" | "MOVE_FRAMES" | "GROUP" | "UNGROUP" | "PASTE" | "TOGGLE_VISIBILITY" | "SET_GUIDE" | "SET_ZOOM_PAN";
  payload: unknown;
  inverse: unknown;
  affectedIds: string[];
}

export interface CanvasState {
  screen: string;
  mode: "board" | "screen";
  selIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  guides: Guide[];
  history: HistoryEntry[];
  historyIndex: number;
  editingId: string | null;
  clipboard: CNode[] | null;
  tool: Tool;
  showAlignmentGrid: boolean;
  showRulers: boolean;
  showMinimap: boolean;
  scrollInertia?: boolean;
  canvasBg: string;
}
