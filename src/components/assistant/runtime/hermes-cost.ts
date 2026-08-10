"use client";

import { useEffect, useState } from "react";
import type { HermesModel } from "./hermes-models";
import type { CustomProvider } from "./hermes-providers";
import type { HermesRoute, HermesUsage } from "./hermes-adapter";

interface UseUsdToInrResult {
  rate: number | null;
  asOf: string | null;
  loading: boolean;
  error: string | null;
}

/** Real, live USD->INR rate (see src/app/api/fx/usd-inr/route.ts) - fetched
 * once per mount, not hardcoded. */
export function useUsdToInr(): UseUsdToInrResult {
  const [rate, setRate] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx/usd-inr", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String((payload as { error?: string }).error ?? "Exchange rate unavailable."));
        if (!cancelled) {
          setRate((payload as { rate: number }).rate);
          setAsOf((payload as { asOf: string | null }).asOf ?? null);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Exchange rate unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rate, asOf, loading, error };
}

export interface TurnCost {
  /** Human label for who actually answered - real per case, never guessed. */
  provider: string;
  modelLabel: string;
  usdCost: number | null;
  inrCost: number | null;
  /** Why usdCost/inrCost are null when they are - shown instead of a number,
   * never silently replaced with a fabricated 0 or guess. */
  unavailableReason: string | null;
}

const PRICE_PER_MILLION = 1_000_000;

function parseUsdPrice(price: string | null): number | null {
  if (!price) return null;
  const value = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : null;
}

/**
 * Real cost = real token counts (assistant.usage) x real per-token pricing
 * (GET .../hermes/model-options) x real FX rate - never estimated. The
 * three routing paths (see streaming_routes.py) have genuinely different
 * data available, so each is handled honestly rather than forced into one
 * number:
 *  - "model": a real catalog id was locked via the session API - full
 *    real pricing exists.
 *  - "fast": the free routing model (FAST_PATH_MODEL="openrouter/free") -
 *    genuinely $0, not an estimate.
 *  - "escalated": the fixed hermes-agent config (HERMES_MODEL="hermes-agent",
 *    not a catalog id) - no verified per-token price exists for that
 *    literal identifier, so cost is reported unavailable rather than
 *    guessed.
 *  - "custom": a bring-your-own-key provider (app/providers/) - real
 *    provider name and model shown, but no provider API exposes its own
 *    pricing, so cost is honestly unavailable here too (real input/
 *    output token counts are still shown - see ResponseMeta's "in"/"out"
 *    stats, which come from `usage` directly, not from this function).
 */
export function computeTurnCost(
  route: HermesRoute | undefined,
  usage: HermesUsage | undefined,
  models: readonly HermesModel[],
  usdToInr: number | null,
  customProviders: readonly CustomProvider[] = [],
): TurnCost {
  if (!route?.path) {
    return { provider: "—", modelLabel: "—", usdCost: null, inrCost: null, unavailableReason: "No route information yet." };
  }

  if (route.path === "fast") {
    return { provider: "OpenRouter", modelLabel: "Free routing model", usdCost: 0, inrCost: 0, unavailableReason: null };
  }

  if (route.path === "escalated") {
    return {
      provider: "Nous Research",
      modelLabel: route.model ?? "hermes-agent",
      usdCost: null,
      inrCost: null,
      unavailableReason: "No published per-token price for the research agent's fixed model.",
    };
  }

  if (route.path === "custom") {
    const provider = customProviders.find((p) => p.id === route.providerId);
    return {
      provider: provider?.name ?? "Custom provider",
      modelLabel: route.model ?? "—",
      usdCost: null,
      inrCost: null,
      unavailableReason: "This provider's API doesn't publish per-token pricing.",
    };
  }

  // path === "model": route.model is a real GET .../model-options catalog id.
  const catalogEntry = models.find((m) => m.id === route.model);
  if (!catalogEntry) {
    return {
      provider: "—",
      modelLabel: route.model ?? "—",
      usdCost: null,
      inrCost: null,
      unavailableReason: "Model catalog still loading.",
    };
  }

  if (catalogEntry.free) {
    return { provider: catalogEntry.provider, modelLabel: catalogEntry.name, usdCost: 0, inrCost: 0, unavailableReason: null };
  }

  const inputPrice = parseUsdPrice(catalogEntry.inputPrice);
  const outputPrice = parseUsdPrice(catalogEntry.outputPrice);
  if (inputPrice === null || outputPrice === null || !usage) {
    return {
      provider: catalogEntry.provider,
      modelLabel: catalogEntry.name,
      usdCost: null,
      inrCost: null,
      unavailableReason: "Waiting for usage data.",
    };
  }

  const usdCost =
    ((usage.promptTokens ?? 0) / PRICE_PER_MILLION) * inputPrice +
    ((usage.completionTokens ?? 0) / PRICE_PER_MILLION) * outputPrice;

  return {
    provider: catalogEntry.provider,
    modelLabel: catalogEntry.name,
    usdCost,
    inrCost: usdToInr !== null ? usdCost * usdToInr : null,
    unavailableReason: usdToInr === null ? "Exchange rate still loading." : null,
  };
}

export function formatInr(value: number | null): string {
  if (value === null) return "—";
  if (value < 1) return `₹${value.toFixed(3)}`;
  return `₹${value.toFixed(2)}`;
}
