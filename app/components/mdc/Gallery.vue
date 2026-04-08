<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'

const props = defineProps<{
  images: string[]
  autoDelay?: number
}>()

// CMSプレビューでは画像URLはすべて絶対URL（R2）なのでそのまま使う
const images = props.images || []
const autoDelay = props.autoDelay ?? 5000
const currentIndex = ref(0)
const container = ref<HTMLElement | null>(null)
let intervalId: ReturnType<typeof setInterval> | null = null
const autoSlideEnabled = ref(true)

const scrollToIndex = (index: number) => {
  if (!container.value) return
  const width = container.value.clientWidth
  container.value.scrollTo({
    left: width * index,
    behavior: 'smooth',
  })
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    stopAutoSlide()
  }
}
const next = (manual = false) => {
  if (currentIndex.value < images.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
  if (manual) {
    stopAutoSlide()
  }
}

const stopAutoSlide = () => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
    autoSlideEnabled.value = false
  }
}

watch(currentIndex, (newIndex) => {
  scrollToIndex(newIndex)
})

onMounted(() => {
  scrollToIndex(currentIndex.value)
  if (images.length > 1) {
    intervalId = setInterval(() => {
      if (autoSlideEnabled.value) {
        next(false)
      }
    }, autoDelay)
  }
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="relative w-full overflow-hidden group mb-7">
    <div
      ref="container"
      class="gallery overflow-x-auto snap-x snap-mandatory flex scroll-smooth rounded-lg aspect-video"
    >
      <div
        v-for="(img, idx) in images"
        :key="idx"
        class="flex-none w-full h-full object-cover object-center snap-start"
      >
        <img
          :src="img"
          :alt="`Gallery image ${idx + 1}`"
          class="w-full h-full m-0! object-cover object-center"
        />
      </div>
    </div>

    <div class="flex justify-center gap-2 mt-3">
      <span
        v-for="(img, idx) in images"
        :key="idx"
        @click="((currentIndex = idx), stopAutoSlide())"
        :class="[
          'w-2 h-2 rounded-full transition-colors cursor-pointer',
          currentIndex === idx ? 'bg-white' : 'bg-white/50',
        ]"
      ></span>
    </div>

    <button
      v-if="currentIndex > 0"
      @click="prev"
      class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-card text-foreground p-2 rounded-full transition-opacity duration-200 opacity-50 group-hover:opacity-70 disabled:opacity-20 cursor-pointer"
    >
      <ChevronLeft />
    </button>

    <button
      v-if="images.length > 1"
      @click="next(true)"
      class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-card text-foreground p-2 rounded-full transition-opacity duration-200 opacity-40 group-hover:opacity-70 cursor-pointer"
    >
      <ChevronRight />
    </button>
  </div>
</template>

<style scoped>
.gallery {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.gallery::-webkit-scrollbar {
  display: none;
}
</style>
