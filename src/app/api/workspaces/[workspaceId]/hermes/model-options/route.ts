import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies the orchestrator's BE-4 passthrough (app/hermes/passthrough_routes.py's
// GET /workspaces/{id}/hermes/model-options), which itself forwards to
// hermes-agent's own GET /api/model/options - the real catalog (34 models
// at last count) with per-token pricing and free/paid flags, confirmed
// live against the production box. Drives the composer's model picker.
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/hermes/model-options`),
      { headers: { authorization }, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "VEYAAN model catalog is unreachable." }, { status: 503 });
  }
}
