<script setup lang="ts">
definePageMeta({
  middleware: [
    'auth',
    () => navigateTo('/blog/page/1', { replace: true }),
  ],
})
</script>
<template>
  <div />
</template>
