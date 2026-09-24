import { SearchResult } from './types';

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Strip tracking parameters
    const paramsToDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        lower.startsWith('utm_') ||
        lower === 'ref' ||
        lower === 'fbclid' ||
        lower === 'gclid' ||
        lower === 'trk' ||
        lower === 'ocid'
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach(k => url.searchParams.delete(k));

    // Remove hash/fragment
    url.hash = '';

    let clean = url.toString().toLowerCase();
    if (clean.endsWith('?')) clean = clean.slice(0, -1);
    // Remove trailing slash
    if (clean.endsWith('/') && url.pathname !== '/') {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function generateContentFingerprint(title: string, text: string): string {
  const normTitle = title.toLowerCase().replace(/[^\w]/g, '').slice(0, 50);
  const normText = text.toLowerCase().replace(/[^\w]/g, '').slice(0, 100);
  return `${normTitle}::${normText}`;
}

export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const deduplicated: SearchResult[] = [];

  for (const item of results) {
    if (!item.title && !item.text) continue;

    const canonicalUrl = normalizeUrl(item.url);
    if (canonicalUrl && seenUrls.has(canonicalUrl)) {
      continue;
    }

    if (item.id && seenIds.has(item.id)) {
      continue;
    }

    const fingerprint = generateContentFingerprint(item.title, item.text);
    if (fingerprint.length > 10 && seenFingerprints.has(fingerprint)) {
      continue;
    }

    if (canonicalUrl) seenUrls.add(canonicalUrl);
    if (item.id) seenIds.add(item.id);
    if (fingerprint.length > 10) seenFingerprints.add(fingerprint);

    deduplicated.push({
      ...item,
      url: canonicalUrl || item.url
    });
  }

  return deduplicated;
}
