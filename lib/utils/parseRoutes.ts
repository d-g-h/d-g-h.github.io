export type ParsedRouteLine = {
  id: number;
  route: string;
  staging: string;
  waveTime: string;
  dsp: string;
  vehicle: "truck" | "van";
  prefix: string;
};

export function parseRoutes(text: string): ParsedRouteLine[] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line, id) => {
      const parts = line
        .replace(/\u00A0/g, " ")
        .trim()
        .split(/\s+/);
      if (parts.length < 3) return null;
      const [route, staging, wavePart, maybeSuffix, maybeDsp, maybeVehicle] = parts;

      // Support wave times like "07:15", "07:15am", or "07:15 AM" (fourth token consumed as suffix).
      const suffixIsAmPm =
        maybeSuffix?.toLowerCase() === "am" || maybeSuffix?.toLowerCase() === "pm";
      const waveHasSuffix = /[ap]m$/i.test(wavePart);
      const waveTime = suffixIsAmPm && !waveHasSuffix ? `${wavePart} ${maybeSuffix}` : wavePart;

      const dsp = suffixIsAmPm ? maybeDsp : maybeSuffix;
      const vehicleRaw = suffixIsAmPm ? maybeVehicle : maybeDsp;
      return {
        id,
        route,
        staging,
        waveTime,
        dsp: dsp ?? "",
        vehicle: vehicleRaw?.toLowerCase() === "van" ? "van" : "truck",
        prefix: route.match(/^[A-Za-z]+/)?.[0] || "",
      };
    })
    .filter((value): value is ParsedRouteLine => Boolean(value));
}
