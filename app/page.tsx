import Link from "next/link";
import { Metadata } from "next";
import labors from "@/public/labors.json";
import shortenerLinkedIn from "@/lib/utils/shortenerLinkedIn";
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
          <Link href={`${process.env.NEXT_PUBLIC_GITHUB}`}>Dave Hall</Link>
        </h1>
      </header>
      <div className={styles.sub}>
        <div>
          <Link
            href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
            className={styles.email}
          >
            {process.env.NEXT_PUBLIC_EMAIL}
          </Link>
        </div>
        <div>
          <Link href={`${process.env.NEXT_PUBLIC_LINKEDIN}`}>
            {shortenerLinkedIn({url: `${process.env.NEXT_PUBLIC_LINKEDIN}`})}
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
