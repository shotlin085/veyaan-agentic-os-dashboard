import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

async function forward(request: Request, workspaceId: string, kind: string) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const upstream = new URL(assistantGatewayUrl(`/v1/control/projects/${encodeURIComponent(workspaceId)}/${encodeURIComponent(kind)}`));
  const incoming = new URL(request.url);
  incoming.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));
  upstream.searchParams.set("workspace_id", workspaceId);
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers: { authorization, "content-type": request.headers.get("content-type") ?? "application/json" },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Project Control is not reachable." }, { status: 503 });
  }
}

export async function GET(request: Request, { params }: { params: { workspaceId: string; kind: string } }) {
  return forward(request, params.workspaceId, params.kind);
}

export async function POST(request: Request, { params }: { params: { workspaceId: string; kind: string } }) {
  return forward(request, params.workspaceId, params.kind);
}
