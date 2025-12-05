import type { Region } from "@/lib/floor";

export type RegionAssignments = Record<string, Partial<Region>>;

export function applyAssignmentsToRegions(
  regions: Region[],
  assignments: RegionAssignments,
): Region[] {
  return regions.map((region) => ({
    ...region,
    ...assignments[region.id],
  }));
}
