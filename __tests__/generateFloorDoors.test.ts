import { generateFloorDoors } from "@/lib/utils/generateFloorDoors";

describe("generateFloorDoors", () => {
  it("assigns F.* routes to doors by stage index (F.1 starts at 99)", () => {
    const assignments = generateFloorDoors(
      [
        { id: 0, route: "XL10", staging: "I.1", waveTime: "08:00", dsp: "MTG" },
        { id: 1, route: "XL19", staging: "F.1", waveTime: "08:45", dsp: "JUTL" },
        { id: 2, route: "XL20", staging: "F.2", waveTime: "08:45", dsp: "JUTL" },
      ],
      { doors: [99, 98, 97, 96] },
    );

    expect(assignments[99].some((r) => r?.route === "XL19")).toBe(true);
    expect(assignments[98].some((r) => r?.route === "XL20")).toBe(true);
  });

  it("prefers doors 90/91/92 for wave 3 routes when available", () => {
    const assignments = generateFloorDoors(
      [
        { id: 0, route: "XL10", staging: "I.1", waveTime: "08:00", dsp: "MTG" },
        { id: 1, route: "XL11", staging: "I.2", waveTime: "08:45", dsp: "MTG" },
        { id: 2, route: "XL12", staging: "I.3", waveTime: "09:30", dsp: "MTG" },
        { id: 3, route: "XL13", staging: "I.4", waveTime: "09:30", dsp: "MTG" },
      ],
      { doors: [99, 98, 97, 92, 91, 90, 89] },
    );

    const doorFor = (route: string) =>
      Object.entries(assignments).find(([, rows]) => rows.some((r) => r?.route === route))?.[0];

    expect(doorFor("XL12")).toMatch(/^(90|91|92)$/);
    expect(doorFor("XL13")).toMatch(/^(90|91|92)$/);
  });

  it("includes CP routes staged in F.* in the F block", () => {
    const assignments = generateFloorDoors(
      [
        { id: 0, route: "XL10", staging: "I.1", waveTime: "08:00", dsp: "MTG" },
        { id: 1, route: "CP23", staging: "F.1", waveTime: "08:45", dsp: "JUTL" },
        { id: 2, route: "CP24", staging: "F.2", waveTime: "08:45", dsp: "JUTL" },
      ],
      { doors: [99, 98, 97, 96] },
    );

    expect(assignments[99].some((r) => r?.route === "CP23")).toBe(true);
    expect(assignments[98].some((r) => r?.route === "CP24")).toBe(true);
  });

  it("orders F staging before I staging within the same wave", () => {
    const assignments = generateFloorDoors(
      [
        { id: 0, route: "XL10", staging: "I.1", waveTime: "08:00", dsp: "MTG" },
        { id: 1, route: "XL11", staging: "F.10", waveTime: "08:00", dsp: "MTG" },
      ],
      { doors: [99] },
    );

    expect(assignments[99].map((r) => r?.staging)).toEqual(["F.10", "I.1"]);
  });
});
