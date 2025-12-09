export function waveToMinutes(waveTime: string): number {
  const trimmed = waveTime.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (!match) return Number.NaN;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;

  const suffix = match[3]?.toLowerCase();
  if (suffix === "am" && hours === 12) hours = 0;
  if (suffix === "pm" && hours < 12) hours += 12;

  return hours * 60 + minutes;
}
