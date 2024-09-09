type HeaderProps = {
  phone?: boolean;
};

import shortenerLink from "@/lib/utils/shortenerLink";
import styles from "@/components/Header/header.module.css";

export default function Header({ phone }: Readonly<HeaderProps>) {
  return (
    <>
      <header>
        <h1 className={styles.name}>
          <a
            href={`${process.env.NEXT_PUBLIC_GITHUB}`}
          >{`${process.env.NEXT_PUBLIC_NAME}`}</a>
        </h1>
        <div className={`${styles.sub} ${styles.links}`}>
          <div>
            <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>
              {process.env.NEXT_PUBLIC_EMAIL}
            </a>
          </div>
          <div>
            <a href={`${process.env.NEXT_PUBLIC_LINKEDIN}`}>
              {shortenerLink({
                url: `${process.env.NEXT_PUBLIC_LINKEDIN}`,
                link: `linkedin.com`,
              })}
            </a>
          </div>
          <div>
            <a href={`${process.env.NEXT_PUBLIC_GITHUB}`}>
              {shortenerLink({
                url: `${process.env.NEXT_PUBLIC_GITHUB}`,
                link: `github.com`,
              })}
            </a>
          </div>
          {phone ? (
            <div>
              <a href={`tel:+1${process.env.NEXT_PUBLIC_PHONE}`}>
                {process.env.NEXT_PUBLIC_PHONE}
              </a>
            </div>
          ) : (
            ""
          )}
        </div>
      </header>
    </>
  );
}