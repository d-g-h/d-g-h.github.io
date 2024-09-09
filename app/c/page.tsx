import { Metadata } from "next";
import labors from "@/public/labors_c.json";
import summary from "@/public/summary.json";
import education from "@/public/education.json";
import skills from "@/public/skills.json";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Description from "@/components/Description";
import LaborT from "@/components/LaborT";
import styles from "@/app/c/page.module.css";

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

export default function Home() {
  return (
    <div className="resume">
      <main>
        <Header phone />
        <h2
          className={styles.title}
          style={{ textDecoration: "underline", marginTop: "0.75rem" }}
        >
          Summary
        </h2>
        <p style={{ fontSize: "0.75rem" }}>{summary.summary}</p>
        <h2 className={styles.title} style={{ textDecoration: "underline" }}>
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
