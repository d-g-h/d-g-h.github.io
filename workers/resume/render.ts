import puppeteer from "@cloudflare/puppeteer";
import { PDFDocument } from "pdf-lib";
import { renderCompactHtml } from "./compact";
import { escapeHtml } from "./html";
import type { ResumeModel } from "./store";
import { HttpError } from "./validation";

export type BrowserBinding = Parameters<typeof puppeteer.launch>[0];
export { escapeHtml } from "./html";
// Version 1 is immutable: add a new renderer/version for future layout changes.
export function renderHtml(model: ResumeModel, pdfHref?: string): string {
  if (model.resume.template_version === "2") return renderCompactHtml(model, pdfHref);
  if (model.resume.template_version !== "1")
    throw new HttpError(422, "Unsupported template version");
  const { resume, profile, experience, skills, education } = model;
  const e = escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>${e(profile.name)} — ${e(resume.title)}</title>
<style>
@page { size: Letter; margin: 0.55in 0.6in; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; background: #fff; font: 11pt/1.3 Arial, Helvetica, sans-serif; }
main { max-width: 7.3in; margin: 24px auto; padding: 0 12px; }
h1 { font-size: 21pt; line-height: 1.15; margin: 0 0 5px; }
h2 { font-size: 12pt; margin: 14px 0 6px; border-bottom: 1px solid #444; padding-bottom: 3px; break-after: avoid; }
h3 { font-size: 11pt; margin: 9px 0 2px; break-after: avoid; }
p { margin: 4px 0 8px; white-space: pre-line; orphans: 3; widows: 3; }
ul { margin: 4px 0 9px; padding-left: 18px; }
li { margin: 0 0 4px; break-inside: avoid; orphans: 2; widows: 2; }
.contact, .dates { font-size: 10pt; }
.experience-heading { break-inside: avoid; break-after: avoid; }
nav { max-width: 7.3in; margin: 20px auto; padding: 12px; border: 1px solid #bbb; font-size: 10pt; }
nav a, nav button { margin-right: 18px; color: #111; }
nav p { margin: 8px 0 0; }
@media print { nav { display: none; } main { max-width: none; margin: 0; padding: 0; } a { color: inherit; text-decoration: none; } }
</style></head><body>${pdfHref ? `<nav aria-label="Resume actions"><a href="${e(pdfHref)}" rel="nofollow">View PDF</a><button type="button" id="print">Print</button><p>${e(resume.role)} · ${e(resume.company)}</p></nav>` : ""}<main>
<header><h1>${e(profile.name)}</h1><p class="contact">${[profile.email, profile.phone, profile.location, profile.website, profile.linkedin].filter(Boolean).map(e).join(" · ")}</p></header>
${resume.summary ? `<section><h2>Summary</h2><p>${e(resume.summary)}</p></section>` : ""}
<section><h2>Experience</h2>${experience.map((job) => `<article><div class="experience-heading"><h3>${e(job.role)}${job.company ? ` — ${e(job.company)}` : ""}</h3><p class="dates">${e(job.location)} · ${e(job.start_date)} – ${e(job.end_date ?? "Present")}${resume.template === "federal" ? ` · ${e(job.hours_per_week)} hours/week` : ""}</p></div><ul>${job.bullets.map((b) => `<li>${e(b.text)}</li>`).join("")}</ul></article>`).join("")}</section>
${skills.length ? `<section><h2>Skills</h2><p>${skills.map((s) => e(s.name)).join("; ")}</p></section>` : ""}
${education.length ? `<section><h2>Education</h2>${education.map((item) => `<p>${e(item.name)}</p>`).join("")}</section>` : ""}
</main>${pdfHref ? '<script src="/assets/print.js" defer></script>' : ""}</body></html>`;
}
export async function validatePdf(bytes: Uint8Array, template: string): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  const count = doc.getPageCount();
  if (template === "federal" && count > 2)
    throw new HttpError(422, "Federal resume exceeds two pages; shorten the selected content");
  return count;
}
export async function renderPdf(model: ResumeModel, binding: BrowserBinding): Promise<Uint8Array> {
  const browser = await puppeteer.launch(binding);
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    // No outbound requests, trackers, fonts, or token-bearing page navigation.
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      void request.abort();
    });
    await page.emulateMediaType("print");
    await page.setContent(renderHtml(model), { waitUntil: "load", timeout: 30000 });
    const pdf = await page.pdf({
      format: "Letter",
      preferCSSPageSize: true,
      printBackground: false,
      displayHeaderFooter: false,
      tagged: true,
    });
    await validatePdf(pdf, model.resume.template);
    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
