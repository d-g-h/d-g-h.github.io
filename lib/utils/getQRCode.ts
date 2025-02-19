import QRCode from "qrcode";

const encodeSvg = (svg: string): string => {
  return svg
    .trim()
    .replace(/[\n\r]/g, "")
    .replace(/"/g, "'")
    .replace(/>\s+</g, "><");
};

export async function getQRCode({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  try {
    const code = await QRCode.toString(text, {
      errorCorrectionLevel: "H",
      width: 100,
      color: {
        dark: color,
        light: "#0000",
      },
      type: "svg",
    });

    return encodeSvg(code);
  } catch (err) {
    console.error(err);
  }
}
