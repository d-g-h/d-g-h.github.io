import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, parseEnv } from "node:util";
import { api } from "./client.mjs";

const [command, ...args] = process.argv.slice(2);
const { values: flags, positionals } = parseArgs({
  args,
  allowPositionals: true,
  strict: true,
  options: Object.fromEntries(
    [
      "company",
      "role",
      "file",
      "revision",
      "template",
      "summary",
      "title",
      "job-url",
      "label",
      "expires",
      "max-views",
      "resume",
      "status",
      "offset",
      "format",
    ].map((name) => [name, { type: "string" }]),
  ),
});
const segment = (value) => {
  if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("A valid ID is required");
  return encodeURIComponent(value);
};
const required = (name) => {
  if (!flags[name]) throw new Error(`--${name} is required`);
  return flags[name];
};
const jsonFile = async (path) => JSON.parse(await readFile(path, "utf8"));
const sourceCommit = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const output = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
async function importCareer() {
  if (flags.file) return api("/api/career", { method: "POST", body: await jsonFile(flags.file) });
  const root = new URL("../../", import.meta.url);
  const read = (path) => jsonFile(new URL(path, root));
  const [labors, skills, education] = await Promise.all([
    read("src/data/labors.json"),
    read("src/data/skills.json"),
    read("src/data/education.json"),
  ]);
  let local = {};
  try {
    local = parseEnv(await readFile(new URL(".env.local", root), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const env = { ...local, ...process.env };
  if (!env.VITE_NAME || !env.VITE_EMAIL)
    throw new Error("Set VITE_NAME and VITE_EMAIL or import a career JSON file with --file");
  const slug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  // Known IDs map to existing text only; no invented achievements.
  const experienceIds = { 5: "consulting", 4: "ted", 3: "kyndryl", 2: "ibm", 1: "infor" };
  const knownBullets = {
    "Designed and integrated two healthcare applications": "consulting-healthcare-api",
    "Built Cloudflare Worker services with KV caching": "consulting-cloudflare-cache",
    "Unified legacy APIs and Cassandra data": "ibm-graphql",
    "Designed and built an internal ingestion and migration tool": "kyndryl-migration",
    "Strengthened backend service reliability": "ibm-node-reliability",
  };
  const career = {
    source_commit: sourceCommit(),
    profile: {
      name: env.VITE_NAME,
      email: env.VITE_EMAIL,
      phone: env.VITE_PHONE || "",
      website: /^https?:\/\//.test(env.VITE_GITHUB ?? "") ? env.VITE_GITHUB : "",
      linkedin: /^https?:\/\//.test(env.VITE_LINKEDIN ?? "") ? env.VITE_LINKEDIN : "",
      location: "",
    },
    experience: labors.map((job) => {
      const id = experienceIds[job.key] || `experience-${job.key}`;
      return {
        id,
        company: job.company || "",
        role: job.title,
        location: job.location || "",
        start_date: job.start,
        end_date: job.end || null,
        hours_per_week: null,
        bullets: job.descriptions.map(({ description }) => ({
          id:
            Object.entries(knownBullets).find(([prefix]) => description.startsWith(prefix))?.[1] ||
            `${id}-${createHash("sha256").update(description).digest("hex").slice(0, 16)}`,
          text: description,
        })),
      };
    }),
    skills: [
      ...new Set(skills.flatMap((row) => row.name.split(",").map((s) => s.trim())).filter(Boolean)),
    ].map((name) => ({
      id: `skill-${slug(name).slice(0, 50)}-${createHash("sha256").update(name).digest("hex").slice(0, 8)}`,
      name,
    })),
    education: education.map((row) => ({ id: `education-${row.key}`, name: row.name })),
  };
  return api("/api/career", { method: "POST", body: career });
}
async function main() {
  const offset = flags.offset ? `?offset=${encodeURIComponent(flags.offset)}` : "";
  if (command === "career:import") return output(await importCareer());
  if (command === "career:list") return output(await api(`/api/career${offset}`));
  if (command === "career:show") return output(await api(`/api/career/${segment(positionals[0])}`));
  if (command === "resume:new") {
    let data;
    if (flags.file) data = await jsonFile(flags.file);
    else {
      const revisions = await api("/api/career");
      const revision = flags.revision || revisions[0]?.id;
      if (!revision) throw new Error("Import canonical data with npm run resume:import first");
      const career = await api(`/api/career/${segment(revision)}`);
      const company = required("company");
      const role = required("role");
      data = {
        revision_id: revision,
        company,
        role,
        title: flags.title || `${role} — ${company}`,
        template: flags.template || "standard",
        summary: flags.summary || "",
        job_url: flags["job-url"] || "",
        source_commit: sourceCommit(),
        experience: career.experience.map((e) => ({
          experienceId: e.id,
          bulletIds: e.bullets.map((b) => b.id),
        })),
        skill_ids: career.skills.map((s) => s.id),
        education_ids: career.education.map((e) => e.id),
      };
    }
    return output(await api("/api/resumes", { method: "POST", body: data }));
  }
  if (command === "resume:list") return output(await api(`/api/resumes${offset}`));
  if (command === "resume:show")
    return output(await api(`/api/resumes/${segment(positionals[0])}`));
  if (command === "resume:update")
    return output(
      await api(`/api/resumes/${segment(positionals[0])}`, {
        method: "PATCH",
        body: await jsonFile(required("file")),
      }),
    );
  if (command === "resume:render") {
    const format = flags.format || "pdf";
    if (!["html", "pdf"].includes(format)) throw new Error("--format must be html or pdf");
    const bytes = await api(`/api/resumes/${segment(positionals[0])}/render/${format}`, {
      binary: true,
    });
    const dir = await mkdtemp(join(tmpdir(), "private-resume-"));
    const path = join(dir, `resume.${format}`);
    await writeFile(path, bytes, { mode: 0o600 });
    process.stdout.write(`Disposable output: ${path}\nDelete it after use.\n`);
    return;
  }
  if (command === "resume:share") {
    const [action, id] = ["create", "list", "revoke"].includes(positionals[0])
      ? positionals
      : ["create", positionals[0]];
    if (action === "revoke")
      return output(await api(`/api/shares/${segment(id)}/revoke`, { method: "POST" }));
    if (action === "list") return output(await api(`/api/resumes/${segment(id)}/shares${offset}`));
    const result = await api(`/api/resumes/${segment(id)}/shares`, {
      method: "POST",
      body: {
        label: flags.label || "",
        ...(flags.expires ? { expires: flags.expires } : {}),
        ...(flags["max-views"] ? { max_views: Number(flags["max-views"]) } : {}),
      },
    });
    // This is the explicit one-time share response, never a diagnostic log.
    return output(result);
  }
  if (command === "resume:revoke")
    return output(await api(`/api/shares/${segment(positionals[0])}/revoke`, { method: "POST" }));
  if (command === "application:new")
    return output(
      await api("/api/applications", {
        method: "POST",
        body: flags.file
          ? await jsonFile(flags.file)
          : {
              resume_uuid: required("resume"),
              company: required("company"),
              role: required("role"),
              status: flags.status || "draft",
              job_url: flags["job-url"] || "",
            },
      }),
    );
  if (command === "application:list") return output(await api(`/api/applications${offset}`));
  if (command === "application:update")
    return output(
      await api(`/api/applications/${segment(positionals[0])}`, {
        method: "PATCH",
        body: await jsonFile(required("file")),
      }),
    );
  throw new Error("Unknown resume command");
}
main().catch((error) => {
  // No stacks, request URLs, config objects, or malformed file contents.
  process.stderr.write(
    `${error instanceof SyntaxError ? "Invalid metadata JSON" : error.message}\n`,
  );
  process.exitCode = 1;
});
