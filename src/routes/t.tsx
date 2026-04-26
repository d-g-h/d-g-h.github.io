import { createFileRoute } from "@tanstack/react-router";
import Description from "@/components/Description";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LaborT from "@/components/LaborT";
import Summary from "@/components/Summary";
import { getQRCode } from "@/lib/utils/getQRCode";
import education from "@/public/education.json";
import labors from "@/public/labors.json";
import skills from "@/public/skills.json";
import summary from "@/public/summary.json";
import { publicEnv } from "@/src/env";

export const Route = createFileRoute("/t")({
  head: () => ({
    meta: [{ title: "⇗💻" }, { name: "description", content: "❤️" }],
  }),
  loader: () =>
    getQRCode({
      text: `${publicEnv.url}\t`,
      color: "#539bf5",
    }),
  component: TextResume,
});

function TextResume() {
  const text = Route.useLoaderData();

  return (
    <div className="resume">
      <main>
        <Header phone text={text} />
        <Summary summary={summary.summary} />
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
