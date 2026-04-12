export default defineNuxtPlugin(() => {
  const isOpen = useState<boolean>('image-viewer-is-open', () => false)
  const currentIndex = useState<number>('image-viewer-index', () => 0)
  const images = useState<{ src: string; alt: string }[]>('image-viewer-images', () => [])

  const open = (src: string) => {
    const index = images.value.findIndex((img) => img.src === src)
    if (index !== -1) {
      currentIndex.value = index
      isOpen.value = true
    }
  }

  const close = () => { isOpen.value = false }

  const next = () => {
    if (currentIndex.value < images.value.length - 1) currentIndex.value++
  }

  const prev = () => {
    if (currentIndex.value > 0) currentIndex.value--
  }

  return {
    provide: {
      imageViewer: {
        isOpen,
        currentIndex,
        images,
        currentImage: computed(() => images.value[currentIndex.value]),
        open,
        close,
        next,
        prev,
        hasNext: computed(() => currentIndex.value < images.value.length - 1),
        hasPrev: computed(() => currentIndex.value > 0),
      },
    },
  }
})
