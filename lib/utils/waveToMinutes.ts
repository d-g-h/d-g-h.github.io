export function waveToMinutes(waveTime: string): number {
  const normalized = waveTime
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "");

  if (!normalized) return Number.NaN;

  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/);
  const compactMatch = match ? null : normalized.match(/^(\d{3,4})(?:\s*(am|pm))?$/);
  if (!match && !compactMatch) return Number.NaN;

  let hours: number;
  let minutes: number;
  let suffix: string | undefined;

  if (match) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
    suffix = match[3]?.toLowerCase();
  } else {
    let digits = compactMatch?.[1] ?? "";
    if (digits.length === 3) digits = `0${digits}`;
    hours = Number(digits.slice(0, 2));
    minutes = Number(digits.slice(2));
    suffix = compactMatch?.[2]?.toLowerCase();
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return Number.NaN;
  if (minutes < 0 || minutes > 59) return Number.NaN;

  if (suffix === "am" || suffix === "pm") {
    if (hours < 1 || hours > 12) return Number.NaN;
    if (suffix === "am" && hours === 12) hours = 0;
    if (suffix === "pm" && hours < 12) hours += 12;
  } else {
    if (hours < 0 || hours > 23) return Number.NaN;
  }

  return hours * 60 + minutes;
}
