<template>
  <li class="labor">
    <div class="title">{{ title }}</div>
    <div class="company highlight">{{ company }}</div>
    <div class="location">{{ location }}</div>
    <div class="time">{{ time }}</div>
    <slot></slot>
  </li>
</template>

<script>
export default {
  name: "LaborJob",
  props: {
    title: String,
    location: String,
    company: String,
    time: String,
  },
};
</script>

<style scoped>
.labor {
  margin-bottom: 0.75rem;
}

.title {
  font-size: 1.25rem;
  font-weight: bold;
}

.time {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}
</style>
