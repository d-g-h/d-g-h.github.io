import type { DoorAssignments } from "@/lib/utils/generateFloorDoors";
import { DEFAULT_DOOR_NUMBERS } from "./doors";
import { waveToMinutes } from "./waveToMinutes";

export function buildFloorPlan(assignments: DoorAssignments) {
  return DEFAULT_DOOR_NUMBERS.map((door) => {
    const rows = (assignments[door] || [])
      .filter(
        (r): r is NonNullable<DoorAssignments[number][number]> => r !== null && r !== undefined,
      )
      .map((r) => ({
        route: r.route,
        staging: r.staging,
        waveTime: r.waveTime,
      }))
      .sort((a, b) => waveToMinutes(a.waveTime) - waveToMinutes(b.waveTime));

    return { door, rows };
  });
}
