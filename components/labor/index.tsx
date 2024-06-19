type LaborProps = {
  title: string;
  company?: string;
  location: string;
  start: string;
  end?: string;
  children: React.ReactNode;
};

import styles from "@/components/labor/labor.module.css";
import Time from "@/components/time";

export default function Labor({
  title,
  company,
  location,
  start,
  end,
  children,
}: Readonly<LaborProps>) {
  return (
    <li className={styles.labor}>
      <div className={styles.title}>{title}</div>
      <div className={styles.highlight}>{company}</div>
      <div className={styles.location}>{location}</div>
      <div className={styles.time}>
        <Time start={start} end={end} />
      </div>
      {children}
    </li>
  );
}
