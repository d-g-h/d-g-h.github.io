import type { Region } from "@/lib/floor";
import { floorPlanRegions } from "@/lib/floorPlan";
import type { RegionAssignments } from "@/lib/utils/regionAssignments";
import { getRoutePrefix } from "./getRoutePrefix";
import { getRouteKeyFromNormalized, normalizeDspCode, normalizeRouteCode } from "./routeKey";
import { compareStagingCodes } from "./stagingCode";
import { waveToMinutes } from "./waveToMinutes";

export type ParsedRoute = {
  id: number;
  route: string;
  routeKey?: string;
  staging: string;
  waveTime: string;
  dsp?: string;
  vehicle?: "truck" | "van";
};

function normalizeStagingCode(staging: string): string {
  return staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

const isOneBySix = (region: Region) =>
  region.type === "lane" &&
  region.endX - region.startX + 1 === 1 &&
  region.endY - region.startY + 1 === 6;

const isTwoByThree = (region: Region) =>
  region.type === "lane" &&
  region.endX - region.startX + 1 === 2 &&
  region.endY - region.startY + 1 === 3;

const sortSlots = (a: Region, b: Region) =>
  a.startY === b.startY ? a.startX - b.startX : a.startY - b.startY;

function getSlots(regions: Region[]): { oneBySixSlots: Region[]; twoByThreeSlots: Region[] } {
  return {
    oneBySixSlots: regions.filter(isOneBySix).slice().sort(sortSlots),
    twoByThreeSlots: regions.filter(isTwoByThree).slice().sort(sortSlots),
  };
}

type SlotRow = {
  startY: number;
  slots: Region[];
};

function getSlotRows(slots: Region[]): SlotRow[] {
  const rows = new Map<number, Region[]>();
  for (const slot of slots) {
    const row = rows.get(slot.startY);
    if (row) {
      row.push(slot);
    } else {
      rows.set(slot.startY, [slot]);
    }
  }

  return Array.from(rows.entries())
    .map(([startY, rowSlots]) => ({
      startY,
      slots: rowSlots.slice().sort(sortSlots),
    }))
    .sort((a, b) => a.startY - b.startY);
}

const safeWaveToMinutes = (wave: string) => {
  const minutes = waveToMinutes(wave);
  return Number.isFinite(minutes) ? minutes : Number.POSITIVE_INFINITY;
};

const getEarliestWaveTime = (routes: ParsedRoute[]) =>
  routes.reduce((min, route) => Math.min(min, safeWaveToMinutes(route.waveTime)), Infinity);

const sortRoutes = (routes: ParsedRoute[]) =>
  routes.slice().sort((a, b) => {
    const wa = safeWaveToMinutes(a.waveTime);
    const wb = safeWaveToMinutes(b.waveTime);
    if (wa !== wb) return wa - wb;

    const stagingCmp = compareStagingCodes(a.staging, b.staging);
    if (stagingCmp !== 0) return stagingCmp;
    return a.id - b.id;
  });

function parseStageIndex(staging: string): number | null {
  const stageNum = Number(staging.trim().split(".")[1]);
  if (!Number.isFinite(stageNum) || stageNum < 1) return null;
  return stageNum - 1;
}

function routeToAssignment(route: ParsedRoute): Partial<Region> {
  return {
    route: route.route,
    routeKey: getRouteKeyFromNormalized(
      route.route,
      normalizeDspCode(route.dsp),
      route.staging,
      route.waveTime,
    ),
    staging: route.staging,
    dsp: route.dsp ?? "",
    waveTime: route.waveTime,
    vehicle: route.vehicle ?? "truck",
    active: true,
  };
}

function assignSortedRoutesToSlots(
  sortedRoutes: ParsedRoute[],
  slots: Region[],
  usedSlots: Set<string>,
  assignments: RegionAssignments,
): ParsedRoute[] {
  let slotIndex = 0;
  let routeIndex = 0;

  for (; routeIndex < sortedRoutes.length; routeIndex += 1) {
    while (slotIndex < slots.length && usedSlots.has(slots[slotIndex].id)) slotIndex += 1;
    if (slotIndex >= slots.length) break;

    const slot = slots[slotIndex];
    assignments[slot.id] = routeToAssignment(sortedRoutes[routeIndex]);
    usedSlots.add(slot.id);
    slotIndex += 1;
  }

  return sortedRoutes.slice(routeIndex);
}

function assignSequential(
  routes: ParsedRoute[],
  slots: Region[],
  usedSlots: Set<string>,
  assignments: RegionAssignments,
): ParsedRoute[] {
  const sortedRoutes = sortRoutes(routes);
  return assignSortedRoutesToSlots(sortedRoutes, slots, usedSlots, assignments);
}

function assignByStageIndex(
  routes: ParsedRoute[],
  slots: Region[],
  usedSlots: Set<string>,
  assignments: RegionAssignments,
): ParsedRoute[] {
  const unassigned: ParsedRoute[] = [];
  const sortedRoutes = routes.slice().sort((a, b) => {
    const aStage = parseStageIndex(a.staging);
    const bStage = parseStageIndex(b.staging);
    if (aStage !== null && bStage !== null && aStage !== bStage) return aStage - bStage;
    return safeWaveToMinutes(a.waveTime) - safeWaveToMinutes(b.waveTime);
  });

  for (const route of sortedRoutes) {
    const stageIndex = parseStageIndex(route.staging);
    const targetSlot = stageIndex !== null ? slots[stageIndex] : undefined;
    if (targetSlot && !usedSlots.has(targetSlot.id)) {
      assignments[targetSlot.id] = routeToAssignment(route);
      usedSlots.add(targetSlot.id);
      continue;
    }
    unassigned.push(route);
  }

  return assignSequential(unassigned, slots, usedSlots, assignments);
}

export function mapRoutesToFloorAssignments(
  routes: ParsedRoute[],
  regions: Region[] = floorPlanRegions,
): RegionAssignments {
  const seenRoutes = new Set<string>();
  const normalizedRoutes = routes
    .map((route) => {
      const routeCode = normalizeRouteCode(route.route);
      const dspCode = normalizeDspCode(route.dsp);
      return {
        ...route,
        route: routeCode,
        routeKey: getRouteKeyFromNormalized(routeCode, dspCode, route.staging, route.waveTime),
        staging: normalizeStagingCode(route.staging),
        waveTime: route.waveTime.trim(),
        dsp: dspCode ? dspCode : undefined,
      };
    })
    .filter((route) => {
      if (!route.routeKey) return false;
      if (seenRoutes.has(route.routeKey)) return false;
      seenRoutes.add(route.routeKey);
      return true;
    });

  const isCPRoute = (route: ParsedRoute) => getRoutePrefix(route.route).toUpperCase() === "CP";
  const isFStaging = (route: ParsedRoute) => route.staging.trim().toUpperCase().startsWith("F.");
  const isIStaging = (route: ParsedRoute) => route.staging.trim().toUpperCase().startsWith("I.");
  const isMtgDsp = (route: ParsedRoute) => (route.dsp ?? "").trim().toUpperCase() === "MTG";

  const cpRoutes = normalizedRoutes.filter(
    (route) => isCPRoute(route) && !isFStaging(route) && !isMtgDsp(route),
  );
  const nonCpRoutes = normalizedRoutes.filter(
    (route) => !isCPRoute(route) || isFStaging(route) || isMtgDsp(route),
  );

  const { oneBySixSlots, twoByThreeSlots } = getSlots(regions);
  const twoByThreeRows = getSlotRows(twoByThreeSlots);

  const assignments: RegionAssignments = {};

  const usedSlots = new Set<string>();

  assignSequential(cpRoutes, oneBySixSlots, usedSlots, assignments);

  const fRoutes = nonCpRoutes.filter(isFStaging);
  const iRoutes = nonCpRoutes.filter(isIStaging);
  const otherTwoByThreeRoutes = nonCpRoutes.filter(
    (route) => !isFStaging(route) && !isIStaging(route),
  );

  const rowGroups = [
    {
      key: "F",
      routes: fRoutes,
      waveTime: getEarliestWaveTime(fRoutes),
      assignMode: "stage",
    },
    {
      key: "I",
      routes: iRoutes,
      waveTime: getEarliestWaveTime(iRoutes),
      assignMode: "stage",
    },
    {
      key: "OTHER",
      routes: otherTwoByThreeRoutes,
      waveTime: getEarliestWaveTime(otherTwoByThreeRoutes),
      assignMode: "sequential",
    },
  ]
    .filter((group) => group.routes.length)
    .sort((a, b) => {
      if (a.waveTime !== b.waveTime) return a.waveTime - b.waveTime;
      return a.key.localeCompare(b.key);
    });

  const overflowRoutes: ParsedRoute[] = [];

  rowGroups.forEach((group, index) => {
    const rowSlots = twoByThreeRows[index]?.slots ?? [];
    if (group.assignMode === "stage") {
      overflowRoutes.push(...assignByStageIndex(group.routes, rowSlots, usedSlots, assignments));
    } else {
      overflowRoutes.push(...assignSequential(group.routes, rowSlots, usedSlots, assignments));
    }
  });

  const remainingSlots = twoByThreeSlots
    .filter((slot) => !usedSlots.has(slot.id))
    .slice()
    .sort(sortSlots);
  const remainingRoutes = sortRoutes(overflowRoutes);
  assignSortedRoutesToSlots(remainingRoutes, remainingSlots, usedSlots, assignments);

  return assignments;
}
