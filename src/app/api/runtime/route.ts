import { NextResponse } from "next/server";
import {
  assistantGatewayBaseUrl,
  internalServiceHeaders,
  requireGatewayWorkspaceAccess,
} from "@/lib/server/assistant-gateway";

const services = [
  { name: "Hermes Orchestrator", url: assistantGatewayBaseUrl, path: "/health/live" },
  { name: "JCode Runner", url: process.env.JCODE_RUNNER_URL ?? "http://127.0.0.1:8020", path: "/health/live" },
  { name: "Core Backend", url: process.env.CORE_BACKEND_URL ?? "http://127.0.0.1:8000", path: "/health/live" },
  { name: "Agent Workforce", url: process.env.WORKFORCE_URL ?? "http://127.0.0.1:8030", path: "/health/live" },
  { name: "Observability", url: process.env.OBSERVABILITY_URL ?? "http://127.0.0.1:8070", path: "/health/live" },
] as const;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireGatewayWorkspaceAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.detail }, { status: access.status });
  }

  const results = await Promise.all(services.map(async (service) => {
    try {
      const serviceHeaders = service.name === "Agent Workforce"
        ? internalServiceHeaders("veyaan-assistant-gateway", process.env.WORKFORCE_SERVICE_SECRET)
        : service.name === "JCode Runner"
          ? internalServiceHeaders("veyaan-assistant-gateway", process.env.RUNNER_SERVICE_SECRET)
          : {};
      const liveResponse = await fetch(`${service.url}${service.path}`, { headers: serviceHeaders, cache: "no-store", signal: AbortSignal.timeout(3000) });
      const liveBody = (await liveResponse.json().catch(() => ({}))) as Record<string, unknown>;
      if (!liveResponse.ok) return { name: service.name, state: "degraded", detail: `Liveness HTTP ${liveResponse.status}` };
      const readyResponse = await fetch(`${service.url}/health/ready`, { headers: serviceHeaders, cache: "no-store", signal: AbortSignal.timeout(3000) });
      const readyBody = (await readyResponse.json().catch(() => ({}))) as Record<string, unknown>;
      return { name: service.name, state: readyResponse.ok ? "online" : "degraded", detail: readyResponse.ok ? "ready" : String(readyBody.detail ?? readyBody.status ?? "dependencies unavailable"), live: String(liveBody.status ?? "alive") };
    } catch {
      return { name: service.name, state: "offline", detail: "Service is not reachable" };
    }
  }));
  let capabilities: Record<string, unknown> | null = null;
  const runner = services[1];
  try {
    const response = await fetch(`${runner.url}/internal/v1/capabilities`, {
      headers: internalServiceHeaders("veyaan-assistant-gateway", process.env.RUNNER_SERVICE_SECRET),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) capabilities = (await response.json()) as Record<string, unknown>;
  } catch { /* health state already reports runner reachability */ }

  const rawCapabilities = capabilities?.capabilities;
  const capabilityStates = rawCapabilities && typeof rawCapabilities === "object"
    ? Object.fromEntries(Object.entries(rawCapabilities as Record<string, unknown>).map(([name, state]) => [name, state === "ready" ? "ready" : state === "planned" ? "planned" : "unavailable"]))
    : {};

  const workspaceId = request.headers.get("x-veyaan-workspace-id");
  const workspace = access.workspaces.find((item) => item.id === workspaceId) ?? access.workspaces[0] ?? null;

  return NextResponse.json({
    services: results,
    capabilities,
    capabilityStates,
    authenticated: true,
    workspace,
    workspaceCount: access.workspaces.length,
    checkedAt: new Date().toISOString(),
  });
}
