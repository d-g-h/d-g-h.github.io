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
        <Labor
          title="Software Developer"
          location="New York, NY"
          company="Kyndryl"
          time="November 2021 - Present"
        >
        </Labor>

        <Labor
          title="Software Engineer"
          location="New York, NY"
          company="IBM"
          time="August 2018 - November 2021"
        >
          <ul>
            <Description
              description="Deliver HTML, JavaScript, & CSS to the client with Vue, and TypeScript"
            />
            <Description
              description="Create maintainable code with Functional programming and Test Driven Development"
            />
            <Description
              description="Collaborate using Agile Development Methodologies to construct software"
            />
          </ul>
        </Labor>

        <Labor
          title="Software Engineer"
          location="New York, NY"
          company="Hook & Loop at Infor"
          time="February 2016 - August 2018"
        >
          <ul>
            <Description
              description="Architect, and deliver, compiled HTML, JavaScript, & CSS via Angular, Webpack"
            />
          </ul>
        </Labor>

        <Labor
          title="Freelance Full Stack Web Developer"
          location="New York, NY"
          company="d-g-h.co"
          time="January 2009 - Present"
        >
          <ul>
            <Description
              description="Architect and plan coding solutions for responsive websites"
            />
          </ul>
        </Labor>

        <Labor
          title="Lead Developer"
          location="New York, NY"
          company="Radish Lab"
          time="December 2013 - July 2015"
        >
          <ul>
            <Description
              description="Create, and manage developer operations"
            />
            <Description
              description="Scope, manage, architect projects"
            />
            <Description
              description="Build sites, and RESTful APIs using WordPress, Node.js, ExpressJS, and AngularJS"
            />
          </ul>
        </Labor>

        <Labor
          title="Web Developer"
          location="New York, NY"
          company="Graph Paper Press"
          time="August 2012 - April 2014"
        >
          <ul>
            <Description
              description="Create and maintain environments for seamless developer operations"
            />
            <Description
              description="Offer consultation about various design, development, and business practices"
            />
            <Description
              description="Develop customized WordPress themes"
            />
            <Description
              description="Triage and respond to theme related bugs"
            />
          </ul>
        </Labor>
      </ul>
    </div>
    <div>
      <div class="title">Education</div>
      <ul>
        <li>Brooklyn College, Information Systems, MS Candidate (completed all course requirements)</li>
        <li>City College of New York, General Psychology, MA 2008</li>
        <li>Binghamton University, Psychology, BA 2005</li>
      </ul>
    </div>
  </div>
</template>

<script>
import Labor from "./Labor.vue";
import Description from "./Description.vue";

export default {
  name: "Resume",
  components: {
    Labor,
    Description,
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
