import { parseDoors } from "@/lib/utils/parseDoors";

describe("parseDoors", () => {
  it("dedupes valid positive door numbers and sorts high to low", () => {
    expect(parseDoors("123 121,122 123 120")).toEqual([123, 122, 121, 120]);
  });

  it("ignores invalid, empty, and non-positive values", () => {
    expect(parseDoors("10 nope 0 -2 9")).toEqual([10, 9]);
  });
});
