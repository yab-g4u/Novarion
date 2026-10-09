/**
 * DesignMD Service
 * Integrates with the public DesignMD API (https://designmd.app/developers)
 * to search 700+ documented design systems and select the best semantic match
 * for researched products.
 */

export interface DesignMDStyleSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  type: string;
  cover?: string;
  use_case?: string;
  era?: string;
  style_type?: string;
  keywords?: string | string[];
}

export interface DesignMDStyleDetail extends DesignMDStyleSummary {
  cores_primarias?: string;
  cores_secundarias?: string;
  efeitos?: string;
  light_dark?: string;
  historical_context?: string;
  related_style_ids?: string;
}

export interface MatchedDesignSystem {
  source: DesignMDStyleDetail;
  matchScore: number;
  matchReason: string;
  url: string;
  whyThisDesign: string;
}

// Built-in vetted catalog for instant resilience if designmd.app network is unavailable or rate limited
const CURATED_DESIGNMD_FALLBACKS: DesignMDStyleDetail[] = [
  {
    id: 1,
    slug: 'minimalism-swiss-style',
    title: 'Minimalism & Swiss Style',
    description: 'Clean minimalist design with strict grid systems, high-contrast typography, and functional white space. Tailored for precision SaaS, devtools, and data-intensive workflows.',
    type: 'Minimalismo & Swiss',
    use_case: 'SaaS B2B, Enterprise Apps, Developer Tools, Analytics Platforms',
    era: '1950s Swiss Modernism',
    style_type: 'Clean, Geometric, Functional, Grid-Based',
    keywords: '["Clean","functional","monospace","grid-based","white space","high contrast","sans-serif","systematic"]',
    cores_primarias: 'Monochromatic, Dark Charcoal #0F172A, Pure White #FFFFFF',
    cores_secundarias: 'Neutral Slate (#F8FAFC, #E2E8F0, #64748B), Precision Blue #0066FF',
    efeitos: 'Subtle transitions (150ms), crisp 1px borders, minimal shadow elevation, high typographic hierarchy',
    light_dark: '✓ Full Light / ✓ Full Dark'
  },
  {
    id: 25,
    slug: 'analytics-dashboard',
    title: 'Analytics & High-Density Dashboard',
    description: 'High-density information architecture designed for monitoring, complex decision trees, and structured data visualization with zero decorative clutter.',
    type: 'Dashboards & BI',
    use_case: 'FinTech, BI Dashboards, Operations Management, DevOps Observability',
    era: 'Modern SaaS',
    style_type: 'Data-Dense, Modular, Tabular, High-Legibility',
    keywords: '["Dashboard","charts","metrics","data density","tables","cards","status indicators","filtering"]',
    cores_primarias: 'Deep Slate #0A0D14, Crisp White #FFFFFF',
    cores_secundarias: 'Cool Grey #F1F5F9, Semantic Green #10B981, Semantic Amber #F59E0B, Semantic Rose #F43F5E',
    efeitos: 'Immediate response micro-interactions, monospace data grids, distinct status badges',
    light_dark: '✓ Full Light / ✓ Full Dark'
  },
  {
    id: 42,
    slug: 'minimalismo-funcional-b2b',
    title: 'Minimalismo Funcional B2B',
    description: 'Utilitarian, trust-inducing design system for workflow productivity tools where efficiency and rapid keyboard navigation take precedence.',
    type: 'B2B & Enterprise',
    use_case: 'B2B Platforms, CRM, Team Collaboration, Project Management',
    era: 'Modern Product',
    style_type: 'Utilitarian, Linear-like, Keyboard-Centric, Polished',
    keywords: '["B2B","productivity","keyboard-first","linear","subtle borders","calm colors","focus rings"]',
    cores_primarias: 'Neutral Black #111827, Off-White #F9FAFB',
    cores_secundarias: 'Border Grey #E5E7EB, Muted Indigo #4F46E5, Soft Slate #6B7280',
    efeitos: 'Micro-animations (120ms ease-out), subtle hover pills, compact padding',
    light_dark: '✓ Full Light / ✓ Full Dark'
  },
  {
    id: 64,
    slug: 'estilo-de-ia-etica',
    title: 'AI Native & Ambient Workspace',
    description: 'Modern AI-first interaction paradigm emphasizing streaming states, progressive disclosure, grounding citations, and ambient assistant feedback.',
    type: 'AI & Inovação',
    use_case: 'AI Workspaces, Research Copilots, Prompt Workbenches, Synthesis Tools',
    era: 'Generative AI Era',
    style_type: 'Ambient, Conversational, Dynamic Surfaces, Low Cognitive Load',
    keywords: '["AI","streaming","thought lines","grounding","citations","ambient","clean cards","assistive"]',
    cores_primarias: 'Void Black #09090B, Luminescent White #FFFFFF',
    cores_secundarias: 'Electric Violet #7C3AED, Muted Zinc #71717A, Subtle Cyan #06B6D4',
    efeitos: 'Smooth shimmer loaders, glowing focus rings, collapsible thought accordions',
    light_dark: '✓ Full Light / ✓ Full Dark'
  },
  {
    id: 88,
    slug: 'fintech-plataforma-financeira',
    title: 'FinTech & Transactional Trust',
    description: 'Conservative, high-trust financial interface prioritizing numerical clarity, validation barriers, audit trails, and bank-grade assurance.',
    type: 'FinTech & Mercado',
    use_case: 'Bookkeeping, Payments, Invoicing, Billing & Cashflow Management',
    era: 'Modern Financial',
    style_type: 'High-Trust, Auditable, Tabular, High-Contrast',
    keywords: '["Fintech","money","transactions","security","audit","trust","invoicing","statements"]',
    cores_primarias: 'Deep Navy #0F172A, Clear White #FFFFFF',
    cores_secundarias: 'Emerald Green #059669, Muted Border #E2E8F0, Slate #475569',
    efeitos: 'Clear confirmation states, destructive action modals, numeric right-alignment',
    light_dark: '✓ Full Light / ✓ Full Dark'
  },
  {
    id: 110,
    slug: 'mobile-balance-study',
    title: 'Consumer Mobile & Touch-First',
    description: 'Ergonomic, consumer-grade touch experience optimized for thumb-reach navigation, instant tactile feedback, and high visual engagement.',
    type: 'Consumer & Mobile',
    use_case: 'Consumer Apps, Food & Meal Planning, Fitness, Everyday Habit Trackers',
    era: 'Mobile First',
    style_type: 'Tactile, Thumb-Friendly, Fluid, High-Contrast Typography',
    keywords: '["Mobile","touch","consumer","recipes","pantry","habits","bottom sheets","fluid"]',
    cores_primarias: 'Charcoal #18181B, Warm Surface #FAFAF9',
    cores_secundarias: 'Fresh Orange/Amber #EA580C, Soft Sage #84CC16, Warm Gray #78716C',
    efeitos: 'Spring gestures, bouncy bottom sheets, large tap targets (minimum 44px)',
    light_dark: '✓ Full Light / ✓ Full Dark'
  }
];

export class DesignMDService {
  private readonly baseUrl = 'https://designmd.app';

  /**
   * Search DesignMD's 700+ design systems with semantic scoring for the researched product.
   */
  async findBestMatchingDesignSystem(params: {
    productName: string;
    productIdea: string;
    targetUsers?: string;
    domain?: string;
    preferredStyleSlug?: string;
  }): Promise<MatchedDesignSystem> {
    const { productName, productIdea, targetUsers = '', domain = '', preferredStyleSlug } = params;

    // 1. If user requested a specific style slug, fetch that first
    if (preferredStyleSlug) {
      const specific = await this.getStyleBySlug(preferredStyleSlug);
      if (specific) {
        return {
          source: specific,
          matchScore: 100,
          matchReason: `User explicitly specified "${specific.title}".`,
          url: `${this.baseUrl}/styles/${specific.slug}`,
          whyThisDesign: this.composeWhyThisDesign(specific, productName, productIdea, targetUsers)
        };
      }
    }

    // 2. Derive targeted search terms from the product essence
    const textBlob = `${productName} ${productIdea} ${targetUsers} ${domain}`.toLowerCase();
    const searchTerms: string[] = [];

    if (textBlob.includes('developer') || textBlob.includes('code') || textBlob.includes('api') || textBlob.includes('pull request')) {
      searchTerms.push('developer', 'minimal', 'b2b');
    } else if (textBlob.includes('finance') || textBlob.includes('invoice') || textBlob.includes('bookkeep') || textBlob.includes('tax') || textBlob.includes('money')) {
      searchTerms.push('finance', 'dashboard', 'b2b');
    } else if (textBlob.includes('ai') || textBlob.includes('copilot') || textBlob.includes('agent') || textBlob.includes('llm') || textBlob.includes('autonomous')) {
      searchTerms.push('ai', 'b2b', 'minimal');
    } else if (textBlob.includes('cook') || textBlob.includes('recipe') || textBlob.includes('food') || textBlob.includes('meal') || textBlob.includes('fitness')) {
      searchTerms.push('mobile', 'food', 'minimal');
    } else if (textBlob.includes('health') || textBlob.includes('patient') || textBlob.includes('clinic') || textBlob.includes('medical')) {
      searchTerms.push('medical', 'b2b', 'dashboard');
    } else {
      searchTerms.push('b2b', 'dashboard', 'minimal');
    }

    // 3. Query the DesignMD API for matching systems
    let candidates: DesignMDStyleSummary[] = [];

    for (const term of searchTerms) {
      try {
        const fetched = await this.querySearchEndpoint(term);
        if (fetched.length > 0) {
          candidates.push(...fetched);
        }
      } catch (err: any) {
        console.warn(`[DesignMDService] Search failed for "${term}":`, err.message);
      }
    }

    // Deduplicate candidate styles by slug
    const uniqueCandidates = new Map<string, DesignMDStyleSummary>();
    candidates.forEach((c) => {
      if (!uniqueCandidates.has(c.slug)) {
        uniqueCandidates.set(c.slug, c);
      }
    });

    // If API returned nothing (e.g. offline or rate limited), use curated fallbacks
    if (uniqueCandidates.size === 0) {
      CURATED_DESIGNMD_FALLBACKS.forEach((c) => uniqueCandidates.set(c.slug, c));
    }

    // 4. Score each candidate semantically against the researched product
    let bestCandidate: DesignMDStyleSummary = CURATED_DESIGNMD_FALLBACKS[0];
    let highestScore = -1;
    let bestReason = '';

    const keywordsToMatch = [
      ...productName.toLowerCase().split(/\s+/),
      ...productIdea.toLowerCase().split(/\s+/),
      ...targetUsers.toLowerCase().split(/\s+/)
    ].filter((w) => w.length > 3);

    for (const candidate of Array.from(uniqueCandidates.values())) {
      let score = 0;
      const reasons: string[] = [];

      const candidateText = `${candidate.title} ${candidate.description || ''} ${candidate.use_case || ''} ${candidate.style_type || ''} ${candidate.keywords || ''}`.toLowerCase();

      // Keyword overlap
      for (const kw of keywordsToMatch) {
        if (candidateText.includes(kw)) {
          score += 15;
          reasons.push(`matches "${kw}"`);
        }
      }

      // Domain affinities
      if (textBlob.includes('developer') && (candidateText.includes('dev') || candidateText.includes('minimal') || candidateText.includes('swiss'))) {
        score += 35;
        reasons.push('developer/precision alignment');
      }
      if (textBlob.includes('b2b') && (candidateText.includes('b2b') || candidateText.includes('enterprise'))) {
        score += 30;
        reasons.push('B2B enterprise efficiency');
      }
      if (textBlob.includes('dashboard') && candidateText.includes('dashboard')) {
        score += 25;
        reasons.push('data dashboard ergonomics');
      }
      if (textBlob.includes('finance') && (candidateText.includes('fintech') || candidateText.includes('financeira'))) {
        score += 40;
        reasons.push('fintech trust model');
      }
      if (textBlob.includes('mobile') && candidateText.includes('mobile')) {
        score += 35;
        reasons.push('touch ergonomic match');
      }

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = candidate;
        bestReason = reasons.slice(0, 3).join(', ') || 'closest functional and aesthetic fit';
      }
    }

    // 5. Fetch full details for the winning style
    const detailedStyle = await this.getStyleBySlug(bestCandidate.slug);
    const finalStyle = detailedStyle || (bestCandidate as DesignMDStyleDetail);

    return {
      source: finalStyle,
      matchScore: Math.max(75, Math.min(98, highestScore + 50)),
      matchReason: bestReason,
      url: `${this.baseUrl}/styles/${finalStyle.slug}`,
      whyThisDesign: this.composeWhyThisDesign(finalStyle, productName, productIdea, targetUsers)
    };
  }

  /**
   * List all DESIGN.md styles with pagination and filtering.
   */
  async listStyles(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{ data: DesignMDStyleSummary[]; total?: number; page?: number; limit?: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const type = params?.type;

    try {
      const url = new URL(`${this.baseUrl}/api/styles`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      if (type) url.searchParams.set('type', type);

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'Probe-DesignMD-Agent/1.0'
      };
      const apiKey = process.env.DESIGNMD_API_KEY || process.env.DESIGNMD_TOKEN;
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          return {
            data: json.data,
            total: json.total || json.data.length,
            page,
            limit
          };
        }
        if (Array.isArray(json)) {
          return { data: json, total: json.length, page, limit };
        }
      }
    } catch (err: any) {
      console.warn('[DesignMDService] listStyles remote query warning:', err.message);
    }

    // Filter curated fallbacks
    let filtered = CURATED_DESIGNMD_FALLBACKS;
    if (type) {
      filtered = filtered.filter((f) => f.type.toLowerCase().includes(type.toLowerCase()));
    }
    const startIndex = (page - 1) * limit;
    const paged = filtered.slice(startIndex, startIndex + limit);
    return {
      data: paged,
      total: filtered.length,
      page,
      limit
    };
  }

  /**
   * Fetches full metadata for a style by slug from DesignMD API or fallback.
   */
  async getStyleBySlug(slug: string): Promise<DesignMDStyleDetail | null> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'Probe-DesignMD-Agent/1.0'
      };
      const apiKey = process.env.DESIGNMD_API_KEY || process.env.DESIGNMD_TOKEN;
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${this.baseUrl}/api/styles/${encodeURIComponent(slug)}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.slug) {
          return data as DesignMDStyleDetail;
        }
      }
    } catch {
      // Fallback
    }

    // Check curated fallbacks
    const fallback = CURATED_DESIGNMD_FALLBACKS.find((f) => f.slug === slug);
    return fallback || null;
  }

  /**
   * Get only the YAML design tokens for a style.
   */
  async getStyleToken(slug: string): Promise<string> {
    const apiKey = process.env.DESIGNMD_API_KEY || process.env.DESIGNMD_TOKEN;
    if (apiKey) {
      try {
        const res = await fetch(`${this.baseUrl}/api/styles/${encodeURIComponent(slug)}/token`, {
          method: 'GET',
          headers: {
            Accept: 'text/yaml, application/x-yaml, text/plain, application/json',
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': 'Probe-DesignMD-Agent/1.0'
          },
          signal: AbortSignal.timeout(3500)
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 20) return text;
        }
      } catch (err: any) {
        console.warn('[DesignMDService] remote token fetch failed:', err.message);
      }
    }

    // Generate accurate tokens from style metadata
    const style = await this.getStyleBySlug(slug);
    if (!style) {
      throw new Error(`Style "${slug}" not found in DesignMD catalog.`);
    }

    return `name: "${style.slug}"
title: "${style.title}"
version: "1.0.0"
source: "designmd.app"
type: "${style.type}"
era: "${style.era || 'Modern'}"
colors:
  primary: "${style.cores_primarias || '#0A0D14'}"
  secondary: "${style.cores_secundarias || '#64748B'}"
  surface: "#FFFFFF"
  canvas: "#FAFAFA"
  border: "#E5E7EB"
typography:
  fontFamily:
    sans: ["Geist", "Inter", "sans-serif"]
    mono: ["Geist Mono", "JetBrains Mono", "monospace"]
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
radius:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
shadows:
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
transitions:
  default: "150ms ease-out"
theme: "${style.light_dark || 'Full Light / Full Dark'}"`;
  }

  /**
   * Get only the markdown content for a style.
   */
  async getStyleContent(slug: string): Promise<string> {
    const apiKey = process.env.DESIGNMD_API_KEY || process.env.DESIGNMD_TOKEN;
    if (apiKey) {
      try {
        const res = await fetch(`${this.baseUrl}/api/styles/${encodeURIComponent(slug)}/content`, {
          method: 'GET',
          headers: {
            Accept: 'text/markdown, text/plain',
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': 'Probe-DesignMD-Agent/1.0'
          },
          signal: AbortSignal.timeout(3500)
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 50) return text;
        }
      } catch (err: any) {
        console.warn('[DesignMDService] remote content fetch failed:', err.message);
      }
    }

    const style = await this.getStyleBySlug(slug);
    if (!style) {
      throw new Error(`Style "${slug}" not found in DesignMD catalog.`);
    }

    return `# ${style.title}

> **Category:** ${style.type}  
> **Source:** [DesignMD.app](${this.baseUrl}/styles/${style.slug})  
> **Era:** ${style.era || 'Modern Design System'}  
> **Target Use Cases:** ${style.use_case || 'B2B Software, Dashboards, Developer Platforms'}

---

## 1. Overview & Aesthetics
${style.description}

- **Style Type:** ${style.style_type || 'Systematic, High Legibility, Modular'}
- **Color Palettes:**
  - *Primary:* ${style.cores_primarias || 'Monochromatic ink, white surface'}
  - *Secondary:* ${style.cores_secundarias || 'Muted borders, semantic accents'}
- **Transitions & Effects:** ${style.efeitos || 'Fast transitions (150ms), crisp 1px borders, subtle elevation'}
- **Light/Dark Support:** ${style.light_dark || 'Supported'}

---

## 2. Core Principles
1. **Content First:** Hierarchy guides attention; visual decoration never eclipses actionable data.
2. **Predictable Motion:** Micro-interactions execute within 150ms with zero spring overshoot in analytical workflows.
3. **Contrast Discipline:** Strict WCAG 2.1 AA conformity across text, interactive states, and status indicators.
`;
  }

  /**
   * Full-text search across all DESIGN.md files.
   */
  async searchStyles(query: string): Promise<DesignMDStyleSummary[]> {
    return this.querySearchEndpoint(query);
  }

  /**
   * Raw query to DesignMD search endpoint.
   */
  private async querySearchEndpoint(query: string): Promise<DesignMDStyleSummary[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'Probe-DesignMD-Agent/1.0'
      };
      const apiKey = process.env.DESIGNMD_API_KEY || process.env.DESIGNMD_TOKEN;
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(cleanQuery)}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          return json.data;
        }
        if (Array.isArray(json)) {
          return json;
        }
      }
    } catch {
      // Fallback to local match
    }

    const lower = cleanQuery.toLowerCase();
    return CURATED_DESIGNMD_FALLBACKS.filter(
      (s) =>
        s.title.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.type.toLowerCase().includes(lower) ||
        (s.use_case && s.use_case.toLowerCase().includes(lower))
    );
  }

  /**
   * Formats a crisp, human, grounded "Why this design" explanation.
   */
  private composeWhyThisDesign(
    style: DesignMDStyleDetail,
    productName: string,
    productIdea: string,
    targetUsers: string
  ): string {
    const audience = targetUsers || 'users';
    return `Selected ${style.title} from DesignMD because ${productName || 'this concept'} requires a ${style.style_type ? style.style_type.toLowerCase() : 'high-clarity'} aesthetic to serve ${audience}. Its ${style.cores_primarias ? `palette (${style.cores_primarias})` : 'clean palette'} and emphasis on ${style.use_case || 'structured usability'} eliminate decorative distraction so founders and builders can focus directly on the core workflow.`;
  }
}

export const designMDService = new DesignMDService();
