export const MAX_TBA_COUNT = 100;
export const MAX_TBA_LENGTH = 128;

export type ParseBatchTbasResult = {
  values: string[];
  errors: string[];
};

export function parseBatchTbas(input: string): ParseBatchTbasResult {
  const rawLines = input.split(/\r?\n/);
  const values: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  rawLines.forEach((rawLine, index) => {
    const value = rawLine.trim();
    if (!value) return;

    if (value.length > MAX_TBA_LENGTH) {
      errors.push(`Line ${index + 1}: TBA is longer than ${MAX_TBA_LENGTH} characters.`);
      return;
    }

    const key = value.toUpperCase();
    if (seen.has(key)) {
      errors.push(`Line ${index + 1}: duplicate TBA "${value}".`);
      return;
    }

    seen.add(key);
    values.push(value);
  });

  if (values.length > MAX_TBA_COUNT) {
    errors.push(`Paste ${MAX_TBA_COUNT} or fewer TBAs. Found ${values.length}.`);
  }

  if (values.length === 0) {
    errors.push("Paste at least one TBA, one per line.");
  }

  return { values, errors };
}
