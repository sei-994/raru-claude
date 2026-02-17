// Mulberry32 - simple seeded PRNG
export function createRandom(seed: number) {
  let state = seed | 0;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** Returns float between 0 and 1 */
    float: next,
    /** Returns integer between min (inclusive) and max (inclusive) */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    /** Picks a random element from an array */
    pick: <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)],
    /** Shuffles array (Fisher-Yates) */
    shuffle: <T>(arr: T[]): T[] => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}

/** Create a seed from a date string like "2026-02-17" + optional extra string */
export function dateSeed(date: Date, extra = ""): number {
  const str = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${extra}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}
