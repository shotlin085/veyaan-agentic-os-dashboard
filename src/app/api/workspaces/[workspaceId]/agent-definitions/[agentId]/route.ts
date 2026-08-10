import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { workspaceId: string; agentId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/agent-definitions/${encodeURIComponent(params.agentId)}`),
      { headers: { authorization }, cache: "no-store" },
    );
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Hermes agent API is unreachable." }, { status: 503 });
  }
}

// The backend's PATCH /workspaces/{id}/agent-definitions/{agentId}
// (app/agents/routes.py) has existed since P2-T02 — this proxy just
// never had a handler for it (only GET was ever wired), so there was no
// way to actually edit a stored agent definition from outside the
// backend itself. Same pass-through shape as POST on the collection
// route.
export async function PATCH(request: Request, { params }: { params: { workspaceId: string; agentId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/agent-definitions/${encodeURIComponent(params.agentId)}`),
      {
        method: "PATCH",
        headers: { authorization, "content-type": "application/json" },
        body,
        cache: "no-store",
      },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Hermes agent API is unreachable." }, { status: 503 });
  }
}
