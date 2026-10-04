import { ExtractedDocumentContext } from '../../types/document';

/**
 * Deterministic text extractor for PRDs, Product Briefs, and Markdown documents.
 * Extracts problem, target users, solution, assumptions, features, and important claims
 * without requiring external network dependencies.
 */
export function extractContextFromDocumentText(
  rawText: string,
  fileName?: string
): ExtractedDocumentContext {
  const clean = rawText.trim();
  const lines = clean.split(/\r?\n/).map((l) => l.trim());

  let title = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
  let problem = '';
  let targetUsers = '';
  let solution = '';
  const assumptions: string[] = [];
  const features: string[] = [];
  const importantClaims: string[] = [];
  const competitors: string[] = [];
  const userComplaints: string[] = [];

  // 1. Detect title from first heading if present
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      break;
    }
  }

  // 2. Section Header Regexes
  type Section = 'problem' | 'targetUsers' | 'solution' | 'assumptions' | 'features' | 'claims' | 'competitors' | 'complaints' | 'none';
  let currentSection: Section = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const lower = line.toLowerCase();

    // Check for section transitions
    if (/^(?:#+\s*)?(?:the\s+)?problem(?:\s+statement)?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?pain\s+points?(?:\s*:)?$/i.test(line) ||
        lower.startsWith('problem:') || lower.startsWith('core problem:')) {
      currentSection = 'problem';
      const inlineText = line.replace(/^(?:#+\s*)?(?:the\s+)?(?:problem|pain points?)(?:\s+statement)?(?:\s*:)?\s*/i, '').trim();
      if (inlineText) problem += (problem ? ' ' : '') + inlineText;
      continue;
    }

    if (/^(?:#+\s*)?target\s+(?:users?|audience|personas?|customers?)(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?who\s+is\s+this\s+for(?:\s*:)?$/i.test(line) ||
        lower.startsWith('target user:') || lower.startsWith('audience:')) {
      currentSection = 'targetUsers';
      const inlineText = line.replace(/^(?:#+\s*)?(?:target\s+(?:users?|audience|personas?|customers?)|who\s+is\s+this\s+for)(?:\s*:)?\s*/i, '').trim();
      if (inlineText) targetUsers += (targetUsers ? ' ' : '') + inlineText;
      continue;
    }

    if (/^(?:#+\s*)?(?:the\s+)?solution(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?product\s+overview(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?proposed\s+solution(?:\s*:)?$/i.test(line) ||
        lower.startsWith('solution:') || lower.startsWith('overview:')) {
      currentSection = 'solution';
      const inlineText = line.replace(/^(?:#+\s*)?(?:the\s+)?(?:solution|product overview|proposed solution)(?:\s*:)?\s*/i, '').trim();
      if (inlineText) solution += (solution ? ' ' : '') + inlineText;
      continue;
    }

    if (/^(?:#+\s*)?(?:key\s+)?assumptions?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?hypothes(?:is|es)(?:\s*:)?$/i.test(line) ||
        lower.startsWith('assumptions:')) {
      currentSection = 'assumptions';
      continue;
    }

    if (/^(?:#+\s*)?(?:core\s+)?features?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?scope(?:\s+and\s+features)?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?capabilities(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?requirements(?:\s*:)?$/i.test(line) ||
        lower.startsWith('features:')) {
      currentSection = 'features';
      continue;
    }

    if (/^(?:#+\s*)?(?:important\s+)?claims?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?value\s+propositions?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?success\s+metrics?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?goals(?:\s*:)?$/i.test(line) ||
        lower.startsWith('claims:')) {
      currentSection = 'claims';
      continue;
    }

    if (/^(?:#+\s*)?(?:existing\s+)?competitors?(?:\s*(?:and|&)\s*alternatives?)?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?(?:existing\s+)?alternatives?(?:\s*(?:and|&)\s*competitors?)?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?existing\s+(?:solutions?|products?|tools?)(?:\s*:)?$/i.test(line) ||
        lower.startsWith('competitors') || lower.startsWith('alternatives') || lower.startsWith('existing competitors')) {
      currentSection = 'competitors';
      continue;
    }

    if (/^(?:#+\s*)?user\s+(?:complaints?|frustrations?|problems?)(?:\s*(?:and|&)\s*(?:complaints?|frustrations?|problems?))?(?:\s*:)?$/i.test(line) ||
        /^(?:#+\s*)?feedback(?:\s*:)?$/i.test(line) ||
        lower.startsWith('user complaints') || lower.startsWith('complaints:')) {
      currentSection = 'complaints';
      continue;
    }

    // Process bullet or content in active section
    const cleanItem = line.replace(/^[-*•\d.]+\s*/, '').trim();
    if (!cleanItem) continue;

    if (currentSection === 'problem') {
      problem += (problem ? ' ' : '') + cleanItem;
    } else if (currentSection === 'targetUsers') {
      targetUsers += (targetUsers ? ' ' : '') + cleanItem;
    } else if (currentSection === 'solution') {
      solution += (solution ? ' ' : '') + cleanItem;
    } else if (currentSection === 'assumptions') {
      if (cleanItem.length > 5) assumptions.push(cleanItem);
    } else if (currentSection === 'features') {
      if (cleanItem.length > 3) features.push(cleanItem);
    } else if (currentSection === 'claims') {
      if (cleanItem.length > 5) importantClaims.push(cleanItem);
    } else if (currentSection === 'competitors') {
      if (cleanItem.length > 2) competitors.push(cleanItem);
    } else if (currentSection === 'complaints') {
      if (cleanItem.length > 5) userComplaints.push(cleanItem);
    } else if (currentSection === 'none' && !title && line.length < 80 && !line.includes('.')) {
      title = line;
    }
  }

  // Fallbacks if sections were not formatted as explicit headers
  if (!problem) {
    const firstParagraph = lines.slice(0, 5).join(' ').trim();
    problem = firstParagraph.slice(0, 240) || 'Target workflow contains friction and unverified manual overhead.';
  }

  if (!solution) {
    solution = title ? `${title} system` : 'Unified product solution addressing core user workflow friction.';
  }

  if (!targetUsers) {
    if (problem.toLowerCase().includes('freelanc')) targetUsers = 'freelancers & independent contractors';
    else if (problem.toLowerCase().includes('cook') || problem.toLowerCase().includes('meal')) targetUsers = 'home cooks & busy households';
    else if (problem.toLowerCase().includes('developer') || problem.toLowerCase().includes('engineer')) targetUsers = 'software engineers & developers';
    else if (problem.toLowerCase().includes('team')) targetUsers = 'distributed product teams';
    else targetUsers = 'operators and knowledge workers';
  }

  if (assumptions.length === 0) {
    assumptions.push(
      `Users experience severe enough friction in "${problem.slice(0, 60)}" to actively seek an alternative tool.`,
      `Target users (${targetUsers}) will complete onboarding without abandoning due to setup fatigue.`,
      `Users will pay a recurring fee for "${solution.slice(0, 50)}" rather than persisting with manual workarounds.`
    );
  }

  if (features.length === 0) {
    features.push('Autonomous workflow automation', 'Real-time telemetry and validation', 'Distraction-free interface');
  }

  if (importantClaims.length === 0) {
    importantClaims.push(
      `Reduces task completion time and error rates for ${targetUsers}.`,
      'Outperforms existing fragmented alternatives in speed and simplicity.'
    );
  }

  if (!title) {
    title = solution.slice(0, 40) || 'Product Investigation Brief';
  }

  // Synthesize concise 1-sentence prompt for research pipeline queries
  const synthesizedIdea = `${title}: ${solution.slice(0, 100)} for ${targetUsers} to solve ${problem.slice(0, 100)}`.replace(/\s+/g, ' ').trim();

  return {
    title,
    problem,
    targetUsers,
    solution,
    assumptions,
    features,
    importantClaims,
    competitors: competitors.length > 0 ? competitors : undefined,
    userComplaints: userComplaints.length > 0 ? userComplaints : undefined,
    sourceFileName: fileName,
    synthesizedIdea,
    rawTextExcerpt: clean.slice(0, 600),
    extractedAt: new Date().toISOString()
  };
}

/**
 * Extracts plain text from an uploaded file in the browser.
 * Supports .txt, .md, .markdown, .json, and text streams in PDFs.
 */
export async function readUploadedFile(file: File): Promise<{
  text: string;
  base64?: string;
  mimeType: string;
  fileType: 'pdf' | 'md' | 'txt' | 'prd';
}> {
  const name = file.name.toLowerCase();
  const mimeType = file.type || 'text/plain';

  if (name.endsWith('.pdf') || mimeType === 'application/pdf') {
    // Read as Base64 for server-side multimodal Gemini extraction
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Also attempt basic ASCII text stream extraction for offline fallback
    let extractedAscii = '';
    try {
      const latin1 = new TextDecoder('latin1').decode(arrayBuffer);
      // Match text streams within PDF
      const streamMatches = latin1.match(/\(([^()]{3,})\)[\s\S]*?T[jJ]/g);
      if (streamMatches) {
        extractedAscii = streamMatches
          .map((m) => m.replace(/^.*\(/, '').replace(/\)[\s\S]*$/, ''))
          .filter((t) => t.length > 2)
          .join(' ');
      }
    } catch {
      // fallback
    }

    return {
      text: extractedAscii,
      base64,
      mimeType: 'application/pdf',
      fileType: 'pdf'
    };
  }

  // Text / Markdown / PRD files
  const text = await file.text();
  const fileType: 'pdf' | 'md' | 'txt' | 'prd' =
    name.endsWith('.md') || name.endsWith('.markdown')
      ? 'md'
      : name.includes('prd') || name.includes('brief')
      ? 'prd'
      : 'txt';

  return {
    text,
    mimeType: 'text/plain',
    fileType
  };
}

/**
 * Main entry point: extracts structured document context from an uploaded file or text.
 * Calls backend `/api/documents/extract` if available, and gracefully falls back to deterministic extraction.
 */
export async function extractDocumentContext(
  fileOrText: File | string,
  fileName?: string
): Promise<ExtractedDocumentContext> {
  let fileData: { text: string; base64?: string; mimeType: string; fileType: string } | null = null;
  let targetFileName = fileName;

  if (typeof fileOrText === 'string') {
    fileData = {
      text: fileOrText,
      mimeType: 'text/plain',
      fileType: 'txt'
    };
  } else {
    targetFileName = fileOrText.name;
    fileData = await readUploadedFile(fileOrText);
  }

  // Attempt server-side AI extraction via Gemini API proxy endpoint
  try {
    const res = await fetch('/api/documents/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: fileData.text,
        fileBase64: fileData.base64,
        mimeType: fileData.mimeType,
        fileName: targetFileName
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.context) {
        return {
          ...data.context,
          sourceFileName: targetFileName,
          sourceFileType: fileData.fileType as any
        };
      }
    }
  } catch {
    // Graceful fallback to client-side deterministic extraction
  }

  // Deterministic local extraction fallback
  const fallback = extractContextFromDocumentText(fileData.text || targetFileName || '', targetFileName);
  return {
    ...fallback,
    sourceFileName: targetFileName,
    sourceFileType: (fileData?.fileType as any) || 'txt'
  };
}
