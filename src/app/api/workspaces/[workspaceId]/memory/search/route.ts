import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams({ workspace_id: params.workspaceId, q: incoming.get("q") ?? "" });
  for (const key of ["scope_type", "scope_id", "limit"]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  try {
    const response = await fetch(assistantGatewayUrl(`/v1/memories/search?${query.toString()}`), {
      headers: { authorization },
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Memory Service is not reachable." }, { status: 503 });
  }
}
