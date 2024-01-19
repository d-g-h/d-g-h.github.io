import Link from "next/link";
import { Metadata } from "next";
import Description from "../components/description";
import Labor from "../components/labor";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hire Dave",
  description: "Resume",
};

export default function Home() {
  return (
    <div className={styles.resume}>
      <header>
        <h1 className={styles.name}>
          <Link href="https://github.com/d-g-h">Dave Hall</Link>
        </h1>
      </header>
      <div>
        <Link href="mailto:daveghall@gmail.com" className={styles.email}>
          daveghall@gmail.com
        </Link>
      </div>
      <div>
        <Link href="https://www.linkedin.com/in/d-g-h/">linkedin/in/d-g-h</Link>
      </div>
      <main>
        <div>
          <ul>
            <Labor
              title="Senior Software Engineer"
              location="New York, NY"
              company="TED"
              time="November 2022 - June 2023"
            >
              <ul>
                <Description description="Add features to a single page application for Search & Video Pages (TypeScript, React, Tailwind CSS, Next.js, Ruby, Rails)"></Description>
                <Description description="Create & add components to TED UI Design System"></Description>
                <Description description="Collaborate using agile development methodologies"></Description>
              </ul>
            </Labor>
            <Labor
              title="Software Developer"
              location="New York, NY"
              company="Kyndryl"
              time="August 2021 - June 2022"
            >
              <ul>
                <Description description="Develop single page applications using Vue.js"></Description>
                <Description description="Develop backend microservices using TypeScript, & Node.js"></Description>
              </ul>
            </Labor>
            <Labor
              title="Software Engineer"
              location="New York, NY"
              company="IBM"
              time="August 2018 - August 2021"
            >
              <ul>
                <Description description="Deliver HTML, JavaScript, & CSS to the client with Vue.js, SASS, & TypeScript" />
                <Description description="Aggregate legacy APIs using Node.js, GraphQL to feed into client side components" />
                <Description description="Refactor Microservices for modularity, improving testability & readability of code" />
                <Description description="Create maintainable code with Functional programming & Test Driven Development" />
                <Description description="Collaborate using Agile Development Methodologies" />
                <Description description="Participate in hiring & onboarding processes by creating assessments & documentation" />
              </ul>
            </Labor>

            <Labor
              title="Software Engineer"
              location="New York, NY"
              company="Hook & Loop at Infor"
              time="February 2016 - August 2018"
            >
              <ul>
                <Description description="Architect, & deliver, compiled HTML, JavaScript, & CSS via React, Angular, & Webpack" />
                <Description description="Create Progressive Web Application utilizing AWS Lex with voice data, & other third party APIs" />
              </ul>
            </Labor>

            <Labor
              title="Lead Developer"
              location="New York, NY"
              company="Radish Lab"
              time="December 2013 - July 2015"
            >
              <ul>
                <Description description="Create, & manage developer operations" />
                <Description description="Build sites, & RESTful APIs using WordPress, Node.js, ExpressJS, & AngularJS" />
                <Description description="Participated hiring & onboarding processes by creating assessments & documentation" />
              </ul>
            </Labor>
          </ul>
        </div>
        <div>
          <div className={styles.title}>Education</div>
          <ul>
            <li>City College of New York, General Psychology, MA</li>
            <li>Binghamton University, Psychology, BA</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
