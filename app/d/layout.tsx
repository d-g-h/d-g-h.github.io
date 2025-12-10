import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/d" style={navLinkStyle}>
          Routes
        </Link>
        <Link href="/d/floor" style={navLinkStyle}>
          Build
        </Link>
      </nav>
      {children}
    </div>
  );
}

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#fff",
  color: "#000",
  padding: "1rem",
  display: "grid",
  gap: "0.75rem",
};

const navStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  flexWrap: "wrap",
};

const navLinkStyle: CSSProperties = {
  display: "inline-flex",
  margin: 0,
  textDecoration: "none",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  borderRadius: "999px",
  padding: "0.25rem 0.625rem",
  fontWeight: 700,
  color: "oklch(from #2563eb l c h)",
  background: "oklch(from #f8fafc l c h)",
};
