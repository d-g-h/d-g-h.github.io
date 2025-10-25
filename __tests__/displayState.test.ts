import { getNextDisplayState } from "@/lib/utils/displayState";

describe("getNextDisplayState", () => {
  it("cycles show -> hide -> qrOnly -> show", () => {
    expect(getNextDisplayState("show")).toBe("hide");
    expect(getNextDisplayState("hide")).toBe("qrOnly");
    expect(getNextDisplayState("qrOnly")).toBe("show");
  });
});
