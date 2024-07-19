import Link from "next/link";
import { Metadata } from "next";
import labors from "@/public/labors.json";
import summary from "@/public/summary.json";
import educations from "@/public/educations.json";
import skills from "@/public/skills.json";
import shortenerLink from "@/lib/utils/shortenerLink";
import Description from "@/components/description";
import LaborT from "@/components/labort";
import styles from "@/app/page.module.css";

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

export default function Home() {
  return (
    <div className={styles.resume}>
      <header>
        <h1 className={styles.name}>
          <Link
            href={`${process.env.NEXT_PUBLIC_GITHUB}`}
          >{`${process.env.NEXT_PUBLIC_NAME}`}</Link>
        </h1>
      </header>
      <div className={`${styles.sub} ${styles.links}`}>
        <div>
          <Link href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>
            {process.env.NEXT_PUBLIC_EMAIL}
          </Link>
        </div>
        <div>
          <Link href={`${process.env.NEXT_PUBLIC_LINKEDIN}`}>
            {shortenerLink({
              url: `${process.env.NEXT_PUBLIC_LINKEDIN}`,
              link: `linkedin.com`,
            })}
          </Link>
        </div>
        <div>
          <Link href={`${process.env.NEXT_PUBLIC_GITHUB}`}>
            {shortenerLink({
              url: `${process.env.NEXT_PUBLIC_GITHUB}`,
              link: `github.com`,
            })}
          </Link>
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
          <div className={styles.skills}>
            <h2
              className={styles.title}
              style={{ textDecoration: "underline" }}
            >
              Skills
            </h2>
            <ul style={{ fontSize: "0.75rem" }}>
              {skills.map((skill) => (
                <li key={skill.key}>{skill.name}</li>
              ))}
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
              {educations.map((education) => (
                <li key={education.key}>{education.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
