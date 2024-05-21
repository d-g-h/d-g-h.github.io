type DescriptionProps = {
  description: string;
};

import styles from "@/components/description/description.module.css";

export default function Description({
  description,
}: Readonly<DescriptionProps>) {
  return <li className={styles.description}>{description}</li>;
}
