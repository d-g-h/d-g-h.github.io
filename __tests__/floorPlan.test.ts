import { floorToMatrix } from "@/lib/floor";
import { FLOOR_PLAN_DIMENSIONS, FLOOR_PLAN_LEFT_MARGIN, floorPlanRegions } from "@/lib/floorPlan";

describe("floor plan layout", () => {
  it("renders the provided grid (54 cols, with left margin) without overlaps", () => {
    const matrix = floorToMatrix(
      floorPlanRegions,
      FLOOR_PLAN_DIMENSIONS.width,
      FLOOR_PLAN_DIMENSIONS.height,
    );

    expect(matrix).toHaveLength(FLOOR_PLAN_DIMENSIONS.height);
    for (const row of matrix) {
      expect(row).toHaveLength(FLOOR_PLAN_DIMENSIONS.width);
    }

    const doorStart = FLOOR_PLAN_LEFT_MARGIN;
    expect(matrix[1][doorStart]).toBe("door_99");
    expect(matrix[1][doorStart + 1]).toBe("door_99");
    expect(matrix[1][doorStart + 16 * 3]).toBe("door_83");
    expect(matrix[1][doorStart + 16 * 3 + 1]).toBe("door_83");

    const expectedCells: Array<[number, number, string]> = [
      [4, 2, "slot_2x3_1"],
      [5, 4, "slot_2x3_1"],
      [7, 2, "slot_2x3_3"],
      [22, 2, "slot_2x3_8"],
      [37, 2, "slot_2x3_10"],
      [49, 2, "slot_2x3_14"],
      [52, 5, "slot_2x3_29"],
      [16, 9, "slot_2x3_30"],
      [52, 11, "slot_2x3_35"],
      [2, 9, "slot_1x6_1"],
      [2, 14, "slot_1x6_1"],
      [14, 12, "slot_1x6_9"],
      [40, 9, "slot_1x6_10"],
      [47, 13, "slot_1x6_15"],
    ];

    for (const [x, y, id] of expectedCells) {
      expect(matrix[y][x]).toBe(id);
    }
  });
});
