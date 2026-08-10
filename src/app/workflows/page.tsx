"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, ChevronLeft, ChevronRight, GitFork, LayoutDashboard, Maximize2, Menu, Minimize2, PanelLeftClose, PanelLeftOpen, Play, Plus, RotateCcw, Settings2, ShieldCheck, Terminal, Users, Wrench, X, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export default function WorkflowStudioPage() {
  return <ReactFlowProvider><WorkflowStudio /></ReactFlowProvider>;
}

function WorkflowStudio() {
  const { status } = useRuntimeStatus();
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const connected = Boolean(session?.access_token && workspace?.id);
  const [navOpen, setNavOpen] = useState(false);
  const [studioNavCollapsed, setStudioNavCollapsed] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const jcodeReady = status?.capabilityStates?.work_orders === "ready" || status?.capabilityStates?.commands === "ready";

  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [agentDisplayName, setAgentDisplayName] = useState("Senior Website Developer");
  const [taskText, setTaskText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ assignment_id: string; instance_id: string; status: string; task: string } | null>(null);

  async function createWorkflow() {
    if (!session?.access_token || !workspace?.id || !taskText.trim() || !agentDisplayName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/workflows`, {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ agentDisplayName: agentDisplayName.trim(), task: taskText.trim(), actor: session.user?.email ?? "dashboard" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(String(body?.error ?? `Could not create this workflow (status ${response.status}).`));
      setCreated(body);
      setShowNewWorkflow(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create this workflow.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await workspaceRef.current?.requestFullscreen();
    } catch {
      setFullscreen(false);
    }
  };

  return <div ref={workspaceRef} className={`${fullscreen ? "fixed inset-0 z-[100]" : "-m-4 md:-m-6"} flex min-h-[calc(100dvh-4rem)] flex-col bg-background`}>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface-1 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open Studio navigation" onClick={() => setNavOpen(true)}><Menu className="h-4 w-4" /></Button><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-base font-semibold text-foreground">Workflow Studio</h1><Badge tone="neutral">Live workspace</Badge></div><p className="mt-1 truncate text-xs text-text-muted">Build and inspect authenticated workspace workflows.</p></div></div><div className="flex items-center gap-2"><Button size="sm" disabled={!jcodeReady} title={jcodeReady ? "Run workflow" : "JCode provider is not ready"}><Play className="h-3.5 w-3.5" /><span className="hidden sm:inline">Run</span></Button><Button size="sm" variant="secondary" disabled><span className="hidden sm:inline">Publish</span><span className="sm:hidden">Save</span></Button><Button variant="secondary" size="sm" aria-label={fullscreen ? "Exit full screen" : "Enter full screen"} title={fullscreen ? "Exit full screen" : "Full screen"} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button></div></header>

    {navOpen && <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setNavOpen(false)}><aside className="h-full w-[min(82vw,18rem)] border-r border-border-subtle bg-popover p-4" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between text-sm font-semibold text-foreground">Studio navigation<Button variant="ghost" size="sm" aria-label="Close Studio navigation" onClick={() => setNavOpen(false)}><X className="h-4 w-4" /></Button></div><StudioNav /></aside></div>}

    <div className="flex min-h-0 flex-1"><aside className={`${studioNavCollapsed ? "w-16" : "w-56"} hidden shrink-0 border-r border-border-subtle bg-popover p-3 transition-[width] duration-200 lg:block`}><div className="flex justify-end"><Button variant="ghost" size="sm" aria-label={studioNavCollapsed ? "Expand Studio navigation" : "Collapse Studio navigation"} title={studioNavCollapsed ? "Expand Studio navigation" : "Collapse Studio navigation"} onClick={() => setStudioNavCollapsed((value) => !value)}>{studioNavCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</Button></div><StudioNav collapsed={studioNavCollapsed} /><div className={`${studioNavCollapsed ? "hidden" : ""} mt-8 rounded-2xl border border-border-subtle bg-bg-surface-2/60 p-4`}><p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">JCode execution</p><p className="mt-2 text-xs leading-5 text-text-secondary">{jcodeReady ? "Provider ready" : "Provider capability unavailable"}</p><Badge className="mt-3" tone={jcodeReady ? "success" : "warning"}>{jcodeReady ? "Ready" : "Gated"}</Badge></div></aside>

      <main className="flex min-w-0 flex-1 flex-col"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setNavOpen(true)}><GitFork className="h-4 w-4" />Studio</Button><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">Workspace workflow</p><p className="truncate text-[10px] font-mono text-text-muted">No workflow selected</p></div></div><div className="flex items-center gap-2">{connected ? <Badge tone="neutral"><span className="hidden sm:inline">Connected — no workflows yet</span><span className="sm:hidden">Connected</span></Badge> : <Badge tone="warning"><AlertTriangle className="h-3 w-3" /><span className="hidden sm:inline">Requires workspace access</span><span className="sm:hidden">Locked</span></Badge>}<Button size="sm" disabled={!connected} onClick={() => setShowNewWorkflow(true)}><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">New workflow</span></Button><Button variant="secondary" size="sm" className="xl:hidden" aria-label={inspectorOpen ? "Close Inspector" : "Open Inspector"} onClick={() => setInspectorOpen((value) => !value)}><Settings2 className="h-4 w-4" /></Button></div></div>

        <div className="relative min-h-[360px] flex-1"><ReactFlow nodes={[]} edges={[]} fitView><MiniMap className="workflow-minimap !bottom-4 !right-4 !h-24 !w-36 !rounded-xl !border-border-subtle !bg-popover" maskColor="rgba(0,0,0,.62)" nodeColor="#8a8a8a" /><Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(255,255,255,.08)" /><CanvasTools fullscreen={fullscreen} onFullscreen={() => void toggleFullscreen()} /></ReactFlow><div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"><div className="pointer-events-auto w-full max-w-md">{created ? <div className="rounded-2xl border border-status-success/30 bg-status-success/10 p-6 text-center"><h2 className="text-sm font-semibold text-foreground">Assignment created</h2><p className="mt-2 text-xs leading-5 text-text-muted">&quot;{created.task}&quot; is now a real, persisted assignment in Agent Workforce.</p><p className="mt-3 font-mono text-[10px] text-text-muted">assignment {created.assignment_id}</p><p className="mt-1 font-mono text-[10px] text-text-muted">instance {created.instance_id}</p><Badge className="mt-3" tone="neutral">{created.status}</Badge><p className="mt-4 text-[11px] text-text-secondary">This is real state, not a fake node — but nothing executes it yet. The canvas graph view for real workflows isn&apos;t built; check the Workforce API directly for now.</p></div> : <EmptyState title="No workflows loaded" description={connected ? "This workspace has no workflows yet. Click New workflow to assign a real agent a real task." : "Authenticate a workspace to load real workflows."} locked={!connected} />}</div></div></div>

        {showNewWorkflow && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowNewWorkflow(false)}><div className="w-full max-w-md rounded-2xl border border-border-subtle bg-popover p-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-foreground">New workflow</h2><button onClick={() => setShowNewWorkflow(false)} className="text-text-muted hover:text-foreground"><X className="h-4 w-4" /></button></div>
          <p className="mt-1 text-xs text-text-muted">Creates a real Agent Workforce assignment — a definition, version, and instance get provisioned automatically for this task.</p>
          <div className="mt-4 space-y-3">
            <div><label className="mb-1 block text-xs text-text-muted">Agent</label><input value={agentDisplayName} onChange={(e) => setAgentDisplayName(e.target.value)} className="w-full rounded-lg border border-border-subtle bg-bg-app p-2.5 text-xs text-text-primary focus:border-foreground/40 focus:outline-none" /></div>
            <div><label className="mb-1 block text-xs text-text-muted">Task</label><textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} rows={4} placeholder="e.g. Build a landing page for a summer sale campaign" className="w-full rounded-lg border border-border-subtle bg-bg-app p-2.5 text-xs text-text-primary focus:border-foreground/40 focus:outline-none" /></div>
          </div>
          {createError && <p className="mt-3 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">{createError}</p>}
          <div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowNewWorkflow(false)} className="rounded-lg border border-border-subtle bg-bg-surface-2 px-4 py-2 text-xs text-text-secondary">Cancel</button><button disabled={creating || !taskText.trim()} onClick={() => void createWorkflow()} className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40">{creating ? "Creating…" : "Create"}</button></div>
        </div></div>}

        <div className="shrink-0 border-t border-border-subtle bg-popover p-4 sm:p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Terminal className="h-4 w-4 text-foreground" />Execution console</div><Badge tone="neutral">No runs</Badge></div><div className="mt-3 rounded-xl border border-dashed border-border-subtle p-4 text-xs text-text-muted">Execution traces will appear after a real workflow run.</div></div>
      </main>

      <aside className={`${inspectorOpen ? "block xl:block" : "hidden xl:hidden"} fixed inset-y-0 right-0 z-40 w-[min(88vw,20rem)] border-l border-border-subtle bg-popover p-4 shadow-2xl xl:static xl:z-auto xl:w-80 xl:shadow-none`}><div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground"><span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-foreground/70" />Inspector</span><Button variant="ghost" size="sm" aria-label="Collapse Inspector" title="Collapse Inspector" onClick={() => setInspectorOpen(false)}><ChevronRight className="h-4 w-4" /></Button></div><div className="mt-5"><EmptyState title="Select a node" description="Node configuration becomes available when a real workflow is loaded." locked /></div></aside>
    </div>
  </div>;
}

function CanvasTools({ fullscreen, onFullscreen }: { fullscreen: boolean; onFullscreen: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-xl border border-border-subtle bg-popover/95 p-1.5 shadow-2xl backdrop-blur"><CanvasButton label="Zoom in" onClick={() => void zoomIn()}><ZoomIn className="h-4 w-4" /></CanvasButton><CanvasButton label="Zoom out" onClick={() => void zoomOut()}><ZoomOut className="h-4 w-4" /></CanvasButton><CanvasButton label="Fit canvas" onClick={() => void fitView({ padding: 0.2 })}><RotateCcw className="h-4 w-4" /></CanvasButton><CanvasButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={onFullscreen}>{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</CanvasButton></div>;
}

function CanvasButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) { return <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30">{children}</button>; }

function StudioNav({ collapsed = false }: { collapsed?: boolean }) { const items = [{ label: "Workflow Studio", icon: GitFork }, { label: "Dashboard", icon: LayoutDashboard }, { label: "Agents", icon: Users }, { label: "Tools", icon: Wrench }, { label: "Evaluations", icon: ShieldCheck }]; return <nav className="mt-2 space-y-1">{items.map(({ label, icon: Icon }, index) => <button key={label} type="button" aria-label={label} title={collapsed ? label : undefined} className={`flex w-full items-center ${collapsed ? "justify-center" : "gap-3"} rounded-xl px-3 py-3 text-left text-xs ${index === 0 ? "border border-foreground/20 bg-foreground/[0.06] text-foreground" : "text-text-secondary hover:bg-bg-surface-2 hover:text-foreground"}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}</button>)}</nav>; }
