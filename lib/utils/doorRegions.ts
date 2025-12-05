import type { Region } from "@/lib/floor";
import { FLOOR_PLAN_LEFT_MARGIN } from "@/lib/floorPlan";

export function doorsToRegions(doorNumbers: number[]): Region[] {
  return doorNumbers.map((door, idx) => {
    const startX = FLOOR_PLAN_LEFT_MARGIN + idx * 3;
    return {
      id: `door_${door}`,
      label: String(door),
      type: "door",
      startX,
      startY: 1,
      endX: startX + 1,
      endY: 1,
      color: "oklch(from #6b7280 l c h)",
    };
  });
}
