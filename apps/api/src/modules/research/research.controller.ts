import { Request, Response } from 'express';
import { SearchRequestSchema } from './research.schema';
import { researchService } from './research.service';

export async function handleSearch(req: Request, res: Response) {
  const parseResult = SearchRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid search request',
      details: parseResult.error.format()
    });
  }

  try {
    const { query, sources, limit } = parseResult.data;
    const searchResponse = await researchService.executeResearch({
      query,
      sources,
      limit
    });

    return res.json(searchResponse);
  } catch (err: any) {
    console.error('[ResearchController Error]:', err);
    return res.status(500).json({
      error: 'Search execution failed',
      message: err.message || 'Internal server error'
    });
  }
}
