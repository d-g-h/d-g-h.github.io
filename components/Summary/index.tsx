type SummaryProps = {
  summary: string;
};

import styles from "@/components/Summary/summary.module.css";

export default function Summary({ summary }: Readonly<SummaryProps>) {
  return (
    <>
      <h2 className={styles.title}>Summary</h2>
      <p className={styles.summary}>{summary}</p>
    </>
  );
}
