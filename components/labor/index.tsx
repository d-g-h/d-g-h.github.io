type LaborProps = {
  title: string;
  company: string;
  location: string;
  time: string;
  children: React.ReactNode;
};

import styles from "./labor.module.css";

export default function Labor({
  title,
  company,
  location,
  time,
  children,
}: LaborProps) {
  return (
    <li className={styles.labor}>
      <div className={styles.title}>{title}</div>
      <div className={`${company === 'TED' ? styles.ted : 'highlight'}`}>{company}</div>
      <div className={styles.location}>{location}</div>
      <div className={styles.time}>{time}</div>
      {children}
    </li>
  );
}
