import styles from "@/components/Header/header.module.css";
import shortenerLink from "@/lib/utils/shortenerLink";
import { publicEnv } from "@/src/env";

type HeaderProps = {
  qr?: string;
};

export default function Header({ qr }: Readonly<HeaderProps>) {
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
        <h1 className={styles.name}>
          <a href={githubUrl}>{name}</a>
        </h1>
      </div>
      <div className={`sub ${styles.links}`}>
        <div>
          <a href={`mailto:${emailHref}`}>{emailText}</a>
        </div>
        <div>
          <a href={linkedInUrl}>{linkedInLabel}</a>
        </div>
        <div>
          <a href={githubUrl}>{githubLabel}</a>
        </div>
        {phoneNumber && (
          <div>
            <a href={`tel:+1${phoneNumber}`}>{phoneNumber}</a>
          </div>
        )}
      </div>
      {qr && (
        <img
          className={styles.qr}
          src={`data:image/svg+xml,${encodeURIComponent(qr)}`}
          width={128}
          height={128}
          alt="QR code for the public resume"
        />
      )}
    </header>
  );
}
