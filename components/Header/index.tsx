import styles from "@/components/Header/header.module.css";
import shortenerLink from "@/lib/utils/shortenerLink";

type HeaderProps = {
  phone?: boolean;
  text?: string;
  printPdf?: boolean;
};

export default function Header({ phone, text, printPdf }: Readonly<HeaderProps>) {
  const name = process.env.NEXT_PUBLIC_NAME ?? "Name";
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB ?? "#";
  const emailText = process.env.NEXT_PUBLIC_EMAIL ?? "email@example.com";
  const emailHref = process.env.NEXT_PUBLIC_EMAIL ?? "";
  const linkedInUrl = process.env.NEXT_PUBLIC_LINKEDIN ?? "#";
  const githubLabel = shortenerLink({ url: githubUrl, link: "github.com" });
  const linkedInLabel = shortenerLink({ url: linkedInUrl, link: "linkedin.com" });

  return (
    <header>
      <div className={styles.container}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from trusted source */}
        {text && <div className={styles.qr} dangerouslySetInnerHTML={{ __html: text }} />}
        <h1 className={styles.name}>
          {printPdf ? <span>{name}</span> : <a href={githubUrl}>{name}</a>}
        </h1>
      </div>
      <div className={`${styles.sub} ${styles.links}`}>
        <div>
          {printPdf ? <span>{emailText}</span> : <a href={`mailto:${emailHref}`}>{emailText}</a>}
        </div>
        <div>
          {printPdf ? <span>{linkedInLabel}</span> : <a href={linkedInUrl}>{linkedInLabel}</a>}
        </div>
        <div>{printPdf ? <span>{githubLabel}</span> : <a href={githubUrl}>{githubLabel}</a>}</div>
        {phone && process.env.NEXT_PUBLIC_PHONE && (
          <div>
            {printPdf ? (
              <span>{process.env.NEXT_PUBLIC_PHONE}</span>
            ) : (
              <a href={`tel:+1${process.env.NEXT_PUBLIC_PHONE}`}>{process.env.NEXT_PUBLIC_PHONE}</a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
