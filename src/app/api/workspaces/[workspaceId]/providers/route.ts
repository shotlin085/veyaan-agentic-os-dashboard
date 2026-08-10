import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies app/providers/routes.py's real CRUD - the API key is only ever
// in the POST body on its way to the orchestrator; GET responses never
// include it (see ProviderResponse's schema, which has no key field).
export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/providers`), {
      headers: { authorization },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Provider service is unreachable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/providers`), {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Provider service is unreachable." }, { status: 503 });
  }
}
