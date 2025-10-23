"use client";

import { useEffect } from "react";
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

  return <Qr />;
}
