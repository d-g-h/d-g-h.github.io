export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function randomToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function authorized(request: Request, expected?: string): Promise<boolean> {
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const match = /^Bearer ([^\s]{32,512})$/.exec(request.headers.get("Authorization") ?? "");
  if (!match) return false;
  const actual = await sha256(match[1]);
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
const hexBytes = (value: string) => {
  if (!/^(?:[a-f0-9]{2})+$/.test(value)) throw new Error("Invalid encrypted URL configuration");
  return Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
};
const toHex = (value: Uint8Array) =>
  [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
async function urlKey(secret: string) {
  if (secret.length !== 64) throw new Error("Invalid encrypted URL configuration");
  return crypto.subtle.importKey("raw", hexBytes(secret), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptShareUrl(url: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await urlKey(secret),
    new TextEncoder().encode(url),
  );
  return toHex(iv) + toHex(new Uint8Array(encrypted));
}
export async function decryptShareUrl(value: string, secret: string): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexBytes(value.slice(0, 24)) },
    await urlKey(secret),
    hexBytes(value.slice(24)),
  );
  return new TextDecoder().decode(decrypted);
}
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
