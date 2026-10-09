import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedDocumentContext } from '../../types/document';
import { extractContextFromDocumentText } from '../documents/documentExtractor';
import { geminiUsageLimiter, isGeminiQuotaError } from '../api/rateLimiter';

export async function extractDocumentWithGemini(params: {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedDocumentContext> {
  const { text = '', fileBase64, mimeType, fileName } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || geminiUsageLimiter.isCircuitOpen()) {
    return extractContextFromDocumentText(text, fileName);
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
Analyze this product document (PRD, product brief, specification, or pitch).
Extract and structure the following elements:
1. title: Name of product or feature.
2. problem: The acute user pain point, market problem, or workflow friction being solved.
3. targetUsers: The exact user persona, demographic, or job title who will use this.
4. solution: The core product offering, technology, or mechanism proposed.
5. assumptions: 3 to 6 explicit or implicit assumptions required for this product to succeed (e.g. willingness to pay, user behavior, switching inertia, technical feasibility).
6. features: 3 to 6 core functional features or capabilities described.
7. importantClaims: Key claims, metrics, or performance promises made in the document.
8. competitors: Any mentioned or obvious competing tools, incumbents, or manual workarounds.
9. userComplaints: Existing user complaints or frustrations with the status quo.
10. synthesizedIdea: A concise, punchy 1-sentence product hypothesis summarizing what it is, who it is for, and the primary problem it solves. Suitable for empirical research and pressure-testing.`;

  try {
    let contentsPayload: any;

    if (fileBase64 && mimeType === 'application/pdf') {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: fileBase64
            }
          },
          {
            text: promptText
          }
        ]
      };
    } else {
      contentsPayload = `${promptText}\n\nDOCUMENT CONTENT:\n${text.slice(0, 30000)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
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
      const parsed = JSON.parse(outputText);
      return {
        title: parsed.title || fileName?.replace(/\.[^/.]+$/, '') || 'Product Document',
        problem: parsed.problem,
        targetUsers: parsed.targetUsers,
        solution: parsed.solution,
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
        features: Array.isArray(parsed.features) ? parsed.features : [],
        importantClaims: Array.isArray(parsed.importantClaims) ? parsed.importantClaims : [],
        competitors: Array.isArray(parsed.competitors) ? parsed.competitors : undefined,
        userComplaints: Array.isArray(parsed.userComplaints) ? parsed.userComplaints : undefined,
        synthesizedIdea: parsed.synthesizedIdea || `${parsed.title}: ${parsed.solution} for ${parsed.targetUsers}`,
        sourceFileName: fileName,
        extractedAt: new Date().toISOString()
      };
    }
  } catch (err: any) {
    if (isGeminiQuotaError(err)) {
      geminiUsageLimiter.tripCircuitBreaker(60000);
      console.info('[DocumentService] Gemini API quota reached; using deterministic document extractor.');
    } else {
      console.info('[DocumentService] AI extraction unavailable, using deterministic extractor.');
    }
  }

  // Fallback to deterministic parser
  return extractContextFromDocumentText(text, fileName);
}
