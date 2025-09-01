export function normalizeNonFinite<T>(input: T): T {
  const sentinelPrefix = 'BMP_';
  function walk(v: any): any {
    if (v === `${sentinelPrefix}Infinity`) return Infinity;
    if (v === `${sentinelPrefix}-Infinity`) return -Infinity;
    if (v === `${sentinelPrefix}NaN`) return NaN;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) (v as any)[k] = walk((v as any)[k]);
    }
    return v;
  }
  return walk(input);
}
