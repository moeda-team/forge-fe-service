import type { CNode } from "./types";

export type SizingMode = "fixed" | "hug" | "fill";

const MIN_SIZE = 1;

export function formatCanvasText(node: CNode, text: string) {
  const applyCase = (value: string) => {
    if (node.props.textCase === "upper") return value.toUpperCase();
    if (node.props.textCase === "lower") return value.toLowerCase();
    if (node.props.textCase === "title") return value.replace(/\b[a-z]/gi, (letter) => letter.toUpperCase());
    return value;
  };
  const cased = applyCase(text);
  if (node.props.listStyle === "bulleted") return cased.split("\n").map((line) => `• ${line}`).join("\n");
  if (node.props.listStyle === "numbered") return cased.split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n");
  return cased;
}

export function measureCanvasText(node: CNode, text: string) {
  const fontSize = Math.max(1, node.props.size ?? node.props.fontSize ?? 14);
  const fontFamily = node.props.fontFamily ?? "sans-serif";
  const fontWeight = node.props.weight ?? 400;
  const letterSpacing = node.props.letterSpacing ?? 0;
  const formattedText = formatCanvasText(node, text);
  const lines = (formattedText || " ").split("\n");
  let naturalWidth = 0;
  let glyphHeight = fontSize;
  if (typeof document !== "undefined") {
    const context = document.createElement("canvas").getContext("2d");
    if (context) {
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      for (const line of lines) {
        const content = line || " ";
        const metrics = context.measureText(content);
        naturalWidth = Math.max(naturalWidth, metrics.width + Math.max(0, content.length - 1) * letterSpacing);
        glyphHeight = Math.max(glyphHeight, (metrics.actualBoundingBoxAscent || fontSize * 0.8) + (metrics.actualBoundingBoxDescent || fontSize * 0.2));
      }
    }
  }
  if (!naturalWidth) naturalWidth = Math.max(...lines.map((line) => Math.max(1, line.length) * fontSize * 0.58 + Math.max(0, line.length - 1) * letterSpacing));
  const lineHeight = node.props.lineHeight && node.props.lineHeight > 0 ? node.props.lineHeight : Math.max(fontSize * 1.2, glyphHeight);
  const paragraphSpacing = Math.max(0, node.props.paragraphSpacing ?? 0) * Math.max(0, lines.length - 1);
  const safetyY = node.props.verticalTrim ? 0 : 2;
  return { w: Math.max(MIN_SIZE, Math.ceil(naturalWidth + 2)), h: Math.max(MIN_SIZE, Math.ceil(lines.length * lineHeight + paragraphSpacing + safetyY)) };
}

function padding(node: CNode) {
  const base = node.props.pad ?? 0;
  const horizontal = node.props.padH ?? base;
  const vertical = node.props.padV ?? base;
  return {
    top: Math.max(0, node.props.padTop ?? vertical), right: Math.max(0, node.props.padRight ?? horizontal),
    bottom: Math.max(0, node.props.padBottom ?? vertical), left: Math.max(0, node.props.padLeft ?? horizontal),
  };
}

export function layoutAutoLayout(node: CNode): void {
  if (!node.props.autoLayout) return;
  const children = node.children ?? [];
  for (const child of children) {
    child.parentId = node.id;
    if (child.props.autoLayout) layoutAutoLayout(child);
  }
  const pad = padding(node);
  const gap = Math.max(0, node.props.gap ?? 10);
  const row = node.props.direction !== "col";
  const horizontalMode = node.props.layoutSizingHorizontal ?? "hug";
  const verticalMode = node.props.layoutSizingVertical ?? "hug";
  const parentMainMode = row ? horizontalMode : verticalMode;
  const parentCrossMode = row ? verticalMode : horizontalMode;
  const mainSize = (child: CNode) => row ? child.w : child.h;
  const crossSize = (child: CNode) => row ? child.h : child.w;
  const mainMode = (child: CNode) => row ? child.props.layoutSizingHorizontal : child.props.layoutSizingVertical;
  const crossMode = (child: CNode) => row ? child.props.layoutSizingVertical : child.props.layoutSizingHorizontal;
  const mainPadding = row ? pad.left + pad.right : pad.top + pad.bottom;
  const crossPadding = row ? pad.top + pad.bottom : pad.left + pad.right;
  const gaps = gap * Math.max(0, children.length - 1);
  const maxCross = children.length ? Math.max(...children.map(crossSize)) : 0;
  // Only Hug derives its own dimensions from content. Fill dimensions are
  // assigned by the parent and must survive this node's internal layout pass.
  if (horizontalMode === "hug") node.w = Math.max(MIN_SIZE, pad.left + (row ? children.reduce((sum, child) => sum + child.w, 0) + gaps : maxCross) + pad.right);
  if (verticalMode === "hug") node.h = Math.max(MIN_SIZE, pad.top + (row ? maxCross : children.reduce((sum, child) => sum + child.h, 0) + gaps) + pad.bottom);

  const innerMain = Math.max(0, (row ? node.w : node.h) - mainPadding);
  const innerCross = Math.max(0, (row ? node.h : node.w) - crossPadding);
  // A Hug parent has no remaining space to distribute. In that circular
  // combination, Fill keeps its measured/current size and participates like
  // Hug until an ancestor gives the parent a concrete dimension.
  const canDistributeMain = parentMainMode !== "hug";
  const canFillCross = parentCrossMode !== "hug";
  const fills = canDistributeMain ? children.filter((child) => mainMode(child) === "fill") : [];
  const fixedMain = children.reduce((sum, child) => sum + (mainMode(child) === "fill" ? 0 : mainSize(child)), 0);
  const fillMain = fills.length ? Math.max(0, innerMain - fixedMain - gaps) / fills.length : 0;
  for (const child of children) {
    if (canDistributeMain && mainMode(child) === "fill") { if (row) child.w = fillMain; else child.h = fillMain; }
    if ((canFillCross && crossMode(child) === "fill") || node.props.align === "stretch") { if (row) child.h = innerCross; else child.w = innerCross; }
    if (child.props.autoLayout) layoutAutoLayout(child);
  }
  const occupied = children.reduce((sum, child) => sum + mainSize(child), 0) + gaps;
  const free = Math.max(0, innerMain - occupied);
  const justify = node.props.justify ?? "start";
  const actualGap = justify === "between" && children.length > 1 ? gap + free / (children.length - 1) : gap;
  let cursor = (row ? pad.left : pad.top) + (justify === "center" ? free / 2 : justify === "end" ? free : 0);
  for (const child of children) {
    const crossOffset = node.props.align === "center" ? (innerCross - crossSize(child)) / 2 : node.props.align === "end" ? innerCross - crossSize(child) : 0;
    if (row) { child.x = cursor; child.y = pad.top + Math.max(0, crossOffset); }
    else { child.x = pad.left + Math.max(0, crossOffset); child.y = cursor; }
    cursor += mainSize(child) + actualGap;
  }
}

export function layoutCanvasNodes(nodes: CNode[]) {
  for (const node of nodes) {
    if (node.children?.length) layoutCanvasNodes(node.children);
    if (node.props.autoLayout) layoutAutoLayout(node);
  }
}
