export interface SearxngProviderConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export const searxngProvider = {
  name: 'searxng',
  enabled: true
};
