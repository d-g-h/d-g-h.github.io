import styles from "@/components/Header/header.module.css";
import shortenerLink from "@/lib/utils/shortenerLink";
import { svgStringToElement } from "@/lib/utils/svg";

type HeaderProps = {
  phone?: boolean;
  text?: string;
};

export default function Header({ phone, text }: Readonly<HeaderProps>) {
  return (
    <header>
      <div className={styles.container}>
        {text && <div className={styles.qr}>{svgStringToElement(text)}</div>}
        <h1 className={styles.name}>
          <a href={process.env.NEXT_PUBLIC_GITHUB ?? "#"}>
            {process.env.NEXT_PUBLIC_NAME ?? "Name"}
          </a>
        </h1>
      </div>
      <div className={`${styles.sub} ${styles.links}`}>
        <div>
          <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL ?? ""}`}>
            {process.env.NEXT_PUBLIC_EMAIL ?? "email@example.com"}
          </a>
        </div>
        <div>
          <a href={process.env.NEXT_PUBLIC_LINKEDIN ?? "#"}>
            {shortenerLink({
              url: process.env.NEXT_PUBLIC_LINKEDIN ?? "#",
              link: "linkedin.com",
            })}
          </a>
        </div>
        <div>
          <a href={process.env.NEXT_PUBLIC_GITHUB ?? "#"}>
            {shortenerLink({
              url: process.env.NEXT_PUBLIC_GITHUB ?? "#",
              link: "github.com",
            })}
          </a>
        </div>
        {phone && process.env.NEXT_PUBLIC_PHONE && (
          <div>
            <a href={`tel:+1${process.env.NEXT_PUBLIC_PHONE}`}>{process.env.NEXT_PUBLIC_PHONE}</a>
          </div>
        )}
      </div>
    </header>
  );
}
