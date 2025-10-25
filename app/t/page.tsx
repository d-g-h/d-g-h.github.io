import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

export default async function Home() {
  const text = await getQRCode({
    text: `${process.env.NEXT_PUBLIC_URL}\t`,
    color: "#539bf5",
  });
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
