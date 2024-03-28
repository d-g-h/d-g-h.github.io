type DescriptionProps = {
  description: string;
};

import styles from "./description.module.css";

export default function Description({ description }: Readonly<DescriptionProps>) {
  return <li className={styles.description}>{description}</li>;
}
