type LaborProps = {
  title: string;
  company?: string;
  start: string;
  end?: string;
  children: React.ReactNode;
};

import styles from "@/components/labort/labort.module.css";
import Time from "@/components/time";

export default function LaborT({
  title,
  company,
  start,
  end,
  children,
}: Readonly<LaborProps>) {
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
        <div className={styles.time}>
          <Time start={start} end={end} />
        </div>
      </div>
      {children}
    </li>
  );
}
