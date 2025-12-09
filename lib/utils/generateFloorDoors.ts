import type { DoorBlockRuleMap } from "@/lib/utils/ddDoorRules";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";
import { DEFAULT_DOOR_NUMBERS, getAllowedDoors } from "@/lib/utils/doors";
import { getRoutePrefix } from "@/lib/utils/getRoutePrefix";
import { waveToMinutes } from "@/lib/utils/waveToMinutes";

export type Route = {
  id: number;
  route: string;
  staging: string;
  waveTime: string;
  vehicle?: "truck" | "van";
  dsp?: string;
  prefix?: string;
};

export type DoorAssignments = Record<number, (Route | null)[]>;

const DEFAULT_PRIORITY_DOORS = [99, 98, 97, 96, 95, 94, 93, 89, 88, 87, 86, 85, 84, 83, 92, 91, 90];

const safeWaveToMinutes = (wave: string) => {
  const minutes = waveToMinutes(wave);
  return Number.isFinite(minutes) ? minutes : Number.POSITIVE_INFINITY;
};

function getPriorityDoors(doors: number[]): number[] {
  const matchesDefault =
    doors.length === DEFAULT_DOOR_NUMBERS.length &&
    doors.every((value, idx) => value === DEFAULT_DOOR_NUMBERS[idx]);
  if (matchesDefault) {
    const set = new Set(doors);
    return DEFAULT_PRIORITY_DOORS.filter((door) => set.has(door));
  }
  return doors;
}

function assignWaveBlock(
  routes: Route[],
  assignments: Record<number, Route[]>,
  priority: number[],
) {
  if (!routes.length) return;

  const sorted = routes.slice().sort((a, b) => {
    const wa = safeWaveToMinutes(a.waveTime);
    const wb = safeWaveToMinutes(b.waveTime);
    if (wa !== wb) return wa - wb;
    const aNum = Number(a.staging.split(".")[1]);
    const bNum = Number(b.staging.split(".")[1]);
    return aNum - bNum;
  });

  for (const route of sorted) {
    let bestDoor = priority[0];
    let bestLoad = Infinity;
    for (const d of priority) {
      const load = assignments[d].length;
      if (load < bestLoad) {
        bestDoor = d;
        bestLoad = load;
      }
    }
    assignments[bestDoor].push(route);
  }
}

export function generateFloorDoors(
  routes: Route[],
  options?: { doors?: number[]; blockRules?: DoorBlockRuleMap },
): DoorAssignments {
  const doors = options?.doors ?? DEFAULT_DOOR_NUMBERS;
  const blockRules = options?.blockRules ?? DDBLOCKRULES;
  const priorityDoors = getPriorityDoors(doors);
  const cpBlocked = new Set(blockRules.CP || []);

  const assignments: DoorAssignments = {};
  for (const d of doors) assignments[d] = [];

  const waves: Record<string, Route[]> = {};
  for (const r of routes) {
    const lane = r.staging.split(".")[0];
    if (!waves[lane]) waves[lane] = [];
    waves[lane].push(r);
  }

  const isCPPrefix = (r: Route) => getRoutePrefix(r.route) === "CP";

  const F = (waves.F || []).filter((r) => !isCPPrefix(r));
  const I = (waves.I || []).filter((r) => !isCPPrefix(r));
  const C = (waves.C || []).filter((r) => !isCPPrefix(r));
  const G = (waves.G || []).filter((r) => !isCPPrefix(r));
  const CP = (waves.CP || []).concat(routes.filter((r) => isCPPrefix(r)));

  const others = routes.filter(
    (r) =>
      !["F", "I", "C", "G"].includes(r.staging.split(".")[0]) && getRoutePrefix(r.route) !== "CP",
  );

  assignWaveBlock(I, assignments, priorityDoors);
  assignWaveBlock(F, assignments, priorityDoors);
  assignWaveBlock(C, assignments, priorityDoors);
  assignWaveBlock(G, assignments, priorityDoors);

  const assignedIds = new Set<number>();
  for (const door of Object.keys(assignments)) {
    for (const route of assignments[Number(door)]) assignedIds.add(route.id);
  }

  const cpAllowed = getPriorityDoors(
    getAllowedDoors("CP", { doors, blockRules })
      .map(Number)
      .filter((d) => !cpBlocked.has(d)),
  );
  for (const r of CP) {
    if (assignedIds.has(r.id)) continue;

    let bestDoor: number | null = null;
    let bestLoad = Infinity;
    for (const d of cpAllowed) {
      const load = assignments[d].length;
      if (load < bestLoad) {
        bestDoor = d;
        bestLoad = load;
      }
    }

    if (bestDoor !== null) {
      assignments[bestDoor].push(r);
      assignedIds.add(r.id);
    }
  }

  const byPrefix: Record<string, Route[]> = {};
  for (const r of others) {
    const p = getRoutePrefix(r.route);
    if (!byPrefix[p]) byPrefix[p] = [];
    byPrefix[p].push(r);
  }

  for (const prefix in byPrefix) {
    const allowed = getPriorityDoors(getAllowedDoors(prefix, { doors, blockRules }).map(Number));
    const sorted = byPrefix[prefix].slice().sort((a, b) => {
      const wa = waveToMinutes(a.waveTime);
      const wb = waveToMinutes(b.waveTime);
      if (wa !== wb) return wa - wb;
      const aNum = Number(a.staging.split(".")[1]);
      const bNum = Number(b.staging.split(".")[1]);
      return aNum - bNum;
    });

    for (const r of sorted) {
      let best = allowed[0];
      let bestLoad = Infinity;

      for (const d of allowed) {
        const ld = assignments[d].length;
        if (ld < bestLoad) {
          best = d;
          bestLoad = ld;
        }
      }

      assignments[best].push(r);
    }
  }

  const compareRoutes = (a: Route, b: Route) => {
    const wa = safeWaveToMinutes(a.waveTime);
    const wb = safeWaveToMinutes(b.waveTime);
    if (wa !== wb) return wa - wb;

    const aNum = Number(a.staging.split(".")[1]);
    const bNum = Number(b.staging.split(".")[1]);
    if (aNum !== bNum) return aNum - bNum;

    return a.id - b.id;
  };

  for (const door of doors) {
    const sortedRoutes = assignments[door].slice().sort(compareRoutes);
    assignments[door] = sortedRoutes;
  }

  return assignments;
}
