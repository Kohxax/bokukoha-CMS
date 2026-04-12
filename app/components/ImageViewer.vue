<script setup lang="ts">
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Copy } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { $imageViewer } = useNuxtApp()
const { isOpen, currentImage, close, next, prev, hasNext, hasPrev, currentIndex, images } = $imageViewer

const transitionName = ref('slide-next')
const isZoomed = ref(false)
const showControls = ref(true)
const touchStart = ref<{ x: number; y: number } | null>(null)

const handleNext = () => {
  if (isZoomed.value) return
  transitionName.value = 'slide-next'
  next()
}

const handlePrev = () => {
  if (isZoomed.value) return
  transitionName.value = 'slide-prev'
  prev()
}

const toggleZoom = () => { isZoomed.value = !isZoomed.value }
const toggleControls = () => { showControls.value = !showControls.value }

watch(currentImage, () => {
  isZoomed.value = false
  showControls.value = true
})

watch(isOpen, (val) => {
  if (import.meta.client) document.body.style.overflow = val ? 'hidden' : ''
})

const handleTouchStart = (e: TouchEvent) => {
  if (isZoomed.value || e.touches.length === 0) return
  touchStart.value = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY }
}

const handleTouchEnd = (e: TouchEvent) => {
  const start = touchStart.value
  if (!start || isZoomed.value || e.changedTouches.length === 0) return
  const deltaX = e.changedTouches[0]!.clientX - start.x
  const deltaY = e.changedTouches[0]!.clientY - start.y
  if (deltaY > 100 && Math.abs(deltaX) < 80) { close(); touchStart.value = null; return }
  if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
    deltaX > 0 ? handlePrev() : handleNext()
  }
  touchStart.value = null
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') handleNext()
  else if (e.key === 'ArrowLeft') handlePrev()
  else if (e.key === ' ') { e.preventDefault(); toggleZoom() }
}

async function copyUrl() {
  if (!currentImage.value) return
  await navigator.clipboard.writeText(currentImage.value.src)
  toast.success('URLをコピーしました')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen && currentImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      @click="close"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-show="showControls" class="contents">
          <!-- カウンター -->
          <div class="absolute top-4 left-4 px-4 py-2 text-white/90 bg-black/20 rounded-full backdrop-blur-md z-20 font-medium select-none text-sm">
            {{ currentIndex + 1 }} / {{ images.length }}
          </div>

          <!-- URLコピー -->
          <button
            class="absolute top-4 right-28 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-20 backdrop-blur-md"
            @click.stop="copyUrl"
          >
            <Copy class="w-6 h-6" />
          </button>

          <!-- ズーム -->
          <button
            class="absolute top-4 right-16 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-20 backdrop-blur-md"
            @click.stop="toggleZoom"
          >
            <ZoomIn v-if="!isZoomed" class="w-6 h-6" />
            <ZoomOut v-else class="w-6 h-6" />
          </button>

          <!-- 閉じる -->
          <button
            class="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-20 backdrop-blur-md"
            @click.stop="close"
          >
            <X class="w-6 h-6" />
          </button>

          <!-- 前へ -->
          <button
            v-if="hasPrev"
            class="absolute left-2 md:left-4 p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-20 backdrop-blur-md hover:scale-110"
            @click.stop="handlePrev"
          >
            <ChevronLeft class="w-8 h-8 md:w-10 md:h-10" />
          </button>

          <!-- 次へ -->
          <button
            v-if="hasNext"
            class="absolute right-2 md:right-4 p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-20 backdrop-blur-md hover:scale-110"
            @click.stop="handleNext"
          >
            <ChevronRight class="w-8 h-8 md:w-10 md:h-10" />
          </button>

          <!-- ファイル名 -->
          <div class="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-20">
            <span class="inline-block bg-black/60 text-white/80 px-5 py-2 rounded-full text-xs backdrop-blur-md max-w-[90vw] truncate">
              {{ currentImage.alt }}
            </span>
          </div>
        </div>
      </Transition>

      <!-- 画像エリア -->
      <div
        class="relative w-full h-full flex items-center justify-center overflow-hidden"
        :class="{ 'cursor-zoom-in': !isZoomed, 'cursor-zoom-out': isZoomed }"
        @click.stop="toggleControls"
      >
        <Transition :name="transitionName" mode="out-in">
          <img
            :key="currentImage.src"
            :src="currentImage.src"
            :alt="currentImage.alt"
            class="max-w-full max-h-full object-contain rounded-md shadow-2xl select-none transition-transform duration-300 ease-in-out"
            :class="{ 'scale-[2] cursor-move': isZoomed }"
            @click.stop="toggleControls"
          />
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.2s ease;
}
.slide-next-enter-from { opacity: 0; transform: translateX(20px); }
.slide-next-leave-to  { opacity: 0; transform: translateX(-20px); }
.slide-prev-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-prev-leave-to  { opacity: 0; transform: translateX(20px); }
</style>
