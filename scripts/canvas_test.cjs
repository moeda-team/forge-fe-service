const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

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

const { getScreen, useCanvas, useStore } = storeModule.exports;
const projectCount = useStore.getState().projects.length;
const blankProject = useStore.getState().addProject("   ", "Ignored");
assert.equal(blankProject, undefined, "Blank project names are rejected");
assert.equal(useStore.getState().projects.length, projectCount, "Rejected projects are not added");
const newProjectId = useStore.getState().addProject("  Forge Mobile  ", "  Mobile workspace  ");
assert.ok(newProjectId, "A valid project receives an ID");
const newProject = useStore.getState().projects.find((project) => project.id === newProjectId);
assert.equal(newProject?.name, "Forge Mobile", "Project name is trimmed");
assert.equal(newProject?.desc, "Mobile workspace", "Optional project description is stored");
assert.equal(newProject?.prog, 0, "New project starts at zero progress");
const atlasProject = useStore.getState().projects.find((project) => project.id === "ATL");
useStore.getState().sendToKanban("ATL");
assert.equal(atlasProject?.kanbanSyncedVer, atlasProject?.reqVersion, "Sending to Kanban marks the Requirement as synced");
assert.equal(atlasProject?.requirementHistory?.length, 1, "Sending to Kanban archives the synced Requirement version");
const firstSyncedVersion = JSON.stringify(atlasProject.requirementHistory[0].requirement);
const syncedTaskCount = atlasProject.kanban.backlog.length + atlasProject.kanban.todo.length + atlasProject.kanban.progress.length + atlasProject.kanban.done.length;
useStore.getState().sendChat("Add a functional requirement for audit logs");
assert.notEqual(atlasProject?.kanbanSyncedVer, atlasProject?.reqVersion, "Editing the Requirement marks Kanban for re-sync");
assert.equal(JSON.stringify(atlasProject.requirementHistory[0].requirement), firstSyncedVersion, "A new prompt does not mutate the Requirement already sent to Kanban");
useStore.getState().sendToKanban("ATL");
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
assert.equal(api().canvas.zoom, 0.25, "Zoom clamps to 25%");

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
assert.equal(autoFrame?.w, 180, "Auto-layout frame hugs the combined child width");
api().setGeom(autoFrame.id, { w: 300, h: 100 });
api().updateNode(autoFrame.id, { justify: "end", align: "center" });
assert.equal(autoFrame.children?.[0].x, 120, "Auto-layout horizontal alignment moves children to the end");
assert.equal(autoFrame.children?.[0].y, 30, "Auto-layout vertical alignment centers children");
assert.equal(autoFrame.props.layoutSizingHorizontal, "fixed", "Manually resized auto-layout dimensions remain fixed");

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
assert.doesNotMatch(canvasSource, /selected\s*\?\s*["'`][^"'`]*\bz-\d+/, "Selection does not assign a foreground z-index to the selected object");

console.log("canvas smoke test passed");
