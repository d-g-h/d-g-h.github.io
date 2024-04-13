import monthYear from "@/lib/utils/monthYear";

describe("formattedDate", () => {
  test("should create a Date object from a formatted string", () => {
    const formattedString = "2022-02";
    const expectedDateString = "February 2022";

    const result = monthYear({ date: formattedString });

    expect(result).toEqual(expectedDateString);
  });

  test("should handle invalid formatted string gracefully", () => {
    const invalidFormattedString = "invalid-date";
    const result = monthYear({ date: invalidFormattedString });

    expect(result).toBeFalsy();
  });
});

describe("monthYear", () => {
  test("should return the formatted month and year string", () => {
    const inputDate = "2022-02";
    const expectedOutput = "February 2022";

    const result = monthYear({ date: inputDate });

    expect(result).toBe(expectedOutput);
  });
});
