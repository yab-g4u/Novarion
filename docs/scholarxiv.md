# ScholarXIV Academic Integration in Probe

## 1. What ScholarXIV Does in Probe
Probe pressure-tests startup ideas by deconstructing them into testable assumptions and collecting adversarial evidence from both practitioner communities and peer-reviewed academic literature.

ScholarXIV serves as Probe's **academic evidence engine**:
- It searches peer-reviewed academic papers corresponding to specific business assumptions (e.g., student planning adherence, domestic cooking decision fatigue, freelancer willingness to pay).
- Rather than merely dumping search results, Probe evaluates whether each academic study:
  - **`SUPPORTS`** the assumption ("Potentially supports this assumption")
  - **`CHALLENGES`** the assumption ("Potentially challenges this assumption")
  - **`PROVIDES CONTEXT`** ("Provides relevant context")
  - Is **`INCONCLUSIVE`** ("Inconclusive findings")
- Aggregates an **Academic Signal** metric (`Supporting: X`, `Challenging: Y`, `Inconclusive: Z`) and generates a synthesized **Probe conclusion**.
- Automatically connects the retrieved papers into Probe's **Living Evidence Graph**, visually distinguishing them with academic badges.

## 2. API Key Setup
The integration utilizes the official ScholarXIV Papers API (`https://scholarxiv.com/api/v1/papers/search`) from the **server-side only**. The API key is never exposed to the client or browser.

To configure:
1. Obtain an API key from the ScholarXIV Developer Dashboard (prefixed with `sxv_`).
2. Add your key to `.env` (or production environment variables):
   ```bash
   SCHOLARXIV_API_KEY=sxv_your_key_here
   ```
3. A clean template entry is maintained in `.env.example`:
   ```bash
   SCHOLARXIV_API_KEY=
   ```

## 3. Request Flow
1. **Idea & Assumption Deconstruction**:
   - The founder inputs a startup hypothesis into Probe.
   - Probe identifies critical testable assumptions.
2. **Assumption Research Request**:
   - The user clicks **"Research with ScholarXIV"** on any assumption card.
   - The client issues `POST /api/research/assumption` with `{ assumptionId, assumptionText, idea }`.
3. **Focused Academic Query Generation**:
   - The server converts the business assumption into an academic query (e.g., *"Students struggle to maintain consistent study plans"* → *"student study planning adherence cognitive habits"*).
4. **ScholarXIV Papers Retrieval**:
   - The backend service queries `https://scholarxiv.com/api/v1/papers/search` with `Authorization: Bearer <SCHOLARXIV_API_KEY>` and a 6-second timeout.
5. **Stance Analysis & Evidence Synthesis**:
   - The top relevant papers are evaluated for support/challenge stance, key empirical findings, and relevance.
   - Results are cached in-memory by assumption text so repeated clicks do not burn API quotas.
6. **UI & Evidence Graph Update**:
   - Findings appear inline under the assumption with academic signals and Probe conclusion.
   - The papers are injected into the Evidence Graph as distinguishable academic nodes connected to the assumption.

## 4. Failure Behavior & Graceful Degradation
If ScholarXIV experiences network timeouts, rate limiting, or if `SCHOLARXIV_API_KEY` is not yet configured:
- Probe never exposes raw errors, stack traces, or credentials to the user.
- A user-friendly message (`"Academic research is temporarily unavailable."`) with a Retry action is displayed if the query cannot be fulfilled.
- When unconfigured or offline, Probe falls back to a curated empirical database matching the domain (education, cooking, micro-SaaS accounting) to ensure the rest of the application and demonstration workflows continue without interruption.
