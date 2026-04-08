<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src: string
  description?: string
}>()

const route = useRoute()

const resolvedSrc = computed(() => {
  const src = props.src
  if (!src || src.startsWith('/') || /^https?:\/\//.test(src)) return src
  const base = route.path.endsWith('/') ? route.path : route.path + '/'
  return base + src
})

const embedUrl = computed(() => {
  const src = resolvedSrc.value
  if (!src) return ''

  // YouTube
  const youtubeMatch = src.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  )
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Niconico
  const niconicoMatch = src.match(/(?:nicovideo\.jp\/watch\/|nico\.ms\/)((?:sm|nm|so)\d+)/)
  if (niconicoMatch) {
    return `https://embed.nicovideo.jp/watch/${niconicoMatch[1]}`
  }

  return null
})

const isNative = computed(() => {
  const src = resolvedSrc.value
  if (!src) return false
  return /\.(mp4|webm|ogg|mov)$/i.test(src) || src.startsWith('/')
})
</script>

<template>
  <div class="my-8">
    <div
      :class="[
        'relative w-full rounded-lg overflow-hidden shadow-lg bg-black',
        isNative ? '' : 'aspect-video',
      ]"
    >
      <video
        v-if="isNative"
        :src="resolvedSrc"
        controls
        playsinline
        preload="metadata"
        class="w-full h-auto !m-0 !p-0 block"
      ></video>
      <iframe
        v-else-if="embedUrl"
        :src="embedUrl"
        class="absolute top-0 left-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
      <div v-else class="flex items-center justify-center w-20 h-full text-white">
        Invalid Video URL
      </div>
    </div>
    <div class="mt-2 text-md text-center text-muted-foreground">
      <slot mdc-unwrap="p">{{ description }}</slot>
    </div>
  </div>
</template>
