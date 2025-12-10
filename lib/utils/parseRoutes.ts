export type ParsedRouteLine = {
  id: number;
  route: string;
  staging: string;
  waveTime: string;
  dsp: string;
  vehicle: "truck" | "van";
  prefix: string;
};

function defaultVehicleForPrefix(prefix: string): "truck" | "van" {
  const normalized = prefix.trim().toUpperCase();
  if (normalized === "CP") return "van";
  return "truck";
}

function isAmPm(value?: string): boolean {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return lowered === "am" || lowered === "pm";
}

function looksLikeTime(value: string): boolean {
  return /^\d{1,2}:\d{2}(?:[ap]m)?$/i.test(value.trim());
}

function looksLikeStaging(value: string): boolean {
  return /^[A-Za-z]+\.\d+$/.test(value.trim());
}

function parseWaveTime(
  tokens: string[],
  startIndex: number,
): { waveTime: string; nextIndex: number } {
  const wavePart = tokens[startIndex] ?? "";
  const maybeSuffix = tokens[startIndex + 1];
  const suffixIsAmPm = isAmPm(maybeSuffix);
  const waveHasSuffix = /[ap]m$/i.test(wavePart);
  const waveTime = suffixIsAmPm && !waveHasSuffix ? `${wavePart} ${maybeSuffix}` : wavePart;
  const nextIndex = suffixIsAmPm && !waveHasSuffix ? startIndex + 2 : startIndex + 1;
  return { waveTime, nextIndex };
}

export function parseRoutes(text: string): ParsedRouteLine[] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line, id) => {
      const parts = line
        .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .trim()
        .split(/\s+/);
      if (parts.length < 3) return null;

      const hasLeadingDsp =
        parts.length >= 4 &&
        looksLikeStaging(parts[2]) &&
        looksLikeTime(parts[3]) &&
        !(looksLikeStaging(parts[1]) && looksLikeTime(parts[2]));

      const dsp = hasLeadingDsp ? parts[0] : undefined;
      const route = hasLeadingDsp ? parts[1] : parts[0];
      const staging = hasLeadingDsp ? parts[2] : parts[1];
      const { waveTime, nextIndex } = parseWaveTime(parts, hasLeadingDsp ? 3 : 2);

      const trailing = parts.slice(nextIndex);
      const vehicleTokenIndex = trailing.findIndex((token) => {
        const lowered = token.toLowerCase();
        return lowered === "van" || lowered === "truck";
      });
      const vehicleRaw = vehicleTokenIndex >= 0 ? trailing[vehicleTokenIndex] : undefined;
      const trailingWithoutVehicle =
        vehicleTokenIndex >= 0 ? trailing.filter((_, idx) => idx !== vehicleTokenIndex) : trailing;

      const dspValue = dsp ?? trailingWithoutVehicle[0] ?? "";
      const prefix = route.match(/^[A-Za-z]+/)?.[0] || "";
      const vehicleRawLower = vehicleRaw?.toLowerCase();
      const vehicle =
        prefix.toUpperCase() === "CP"
          ? "van"
          : vehicleRawLower === "van"
            ? "van"
            : vehicleRawLower === "truck"
              ? "truck"
              : defaultVehicleForPrefix(prefix);
      return {
        id,
        route,
        staging,
        waveTime,
        dsp: dspValue,
        vehicle,
        prefix,
      };
    })
    .filter((value): value is ParsedRouteLine => Boolean(value));
}
