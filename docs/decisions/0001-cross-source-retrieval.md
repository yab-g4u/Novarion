# ADR 0001: Separation of Retrieval, Ranking, and Presentation

## Status
Accepted

## Context
Standard LLM wrappers hallucinate citations or conflate summarization with source verification. Users investigating commercial or research hypotheses require source-backed evidence with verifiable permalinks.

## Decision
1. Never combine retrieval, ranking, and synthesis into a single prompt.
2. Ingest real sources directly via parallel upstream gateways.
3. Compute relevance scores based on semantic token overlap, cross-source confirmation, and recency.
4. Present verbatim source excerpts rather than synthetic rephrasings.
