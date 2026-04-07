<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/blog', { replace: true })
</script>

<template>
  <div />
</template>
