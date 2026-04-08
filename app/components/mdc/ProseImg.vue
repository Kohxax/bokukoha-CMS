<script setup lang="ts">
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
})
</script>

<template>
  <figure class="my-6">
    <img
      :src="src"
      :alt="alt"
      class="rounded-lg shadow mx-auto max-w-full"
      loading="lazy"
    />
    <figcaption v-if="alt" class="text-sm text-center text-muted-foreground mt-2">
      {{ alt }}
    </figcaption>
  </figure>
</template>
