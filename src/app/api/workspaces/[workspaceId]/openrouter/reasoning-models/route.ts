import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies veyaan-hermes-orchestrator's app/integrations/openrouter/routes.py
// - the real OpenRouter model catalog, filtered server-side to models whose
// own supported_parameters genuinely include "reasoning" (not a hand-
// maintained list). Powers the composer's direct-model picker + reasoning
// effort control (see hermes-adapter.ts's direct_model/reasoning_effort).
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/openrouter/reasoning-models`), {
      headers: { authorization },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "OpenRouter reasoning-models API is unreachable." }, { status: 503 });
  }
}
