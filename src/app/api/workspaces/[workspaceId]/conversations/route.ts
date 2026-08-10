import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Hermes has always supported GET /workspaces/{id}/conversations - the
// dashboard just never proxied it before. Note the upstream response has
// no ordering, no pagination, and no created_at/updated_at (that lands
// with the conversation-history backend change), so a thread sidebar
// built on this can list and switch conversations but can't sort by
// recency or show a real timestamp yet.
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/conversations`), {
      headers: { authorization },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Hermes conversation API is unreachable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({ channel: "web" }));
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/conversations`), {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Hermes conversation API is unreachable." }, { status: 503 });
  }
}
