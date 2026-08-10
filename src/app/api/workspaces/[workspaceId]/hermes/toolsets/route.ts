import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies BE-4's passthrough (veyaan-hermes-orchestrator's
// app/hermes/passthrough_routes.py) for the real, workspace-scoped list of
// hermes-agent toolsets - 23 real tools with true enabled/configured
// flags, not a fixture.
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/hermes/toolsets`), {
      headers: { authorization },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Hermes toolsets API is unreachable." }, { status: 503 });
  }
}
