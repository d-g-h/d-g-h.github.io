<template>
  <li>{{ description }}</li>
</template>

<script>
export default {
  name: "DescriptionJob",
  props: {
    description: String,
  },
};
</script>
