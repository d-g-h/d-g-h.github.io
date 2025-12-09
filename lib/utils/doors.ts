import type { DoorBlockRuleMap } from "@/lib/utils/ddDoorRules";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";

export type DoorMode = "all" | "truck-only" | "closed";

export const DEFAULT_DOOR_NUMBERS = Array.from({ length: 99 - 83 + 1 }, (_, i) => 99 - i);

export function getRoutePrefix(route: string) {
  const clean = route.replace(/[^\w]/g, "");
  return clean.match(/^[A-Za-z]+/)?.[0] || "";
}

export function getAllowedDoors(
  prefix: string,
  options?: { doors?: number[]; blockRules?: DoorBlockRuleMap },
) {
  const doors = options?.doors ?? DEFAULT_DOOR_NUMBERS;
  const blocked = options?.blockRules?.[prefix] ?? DDBLOCKRULES[prefix] ?? [];
  return doors.filter((d) => !blocked.includes(d));
}
