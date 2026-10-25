import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { z } from "zod";
import { renderHtml, renderPdf, validatePdf, type BrowserBinding } from "./render";
import {
  authorized,
  decryptShareUrl,
  encryptShareUrl,
  privateHeaders,
  randomToken,
  sha256,
} from "./security";
import {
  composeResume,
  createResume,
  getCareer,
  getResume,
  getVariant,
  importCareer,
  stmt,
} from "./store";
import {
  applicationSchema,
  careerSchema,
  HttpError,
  resumeSchema,
  shareSchema,
} from "./validation";

export interface Env {
  DB: D1Database;
  BROWSER: BrowserBinding;
  ADMIN_TOKEN_SHA256: string;
  PUBLIC_ORIGIN: string;
  FILES?: R2Bucket;
  SHARE_URL_KEY?: string;
}
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: privateHeaders });
async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Use application/json");
  if (Number(request.headers.get("content-length")) > 262144)
    throw new HttpError(413, "Request too large");
  if (!request.body) throw new HttpError(400, "JSON body required");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > 262144) {
      await reader.cancel();
      throw new HttpError(413, "Request too large");
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
const shareColumns =
  "id, resume_variant_id, label, created_at, expires_at, revoked_at, view_count, max_views";
export async function consumeShare(db: D1Database, uuid: string, token: string): Promise<boolean> {
  if (!z.uuid().safeParse(uuid).success || !/^[a-f0-9]{64}$/.test(token)) return false;
  // Conditional UPDATE makes the view budget atomic across simultaneous requests.
  const row = await stmt(
    db,
    `UPDATE share_links SET view_count = view_count + 1
    WHERE token_hash = ? AND resume_variant_id = (SELECT id FROM resume_variants WHERE uuid = ? AND archived_at IS NULL)
    AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)
    AND (max_views IS NULL OR view_count < max_views) RETURNING id`,
    await sha256(token),
    uuid,
    new Date().toISOString(),
  ).first();
  return row !== null;
}
async function renderResponse(env: Env, uuid: string, pdf: boolean, href?: string) {
  const model = await composeResume(env.DB, uuid);
  if (pdf) {
    let bytes: Uint8Array | undefined;
    if (env.FILES) {
      const artifact = await stmt(
        env.DB,
        "SELECT object_key FROM resume_artifacts WHERE resume_variant_id = ?",
        model.resume.id,
      ).first<{ object_key: string }>();
      if (artifact) {
        const file = await env.FILES.get(artifact.object_key);
        if (!file) throw new HttpError(503, "Resume file is unavailable");
        bytes = new Uint8Array(await file.arrayBuffer());
      }
    }
    if (!bytes) {
      bytes = await renderPdf(model, env.BROWSER);
      if (env.FILES) {
        const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
        const hash = [...new Uint8Array(digest)]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        const key = `resumes/${model.resume.uuid}/${hash}/resume.pdf`;
        await env.FILES.put(key, bytes, {
          httpMetadata: { contentType: "application/pdf", cacheControl: "private, no-store" },
        });
        await stmt(
          env.DB,
          "INSERT OR IGNORE INTO resume_artifacts (resume_variant_id, object_key, sha256, byte_length, page_count, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          model.resume.id,
          key,
          hash,
          bytes.byteLength,
          await validatePdf(bytes, model.resume.template),
          new Date().toISOString(),
        ).run();
      }
    }
    return new Response(bytes as BodyInit, {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  }
  // Federal HTML is only served after validating the actual print output, too.
  if (model.resume.template === "federal") await renderPdf(model, env.BROWSER);
  return new Response(renderHtml(model, href), {
    headers: { ...privateHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}
async function api(request: Request, env: Env, path: string) {
  const db = env.DB;
  const method = request.method;
  const pagination = new URL(request.url).searchParams;
  const offset = z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000)
    .parse(pagination.get("offset") ?? 0);
  if (path === "/api/career") {
    if (method === "GET")
      return json(
        (
          await stmt(
            db,
            "SELECT id, created_at, source_commit FROM career_revisions ORDER BY created_at DESC, id DESC LIMIT 100 OFFSET ?",
            offset,
          ).all()
        ).results,
      );
    if (method === "POST")
      return json(await importCareer(db, careerSchema.parse(await body(request))), 201);
  }
  const career = /^\/api\/career\/([a-zA-Z0-9_-]+)$/.exec(path);
  if (career && method === "GET") return json(await getCareer(db, career[1]));
  if (path === "/api/resumes") {
    if (method === "GET")
      return json(
        (
          await stmt(
            db,
            "SELECT * FROM resume_variants ORDER BY created_at DESC, id DESC LIMIT 100 OFFSET ?",
            offset,
          ).all()
        ).results,
      );
    if (method === "POST")
      return json(await createResume(db, resumeSchema.parse(await body(request))), 201);
  }
  const resume = /^\/api\/resumes\/([a-f0-9-]+)(?:\/(shares|render)(?:\/(html|pdf))?)?$/.exec(path);
  if (resume) {
    const uuid = z.uuid().parse(resume[1]);
    const action = resume[2];
    if (!action && method === "GET") return json(await getResume(db, uuid));
    if (!action && method === "PATCH") {
      const old = await getResume(db, uuid);
      const input = await body(request);
      const parsed = resumeSchema.partial().parse(input);
      const patch = Object.fromEntries(
        Object.keys(input as Record<string, unknown>).map((key) => [
          key,
          parsed[key as keyof typeof parsed],
        ]),
      );
      const fields = Object.fromEntries(
        Object.keys(resumeSchema.shape).map((key) => [key, old[key as keyof typeof old]]),
      );
      return json(await createResume(db, resumeSchema.parse({ ...fields, ...patch }), old), 201);
    }
    if (action === "shares") {
      const variant = await getVariant(db, uuid);
      if (method === "GET") {
        const rows = (
          await stmt(
            db,
            `SELECT ${shareColumns}, url_ciphertext FROM share_links WHERE resume_variant_id = ? ORDER BY created_at DESC LIMIT 100 OFFSET ?`,
            variant.id,
            offset,
          ).all<Record<string, unknown> & { url_ciphertext: string | null }>()
        ).results;
        return json(
          await Promise.all(
            rows.map(async ({ url_ciphertext, ...row }) => {
              if (!url_ciphertext || !env.SHARE_URL_KEY) return row;
              const url = await decryptShareUrl(url_ciphertext, env.SHARE_URL_KEY);
              return { ...row, url, pdf_url: `${url}/resume.pdf` };
            }),
          ),
        );
      }
      if (method === "POST") {
        const data = shareSchema.parse(await body(request));
        const id = crypto.randomUUID();
        const token = randomToken();
        const now = new Date();
        const expires = data.expires
          ? new Date(now.getTime() + Number(data.expires.slice(0, -1)) * 86400000).toISOString()
          : null;
        const url = `${new URL(env.PUBLIC_ORIGIN).origin}/r/${uuid}/${token}`;
        await stmt(
          db,
          "INSERT INTO share_links (id, resume_variant_id, token_hash, label, created_at, expires_at, max_views, url_ciphertext) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          id,
          variant.id,
          await sha256(token),
          data.label,
          now.toISOString(),
          expires,
          data.max_views,
          env.SHARE_URL_KEY ? await encryptShareUrl(url, env.SHARE_URL_KEY) : null,
        ).run();
        // Share URLs use the configured origin and are encrypted in the database.
        return json(
          {
            id,
            resume_uuid: uuid,
            label: data.label,
            expires_at: expires,
            max_views: data.max_views,
            url,
            pdf_url: `${url}/resume.pdf`,
          },
          201,
        );
      }
    }
    if (action === "render") {
      if (method === "POST" && !resume[3]) {
        const options = z
          .object({ format: z.enum(["html", "pdf"]).default("pdf") })
          .strict()
          .parse(await body(request));
        return renderResponse(env, uuid, options.format === "pdf");
      }
      if (method === "GET" && resume[3]) return renderResponse(env, uuid, resume[3] === "pdf");
    }
  }
  const revoke = /^\/api\/shares\/([a-f0-9-]+)\/revoke$/.exec(path);
  if (revoke && method === "POST") {
    const row = await stmt(
      db,
      "UPDATE share_links SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ? RETURNING id, revoked_at",
      new Date().toISOString(),
      z.uuid().parse(revoke[1]),
    ).first();
    if (!row) throw new HttpError(404, "Share not found");
    return json(row);
  }
  if (path === "/api/applications") {
    if (method === "GET")
      return json(
        (
          await stmt(
            db,
            "SELECT a.*, r.uuid AS resume_uuid, r.resume_id, r.version AS resume_version FROM applications a JOIN resume_variants r ON r.id = a.resume_variant_id ORDER BY a.created_at DESC, a.id DESC LIMIT 100 OFFSET ?",
            offset,
          ).all()
        ).results,
      );
    if (method === "POST") {
      const data = applicationSchema.parse(await body(request));
      const variant = await getVariant(db, data.resume_uuid);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const appliedAt = data.applied_at ?? (data.status === "applied" ? now : null);
      await stmt(
        db,
        "INSERT INTO applications (id, uuid, resume_variant_id, company, role, job_url, recruiter_name, recruiter_email, status, applied_at, created_at, updated_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        id,
        variant.id,
        data.company,
        data.role,
        data.job_url,
        data.recruiter_name,
        data.recruiter_email,
        data.status,
        appliedAt,
        now,
        now,
        data.notes,
      ).run();
      return json(
        {
          id,
          uuid: id,
          ...data,
          applied_at: appliedAt,
          resume_variant_id: variant.id,
          resume_version: variant.version,
          created_at: now,
          updated_at: now,
        },
        201,
      );
    }
  }
  const application = /^\/api\/applications\/([a-f0-9-]+)$/.exec(path);
  if (application && method === "PATCH") {
    const uuid = z.uuid().parse(application[1]);
    const input = await body(request);
    const parsed = applicationSchema.omit({ resume_uuid: true }).partial().parse(input);
    const patch = Object.fromEntries(
      Object.keys(input as Record<string, unknown>).map((key) => [
        key,
        parsed[key as keyof typeof parsed],
      ]),
    ) as typeof parsed;
    const now = new Date().toISOString();
    if (patch.status === "applied" && patch.applied_at === undefined) {
      const old = await stmt(db, "SELECT applied_at FROM applications WHERE uuid = ?", uuid).first<{
        applied_at: string | null;
      }>();
      patch.applied_at = old?.applied_at ?? now;
    }
    const entries = Object.entries({ ...patch, updated_at: now });
    // Column names come only from the strict schema, values are bound parameters.
    const row = await stmt(
      db,
      `UPDATE applications SET ${entries.map(([key]) => `${key} = ?`).join(", ")} WHERE uuid = ? RETURNING *`,
      ...entries.map(([, value]) => value),
      uuid,
    ).first();
    if (!row) throw new HttpError(404, "Application not found");
    return json(row);
  }
  throw new HttpError(404, "Not found");
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === "/api" || path.startsWith("/api/")) {
        if (!(await authorized(request, env.ADMIN_TOKEN_SHA256)))
          return json({ error: "Unauthorized" }, 401);
        return await api(request, env, path);
      }
      if (path === "/assets/print.js" && request.method === "GET")
        return new Response(
          'document.getElementById("print").addEventListener("click", () => window.print());',
          { headers: { ...privateHeaders, "Content-Type": "application/javascript" } },
        );
      const share = /^\/r\/([^/]+)\/([^/]+)(\/resume\.pdf)?$/.exec(path);
      if (share && request.method === "GET") {
        if (!(await consumeShare(env.DB, share[1], share[2])))
          throw new HttpError(404, "Not found");
        return await renderResponse(
          env,
          share[1],
          Boolean(share[3]),
          `/r/${share[1]}/${share[2]}/resume.pdf`,
        );
      }
      throw new HttpError(404, "Not found");
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      if (error instanceof z.ZodError)
        return json(
          { error: "Invalid request", fields: error.issues.map((issue) => issue.path.join(".")) },
          400,
        );
      // Deliberately do not log exceptions: URLs, bindings and input may contain secrets.
      return json({ error: "Request failed" }, 500);
    }
  },
};
