import { MAX_TBA_COUNT, parseBatchTbas } from "@/lib/utils/batchTbas";

describe("parseBatchTbas", () => {
  it("accepts non-empty TBA lines", () => {
    expect(parseBatchTbas("TBA1\n\n TBA2 ").values).toEqual(["TBA1", "TBA2"]);
  });

  it("rejects duplicate TBAs case-insensitively", () => {
    expect(parseBatchTbas("TBA1\ntba1").errors).toEqual(['Line 2: duplicate TBA "tba1".']);
  });

  it("limits batches to 100 TBAs", () => {
    const input = Array.from({ length: MAX_TBA_COUNT + 1 }, (_, index) => `TBA${index}`).join("\n");

    expect(parseBatchTbas(input).errors).toContain("Paste 100 or fewer TBAs. Found 101.");
  });

  it("accepts a realistic 66-line TBA batch", () => {
    const input = Array.from(
      { length: 66 },
      (_, index) => `TBA123456789${String(index + 1).padStart(3, "0")}`,
    ).join("\n");

    expect(parseBatchTbas(input)).toEqual({
      values: input.split("\n"),
      errors: [],
    });
  });
});
