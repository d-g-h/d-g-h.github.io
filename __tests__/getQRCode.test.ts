import { getQRCode } from "@/lib/utils/getQRCode";

vi.mock("qrcode", () => ({
  default: {
    toString: vi.fn(),
  },
}));

import QRCode from "qrcode";

describe("getQRCode", () => {
  it("calls QRCode.toString and formats SVG string", async () => {
    const sample = `\n<svg width="10">\n  <rect />\n</svg>\n`;
    vi.mocked(QRCode.toString).mockResolvedValueOnce(sample);

    const out = await getQRCode({ text: "123" });
    // no newlines
    expect(out).not.toMatch(/\n/);
    // double quotes replaced with single quotes
    expect(out).toContain("width='10'");
    // tags collapsed
    expect(out).toContain("><rect />");
  });

  it("renders with hex for qrcode, then emits OKLAB color in the SVG", async () => {
    vi.mocked(QRCode.toString).mockResolvedValueOnce(
      `<svg><path stroke="#000000" d="M0 0h1"/></svg>`,
    );

    const out = await getQRCode({ text: "123" });

    expect(QRCode.toString).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({
        color: {
          dark: "#000000",
          light: "#00000000",
        },
      }),
    );
    expect(out).toContain("stroke='oklab(0 0 0)'");
  });
});
