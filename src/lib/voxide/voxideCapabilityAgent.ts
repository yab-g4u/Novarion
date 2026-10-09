import {
  ConciseProbeState,
  cleanNaturalIdeaInput,
  extractUrlFromText,
  isAgentTtsEcho,
} from './probeVoxideBridge';

export interface ResolvedCapabilityCall {
  name: string;
  args: Record<string, any>;
}

/**
 * Extracts the product idea ONLY when the user explicitly asks to investigate,
 * research, pressure-test, analyze, or search for an idea.
 * Returns null for navigation, graph, assumptions, testing, questions, or TTS echo.
 */
export function extractExplicitInvestigationIdea(rawUtterance: string): string | null {
  const text = String(rawUtterance || '').trim();
  if (!text || isAgentTtsEcho(text)) return null;

  const lower = text.toLowerCase().replace(/[.?!]+$/, '').trim();

  // Reject UI navigation, evidence graph, assumptions, testing, or summary phrases
  if (
    /^(?:open|go\s+to|navigate\s+to|switch\s+to|take\s+me\s+to|show|view|display|list|challenge|dispute|test|summarize|what\s+did\s+we\s+find|what\s+is\s+this|how\s+does\s+this\s+work|go\s+back|back)\b/i.test(
      lower
    )
  ) {
    return null;
  }

  const match = text.match(
    /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+|let'?s\s+|help\s+me\s+)?(?:start\s+an?\s+investigation\s+(?:on|for|about|into)\s+|run\s+an?\s+investigation\s+(?:on|for|about|into)\s+|investigate\s+|research\s+|pressure[\s-]test\s+|stress[\s-]test\s+|probe\s+|analyze\s+|explore\s+|validate\s+(?:the\s+idea\s+(?:of|for|that)\s+|my\s+idea\s+(?:for|about|to\s+build)\s+)|search\s+for\s+an?\s+idea\s+(?:for|about|on)\s+|search\s+for\s+|i\s+want\s+to\s+(?:build|create|launch|investigate|research)\s+|i(?:'m|\s+am)\s+building\s+|my\s+(?:product\s+|startup\s+)?idea\s+is\s+(?:to\s+build\s+)?|what\s+if\s+we\s+build\s+)(.+)$/i
  );

  if (!match || !match[1]) return null;

  const candidate = cleanNaturalIdeaInput(match[1]) || match[1].replace(/[.?!]+$/, '').trim();
  if (!candidate || candidate.length < 2) return null;

  // Guard against generic UI nouns masquerading as ideas
  if (
    /^(?:the\s+)?(?:research\s+page|research\s+workspace|workspace|evidence\s+graph|graph|assumptions?|this\s+assumption|this\s+product|this\s+evidence|the\s+investigation|testing|calendar)$/i.test(
      candidate.trim()
    )
  ) {
    return null;
  }

  return candidate.trim();
}

export function hasExplicitInvestigationIntent(rawUtterance: string): boolean {
  return extractExplicitInvestigationIdea(rawUtterance) !== null;
}

/**
 * Checks whether a string is a non-investigation command or question (e.g. "Open the evidence graph",
 * "Show assumptions", "Challenge this assumption", "Go to testing", "What did we find?", etc.).
 */
export function matchNonInvestigationCapability(
  rawUtterance: string,
  state: ConciseProbeState
): ResolvedCapabilityCall | null {
  const text = String(rawUtterance || '').trim();
  if (!text) return null;

  if (isAgentTtsEcho(text)) {
    return { name: 'noop', args: { reason: 'tts_echo' } };
  }

  const lower = text.toLowerCase().replace(/[.?!]+$/, '').trim();

  // 1. Direct route navigation commands ("Go to testing", "Open the research page", "Go back", etc.)
  // Supports English, Amharic (ወደ ኋላ ተመለስ, ወደ ምርመራ ሂድ, ወደ መሞከሪያ ሂድ, ወደ ማስረጃ ሂድ), and Afaan Oromo (gara duubatti deebi'i, gara qorannootti deemi, gara yaaliitti deemi)
  if (/^(?:go\s+back|navigate\s+back|take\s+me\s+back|back|ተመለስ|ወደ\s*ኋላ|gara\s+duubatti\s+deebi'?i|duubatti)$/i.test(lower)) {
    return { name: 'navigate', args: { route: 'back' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:calendar|validation\s+calendar|schedule|timeline)(?:\s+page)?$/i.test(
      lower
    ) || /ካሌንደር|ቀን\s*መቁጠሪያ|gara\s+kalandariitti/i.test(lower)
  ) {
    return { name: 'navigate', args: { route: '/app/calendar' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:sign\s*in|login|log\s*in|auth)(?:\s+page)?$/i.test(
      lower
    ) || /ግባ|ሎጊን|gara\s+seensaatti|seeni/i.test(lower)
  ) {
    return { name: 'navigate', args: { route: '/signin' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:home|landing|main|start)(?:\s+page)?$/i.test(
      lower
    ) || /ዋና\s*ገጽ|መነሻ|gara\s+fuula\s+duraatti|gara\s+manaa/i.test(lower)
  ) {
    return { name: 'navigate', args: { route: '/' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:research|research\s+workspace|research\s+page|workspace)(?:\s+page)?$/i.test(
      lower
    ) || /ምርምር|ወደ\s*ምርምር|gara\s+qorannootti/i.test(lower)
  ) {
    return { name: 'navigate', args: { route: '/app/research' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:testing|product\s+testing|playwright|testing\s+workspace|testing\s+page)(?:\s+page)?$/i.test(
      lower
    ) || /መሞከሪያ|ቴስቲንግ|ፈትን|gara\s+yaaliitti/i.test(lower)
  ) {
    return { name: 'navigate', args: { route: '/app/testing' } };
  }

  // 2. Product test results inspection ("What happened?", "What did the simulated user do?", "Where did it fail?", "Show me the biggest friction", "Open the test results", "Summarize this test")
  if (
    /(?:what\s+did\s+the\s+simulated\s+user\s+do|where\s+did\s+it\s+fail|biggest\s+friction|open\s+(?:the\s+)?test\s+results|show\s+(?:me\s+)?(?:the\s+)?(?:product\s+)?test\s+results|summarize\s+this\s+test|test\s+observations|what\s+failed\s+in\s+the\s+test)/i.test(
      lower
    ) ||
    (/^(?:what\s+happened|how\s+did\s+it\s+go|did\s+it\s+work|what\s+went\s+wrong)$/i.test(
      lower
    ) &&
      (state.currentRoute === '/app/testing' || Boolean(state.currentProductTestId)))
  ) {
    return {
      name: 'showProductTestResults',
      args: state.currentProductTestId ? { sessionId: state.currentProductTestId } : {},
    };
  }

  // 3. Real Playwright Product Testing ("Test this product", "Test chatgpt.com", "chatgpt.com ፈትን", "links.et qori", etc.)
  if (
    /(?:test\s+this\s+(?:product|website|site|app|url)|run\s+a?\s*product\s+test|start\s+a?\s*product\s+test|launch\s+playwright|try\s+to\s+sign\s*up|try\s+signing\s*up|see\s+if\s+a\s+first[\s-]time\s+user\s+can|test\s+https?:\/\/|test\s+[a-z0-9-]+\.(?:com|org|net|io|co|app|dev|ai|et)|ፈትን|ይህን\s*ፈትን|ዌብሳይት\s*ፈትን|qori|yaali|weebsaayitii\s*qori)/i.test(
      lower
    ) ||
    /([a-z0-9-]+\.(?:com|org|net|io|co|app|dev|ai|et))/i.test(text)
  ) {
    const extractedUrl = extractUrlFromText(text);
    const personaMatch = text.match(/\bas\s+an?\s+([a-z0-9\s-]+?)(?:\s+and\b|\s+to\b|[.?!]|$)/i);
    const persona = personaMatch
      ? personaMatch[1].trim()
      : /first[\s-]time\s+user/i.test(lower)
      ? 'first-time user'
      : undefined;

    let task: string | undefined;
    if (/try\s+to\s+sign\s*up|try\s+signing\s*up/i.test(lower)) {
      task =
        'Attempt to sign up as a new user, inspect authentication options, and identify onboarding friction';
    } else if (/first[\s-]time\s+user/i.test(lower)) {
      task = 'See if a first-time user can complete the main task and look for UX friction';
    } else if (/look\s+for\s+friction/i.test(lower)) {
      task = 'Navigate the primary user flow and identify the biggest UX friction points';
    } else if (!/^test\s+this\s+(?:product|website|site|app)$/i.test(lower)) {
      task = text;
    }

    return {
      name: 'startProductTest',
      args: {
        ...(extractedUrl ? { productUrl: extractedUrl } : {}),
        ...(task ? { task } : {}),
        ...(persona ? { persona } : {}),
        useGoogleAuth: /google|gmail|oauth|sign\s*in|sign\s*up/i.test(lower),
      },
    };
  }

  // 4. Open Evidence Graph ("Open the evidence graph", "Show me the evidence", "Open the graph", "Open this evidence")
  if (
    /(?:open\s+(?:the\s+)?(?:living\s+)?evidence\s+graph|show\s+(?:me\s+)?(?:the\s+)?(?:living\s+)?evidence\s+graph|go\s+to\s+(?:the\s+)?evidence\s+graph|open\s+(?:the\s+)?graph|view\s+(?:the\s+)?evidence\s+graph|^show\s+(?:me\s+)?the\s+evidence$|^open\s+this\s+evidence$)/i.test(
      lower
    )
  ) {
    let filter = 'all';
    if (/contradict|challeng|against|conflict/i.test(lower)) filter = 'Challenges';
    else if (/support|for\b/i.test(lower)) filter = 'Supports';
    return {
      name: 'openEvidenceGraph',
      args: {
        ...(state.selectedAssumption?.id ? { focusNodeId: state.selectedAssumption.id } : {}),
        filter,
      },
    };
  }

  // 5. Challenge an assumption ("Challenge this assumption", "Challenge this", "Challenge the second assumption")
  if (
    /^(?:challenge|dispute|contest|question)\s+(?:this|that|it|the\s+assumption|this\s+assumption|(?:the\s+)?(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|a[1-5])\b.*)/i.test(
      lower
    ) ||
    lower.includes('challenge this assumption') ||
    lower === 'challenge this'
  ) {
    let target = 'this';
    if (/first|1st|\ba1\b/i.test(lower)) target = 'first';
    else if (/second|2nd|\ba2\b/i.test(lower)) target = 'second';
    else if (/third|3rd|\ba3\b/i.test(lower)) target = 'third';
    else if (/fourth|4th|\ba4\b/i.test(lower)) target = 'fourth';
    else if (/fifth|5th|\ba5\b/i.test(lower)) target = 'fifth';

    return {
      name: 'challengeAssumption',
      args: {
        assumptionIdOrQuery: target,
      },
    };
  }

  // 6. Focus or show assumptions ("Show me the assumptions", "Show assumptions", "Focus on the second assumption", "What are the assumptions?")
  if (
    /(?:show\s+(?:me\s+)?(?:the\s+)?assumptions|list\s+(?:the\s+)?assumptions|view\s+(?:the\s+)?assumptions|open\s+(?:the\s+)?assumptions|what\s+are\s+(?:the|our)\s+assumptions|(?:focus|select|inspect|open)\s+(?:on\s+)?(?:the\s+)?(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|a[1-5])\s+assumption)/i.test(
      lower
    )
  ) {
    let focusAssumption: string | undefined;
    if (/first|1st|\ba1\b/i.test(lower)) focusAssumption = 'first';
    else if (/second|2nd|\ba2\b/i.test(lower)) focusAssumption = 'second';
    else if (/third|3rd|\ba3\b/i.test(lower)) focusAssumption = 'third';
    else if (/fourth|4th|\ba4\b/i.test(lower)) focusAssumption = 'fourth';
    else if (/fifth|5th|\ba5\b/i.test(lower)) focusAssumption = 'fifth';

    return {
      name: 'showAssumptions',
      args: {
        ...(focusAssumption ? { focusAssumption } : {}),
      },
    };
  }

  // 7. Filter existing evidence ("Show contradictory evidence", "Show me contradictory evidence", "Show me evidence supporting this", "Show me evidence against this")
  if (
    /^(?:show|filter|display|view)\s+(?:me\s+)?(?:only\s+)?(?:the\s+)?(?:contradictory|challenging|conflicting|supporting|positive|negative|counter)\s+evidence/i.test(
      lower
    ) ||
    /^(?:show|filter|display)\s+(?:me\s+)?evidence\s+(?:supporting|for|against|challenging|contradicting)\s+(?:this|that|it|the\s+idea|the\s+assumption)/i.test(
      lower
    )
  ) {
    const isAgainst = /contradict|challeng|against|conflict|negative|counter/i.test(lower);
    const isSupport = /support|for|positive/i.test(lower);
    const referencesSelected = /\b(?:this|that|it|assumption)\b/i.test(lower);
    return {
      name: 'filterEvidence',
      args: {
        stance: isAgainst ? 'CHALLENGES' : isSupport ? 'SUPPORTS' : 'all',
        assumptionId:
          referencesSelected && state.selectedAssumption?.id
            ? state.selectedAssumption.id
            : 'all',
      },
    };
  }

  // 8. Find / search real evidence ("Find evidence that challenges the idea", "Find Reddit discussions about the product", "Find academic evidence about software reliability", "Find evidence about whether users would pay for this product")
  if (
    /^(?:find|search\s+for|get|retrieve|look\s+for)\s+(?:me\s+)?(?:real\s+)?(?:reddit|academic|scholar|scholarxiv|x|twitter|linkedin|supporting|contradictory|challenging)?\s*(?:evidence|discussions|papers|studies|signals|posts)/i.test(
      lower
    )
  ) {
    let sourceType = 'all';
    if (/reddit|subreddit/i.test(lower)) sourceType = 'reddit';
    else if (/academic|scholar|paper|study|studies|arxiv/i.test(lower)) sourceType = 'scholarxiv';
    else if (/\bx\b|twitter|tweet/i.test(lower)) sourceType = 'x';
    else if (/linkedin/i.test(lower)) sourceType = 'linkedin';

    let evidenceType = 'all';
    if (/challeng|contradict|against|conflict|counter/i.test(lower)) evidenceType = 'CHALLENGES';
    else if (/support|confirm|validat/i.test(lower)) evidenceType = 'SUPPORTS';

    const topicMatch = text.match(/(?:about|for|on|that|whether)\s+(.+?)$/i);
    const extractedQuery = topicMatch ? topicMatch[1].replace(/[.?!]+$/, '').trim() : '';
    const isGenericQuery =
      !extractedQuery ||
      /^(?:challenges\s+the\s+idea|supports\s+the\s+idea|this\s+idea|the\s+idea|this|that)$/i.test(
        extractedQuery
      );

    return {
      name: 'findEvidence',
      args: {
        query: isGenericQuery ? state.currentIdea : extractedQuery,
        evidenceType,
        sourceType,
      },
    };
  }

  // 9. Create validation test ("Create a validation test", "Schedule a validation experiment")
  if (
    /(?:create|schedule|design|build|add)\s+an?\s*(?:validation\s+test|validation\s+experiment|experiment|smoke\s+test)/i.test(
      lower
    )
  ) {
    return {
      name: 'createValidationTest',
      args: {},
    };
  }

  // 10. Summarize investigation or answer questions about current findings/evidence ("Summarize what we found", "Summarize the investigation", "What did we find?", "What is this evidence?", "How does this work?")
  if (
    /(?:summarize\s+(?:what\s+we\s+found|the\s+investigation|this\s+investigation|findings|results)|give\s+me\s+a\s+summary|what\s+did\s+we\s+find|what\s+is\s+this\s+evidence|explain\s+this\s+evidence|how\s+does\s+this\s+work|what\s+are\s+the\s+findings)/i.test(
      lower
    )
  ) {
    return {
      name: 'summarizeInvestigation',
      args: {},
    };
  }

  return null;
}

/**
 * Resolves a natural-language user utterance (spoken or typed) + live ConciseProbeState
 * into the exact registered Voxide capability name and arguments.
 *
 * CORE RULE: Only explicitly identified investigation requests call `startInvestigation`.
 * Non-investigation commands and questions NEVER fall back to `startInvestigation`.
 */
export function resolveVoiceCapabilityCall(
  rawUtterance: string,
  state: ConciseProbeState
): ResolvedCapabilityCall {
  const text = String(rawUtterance || '').trim();
  if (!text || isAgentTtsEcho(text)) {
    return { name: 'noop', args: { reason: 'tts_echo' } };
  }

  // 1. Check all non-investigation capabilities first (navigation, testing, graph, assumptions, filtering, evidence search, summary)
  const matchedCapability = matchNonInvestigationCapability(text, state);
  if (matchedCapability) {
    return matchedCapability;
  }

  // 2. Check if the user explicitly asked to start/research/investigate/pressure-test an idea
  const explicitIdea = extractExplicitInvestigationIdea(text);
  if (explicitIdea) {
    return {
      name: 'startInvestigation',
      args: {
        idea: explicitIdea,
      },
    };
  }

  // 3. For any other question or conversational utterance ("How does this work?", "What is this evidence?"),
  // summarize the active investigation state without modifying the search input.
  return {
    name: 'summarizeInvestigation',
    args: {},
  };
}

/**
 * Formats a concise, factual spoken response directly from the real Probe capability result.
 */
export function formatCapabilityResultForSpeech(actionName: string, result: any): string {
  if (!result || typeof result !== 'object') {
    return 'Action completed in Probe.';
  }
  if (result.status === 'ignored') {
    return '';
  }
  if (result.status === 'error') {
    return result.message || 'The operation encountered an error.';
  }

  switch (actionName) {
    case 'navigate':
      return `Opened ${result.route}.`;

    case 'startInvestigation': {
      const idea = result.idea || 'your product idea';
      const aCount = result.assumptionsCount ?? result.assumptionsFound?.length ?? 0;
      const evTotal = result.evidenceFound?.total ?? result.evidenceCount ?? 0;
      const sup = result.evidenceFound?.supporting ?? 0;
      const chal = result.evidenceFound?.challenging ?? 0;
      const altName = result.alternativesFound?.[0]?.name;
      return `Investigated "${idea}". Deconstructed ${aCount} core assumptions and retrieved ${evTotal} empirical signals (${sup} supporting, ${chal} challenging).${
        altName ? ` Existing alternatives include ${altName}.` : ''
      }`;
    }

    case 'showAssumptions': {
      if (result.focusedAssumption) {
        return `Focused assumption ${result.focusedAssumption.id}: ${result.focusedAssumption.text} (Status: ${result.focusedAssumption.status}).`;
      }
      const first = result.assumptions?.[0];
      return `Displaying ${result.assumptionsCount || 0} deconstructed assumptions for "${
        result.idea
      }".${first ? ` Top assumption ${first.id}: ${first.text}` : ''}`;
    }

    case 'challengeAssumption': {
      const counter = result.counterEvidence?.[0]?.title;
      return `Challenged assumption ${result.challengedAssumptionId}: "${result.assumptionText}". Marked as CHALLENGED with ${
        result.challengingSignalsCount || 1
      } counter-signals.${counter ? ` Key counter-evidence: ${counter}.` : ''}`;
    }

    case 'findEvidence': {
      const count = result.evidenceCount ?? result.totalVerifiedEvidence ?? 0;
      const top = result.evidence?.[0] || result.topEvidence?.[0];
      return `Retrieved ${count} empirical evidence signals for "${result.query}".${
        top ? ` Top finding from ${top.sourceType}: "${top.title}".` : ''
      }`;
    }

    case 'openEvidenceGraph':
      return `Opened the Living Evidence Graph focused on ${result.focusedNode}${
        result.filter && result.filter !== 'all' ? ` filtered by ${result.filter}` : ''
      }.`;

    case 'filterEvidence': {
      const f = result.appliedFilters || {};
      return `Filtered evidence to ${f.stance !== 'all' ? f.stance : 'all stances'}${
        f.sourceType && f.sourceType !== 'all' ? ` on ${f.sourceType}` : ''
      }${f.assumptionId && f.assumptionId !== 'all' ? ` for assumption ${f.assumptionId}` : ''} (${
        result.matchingEvidenceCount ?? 0
      } matching items).`;
    }

    case 'createValidationTest': {
      const vt = result.validationTest;
      return vt
        ? `Scheduled ${vt.method} validation experiment: "${vt.question}" targeting ${vt.target}.`
        : 'Created validation test in the calendar.';
    }

    case 'startProductTest': {
      const loadStr = result.loadTimeMs ? ` Page loaded in ${result.loadTimeMs}ms.` : '';
      const frictionStr = result.biggestFriction
        ? ` Key observation: ${result.biggestFriction}`
        : '';
      return `Started live Playwright test on ${result.productUrl} (${
        result.stepsExecuted || 0
      } steps executed).${loadStr}${frictionStr}`;
    }

    case 'showProductTestResults': {
      const steps = result.stepCount || 0;
      const friction = result.biggestFriction
        ? ` Biggest friction: ${result.biggestFriction}`
        : '';
      const lastStep =
        Array.isArray(result.simulatedUserSteps) && result.simulatedUserSteps.length > 0
          ? ` Latest simulated user action: ${
              result.simulatedUserSteps[result.simulatedUserSteps.length - 1].message
            }.`
          : '';
      return `Playwright test on ${result.productUrl} is ${result.sessionStatus} after ${steps} steps.${lastStep}${friction}`;
    }

    case 'summarizeInvestigation': {
      const ab = result.assumptionsBreakdown || {};
      const eb = result.evidenceBreakdown || {};
      const nextStep = result.recommendedNextStep
        ? ` Recommended next validation test: ${result.recommendedNextStep}`
        : '';
      return `Summary for "${result.idea}": ${ab.total || 0} assumptions (${
        ab.supported || 0
      } supported, ${ab.challenged || 0} challenged) backed by ${
        eb.totalVerified || 0
      } verified evidence signals (${eb.supporting || 0} supporting, ${
        eb.challenging || 0
      } challenging).${nextStep}`;
    }

    default:
      return 'Executed command in Probe.';
  }
}
