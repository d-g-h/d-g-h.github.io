import type { Region } from "@/lib/floor";
import { applyFloorRouteOverrides } from "@/lib/utils/applyFloorRouteOverrides";
import type { RegionAssignments } from "@/lib/utils/regionAssignments";

describe("applyFloorRouteOverrides", () => {
  it("swaps with the occupant when moving into a filled slot", () => {
    const regions: Region[] = [
      {
        id: "slot_a",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
      {
        id: "slot_b",
        type: "lane",
        startX: 3,
        startY: 0,
        endX: 4,
        endY: 2,
      },
    ];

    const routes = [
      { route: "XL1", staging: "I.1", waveTime: "08:00", dsp: "MTG", vehicle: "truck" as const },
      { route: "XL2", staging: "I.2", waveTime: "08:45", dsp: "MTG", vehicle: "truck" as const },
    ];

    const autoAssignments: RegionAssignments = {
      slot_a: { route: "XL1", staging: "I.1", dsp: "MTG", waveTime: "08:00", active: true },
      slot_b: { route: "XL2", staging: "I.2", dsp: "MTG", waveTime: "08:45", active: true },
    };

    const applied = applyFloorRouteOverrides(routes, regions, autoAssignments, { XL1: "slot_b" });

    expect(applied.slotToRoute.slot_b).toBe("MTG|XL1|I.1|08:00");
    expect(applied.slotToRoute.slot_a).toBe("MTG|XL2|I.2|08:45");
    expect(applied.normalizedOverrides).toEqual({
      "MTG|XL1|I.1|08:00": "slot_b",
      "MTG|XL2|I.2|08:45": "slot_a",
    });
  });

  it("moves into an empty slot and clears the source slot", () => {
    const regions: Region[] = [
      {
        id: "slot_a",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
      {
        id: "slot_b",
        type: "lane",
        startX: 3,
        startY: 0,
        endX: 4,
        endY: 2,
      },
      {
        id: "slot_c",
        type: "lane",
        startX: 6,
        startY: 0,
        endX: 7,
        endY: 2,
      },
    ];

    const routes = [
      { route: "XL1", staging: "I.1", waveTime: "08:00", dsp: "MTG", vehicle: "truck" as const },
      { route: "XL2", staging: "I.2", waveTime: "08:45", dsp: "MTG", vehicle: "truck" as const },
    ];

    const autoAssignments: RegionAssignments = {
      slot_a: { route: "XL1", staging: "I.1", dsp: "MTG", waveTime: "08:00", active: true },
      slot_b: { route: "XL2", staging: "I.2", dsp: "MTG", waveTime: "08:45", active: true },
    };

    const applied = applyFloorRouteOverrides(routes, regions, autoAssignments, { XL1: "slot_c" });

    expect(applied.slotToRoute.slot_c).toBe("MTG|XL1|I.1|08:00");
    expect(applied.slotToRoute.slot_b).toBe("MTG|XL2|I.2|08:45");
    expect(applied.slotToRoute.slot_a).toBeUndefined();
    expect(applied.normalizedOverrides).toEqual({ "MTG|XL1|I.1|08:00": "slot_c" });
  });

  it("ignores overrides for unknown routes or slots", () => {
    const regions: Region[] = [
      {
        id: "slot_a",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
    ];

    const routes = [
      { route: "XL1", staging: "I.1", waveTime: "08:00", dsp: "MTG", vehicle: "truck" as const },
    ];

    const autoAssignments: RegionAssignments = {
      slot_a: { route: "XL1", staging: "I.1", dsp: "MTG", waveTime: "08:00", active: true },
    };

    const applied = applyFloorRouteOverrides(routes, regions, autoAssignments, {
      XL_UNKNOWN: "slot_a",
      XL1: "slot_missing",
    });

    expect(applied.slotToRoute.slot_a).toBe("MTG|XL1|I.1|08:00");
    expect(applied.normalizedOverrides).toEqual({});
  });

  it("treats routes with hidden characters as the same code (no duplicates)", () => {
    const regions: Region[] = [
      {
        id: "slot_a",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
      {
        id: "slot_b",
        type: "lane",
        startX: 3,
        startY: 0,
        endX: 4,
        endY: 2,
      },
    ];

    const routes = [
      { route: "XL26", staging: "G.1", waveTime: "10:00", dsp: "GALX", vehicle: "truck" as const },
    ];

    const autoAssignments: RegionAssignments = {
      slot_a: { route: "XL26\u200B", staging: "G.1", dsp: "GALX", waveTime: "10:00", active: true },
      slot_b: { route: "XL26", staging: "G.1", dsp: "GALX", waveTime: "10:00", active: true },
    };

    const applied = applyFloorRouteOverrides(routes, regions, autoAssignments, { XL26: "slot_b" });

    const allAssignedRoutes = Object.values(applied.assignments)
      .map((assignment) => assignment.route)
      .filter((value): value is string => Boolean(value));

    expect(new Set(allAssignedRoutes).size).toBe(allAssignedRoutes.length);
  });
});
