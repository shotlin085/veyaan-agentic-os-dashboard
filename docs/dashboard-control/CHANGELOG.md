# System Changelog

## [1.0.0-alpha] - 2026-08-06

### Added
- Created `veyaan-agentic-os-dashboard` Next.js 14 App Router project workspace.
- Implemented persistent control documentation suite in `docs/dashboard-control/` (21 files).
- Created VEYAAN Design System tokens in `src/app/globals.css` and `tailwind.config.ts`.
- Built Global Application Shell (`AppShell.tsx`, `TopBar.tsx`, `NavRail.tsx`, `ActivityRail.tsx`, `CommandPalette.tsx`, `EmergencyStopModal.tsx`).
- Created Flagship Page 1: Home Command Centre (`src/app/page.tsx`) with VEYAAN Interactive System Topology Map, Priority Strip, and internal cost routing metrics.
- Created Flagship Page 2: Personal Assistant (`src/app/assistant/page.tsx`) with Hermes SSE conversation stream, Requirement Interview Cards, inline Approval Cards, and Context Rail.
- Created Flagship Page 3: Visual Workflow Studio (`src/app/workflows/page.tsx`) powered by React Flow, 20-node palette, node inspector, and dry-run execution console.
- Created complete 16-page application suite (`/projects`, `/departments`, `/agents`, `/agents/factory`, `/prompts`, `/skills`, `/memory`, `/approvals`, `/qa`, `/logs`, `/sandboxes`, `/costs`, `/notifications`, `/settings`).
- Defined Zod domain models and development API client adapters in `src/lib/api/index.ts`.
