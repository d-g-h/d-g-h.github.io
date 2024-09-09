import { Metadata } from "next";
import labors from "@/public/labors.json";
import education from "@/public/education.json";
import Description from "@/components/Description";
import Header from "@/components/Header";
import Labor from "@/components/Labor";
import styles from "@/app/page.module.css";

export const metadata: Metadata = {
  title: "⇗💻",
  description: "❤️",
};

export default function Home() {
  return (
    <div className={styles.resume}>
      <Header />
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
