import { Assumption, ResearchSourceType } from './types';

export interface AssumptionQueryFamily {
  assumptionId: string;
  sourceType: ResearchSourceType;
  queries: string[];
}

export function generateTargetedQueries(
  assumptions: Assumption[],
  sourceType: ResearchSourceType
): AssumptionQueryFamily[] {
  return assumptions.map((a) => {
    const queries: string[] = [];

    // Use predefined seeds that already inherit the target assumption's entities and keywords
    if (a.querySeeds && a.querySeeds.length > 0) {
      queries.push(...a.querySeeds);
    }

    // Combine assumption entities + keywords for targeted discovery
    const entityTerms = (a.entities || []).slice(0, 3).join(' ');
    const keywordTerms = (a.keywords || []).slice(0, 2).join(' ');
    const coreTerms = `${entityTerms} ${keywordTerms}`.trim();

    if (sourceType === 'scholarxiv') {
      switch (a.category) {
        case 'problem':
        case 'behavior':
          queries.push(`${coreTerms} user behavior empirical study`);
          queries.push(`${coreTerms} friction adoption survey`);
          break;
        case 'willingness_to_pay':
        case 'market':
          queries.push(`${coreTerms} willingness to pay conjoint analysis`);
          queries.push(`${coreTerms} pricing market adoption`);
          break;
        case 'technical':
        case 'solution':
          queries.push(`${coreTerms} algorithmic evaluation benchmark`);
          queries.push(`${coreTerms} user experience evaluation`);
          break;
        default:
          queries.push(`${coreTerms} empirical evaluation`);
      }
    } else if (sourceType === 'reddit') {
      switch (a.category) {
        case 'problem':
          queries.push(`${coreTerms} struggle frustrating`);
          queries.push(`why is ${coreTerms} so hard`);
          break;
        case 'competition':
          queries.push(`${coreTerms} app complaints alternatives`);
          queries.push(`hate ${coreTerms} apps`);
          break;
        case 'willingness_to_pay':
          queries.push(`paying for ${coreTerms} subscription worth it`);
          queries.push(`${coreTerms} price too expensive`);
          break;
        default:
          queries.push(`${coreTerms} discussion feedback`);
      }
    } else if (sourceType === 'x') {
      queries.push(`${coreTerms} problem`);
      queries.push(`${coreTerms} workflow`);
    } else if (sourceType === 'linkedin') {
      queries.push(`${coreTerms} market trends`);
      queries.push(`${coreTerms} consumer behavior`);
    }

    const uniqueQueries = Array.from(new Set(queries)).filter(Boolean).slice(0, 3);

    return {
      assumptionId: a.id,
      sourceType,
      queries: uniqueQueries
    };
  });
}
