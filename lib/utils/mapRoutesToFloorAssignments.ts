import type { Region } from "@/lib/floor";
import { floorPlanRegions } from "@/lib/floorPlan";
import type { RegionAssignments } from "@/lib/utils/regionAssignments";
import { getRoutePrefix } from "./getRoutePrefix";
import { waveToMinutes } from "./waveToMinutes";

export type ParsedRoute = {
  id: number;
  route: string;
  staging: string;
  waveTime: string;
  dsp?: string;
  vehicle?: "truck" | "van";
};

const isOneBySix = (region: Region) =>
  region.type === "lane" &&
  region.endX - region.startX + 1 === 1 &&
  region.endY - region.startY + 1 === 6;

const isTwoByThree = (region: Region) =>
  region.type === "lane" &&
  region.endX - region.startX + 1 === 2 &&
  region.endY - region.startY + 1 === 3;

const oneBySixSlots = floorPlanRegions
  .filter(isOneBySix)
  .slice()
  .sort((a, b) => (a.startY === b.startY ? a.startX - b.startX : a.startY - b.startY));

const twoByThreeSlots = floorPlanRegions
  .filter(isTwoByThree)
  .slice()
  .sort((a, b) => (a.startY === b.startY ? a.startX - b.startX : a.startY - b.startY));

const safeWaveToMinutes = (wave: string) => {
  const minutes = waveToMinutes(wave);
  return Number.isFinite(minutes) ? minutes : Number.POSITIVE_INFINITY;
};

const sortRoutes = (routes: ParsedRoute[]) =>
  routes.slice().sort((a, b) => {
    const wa = safeWaveToMinutes(a.waveTime);
    const wb = safeWaveToMinutes(b.waveTime);
    if (wa !== wb) return wa - wb;
    const aStageNum = Number(a.staging.split(".")[1]);
    const bStageNum = Number(b.staging.split(".")[1]);
    if (!Number.isNaN(aStageNum) && !Number.isNaN(bStageNum) && aStageNum !== bStageNum) {
      return aStageNum - bStageNum;
    }
    return a.id - b.id;
  });

function assignToSlots(routes: ParsedRoute[], slots: Region[]): RegionAssignments {
  const assignments: RegionAssignments = {};
  const sortedRoutes = sortRoutes(routes);
  const sortedSlots = slots;

  for (let i = 0; i < sortedRoutes.length && i < sortedSlots.length; i += 1) {
    const route = sortedRoutes[i];
    const slot = sortedSlots[i];
    assignments[slot.id] = {
      route: route.route,
      staging: route.staging,
      dsp: route.dsp ?? "",
      waveTime: route.waveTime,
      vehicle: route.vehicle ?? "truck",
      active: true,
    };
  }

  return assignments;
}

export function mapRoutesToFloorAssignments(routes: ParsedRoute[]): RegionAssignments {
  const cpRoutes = routes.filter((route) => getRoutePrefix(route.route).toUpperCase() === "CP");
  const nonCpRoutes = routes.filter((route) => getRoutePrefix(route.route).toUpperCase() !== "CP");

  const assignments: RegionAssignments = {};

  Object.assign(assignments, assignToSlots(cpRoutes, oneBySixSlots));
  Object.assign(assignments, assignToSlots(nonCpRoutes, twoByThreeSlots));

  return assignments;
}
