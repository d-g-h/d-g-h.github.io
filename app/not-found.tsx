import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error">
      <Link href="/" className="">
        😱
      </Link>
    </main>
  );
}
