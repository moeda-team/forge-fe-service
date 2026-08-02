const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const typescript = fs.readFileSync(filename, "utf8");
  const javascript = ts.transpileModule(typescript, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(javascript, filename);
};

const sourcePath = path.join(process.cwd(), "src/lib/store.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
  fileName: sourcePath,
}).outputText;

const storeModule = new Module(sourcePath, module);
storeModule.filename = sourcePath;
storeModule.paths = Module._nodeModulePaths(process.cwd());
storeModule._compile(compiled, sourcePath);

const { getScreen, findNodeById, useCanvas, useStore } = storeModule.exports;
const { formatCanvasText, layoutCanvasNodes } = require(path.join(process.cwd(), "src/lib/canvasLayout.ts"));

async function main() {
const projectCount = useStore.getState().projects.length;
const blankProject = await useStore.getState().addProject("   ", "Ignored");
assert.equal(blankProject, undefined, "Blank project names are rejected");
assert.equal(useStore.getState().projects.length, projectCount, "Rejected projects are not added");
const newProjectId = await useStore.getState().addProject("  Forge Mobile  ", "  Mobile workspace  ");
assert.ok(newProjectId, "A valid project receives an ID");
const newProject = useStore.getState().projects.find((project) => project.id === newProjectId);
assert.equal(newProject?.name, "Forge Mobile", "Project name is trimmed");
assert.equal(newProject?.desc, "Mobile workspace", "Optional project description is stored");
assert.equal(newProject?.prog, 0, "New project starts at zero progress");
const atlasProject = useStore.getState().projects.find((project) => project.id === "ATL");
await useStore.getState().sendToKanban("ATL");
assert.equal(atlasProject?.kanbanSyncedVer, atlasProject?.reqVersion, "Sending to Kanban marks the Requirement as synced");
assert.equal(atlasProject?.requirementHistory?.length, 1, "Sending to Kanban archives the synced Requirement version");
const firstSyncedVersion = JSON.stringify(atlasProject.requirementHistory[0].requirement);
const syncedTaskCount = atlasProject.kanban.backlog.length + atlasProject.kanban.todo.length + atlasProject.kanban.progress.length + atlasProject.kanban.done.length;
await useStore.getState().sendChat("Add a functional requirement for audit logs");
assert.notEqual(atlasProject?.kanbanSyncedVer, atlasProject?.reqVersion, "Editing the Requirement marks Kanban for re-sync");
assert.equal(JSON.stringify(atlasProject.requirementHistory[0].requirement), firstSyncedVersion, "A new prompt does not mutate the Requirement already sent to Kanban");
await useStore.getState().sendToKanban("ATL");
assert.equal(atlasProject?.kanbanSyncedVer, atlasProject?.reqVersion, "Re-sync updates Kanban to the latest Requirement version");
assert.equal(atlasProject?.requirementHistory?.length, 2, "Re-sync archives the new Requirement as a separate version");
const resyncedTaskCount = atlasProject.kanban.backlog.length + atlasProject.kanban.todo.length + atlasProject.kanban.progress.length + atlasProject.kanban.done.length;
assert.ok(resyncedTaskCount > syncedTaskCount, "Re-sync adds tasks generated from the latest Requirement");
const dashboard = getScreen("Dashboard");
assert.ok(dashboard, "Dashboard screen exists");
assert.equal(dashboard.nodes.length, 0, "New canvas starts empty");
const atlasDesign = getScreen("Atlas Design");
assert.ok(atlasDesign, "Atlas design example canvas exists");
assert.equal(atlasDesign.nodes.length, 2, "Atlas canvas contains login and register examples");
assert.equal(atlasDesign.nodes[0].name, "Atlas · Login", "Atlas login frame is available");
assert.equal(atlasDesign.nodes[1].name, "Atlas · Register", "Atlas register frame is available");
assert.ok(atlasDesign.nodes[1].x > atlasDesign.nodes[0].w, "Login and register frames are placed side by side");
assert.equal(atlasDesign.nodes[0].children?.[0].children?.[0].type, "image", "Login sample includes an image layer");
assert.equal(atlasDesign.nodes[1].children?.[1].children?.[0].type, "image", "Register sample includes an image layer");

const api = () => useCanvas.getState();
assert.equal(api().canvas.canvasBg, "#f5f5f5", "Canvas background defaults to #f5f5f5");
assert.equal(api().canvas.showCanvasBg, true, "Canvas background is visible by default");
api().setCanvasBgOpacity(2);
assert.equal(api().canvas.canvasBgOpacity, 1, "Canvas background opacity clamps to 100%");
api().toggleCanvasBg();
assert.equal(api().canvas.showCanvasBg, false, "Canvas background visibility can be toggled");
api().toggleCanvasBg();

api().addNode("frame", { x: 10, y: 20 });
let frame = dashboard.nodes[0];
assert.equal(frame.w, 360, "Frame default width is 360");
assert.equal(frame.h, 640, "Frame default height is 640");
assert.equal(frame.props.fill, "#ffffff", "Frame default fill is white");
assert.deepEqual(api().canvas.selIds, [frame.id], "Created frame is selected");
api().addShape("rect", { x: 500, y: 20, w: 80, h: 40 });
const shiftSelectTarget = api().canvas.selIds[0];
api().setSel(frame.id);
api().setSel(shiftSelectTarget, true);
assert.deepEqual(api().canvas.selIds, [frame.id, shiftSelectTarget], "Shift-click semantics add another node to the selection");
api().setSel(shiftSelectTarget, true);
assert.deepEqual(api().canvas.selIds, [frame.id], "Shift-clicking an already selected node toggles it out of the selection");
api().deleteNode(shiftSelectTarget);

api().duplicateSelected();
assert.equal(dashboard.nodes.length, 2, "Duplicate creates a second frame");
const copy = dashboard.nodes[1];
assert.notEqual(copy.id, frame.id, "Duplicate receives a new ID");
assert.equal(copy.x, frame.x + 20, "Duplicate offsets x by 20");
assert.equal(copy.y, frame.y + 20, "Duplicate offsets y by 20");
assert.match(copy.name, /^Copy of /, "Duplicate name is prefixed");

api().toggleNodeLock(copy.id);
api().deleteNode(copy.id);
assert.equal(dashboard.nodes.length, 2, "Locked frame cannot be deleted");
api().toggleNodeLock(copy.id);
api().setSel(copy.id);
api().deleteNode(copy.id);
assert.equal(dashboard.nodes.length, 1, "Unlocked selected frame can be deleted");

api().undo();
assert.equal(dashboard.nodes.length, 2, "Undo restores deleted frame");
api().redo();
assert.equal(dashboard.nodes.length, 1, "Redo reapplies deletion");

api().setSel(frame.id);
api().copySelected();
api().pasteClipboard();
assert.equal(dashboard.nodes.length, 2, "Paste creates a frame");
assert.equal(dashboard.nodes[1].x, frame.x + 20, "Paste offsets x by 20");

api().toggleNodeVisibility(frame.id);
api().setSel(frame.id);
assert.ok(!api().canvas.selIds.includes(frame.id), "Hidden frame is not selectable");
api().toggleNodeVisibility(frame.id);

api().setZoom(100);
assert.equal(api().canvas.zoom, 32, "Zoom clamps to 3200%");
api().setZoom(0.01);
assert.equal(api().canvas.zoom, 0.05, "Zoom clamps to 5%");

const guideId = api().addGuide("vertical", 12);
api().updateGuide(guideId, -25);
assert.equal(api().canvas.guides[0].position, -25, "Guide supports negative coordinates");
api().deleteGuide(guideId);
assert.equal(api().canvas.guides.length, 0, "Guide can be deleted");

api().setActiveTool("ellipse");
api().setActiveTool("move");
assert.equal(api().activeTool, "move", "Move tool can be activated by shortcut handler");

api().addNode("frame", { x: 1000, y: 1000 });
const hostFrame = dashboard.nodes.find((node) => node.x === 1000 && node.y === 1000);
assert.ok(hostFrame, "Host frame is created at root");
api().addNode("text", { x: 1020, y: 1020 });
const nestedText = hostFrame.children?.[0];
assert.ok(nestedText, "Element created inside a frame becomes its child");
assert.equal(nestedText.props.text, "", "New text starts empty for immediate typing");
assert.equal(nestedText.props.fill, "transparent", "Text has no background");
assert.equal(nestedText.props.pad, 0, "Text has no internal padding");
const emptyTextWidth = nestedText.w;
api().updateTextContent(nestedText.id, "asdasd");
assert.ok(nestedText.w > emptyTextWidth, "Text width grows with its content");
const autoWidth = nestedText.w;
const autoHeight = nestedText.h;
api().setGeom(nestedText.id, { w: 999, h: 999 });
assert.equal(nestedText.w, autoWidth, "Text width cannot be resized manually");
assert.equal(nestedText.h, autoHeight, "Text height cannot be resized manually");
api().updateNode(nestedText.id, { size: 28 });
assert.ok(nestedText.h > autoHeight, "Text bounds respond to typography size");
const singleLineHeight = nestedText.h;
api().updateTextContent(nestedText.id, "Ascender\nDescender gy");
assert.ok(nestedText.h > singleLineHeight, "Multiline text height grows with its line count");
api().updateNode(nestedText.id, { fontFamily: "Georgia", weight: 700, lineHeight: 30, paragraphSpacing: 10, letterSpacing: 1.5, textAlign: "center", textVerticalAlign: "bottom", textDecoration: "underline", textCase: "title", listStyle: "numbered" });
assert.equal(nestedText.props.fontFamily, "Georgia", "Typography supports changing font family");
assert.equal(nestedText.props.weight, 700, "Typography supports bold and thin font weights");
assert.equal(nestedText.h, 72, "Text height includes custom line height, paragraph spacing, and safety space");
assert.equal(formatCanvasText(nestedText, "first\nsecond"), "1. First\n2. Second", "Text case and numbered list formatting are applied consistently");
assert.equal(nestedText.props.textAlign, "center", "Horizontal text alignment is stored");
assert.equal(nestedText.props.textVerticalAlign, "bottom", "Vertical text alignment is stored");
api().updateNode(nestedText.id, { verticalTrim: true });
assert.equal(nestedText.h, 70, "Vertical trim removes the text safety space");
api().updateNode(nestedText.id, { lineHeight: undefined, paragraphSpacing: 0, letterSpacing: 0, textCase: "original", listStyle: "none", verticalTrim: false });
api().updateTextContent(nestedText.id, "a".repeat(40));
assert.ok(nestedText.w > 200, "Text width keeps expanding for long single-line content");
api().updateNode(nestedText.id, { fill: "#ff0000", strokeWidth: 4, radius: 12 });
assert.equal(nestedText.props.fill, "transparent", "Text background cannot be set directly");
assert.equal(nestedText.props.strokeWidth, undefined, "Text stroke cannot be set directly");
assert.equal(nestedText.props.radius, undefined, "Text radius cannot be set directly");
assert.equal(nestedText.x, 20, "Nested element x is converted to frame-local coordinates");
assert.equal(nestedText.y, 20, "Nested element y is converted to frame-local coordinates");

api().setGeom(nestedText.id, { x: 500, y: 700 });
api().autoParentNode(nestedText.id);
assert.ok(dashboard.nodes.some((node) => node.id === nestedText.id), "Element dragged outside a frame returns to root");

api().setSel(nestedText.id);
api().wrapSelectedInFrame(true);
const wrapperId = api().canvas.selIds[0];
const wrapper = dashboard.nodes.find((node) => node.id === wrapperId);
assert.ok(wrapper, "Text can be wrapped in a frame");
assert.equal(wrapper.props.autoLayout, true, "Auto-layout wrapper is enabled");
assert.equal(wrapper.props.pad, 10, "Single-selection auto layout starts with 10px padding");
assert.equal(wrapper.props.gap, 10, "Single-selection auto layout starts with a 10px gap");
assert.equal(wrapper.props.fill, "transparent", "Wrapper starts without a background color");
assert.equal(wrapper.children?.[0].id, nestedText.id, "Text appears beneath wrapper in the layer tree");
api().updateNode(wrapper.id, { fill: "#ff0000", strokeWidth: 2, radius: 12, pad: 8 });
assert.equal(wrapper.props.fill, "#ff0000", "Wrapper accepts a background color");
assert.equal(wrapper.props.strokeWidth, 2, "Wrapper accepts stroke");
assert.equal(wrapper.props.radius, 12, "Wrapper accepts radius");
assert.equal(wrapper.props.pad, 8, "Wrapper accepts padding");

api().addShape("rect", { x: 1200, y: 900, w: 100, h: 40 });
const autoChildA = api().canvas.selIds[0];
api().addShape("rect", { x: 1350, y: 900, w: 80, h: 40 });
const autoChildB = api().canvas.selIds[0];
api().setSel(autoChildA);
api().setSel(autoChildB, true);
api().autoLayoutSelected();
const autoFrame = dashboard.nodes.find((node) => node.id === api().canvas.selIds[0]);
assert.equal(autoFrame?.type, "frame", "Shift+A selection creates a frame");
assert.equal(autoFrame?.props.autoLayout, true, "Shift+A frame has auto layout enabled");
assert.deepEqual(autoFrame?.children?.map((node) => node.id), [autoChildA, autoChildB], "Selected layers become children of the auto-layout frame");
assert.equal(autoFrame?.w, 210, "Auto-layout frame hugs children with default padding and gap");
assert.equal(autoFrame?.h, 60, "Auto-layout frame height includes default vertical padding");
api().addNode("frame", { x: 1700, y: 900, w: 160, h: 100 });
const selectedFrameA = api().canvas.selIds[0];
api().addNode("frame", { x: 1890, y: 900, w: 140, h: 100 });
const selectedFrameB = api().canvas.selIds[0];
api().setSel(selectedFrameA);
api().setSel(selectedFrameB, true);
api().autoLayoutSelected();
const framesAutoLayout = findNodeById(dashboard, api().canvas.selIds[0]);
assert.equal(framesAutoLayout?.props.autoLayout, true, "Two selected frames can create an Auto Layout");
assert.deepEqual(framesAutoLayout?.children?.map((node) => node.type), ["frame", "frame"], "Frame children stay frames inside Auto Layout");
assert.ok(framesAutoLayout?.children?.every((node) => node.parentId === framesAutoLayout.id), "Frame children reference exactly one Auto Layout parent");
api().deleteNode(framesAutoLayout.id);
const crossParentA = { id: "cross-parent-a", type: "frame", name: "Parent A", x: 2100, y: 900, w: 180, h: 180, props: { fill: "transparent" }, children: [{ id: "cross-child-a", parentId: "cross-parent-a", type: "frame", name: "Child A", x: 20, y: 20, w: 80, h: 60, props: { fill: "transparent" } }] };
const crossParentB = { id: "cross-parent-b", type: "frame", name: "Parent B", x: 2350, y: 900, w: 180, h: 180, props: { fill: "transparent" }, children: [{ id: "cross-child-b", parentId: "cross-parent-b", type: "frame", name: "Child B", x: 20, y: 20, w: 80, h: 60, props: { fill: "transparent" } }] };
dashboard.nodes.push(crossParentA, crossParentB);
api().setSel("cross-child-a");
api().setSel("cross-child-b", true);
api().autoLayoutSelected();
const crossParentAutoLayout = findNodeById(dashboard, api().canvas.selIds[0]);
assert.equal(crossParentAutoLayout?.props.autoLayout, true, "Frames from different parents can create an Auto Layout");
assert.deepEqual(crossParentAutoLayout?.children?.map((node) => node.id), ["cross-child-a", "cross-child-b"], "Cross-parent frame selection preserves visual ordering");
assert.equal(crossParentA.children.length, 0, "First old parent no longer owns the moved frame");
assert.equal(crossParentB.children.length, 0, "Second old parent no longer owns the moved frame");
api().deleteNode(crossParentAutoLayout.id);
api().deleteNode(crossParentA.id);
api().deleteNode(crossParentB.id);
api().setSel(autoFrame.id);
const fixedChildX = autoFrame.children?.[0].x;
api().setGeom(autoFrame.children[0].id, { x: 999, y: 999 });
assert.equal(autoFrame.children?.[0].x, fixedChildX, "Auto-layout children reject absolute movement");
api().setGeom(autoFrame.id, { w: 300, h: 100 });
api().updateNode(autoFrame.id, { justify: "end", align: "center" });
assert.equal(autoFrame.children?.[0].x, 100, "Auto-layout horizontal alignment moves children to the end");
assert.equal(autoFrame.children?.[0].y, 30, "Auto-layout vertical alignment centers children");
assert.equal(autoFrame.props.layoutSizingHorizontal, "fixed", "Manually resized auto-layout dimensions remain fixed");
api().updateNode(autoFrame.children[0].id, { layoutSizingHorizontal: "fill" });
assert.equal(autoFrame.children?.[0].w, 190, "Fill width consumes the parent space left after padding, gap, and fixed siblings");
api().updateNode(autoFrame.id, { layoutSizingHorizontal: "hug", layoutSizingVertical: "hug" });
assert.equal(autoFrame.w, 300, "Hug content follows the current child widths plus padding and gap");
api().updateNode(autoFrame.id, { layoutSizingHorizontal: "fixed", layoutSizingVertical: "fixed" });
api().setGeom(autoFrame.id, { w: 400, h: 120 });
api().updateNode(autoFrame.children[1].id, { layoutSizingHorizontal: "fill", layoutSizingVertical: "fill" });
api().updateNode(autoFrame.children[0].id, { layoutSizingVertical: "fill" });
assert.equal(autoFrame.children[0].w, 185, "Multiple Fill Width children split the remaining width evenly");
assert.equal(autoFrame.children[1].w, 185, "The second Fill Width child receives the same remaining width");
assert.equal(autoFrame.children[0].h, 100, "Fill Height follows the parent height minus vertical padding");
api().setGeom(autoFrame.id, { w: 300, h: 90 });
assert.equal(autoFrame.children[0].w, 135, "Fill Width recalculates while the parent shrinks");
assert.equal(autoFrame.children[0].h, 70, "Fill Height recalculates while the parent shrinks");
autoFrame.children[0].w = 1;
autoFrame.children[1].w = 1;
layoutCanvasNodes([autoFrame]);
assert.equal(autoFrame.children[0].w, 135, "Loading a saved tree recalculates stale Fill Width values");

const nestedFillFrame = {
  id: "nested-fill-frame", type: "frame", x: 0, y: 0, w: 40, h: 40,
  props: { autoLayout: true, direction: "row", pad: 10, gap: 10, layoutSizingHorizontal: "fill", layoutSizingVertical: "fixed" },
  children: [{ id: "nested-fill-text", type: "text", x: 10, y: 10, w: 20, h: 20, props: { text: "A" } }],
};
const nestedFillParent = {
  id: "nested-fill-parent", type: "frame", x: 0, y: 0, w: 300, h: 100,
  props: { autoLayout: true, direction: "col", pad: 10, gap: 10, layoutSizingHorizontal: "fixed", layoutSizingVertical: "fixed" },
  children: [nestedFillFrame],
};
layoutCanvasNodes([nestedFillParent]);
assert.equal(nestedFillFrame.w, 280, "A nested Auto Layout Fill Width keeps the width assigned by its parent wrapper");

const childAId = autoFrame.children[0].id;
const childBId = autoFrame.children[1].id;
const historyBeforePreview = api().canvas.history.length;
assert.equal(api().previewAutoLayoutReorder(childBId, { x: autoFrame.x + 11, y: autoFrame.y + autoFrame.h / 2 }), true, "Drag preview reorders siblings before mouseup");
assert.deepEqual(autoFrame.children.map((node) => node.id), [childBId, childAId], "Live drag preview moves siblings smoothly into their prospective order");
assert.equal(api().canvas.history.length, historyBeforePreview, "Live preview does not create intermediate history entries");
const reorderHandled = api().dropNodeInAutoLayout(childBId, { x: autoFrame.x + 11, y: autoFrame.y + autoFrame.h / 2 });
assert.equal(reorderHandled, true, "Dragging an Auto Layout child is handled as a hierarchy operation");
assert.deepEqual(autoFrame.children.map((node) => node.id), [childBId, childAId], "Horizontal drag reorders children without absolute positioning");
api().undo();
let currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.deepEqual(currentAutoFrame.children.map((node) => node.id), [childAId, childBId], "Undo restores the child order");
api().redo();
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.deepEqual(currentAutoFrame.children.map((node) => node.id), [childBId, childAId], "Redo reapplies the child order");

const detachHandled = api().dropNodeInAutoLayout(childBId, { x: 2200, y: 2100 }, { x: 2150, y: 2050 });
assert.equal(detachHandled, true, "Dragging outside detaches a child from Auto Layout");
let detached = findNodeById(getScreen("Dashboard"), childBId);
assert.equal(detached.parentId, undefined, "Detached child no longer has a parentId");
assert.equal(detached.props.layoutSizingHorizontal, "fixed", "Detached Fill Width becomes Fixed");
assert.equal(detached.props.layoutSizingVertical, "fixed", "Detached Fill Height becomes Fixed");
assert.equal(detached.x, 2150, "Detached child keeps the visual drag position");
api().undo();
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.ok(currentAutoFrame.children.some((node) => node.id === childBId), "Undo reattaches the detached child exactly once");
api().redo();
detached = findNodeById(getScreen("Dashboard"), childBId);
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
const attachHandled = api().dropNodeInAutoLayout(childBId, { x: currentAutoFrame.x + currentAutoFrame.w - 11, y: currentAutoFrame.y + currentAutoFrame.h / 2 });
assert.equal(attachHandled, true, "A canvas object can be attached to an Auto Layout parent");
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(findNodeById(getScreen("Dashboard"), childBId).parentId, currentAutoFrame.id, "Attach updates parentId");
assert.equal(currentAutoFrame.children.filter((node) => node.id === childBId).length, 1, "Attach never duplicates the child");
const currentWrapper = findNodeById(getScreen("Dashboard"), wrapper.id);
const crossParentHandled = api().dropNodeInAutoLayout(childBId, { x: currentWrapper.x + currentWrapper.w / 2, y: currentWrapper.y + currentWrapper.h / 2 });
assert.equal(crossParentHandled, true, "A child can move directly between Auto Layout parents");
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.some((node) => node.id === childBId), false, "Cross-parent move removes the child from its old parent");
assert.equal(findNodeById(getScreen("Dashboard"), childBId).parentId, currentWrapper.id, "Cross-parent move assigns the new parent exactly once");
api().undo();
assert.equal(findNodeById(getScreen("Dashboard"), childBId).parentId, autoFrame.id, "Undo restores a cross-parent move");

currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
const childCountBeforePaste = currentAutoFrame.children.length;
api().setSel(childAId);
api().copySelected();
api().pasteClipboard();
const pastedAutoChildId = api().canvas.selIds[0];
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.length, childCountBeforePaste + 1, "Pasting a copied Auto Layout child adds a sibling to the same wrapper");
assert.equal(findNodeById(getScreen("Dashboard"), pastedAutoChildId).parentId, autoFrame.id, "Pasted child keeps its Auto Layout parent context");
assert.equal(currentAutoFrame.children.filter((node) => node.id === pastedAutoChildId).length, 1, "Pasting into Auto Layout never duplicates hierarchy references");
api().undo();
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.length, childCountBeforePaste, "Undo removes the pasted Auto Layout child");
api().setSel(childAId);
api().duplicateSelected();
const duplicatedAutoChildId = api().canvas.selIds[0];
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(findNodeById(getScreen("Dashboard"), duplicatedAutoChildId).parentId, autoFrame.id, "Duplicate inserts directly into the same Auto Layout wrapper");
assert.equal(currentAutoFrame.children.findIndex((node) => node.id === duplicatedAutoChildId), currentAutoFrame.children.findIndex((node) => node.id === childAId) + 1, "Duplicate is inserted immediately after its source child");
api().undo();
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
const replaceTargetIndex = currentAutoFrame.children.findIndex((node) => node.id === childBId);
api().setSel(childAId);
api().copySelected();
api().setSel(childBId);
api().replaceSelectedWithClipboard();
const replacementId = api().canvas.selIds[0];
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.length, childCountBeforePaste, "Replace keeps the Auto Layout child count unchanged");
assert.equal(currentAutoFrame.children[replaceTargetIndex].id, replacementId, "Cmd+Shift+R replaces the target in the same sibling slot");
assert.equal(findNodeById(getScreen("Dashboard"), replacementId).parentId, autoFrame.id, "Replacement keeps the target Auto Layout parent");
assert.equal(findNodeById(getScreen("Dashboard"), childBId), undefined, "Replace removes the original target node");
api().undo();
assert.ok(findNodeById(getScreen("Dashboard"), childBId), "Undo restores the replaced target");
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
const childCountBeforeCut = currentAutoFrame.children.length;
api().setSel(childAId);
api().cutSelected();
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.length, childCountBeforeCut - 1, "Ctrl+X removes the selected child from its Auto Layout parent");
assert.equal(findNodeById(getScreen("Dashboard"), childAId), undefined, "Cut removes the original node from the canvas hierarchy");
assert.ok(api().canvas.clipboard?.length, "Cut stores the selected node in the internal clipboard");
api().pasteClipboard();
const pastedCutId = api().canvas.selIds[0];
currentAutoFrame = findNodeById(getScreen("Dashboard"), autoFrame.id);
assert.equal(currentAutoFrame.children.length, childCountBeforeCut, "Paste restores the cut child count");
assert.equal(findNodeById(getScreen("Dashboard"), pastedCutId).parentId, autoFrame.id, "A pasted cut child returns to the same Auto Layout parent");
api().undo();
api().undo();
assert.ok(findNodeById(getScreen("Dashboard"), childAId), "Undo restores the original node after cut and paste");

api().addNode("frame", { x: 1600, y: 900, w: 300, h: 200 });
const alignedFrameId = api().canvas.selIds[0];
api().addShape("rect", { x: 1650, y: 950, w: 100, h: 40 });
const alignedFrame = dashboard.nodes.find((node) => node.id === alignedFrameId);
assert.equal(alignedFrame?.children?.length, 1, "Alignment test shape is nested in its frame");
api().updateNode(alignedFrameId, { justify: "end", align: "center" });
assert.equal(alignedFrame?.children?.[0].x, 200, "Non-auto-layout horizontal alignment moves child content");
assert.equal(alignedFrame?.children?.[0].y, 80, "Non-auto-layout vertical alignment moves child content");

api().addNode("image", { x: 2100, y: 1200, w: 320, h: 180 });
const imageNode = dashboard.nodes.find((node) => node.id === api().canvas.selIds[0]);
assert.equal(imageNode?.props.pad, 0, "Image has no default padding");
assert.equal(imageNode?.props.fill, "transparent", "Image has no default background");
assert.equal(imageNode?.props.radius, 0, "Image has no default corner radius");

const figmaImported = api().importFigmaClipboard({
  format: "forge-figma-json",
  version: 1,
  nodes: [{
    id: "1:1",
    type: "FRAME",
    name: "Imported card",
    absoluteBoundingBox: { x: 500, y: 300, width: 240, height: 120 },
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
    strokes: [{ type: "SOLID", color: { r: 0, g: 0.6, b: 1 } }],
    strokeWeight: 2,
    layoutMode: "HORIZONTAL",
    itemSpacing: 12,
    paddingLeft: 16,
    paddingRight: 16,
    children: [{
      id: "1:2",
      type: "TEXT",
      name: "Label",
      characters: "From Figma",
      absoluteBoundingBox: { x: 516, y: 340, width: 80, height: 20 },
      fills: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.3 } }],
      style: { fontSize: 16, fontWeight: 600, fontFamily: "Inter" },
    }],
  }],
  assets: {},
}, { x: 2500, y: 1400 });
assert.equal(figmaImported, 1, "Figma bridge imports one top-level selection");
const importedFrame = dashboard.nodes.find((node) => node.name === "Imported card");
assert.ok(importedFrame, "Imported Figma frame appears on the canvas");
assert.equal(importedFrame.x, 2500, "Imported selection is placed at the paste point");
assert.equal(importedFrame.props.fill, "#ffffff", "Figma solid fill is converted to Forge color");
assert.equal(importedFrame.props.strokeColor, "#0099ff", "Figma stroke is converted to Forge color");
assert.equal(importedFrame.props.autoLayout, true, "Figma auto layout is preserved");
assert.equal(importedFrame.props.direction, "row", "Figma auto-layout direction is preserved");
assert.equal(importedFrame.children?.[0].x, 16, "Figma child position becomes frame-local");
assert.equal(importedFrame.children?.[0].props.text, "From Figma", "Figma text stays editable");
assert.equal(importedFrame.children?.[0].props.color, "#1a334d", "Figma text color is preserved");
assert.deepEqual(api().canvas.selIds, [importedFrame.id], "Imported top-level layer is selected");

const selectableBackLayer = dashboard.nodes.find((node) => node.visible !== false && !node.locked);
assert.ok(selectableBackLayer, "Canvas contains an unlocked layer for selection ordering tests");
const orderBeforeSelection = dashboard.nodes.map((node) => node.id);
api().setSel(selectableBackLayer.id);
assert.deepEqual(api().canvas.selIds, [selectableBackLayer.id], "Layer Panel selection sets the active layer");
assert.deepEqual(dashboard.nodes.map((node) => node.id), orderBeforeSelection, "Selecting a back layer never changes sibling ordering");

const selectedIndex = dashboard.nodes.findIndex((node) => node.id === selectableBackLayer.id);
const arrangeDirection = selectedIndex < dashboard.nodes.length - 1 ? 1 : -1;
api().reorderNode(selectableBackLayer.id, arrangeDirection);
assert.notDeepEqual(dashboard.nodes.map((node) => node.id), orderBeforeSelection, "An explicit Arrange action changes sibling ordering");

const canvasSource = fs.readFileSync(path.join(process.cwd(), "src/components/DesignCanvas.tsx"), "utf8");
assert.match(canvasSource, /data-selection-overlay="true"/, "Selection chrome is rendered in a dedicated canvas overlay");
assert.match(canvasSource, /insertionIndicator/, "Auto Layout drag renders an insertion indicator");
assert.match(canvasSource, /userSelect:\s*editingId\s*===\s*n\.id\s*\?\s*["']text["']\s*:\s*["']none["']/, "Canvas selection prevents native blue text highlighting outside text editing mode");
assert.match(canvasSource, /mod\s*&&\s*e\.shiftKey\s*&&\s*key\s*===\s*["']r["']/, "Cmd+Shift+R triggers paste-to-replace");
assert.match(canvasSource, /mod\s*&&\s*key\s*===\s*["']x["']/, "Ctrl/Cmd+X triggers cut on the canvas selection");
assert.match(canvasSource, /const distance = e\.shiftKey \? 10 : 1/, "Arrow keys nudge selection by 1px or 10px with Shift");
assert.match(canvasSource, /movesAlongLayout[\s\S]*?reorderNode\(id, e\.key === "ArrowLeft"/, "Left and right arrows reorder children in row Auto Layout without pixel offsets");
assert.match(canvasSource, /role="menu" aria-label="Canvas actions"/, "Right-click opens the canvas action menu");
assert.match(canvasSource, /aria-label="Add layer or canvas"/, "Header plus button opens project creation actions");
assert.match(canvasSource, /aria-label="Delete guide"/, "A selected ruler guide exposes a visible delete button");
assert.match(canvasSource, /if \(selectedGuideId\)[\s\S]*?deleteGuide\(selectedGuideId\)/, "Delete and Backspace remove the selected guide");
assert.match(canvasSource, /createNewLayer[\s\S]*?addNode\("frame"/, "New layer action inserts a frame into the active canvas");
assert.match(canvasSource, /New canvas[\s\S]*?Add screen to this project/, "Create menu exposes a new canvas in the current project");
assert.match(canvasSource, /label="Ungroup"[\s\S]*?ungroupSelected\(\)/, "Context menu exposes Ungroup for container selections");
assert.match(canvasSource, /document\.addEventListener\("pointerdown", finishTextFromOutsideClick, true\)/, "Clicking anywhere outside the active text editor finishes text editing");
assert.match(canvasSource, /canvas\.selIds\.includes\(n\.id\)[\s\S]*?textClick:\s*true/, "A second click on selected text enters text editing");
assert.doesNotMatch(canvasSource, /setSel\(n\.id, additiveSelection\);\s*if \(editingId !== n\.id\) pendingTextEdit/, "A first click selects text without immediately entering editing");
const editableTextSource = fs.readFileSync(path.join(process.cwd(), "src/components/EditableText.tsx"), "utf8");
assert.match(editableTextSource, /data-canvas-text-editor="true"/, "Editable text identifies clicks that must keep text editing active");
assert.match(editableTextSource, /onMouseDown=\{\(event\) => event\.stopPropagation\(\)\}/, "Text editor pointer input does not trigger canvas node dragging");
assert.match(canvasSource, /Preparing canvas/, "Canvas renders a workspace loading state while remote data is pending");
assert.match(canvasSource, /loadRemoteCanvas\(currentProjectId,\s*\(progress\)/, "Canvas subscribes to real remote loading progress");
assert.match(canvasSource, /style=\{\{ width: `\$\{progress\}%` \}\}/, "Canvas progress bar width follows loaded data progress");
assert.match(canvasSource, /setRemoteCanvasProgress\(100\)[\s\S]*?setTimeout\([\s\S]*?setRemoteCanvasLoading\(false\)/, "Completed canvas loading visibly reaches 100% before the workspace opens");
assert.match(canvasSource, /vp\.addEventListener\("wheel", onCanvasWheel, \{ passive: false \}\);[\s\S]*?\}, \[remoteCanvasLoading\]\);/, "Canvas wheel listener mounts after remote loading completes");
assert.match(canvasSource, /Math\.max\(0\.05, Math\.min\(32, current\.zoom/, "Canvas supports zooming out to five percent for a wider workspace");
assert.match(canvasSource, /loading=["']lazy["']/, "Canvas images use native lazy loading");
const inspectorSource = fs.readFileSync(path.join(process.cwd(), "src/components/SelectedNodeInspector.tsx"), "utf8");
assert.match(inspectorSource, /Font family/, "Typography inspector exposes font family controls");
assert.match(inspectorSource, /Paragraph spacing/, "Typography inspector exposes paragraph spacing controls");
const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(pageSource, /dynamic\(\(\)\s*=>\s*import\(["']@\/components\/DesignCanvas["']\)/, "Design Canvas bundle is lazy-loaded at the view boundary");
const kanbanSource = fs.readFileSync(path.join(process.cwd(), "src/components/Kanban.tsx"), "utf8");
assert.match(kanbanSource, /Execution Board/, "Kanban uses the execution-board visual hierarchy from the design reference");
assert.match(kanbanSource, /Overall progress/, "Kanban exposes overall completion progress");
assert.match(kanbanSource, /style=\{\{ width: `\$\{progress\}%` \}\}/, "Kanban task cards render status progress bars");
assert.match(kanbanSource, /kanban-scan-line/, "In-progress task previews render the moving scanner animation");
const globalStylesSource = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globalStylesSource, /@keyframes kanban-scan[\s\S]*?translateY\(310%\)/, "Kanban scanner sweeps vertically across the preview");
assert.doesNotMatch(canvasSource, /selected\s*\?\s*["'`][^"'`]*\bz-\d+/, "Selection does not assign a foreground z-index to the selected object");
assert.match(canvasSource, /whiteSpace:\s*n\.type\s*===\s*["']text["']\s*\?\s*["']pre["']/, "Text remains unwrapped after its editing state closes");

const latestSnapshot = JSON.parse(api().canvas.history.at(-1).payload);
assert.equal(latestSnapshot.version, 2, "Canvas history uses the compact snapshot format");
assert.ok(latestSnapshot.screen, "Compact history stores only the active screen");
assert.equal(latestSnapshot.screens, undefined, "Canvas history never embeds every screen");
assert.equal(latestSnapshot.screen.history, undefined, "A history snapshot never recursively embeds older history");
assert.match(source, /forgeApi\.saveScreenDocument/, "Canvas persistence uses the atomic document endpoint");
assert.doesNotMatch(source, /JSON\.stringify\(\{\s*screens:\s*SCREENS/, "Canvas snapshots cannot recursively serialize screen history");

console.log("canvas smoke test passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
