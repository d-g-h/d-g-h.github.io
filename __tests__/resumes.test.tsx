import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import Resumes from "@/components/Resumes";
import resumes from "@/src/data/resumes.json";

describe("static resumes", () => {
  it("makes current history and every saved PDF available through accessible links", () => {
    render(<Resumes />);
    expect(screen.getByRole("heading", { level: 1, name: "Resumes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View career history" })).toHaveAttribute("href", "/t");
    expect(screen.getByRole("link", { name: "Print career history" })).toHaveAttribute(
      "href",
      "/p",
    );

    const saved = screen.getByRole("region", { name: "Saved tailored resumes" });
    expect(within(saved).getAllByRole("listitem")).toHaveLength(5);
    for (const resume of resumes) {
      const heading = within(saved).getByRole("heading", { name: resume.title });
      const item = heading.closest("li");
      if (!item) throw new Error("Resume is missing its list item");
      expect(within(item).getByRole("link", { name: "View PDF" })).toHaveAttribute(
        "href",
        resume.pdf,
      );
      expect(within(item).getByRole("link", { name: "Download PDF" })).toHaveAttribute("download");
      if (resume.html)
        expect(within(item).getByRole("link", { name: "View resume" })).toHaveAttribute(
          "href",
          resume.html,
        );
    }
  });

  it("ships a real PDF and standalone HTML for every catalog link", () => {
    expect(new Set(resumes.map((resume) => resume.pdf)).size).toBe(resumes.length);
    for (const resume of resumes) {
      expect(resume.pdf).toMatch(/^\/resumes\/[a-z-]+\.pdf$/);
      const pdf = readFileSync(`public${resume.pdf}`);
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      if (resume.html) {
        expect(resume.html).toMatch(/^\/resumes\/[a-z-]+\.html$/);
        const html = readFileSync(`public${resume.html}`, "utf8");
        expect(html).toContain("<main>");
        expect(html).not.toMatch(/<script|resume\.pxl8\.ing/);
      }
    }
  });
});
