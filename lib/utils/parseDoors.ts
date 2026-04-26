export function parseDoors(input: string): number[] {
  const doorNumbers = input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n > 0);

  return [...new Set(doorNumbers)].sort((a, b) => b - a);
}
