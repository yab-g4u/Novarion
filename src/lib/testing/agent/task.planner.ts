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
  };
  milestones: TaskMilestone[];
}

export class TaskPlanner {
  public plan(task: string, _initialUrl: string): TaskPlan {
    const lower = task.toLowerCase();

    // 1. Check if task explicitly involves Google/Gmail authentication or sign-in
    if (
      lower.includes('g4uforlife@gmail.com') ||
      lower.includes('google auth') ||
      lower.includes('sign in with google') ||
      lower.includes('login with google') ||
      (lower.includes('sign in') && lower.includes('google'))
    ) {
      return {
        originalTask: task,
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
            description: 'Initiate Google authentication with g4uforlife@gmail.com',
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

    // 2. Check if task is receipt / transaction verification (e.g., links.et DHV0BHI2GG)
    if (
      lower.includes('verify') &&
      (lower.includes('receipt') || lower.includes('payment') || lower.includes('transaction') || lower.includes('reference') || /[A-Z0-9]{8,14}/.test(task))
    ) {
      const refMatch = task.match(/\b([A-Z0-9]{8,15})\b/);
      const referenceCode = refMatch ? refMatch[1] : 'DHV0BHI2GG';

      return {
        originalTask: task,
        inferredGoal: 'VERIFY_RECEIPT',
        extractedData: { referenceCode, inputUrl: referenceCode },
        milestones: [
          {
            id: 'm1',
            description: 'Locate payment reference or receipt URL input field on page',
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
            description: 'Inspect verification response or error feedback on page',
            expectedKeywords: ['verified', 'receipt', 'error', 'result', 'status'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 3. Check if task is URL shortener / link input
    if (
      lower.includes('short link') ||
      lower.includes('shorten') ||
      lower.includes('create a link') ||
      lower.includes('short url')
    ) {
      const urlMatch = task.match(/https?:\/\/[^\s"',]+/i);
      const targetUrl = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : 'https://example.com';

      return {
        originalTask: task,
        inferredGoal: 'CREATE_SHORT_LINK',
        extractedData: { inputUrl: targetUrl },
        milestones: [
          {
            id: 'm1',
            description: 'Locate URL or primary text input field on page',
            expectedKeywords: ['url', 'link', 'paste', 'http', 'shorten', 'receipt'],
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

    // 4. Check if task is general surfing / exploratory UX evaluation
    if (
      lower.includes('surf') ||
      lower.includes('explore') ||
      lower.includes('browse') ||
      lower.includes('landing') ||
      lower.includes('evaluat') ||
      lower.includes('navigate')
    ) {
      return {
        originalTask: task,
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

    // 5. Check if task is e-commerce / add to cart
    if (lower.includes('cart') || lower.includes('add to cart') || lower.includes('buy')) {
      return {
        originalTask: task,
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

    // 6. General task planning fallback
    const urlMatch = task.match(/https?:\/\/[^\s"',]+/i);
    return {
      originalTask: task,
      inferredGoal: 'GENERAL_TASK',
      extractedData: urlMatch ? { inputUrl: urlMatch[0].replace(/[.,;]+$/, '') } : undefined,
      milestones: [
        {
          id: 'm1',
          description: 'Identify primary interactive element matching task objective',
          expectedKeywords: ['start', 'try', 'explore', 'get started', 'submit'],
          actionType: 'LOCATE_INPUT',
          completed: false
        },
        {
          id: 'm2',
          description: 'Execute requested task interaction on live DOM',
          expectedKeywords: ['action', 'submit', 'click'],
          actionType: 'SUBMIT',
          completed: false
        },
        {
          id: 'm3',
          description: 'Observe and verify resulting page state',
          expectedKeywords: ['success', 'done', 'result'],
          actionType: 'VERIFY_RESULT',
          completed: false
        }
      ]
    };
  }
}
