import QRCode from "qrcode";

export const getQRCode = async ({
  text,
  color = "#000",
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
      dark: color,
      light: "#0000",
    },
  });

  return svg
    .trim()
    .replace(/[\n\r]/g, "")
    .replace(/"/g, "'")
    .replace(/>\s+</g, "><");
};
