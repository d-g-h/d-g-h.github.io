import Link from "next/link";
import { Metadata } from 'next'
import Description from "../components/description";
import Labor from "../components/labor";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: 'Hi.reDave',
  description: 'Resume',
}

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
                <Description description="Develop single page applications using Next.js"></Description>
                <Description description="Collaborate using agile development methodologies to construct software"></Description>
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
                <Description description="Maintain backend microservices using TypeScript, and Node.js"></Description>
              </ul>
            </Labor>
            <Labor
              title="Software Engineer"
              location="New York, NY"
              company="IBM"
              time="August 2018 - August 2021"
            >
              <ul>
                <Description description="Deliver HTML, JavaScript, & CSS to the client with Vue.js, SASS, and TypeScript" />
                <Description description="Modify microservices with using Node.js, GraphQL for various APIs" />
                <Description description="Create maintainable code with Functional programming and Test Driven Development" />
                <Description description="Collaborate using agile development methodologies to construct software" />
              </ul>
            </Labor>

            <Labor
              title="Software Engineer"
              location="New York, NY"
              company="Hook & Loop at Infor"
              time="February 2016 - August 2018"
            >
              <ul>
                <Description description="Architect, and deliver, compiled HTML, JavaScript, & CSS via Angular, Webpack" />
              </ul>
            </Labor>

            <Labor
              title="Lead Developer"
              location="New York, NY"
              company="Radish Lab"
              time="December 2013 - July 2015"
            >
              <ul>
                <Description description="Create, and manage developer operations" />
                <Description description="Build sites, and RESTful APIs using WordPress, Node.js, ExpressJS, and AngularJS" />
              </ul>
            </Labor>

            <Labor
              title="Web Developer"
              location="New York, NY"
              company="Graph Paper Press"
              time="August 2012 - April 2014"
            >
              <ul>
                <Description description="Create and maintain environments for seamless developer operations" />
                <Description description="Develop customized WordPress themes" />
                <Description description="Triage and respond to theme related bugs" />
              </ul>
            </Labor>
          </ul>
        </div>
        <div>
          <div className={styles.title}>Education</div>
          <ul>
            <li>
              Brooklyn College, Information Systems, MS Candidate (completed all
              course requirements)
            </li>
            <li>City College of New York, General Psychology, MA 2008</li>
            <li>Binghamton University, Psychology, BA 2005</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
