type LaborTProps = {
  title: string;
  company?: string;
  location: string;
  start: string;
  end?: string;
  children: React.ReactNode;
};

import styles from "@/components/labort/labort.module.css";
import Time from "@/components/time";

export default function LaborT({
  title,
  company,
  location,
  start,
  end,
  children,
}: Readonly<LaborTProps>) {
  return (
    <li className={styles.labor}>
      <div className={styles.header}>
        <div className={styles.group}>
          <div className={styles.title}>{title}</div>
          {company ? (
            <>
              <span>,</span>
              <div className={styles.highlight}>{company}</div>
            </>
          ) : (
            ""
          )}
        </div>
        <div>
          <div className={styles.location}>{location}</div>
          <div className={styles.time}>
            <Time start={start} end={end} />
          </div>
        </div>
      </div>
      {children}
    </li>
  );
}
