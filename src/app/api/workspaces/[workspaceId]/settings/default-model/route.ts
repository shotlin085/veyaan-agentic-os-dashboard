import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies the workspace-level "what does Auto actually run" setting
// (app/providers/routes.py's settings_router) - real cost-safety
// restriction, not a UI-only preference: the backend applies this same
// value server-side when a message arrives with no explicit model chosen.
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/settings/default-model`),
      { headers: { authorization }, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Settings service is unreachable." }, { status: 503 });
  }
}

export async function PUT(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/settings/default-model`),
      { method: "PUT", headers: { authorization, "content-type": "application/json" }, body, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Settings service is unreachable." }, { status: 503 });
  }
}
