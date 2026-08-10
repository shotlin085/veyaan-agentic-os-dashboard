import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Real, live, keyless forex rate (open.er-api.com - exchangerate-api.com's
// free tier, no API key needed, updates ~daily). Used to convert Hermes's
// USD per-token pricing (GET .../hermes/model-options) into INR for the
// cost meter - never a hardcoded/guessed rate. `revalidate: 3600` caches
// the upstream call for an hour at the Next.js fetch layer so every
// composer session doesn't hit the external API.
export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Forex API returned ${response.status}`);
    const payload = (await response.json()) as { rates?: { INR?: number }; time_last_update_utc?: string };
    const rate = payload.rates?.INR;
    if (typeof rate !== "number") throw new Error("Forex API response had no INR rate.");
    return NextResponse.json({ rate, asOf: payload.time_last_update_utc ?? null });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Could not fetch a live exchange rate." },
      { status: 503 },
    );
  }
}
