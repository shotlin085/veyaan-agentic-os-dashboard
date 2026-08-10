"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LinkIcon, LockKeyhole, PlusIcon, SettingsIcon, TrashIcon, Unplug } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { McpServerPanel, type McpServer } from "@/components/elements/mcp-server-panel";
import { field, ghostButton, inkButton, mono, paper } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";
import { useDefaultModel, useProviders } from "@/components/assistant/runtime/hermes-providers";
import { useHermesModels } from "@/components/assistant/runtime/hermes-models";
import { useHermesToolsets } from "@/components/assistant/runtime/hermes-toolsets";
import { rememberConnectorWorkspace, useConnectors } from "@/components/assistant/runtime/hermes-connectors";
import { ProviderLogo } from "@/components/assistant/provider-logos";

// Best-effort brand match from a provider's base URL, purely for showing
// a real logo instead of a generic icon when the host is recognizable -
// falls back to the generic ProviderLogo chip for anything else rather
// than guessing wrong.
function guessProviderBrand(baseUrl: string): string {
  const host = baseUrl.toLowerCase();
  if (host.includes("openai.com")) return "OpenAI";
  if (host.includes("anthropic.com")) return "Anthropic";
  if (host.includes("googleapis.com") || host.includes("generativelanguage")) return "Google";
  if (host.includes("x.ai")) return "xAI";
  if (host.includes("deepseek.com")) return "DeepSeek";
  if (host.includes("openrouter.ai")) return "OpenRouter";
  return "";
}

/**
 * Real Hermes toolsets (BE-4's /workspaces/{id}/hermes/toolsets
 * passthrough - see useHermesToolsets, shared with the composer's
 * PluginsButton popover). No onAuthorize handler is wired: there's no
 * endpoint to flip a toolset's enabled state from here, so showing an
 * "Authorize" button would be decorative. This is read-only, honestly.
 */
export default function SettingsPage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const { toolsets, loading, error } = useHermesToolsets();
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);

  const servers: McpServer[] = toolsets.map((toolset) => ({
    id: toolset.name,
    name: toolset.label,
    transport: toolset.description,
    status: toolset.enabled ? "connected" : toolset.configured ? "needs-auth" : "failed",
    tools: toolset.tools,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 p-6 pb-16">
      <header className="flex items-center gap-3 border-b border-border pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground/70">
          <SettingsIcon className="size-4" />
        </div>
        <div>
          <p className={cn(mono, "text-foreground/35")}>VEYAAN / WORKSPACE</p>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      {!session || !workspace ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">
            Sign in and select an active workspace from the sidebar to load real settings.
          </p>
        </div>
      ) : (
        <>
          <ProvidersSection />
          <ConnectorsSection />
          <AutoModeSection />

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Hermes toolsets</h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-6 text-foreground/55">
                The real toolsets Hermes has available in this workspace, and whether each is
                actually enabled and configured on the runtime - not a fixture, and not editable
                from here yet.
              </p>
            </div>
            {error ? (
              <p className="text-[13px] leading-snug text-destructive/80">{error}</p>
            ) : loading && toolsets.length === 0 ? (
              <p className={cn(mono, "text-foreground/35")}>Loading toolsets...</p>
            ) : (
              <McpServerPanel
                servers={servers}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId((current) => (current === id ? undefined : id))}
                className="w-full max-w-none"
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

/**
 * Bring-your-own-key providers (app/providers/ on the orchestrator) - add
 * your own OpenAI/etc. API key here instead of SSHing in and editing a
 * .env file. Adding one calls the provider's real /models endpoint before
 * anything is saved (see the backend route's docstring), so a bad key or
 * URL fails visibly right away instead of silently.
 */
function ProvidersSection() {
  const { providers, loading, error, addProvider, removeProvider } = useProviders();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim()) {
      setFormError("Name, base URL, and API key are all required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = await addProvider({ name: name.trim(), base_url: baseUrl.trim(), api_key: apiKey.trim() });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setName("");
    setBaseUrl("https://api.openai.com/v1");
    setApiKey("");
    setFormOpen(false);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await removeProvider(id);
    setRemovingId(null);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">API providers</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-foreground/55">
            Your own API keys (OpenAI directly, or anything else that speaks the same
            OpenAI-compatible API) - stored encrypted, used only server-side to answer your
            messages when you pick one of its models in the composer. Real usage and cost per
            message show under each reply in chat; this provider&apos;s API doesn&apos;t publish
            per-token pricing, so a cost total isn&apos;t shown here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className={cn(inkButton, "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium")}
        >
          <PlusIcon className="size-3.5" />
          Add
        </button>
      </div>

      {formOpen && (
        <div className={cn(paper, "flex flex-col gap-3 rounded-2xl p-4")}>
          <label className="flex flex-col gap-1.5">
            <span className={cn(mono, "text-foreground/40")}>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My OpenAI key"
              className={cn(field, "rounded-xl px-3 py-2 text-[13.5px] outline-none")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={cn(mono, "text-foreground/40")}>Base URL</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className={cn(field, "rounded-xl px-3 py-2 text-[13.5px] outline-none")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={cn(mono, "text-foreground/40")}>API key</span>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder="sk-..."
              className={cn(field, "rounded-xl px-3 py-2 text-[13.5px] outline-none")}
            />
          </label>
          {formError && <p className="text-[12.5px] leading-snug text-destructive/80">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-8 rounded-full px-3.5 text-xs font-medium text-foreground/55 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/90"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={submitting}
              className={cn(inkButton, "h-8 rounded-full px-3.5 text-xs font-medium disabled:opacity-50")}
            >
              {submitting ? "Verifying..." : "Add provider"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[13px] leading-snug text-destructive/80">{error}</p>}
      {loading && providers.length === 0 ? (
        <p className={cn(mono, "text-foreground/35")}>Loading providers...</p>
      ) : providers.length === 0 && !formOpen ? (
        <p className={cn(mono, "text-foreground/35")}>No providers added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {providers.map((provider) => (
            <div key={provider.id} className={cn(paper, "flex items-center gap-3 rounded-2xl p-3")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
                <ProviderLogo provider={guessProviderBrand(provider.base_url)} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-foreground/90">{provider.name}</p>
                <p className={cn(mono, "text-foreground/35 truncate")}>
                  {provider.base_url} · {provider.models.length} models
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${provider.name}`}
                onClick={() => void handleRemove(provider.id)}
                disabled={removingId === provider.id}
                className={cn(ghostButton, "size-7 shrink-0 disabled:opacity-50")}
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Real OAuth2 connectors (app/connectors/ on the orchestrator) - GitHub,
 * Vercel, Supabase, Canva. Every one shows "Not configured yet" until a
 * real OAuth app's client_id/secret is set on the server; only a real
 * completed OAuth redirect ever flips a card to "Connected". Clicking
 * Connect opens the real provider's own authorize page in this tab -
 * this is a genuine external navigation, not a modal - and the flow
 * finishes on /connectors/{provider}/callback.
 */
function ConnectorsSection() {
  const { workspace } = useWorkspace();
  const { connectors, loading, error, startAuthorize, disconnect } = useConnectors();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConnect = async (provider: string) => {
    if (!workspace) return;
    setBusyProvider(provider);
    setActionError(null);
    const result = await startAuthorize(provider);
    if (!result.ok) {
      setActionError(result.error);
      setBusyProvider(null);
      return;
    }
    rememberConnectorWorkspace(workspace.id);
    window.location.href = result.url;
  };

  const handleDisconnect = async (provider: string) => {
    setBusyProvider(provider);
    setActionError(null);
    const result = await disconnect(provider);
    if (!result.ok) setActionError(result.error);
    setBusyProvider(null);
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Connectors</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-foreground/55">
          Real OAuth connections to other services this workspace can use as tools, separate from
          your API providers above. Each one needs a real OAuth app registered on the server
          before Connect will do anything - see the setup notes below a card that isn&apos;t
          configured yet.
        </p>
      </div>

      {error ? (
        <p className="text-[13px] leading-snug text-destructive/80">{error}</p>
      ) : loading && connectors.length === 0 ? (
        <p className={cn(mono, "text-foreground/35")}>Loading connectors...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {connectors.map((connector) => (
            <div key={connector.provider} className={cn(paper, "flex items-center gap-3 rounded-2xl p-3")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
                <ProviderLogo provider={connector.name} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-foreground/90">{connector.name}</p>
                <p className={cn(mono, "truncate", connector.connected ? "text-status-healthy" : "text-foreground/35")}>
                  {connector.connected
                    ? `Connected${connector.account_label ? ` · ${connector.account_label}` : ""}`
                    : connector.configured
                      ? "Not connected"
                      : "Not configured on this server yet"}
                </p>
              </div>
              {connector.connected ? (
                <button
                  type="button"
                  aria-label={`Disconnect ${connector.name}`}
                  onClick={() => void handleDisconnect(connector.provider)}
                  disabled={busyProvider === connector.provider}
                  className={cn(ghostButton, "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium disabled:opacity-50")}
                >
                  <Unplug className="size-3.5" />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleConnect(connector.provider)}
                  disabled={!connector.configured || busyProvider === connector.provider}
                  title={connector.configured ? undefined : `${connector.name} has no OAuth app configured on this server yet.`}
                  className={cn(inkButton, "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium disabled:opacity-40")}
                >
                  <LinkIcon className="size-3.5" />
                  {busyProvider === connector.provider ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {actionError && <p className="text-[12.5px] leading-snug text-destructive/80">{actionError}</p>}
    </section>
  );
}

/**
 * Real cost-safety restriction: what model "Auto" actually runs. Backed
 * by Workspace.meta.default_model, applied server-side in send_message
 * (streaming_routes.py's effective_model) - not just a UI label. Empty
 * means today's fast/escalate heuristic stays in effect.
 */
function AutoModeSection() {
  const { setting, loading, save } = useDefaultModel();
  const { models: catalogModels } = useHermesModels();
  const { providers } = useProviders();
  const [selection, setSelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!setting.model) {
      setSelection("");
    } else if (setting.provider_id) {
      setSelection(`custom:${setting.provider_id}:${setting.model}`);
    } else {
      setSelection(`hermes:${setting.model}`);
    }
  }, [setting]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    let value: { provider_id: string | null; model: string | null };
    if (!selection) {
      value = { provider_id: null, model: null };
    } else if (selection.startsWith("custom:")) {
      const [, providerId, ...rest] = selection.split(":");
      value = { provider_id: providerId ?? null, model: rest.join(":") };
    } else {
      value = { provider_id: null, model: selection.replace(/^hermes:/, "") };
    }
    const result = await save(value);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLabel = !setting.model
    ? "Automatic (fast reply, escalates to research when needed)"
    : setting.provider_id
      ? `${providers.find((p) => p.id === setting.provider_id)?.name ?? "Custom provider"} · ${setting.model}`
      : catalogModels.find((m) => m.id === setting.model)?.name ?? setting.model;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Auto mode</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-foreground/55">
          What the composer&apos;s &quot;Auto&quot; option actually runs. By default it&apos;s a
          free fast reply that escalates to Hermes&apos;s research agent when needed - restrict it
          to one specific model here if you want every message to predictably cost the same
          (or nothing), instead of occasionally escalating.
        </p>
      </div>

      <div className={cn(paper, "flex flex-col gap-3 rounded-2xl p-4")}>
        <p className={cn(mono, "text-foreground/35")}>Currently: {loading ? "loading..." : currentLabel}</p>
        <select
          value={selection}
          onChange={(e) => setSelection(e.target.value)}
          className={cn(field, "rounded-xl px-3 py-2 text-[13.5px] outline-none")}
        >
          <option value="">Automatic (default)</option>
          {catalogModels.length > 0 && (
            <optgroup label="Hermes catalog">
              {catalogModels.map((model) => (
                <option key={model.id} value={`hermes:${model.id}`}>
                  {model.name} {model.free ? "(free)" : `(${model.inputPrice}/M in)`}
                </option>
              ))}
            </optgroup>
          )}
          {providers.map(
            (provider) =>
              provider.models.length > 0 && (
                <optgroup key={provider.id} label={provider.name}>
                  {provider.models.map((model) => (
                    <option key={model} value={`custom:${provider.id}:${model}`}>
                      {model}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
        </select>
        {saveError && <p className="text-[12.5px] leading-snug text-destructive/80">{saveError}</p>}
        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-[12.5px] text-foreground/55">
              <CheckIcon className="size-3.5" /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={cn(inkButton, "h-8 rounded-full px-3.5 text-xs font-medium disabled:opacity-50")}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}
