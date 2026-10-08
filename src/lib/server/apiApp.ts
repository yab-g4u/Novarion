import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import {
  probeResearchRateLimiter,
  geminiApiRateLimiter,
  generalApiRateLimiter,
  geminiUsageLimiter,
} from '../api';
import { getLLMProvider } from './llm/providerRegistry';
import { twoTierResearchEngine } from './llm/twoTierResearchEngine';

const SearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, { message: 'Query must be at least 2 characters long' })
    .max(500, { message: 'Query cannot exceed 500 characters' }),
  sources: z
    .array(z.enum(['reddit', 'x', 'linkedin', 'scholarxiv']))
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional(),
});

const PressureTestRequestSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(3, { message: 'Idea must be at least 3 characters long' })
    .max(50000, { message: 'Idea or document cannot exceed 50,000 characters' }),
  documentContext: z
    .object({
      title: z.string().optional(),
      problem: z.string().optional(),
      targetUsers: z.string().optional(),
      solution: z.string().optional(),
      assumptions: z.array(z.string()).optional(),
      features: z.array(z.string()).optional(),
      importantClaims: z.array(z.string()).optional(),
      competitors: z.array(z.string()).optional(),
      userComplaints: z.array(z.string()).optional(),
      sourceFileName: z.string().optional(),
      sourceFileType: z.string().optional(),
      synthesizedIdea: z.string().optional(),
      rawTextExcerpt: z.string().optional(),
    })
    .optional(),
});

const DocumentExtractRequestSchema = z.object({
  text: z.string().optional(),
  fileBase64: z.string().optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
});

const ResearchAssumptionSchema = z.object({
  assumptionId: z.string().optional().default('A1'),
  assumptionText: z.string().trim().min(3, { message: 'Assumption text must be at least 3 characters' }),
  idea: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(10).optional().default(4),
});

const VoxideRequestSchema = z.object({
  command: z.string().trim().min(2),
  context: z.record(z.string(), z.unknown()).optional(),
});

// In-memory store for API-persisted investigations (supplements Supabase persistence)
const serverInvestigationsById = new Map<string, Record<string, any>>();
const serverInvestigationsByShareId = new Map<string, Record<string, any>>();

export function createApiApp() {
  const app = express();

  // 1. Immediate health endpoints (zero external dependencies, registered first)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'Probe Research Search Engine' });
  });

  // Gemini Live Voice Status endpoint
  app.get('/api/voice/status', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.status(200).json({
      configured: hasKey,
      model: 'gemini-2.0-flash-exp',
      wsPath: '/api/voice/live',
      supportedModalities: ['AUDIO'],
      features: ['continuous_speech', 'barge_in', 'realtime_tools', 'live_transcription'],
    });
  });

  // Supabase Auth Public Configuration endpoint
  app.get('/api/auth/config', (_req: Request, res: Response) => {
    const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const cleanUrl = rawUrl.replace(/\/+(rest|realtime|auth|storage|functions)\/v1(\/.*)?$/i, '').replace(/\/+$/, '');
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY || '';
    res.status(200).json({
      supabaseUrl: cleanUrl,
      supabaseAnonKey: anonKey,
      isConfigured: Boolean(cleanUrl && anonKey),
    });
  });

  // Supabase OAuth Callback Relay (for seamless popup and iframe authentication)
  app.get('/api/auth/callback', (_req: Request, res: Response) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authenticating with Probe...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAFAFA; color: #0A0D14; }
    .card { text-align: center; background: white; padding: 2rem 2.5rem; border-radius: 1.25rem; border: 1px solid #E5E7EB; box-shadow: 0 4px 12px rgba(0,0,0,0.04); max-width: 380px; width: 90%; }
    .spinner { width: 32px; height: 32px; border: 3px solid #E5E7EB; border-top-color: #0A0D14; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.25rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <div style="font-weight: 700; font-size: 16px; letter-spacing: -0.01em;">Authenticating with Probe</div>
    <div style="font-size: 13px; color: #6B7280; margin-top: 6px;">Finalizing secure Google verification...</div>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash || '';
        var search = window.location.search || '';
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'PROBE_SUPABASE_AUTH_CALLBACK',
            hash: hash,
            search: search,
            href: window.location.href
          }, '*');
          setTimeout(function() { window.close(); }, 600);
        } else {
          // Direct navigation: redirect into workspace preserving tokens/codes
          window.location.replace('/app' + (hash || search || ''));
        }
      } catch (err) {
        window.location.replace('/app');
      }
    })();
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Global rate limiter for API endpoints
  app.use('/api', generalApiRateLimiter.middleware);

  // REST API: GET /api/investigations (User isolated conversation memory)
  app.get('/api/investigations', (req: Request, res: Response) => {
    const userId = req.query.userId ? String(req.query.userId).trim() : null;
    let list = Array.from(serverInvestigationsById.values());
    if (userId) {
      list = list.filter((inv: any) => inv.userId === userId);
    } else {
      list = list.filter((inv: any) => !inv.userId || inv.userId === 'user_founder' || inv.userId === 'guest');
    }
    return res.status(200).json({ investigations: list });
  });

  // REST API: POST /api/investigations (Save & sync investigation + chat history)
  app.post('/api/investigations', async (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid investigation payload' });
    }

    const inv = body.investigation && typeof body.investigation === 'object' ? body.investigation : body;
    const id = String(inv.id || inv.roomId || '').trim();
    const shareId = String(inv.shareId || body.shareId || '').trim();
    const userId = body.userId || inv.userId || null;

    if (!id && !shareId) {
      return res.status(400).json({ error: 'Investigation id or shareId is required' });
    }

    const record = {
      ...inv,
      id: id || shareId,
      roomId: id || shareId,
      shareId: shareId || inv.shareId || id,
      userId,
      updatedAt: Date.now(),
    };

    if (record.id) {
      serverInvestigationsById.set(record.id, record);
    }
    if (record.shareId) {
      serverInvestigationsByShareId.set(record.shareId, record);
    }

    // Persist to Supabase if available
    try {
      const { getSupabaseClient } = await import('../supabase');
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('investigations').upsert({
          id: record.id,
          title: record.title || 'Investigation',
          query: record.query || '',
          user_id: userId,
          data: record,
          updated_at: new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }

    return res.status(200).json({
      status: 'ok',
      investigation: record,
    });
  });

  // REST API: GET /api/investigations/:id
  app.get('/api/investigations/:id', async (req: Request, res: Response) => {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Investigation identifier is required' });
    }

    const existing =
      serverInvestigationsById.get(rawId) ||
      serverInvestigationsByShareId.get(rawId);

    if (existing) {
      return res.status(200).json({
        status: 'READY',
        investigation: existing,
      });
    }

    // If rawId is a valid opaque shareId (`share_...`) with an embedded query or in Supabase, resolve it
    if (rawId.startsWith('share_')) {
      try {
        const { resolveSharedInvestigationFromSupabase } = await import(
          '../collaboration/investigationStore'
        );
        const resolved = await resolveSharedInvestigationFromSupabase(rawId);
        if (resolved.status === 'READY' && resolved.investigation) {
          serverInvestigationsById.set(resolved.investigation.id, resolved.investigation);
          serverInvestigationsByShareId.set(rawId, resolved.investigation);
          return res.status(200).json({
            status: 'READY',
            investigation: resolved.investigation,
            share: resolved.shareRecord,
          });
        }
        if (resolved.status === 'REVOKED') {
          return res.status(410).json({
            status: 'REVOKED',
            error: 'This shared investigation link is no longer available.',
          });
        }
      } catch {
        // ignore and return 404 below
      }
    }

    return res.status(404).json({
      status: 'NOT_FOUND',
      error: 'Investigation not found',
      id: rawId,
    });
  });

  // REST API: PATCH /api/investigations/:id
  app.patch('/api/investigations/:id', (req: Request, res: Response) => {
    const rawId = String(req.params.id || '').trim();
    const existing =
      serverInvestigationsById.get(rawId) ||
      serverInvestigationsByShareId.get(rawId);

    if (!existing) {
      return res.status(404).json({ error: 'Investigation not found', id: rawId });
    }

    const updated = {
      ...existing,
      ...(req.body || {}),
      id: existing.id,
      shareId: existing.shareId,
      updatedAt: Date.now(),
    };

    serverInvestigationsById.set(updated.id, updated);
    if (updated.shareId) {
      serverInvestigationsByShareId.set(updated.shareId, updated);
    }

    return res.status(200).json({
      status: 'ok',
      investigation: updated,
    });
  });

  // REST API: POST /api/search (lazy-loads searchService on request)
  app.post('/api/search', async (req: Request, res: Response) => {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid search request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { searchService } = await import('../search/search-service');
      const { query, sources, limit } = parseResult.data;
      const searchResponse = await searchService.executeSearch({
        query,
        sources,
        limit,
      });
      return res.json(searchResponse);
    } catch (err: any) {
      console.error('[API /api/search Error]:', err);
      return res.status(500).json({
        error: 'Search execution failed',
        message: err.message || 'Internal server error',
      });
    }
  });

  // REST API: POST /api/documents/extract (Extracts context from PDF / PRD / brief)
  app.post('/api/documents/extract', geminiApiRateLimiter.middleware, async (req: Request, res: Response) => {
    const parseResult = DocumentExtractRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid document extraction request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { extractDocumentWithGemini } = await import('./documentService');
      const context = await extractDocumentWithGemini(parseResult.data);
      return res.status(200).json({
        status: 'ok',
        context,
      });
    } catch (err: any) {
      console.error('[API /api/documents/extract Error]:', err);
      return res.status(500).json({
        error: 'Document extraction failed',
        message: err.message || 'Internal server error',
      });
    }
  });

  // REST API: POST /api/pressure-test (lazy-loads pressureTestPipeline on request)
  app.post('/api/pressure-test', geminiApiRateLimiter.middleware, async (req: Request, res: Response) => {
    const parseResult = PressureTestRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid pressure-test request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { pressureTestPipeline } = await import('../research/pipeline');
      const { idea, documentContext } = parseResult.data;
      const result = await pressureTestPipeline.executePressureTest(idea, documentContext as any);
      return res.json(result);
    } catch (err: any) {
      console.error('[API /api/pressure-test Error]:', err);
      return res.status(500).json({
        error: 'Pressure-test pipeline failed',
        message: err.message || 'Internal server error',
      });
    }
  });

  // REST API: GET /api/llm/config (Inspect two-tier model configuration and rate limits)
  app.get('/api/llm/config', (_req: Request, res: Response) => {
    const provider = getLLMProvider();
    return res.status(200).json({
      provider: provider.name,
      fastModel: provider.fastModelName,
      strongModel: provider.strongModelName,
      architecture: 'two-tier',
      tierBreakdown: {
        fastTier: {
          model: provider.fastModelName,
          responsibilities: [
            'request classification',
            'assumption extraction',
            'search-query generation',
            'competitor detection',
            'evidence categorization'
          ]
        },
        strongTier: {
          model: provider.strongModelName,
          responsibilities: [
            'evidence synthesis',
            'challenging/disproving the idea',
            'insight generation',
            'final recommendation + detailed PRD'
          ]
        }
      },
      rateLimits: {
        researchLimit: {
          maxRequestsPerMinute: probeResearchRateLimiter.max,
          maxConcurrent: probeResearchRateLimiter.maxConcurrent,
        },
        geminiInferenceLimit: {
          maxRequestsPerMinute: geminiApiRateLimiter.max,
          maxConcurrent: geminiApiRateLimiter.maxConcurrent,
        },
        generalApiLimit: {
          maxRequestsPerMinute: generalApiRateLimiter.max,
          maxConcurrent: generalApiRateLimiter.maxConcurrent,
        },
        currentUsage: geminiUsageLimiter.getUsageStats(),
      }
    });
  });

  // REST API: POST /api/research/stream (Server-Sent Events: Two-tier LLM research pipeline with live progress)
  app.post('/api/research/stream', probeResearchRateLimiter.middleware, async (req: Request, res: Response) => {
    const body = req.body || {};
    const query = String(body.query || body.idea || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query or idea is required' });
    }

    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('init', {
        status: 'started',
        query,
        timestamp: Date.now()
      });

      const result = await twoTierResearchEngine.executeInvestigation({
        query,
        documentContext: body.documentContext,
        previousMessages: body.previousMessages,
        existingRecord: body.existingRecord,
        onProgress: (progressEvent) => {
          sendEvent('progress', progressEvent);
        }
      });

      sendEvent('complete', {
        status: 'ok',
        result
      });
      res.end();
    } catch (err: any) {
      console.error('[API /api/research/stream Error]:', err);
      sendEvent('error', {
        error: 'Investigation pipeline failed',
        message: err.message || 'Internal server error'
      });
      res.end();
    }
  });

  // REST API: POST /api/research/synthesize (Two-tier LLM Research Engine with Rate Limiting)
  app.post('/api/research/synthesize', probeResearchRateLimiter.middleware, async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const query = String(body.query || body.idea || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Query or idea is required' });
      }

      const result = await twoTierResearchEngine.executeInvestigation({
        query,
        documentContext: body.documentContext,
        previousMessages: body.previousMessages,
        existingRecord: body.existingRecord
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[API /api/research/synthesize Error]:', err);
      return res.status(500).json({
        error: 'Research synthesis failed',
        message: err.message || 'Internal server error'
      });
    }
  });

  // REST API: POST /api/research/assumption (Researches an assumption via ScholarXIV)
  app.post(['/api/research/assumption', '/api/scholarxiv/research-assumption'], geminiApiRateLimiter.middleware, async (req: Request, res: Response) => {
    const parseResult = ResearchAssumptionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid research assumption request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { scholarXIVService } = await import('./integrations/scholarxiv');
      const { assumptionId, assumptionText, idea, forceRefresh, limit } = parseResult.data;
      const result = await scholarXIVService.researchAssumption({
        assumptionId,
        assumptionText,
        idea,
        forceRefresh,
        limit,
      });
      return res.json(result);
    } catch (err: any) {
      console.error('[API /api/research/assumption Error]:', err);
      return res.status(500).json({
        status: 'unavailable',
        error: 'Academic research is temporarily unavailable.',
        message: 'Academic research is temporarily unavailable.',
      });
    }
  });

  // REST API: POST /api/voxide (Deterministic Voice Intent Mapper)
  app.post('/api/voxide', async (req: Request, res: Response) => {
    const parseResult = VoxideRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid voice intent command' });
    }

    const { command } = parseResult.data;
    const lower = command.toLowerCase();

    let intent = 'UNKNOWN';
    let target = 'all';

    if (
      lower.includes('willingness to pay') ||
      lower.includes('willingness-to-pay') ||
      lower.includes('pricing') ||
      lower.includes('pay')
    ) {
      intent = 'FOCUS_ASSUMPTION';
      target = 'willingness_to_pay';
    } else if (lower.includes('against') || lower.includes('challeng') || lower.includes('counter')) {
      intent = 'FILTER_STANCE';
      target = 'CHALLENGES';
    } else if (lower.includes('scholar') || lower.includes('paper') || lower.includes('academic')) {
      intent = 'FILTER_SOURCE';
      target = 'scholarxiv';
    } else if (lower.includes('product test') || lower.includes('run test') || lower.includes('simulate')) {
      intent = 'EXECUTE_PRODUCT_TEST';
      target = 'links.et';
    } else if (lower.includes('why') || lower.includes('explain')) {
      intent = 'EXPLAIN_CONTRADICTION';
      target = 'contradictions';
    } else if (lower.includes('independent') || lower.includes('unique')) {
      intent = 'SHOW_INDEPENDENT_CLUSTERS';
      target = 'clusters';
    }

    return res.json({
      command,
      matchedIntent: intent,
      targetAction: target,
      status: 'executed',
    });
  });

  // Voxide SDK HTTP relay for preview environments (*.run.app) whose ephemeral origin is not in the production domain lock
  app.all(['/api/sdk/:endpoint', '/api/voxide/sdk/:endpoint'], async (req: Request, res: Response) => {
    const endpoint = String(req.params.endpoint || '').trim();
    if (!['init', 'manifest', 'feedback', 'live'].includes(endpoint)) {
      return res.status(404).json({ error: 'Unknown Voxide SDK endpoint' });
    }

    try {
      const targetUrl = `https://voxide.onrender.com/api/sdk/${endpoint}`;
      const headers: Record<string, string> = {
        Origin: 'https://novarion.ethiodeploy.com',
      };
      if (req.headers.authorization) {
        headers.Authorization = String(req.headers.authorization);
      }
      if (req.headers['content-type']) {
        headers['Content-Type'] = String(req.headers['content-type']);
      }

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body:
          req.method !== 'GET' && req.method !== 'HEAD' && req.body
            ? JSON.stringify(req.body)
            : undefined,
      });

      const contentType = upstreamRes.headers.get('content-type') || 'application/json';
      const text = await upstreamRes.text();
      res.status(upstreamRes.status).type(contentType).send(text);
    } catch (err: any) {
      res.status(502).json({
        error: 'Voxide upstream relay failed',
        message: err?.message || 'Upstream connection error',
      });
    }
  });

  // Mount Product Testing Subsystem routes lazily so Playwright is NEVER loaded at server startup
  let cachedTestingRouter: express.Router | null = null;
  app.use('/api/testing', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!cachedTestingRouter) {
        const mod = await import('../testing/testing.controller');
        cachedTestingRouter = mod.testingRouter;
      }
      return cachedTestingRouter(req, res, next);
    } catch (err: any) {
      console.error('[API /api/testing Error]:', err);
      return res.status(500).json({
        error: 'Product testing subsystem error',
        message: err.message || 'Internal server error',
      });
    }
  });

  // Catch-all for any unmatched /api/* route so it never falls through to SPA index.html
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'API route not found',
      path: req.originalUrl,
    });
  });

  return app;
}
