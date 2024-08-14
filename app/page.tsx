import { Metadata } from "next";
import labors from "@/public/labors.json";
import education from "@/public/education.json";
import shortenerLink from "@/lib/utils/shortenerLink";
import Description from "@/components/description";
import Labor from "@/components/labor";
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
      </div>
      <main>
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
                  {labor.descriptions.map((description, i) => (
                    <Description
                      key={`${labor.company}${i}`}
                      description={description.description}
                    ></Description>
                  ))}
                </ul>
              </Labor>
            ))}
          </ul>
        </div>
        <div className={styles.footer}>
          <div className={styles.education}>
            <h2 className={styles.title}>Education</h2>
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
