# Probe Architecture Overview

## Data Pipeline Architecture

```text
User Query
    │
    ▼
[Query Understanding & Intent Detection]
    │
    ▼
[Query Expansion (Platform specific terms)]
    │
    ├───► [Reddit Provider] ───┐
    ├───► [X Provider] ────────┼─► [Normalization] ──► [Deduplication] ──► [Semantic Ranking] ──► [Streamed UI]
    ├───► [LinkedIn Provider] ──┤
    └───► [ScholarXIV] ────────┘
```

### 1. Ingestion & Retrieval Layer
- Upstream adapters run with `Promise.allSettled` to isolate failures.
- Rate limits and transient gateway timeouts return partial sets rather than breaking execution.

### 2. Product Usability Engine
- Executes genuine tasks against live accessible products (e.g. `https://links.et/`).
- Emits real-time behavioral observations and generates structured agentic diagnostic reports.
