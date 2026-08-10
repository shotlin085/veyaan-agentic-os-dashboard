"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { configured, loading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && session) router.replace("/"); }, [loading, router, session]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    if (result.error) setError(result.error.message);
    else router.replace("/");
    setBusy(false);
  }

  return <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10"><Card className="w-full max-w-md"><CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/30 bg-foreground/10 text-foreground"><KeyRound className="h-5 w-5" /></div><CardTitle className="mt-4 text-xl">Connect your workspace</CardTitle><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in with the existing Supabase account. VEYAAN will then load only workspaces where that account is an active member.</p></CardHeader><CardContent>{!configured ? <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm leading-6 text-status-warning">Supabase browser configuration is missing. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the dashboard environment, then restart Next.js.</div> : <form onSubmit={submit} className="space-y-4"><label className="block text-xs text-muted-foreground">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-white outline-none focus:border-foreground/60" autoComplete="email" /></label><label className="block text-xs text-muted-foreground">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-white outline-none focus:border-foreground/60" autoComplete="current-password" /></label>{error && <p role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-xs leading-5 text-status-danger">{error}</p>}<Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}<ArrowRight className="h-4 w-4" /></Button><p className="flex items-center gap-2 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-status-success" />The browser receives only the public Supabase key. Service-role credentials stay server-side.</p></form>}</CardContent></Card></main>;
}
