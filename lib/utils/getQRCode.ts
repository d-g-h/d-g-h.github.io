import QRCode from "qrcode";

const QR_RENDER_DARK_COLOR = "#000000";
const QR_RENDER_LIGHT_COLOR = "#00000000";

export const getQRCode = async ({
  text,
  color = "oklab(0 0 0)",
  width = 100,
  margin = 2,
}: {
  text: string;
  color?: string;
  width?: number;
  margin?: number;
}) => {
  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "H",
    width,
    margin,
    color: {
      dark: QR_RENDER_DARK_COLOR,
      light: QR_RENDER_LIGHT_COLOR,
    },
  });

  return svg
    .trim()
    .replaceAll(QR_RENDER_DARK_COLOR, color)
    .replace(/[\n\r]/g, "")
    .replace(/"/g, "'")
    .replace(/>\s+</g, "><");
};
