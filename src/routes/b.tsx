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

    document.body.style.backgroundColor = "oklab(1 0 0)";
    document.body.style.color = "oklab(0 0 0)";

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  return <BatchQr />;
}
