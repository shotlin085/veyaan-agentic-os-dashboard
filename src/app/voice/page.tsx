"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, PhoneOff, Radio, RefreshCw, Search, Volume2 } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

type VoiceStatus = "ready" | "connecting" | "listening" | "thinking" | "researching" | "speaking" | "error";
type VoiceEvent = { type?: string; sequence?: number; message?: string; text?: string; speaker?: string; activity?: string };

const statusCopy: Record<VoiceStatus, string> = {
  ready: "Ready",
  connecting: "Connecting",
  listening: "Listening",
  thinking: "Thinking",
  researching: "Researching",
  speaking: "Speaking",
  error: "Error",
};

const IDLE_CAPTION = "Tap once to start — VEYAAN will greet you and start listening.";

function decodeEvent(data: Uint8Array): VoiceEvent | null {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as VoiceEvent;
  } catch {
    return null;
  }
}

export default function VoicePage() {
  const { session, user } = useAuth();
  const { workspace } = useWorkspace();
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState<string>();
  const [status, setStatus] = useState<VoiceStatus>("ready");
  const [caption, setCaption] = useState(IDLE_CAPTION);
  const [userCaption, setUserCaption] = useState<string>();
  const [events, setEvents] = useState<VoiceEvent[]>([]);
  const [error, setError] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [micHeld, setMicHeld] = useState(false);

  const addEvent = useCallback((event: VoiceEvent) => {
    setEvents((current) => [...current.slice(-7), event]);
    if (event.type === "error") setError(event.message ?? "Voice agent error");
    if (event.type === "caption" && event.speaker === "assistant" && event.text) setCaption(event.text);
    if (event.type === "caption" && event.speaker === "user" && event.text) setUserCaption(event.text);
    if (event.type === "state" && event.activity) {
      const activity = event.activity.toLowerCase();
      if (activity.includes("research")) setStatus("researching");
      else if (activity.includes("speak")) setStatus("speaking");
      else if (activity.includes("think") || activity.includes("wait")) setStatus("thinking");
      else if (activity.includes("listen") || activity.includes("speech")) setStatus("listening");
      else if (activity.includes("ready")) setStatus("ready");
    }
  }, []);

  const disconnect = useCallback(async () => {
    setMicHeld(false);
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    setRoomName(undefined);
    setStatus("ready");
    setCaption(IDLE_CAPTION);
    setUserCaption(undefined);
    setEvents([]);
  }, []);

  const connect = useCallback(async () => {
    if (roomRef.current || connecting) return;
    setConnecting(true);
    setError(undefined);
    setStatus("connecting");
    try {
      const response = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ identity: `dashboard-${user?.id ?? crypto.randomUUID()}`, workspaceId: workspace?.id }),
      });
      const payload = await response.json() as { room?: string; url?: string; token?: string; detail?: string };
      if (!response.ok || !payload.url || !payload.token || !payload.room) throw new Error(payload.detail ?? "Voice session could not be created.");
      const room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.DataReceived, (data) => {
        const event = decodeEvent(data);
        if (event) addEvent(event);
      });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio || !audioRef.current) return;
        const element = track.attach();
        element.autoplay = true;
        element.setAttribute("aria-label", "VEYAAN assistant audio");
        audioRef.current.appendChild(element);
      });
      room.on(RoomEvent.Disconnected, () => {
        roomRef.current = null;
        setRoomName(undefined);
        setMicHeld(false);
        setStatus("ready");
      });
      await room.connect(payload.url, payload.token);
      roomRef.current = room;
      setRoomName(payload.room);
      setStatus("listening");
      setCaption("Connected. VEYAAN is joining and will greet you in a moment…");
      // One tap starts a continuous, always-listening session: the room's
      // VAD-based turn detection (see Hermes AgentSession) handles when the
      // user is speaking vs. the assistant, including barge-in interrupts.
      // No second "press to talk" tap is required.
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        setMicHeld(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Microphone permission was denied.");
      }
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Voice connection failed.");
    } finally {
      setConnecting(false);
    }
  }, [addEvent, connecting, session?.access_token, user?.id, workspace?.id]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const nextEnabled = !micHeld;
    try {
      await room.localParticipant.setMicrophoneEnabled(nextEnabled);
      setMicHeld(nextEnabled);
      if (!nextEnabled) setStatus("thinking");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Microphone permission or publication failed.");
    }
  }, [micHeld]);

  useEffect(() => () => { void disconnect(); }, [disconnect]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-cyan">VEYAAN / LIVE VOICE</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Voice workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">One tap connects, VEYAAN greets you, then it keeps listening — just talk, pause, or interrupt like a real conversation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={status === "error" ? "danger" : status === "ready" ? "success" : "cyan"}><Radio className="mr-1.5 h-3 w-3" />{statusCopy[status]}</Badge>
          <Link href="/assistant"><Button variant="secondary" size="sm">Open text assistant</Button></Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <Card className="min-h-[30rem] overflow-hidden">
          <CardHeader><CardTitle>Talk to VEYAAN</CardTitle><p className="text-xs text-text-muted">{roomName ? `Room ${roomName}` : "No room connected"}</p></CardHeader>
          <CardContent className="flex min-h-[30rem] flex-col items-center justify-center gap-7 text-center">
            <div className={`flex h-44 w-44 items-center justify-center rounded-full border ${micHeld ? "border-accent-cyan bg-accent-cyan/15 shadow-[0_0_80px_rgba(0,240,255,.25)]" : "border-accent-purple/50 bg-accent-purple/10"}`}>
              {micHeld ? <Mic className="h-16 w-16 text-accent-cyan" /> : <Volume2 className="h-16 w-16 text-accent-purple" />}
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{statusCopy[status]}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">{caption}</p>
              {userCaption && <p className="mt-1 max-w-md text-xs leading-5 text-accent-cyan">You: {userCaption}</p>}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {!roomName ? (
                <Button size="lg" onClick={() => void connect()} disabled={connecting || !session || !workspace}>
                  <RefreshCw className={connecting ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                  {connecting ? "Connecting…" : session && workspace ? "Talk to VEYAAN" : "Sign in + select workspace"}
                </Button>
              ) : (
                <button
                  type="button"
                  className={`flex h-16 w-16 items-center justify-center rounded-full border shadow-glow ${micHeld ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan" : "border-status-danger/50 bg-status-danger/10 text-status-danger"}`}
                  onClick={() => void toggleMute()}
                  aria-pressed={micHeld}
                  aria-label={micHeld ? "Mute microphone" : "Unmute microphone"}
                  title={micHeld ? "Mute microphone" : "Unmute microphone"}
                >
                  {micHeld ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
                </button>
              )}
              {roomName && <Button variant="danger" size="lg" onClick={() => void disconnect()}><PhoneOff className="mr-2 h-4 w-4" />End session</Button>}
            </div>
            <p className="text-xs text-text-muted">{roomName ? (micHeld ? "Listening continuously — just speak, no need to press anything." : "Microphone muted. Tap the mic to resume.") : "The browser will ask for microphone permission once you tap Talk to VEYAAN."}</p>
            <div ref={audioRef} className="sr-only" aria-live="polite" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Live transcript</CardTitle><p className="text-xs text-text-muted">Versioned LiveKit events from the worker.</p></CardHeader>
          <CardContent className="space-y-3">
            {error && <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger"><MicOff className="mb-1 h-4 w-4" />{error}</div>}
            {events.length === 0 ? <div className="rounded-xl border border-dashed border-border-subtle p-5 text-sm leading-6 text-text-muted">No events yet. Tap Talk to VEYAAN to see state, captions, research, and audio events.</div> : events.map((event, index) => <div key={`${event.sequence ?? "event"}-${index}`} className="rounded-xl border border-border-subtle bg-bg-surface-2 p-3"><div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-text-muted"><span>{event.type === "caption" ? `caption · ${event.speaker ?? "?"}` : event.type ?? "event"}</span><span>{event.sequence ? `#${event.sequence}` : ""}</span></div><p className="mt-1 text-sm text-text-secondary">{event.message ?? event.text ?? event.activity ?? "Received"}</p></div>)}
            <div className="rounded-xl border border-accent-purple/20 bg-accent-purple/5 p-3 text-xs leading-5 text-text-muted"><Search className="mr-1 inline h-3 w-3 text-accent-purple" />Current web research remains capability-gated by Hermes. The voice worker reports research availability truthfully.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
