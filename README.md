# Probe

> **Put your idea under pressure.**
> Real-world research discovery, living evidence graphs, and authentic product testing.

Probe is a cross-source research search engine and validation system. It challenges product assumptions by retrieving semantically relevant, source-backed discussions from **Reddit**, **X**, **LinkedIn**, and academic papers from **ScholarXIV**, alongside authentic user testing sessions on real products like **[links.et](https://links.et/)**.

---

## Architecture Overview

```text
probe/
├── apps/
│   ├── web/                         # Probe frontend
│   │   ├── src/
│   │   │   ├── app/                # routing, providers, global layout
│   │   │   ├── features/
│   │   │   │   ├── research/       # Cross-source research engine & workspace
│   │   │   │   ├── evidence/       # React Flow living evidence graph
│   │   │   │   ├── testing/        # Real product usability testing
│   │   │   │   ├── voice/          # Voice synthesis/playback interfaces
│   │   │   │   └── workspace/      # Idea challenge & signal review
│   │   │   ├── components/          # Truly shared UI only (PillNav, TechText, Icons)
│   │   │   ├── lib/                 # Frontend infrastructure & utilities
│   │   │   ├── hooks/               # Core React hooks
│   │   │   ├── styles/              # Global Tailwind styles
│   │   │   └── main.tsx
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                         # Backend / API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── research/       # Query parsing, expansion & retrieval
│       │   │   ├── evidence/       # Graph layout & synthesis
│       │   │   ├── testing/        # Session capture & analysis
│       │   │   ├── voice/          # Voice processing
│       │   │   └── workspace/      # Workspace orchestration
│       │   ├── providers/
│       │   │   ├── searxng/        # Multi-engine search provider
│       │   │   ├── scholarxiv/     # arXiv and semantic scholar gateway
│       │   │   ├── gemini/         # Query understanding & reranking
│       │   │   └── browser/        # Headless testing runner
│       │   ├── lib/                 # Server utilities & cache
│       │   ├── middleware/          # Rate limiting, validation & CORS
│       │   └── server.ts
│       └── package.json
│
├── packages/
│   ├── shared/                      # Shared types/contracts
│   ├── ui/                          # Shared design-system components
│   ├── schemas/                     # Zod/API schemas
│   └── config/                      # ESLint, tsconfig, etc.
│
├── tests/
│   ├── integration/                 # Search engine integration tests
│   └── fixtures/                    # Test query sets & response payloads
│
├── docs/
│   ├── architecture/                # System diagrams & data flow
│   ├── decisions/                   # Architecture Decision Records (ADRs)
│   └── api/                         # REST & WebSocket specifications
│
├── .github/
│   └── workflows/                   # GitHub Actions CI/CD
├── .env.example
├── CONTRIBUTING.md
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

---

## Quickstart

```bash
# Clone repository
git clone https://github.com/yab-g4u/Novarion.git
cd Novarion

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Core Capabilities

1. **Cross-Source Retrieval Pipeline**:
   - Searches Reddit, X, LinkedIn, and ScholarXIV in parallel.
   - Normalizes citations, handles rate limits gracefully, and prevents AI hallucination.
2. **Living Evidence Graph**:
   - Memoized `@xyflow/react` node layout with dynamic ELK hierarchy.
   - Categorizes evidence into Supporting, Contradicting, and Unknown blind spots.
3. **Real Product Usability Testing**:
   - Test live products (e.g. `https://links.et/`) against concrete tasks.
   - Captures genuine user friction and generates agentic graphic diagnostic reports.
