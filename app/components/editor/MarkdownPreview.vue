<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{ content: string }>()

const html = computed(() => {
  if (!props.content) return ''
  return marked(props.content) as string
})
</script>

<template>
  <div
    class="h-full w-full overflow-auto rounded-md border border-border bg-card p-6 prose prose-invert prose-sm max-w-none"
    v-html="html"
  />
</template>
