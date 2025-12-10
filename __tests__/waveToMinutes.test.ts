import { waveToMinutes } from "@/lib/utils/waveToMinutes";

describe("waveToMinutes", () => {
  it("converts HH:MM values", () => {
    expect(waveToMinutes("08:00")).toBe(8 * 60);
    expect(waveToMinutes("08:45")).toBe(8 * 60 + 45);
  });

  it("ignores zero-width characters", () => {
    expect(waveToMinutes("08:00\u200B")).toBe(8 * 60);
  });

  it("supports AM/PM suffixes", () => {
    expect(waveToMinutes("12:00 AM")).toBe(0);
    expect(waveToMinutes("12:00 PM")).toBe(12 * 60);
    expect(waveToMinutes("1:05 PM")).toBe(13 * 60 + 5);
    expect(waveToMinutes("08:00AM")).toBe(8 * 60);
    expect(waveToMinutes("8:00AM")).toBe(8 * 60);
    expect(waveToMinutes("8:45AM")).toBe(8 * 60 + 45);
    expect(waveToMinutes("10:00AM")).toBe(10 * 60);
  });

  it("supports compact HHMM values", () => {
    expect(waveToMinutes("800")).toBe(8 * 60);
    expect(waveToMinutes("0845")).toBe(8 * 60 + 45);
  });
});
