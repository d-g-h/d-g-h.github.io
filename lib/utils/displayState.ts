import type { DisplayState } from "@/components/Qr";

export const getNextDisplayState = (current: DisplayState): DisplayState => {
  return current === "show" ? "hide" : current === "hide" ? "qrOnly" : "show";
};
