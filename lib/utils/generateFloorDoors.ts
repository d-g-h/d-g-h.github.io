import type { DoorBlockRuleMap } from "@/lib/utils/ddDoorRules";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";
import { DEFAULT_DOOR_NUMBERS, getAllowedDoors } from "@/lib/utils/doors";
import { getRoutePrefix } from "@/lib/utils/getRoutePrefix";
import { compareStagingCodes } from "@/lib/utils/stagingCode";
import { waveToMinutes } from "@/lib/utils/waveToMinutes";

export type Route = {
  id: number;
  route: string;
  routeKey?: string;
  staging: string;
  waveTime: string;
  vehicle?: "truck" | "van";
  dsp?: string;
  prefix?: string;
};

export type DoorAssignments = Record<number, (Route | null)[]>;

const WAVE_3_DOORS = [90, 91, 92];

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

function assignWaveBlock(routes: Route[], assignments: DoorAssignments, priority: number[]) {
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

function parseStageIndex(staging: string): number | null {
  const numPart = staging.trim().split(".")[1];
  const stageNum = Number(numPart);
  if (!Number.isFinite(stageNum) || stageNum < 1) return null;
  return stageNum - 1;
}

function assignWaveBlockByStaging(
  routes: Route[],
  assignments: DoorAssignments,
  doorOrder: number[],
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
    const stageIndex = parseStageIndex(route.staging);
    const targetDoor = stageIndex !== null ? doorOrder[stageIndex] : undefined;
    if (targetDoor !== undefined) {
      assignments[targetDoor].push(route);
      continue;
    }

    let bestDoor = doorOrder[0];
    let bestLoad = Infinity;
    for (const d of doorOrder) {
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
  const stagingDoors = doors.slice().sort((a, b) => b - a);
  const doorSet = new Set(doors);
  const wave3Doors = WAVE_3_DOORS.filter((door) => doorSet.has(door));
  const waveTimes = Array.from(new Set(routes.map((r) => safeWaveToMinutes(r.waveTime)))).sort(
    (a, b) => a - b,
  );
  const wave3Minutes = waveTimes.length >= 3 ? waveTimes[2] : null;
  const isWave3 = (route: Route) =>
    wave3Minutes !== null && safeWaveToMinutes(route.waveTime) === wave3Minutes;
  const cpBlocked = new Set(blockRules.CP || []);

  const assignments: DoorAssignments = {};
  for (const d of doors) assignments[d] = [];

  const waves: Record<string, Route[]> = {};
  for (const r of routes) {
    const lane = r.staging.split(".")[0].toUpperCase();
    if (!waves[lane]) waves[lane] = [];
    waves[lane].push(r);
  }

  const isCPPrefix = (r: Route) => getRoutePrefix(r.route) === "CP";

  const F = waves.F || [];
  const I = (waves.I || []).filter((r) => !isCPPrefix(r));
  const C = (waves.C || []).filter((r) => !isCPPrefix(r));
  const G = (waves.G || []).filter((r) => !isCPPrefix(r));
  const CP = (waves.CP || []).concat(routes.filter((r) => isCPPrefix(r)));

  const others = routes.filter((r) => {
    const lane = r.staging.split(".")[0].toUpperCase();
    return !["F", "I", "C", "G"].includes(lane) && getRoutePrefix(r.route) !== "CP";
  });

  assignWaveBlock(
    I.filter((r) => isWave3(r)),
    assignments,
    wave3Doors.length ? wave3Doors : priorityDoors,
  );
  assignWaveBlock(
    I.filter((r) => !isWave3(r)),
    assignments,
    priorityDoors,
  );
  assignWaveBlockByStaging(F, assignments, stagingDoors);
  assignWaveBlock(
    C.filter((r) => isWave3(r)),
    assignments,
    wave3Doors.length ? wave3Doors : priorityDoors,
  );
  assignWaveBlock(
    C.filter((r) => !isWave3(r)),
    assignments,
    priorityDoors,
  );

  assignWaveBlock(
    G.filter((r) => isWave3(r)),
    assignments,
    wave3Doors.length ? wave3Doors : priorityDoors,
  );
  assignWaveBlock(
    G.filter((r) => !isWave3(r)),
    assignments,
    priorityDoors,
  );

  const assignedIds = new Set<number>();
  for (const door of Object.keys(assignments)) {
    for (const route of assignments[Number(door)]) {
      if (route) assignedIds.add(route.id);
    }
  }

  const cpAllowed = getPriorityDoors(
    getAllowedDoors("CP", { doors, blockRules })
      .map(Number)
      .filter((d) => !cpBlocked.has(d)),
  );
  const cpWave3Allowed = wave3Doors.filter((d) => cpAllowed.includes(d));
  for (const r of CP) {
    if (assignedIds.has(r.id)) continue;

    const allowed = isWave3(r) && cpWave3Allowed.length ? cpWave3Allowed : cpAllowed;
    let bestDoor: number | null = null;
    let bestLoad = Infinity;
    for (const d of allowed) {
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
    const wave3Allowed = wave3Doors.filter((d) => allowed.includes(d));
    const sorted = byPrefix[prefix].slice().sort((a, b) => {
      const wa = waveToMinutes(a.waveTime);
      const wb = waveToMinutes(b.waveTime);
      if (wa !== wb) return wa - wb;
      const aNum = Number(a.staging.split(".")[1]);
      const bNum = Number(b.staging.split(".")[1]);
      return aNum - bNum;
    });

    for (const r of sorted) {
      const candidates = isWave3(r) && wave3Allowed.length ? wave3Allowed : allowed;

      let best = candidates[0];
      let bestLoad = Infinity;

      for (const d of candidates) {
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

    const stagingCmp = compareStagingCodes(a.staging, b.staging);
    if (stagingCmp !== 0) return stagingCmp;

    return a.id - b.id;
  };

  for (const door of doors) {
    const sortedRoutes = assignments[door]
      .filter((r): r is Route => r !== null)
      .slice()
      .sort(compareRoutes);
    assignments[door] = sortedRoutes;
  }

  return assignments;
}
