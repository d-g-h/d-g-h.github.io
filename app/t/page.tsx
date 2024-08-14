import { Metadata } from "next";
import labors from "@/public/labors.json";
import summary from "@/public/summary.json";
import education from "@/public/education.json";
import skills from "@/public/skills.json";
import shortenerLink from "@/lib/utils/shortenerLink";
import Description from "@/components/description";
import LaborT from "@/components/labort";
import styles from "@/app/t/page.module.css";

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

const ATS = "ATS";

export default function Home() {
  return (
    <div className={styles.resume}>
      <header>
        <h1 className={styles.name}>
          <a
            href={`${process.env.NEXT_PUBLIC_GITHUB}`}
          >{`${process.env.NEXT_PUBLIC_NAME}`}</a>
        </h1>
      </header>
      <div className={`${styles.sub} ${styles.links}`}>
        <div>
          <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>
            {process.env.NEXT_PUBLIC_EMAIL}
          </a>
        </div>
        <div>
          <a href={`${process.env.NEXT_PUBLIC_LINKEDIN}`}>
            {shortenerLink({
              url: `${process.env.NEXT_PUBLIC_LINKEDIN}`,
              link: `linkedin.com`,
            })}
          </a>
        </div>
        <div>
          <a href={`${process.env.NEXT_PUBLIC_GITHUB}`}>
            {shortenerLink({
              url: `${process.env.NEXT_PUBLIC_GITHUB}`,
              link: `github.com`,
            })}
          </a>
        </div>
        <div>
          <a href={`tel:+1${process.env.NEXT_PUBLIC_PHONE}`}>
            {process.env.NEXT_PUBLIC_PHONE}
          </a>
        </div>
      </div>
      <main>
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
        <div className={styles.footer}>
          <div className={styles.skills} style={{ textAlign: "left" }}>
            <h2
              className={styles.title}
              style={{ textDecoration: "underline" }}
            >
              Skills
            </h2>
            <ul style={{ fontSize: "0.75rem" }}>
              {skills.map((skill) =>
                skill.key === ATS ? (
                  <li key={skill.key} className={styles.ast}>
                    {skill.name}
                  </li>
                ) : (
                  <li key={skill.key}>{skill.name}</li>
                ),
              )}
            </ul>
          </div>
          <div className={styles.education}>
            <h2
              className={styles.title}
              style={{ textDecoration: "underline" }}
            >
              Education
            </h2>
            <ul className={styles.sub}>
              {education.map((education) => (
                <li key={education.key}>{education.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
