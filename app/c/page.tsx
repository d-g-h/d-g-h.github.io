import type { Metadata } from "next";
import Description from "@/components/Description";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LaborT from "@/components/LaborT";
import Summary from "@/components/Summary";
import education from "@/public/education.json";
import labors from "@/public/labors_c.json";
import skills from "@/public/skills.json";
import summary from "@/public/summary.json";

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

export default function Home() {
  return (
    <div className="resume">
      <main>
        <Header phone />
        <Summary summary={summary.summary} />
        <h2 className="title">Experience</h2>
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
                  {labor.descriptions.map((description, i) => (
                    <Description
                      key={`${labor.company}${i}`}
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
