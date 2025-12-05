import { DEFAULT_DOOR_NUMBERS } from "./doors";
import { waveToMinutes } from "./waveToMinutes";

export function buildFloorPlan(assignments) {
  return DEFAULT_DOOR_NUMBERS.map((door) => {
    const rows = assignments[door]
      .map((r) => ({
        route: r.route,
        staging: r.staging,
        waveTime: r.waveTime,
      }))
      .sort((a, b) => waveToMinutes(a.waveTime) - waveToMinutes(b.waveTime));

    return { door, rows };
  });
}
