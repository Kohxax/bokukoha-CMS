<script setup lang="ts">
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
})
</script>

<template>
  <figure class="my-6">
    <img
      :src="src"
      :alt="alt"
      class="content-media-frame mx-auto max-w-full transition-transform hover:scale-[1.005]"
      loading="lazy"
    />
    <figcaption v-if="alt" class="mt-2 break-words text-center text-base text-muted-foreground">
      {{ alt }}
    </figcaption>
  </figure>
</template>
