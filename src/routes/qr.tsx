import { createFileRoute } from "@tanstack/react-router";
import { getQRCode } from "@/lib/utils/getQRCode";
import { publicEnv } from "@/src/env";
import styles from "@/styles/qr.module.css";

export const Route = createFileRoute("/qr")({
  loader: async () => {
    const url = new URL("/", publicEnv.url);

    return {
      href: url.href,
      host: url.host,
      qr: await getQRCode({ text: url.href, width: 256, margin: 4, color: "#000" }),
    };
  },
  component: ShareResume,
});

function ShareResume() {
  const { href, host, qr } = Route.useLoaderData();

  return (
    <main className={styles.page}>
      <h1>Share resume</h1>
      <img
        className={styles.code}
        src={`data:image/svg+xml,${encodeURIComponent(qr)}`}
        width={256}
        height={256}
        alt="QR code for the public resume"
      />
      <a href={href}>{host}</a>
    </main>
  );
}
