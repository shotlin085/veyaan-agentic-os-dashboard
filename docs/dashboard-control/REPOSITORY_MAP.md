# Repository Map & Integration Architecture

## Workspace Structure
```text
VEYAAN AI/
├── veyaan-core-backend/          # Auth, user management, device commands, security audit, WS gateway
├── veyaan-hermes-orchestrator/   # Hermes intelligence, agent execution, workflows, prompts, skills, memory
├── veyaan-agentic-os-dashboard/  # Primary Target: Next.js 14+ App Router, Tailwind, TypeScript Dashboard
├── veyaan_hermes_orchestrator_package/ # Shared Python library package
└── plan/                         # Master specification documents
```

## Backend API Endpoints & Contracts

### 1. VEYAAN Core Backend (`http://localhost:8000`)
- `POST /api/v1/auth/login` - User sign-in & JWT token issuance
- `GET /api/v1/users/me` - Current authenticated user context & roles
- `GET /api/v1/devices` - Registered VEYAAN device nodes
- `POST /api/v1/emergency-stop` - Immediate system-wide or scoped emergency shutdown
- `GET /api/v1/audit/logs` - Security and device audit log stream
- `WS /ws/v1/events` - Live system event bus & device status feeds

### 2. VEYAAN Hermes Orchestrator (`http://localhost:8001`)
- `POST /api/v1/conversations/stream` - Assistant conversation streaming
- `GET /api/v1/projects` - List & inspect active AI projects
- `POST /api/v1/projects` - Create new project from natural language brief
- `GET /api/v1/departments` - Internal VEYAAN departments & metrics
- `GET /api/v1/agents` - Registered agents, contracts, & performance
- `POST /api/v1/agents` - Create/deploy agent contract
- `GET /api/v1/workflows` - Visual workflow graph definitions
- `POST /api/v1/workflows/validate` - Lint & dry-run workflow graph
- `GET /api/v1/prompts` - Prompt library & version diffs
- `GET /api/v1/skills` - SKILL.md registry & execution contracts
- `GET /api/v1/memory/search` - RAG / pgvector memory search & proposals
- `GET /api/v1/approvals` - Approval inbox & governance requests
- `POST /api/v1/approvals/{id}/resolve` - Approve, reject, or request revision
- `GET /api/v1/models/costs` - Internal LLM usage spend & token metrics
- `WS /ws/v1/orchestrator` - Realtime agent activity & execution trace events
