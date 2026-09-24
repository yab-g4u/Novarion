# Contributing to Probe

Thank you for your interest in contributing to **Probe** — the cross-source research and product validation engine.

## Repository Architecture

Probe is organized as a high-performance monorepo:

```text
probe/
├── apps/
│   ├── web/               # Probe React/Vite Frontend
│   └── api/               # Express/Node.js Search & Validation Backend
├── packages/
│   ├── shared/            # Common domain types and contracts
│   ├── ui/                # Shared design primitives
│   ├── schemas/           # Zod validation schemas
│   └── config/            # Base ESLint, Prettier, and TypeScript configurations
├── tests/
│   ├── integration/       # Multi-source retrieval integration tests
│   └── fixtures/          # Real-world query fixtures
└── docs/
    ├── architecture/      # Retrieval pipeline and system designs
    ├── decisions/         # Architectural Decision Records (ADRs)
    └── api/               # OpenAPI 3.1 specifications
```

## Getting Started

1. Clone repository:
   ```bash
   git clone https://github.com/yab-g4u/Novarion.git
   cd Novarion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server (Full-stack Web + API):
   ```bash
   npm run dev
   ```

4. Run lint and type checking:
   ```bash
   npm run lint
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Development Principles

- **Authentic Data First**: We do not simulate or fabricate external platform data. Upstream retrievals (Reddit, X, LinkedIn, ScholarXIV, links.et) reflect real sources.
- **Strict Separation of Concerns**: Query Understanding -> Parallel Retrieval -> Normalization -> Deduplication -> Ranking -> Presentation.
- **Subtle, Credible UI**: Editorial typography, restrained borders, zero AI marketing slop.
