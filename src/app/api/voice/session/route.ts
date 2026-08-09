import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const authorization = bearerAuthorization(request);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!authorization || !workspaceId) {
    return NextResponse.json({ detail: "Sign in and select a workspace before starting voice." }, { status: 401 });
  }
  try {
    const workspaceResponse = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(workspaceId)}`), {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!workspaceResponse.ok) {
      const detail = await workspaceResponse.text().catch(() => "Workspace access was denied.");
      return NextResponse.json({ detail: detail || "Workspace access was denied." }, { status: workspaceResponse.status === 404 ? 404 : 403 });
    }
    const response = await fetch(assistantGatewayUrl("/voice/sessions"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization },
      body: JSON.stringify({ workspace_id: workspaceId }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({
      detail: "Hermes returned an invalid voice-session response.",
    }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Hermes voice gateway is unreachable. Start the orchestrator first." },
      { status: 503 },
    );
  }
}
