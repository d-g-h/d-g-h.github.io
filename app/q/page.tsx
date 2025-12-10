"use client";

import { useEffect } from "react";
import { ClearLocalStorageButton } from "@/components/ClearLocalStorageButton";
import Qr from "@/components/Qr";

export default function Page() {
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
