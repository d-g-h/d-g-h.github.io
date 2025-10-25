if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str) => Buffer.from(str, "binary").toString("base64");
}

if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
}

globalThis.CompressionStream = class CompressionStream {
  constructor(_format) {
    this._ts = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush(controller) {
        controller.terminate();
      },
    });
  }

  get readable() {
    return this._ts.readable;
  }

  get writable() {
    return this._ts.writable;
  }
};

globalThis.DecompressionStream = class DecompressionStream {
  constructor(_format) {
    this._ts = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush(controller) {
        controller.terminate();
      },
    });
  }

  get readable() {
    return this._ts.readable;
  }

  get writable() {
    return this._ts.writable;
  }
};
import "@testing-library/jest-dom";
