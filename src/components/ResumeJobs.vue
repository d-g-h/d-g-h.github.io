<template>
  <div class="resume">
    <header>
      <h1 class="name"><a href="https://github.com/d-g-h">Dave Hall</a></h1>
    </header>
    <div class="email">
      daveghall the-at-sign<span>(@)</span>gmail period<span>(.)</span>com
    </div>
    <div>
      <ul>
        <LaborJob
          title="Software Developer"
          location="New York, NY"
          company="Kyndryl"
          time="August 2021 - Present"
        >
          <ul>
            <DescriptionJob
              description="Develop single page applications using Vue, and services using TypeScript, Node.js"
            />
          </ul>
        </LaborJob>

        <LaborJob
          title="Software Engineer"
          location="New York, NY"
          company="IBM"
          time="August 2018 - August 2021"
        >
          <ul>
            <DescriptionJob
              description="Deliver HTML, JavaScript, & CSS to the client with Vue, and TypeScript"
            />
            <DescriptionJob
              description="Create maintainable code with Functional programming and Test Driven Development"
            />
            <DescriptionJob
              description="Collaborate using agile development methodologies to construct software"
            />
          </ul>
        </LaborJob>

        <LaborJob
          title="Software Engineer"
          location="New York, NY"
          company="Hook & Loop at Infor"
          time="February 2016 - August 2018"
        >
          <ul>
            <DescriptionJob
              description="Architect, and deliver, compiled HTML, JavaScript, & CSS via Angular, Webpack"
            />
          </ul>
        </LaborJob>

        <LaborJob
          title="Freelance Full Stack Web Developer"
          location="New York, NY"
          company="d-g-h.co"
          time="January 2009 - Present"
        >
          <ul>
            <DescriptionJob
              description="Architect and plan coding solutions for responsive websites"
            />
          </ul>
        </LaborJob>

        <LaborJob
          title="Lead Developer"
          location="New York, NY"
          company="Radish Lab"
          time="December 2013 - July 2015"
        >
          <ul>
            <DescriptionJob
              description="Create, and manage developer operations"
            />
            <DescriptionJob description="Scope, manage, architect projects" />
            <DescriptionJob
              description="Build sites, and RESTful APIs using WordPress, Node.js, ExpressJS, and AngularJS"
            />
          </ul>
        </LaborJob>

        <LaborJob
          title="Web Developer"
          location="New York, NY"
          company="Graph Paper Press"
          time="August 2012 - April 2014"
        >
          <ul>
            <DescriptionJob
              description="Create and maintain environments for seamless developer operations"
            />
            <DescriptionJob
              description="Offer consultation about various design, development, and business practices"
            />
            <DescriptionJob description="Develop customized WordPress themes" />
            <DescriptionJob
              description="Triage and respond to theme related bugs"
            />
          </ul>
        </LaborJob>
      </ul>
    </div>
    <div>
      <div class="title">Education</div>
      <ul>
        <li>
          Brooklyn College, Information Systems, MS Candidate (completed all
          course requirements)
        </li>
        <li>City College of New York, General Psychology, MA 2008</li>
        <li>Binghamton University, Psychology, BA 2005</li>
      </ul>
    </div>
  </div>
</template>

<script>
import LaborJob from "./LaborJob.vue";
import DescriptionJob from "./DescriptionJob.vue";

export default {
  name: "ResumeJobs",
  components: {
    LaborJob,
    DescriptionJob,
  },
};
</script>

<style scoped>
.name {
  margin: 0 0 0.25rem 0;
}
.email {
  margin-bottom: 0.75rem;
}

.title {
  font-size: 1.25rem;
  font-weight: bold;
}

.resume {
  margin: 0 auto;
  width: 85%;
}
</style>
