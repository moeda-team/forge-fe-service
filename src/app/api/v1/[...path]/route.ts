import type { NextRequest } from "next/server";

const backendUrl = () => (process.env.FORGE_API_URL || "").replace(/\/$/, "");
const hopByHop = new Set(["connection", "host", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const target = backendUrl();
  if (!target) return Response.json({ error: { code: "API_NOT_CONFIGURED", message: "Forge API is not configured" } }, { status: 503 });
  const url = new URL(`/api/v1/${context.params.path.map(encodeURIComponent).join("/")}`, target);
  url.search = request.nextUrl.search;
  const headers = new Headers(request.headers);
  hopByHop.forEach((header) => headers.delete(header));
  headers.set("x-forwarded-host", request.headers.get("host") || "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    // Streaming request bodies must be explicitly enabled in Node's fetch.
    // @ts-expect-error Next's RequestInit omits the Node-only duplex field.
    duplex: "half",
    redirect: "manual",
    cache: "no-store",
  });
  const responseHeaders = new Headers(response.headers);
  hopByHop.forEach((header) => responseHeaders.delete(header));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
