import Link from "next/link";
import { Metadata } from "next";
import labors from "../public/labors.json";
import Description from "../components/description";
import Labor from "../components/labor";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "💻",
  description: "❤️",
};

export default function Home() {
  return (
    <div className={styles.resume}>
      <header>
        <h1 className={styles.name}>
          <Link href="https://github.com/d-g-h">Dave Hall</Link>
        </h1>
      </header>
      <div className={styles.sub}>
        <div>
          <Link href="mailto:daveghall@gmail.com" className={styles.email}>
            daveghall@gmail.com
          </Link>
        </div>
        <div>
          <Link href="https://www.linkedin.com/in/d-g-h/">
            linkedin/in/d-g-h
          </Link>
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
                  {labor.descriptions.map((description, j) => (
                    <Description
                      key={j}
                      description={description.description}
                    ></Description>
                  ))}
                </ul>
              </Labor>
            ))}
          </ul>
        </div>
        <div>
          <div className={styles.title}>Education</div>
          <ul className={styles.sub}>
            <li>Brooklyn College, Information Systems</li>
            <li>City College of New York, General Psychology, MA</li>
            <li>Binghamton University, Psychology, BA</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
