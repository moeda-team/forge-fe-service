figma.showUI(__html__, { width: 340, height: 196, themeColors: true });

async function collectImageAssets(nodes) {
  const assets = {};

  async function visit(node) {
    if ("fills" in node && Array.isArray(node.fills) && node.fills.some((paint) => paint.type === "IMAGE" && paint.visible !== false)) {
      try {
        const bytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 1 },
        });
        assets[node.id] = `data:image/png;base64,${figma.base64Encode(bytes)}`;
      } catch {
        // Unsupported render nodes remain editable as their nearest Forge shape.
      }
    }
    if ("children" in node) {
      for (const child of node.children) await visit(child);
    }
  }

  for (const node of nodes) await visit(node);
  return assets;
}

async function exportSelection() {
  const selection = figma.currentPage.selection;
  if (!selection.length) {
    figma.ui.postMessage({ type: "empty" });
    return;
  }

  try {
    const documents = await Promise.all(selection.map(async (node) => {
      const exported = await node.exportAsync({ format: "JSON_REST_V1" });
      return exported.document || exported;
    }));
    const assets = await collectImageAssets(selection);
    figma.ui.postMessage({
      type: "ready",
      text: `FORGE_FIGMA_JSON:${JSON.stringify({
        format: "forge-figma-json",
        version: 1,
        nodes: documents,
        assets,
      })}`,
      count: selection.length,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Selection gagal diekspor.",
    });
  }
}

figma.ui.onmessage = (message) => {
  if (message.type === "refresh") exportSelection();
  if (message.type === "close") figma.closePlugin();
};

figma.on("selectionchange", exportSelection);
exportSelection();
