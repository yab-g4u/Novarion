export interface TaskMilestone {
  id: string;
  description: string;
  targetRole?: string;
  expectedKeywords: string[];
  actionType: 'NAVIGATE' | 'LOCATE_INPUT' | 'TYPE_DATA' | 'SUBMIT' | 'VERIFY_RESULT';
  completed: boolean;
}

export interface TaskPlan {
  originalTask: string;
  inferredGoal:
    | 'CREATE_SHORT_LINK'
    | 'VERIFY_RECEIPT'
    | 'AUTHENTICATE_GOOGLE'
    | 'SEARCH_ITEM'
    | 'ADD_TO_CART'
    | 'EXPLORE_FEATURE'
    | 'GENERAL_TASK';
  extractedData?: {
    inputUrl?: string;
    referenceCode?: string;
    searchQuery?: string;
    customValue?: string;
    targetItem?: string;
    intent?: 'verify' | 'search' | 'submit' | 'navigate' | 'legitimacy_check' | 'explore';
  };
  isAmbiguous?: boolean;
  ambiguityReason?: string;
  milestones: TaskMilestone[];
}

export class TaskPlanner {
  public plan(task: string, _initialUrl: string): TaskPlan {
    const rawTask = (task || '').trim();
    const lower = rawTask.toLowerCase();

    // 1. Google / Gmail authentication flow
    if (
      lower.includes('g4uforlife@gmail.com') ||
      lower.includes('google auth') ||
      lower.includes('sign in with google') ||
      lower.includes('login with google') ||
      (lower.includes('sign in') && lower.includes('google'))
    ) {
      return {
        originalTask: rawTask,
        inferredGoal: 'AUTHENTICATE_GOOGLE',
        milestones: [
          {
            id: 'm1',
            description: 'Detect authentication options and locate Google Sign-In trigger',
            expectedKeywords: ['google', 'sign in', 'continue with google', 'login'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: 'Initiate Google/Gmail authentication flow',
            expectedKeywords: ['email', 'identifier', 'g4uforlife@gmail.com'],
            actionType: 'TYPE_DATA',
            completed: false
          },
          {
            id: 'm3',
            description: 'Observe post-authentication redirect or interactive challenge state',
            expectedKeywords: ['dashboard', 'account', 'password', 'verify'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 2. Receipt / Payment / Code Verification & Legitimacy Check
    // Example: "Check whether DJ54GQAQ6K on links.et is legitimate or fake"
    // Example: "Verify transaction reference DHV0BHI2GG in payment verification input"
    const backtickOrQuoted = rawTask.match(/[`"']([A-Za-z0-9_-]{5,24})[`"']/);
    const tokens = rawTask.match(/\b[A-Za-z0-9_-]{5,20}\b/g) || [];
    const alphanumericToken = tokens.find(
      (tok) => /\d/.test(tok) && /[a-zA-Z]/.test(tok) && !['links', 'verify'].includes(tok.toLowerCase())
    ) || tokens.find(
      (tok) => /^[A-Z0-9]{6,16}$/.test(tok) && !['VERIFY', 'PAYMENT', 'RECEIPT'].includes(tok)
    );
    const detectedCode = backtickOrQuoted?.[1] || alphanumericToken;

    const isVerificationIntent =
      lower.includes('receipt') ||
      lower.includes('payment') ||
      lower.includes('transaction') ||
      lower.includes('voucher') ||
      lower.includes('legitimate') ||
      lower.includes('fake') ||
      Boolean(detectedCode && (lower.includes('verify') || lower.includes('check')));

    if (isVerificationIntent) {
      // If the user asked a verification query without providing any code or item to verify, handle ambiguity
      if (!detectedCode && (lower.includes('check whether') || lower.includes('is legitimate') || lower.includes('verify receipt') || lower.includes('receipt is'))) {
        return {
          originalTask: rawTask,
          inferredGoal: 'VERIFY_RECEIPT',
          isAmbiguous: true,
          ambiguityReason: 'Task requested legitimacy verification, but no reference code, receipt number, or identifier was specified. Please provide the reference code to verify.',
          milestones: [
            {
              id: 'm1',
              description: 'Request clarification for missing reference code or receipt number',
              expectedKeywords: ['clarification', 'reference', 'code'],
              actionType: 'VERIFY_RESULT',
              completed: false
            }
          ]
        };
      }

      const referenceCode = detectedCode || 'DHV0BHI2GG';

      return {
        originalTask: rawTask,
        inferredGoal: 'VERIFY_RECEIPT',
        extractedData: {
          referenceCode,
          inputUrl: referenceCode,
          targetItem: referenceCode,
          customValue: referenceCode,
          intent: 'legitimacy_check'
        },
        milestones: [
          {
            id: 'm1',
            description: 'Locate payment reference or receipt verification input field on page',
            expectedKeywords: ['receipt', 'reference', 'url', 'verify', 'input'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: `Enter reference "${referenceCode}" into verification input`,
            expectedKeywords: ['input', 'text'],
            actionType: 'TYPE_DATA',
            completed: false
          },
          {
            id: 'm3',
            description: 'Click Verify / Submit button to query verification gateway',
            expectedKeywords: ['verify', 'submit', 'check'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Inspect verification response, transaction state, or error feedback on page',
            expectedKeywords: ['verified', 'receipt', 'error', 'result', 'status', 'payer', 'completed'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 3. URL shortener / link generation
    if (
      lower.includes('short link') ||
      lower.includes('shorten') ||
      lower.includes('create a link') ||
      lower.includes('short url')
    ) {
      const urlMatch = rawTask.match(/https?:\/\/[^\s"',]+/i);
      const targetUrl = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : 'https://example.com';

      return {
        originalTask: rawTask,
        inferredGoal: 'CREATE_SHORT_LINK',
        extractedData: {
          inputUrl: targetUrl,
          customValue: targetUrl,
          intent: 'submit'
        },
        milestones: [
          {
            id: 'm1',
            description: 'Locate URL or primary text input field on page',
            expectedKeywords: ['url', 'link', 'paste', 'http', 'shorten'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: `Enter "${targetUrl}" into input field`,
            expectedKeywords: ['input', 'text'],
            actionType: 'TYPE_DATA',
            completed: false
          },
          {
            id: 'm3',
            description: 'Submit form by clicking primary submit button or pressing Enter',
            expectedKeywords: ['shorten', 'verify', 'create', 'generate', 'submit', 'go'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Observe resulting output or page state',
            expectedKeywords: ['copy', 'copied', 'short', 'result', 'http'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 4. Search / Item lookup
    if (lower.includes('search') || lower.includes('look up') || lower.includes('find item')) {
      const quoted = rawTask.match(/[`"']([^`"']+)`"'/);
      const searchWordMatch = rawTask.match(/search\s+(?:for\s+)?([a-zA-Z0-9\s_-]{2,30})/i);
      const query = quoted?.[1] || searchWordMatch?.[1]?.trim() || 'overview';

      return {
        originalTask: rawTask,
        inferredGoal: 'SEARCH_ITEM',
        extractedData: {
          searchQuery: query,
          customValue: query,
          intent: 'search'
        },
        milestones: [
          {
            id: 'm1',
            description: `Locate search input box on page`,
            expectedKeywords: ['search', 'find', 'query', 'input'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: `Enter query "${query}" and submit search`,
            expectedKeywords: ['search', 'submit', 'enter'],
            actionType: 'TYPE_DATA',
            completed: false
          },
          {
            id: 'm3',
            description: 'Verify search results and match confidence',
            expectedKeywords: ['results', 'items', 'found'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 5. E-commerce / Add to cart
    if (lower.includes('cart') || lower.includes('add to cart') || lower.includes('buy')) {
      return {
        originalTask: rawTask,
        inferredGoal: 'ADD_TO_CART',
        milestones: [
          {
            id: 'm1',
            description: 'Browse or search for target product',
            expectedKeywords: ['product', 'shop', 'item', 'catalog', 'search'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: 'Select product item',
            expectedKeywords: ['view', 'details', 'product'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm3',
            description: 'Click Add to Cart button',
            expectedKeywords: ['add to cart', 'buy', 'add', 'bag'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Verify cart confirmation or badge update',
            expectedKeywords: ['added', 'cart', 'checkout', 'items'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 6. Exploratory UX evaluation / surfing
    if (
      lower.includes('surf') ||
      lower.includes('explore') ||
      lower.includes('browse') ||
      lower.includes('landing') ||
      lower.includes('evaluat') ||
      lower.includes('navigate')
    ) {
      return {
        originalTask: rawTask,
        inferredGoal: 'EXPLORE_FEATURE',
        milestones: [
          {
            id: 'm1',
            description: 'Open specified product URL in real Playwright Chromium browser',
            expectedKeywords: ['page', 'loaded', 'url', 'opened'],
            actionType: 'NAVIGATE',
            completed: true
          },
          {
            id: 'm2',
            description: 'Scroll viewport to inspect layout and content hierarchy',
            expectedKeywords: ['scroll', 'hero', 'layout'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm3',
            description: 'Interact with relevant navigation link or call-to-action',
            expectedKeywords: ['click', 'nav', 'features', 'pricing', 'more information'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Measure responsiveness, console/network errors, and user friction',
            expectedKeywords: ['response', 'interactivity', 'time', 'metrics'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 7. General adaptive task planning
    const urlMatch = rawTask.match(/https?:\/\/[^\s"',]+/i);
    const tokenMatch = rawTask.match(/\b([A-Z0-9]{6,16})\b/);
    const quotedMatch = rawTask.match(/[`"']([^`"']+)`"'/);

    const customValue = quotedMatch?.[1] || tokenMatch?.[1] || (urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : undefined);

    return {
      originalTask: rawTask,
      inferredGoal: 'GENERAL_TASK',
      extractedData: {
        inputUrl: urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : undefined,
        customValue,
        referenceCode: tokenMatch?.[1]
      },
      milestones: [
        {
          id: 'm1',
          description: 'Identify primary interactive element matching task objective',
          expectedKeywords: ['start', 'try', 'explore', 'get started', 'submit', 'input'],
          actionType: 'LOCATE_INPUT',
          completed: false
        },
        {
          id: 'm2',
          description: 'Execute requested task interaction on live DOM',
          expectedKeywords: ['action', 'submit', 'click', 'enter'],
          actionType: 'SUBMIT',
          completed: false
        },
        {
          id: 'm3',
          description: 'Observe and verify resulting page state',
          expectedKeywords: ['success', 'done', 'result', 'status'],
          actionType: 'VERIFY_RESULT',
          completed: false
        }
      ]
    };
  }
}
