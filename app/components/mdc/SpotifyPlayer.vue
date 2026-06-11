<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src: string
  height?: number
}>()

const embedInfo = computed(() => {
  const src = props.src?.trim()
  if (!src) return null

  // spotify:track:ID のような URI 形式
  const uriMatch = src.match(/^spotify:(track|album|playlist|artist|episode|show)\:([a-zA-Z0-9]+)/)
  if (uriMatch) {
    return { type: uriMatch[1]!, id: uriMatch[2]! }
  }

  // open.spotify.com の通常URL（ロケールプレフィックス付きにも対応）
  const urlMatch = src.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/,
  )
  if (urlMatch) {
    return { type: urlMatch[1]!, id: urlMatch[2]! }
  }

  return null
})

const embedUrl = computed(() => {
  if (!embedInfo.value) return null
  return `https://open.spotify.com/embed/${embedInfo.value.type}/${embedInfo.value.id}?utm_source=generator`
})

const embedHeight = computed(() => {
  if (props.height) return props.height
  if (!embedInfo.value) return 152
  return embedInfo.value.type === 'track' || embedInfo.value.type === 'episode' ? 152 : 352
})
</script>

<template>
  <div class="my-8">
    <iframe
      v-if="embedUrl"
      :src="embedUrl"
      :height="embedHeight"
      width="100%"
      class="w-full rounded-lg shadow-lg"
      frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    ></iframe>
    <div
      v-else
      class="flex items-center justify-center w-full h-20 rounded-lg bg-black text-white"
    >
      Invalid Spotify URL
    </div>
  </div>
</template>
