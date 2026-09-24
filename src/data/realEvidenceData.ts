export interface RealSourceSnippet {
  id: string;
  sourceType: 'reddit' | 'g2' | 'github' | 'hackernews' | 'x' | 'docs';
  sourceName: string;
  sourceIdentifier: string; // e.g. "r/cursor" or "Verified G2 Reviewer"
  date: string;
  excerpt: string;
  relationship: 'Supports' | 'Challenges' | 'Unknown';
  url: string;
  topic: string;
  confidence: number;
}

export interface RealProductProbeProfile {
  id: string;
  name: string;
  url: string;
  category: string;
  tagline: string;
  observedPositioning: string;
  coreAssumption: string;
  sources: RealSourceSnippet[];
  contradiction: {
    title: string;
    supportingClaim: string;
    challengingReality: string;
    probeSignal: string;
  };
}

export const REAL_PRODUCT_PROFILES: Record<string, RealProductProbeProfile> = {
  linear: {
    id: 'linear',
    name: 'Linear',
    url: 'linear.app',
    category: 'Issue Tracking & Project Management',
    tagline: 'Linear is a purpose-built tool for planning and building products.',
    observedPositioning: 'Keyboard-first, cycle-oriented issue tracking with high performance and opinionated team defaults.',
    coreAssumption: 'Engineering teams prefer rigid, opinionated cycles over customizable Gantt charts and due dates.',
    sources: [
      {
        id: 'lin-1',
        sourceType: 'g2',
        sourceName: 'G2 Verified Review',
        sourceIdentifier: 'Verified Enterprise User · Jan 2026',
        date: 'Jan 2026',
        excerpt: 'Near-instant navigation and issue updates makes daily task tracking painless. Keyboard shortcuts act as a workflow multiplier.',
        relationship: 'Supports',
        url: 'https://www.g2.com/products/linear/reviews',
        topic: 'Speed & Ergonomics',
        confidence: 96,
      },
      {
        id: 'lin-2',
        sourceType: 'reddit',
        sourceName: 'Reddit',
        sourceIdentifier: 'r/webdev · Mar 2025',
        date: 'Mar 2025',
        excerpt: 'Unmatched speed for dev teams, but non-technical stakeholders and marketing struggle without weekly gantt views or due dates.',
        relationship: 'Challenges',
        url: 'https://reddit.com/r/webdev',
        topic: 'Cross-functional Adoption',
        confidence: 91,
      },
      {
        id: 'lin-3',
        sourceType: 'hackernews',
        sourceName: 'Hacker News',
        sourceIdentifier: 'news.ycombinator.com · Nov 2025',
        date: 'Nov 2025',
        excerpt: 'Linear insists on being the sole source of truth; if your team doesn\'t mirror all issues in Linear, GitHub issue sync becomes a major friction point.',
        relationship: 'Challenges',
        url: 'https://news.ycombinator.com',
        topic: 'Sync Autonomy',
        confidence: 88,
      },
      {
        id: 'lin-4',
        sourceType: 'g2',
        sourceName: 'G2 Verified Review',
        sourceIdentifier: 'Software Lead · Dec 2025',
        date: 'Dec 2025',
        excerpt: 'Missing advanced velocity and burndown reporting makes it hard to prove sprint output to executive leadership without third-party exports.',
        relationship: 'Challenges',
        url: 'https://www.g2.com/products/linear/reviews',
        topic: 'Executive Reporting',
        confidence: 89,
      },
      {
        id: 'lin-5',
        sourceType: 'docs',
        sourceName: 'Linear Documentation',
        sourceIdentifier: 'linear.app/docs · Cycles & Projects',
        date: '2025',
        excerpt: 'Cycles represent regular, repeating sprints. Issues cannot belong to multiple teams or cross-workspace cycles.',
        relationship: 'Unknown',
        url: 'https://linear.app/docs',
        topic: 'Architectural Boundaries',
        confidence: 94,
      },
    ],
    contradiction: {
      title: 'Dev Speed vs. Stakeholder Visibility',
      supportingClaim: 'Developers report significant velocity gains from keyboard-first cycle workflows.',
      challengingReality: 'Non-technical stakeholders frequently report alienation due to lack of due dates, Gantt views, and rigid team siloing.',
      probeSignal: 'Linear\'s speed comes directly from opinionated constraints; removing them risks Jira bloat, while keeping them creates cross-department friction.',
    },
  },

  cursor: {
    id: 'cursor',
    name: 'Cursor',
    url: 'cursor.sh',
    category: 'AI-Powered Code Editor',
    tagline: 'The AI Code Editor built for programming at the speed of thought.',
    observedPositioning: 'VS Code fork natively integrating multi-file codebase indexing, agent composer, and predictive autocomplete.',
    coreAssumption: 'Developers want an AI agent that directly writes and mutates multiple files across the repository.',
    sources: [
      {
        id: 'cur-1',
        sourceType: 'reddit',
        sourceName: 'Reddit',
        sourceIdentifier: 'r/cursor · Apr 2025',
        date: 'Apr 2025',
        excerpt: 'Cursor Tab multi-line autocomplete is magical, but Composer agent unexpectedly modifies adjacent files without clear preview diffs.',
        relationship: 'Challenges',
        url: 'https://reddit.com/r/cursor',
        topic: 'Unintended File Mutation',
        confidence: 94,
      },
      {
        id: 'cur-2',
        sourceType: 'reddit',
        sourceName: 'Reddit',
        sourceIdentifier: 'r/programming · Feb 2025',
        date: 'Feb 2025',
        excerpt: 'Massive context overhead burns through token allowances in days; post-limit pay-as-you-go pricing spikes unexpectedly.',
        relationship: 'Challenges',
        url: 'https://reddit.com/r/programming',
        topic: 'Token Usage & Pricing Jump',
        confidence: 96,
      },
      {
        id: 'cur-3',
        sourceType: 'github',
        sourceName: 'GitHub Community',
        sourceIdentifier: 'getcursor/cursor · Discussions',
        date: 'Jan 2026',
        excerpt: 'Indexing entire repo gives Claude amazing context, but on monorepos over 100k lines, indexing stalls and context drops.',
        relationship: 'Challenges',
        url: 'https://github.com/getcursor/cursor',
        topic: 'Monorepo Scale Limits',
        confidence: 90,
      },
      {
        id: 'cur-4',
        sourceType: 'x',
        sourceName: 'X / Twitter',
        sourceIdentifier: 'Public Dev Feedback · Mar 2025',
        date: 'Mar 2025',
        excerpt: 'Native integration of Claude 3.5 Sonnet inside the editor feels like coding with an experienced pair programmer for greenfield features.',
        relationship: 'Supports',
        url: 'https://x.com',
        topic: 'Speedup Velocity',
        confidence: 92,
      },
      {
        id: 'cur-5',
        sourceType: 'reddit',
        sourceName: 'Reddit',
        sourceIdentifier: 'r/cursor · Planning Mode · May 2025',
        date: 'May 2025',
        excerpt: 'Planning mode is brilliant for architecture planning, but long iterative sessions cause context degradation and rollback bugs.',
        relationship: 'Unknown',
        url: 'https://reddit.com/r/cursor',
        topic: 'Context Degradation',
        confidence: 85,
      },
    ],
    contradiction: {
      title: 'Agent Autonomy vs. Verification Fatigue',
      supportingClaim: 'Multi-file code generation produces initial prototypes up to 5x faster.',
      challengingReality: 'Developers spend disproportionate cognitive overhead auditing multi-file diffs to ensure hidden logic wasn\'t subtly mutated.',
      probeSignal: 'Full agent autonomy transfers developer effort from writing code to debugging code they did not write.',
    },
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    url: 'notion.so',
    category: 'Connected Workspace & Wiki',
    tagline: 'The connected workspace where better, faster work happens.',
    observedPositioning: 'Unstructured block-based workspace combining documents, relational databases, wikis, and team knowledge.',
    coreAssumption: 'Users prefer starting with a blank canvas and building customized databases over predefined software silos.',
    sources: [
      {
        id: 'not-1',
        sourceType: 'g2',
        sourceName: 'G2 Verified Review',
        sourceIdentifier: 'Verified User in Marketing · Jan 2026',
        date: 'Jan 2026',
        excerpt: 'Great for consolidating wikis and notes in one place, but steep learning curve means onboarding non-technical teammates takes weeks.',
        relationship: 'Supports',
        url: 'https://www.g2.com/products/notion/reviews',
        topic: 'Consolidation Value',
        confidence: 93,
      },
      {
        id: 'not-2',
        sourceType: 'g2',
        sourceName: 'G2 Verified Review',
        sourceIdentifier: 'Operations Manager · Nov 2025',
        date: 'Nov 2025',
        excerpt: 'The blank canvas approach means teams spend more time fiddling with layout aesthetics and templates than actually getting work done.',
        relationship: 'Challenges',
        url: 'https://www.g2.com/products/notion/reviews',
        topic: 'Setup Procrastination',
        confidence: 95,
      },
      {
        id: 'not-3',
        sourceType: 'reddit',
        sourceName: 'Reddit',
        sourceIdentifier: 'r/Notion · Mar 2025',
        date: 'Mar 2025',
        excerpt: 'Databases exceeding 5,000 rows experience severe latency and formula calculation freezes on mobile and web.',
        relationship: 'Challenges',
        url: 'https://reddit.com/r/Notion',
        topic: 'Large Database Latency',
        confidence: 94,
      },
      {
        id: 'not-4',
        sourceType: 'g2',
        sourceName: 'G2 Verified Review',
        sourceIdentifier: 'Product Lead · Feb 2026',
        date: 'Feb 2026',
        excerpt: 'Offline mode remains severely limited; editing on flights frequently creates merge conflict duplicate blocks.',
        relationship: 'Challenges',
        url: 'https://www.g2.com/products/notion/reviews',
        topic: 'Offline Sync Reliability',
        confidence: 91,
      },
      {
        id: 'not-5',
        sourceType: 'docs',
        sourceName: 'Notion Architecture',
        sourceIdentifier: 'notion.so/help · Block Model',
        date: '2025',
        excerpt: 'Every piece of content in Notion is a block. Relational properties query adjacent tables via client-side graph traversal.',
        relationship: 'Unknown',
        url: 'https://notion.so',
        topic: 'Block Scalability',
        confidence: 88,
      },
    ],
    contradiction: {
      title: 'Infinite Flexibility vs. Structural Drift',
      supportingClaim: 'Teams love that Notion can become any tool: CRM, roadmap, wiki, or meeting log.',
      challengingReality: 'Without strict database schemas, team workspaces devolve into disorganized content graveyards that slow down as records multiply.',
      probeSignal: 'Flexibility is Notion\'s greatest acquisition driver and its primary retention liability.',
    },
  },
};
