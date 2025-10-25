/**
 * @jest-environment jsdom
 */
import { getQRCode } from "@/lib/utils/getQRCode";

jest.mock("qrcode", () => ({
  toString: jest.fn(),
}));

import QRCode from "qrcode";

describe("getQRCode", () => {
  it("calls QRCode.toString and formats SVG string", async () => {
    const sample = `\n<svg width="10">\n  <rect />\n</svg>\n`;
    (QRCode.toString as jest.Mock).mockResolvedValueOnce(sample);

    const out = await getQRCode({ text: "123" });
    // no newlines
    expect(out).not.toMatch(/\n/);
    // double quotes replaced with single quotes
    expect(out).toContain("width='10'");
    // tags collapsed
    expect(out).toContain("><rect />");
  });
});
