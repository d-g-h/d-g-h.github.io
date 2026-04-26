import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ClearLocalStorageButton } from "@/components/ClearLocalStorageButton";
import Qr from "@/components/Qr";

export const Route = createFileRoute("/q")({
  head: () => ({
    meta: [{ title: "⇗💻" }, { name: "description", content: "❤️" }],
  }),
  component: QrPage,
});

function QrPage() {
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;

    document.body.style.backgroundColor = "#FFF";
    document.body.style.color = "#000";

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ position: "fixed", top: "0.1rem", right: "0.25rem", zIndex: 100 }}>
        <ClearLocalStorageButton />
      </div>
      <Qr />
    </div>
  );
}
