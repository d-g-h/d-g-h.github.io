import type { DisplayState, QRRow } from "@/components/Qr";

interface CompactState {
  rows: QRRow[];
  inProgressIds: string[];
  displayStates: Map<string, DisplayState>;
}

const compress = async (str: string): Promise<string> => {
  const stream = new Blob([str]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
  const chunks: Uint8Array[] = [];
  const reader = compressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }

  return btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const decompress = async (str: string): Promise<string> => {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const stream = new Blob([bytes]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));

  const chunks: Uint8Array[] = [];
  const reader = decompressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    decompressed.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(decompressed);
};

export const encodeQRState = async (
  rows: QRRow[],
  inProgress: QRRow[],
  displayStates: Map<string, DisplayState>,
): Promise<string> => {
  const rowStrings = [...rows, ...inProgress].map(
    (r) => `[${r.id},${r.value},${r.label},${r.name ?? ""},${displayStates.get(r.id) ?? "show"}]`,
  );
  const inProgIds = inProgress.map((r) => r.id);
  const compact = `${rowStrings.join(";")}|inProgress=${inProgIds.join(",")}`;

  return await compress(compact);
};

export const decodeQRState = async (encoded: string): Promise<CompactState> => {
  const decoded = await decompress(encoded);

  const [rowsPart, inProgPart] = decoded.split("|inProgress=");
  const rowStrings = rowsPart.split(";").filter(Boolean);
  const displayStates = new Map<string, DisplayState>();

  const allRows: QRRow[] = rowStrings.map((r) => {
    const [id, value, label, name, displayState] = r.replace(/^\[|\]$/g, "").split(",");
    displayStates.set(id, displayState as DisplayState);
    return { id, label, value, name, svg: "" };
  });

  const inProgressIds = inProgPart ? inProgPart.split(",") : [];

  return { rows: allRows, inProgressIds, displayStates };
};
