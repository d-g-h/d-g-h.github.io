<template>
  <ResumeJobs/>
</template>

<script>
import ResumeJobs from './components/ResumeJobs.vue'

export default {
  name: 'App',
  components: {
    ResumeJobs,
  }
}
</script>

<style>
@import './assets/global.css';

#app {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
