<script setup lang="ts">
definePageMeta({
  middleware: [
    'auth',
    () => navigateTo('/blog', { replace: true }),
  ],
})
</script>

<template>
  <div />
</template>
