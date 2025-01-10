import QRCode from "qrcode";

export default async function getQRCode({
  url,
  color,
}: {
  url: string | undefined;
  color: string;
}) {
  if (!url) {
    throw new Error("URL is required to generate a QR code");
  }
  try {
    const code = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      color: {
        dark: color,
        light: "#0000",
      },
    });
    return code;
  } catch (err) {
    console.error(err);
  }
}
