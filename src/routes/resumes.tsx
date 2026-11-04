import { createFileRoute } from "@tanstack/react-router";
import Resumes from "@/components/Resumes";
import { publicEnv } from "@/src/env";

export const Route = createFileRoute("/resumes")({
  head: () => ({
    meta: [
      { title: `Resumes — ${publicEnv.name}` },
      { name: "description", content: "Current career history and saved tailored resumes." },
    ],
  }),
  component: Resumes,
});
