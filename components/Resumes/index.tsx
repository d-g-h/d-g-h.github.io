import resumes from "@/src/data/resumes.json";
import { publicEnv } from "@/src/env";
import styles from "@/styles/resumes.module.css";

export default function Resumes() {
  return (
    <main className={styles.page}>
      <nav aria-label="Portfolio">
        <a href="/">← {publicEnv.name}</a>
      </nav>
      <h1>Resumes</h1>
      <section aria-labelledby="current-resume">
        <h2 id="current-resume">Current career history</h2>
        <p>The complete experience and skills catalog, including logistics and floorplan work.</p>
        <div className={styles.links}>
          <a href="/t">View career history</a>
          <a href="/p">Print career history</a>
        </div>
      </section>
      <section aria-labelledby="saved-resumes">
        <h2 id="saved-resumes">Saved tailored resumes</h2>
        <p>
          Previous versions prepared for specific roles. Their content is preserved as originally
          saved.
        </p>
        <ul className={styles.list}>
          {resumes.map((resume) => (
            <li key={resume.pdf}>
              <h3>{resume.title}</h3>
              <p>{resume.description}</p>
              <div className={styles.links}>
                {resume.html && <a href={resume.html}>View resume</a>}
                <a href={resume.pdf}>View PDF</a>
                <a href={resume.pdf} download>
                  Download PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
