# Realtime Event Architecture & Envelope Status

## Envelope Specification
All realtime events follow the strict versioned event envelope:

```json
{
  "event_id": "evt_...",
  "event_type": "agent.task.completed",
  "occurred_at": "ISO-8601",
  "workspace_id": "ws_veyaan_internal",
  "project_id": "proj_grocery_os",
  "department_id": "dept_dev",
  "agent_id": "agent_dev_runner_01",
  "run_id": "run_901",
  "sequence": 108,
  "severity": "info",
  "payload": {}
}
```

## Transport Protocols
- **SSE (Server-Sent Events):** Used for read-heavy event feeds (`/api/v1/conversations/stream`, `/api/v1/audit/logs`).
- **WebSocket:** Used for interactive Hermes chat and bidirectional workflow execution traces (`ws://localhost:8000/ws/v1/events`).
- **Resilience:** Auto-reconnect with exponential backoff, sequence cursor resume, deduplication window.
