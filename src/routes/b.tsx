import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import BatchQr from "@/components/BatchQr";

export const Route = createFileRoute("/b")({
  head: () => ({
    meta: [{ title: "⇗💻" }, { name: "description", content: "❤️" }],
  }),
  component: BatchQrPage,
});

function BatchQrPage() {
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

  return <BatchQr />;
}
