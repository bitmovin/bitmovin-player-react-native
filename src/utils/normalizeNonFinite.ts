export function normalizeNonFinite<T>(input: T): T {
  function walk(v: any): any {
    if (v === 'Infinity') return Infinity;
    if (v === '-Infinity') return -Infinity;
    if (v === 'NaN') return NaN;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) (v as any)[k] = walk((v as any)[k]);
    }
    return v;
  }
  return walk(input);
}
