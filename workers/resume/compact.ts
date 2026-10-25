import { escapeHtml as e } from "./html";
import type { ResumeModel } from "./store";

export function renderCompactHtml(model: ResumeModel, pdfHref?: string): string {
  const { resume, profile, experience, skills, education } = model;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>${e(profile.name)} — ${e(resume.title)}</title>
<style>
@page { size: Letter; margin: 0.42in 0.5in; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; background: #fff; font: 10pt/1.2 Arial, Helvetica, sans-serif; }
main { max-width: 7.5in; margin: 24px auto; padding: 0 12px; }
h1 { font-size: 21pt; line-height: 1.05; margin: 0 0 3px; }
.target { font-size: 11pt; font-weight: bold; margin: 0 0 4px; }
.contact { font-size: 9pt; margin: 0 0 7px; }
.summary { margin: 0 0 7px; }
h2 { font-size: 10.5pt; margin: 9px 0 4px; padding-bottom: 2px; border-bottom: 1px solid #777; break-after: avoid; }
.experience-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 7px 0 3px; break-inside: avoid; break-after: avoid; }
h3 { font-size: 10pt; margin: 0; }
.dates { margin: 0; font-size: 8.5pt; white-space: nowrap; }
ul { margin: 0 0 4px; padding-left: 15px; }
li { margin: 0 0 2px; break-inside: avoid; orphans: 2; widows: 2; }
p { margin: 0; orphans: 2; widows: 2; }
nav { max-width: 7.5in; margin: 16px auto; padding: 10px; border: 1px solid #aaa; }
nav a, nav button { margin-right: 16px; color: #111; }
@media print { nav { display: none; } main { max-width: none; margin: 0; padding: 0; } a { color: inherit; text-decoration: none; } }
</style></head><body>${pdfHref ? `<nav aria-label="Resume actions"><a href="${e(pdfHref)}" rel="nofollow">View PDF</a><button type="button" id="print">Print</button></nav>` : ""}<main>
<header><h1>${e(profile.name)}</h1><p class="target">${e(resume.title)}</p><p class="contact">${[profile.email, profile.phone, profile.location, profile.website, profile.linkedin].filter(Boolean).map(e).join(" · ")}</p></header>
${resume.summary ? `<p class="summary">${e(resume.summary)}</p>` : ""}
<section><h2>Experience</h2>${experience.map((job) => `<article><div class="experience-heading"><h3>${e(job.role)}${job.company ? ` — ${e(job.company)}` : ""}</h3><p class="dates">${e(job.location)} · ${e(job.start_date)} – ${e(job.end_date ?? "Present")}${resume.template === "federal" ? ` · ${e(job.hours_per_week)} hours/week` : ""}</p></div><ul>${job.bullets.map((bullet) => `<li>${e(bullet.text)}</li>`).join("")}</ul></article>`).join("")}</section>
${skills.length ? `<section><h2>Skills</h2><p>${skills.map((skill) => e(skill.name)).join("; ")}</p></section>` : ""}
${education.length ? `<section><h2>Education</h2><p>${education.map((item) => e(item.name)).join(" · ")}</p></section>` : ""}
</main>${pdfHref ? '<script src="/assets/print.js" defer></script>' : ""}</body></html>`;
}
