// Probe Integration Test Suite
export function validateSearchContract(result: any) {
  if (!result || typeof result !== 'object') {
    throw new Error('Search result must be an object');
  }
  if (!Array.isArray(result.results)) {
    throw new Error('Search result must contain results array');
  }
  return true;
}
