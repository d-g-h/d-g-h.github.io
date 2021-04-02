<template>
  <li>{{ description }}</li>
</template>

<script>
export default {
  name: 'Description',
  props: {
    description: String,
  }
}
</script>
