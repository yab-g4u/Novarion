import { LLMProvider } from './types';
import { GeminiLLMProvider } from './geminiProvider';

let activeProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const providerType = (
    process.env.PROBE_LLM_PROVIDER || 
    process.env.LLM_PROVIDER || 
    'gemini'
  ).toLowerCase();

  switch (providerType) {
    case 'gemini':
    default:
      activeProvider = new GeminiLLMProvider();
      break;
  }

  return activeProvider;
}

export function setCustomLLMProvider(provider: LLMProvider): void {
  activeProvider = provider;
}

export function resetLLMProvider(): void {
  activeProvider = null;
}
