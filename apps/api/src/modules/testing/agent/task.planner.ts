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
  inferredGoal: 'CREATE_SHORT_LINK' | 'SEARCH_ITEM' | 'ADD_TO_CART' | 'EXPLORE_FEATURE' | 'GENERAL_TASK';
  extractedData?: {
    inputUrl?: string;
    searchQuery?: string;
  };
  milestones: TaskMilestone[];
}

export class TaskPlanner {
  public plan(task: string, initialUrl: string): TaskPlan {
    const lower = task.toLowerCase();

    // 1. Check if task is URL shortener / link generation (e.g. links.et)
    if (lower.includes('short link') || lower.includes('shorten') || lower.includes('create a link') || lower.includes('short url')) {
      // Extract target url if mentioned (e.g. "for https://example.com")
      const urlMatch = task.match(/https?:\/\/[^\s"',]+/i);
      const targetUrl = urlMatch ? urlMatch[0] : 'https://example.com';

      return {
        originalTask: task,
        inferredGoal: 'CREATE_SHORT_LINK',
        extractedData: { inputUrl: targetUrl },
        milestones: [
          {
            id: 'm1',
            description: 'Locate URL input field on page',
            expectedKeywords: ['url', 'link', 'paste', 'http', 'shorten'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm2',
            description: `Enter target URL ("${targetUrl}") into shortener input`,
            expectedKeywords: ['input', 'text'],
            actionType: 'TYPE_DATA',
            completed: false
          },
          {
            id: 'm3',
            description: 'Submit form by clicking Shorten / Cut / Submit or pressing Enter',
            expectedKeywords: ['shorten', 'cut', 'create', 'generate', 'submit', 'arrow', 'go'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Detect generated short link output or copy button',
            expectedKeywords: ['copy', 'copied', 'short', 'result', 'links.et', 'http'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 2. Check if task is general surfing / exploratory UX evaluation
    if (lower.includes('surf') || lower.includes('explore') || lower.includes('browse') || lower.includes('landing') || lower.includes('evaluat')) {
      return {
        originalTask: task,
        inferredGoal: 'EXPLORE_FEATURE',
        milestones: [
          {
            id: 'm1',
            description: 'Open specified product URL via Playwright browser',
            expectedKeywords: ['page', 'loaded', 'url', 'opened'],
            actionType: 'NAVIGATE',
            completed: true
          },
          {
            id: 'm2',
            description: 'Scroll viewport to observe above-the-fold layout and content',
            expectedKeywords: ['scroll', 'hero', 'layout'],
            actionType: 'LOCATE_INPUT',
            completed: false
          },
          {
            id: 'm3',
            description: 'Interact with navigation links to explore product depth',
            expectedKeywords: ['click', 'nav', 'features', 'pricing'],
            actionType: 'SUBMIT',
            completed: false
          },
          {
            id: 'm4',
            description: 'Test interactive responsiveness and detect user friction',
            expectedKeywords: ['response', 'interactivity', 'time', 'metrics'],
            actionType: 'VERIFY_RESULT',
            completed: false
          }
        ]
      };
    }

    // 2. Check if task is e-commerce / add to cart
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

    // 3. General task planning fallback
    return {
      originalTask: task,
      inferredGoal: 'GENERAL_TASK',
      milestones: [
        {
          id: 'm1',
          description: 'Identify primary interactive element on page',
          expectedKeywords: ['start', 'try', 'explore', 'get started', 'submit'],
          actionType: 'LOCATE_INPUT',
          completed: false
        },
        {
          id: 'm2',
          description: 'Execute requested task interaction',
          expectedKeywords: ['action', 'submit', 'click'],
          actionType: 'SUBMIT',
          completed: false
        },
        {
          id: 'm3',
          description: 'Observe and verify task outcome',
          expectedKeywords: ['success', 'done', 'result'],
          actionType: 'VERIFY_RESULT',
          completed: false
        }
      ]
    };
  }
}
