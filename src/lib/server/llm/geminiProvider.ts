import { GoogleGenAI } from '@google/genai';
import { LLMProvider, GenerateOptions } from './types';
import { geminiUsageLimiter } from '../../api/rateLimiter';

export class GeminiLLMProvider implements LLMProvider {
  public readonly name = 'gemini';
  public readonly fastModelName: string;
  public readonly strongModelName: string;
  private readonly ai: GoogleGenAI | null = null;

  constructor() {
    // Read model configurations from environment variables with safe defaults
    this.fastModelName = 
      process.env.PROBE_FAST_MODEL || 
      process.env.FAST_MODEL || 
      'gemini-3.1-flash-lite';

    this.strongModelName = 
      process.env.PROBE_STRONG_MODEL || 
      process.env.STRONG_MODEL || 
      'gemini-3.8-flash';

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  private ensureClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured');
      }
      return new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return this.ai;
  }

  /**
   * Fast Model call (cheap, low-latency, used for classification, query extraction, categorization)
   */
  async callFastModel(prompt: string, options: GenerateOptions = {}): Promise<string> {
    return geminiUsageLimiter.executeWithRateLimit(async () => {
      const ai = this.ensureClient();
      try {
        const response = await ai.models.generateContent({
          model: this.fastModelName,
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.2,
            responseMimeType: options.responseMimeType,
            responseSchema: options.responseSchema,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
          }
        });

        return response.text?.trim() || '';
      } catch (err: any) {
        // If the fast model hits a transient error (e.g. model not found), fallback to standard flash
        if (this.fastModelName !== 'gemini-3.8-flash') {
          console.warn(`[GeminiLLMProvider] Fast model ${this.fastModelName} failed, falling back to gemini-3.8-flash:`, err.message || err);
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction: options.systemInstruction,
              temperature: options.temperature ?? 0.2,
              responseMimeType: options.responseMimeType,
              responseSchema: options.responseSchema,
              maxOutputTokens: options.maxOutputTokens ?? 2048,
            }
          });
          return fallbackRes.text?.trim() || '';
        }
        throw err;
      }
    }, 'fast');
  }

  /**
   * Strong Model call (high reasoning, deep synthesis, used for PRD and pressure testing)
   */
  async callStrongModel(prompt: string, options: GenerateOptions = {}): Promise<string> {
    return geminiUsageLimiter.executeWithRateLimit(async () => {
      const ai = this.ensureClient();
      const response = await ai.models.generateContent({
        model: this.strongModelName,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.4,
          responseMimeType: options.responseMimeType,
          responseSchema: options.responseSchema,
          maxOutputTokens: options.maxOutputTokens ?? 4096,
        }
      });

      return response.text?.trim() || '';
    }, 'strong');
  }

  /**
   * Strong Model streaming call
   */
  async streamStrongModel(
    prompt: string,
    options: GenerateOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    return geminiUsageLimiter.executeWithRateLimit(async () => {
      const ai = this.ensureClient();
      const responseStream = await ai.models.generateContentStream({
        model: this.strongModelName,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.4,
          responseMimeType: options.responseMimeType,
          maxOutputTokens: options.maxOutputTokens ?? 4096,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        if (text) {
          fullText += text;
          if (onChunk) {
            onChunk(text);
          }
        }
      }

      return fullText.trim();
    }, 'strong');
  }
}
