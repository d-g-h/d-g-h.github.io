import { createFileRoute } from "@tanstack/react-router";
import Description from "@/components/Description";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Labor from "@/components/Labor";
import education from "@/public/education.json";
import labors from "@/public/labors.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "⇗💻" }, { name: "description", content: "❤️" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="resume">
      <main>
        <Header />
        <div>
          <ul>
            {labors.map((labor) => (
              <Labor
                key={labor.key}
                title={labor.title}
                location={labor.location}
                company={labor.company}
                start={labor.start}
                end={labor.end}
              >
                <ul>
                  {labor.descriptions.map((description) => (
                    <Description
                      key={`${labor.key}-${description.description}`}
                      description={description.description}
                    ></Description>
                  ))}
                </ul>
              </Labor>
            ))}
          </ul>
        </div>
        <Footer education={education} />
      </main>
    </div>
  );
}
