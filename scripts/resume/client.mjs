import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";

export async function clientConfig() {
  let local = {};
  try {
    local = parseEnv(
      await readFile(new URL("../../private/resume-client.env", import.meta.url), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error("Cannot read private resume client configuration");
  }
  const origin = process.env.RESUME_API_URL || local.RESUME_API_URL || "https://resume.pxl8.ing";
  const token = process.env.RESUME_API_TOKEN || local.RESUME_API_TOKEN;
  const url = new URL(origin);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("RESUME_API_URL must be an origin");
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))
  )
    throw new Error("HTTPS is required except on localhost");
  if (!token || token.length < 32)
    throw new Error("Set RESUME_API_TOKEN in your environment or private/resume-client.env");
  return { origin: url.origin, token };
}
export async function api(path, { method = "GET", body, binary = false } = {}) {
  const { origin, token } = await clientConfig();
  let response;
  try {
    response = await fetch(`${origin}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
    });
  } catch {
    throw new Error("Resume API connection failed; check the configured origin and connectivity");
  }
  if (!response.ok) {
    // Do not echo arbitrary response bodies or request URLs into logs.
    throw new Error(`Resume API returned HTTP ${response.status}`);
  }
  return binary ? new Uint8Array(await response.arrayBuffer()) : response.json();
}
