/**
 * Generates a statistically plausible synthetic value.
 * For numeric columns: adds Gaussian noise around the original value.
 * For categorical: samples from a frequency distribution (if provided).
 */
export function applySynthetic(
  value: any,
  columnStats?: { mean?: number; stdDev?: number; frequencyMap?: Record<string, number> },
): any {
  if (value === null || value === undefined) return null;

  const numericVal = Number(value);

  // Numeric column
  if (!isNaN(numericVal) && columnStats?.mean !== undefined) {
    const noise = gaussianRandom(0, (columnStats.stdDev || 1) * 0.1);
    return Math.round((numericVal + noise) * 100) / 100;
  }

  // Categorical column with frequency map
  if (columnStats?.frequencyMap) {
    return sampleFromFrequency(columnStats.frequencyMap);
  }

  // Fallback: return a hash-based pseudonym
  return `synthetic_${Math.floor(Math.random() * 10000)}`;
}

function gaussianRandom(mean: number, stdDev: number): number {
  // Box–Muller transform
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function sampleFromFrequency(freqMap: Record<string, number>): string {
  const entries = Object.entries(freqMap);
  const total = entries.reduce((sum, [, cnt]) => sum + cnt, 0);
  let rand = Math.random() * total;
  for (const [key, cnt] of entries) {
    rand -= cnt;
    if (rand <= 0) return key;
  }
  return entries[0]?.[0] || '';
}
