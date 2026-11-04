import { readFile } from "node:fs/promises";

const origin = "https://d-g-h.github.io";
const resumes = JSON.parse(
  await readFile(new URL("../src/data/resumes.json", import.meta.url), "utf8"),
);
console.log(
  JSON.stringify(
    {
      index: `${origin}/resumes/`,
      career_history: `${origin}/t/`,
      printable_history: `${origin}/p/`,
      resumes: resumes.map(({ title, description, pdf, html }) => ({
        title,
        description,
        pdf: `${origin}${pdf}`,
        html: html ? `${origin}${html}` : null,
      })),
    },
    null,
    2,
  ),
);
