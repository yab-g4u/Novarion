import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedDocumentContext } from '../../types/document';
import { extractContextFromDocumentText } from '../documents/documentExtractor';
import { geminiUsageLimiter, isGeminiQuotaError } from '../api/rateLimiter';

/**
 * Robust multi-encoding byte decoder supporting UTF-8 (with/without BOM),
 * UTF-16LE, UTF-16BE, Windows-1252, and ISO-8859-1.
 */
export function decodeTextBuffer(buffer: ArrayBuffer | Uint8Array | Buffer): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Detect UTF-8 BOM (0xEF, 0xBB, 0xBF)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }

  // 2. Detect UTF-16 LE BOM (0xFF, 0xFE)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  }

  // 3. Detect UTF-16 BE BOM (0xFE, 0xFF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  }

  // 4. Try strict UTF-8
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // 5. Fallback to windows-1252 / latin-1
    try {
      return new TextDecoder('windows-1252').decode(bytes);
    } catch {
      return new TextDecoder('iso-8859-1').decode(bytes);
    }
  }
}

/**
 * Extracts raw structured text from an uploaded file Buffer / Base64.
 * Uses `pdf-parse` for PDFs, `mammoth` for DOCX (preserving headings, lists, tables),
 * and `decodeTextBuffer` for TXT/MD/PRD.
 */
export async function parseDocumentFile(params: {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<{
  text: string;
  fullText: string;
  pageCount?: number;
  charCount: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'prd';
}> {
  const { text = '', fileBase64, mimeType = '', fileName = '' } = params;
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  // If binary Base64 payload provided
  if (fileBase64) {
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length === 0) {
      throw new Error(`The uploaded file "${fileName || 'attachment'}" is completely empty (0 bytes).`);
    }

    // 1. PDF Parsing
    if (lowerName.endsWith('.pdf') || lowerMime === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const parseResult = await parser.getText();
        await parser.destroy();

        const pages = parseResult.pages || [];
        const pageCount = pages.length || parseResult.total || 1;
        let formattedText = '';

        for (const p of pages) {
          const pageStr = p.text ? p.text.trim() : '';
          if (pageStr) {
            formattedText += (formattedText ? `\n\n--- Page ${p.num || ''} ---\n\n` : '') + pageStr;
          }
        }

        if (!formattedText && parseResult.text) {
          formattedText = parseResult.text.trim();
        }

        if (!formattedText || formattedText.length < 5) {
          throw new Error(`PDF "${fileName}" contains no extractable text layer (it may be a scanned image-only PDF or password protected).`);
        }

        return {
          text: formattedText,
          fullText: formattedText,
          pageCount,
          charCount: formattedText.length,
          fileType: 'pdf'
        };
      } catch (err: any) {
        if (err?.message?.includes('password') || err?.name === 'PasswordException') {
          throw new Error(`PDF "${fileName}" is password protected and cannot be read.`);
        }
        throw new Error(err.message || `Failed to extract text from PDF "${fileName}".`);
      }
    }

    // 2. DOCX Parsing (Word Document)
    if (
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc') ||
      lowerMime.includes('wordprocessingml') ||
      lowerMime.includes('msword')
    ) {
      try {
        const mammoth: any = await import('mammoth');
        let extractedMarkdown = '';

        // Attempt markdown conversion first to preserve headings, tables, bullet lists
        if (typeof mammoth.convertToMarkdown === 'function') {
          try {
            const mdResult = await mammoth.convertToMarkdown({ buffer });
            extractedMarkdown = mdResult?.value ? mdResult.value.trim() : '';
          } catch (convErr: any) {
            console.warn('[DocumentService] mammoth convertToMarkdown warning:', convErr.message);
          }
        }

        // Fallback to raw text if markdown output is empty
        if (!extractedMarkdown && typeof mammoth.extractRawText === 'function') {
          const rawResult = await mammoth.extractRawText({ buffer });
          extractedMarkdown = rawResult?.value ? rawResult.value.trim() : '';
        }

        if (!extractedMarkdown || extractedMarkdown.length < 5) {
          throw new Error(`Word document "${fileName}" contains no readable text or is corrupted.`);
        }

        return {
          text: extractedMarkdown,
          fullText: extractedMarkdown,
          charCount: extractedMarkdown.length,
          fileType: 'docx'
        };
      } catch (err: any) {
        throw new Error(err.message || `Failed to extract text from Word document "${fileName}".`);
      }
    }

    // 3. Text / Markdown / PRD with multi-encoding support
    const decoded = decodeTextBuffer(buffer).trim();
    if (!decoded || decoded.length === 0) {
      throw new Error(`Text document "${fileName}" is empty or could not be decoded.`);
    }

    const fileType = lowerName.endsWith('.md') || lowerName.endsWith('.markdown')
      ? 'md'
      : lowerName.includes('prd') || lowerName.includes('brief')
      ? 'prd'
      : 'txt';

    return {
      text: decoded,
      fullText: decoded,
      charCount: decoded.length,
      fileType
    };
  }

  // If raw text was provided directly
  const cleanText = text.trim();
  if (!cleanText || cleanText.length === 0) {
    throw new Error(`No document text was provided to extract.`);
  }

  return {
    text: cleanText,
    fullText: cleanText,
    charCount: cleanText.length,
    fileType: 'txt'
  };
}

export async function extractDocumentWithGemini(params: {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedDocumentContext> {
  const { fileName } = params;

  // Step 1: Parse the file accurately using specialized parsers (pdf-parse, mammoth, decodeTextBuffer)
  const parsed = await parseDocumentFile(params);
  const { fullText, pageCount, charCount, fileType } = parsed;

  const apiKey = process.env.GEMINI_API_KEY;

  // If Gemini API is not configured or rate limited, fall back to deterministic extraction
  if (!apiKey || geminiUsageLimiter.isCircuitOpen()) {
    const local = extractContextFromDocumentText(fullText, fileName);
    return {
      ...local,
      fullText,
      pageCount,
      charCount,
      sourceFileName: fileName,
      sourceFileType: fileType as any
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const promptText = `You are Probe's Document Extraction Engine.
Analyze this uploaded specification / PRD / product document carefully.
Preserve exact user intentions, problem definitions, target segments, and architectural constraints.
Extract and structure the following elements:
1. title: Clear product, feature, or document title.
2. problem: The acute user pain point, market problem, or workflow friction being solved.
3. targetUsers: The exact user persona, demographic, or job title who will use this.
4. solution: The core product offering, technology, or mechanism proposed.
5. assumptions: 3 to 6 explicit or implicit assumptions required for this product to succeed.
6. features: 3 to 6 core functional features or capabilities described in the document.
7. importantClaims: Key claims, metrics, or performance promises made in the document.
8. competitors: Any mentioned or obvious competing tools, incumbents, or manual workarounds.
9. userComplaints: Existing user complaints or frustrations with the status quo.
10. synthesizedIdea: A concise, punchy 1-sentence product hypothesis summarizing what it is, who it is for, and the primary problem it solves. Suitable for empirical research and pressure-testing.`;

  try {
    // Send safe excerpt for LLM structured extraction (up to 40,000 characters to prevent token limits)
    const payloadText = `${promptText}\n\n=== DOCUMENT CONTENT (${fileName || 'Uploaded Specification'}):\n${fullText.slice(0, 40000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: payloadText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            problem: { type: Type.STRING },
            targetUsers: { type: Type.STRING },
            solution: { type: Type.STRING },
            assumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            importantClaims: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            competitors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            userComplaints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            synthesizedIdea: { type: Type.STRING }
          },
          required: [
            'title',
            'problem',
            'targetUsers',
            'solution',
            'assumptions',
            'features',
            'importantClaims',
            'synthesizedIdea'
          ]
        },
        temperature: 0.1
      }
    });

    const outputText = response.text?.trim();
    if (outputText) {
      const p = JSON.parse(outputText);
      return {
        title: p.title || fileName?.replace(/\.[^/.]+$/, '') || 'Product Document',
        problem: p.problem,
        targetUsers: p.targetUsers,
        solution: p.solution,
        assumptions: Array.isArray(p.assumptions) ? p.assumptions : [],
        features: Array.isArray(p.features) ? p.features : [],
        importantClaims: Array.isArray(p.importantClaims) ? p.importantClaims : [],
        competitors: Array.isArray(p.competitors) ? p.competitors : undefined,
        userComplaints: Array.isArray(p.userComplaints) ? p.userComplaints : undefined,
        synthesizedIdea: p.synthesizedIdea || `${p.title}: ${p.solution} for ${p.targetUsers}`,
        sourceFileName: fileName,
        sourceFileType: fileType as any,
        fullText,
        pageCount,
        charCount,
        rawTextExcerpt: fullText.slice(0, 1000),
        extractedAt: new Date().toISOString()
      };
    }
  } catch (err: any) {
    if (isGeminiQuotaError(err)) {
      geminiUsageLimiter.tripCircuitBreaker(60000);
      console.info('[DocumentService] Gemini API quota reached; using deterministic document extractor.');
    } else {
      console.info('[DocumentService] AI structured extraction error; falling back to deterministic extractor:', err.message);
    }
  }

  // Fallback to deterministic parser with real extracted text
  const fallback = extractContextFromDocumentText(fullText, fileName);
  return {
    ...fallback,
    fullText,
    pageCount,
    charCount,
    sourceFileName: fileName,
    sourceFileType: fileType as any
  };
}
