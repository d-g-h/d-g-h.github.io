import "@testing-library/jest-dom/vitest";

if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str) => Buffer.from(str, "binary").toString("base64");
}

if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
}

globalThis.CompressionStream = class CompressionStream {
  private readonly ts = new TransformStream();

  get readable() {
    return this.ts.readable;
  }

  get writable() {
    return this.ts.writable;
  }
};

globalThis.DecompressionStream = class DecompressionStream {
  private readonly ts = new TransformStream();

  get readable() {
    return this.ts.readable;
  }

  get writable() {
    return this.ts.writable;
  }
};
