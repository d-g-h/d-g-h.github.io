// @vitest-environment node
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import worker, { type Env } from "../../workers/resume/index";
import { randomToken, sha256 } from "../../workers/resume/security";
import { validatePdf } from "../../workers/resume/render";

const browser = vi.hoisted(() => ({
  launch: vi.fn(),
  close: vi.fn(),
  setContent: vi.fn(),
  pdf: vi.fn(),
  setJavaScriptEnabled: vi.fn(),
  setRequestInterception: vi.fn(),
  on: vi.fn(),
  emulateMediaType: vi.fn(),
}));
vi.mock("@cloudflare/puppeteer", () => ({ default: { launch: browser.launch } }));

// Exercise actual SQLite constraints/queries/transactions through the D1 interface.
function database(sqlite: DatabaseSync): D1Database {
  const prepare = (sql: string, args: (string | number | null)[] = []) => ({
    bind: (...values: (string | number | null)[]) => prepare(sql, values),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ success: true, results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ success: true, meta: sqlite.prepare(sql).run(...args) }),
  });
  return {
    prepare,
    batch: async (statements: ReturnType<typeof prepare>[]) => {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}
const career = {
  profile: { name: "Example Candidate", email: "candidate@example.com" },
  experience: [
    {
      id: "consulting",
      company: "Consulting",
      role: "Engineer",
      location: "Remote",
      start_date: "2023-07",
      hours_per_week: 40,
      bullets: [
        { id: "api", text: "Built healthcare APIs" },
        { id: "cache", text: "Improved caching" },
      ],
    },
  ],
  skills: [{ id: "ts", name: "TypeScript" }],
  education: [{ id: "college", name: "Example College" }],
};
let sqlite: DatabaseSync;
let env: Env;
let token: string;
async function request(path: string, method = "GET", data?: unknown, authenticated = true) {
  return worker.fetch(
    new Request(`https://resume.pxl8.ing${path}`, {
      method,
      headers: {
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      ...(method !== "GET" && data ? { body: JSON.stringify(data) } : {}),
    }),
    env,
  );
}
async function fixture() {
  const imported = await request("/api/career", "POST", career);
  expect(imported.status).toBe(201);
  const { id } = (await imported.json()) as { id: string };
  const payload = {
    revision_id: id,
    title: "Senior Engineer",
    company: "McKinsey & Company",
    role: "Senior Software Engineer",
    summary: "Engineering reliable services",
    experience: [{ experienceId: "consulting", bulletIds: ["cache", "api"] }],
    skill_ids: ["ts"],
    education_ids: ["college"],
  };
  const result = await request("/api/resumes", "POST", payload);
  expect(result.status).toBe(201);
  return {
    payload,
    resume: (await result.json()) as { uuid: string; id: string; version: number },
  };
}
async function share(uuid: string, options = {}) {
  const response = await request(`/api/resumes/${uuid}/shares`, "POST", options);
  expect(response.status).toBe(201);
  return (await response.json()) as { id: string; url: string; pdf_url: string };
}
beforeEach(async () => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../../workers/resume/migrations/0001_resume.sql", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    readFileSync(
      new URL("../../workers/resume/migrations/0002_artifacts.sql", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    readFileSync(
      new URL("../../workers/resume/migrations/0003_share_urls.sql", import.meta.url),
      "utf8",
    ),
  );
  token = randomToken();
  env = {
    DB: database(sqlite),
    ADMIN_TOKEN_SHA256: await sha256(token),
    PUBLIC_ORIGIN: "https://resume.pxl8.ing",
    BROWSER: {} as Env["BROWSER"],
  };
  vi.clearAllMocks();
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  browser.pdf.mockResolvedValue(await doc.save());
  browser.launch.mockResolvedValue({ newPage: async () => browser, close: browser.close });
});
afterEach(() => sqlite.close());

describe("Private resume service", () => {
  it("switches to the compact template without losing content or changing old versions", async () => {
    const { resume, payload } = await fixture();
    const originalHtml = await (await request(`/api/resumes/${resume.uuid}/render/html`)).text();
    const response = await request(`/api/resumes/${resume.uuid}`, "PATCH", {
      template_version: "2",
    });
    expect(response.status).toBe(201);
    const compact = (await response.json()) as {
      uuid: string;
      template_version: string;
      summary: string;
      skill_ids: string[];
    };
    expect(compact.template_version).toBe("2");
    expect(compact.summary).toBe(payload.summary);
    expect(compact.skill_ids).toEqual(payload.skill_ids);
    const html = await (await request(`/api/resumes/${compact.uuid}/render/html`)).text();
    expect(html).toContain('class="target"');
    expect(html).toContain("Built healthcare APIs");
    expect(await (await request(`/api/resumes/${resume.uuid}/render/html`)).text()).toBe(
      originalHtml,
    );
  });
  it("stores immutable PDFs in R2 while tracking share views in the database", async () => {
    env.SHARE_URL_KEY = randomToken();
    const files = new Map<string, Uint8Array>();
    env.FILES = {
      put: async (key: string, value: Uint8Array) => {
        files.set(key, value);
      },
      get: async (key: string) => {
        const value = files.get(key);
        return value ? { arrayBuffer: async () => value.buffer } : null;
      },
    } as unknown as Env["FILES"];
    const { resume } = await fixture();
    expect((await request(`/api/resumes/${resume.uuid}/render/pdf`)).status).toBe(200);
    expect((await request(`/api/resumes/${resume.uuid}/render/pdf`)).status).toBe(200);
    expect(browser.launch).toHaveBeenCalledTimes(1);
    expect(files.size).toBe(1);
    const next = (await (
      await request(`/api/resumes/${resume.uuid}`, "PATCH", { summary: "Updated summary" })
    ).json()) as { uuid: string };
    expect((await request(`/api/resumes/${next.uuid}/render/pdf`)).status).toBe(200);
    expect(files.size).toBe(2);
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM resume_artifacts").get()?.count).toBe(2);
    const link = await share(next.uuid, { label: "Jason" });
    expect((await request(new URL(link.pdf_url).pathname, "GET", undefined, false)).status).toBe(
      200,
    );
    const shares = await (await request(`/api/resumes/${next.uuid}/shares`)).json();
    expect(shares).toMatchObject([{ id: link.id, label: "Jason", view_count: 1 }]);
    expect(shares).toMatchObject([{ url: link.url, pdf_url: link.pdf_url }]);
    const row = sqlite.prepare("SELECT url_ciphertext FROM share_links WHERE id = ?").get(link.id);
    expect(row?.url_ciphertext).not.toContain(new URL(link.url).pathname.split("/").at(-1));
    expect(
      (await request(`/api/resumes/${next.uuid}/shares`, "GET", undefined, false)).status,
    ).toBe(401);
    expect(browser.launch).toHaveBeenCalledTimes(2);
  });
  it("fails closed for all private routes and missing configuration", async () => {
    for (const path of [
      "/api",
      "/api/resumes",
      "/api/career",
      "/api/applications",
      "/api/unknown",
    ]) {
      const response = await request(path, "GET", undefined, false);
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    env.ADMIN_TOKEN_SHA256 = "";
    expect((await request("/api/resumes")).status).toBe(401);
  });
  it("imports idempotently and validates selections before transaction", async () => {
    const { payload } = await fixture();
    expect(
      ((await (await request("/api/career", "POST", career)).json()) as { id: string }).id,
    ).toBe(payload.revision_id);
    for (const change of [
      { experience: [{ experienceId: "consulting", bulletIds: ["missing"] }] },
      { skill_ids: ["missing"] },
      { education_ids: ["missing"] },
    ]) {
      expect((await request("/api/resumes", "POST", { ...payload, ...change })).status).toBe(422);
    }
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM resume_variants").get()?.count).toBe(1);
  });
  it("rejects bullet references across employers and duplicate selections", async () => {
    const { payload } = await fixture();
    expect(
      (
        await request("/api/resumes", "POST", {
          ...payload,
          experience: [{ experienceId: "consulting", bulletIds: ["api", "api"] }],
        })
      ).status,
    ).toBe(400);
    const other = structuredClone(career);
    other.experience.push({
      ...other.experience[0],
      id: "ibm",
      bullets: [{ id: "ibm-only", text: "IBM work" }],
    });
    const revision = (await (await request("/api/career", "POST", other)).json()) as { id: string };
    expect(
      (
        await request("/api/resumes", "POST", {
          ...payload,
          revision_id: revision.id,
          experience: [{ experienceId: "consulting", bulletIds: ["ibm-only"] }],
        })
      ).status,
    ).toBe(422);
  });
  it("requires token, stores only its hash, and excludes private metadata from HTML", async () => {
    const { resume } = await fixture();
    await request("/api/applications", "POST", {
      resume_uuid: resume.uuid,
      company: "McKinsey",
      role: "Engineer",
      recruiter_name: "PRIVATE RECRUITER",
      recruiter_email: "private@example.com",
      notes: "PRIVATE NOTES",
    });
    const link = await share(resume.uuid, { label: "PRIVATE LABEL" });
    const path = new URL(link.url).pathname;
    const raw = path.split("/").at(-1) ?? "";
    const saved = sqlite.prepare("SELECT * FROM share_links").get();
    expect(saved?.token_hash).toBe(await sha256(raw));
    expect(JSON.stringify(saved)).not.toContain(raw);
    const listing = await (await request(`/api/resumes/${resume.uuid}/shares`)).text();
    expect(listing).not.toContain("token_hash");
    expect(listing).not.toContain(raw);
    expect((await request(`/r/${resume.uuid}`, "GET", undefined, false)).status).toBe(404);
    expect(
      (await request(`/r/${resume.uuid}/${randomToken()}`, "GET", undefined, false)).status,
    ).toBe(404);
    const response = await request(path, "GET", undefined, false);
    const html = await response.text();
    expect(html).toContain("View PDF");
    expect(html).toContain("Print");
    expect(html.indexOf("Improved caching")).toBeLessThan(html.indexOf("Built healthcare APIs"));
    for (const text of [
      "PRIVATE NOTES",
      "PRIVATE RECRUITER",
      "private@example.com",
      "PRIVATE LABEL",
      "token_hash",
    ])
      expect(html).not.toContain(text);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
  it("atomically consumes each HTML/PDF request and enforces revocation/expiry/UUID binding", async () => {
    const { resume } = await fixture();
    const link = await share(resume.uuid, { max_views: 2 });
    const path = new URL(link.url).pathname;
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(path, "GET", undefined, false)),
    );
    expect(responses.filter((r) => r.status === 200)).toHaveLength(2);
    expect((await request(`${path}/resume.pdf`, "GET", undefined, false)).status).toBe(404);
    const unlimited = await share(resume.uuid);
    expect(
      (
        await request(
          new URL(unlimited.url).pathname.replace(resume.uuid, crypto.randomUUID()),
          "GET",
          undefined,
          false,
        )
      ).status,
    ).toBe(404);
    await request(`/api/shares/${unlimited.id}/revoke`, "POST");
    expect((await request(new URL(unlimited.url).pathname, "GET", undefined, false)).status).toBe(
      404,
    );
    expect(
      (await request(new URL(unlimited.pdf_url).pathname, "GET", undefined, false)).status,
    ).toBe(404);
    const expired = await share(resume.uuid, { expires: "1d" });
    sqlite
      .prepare("UPDATE share_links SET expires_at = ? WHERE id = ?")
      .run("2000-01-01T00:00:00.000Z", expired.id);
    expect((await request(new URL(expired.url).pathname, "GET", undefined, false)).status).toBe(
      404,
    );
  });
  it("keeps submitted versions, canonical revisions and selections immutable", async () => {
    const { resume, payload } = await fixture();
    const app = (await (
      await request("/api/applications", "POST", {
        resume_uuid: resume.uuid,
        company: "McKinsey",
        role: "Engineer",
        status: "applied",
      })
    ).json()) as { uuid: string };
    const link = await share(resume.uuid);
    const edited = await request(`/api/resumes/${resume.uuid}`, "PATCH", {
      summary: "NEW SUMMARY",
    });
    expect(edited.status).toBe(201);
    const next = (await edited.json()) as { uuid: string; version: number; parent_version: string };
    expect(next.uuid).not.toBe(resume.uuid);
    expect(next.version).toBe(2);
    expect(next.parent_version).toBe(resume.id);
    const laterCareer = structuredClone(career);
    laterCareer.experience[0].bullets[0].text = "CHANGED CANONICAL TEXT";
    await request("/api/career", "POST", laterCareer);
    const html = await (await request(new URL(link.url).pathname, "GET", undefined, false)).text();
    expect(html).toContain("Built healthcare APIs");
    expect(html).not.toContain("CHANGED CANONICAL TEXT");
    expect(html).not.toContain("NEW SUMMARY");
    expect(
      (await request(`/api/applications/${app.uuid}`, "PATCH", { resume_uuid: next.uuid })).status,
    ).toBe(400);
    expect(
      ((await (await request("/api/applications")).json()) as { resume_version: number }[])[0]
        .resume_version,
    ).toBe(1);
    expect(() =>
      sqlite
        .prepare("UPDATE experience_bullets SET text = 'change' WHERE revision_id = ?")
        .run(payload.revision_id),
    ).toThrow("Immutable");
    expect(() =>
      sqlite
        .prepare("DELETE FROM resume_variant_bullets WHERE resume_variant_id = ?")
        .run(resume.id),
    ).toThrow("sealed");
    expect(() =>
      sqlite.prepare("UPDATE resume_variants SET summary = 'change' WHERE id = ?").run(resume.id),
    ).toThrow("new resume version");
    expect(() =>
      sqlite
        .prepare("UPDATE applications SET resume_variant_id = ? WHERE uuid = ?")
        .run(next.uuid, app.uuid),
    ).toThrow("immutable");
  });
  it("escapes HTML, uses print CSS, returns ephemeral PDF and closes browser", async () => {
    const { resume } = await fixture();
    const updated = (await (
      await request(`/api/resumes/${resume.uuid}`, "PATCH", {
        summary: '<img src="https://evil.test/track"><script>alert(1)</script>',
      })
    ).json()) as { uuid: string };
    const html = await (await request(`/api/resumes/${updated.uuid}/render/html`)).text();
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<img src="https://evil');
    const pdf = await request(`/api/resumes/${updated.uuid}/render/pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    expect(pdf.headers.get("cache-control")).toBe("private, no-store");
    expect(await pdf.arrayBuffer()).toBeTruthy();
    expect(browser.pdf).toHaveBeenCalledWith(
      expect.objectContaining({ format: "Letter", preferCSSPageSize: true }),
    );
    expect(browser.pdf.mock.calls[0][0]).not.toHaveProperty("path");
    expect(browser.setContent.mock.calls[0][0]).not.toContain("/r/");
    expect(browser.setRequestInterception).toHaveBeenCalledWith(true);
    expect(browser.close).toHaveBeenCalledOnce();
    browser.pdf.mockRejectedValue(new Error("sensitive request URL"));
    const failed = await request(`/api/resumes/${resume.uuid}/render/pdf`);
    expect(failed.status).toBe(500);
    expect(await failed.text()).not.toContain("sensitive");
    expect(browser.close).toHaveBeenCalledTimes(2);
  });
  it("validates actual federal page count for PDF and HTML without truncation", async () => {
    const { payload } = await fixture();
    const federal = (await (
      await request("/api/resumes", "POST", { ...payload, template: "federal" })
    ).json()) as { uuid: string };
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.addPage();
    expect(await validatePdf(await doc.save(), "federal")).toBe(2);
    doc.addPage();
    browser.pdf.mockResolvedValue(await doc.save());
    expect((await request(`/api/resumes/${federal.uuid}/render/pdf`)).status).toBe(422);
    expect((await request(`/api/resumes/${federal.uuid}/render/html`)).status).toBe(422);
    expect(await validatePdf(await doc.save(), "standard")).toBe(3);
  });
  it("supports application updates without changing the submitted resume", async () => {
    const { resume } = await fixture();
    const app = (await (
      await request("/api/applications", "POST", {
        resume_uuid: resume.uuid,
        company: "McKinsey",
        role: "Engineer",
      })
    ).json()) as { uuid: string };
    const update = await request(`/api/applications/${app.uuid}`, "PATCH", {
      status: "applied",
      notes: "Private follow-up",
    });
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({
      resume_variant_id: resume.id,
      status: "applied",
      applied_at: expect.any(String),
    });
    expect(
      (await request(`/api/resumes/${resume.uuid}`, "PATCH", { unexpected: "field" })).status,
    ).toBe(400);
  });
});
