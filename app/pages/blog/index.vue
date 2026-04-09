<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/blog/1', { replace: true })
</script>
<template></template>
