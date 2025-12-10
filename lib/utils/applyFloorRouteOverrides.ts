import type { Region } from "@/lib/floor";
import type { RegionAssignments } from "@/lib/utils/regionAssignments";
import {
  getRouteKeyFromNormalized,
  isCompositeRouteKey,
  normalizeDspCode,
  normalizeRouteCode,
  ROUTE_KEY_SEPARATOR,
} from "@/lib/utils/routeKey";

export type FloorRouteOverrides = Record<string, string>;

type RouteLike = {
  route: string;
  routeKey?: string;
  staging: string;
  waveTime: string;
  dsp?: string;
  vehicle?: "truck" | "van";
};

type AppliedFloorRouteOverrides = {
  assignments: RegionAssignments;
  slotToRoute: Record<string, string>;
  autoSlotByRoute: Record<string, string>;
  normalizedOverrides: FloorRouteOverrides;
};

function normalizeStagingCode(staging: string): string {
  return staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

function getLegacyRouteKey(routeCode: string, dspCode?: string): string {
  const normalizedRoute = normalizeRouteCode(routeCode);
  if (!normalizedRoute) return "";
  const normalizedDsp = normalizeDspCode(dspCode);
  return normalizedDsp
    ? `${normalizedDsp}${ROUTE_KEY_SEPARATOR}${normalizedRoute}`
    : normalizedRoute;
}

export function applyFloorRouteOverrides(
  routes: RouteLike[],
  regions: Region[],
  autoAssignments: RegionAssignments,
  overridesByRoute: FloorRouteOverrides,
): AppliedFloorRouteOverrides {
  const laneIdSet = new Set(
    regions.filter((region) => region.type === "lane").map((region) => region.id),
  );
  const routeByKey = new Map<string, RouteLike & { routeKey: string; routeCode: string }>();
  const routeKeysByCode = new Map<string, string[]>();
  const routeKeysByComposite = new Map<string, string[]>();
  for (const route of routes) {
    const routeCode = normalizeRouteCode(route.route);
    if (!routeCode) continue;
    const dspCode = normalizeDspCode(route.dsp);
    const routeKey = getRouteKeyFromNormalized(routeCode, dspCode, route.staging, route.waveTime);
    if (!routeKey || routeByKey.has(routeKey)) continue;

    routeByKey.set(routeKey, {
      ...route,
      route: routeCode,
      routeCode,
      routeKey,
      staging: normalizeStagingCode(route.staging),
      waveTime: route.waveTime.trim(),
      dsp: dspCode ? dspCode : undefined,
      vehicle: route.vehicle ?? "truck",
    });

    const list = routeKeysByCode.get(routeCode) ?? [];
    list.push(routeKey);
    routeKeysByCode.set(routeCode, list);
    const legacyKey = getLegacyRouteKey(routeCode, dspCode);
    if (legacyKey) {
      const legacyList = routeKeysByComposite.get(legacyKey) ?? [];
      legacyList.push(routeKey);
      routeKeysByComposite.set(legacyKey, legacyList);
    }
  }

  const slotToRoute: Record<string, string> = {};
  const routeToSlot: Record<string, string> = {};
  const autoSlotByRoute: Record<string, string> = {};

  for (const [slotId, assignment] of Object.entries(autoAssignments)) {
    const routeCodeRaw = typeof assignment.route === "string" ? assignment.route : "";
    const dspRaw = typeof assignment.dsp === "string" ? assignment.dsp : "";
    const routeCode = normalizeRouteCode(routeCodeRaw);
    if (!routeCode) continue;
    const dspCode = normalizeDspCode(dspRaw);
    const routeKey = getRouteKeyFromNormalized(
      routeCode,
      dspCode,
      assignment.staging,
      assignment.waveTime,
    );
    if (!routeKey) continue;
    if (routeToSlot[routeKey]) continue;
    slotToRoute[slotId] = routeKey;
    routeToSlot[routeKey] = slotId;
    autoSlotByRoute[routeKey] = slotId;
  }

  for (const [rawRouteCodeOrKey, rawTargetSlotId] of Object.entries(overridesByRoute)) {
    const rawKey = rawRouteCodeOrKey.trim();
    if (!rawKey) continue;

    const routeKey = (() => {
      if (isCompositeRouteKey(rawKey)) {
        const parts = rawKey.split(ROUTE_KEY_SEPARATOR).map((part) => part.trim());
        if (parts.length >= 3) {
          const [dspPart, routePart, stagingPart, ...waveParts] = parts;
          const dspCode = normalizeDspCode(dspPart);
          const routeCode = normalizeRouteCode(routePart);
          const wavePart = waveParts.join(ROUTE_KEY_SEPARATOR);
          return getRouteKeyFromNormalized(routeCode, dspCode, stagingPart, wavePart);
        }

        if (parts.length >= 2) {
          const dspCode = normalizeDspCode(parts[0]);
          const routeCode = normalizeRouteCode(parts[1]);
          const legacyKey = getLegacyRouteKey(routeCode, dspCode);
          if (!legacyKey) return "";
          const matches = routeKeysByComposite.get(legacyKey) ?? [];
          if (matches.length !== 1) return "";
          return matches[0] ?? "";
        }

        return "";
      }

      const routeCode = normalizeRouteCode(rawKey);
      if (!routeCode) return "";
      const matches = routeKeysByCode.get(routeCode) ?? [];
      if (matches.length !== 1) return "";
      return matches[0] ?? "";
    })();

    if (!routeKey) continue;
    const targetSlotId = rawTargetSlotId.trim();
    const sourceSlotId = routeToSlot[routeKey];
    if (!sourceSlotId) continue;
    if (!laneIdSet.has(targetSlotId)) continue;
    if (sourceSlotId === targetSlotId) continue;

    const occupantRoute = slotToRoute[targetSlotId];
    slotToRoute[targetSlotId] = routeKey;
    routeToSlot[routeKey] = targetSlotId;

    if (occupantRoute) {
      slotToRoute[sourceSlotId] = occupantRoute;
      routeToSlot[occupantRoute] = sourceSlotId;
    } else {
      delete slotToRoute[sourceSlotId];
    }
  }

  const normalizedOverrides: FloorRouteOverrides = {};
  for (const [routeKey, slotId] of Object.entries(routeToSlot)) {
    const autoSlot = autoSlotByRoute[routeKey];
    if (autoSlot && autoSlot !== slotId) normalizedOverrides[routeKey] = slotId;
  }

  const assignments: RegionAssignments = {};
  for (const [slotId, routeKey] of Object.entries(slotToRoute)) {
    const route = routeByKey.get(routeKey);
    if (!route) continue;
    assignments[slotId] = {
      route: route.route,
      routeKey: route.routeKey,
      staging: route.staging,
      dsp: route.dsp ?? "",
      waveTime: route.waveTime,
      vehicle: route.vehicle ?? "truck",
      active: true,
    };
  }

  return { assignments, slotToRoute, autoSlotByRoute, normalizedOverrides };
}
