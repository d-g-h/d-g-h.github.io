import { publicEnv } from "@/src/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicEnv", () => {
  it("uses a deploy URL fallback when VITE_URL is empty", () => {
    vi.stubEnv("VITE_URL", "");

    expect(publicEnv.url).toBe("https://d-g-h.github.io");
  });

  it("uses VITE_URL when provided", () => {
    vi.stubEnv("VITE_URL", "https://example.com");

    expect(publicEnv.url).toBe("https://example.com");
  });
});
