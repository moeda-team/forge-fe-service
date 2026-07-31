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

export type ViewKey = "projects" | "ai" | "kanban" | "design";

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
    layoutSizingHorizontal?: "hug" | "fixed";
    layoutSizingVertical?: "hug" | "fixed";
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
  };
}

export interface Screen {
  name: string;
  w: number;
  h: number;
  nodes: CNode[];
  projectId?: string;
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
