import { parseRoutes } from "@/lib/utils/parseRoutes";

describe("parseRoutes", () => {
  it("parses standard format (route staging wave dsp)", () => {
    const [row] = parseRoutes("XL37 C.1 10:00 GALX");
    expect(row).toEqual({
      id: 0,
      route: "XL37",
      staging: "C.1",
      waveTime: "10:00",
      dsp: "GALX",
      vehicle: "truck",
      prefix: "XL",
    });
  });

  it("parses leading DSP format (dsp route staging wave)", () => {
    const [row] = parseRoutes("GALX XL37 C.1 10:00");
    expect(row).toEqual({
      id: 0,
      route: "XL37",
      staging: "C.1",
      waveTime: "10:00",
      dsp: "GALX",
      vehicle: "truck",
      prefix: "XL",
    });
  });

  it("parses AM/PM wave suffix and vehicle", () => {
    const [row] = parseRoutes("GALX CP39 C.2 9:30 AM van");
    expect(row).toEqual({
      id: 0,
      route: "CP39",
      staging: "C.2",
      waveTime: "9:30 AM",
      dsp: "GALX",
      vehicle: "van",
      prefix: "CP",
    });
  });

  it("parses AM/PM wave suffix attached to the time token", () => {
    const [row] = parseRoutes("JUTL\tXL19\tF.1\t8:00AM");
    expect(row).toEqual({
      id: 0,
      route: "XL19",
      staging: "F.1",
      waveTime: "8:00AM",
      dsp: "JUTL",
      vehicle: "truck",
      prefix: "XL",
    });
  });

  it("parses times containing zero-width characters", () => {
    const [row] = parseRoutes("JUTL\tXL19\tF.1\t8:00AM\u200B");
    expect(row).toEqual({
      id: 0,
      route: "XL19",
      staging: "F.1",
      waveTime: "8:00AM",
      dsp: "JUTL",
      vehicle: "truck",
      prefix: "XL",
    });
  });

  it("defaults CP routes to vans when no vehicle token is provided", () => {
    const [row] = parseRoutes("MTG CP01 C.1 8:00AM");
    expect(row).toEqual({
      id: 0,
      route: "CP01",
      staging: "C.1",
      waveTime: "8:00AM",
      dsp: "MTG",
      vehicle: "van",
      prefix: "CP",
    });
  });
});
