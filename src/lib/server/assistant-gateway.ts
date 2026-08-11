/**
 * Server-only configuration and request helpers for the VEYAAN assistant
 * gateway (the Hermes Orchestrator today). Browser code must always call the
 * dashboard's `/api/*` routes; it must never receive this upstream URL.
 */

const configuredGatewayUrl =
  process.env.ASSISTANT_GATEWAY_URL ??
  process.env.ORCHESTRATOR_BASE_URL ??
  process.env.HERMES_API_URL ??
  "http://127.0.0.1:8090";

export const assistantGatewayBaseUrl = configuredGatewayUrl.replace(/\/+$/, "");

export function assistantGatewayUrl(path: string): string {
  return `${assistantGatewayBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function bearerAuthorization(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token ? `Bearer ${token}` : null;
}

/**
 * FastAPI's `detail` field is a plain string for a handler's own
 * `HTTPException(detail=...)`, but for a raw 422 (automatic Pydantic
 * request validation) it's an array of {loc, msg, type, ...} objects
 * instead - confirmed live as the actual cause of a real dashboard crash
 * (React error #31, "objects are not valid as a React child") when a
 * proxy route forwarded that array straight through as `error` and a
 * component rendered it as text. Every upstream-error proxy must run
 * `detail` through this before putting it in a JSON response.
 */
export function describeUpstreamDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((entry) => (entry && typeof entry === "object" && "msg" in entry ? String((entry as { msg?: unknown }).msg) : null))
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) return messages.join("; ");
  }
  return fallback;
}

export function internalServiceHeaders(
  serviceName: string,
  secret: string | undefined,
): Record<string, string> {
  return secret
    ? { "x-service-name": serviceName, "x-service-secret": secret }
    : {};
}

export type GatewayWorkspace = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  role: string | null;
};

type GatewayWorkspaceAccess =
  | { ok: true; authorization: string; workspaces: GatewayWorkspace[] }
  | { ok: false; status: 401 | 503; detail: string };

/**
 * Authenticate a dashboard request with the assistant gateway before serving
 * operational data. A valid bearer token is verified by Hermes; this avoids
 * treating a syntactically valid but expired/forged browser token as access.
 */
export async function requireGatewayWorkspaceAccess(
  request: Request,
): Promise<GatewayWorkspaceAccess> {
  const authorization = bearerAuthorization(request);
  if (!authorization) {
    return { ok: false, status: 401, detail: "Authentication required." };
  }

  try {
    const response = await fetch(assistantGatewayUrl("/workspaces"), {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return {
        ok: false,
        status: 401,
        detail: "Your session could not be verified.",
      };
    }

    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) {
      return { ok: false, status: 503, detail: "Assistant gateway returned an invalid workspace response." };
    }
    return { ok: true, authorization, workspaces: body as GatewayWorkspace[] };
  } catch {
    return { ok: false, status: 503, detail: "Assistant gateway is unavailable." };
  }
}
