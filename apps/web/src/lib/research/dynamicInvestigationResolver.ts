import { RealSourceSnippet } from '../../data/realEvidenceData';
import { DynamicGraphData, DynamicEvidenceSource } from '../../types/evidenceGraph';

export interface RadialEvidenceItem {
  id: string;
  source: 'reddit' | 'github' | 'google' | 'x' | 'reviews' | 'scholarxiv' | 'unknown';
  sourceName: string;
  subHeader: string;
  excerpt: string;
  relationship: 'Supports' | 'Contradicts' | 'Unknown';
  url: string;
  timestamp: string;
}

export interface InvestigationResultData {
  query: string;
  coreAssumption: string;
  domain: string;
  supportItems: RadialEvidenceItem[];
  contradictItems: RadialEvidenceItem[];
  unknownItem: RadialEvidenceItem;
  graphData: DynamicGraphData;
  calendarData: {
    discussionVolume: string;
    contradictionRatio: string;
    signalTakeaway: string;
  };
  productTestData: {
    target: string;
    task: string;
    expectedResult: string;
    friction: string;
  };
}

export function generateDynamicInvestigation(rawQuery: string): InvestigationResultData {
  const q = rawQuery.trim().toLowerCase();

  // 1. DOMAIN: Cooking / Meal Planning
  if (q.includes('cook') || q.includes('recipe') || q.includes('meal') || q.includes('pantry') || q.includes('food') || q.includes('diet')) {
    const cookingSources: DynamicEvidenceSource[] = [
      {
        id: 'g-cook-1',
        sourceType: 'reddit',
        sourceName: 'r/Cooking',
        sourceIdentifier: 'r/Cooking · Community',
        date: '8h ago',
        excerpt: 'Deciding what to cook causes 80% of dinner stress.',
        relationship: 'Supports',
        url: 'https://reddit.com/r/Cooking',
        topic: 'Recipe Fatigue',
        confidence: 94,
      },
      {
        id: 'g-cook-2',
        sourceType: 'scholarxiv',
        sourceName: 'ScholarXIV',
        sourceIdentifier: 'ScholarXIV · Behavioral Paper',
        date: '3d ago',
        excerpt: '88% abandonment when manual entry exceeds 90s.',
        relationship: 'Challenges',
        url: 'https://www.scholarxiv.com/papers/sx-cook-2025-11',
        topic: 'Friction Churn',
        confidence: 96,
      },
      {
        id: 'g-cook-3',
        sourceType: 'x',
        sourceName: 'X / Twitter',
        sourceIdentifier: '@chef_operator · Review',
        date: '14h ago',
        excerpt: 'Scanning 15 spices every night is completely unsustainable.',
        relationship: 'Challenges',
        url: 'https://x.com',
        topic: 'Input Friction',
        confidence: 89,
      },
      {
        id: 'g-cook-4',
        sourceType: 'docs',
        sourceName: 'Pricing Analysis',
        sourceIdentifier: 'Unknown Factor · Market Data',
        date: '2d ago',
        excerpt: 'Standalone web planners struggle to convert past $5/mo without grocery delivery integration.',
        relationship: 'Unknown',
        url: '#',
        topic: 'Willingness to Pay',
        confidence: 65,
      },
    ];

    return {
      query: rawQuery,
      coreAssumption: 'Home cooks will consistently log pantry items daily to automate weeknight meal planning.',
      domain: 'Nutritional Informatics & Consumer Food Tech',
      supportItems: [
        {
          id: 'cook-sup-1',
          source: 'reddit',
          sourceName: 'Reddit',
          subHeader: 'r/Cooking · 8h ago',
          excerpt: '“Deciding what to cook on weeknights causes 80% of our household dinner stress. We just want 3 fast meals.”',
          relationship: 'Supports',
          url: 'https://reddit.com/r/Cooking',
          timestamp: '8h ago',
        },
        {
          id: 'cook-sup-2',
          source: 'github',
          sourceName: 'GitHub',
          subHeader: 'meal-cli · 1d ago',
          excerpt: 'Open-source recipe clippers hold 14,000+ stars, showing high demand for distraction-free meal instructions.',
          relationship: 'Supports',
          url: 'https://github.com',
          timestamp: '1d ago',
        },
        {
          id: 'cook-sup-3',
          source: 'google',
          sourceName: 'Google / Web',
          subHeader: 'FoodTech Review · 2d ago',
          excerpt: '84% of surveyed households report grocery waste due to lacking inspiration for leftover ingredients.',
          relationship: 'Supports',
          url: 'https://google.com',
          timestamp: '2d ago',
        },
      ],
      contradictItems: [
        {
          id: 'cook-con-1',
          source: 'x',
          sourceName: 'X',
          subHeader: '@chef_operator · 14h ago',
          excerpt: 'Every meal app fails because scanning barcodes for salt and olive oil takes longer than making a sandwich.',
          relationship: 'Contradicts',
          url: 'https://x.com',
          timestamp: '14h ago',
        },
        {
          id: 'cook-con-2',
          source: 'reviews',
          sourceName: 'Product Reviews',
          subHeader: 'Paprika 3 Reviews · 1d ago',
          excerpt: 'Users abandon manual pantry inventory within 48 hours. Barcode scanning UX has a 72% churn rate.',
          relationship: 'Contradicts',
          url: 'https://g2.com',
          timestamp: '1d ago',
        },
        {
          id: 'cook-con-3',
          source: 'scholarxiv',
          sourceName: 'Research Papers',
          subHeader: 'ScholarXIV HCI (2024) · 3d ago',
          excerpt: 'Controlled study: Adherence drops 88% when grocery onboarding requires more than 3 diet configuration steps.',
          relationship: 'Contradicts',
          url: 'https://scholar.google.com',
          timestamp: '3d ago',
        },
      ],
      unknownItem: {
        id: 'cook-unk-1',
        source: 'unknown',
        sourceName: 'Unknown',
        subHeader: 'Unknown · 2d ago',
        excerpt: 'Pricing willingness: Will users pay $9/mo for receipt photo OCR, or is it strictly ad-supported?',
        relationship: 'Unknown',
        url: '#',
        timestamp: '2d ago',
      },
      graphData: {
        query: rawQuery,
        coreAssumption: 'Home cooks will log pantry items daily to automate meal plans.',
        productName: 'Meal Planning & Pantry App',
        sources: cookingSources,
        summary: {
          supportingCount: 1,
          challengingCount: 2,
          total: cookingSources.length,
        },
      },
      calendarData: {
        discussionVolume: '42,800 posts',
        contradictionRatio: '54% critical',
        signalTakeaway: 'Users strongly desire 1-click weeknight recipe suggestions, but reject manual pantry barcode scanning.',
      },
      productTestData: {
        target: 'meal-planner.app/onboarding',
        task: 'Generate 3 weeknight meals without signing up',
        expectedResult: 'Instant recipe suggestions matching fridge ingredients',
        friction: 'App enforces 14-step pantry checklist before revealing any recipes',
      },
    };
  }

  // 2. DOMAIN: Student Housing / Real Estate
  if (q.includes('student') || q.includes('housing') || q.includes('roommate') || q.includes('dorm') || q.includes('rent') || q.includes('apartment')) {
    const housingSources: DynamicEvidenceSource[] = [
      {
        id: 'g-house-1',
        sourceType: 'reddit',
        sourceName: 'r/College',
        sourceIdentifier: 'r/College · 450 upvotes',
        date: '10h ago',
        excerpt: 'Facebook housing groups are 90% scam bots.',
        relationship: 'Supports',
        url: 'https://reddit.com/r/College',
        topic: 'Safety & Verification',
        confidence: 92,
      },
      {
        id: 'g-house-2',
        sourceType: 'x',
        sourceName: 'X / Twitter',
        sourceIdentifier: '@campus_resident',
        date: '16h ago',
        excerpt: 'Students refuse subscription paywalls and move to IG.',
        relationship: 'Challenges',
        url: 'https://x.com',
        topic: 'Price Resistance',
        confidence: 95,
      },
      {
        id: 'g-house-3',
        sourceType: 'scholarxiv',
        sourceName: 'ScholarXIV',
        sourceIdentifier: 'ScholarXIV · Urban Studies',
        date: '4d ago',
        excerpt: 'Proximity and rent cost drive 94% of leasing choice.',
        relationship: 'Challenges',
        url: 'https://www.scholarxiv.com/papers/sx-urban-2025-04',
        topic: 'Decision Drivers',
        confidence: 88,
      },
    ];

    return {
      query: rawQuery,
      coreAssumption: 'University students will pay a premium to match with roommates verified by academic credentials.',
      domain: 'PropTech & Higher Ed Living',
      supportItems: [
        {
          id: 'house-sup-1',
          source: 'reddit',
          sourceName: 'Reddit',
          subHeader: 'r/College · 10h ago',
          excerpt: '“Facebook groups for college housing are 90% scammers and bots. We desperately need verified campus leases.”',
          relationship: 'Supports',
          url: 'https://reddit.com/r/College',
          timestamp: '10h ago',
        },
        {
          id: 'house-sup-2',
          source: 'github',
          sourceName: 'GitHub',
          subHeader: 'campus-housing-scraper · 2d ago',
          excerpt: 'Student-built lease aggregate tools deployed across 30+ universities show huge organic traffic.',
          relationship: 'Supports',
          url: 'https://github.com',
          timestamp: '2d ago',
        },
        {
          id: 'house-sup-3',
          source: 'google',
          sourceName: 'Google / Web',
          subHeader: 'Student Union Review · 3d ago',
          excerpt: '71% of off-campus freshmen report roommate conflict regarding split utilities and chore habits.',
          relationship: 'Supports',
          url: 'https://google.com',
          timestamp: '3d ago',
        },
      ],
      contradictItems: [
        {
          id: 'house-con-1',
          source: 'x',
          sourceName: 'X',
          subHeader: '@campus_resident · 16h ago',
          excerpt: 'Students have zero disposable income. Nobody is paying $15/mo for a roommate matching app when group chats are free.',
          relationship: 'Contradicts',
          url: 'https://x.com',
          timestamp: '16h ago',
        },
        {
          id: 'house-con-2',
          source: 'reviews',
          sourceName: 'Product Reviews',
          subHeader: 'Roomster App Store · 1d ago',
          excerpt: 'Paywalling messaging between verified students caused 85% of users to immediately switch to Instagram DMs.',
          relationship: 'Contradicts',
          url: 'https://g2.com',
          timestamp: '1d ago',
        },
        {
          id: 'house-con-3',
          source: 'scholarxiv',
          sourceName: 'Research Papers',
          subHeader: 'ScholarXIV Urban Studies · 4d ago',
          excerpt: 'Longitudinal study: Lease decisions are 94% dictated by proximity and price, with social matching ranking secondary.',
          relationship: 'Contradicts',
          url: 'https://scholar.google.com',
          timestamp: '4d ago',
        },
      ],
      unknownItem: {
        id: 'house-unk-1',
        source: 'unknown',
        sourceName: 'Unknown',
        subHeader: 'Unknown · 3d ago',
        excerpt: 'University partnership readiness: Will campus housing departments license enterprise APIs or block 3rd party scrapers?',
        relationship: 'Unknown',
        url: '#',
        timestamp: '3d ago',
      },
      graphData: {
        query: rawQuery,
        coreAssumption: 'Students will pay a premium for verified .edu roommate matching.',
        productName: 'Student Housing Platform',
        sources: housingSources,
        summary: {
          supportingCount: 1,
          challengingCount: 2,
          total: housingSources.length,
        },
      },
      calendarData: {
        discussionVolume: '28,900 posts',
        contradictionRatio: '62% critical',
        signalTakeaway: 'Extreme demand for verified scam-free campus housing, but high refusal to pay consumer subscription fees.',
      },
      productTestData: {
        target: 'campus-living.org/roommates',
        task: 'Filter verified .edu roommates within 2 miles of campus',
        expectedResult: 'Display verified student listings with mutual interests',
        friction: 'Mandatory $12 unlock fee required before viewing roommate profiles',
      },
    };
  }

  // 3. DEFAULT / AI & Productivity Software (Matches home-page.png)
  const defaultSources: DynamicEvidenceSource[] = [
    {
      id: 'g-ai-1',
      sourceType: 'reddit',
      sourceName: 'r/technology',
      sourceIdentifier: 'r/technology · 1.2k upvotes',
      date: '12h ago',
      excerpt: 'AI replaces 60% of drafting and boilerplate code.',
      relationship: 'Supports',
      url: 'https://reddit.com/r/technology',
      topic: 'Speed & Prototyping',
      confidence: 93,
    },
    {
      id: 'g-ai-2',
      sourceType: 'x',
      sourceName: 'X / Twitter',
      sourceIdentifier: '@dev_operator',
      date: '18h ago',
      excerpt: 'Verification overhead negates speed gains on complex logic.',
      relationship: 'Challenges',
      url: 'https://x.com',
      topic: 'Hallucination Overhead',
      confidence: 91,
    },
    {
      id: 'g-ai-3',
      sourceType: 'scholarxiv',
      sourceName: 'ScholarXIV',
      sourceIdentifier: 'ScholarXIV HCI (2025)',
      date: '3d ago',
      excerpt: 'Mixed empirical results on full software replacement.',
      relationship: 'Challenges',
      url: 'https://www.scholarxiv.com/papers/sx-ai-2025-09',
      topic: 'Empirical Trial',
      confidence: 96,
    },
    {
      id: 'g-ai-4',
      sourceType: 'docs',
      sourceName: 'Unknown',
      sourceIdentifier: 'Enterprise Liability',
      date: '2d ago',
      excerpt: 'Legal and audit liability for autonomous agent actions remains unresolved.',
      relationship: 'Unknown',
      url: '#',
      topic: 'Compliance Risk',
      confidence: 70,
    },
  ];

  return {
    query: rawQuery || 'AI tools will replace most productivity software',
    coreAssumption: 'Knowledge workers will abandon specialized domain tools in favor of unified generative AI agents.',
    domain: 'Enterprise Software & Human-Computer Interaction',
    supportItems: [
      {
        id: 'ai-sup-1',
        source: 'reddit',
        sourceName: 'Reddit',
        subHeader: 'r/technology • 12h ago',
        excerpt: '“AI tools are already replacing a lot of my workflow for drafting documents, querying databases, and summarization.”',
        relationship: 'Supports',
        url: 'https://reddit.com/r/technology',
        timestamp: '12h ago',
      },
      {
        id: 'ai-sup-2',
        source: 'github',
        sourceName: 'GitHub',
        subHeader: 'GitHub • 1d ago',
        excerpt: 'Popular repos & discussions show explosive growth in local LLM coding assistants and agent frameworks.',
        relationship: 'Supports',
        url: 'https://github.com',
        timestamp: '1d ago',
      },
      {
        id: 'ai-sup-3',
        source: 'google',
        sourceName: 'Google / Web',
        subHeader: 'Google / Web • 2d ago',
        excerpt: 'News, blogs and articles highlight massive enterprise AI productivity deployments reducing repetitive reporting.',
        relationship: 'Supports',
        url: 'https://google.com',
        timestamp: '2d ago',
      },
    ],
    contradictItems: [
      {
        id: 'ai-con-1',
        source: 'x',
        sourceName: 'X',
        subHeader: 'X • 18h ago',
        excerpt: 'Many professionals still prefer traditional deterministic tools for complex accounting, CAD, and mission-critical work.',
        relationship: 'Contradicts',
        url: 'https://x.com',
        timestamp: '18h ago',
      },
      {
        id: 'ai-con-2',
        source: 'reviews',
        sourceName: 'Product Reviews',
        subHeader: 'Product Reviews • 1d ago',
        excerpt: 'Users report hallucinations, unpredictable UI latency, and context window drift in real-world team workflows.',
        relationship: 'Contradicts',
        url: 'https://g2.com',
        timestamp: '1d ago',
      },
      {
        id: 'ai-con-3',
        source: 'scholarxiv',
        sourceName: 'Research Papers',
        subHeader: 'Research Papers • 3d ago',
        excerpt: 'Empirical studies across 1,200 operators show mixed results on net speed once verification time is accounted for.',
        relationship: 'Contradicts',
        url: 'https://scholar.google.com',
        timestamp: '3d ago',
      },
    ],
    unknownItem: {
      id: 'ai-unk-1',
      source: 'unknown',
      sourceName: 'Unknown',
      subHeader: 'Unknown • 2d ago',
      excerpt: 'Long-term cognitive fatigue and liability for automated agent mistakes remain unmeasured across industries.',
      relationship: 'Unknown',
      url: '#',
      timestamp: '2d ago',
    },
    graphData: {
      query: rawQuery || 'AI tools will replace most productivity software',
      coreAssumption: 'Knowledge workers will abandon specialized domain tools in favor of generative agents.',
      productName: 'Productivity Software & AI Agents',
      sources: defaultSources,
      summary: {
        supportingCount: 1,
        challengingCount: 2,
        total: defaultSources.length,
      },
    },
    calendarData: {
      discussionVolume: '34,100 posts',
      contradictionRatio: '48% critical',
      signalTakeaway: 'Teams embrace background AI automation, but actively reject "all-in-one chatbots" replacing opinionated software.',
    },
    productTestData: {
      target: 'links.et/verify',
      task: 'Verify Telebirr payment reference DHV0BHI2GG',
      expectedResult: 'Instant cryptographic receipt verification',
      friction: 'Non-deterministic error handling on telecom gateway drops',
    },
  };
}
