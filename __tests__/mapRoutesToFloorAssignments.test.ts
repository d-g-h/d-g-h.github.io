import type { Region } from "@/lib/floor";
import {
  mapRoutesToFloorAssignments,
  type ParsedRoute,
} from "@/lib/utils/mapRoutesToFloorAssignments";

describe("mapRoutesToFloorAssignments", () => {
  it("maps earlier waveTime groups to the closest row", () => {
    const regions: Region[] = [
      {
        id: "door_99",
        label: "99",
        type: "door",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 0,
      },
      {
        id: "door_98",
        label: "98",
        type: "door",
        startX: 3,
        startY: 0,
        endX: 4,
        endY: 0,
      },
      {
        id: "slot_2x3_99",
        type: "lane",
        startX: 0,
        startY: 1,
        endX: 1,
        endY: 3,
      },
      {
        id: "slot_2x3_98",
        type: "lane",
        startX: 3,
        startY: 1,
        endX: 4,
        endY: 3,
      },
      {
        id: "slot_2x3_97",
        type: "lane",
        startX: 0,
        startY: 5,
        endX: 1,
        endY: 7,
      },
      {
        id: "slot_2x3_96",
        type: "lane",
        startX: 3,
        startY: 5,
        endX: 4,
        endY: 7,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "XL10",
        staging: "I.1",
        waveTime: "08:00",
        dsp: "MTG",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "XL11",
        staging: "I.2",
        waveTime: "08:00",
        dsp: "MTG",
        vehicle: "truck",
      },
      {
        id: 2,
        route: "XL19",
        staging: "F.1",
        waveTime: "08:45",
        dsp: "JUTL",
        vehicle: "truck",
      },
      {
        id: 3,
        route: "XL20",
        staging: "F.2",
        waveTime: "08:45",
        dsp: "JUTL",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_2x3_99?.route).toBe("XL10");
    expect(assignments.slot_2x3_98?.route).toBe("XL11");
    expect(assignments.slot_2x3_97?.route).toBe("XL19");
    expect(assignments.slot_2x3_96?.route).toBe("XL20");
  });

  it("maps earlier F waves to the closest row when F is earlier", () => {
    const regions: Region[] = [
      {
        id: "slot_2x3_top",
        type: "lane",
        startX: 0,
        startY: 2,
        endX: 1,
        endY: 4,
      },
      {
        id: "slot_2x3_bottom",
        type: "lane",
        startX: 6,
        startY: 9,
        endX: 7,
        endY: 11,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "XL10",
        staging: "F.1",
        waveTime: "08:00",
        dsp: "MTG",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "XL20",
        staging: "I.1",
        waveTime: "08:45",
        dsp: "JUTL",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_2x3_top?.route).toBe("XL10");
    expect(assignments.slot_2x3_bottom?.route).toBe("XL20");
  });

  it("allows CP routes staged in F.* to use 2x3 slots", () => {
    const regions: Region[] = [
      {
        id: "slot_1x6_1",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 5,
      },
      {
        id: "slot_2x3_1",
        type: "lane",
        startX: 1,
        startY: 0,
        endX: 2,
        endY: 2,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "CP39",
        staging: "F.1",
        waveTime: "08:00",
        dsp: "GALX",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "CP40",
        staging: "C.1",
        waveTime: "08:00",
        dsp: "GALX",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_2x3_1?.route).toBe("CP39");
    expect(assignments.slot_1x6_1?.route).toBe("CP40");
  });

  it("allows CP routes for MTG to use 2x3 slots", () => {
    const regions: Region[] = [
      {
        id: "slot_1x6_1",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 5,
      },
      {
        id: "slot_2x3_1",
        type: "lane",
        startX: 1,
        startY: 0,
        endX: 2,
        endY: 2,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "CP39",
        staging: "C.1",
        waveTime: "08:00",
        dsp: "MTG",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "CP40",
        staging: "C.2",
        waveTime: "08:00",
        dsp: "GALX",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_2x3_1?.route).toBe("CP39");
    expect(assignments.slot_1x6_1?.route).toBe("CP40");
  });

  it("orders F/I/other rows by waveTime", () => {
    const regions: Region[] = [
      {
        id: "slot_top",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
      {
        id: "slot_middle",
        type: "lane",
        startX: 0,
        startY: 3,
        endX: 1,
        endY: 5,
      },
      {
        id: "slot_bottom",
        type: "lane",
        startX: 3,
        startY: 6,
        endX: 4,
        endY: 8,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "XL10",
        staging: "F.1",
        waveTime: "08:45",
        dsp: "MTG",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "XL20",
        staging: "I.1",
        waveTime: "08:00",
        dsp: "JUTL",
        vehicle: "truck",
      },
      {
        id: 2,
        route: "XL30",
        staging: "G.1",
        waveTime: "10:00",
        dsp: "GALX",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_top?.staging).toBe("I.1");
    expect(assignments.slot_middle?.staging).toBe("F.1");
    expect(assignments.slot_bottom?.staging).toBe("G.1");
  });

  it("sorts waveTime values chronologically when assigning slot y positions", () => {
    const regions: Region[] = [
      {
        id: "slot_1x6_top",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 5,
      },
      {
        id: "slot_1x6_bottom",
        type: "lane",
        startX: 1,
        startY: 6,
        endX: 1,
        endY: 11,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "CP01",
        staging: "C.1",
        waveTime: "08:00\u200B",
        dsp: "GALX",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "CP02",
        staging: "C.1",
        waveTime: "08:45",
        dsp: "GALX",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_1x6_top?.route).toBe("CP01");
    expect(assignments.slot_1x6_bottom?.route).toBe("CP02");
  });

  it("keeps duplicate route codes across DSPs", () => {
    const regions: Region[] = [
      {
        id: "slot_2x3_1",
        type: "lane",
        startX: 0,
        startY: 0,
        endX: 1,
        endY: 2,
      },
      {
        id: "slot_2x3_2",
        type: "lane",
        startX: 3,
        startY: 0,
        endX: 4,
        endY: 2,
      },
    ];

    const routes: ParsedRoute[] = [
      {
        id: 0,
        route: "XL27",
        staging: "F.1",
        waveTime: "08:00AM",
        dsp: "JUTL",
        vehicle: "truck",
      },
      {
        id: 1,
        route: "XL27",
        staging: "G.1",
        waveTime: "10:00AM",
        dsp: "GALX",
        vehicle: "truck",
      },
    ];

    const assignments = mapRoutesToFloorAssignments(routes, regions);
    expect(assignments.slot_2x3_1?.route).toBe("XL27");
    expect(assignments.slot_2x3_1?.dsp).toBe("JUTL");
    expect(assignments.slot_2x3_2?.route).toBe("XL27");
    expect(assignments.slot_2x3_2?.dsp).toBe("GALX");
  });
});
