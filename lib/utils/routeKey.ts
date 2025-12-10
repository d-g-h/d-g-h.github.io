import { waveToMinutes } from "./waveToMinutes";

export const ROUTE_KEY_SEPARATOR = "|";

export function normalizeRouteCode(route: string): string {
  return route.replace(/[^\w]/g, "").toUpperCase();
}

export function normalizeDspCode(dsp?: string): string {
  if (!dsp) return "";
  return dsp.replace(/[^\w]/g, "").toUpperCase();
}

export function normalizeStagingCode(staging?: string): string {
  if (!staging) return "";
  return staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

export function normalizeWaveTime(waveTime?: string): string {
  if (!waveTime) return "";
  const cleaned = waveTime
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  if (!cleaned) return "";

  const minutes = waveToMinutes(cleaned);
  if (!Number.isFinite(minutes)) return cleaned;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getRouteKey(
  route: string,
  dsp?: string,
  staging?: string,
  waveTime?: string,
): string {
  const routeCode = normalizeRouteCode(route);
  const dspCode = normalizeDspCode(dsp);
  const stagingCode = normalizeStagingCode(staging);
  const waveCode = normalizeWaveTime(waveTime);
  if (!routeCode) return "";
  return [dspCode, routeCode, stagingCode, waveCode].join(ROUTE_KEY_SEPARATOR);
}

export function getRouteKeyFromNormalized(
  routeCode: string,
  dspCode?: string,
  stagingCode?: string,
  waveTime?: string,
): string {
  const normalizedRoute = normalizeRouteCode(routeCode);
  const normalizedDsp = normalizeDspCode(dspCode);
  const normalizedStaging = normalizeStagingCode(stagingCode);
  const normalizedWave = normalizeWaveTime(waveTime);
  if (!normalizedRoute) return "";
  return [normalizedDsp, normalizedRoute, normalizedStaging, normalizedWave].join(
    ROUTE_KEY_SEPARATOR,
  );
}

export function isCompositeRouteKey(routeOrKey: string): boolean {
  return routeOrKey.includes(ROUTE_KEY_SEPARATOR);
}
