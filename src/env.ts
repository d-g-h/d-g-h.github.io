export const publicEnv = {
  get url() {
    return import.meta.env.VITE_URL?.trim() || "https://d-g-h.github.io";
  },
  get name() {
    return import.meta.env.VITE_NAME ?? "Name";
  },
  get github() {
    return import.meta.env.VITE_GITHUB ?? "#";
  },
  get email() {
    return import.meta.env.VITE_EMAIL ?? "email@example.com";
  },
  get linkedIn() {
    return import.meta.env.VITE_LINKEDIN ?? "#";
  },
  get phone() {
    return import.meta.env.VITE_PHONE ?? "";
  },
};
