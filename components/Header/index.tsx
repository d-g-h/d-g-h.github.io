import styles from "@/components/Header/header.module.css";
import shortenerLink from "@/lib/utils/shortenerLink";
import { publicEnv } from "@/src/env";

type HeaderProps = {
  phone?: boolean;
  text?: string;
  printPdf?: boolean;
};

export default function Header({ phone, text, printPdf }: Readonly<HeaderProps>) {
  const name = publicEnv.name;
  const githubUrl = publicEnv.github;
  const emailText = publicEnv.email;
  const emailHref = publicEnv.email;
  const linkedInUrl = publicEnv.linkedIn;
  const phoneNumber = publicEnv.phone;
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
      <div className={`sub ${styles.links}`}>
        <div>
          {printPdf ? <span>{emailText}</span> : <a href={`mailto:${emailHref}`}>{emailText}</a>}
        </div>
        <div>
          {printPdf ? <span>{linkedInLabel}</span> : <a href={linkedInUrl}>{linkedInLabel}</a>}
        </div>
        <div>{printPdf ? <span>{githubLabel}</span> : <a href={githubUrl}>{githubLabel}</a>}</div>
        {phone && phoneNumber && (
          <div>
            {printPdf ? (
              <span>{phoneNumber}</span>
            ) : (
              <a href={`tel:+1${phoneNumber}`}>{phoneNumber}</a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
