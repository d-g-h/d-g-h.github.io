import { createFileRoute } from "@tanstack/react-router";
import Description from "@/components/Description";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LaborT from "@/components/LaborT";
import education from "@/src/data/education.json";
import labors from "@/src/data/labors.json";
import skills from "@/src/data/skills.json";

export const Route = createFileRoute("/p")({
  head: () => ({
    meta: [{ title: "⇗💻" }, { name: "description", content: "❤️" }],
  }),
  component: Printable,
});

function Printable() {
  const text = Route.useLoaderData();

  return (
    <div className="resume">
      <main>
        <Header phone text={text} printPdf />
        <h2 className="title" style={{ textDecoration: "underline" }}>
          Experience
        </h2>
        <div>
          <ul>
            {labors.map((labor) => (
              <LaborT
                key={labor.key}
                title={labor.title}
                location={labor.location}
                company={labor.company}
                start={labor.start}
                end={labor.end}
              >
                <ul>
                  {labor.descriptions.map((description) => (
                    <Description
                      key={`${labor.key}-${description.description}`}
                      description={description.description}
                    ></Description>
                  ))}
                </ul>
              </LaborT>
            ))}
          </ul>
        </div>
        <Footer education={education} skills={skills} />
      </main>
    </div>
  );
}
