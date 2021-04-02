<template>
  <Resume/>
</template>

<script>
import Resume from './components/Resume.vue'

export default {
  name: 'App',
  components: {
    Resume,
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
