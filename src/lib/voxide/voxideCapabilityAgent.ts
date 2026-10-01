import {
  ConciseProbeState,
  cleanNaturalIdeaInput,
  extractUrlFromText,
} from './probeVoxideBridge';

export interface ResolvedCapabilityCall {
  name: string;
  args: Record<string, any>;
}

/**
 * Resolves a natural-language user utterance (spoken or typed) + live ConciseProbeState
 * into the exact registered Voxide capability name and arguments.
 */
export function resolveVoiceCapabilityCall(
  rawUtterance: string,
  state: ConciseProbeState
): ResolvedCapabilityCall {
  const text = String(rawUtterance || '').trim();
  const lower = text.toLowerCase().replace(/[.?!]+$/, '').trim();

  // 1. Direct route navigation commands
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:calendar|validation\s+calendar|schedule|timeline)$/i.test(
      lower
    )
  ) {
    return { name: 'navigate', args: { route: '/app/calendar' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to)\s+(?:the\s+)?(?:sign\s*in|login|log\s*in|auth)\s*(?:page)?$/i.test(
      lower
    )
  ) {
    return { name: 'navigate', args: { route: '/signin' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to)\s+(?:the\s+)?(?:home|landing\s+page|main\s+page|start\s+page)$/i.test(
      lower
    )
  ) {
    return { name: 'navigate', args: { route: '/' } };
  }
  if (
    /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to)\s+(?:the\s+)?(?:research|research\s+workspace|workspace)$/i.test(
      lower
    )
  ) {
    return { name: 'navigate', args: { route: '/app/research' } };
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

  // 3. Real Playwright Product Testing ("Test this product", "Test this website as a student", "Try to sign up", "See if a first-time user can complete the main task", "Test this product and look for friction")
  if (
    /(?:test\s+this\s+(?:product|website|site|app|url)|run\s+a?\s*product\s+test|start\s+a?\s*product\s+test|launch\s+playwright|try\s+to\s+sign\s*up|try\s+signing\s*up|see\s+if\s+a\s+first[\s-]time\s+user\s+can|test\s+https?:\/\/|test\s+[a-z0-9-]+\.(?:com|org|net|io|co|app|dev|ai|et))/i.test(
      lower
    )
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
    /(?:open\s+(?:the\s+)?(?:living\s+)?evidence\s+graph|show\s+(?:me\s+)?(?:the\s+)?evidence\s+graph|open\s+(?:the\s+)?graph|view\s+(?:the\s+)?evidence\s+graph|^show\s+(?:me\s+)?the\s+evidence$|^open\s+this\s+evidence$)/i.test(
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

  // 6. Focus or show assumptions ("Show me the assumptions", "Focus on the second assumption", "What are the assumptions?")
  if (
    /(?:show\s+(?:me\s+)?(?:the\s+)?assumptions|list\s+(?:the\s+)?assumptions|what\s+are\s+the\s+assumptions|(?:focus|select|inspect|open)\s+(?:on\s+)?(?:the\s+)?(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|a[1-5])\s+assumption)/i.test(
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

  // 7. Filter existing evidence ("Show contradictory evidence", "Show me evidence supporting this", "Show me evidence against this")
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

  // 8. Find / search real evidence ("Find evidence that challenges the idea", "Find Reddit discussions about cooking apps", "Find academic evidence about food-planning applications", "Find evidence that university students actually have this problem")
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

    const topicMatch = text.match(
      /(?:about|for|on|that|whether)\s+(.+?)$/i
    );
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

  // 10. Summarize investigation ("Summarize what we found", "Summarize the investigation", "Give me a summary")
  if (
    /(?:summarize\s+(?:what\s+we\s+found|the\s+investigation|this\s+investigation|findings|results)|give\s+me\s+a\s+summary|what\s+did\s+we\s+find)/i.test(
      lower
    )
  ) {
    return {
      name: 'summarizeInvestigation',
      args: {},
    };
  }

  // 11. Default / explicit investigation command ("Research cooking apps", "Investigate ...", or an arbitrary product idea)
  const cleanedIdea = cleanNaturalIdeaInput(text) || text;
  return {
    name: 'startInvestigation',
    args: {
      idea: cleanedIdea,
    },
  };
}

/**
 * Formats a concise, factual spoken response directly from the real Probe capability result.
 */
export function formatCapabilityResultForSpeech(actionName: string, result: any): string {
  if (!result || typeof result !== 'object') {
    return 'Action completed in Probe.';
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
