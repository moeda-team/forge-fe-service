// Node-only fallback for the existing canvas-store smoke test. Next resolves
// `./api` to api.ts; this file prevents the lightweight CommonJS harness from
// needing browser fetch support while it exercises the synchronous canvas code.
const offline = async () => { throw new Error("Forge API is unavailable in the canvas smoke test"); };
module.exports = { assistantMessage: offline, createCurrentWorkspaceProject: offline, syncKanban: offline };
