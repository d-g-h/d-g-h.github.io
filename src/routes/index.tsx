import { createFileRoute } from "@tanstack/react-router";
import Description from "@/components/Description";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Labor from "@/components/Labor";
import Summary from "@/components/Summary";
import { getQRCode } from "@/lib/utils/getQRCode";
import education from "@/src/data/education.json";
import labors from "@/src/data/labors.json";
import skills from "@/src/data/skills.json";
import summary from "@/src/data/summary.json";
import { publicEnv } from "@/src/env";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ name: "description", content: summary.summary }],
    links: [{ rel: "canonical", href: new URL("/", publicEnv.url).href }],
  }),
  loader: () =>
    getQRCode({
      text: new URL("/", publicEnv.url).href,
      width: 128,
      margin: 4,
      color: "#000",
    }),
  component: Resume,
});

function Resume() {
  const qr = Route.useLoaderData();

  return (
    <div className="resume">
      <main>
        <Header qr={qr} />
        <Summary summary={summary.summary} />
        <h2 className="title">Experience</h2>
        <div>
          <ul>
            {labors.map((labor) => (
              <Labor
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
              </Labor>
            ))}
          </ul>
        </div>
        <Footer education={education} skills={skills} />
      </main>
    </div>
  );
}
