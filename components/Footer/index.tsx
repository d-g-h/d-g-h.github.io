type FooterProps = {
  skills?: Skill[];
  education: Education[];
};

type Skill = {
  key: string;
  name: string;
};

type Education = {
  key: string;
  name: string;
};

import styles from "@/components/Footer/footer.module.css";

export default function Footer({ skills, education }: Readonly<FooterProps>) {
  const ATS = "ATS";
  return (
    <div className={styles.footer}>
      {skills ? (
        <div className={styles.skills} style={{ textAlign: "left" }}>
          <h2 className={styles.title} style={{ textDecoration: "underline" }}>
            Skills
          </h2>

          <ul style={{ fontSize: "0.75rem" }}>
            {skills.map((skill: Skill) =>
              skill.key === ATS ? (
                <li key={skill.key} className={styles.ast}>
                  {skill.name}
                </li>
              ) : (
                <li key={skill.key}>{skill.name}</li>
              )
            )}
          </ul>
        </div>
      ) : (
        ""
      )}
      <div className={skills ? styles.education : ""}>
        <h2 className={styles.title}>Education</h2>
        <ul className="sub">
          {education.map((education: Education) => (
            <li key={education.key}>{education.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
