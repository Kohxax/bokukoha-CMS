<script setup lang="ts">
import Cropper from 'cropperjs'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const props = defineProps<{
  open: boolean
  imageSrc: string
  originalFile?: File
  mimeType?: string
  fileName?: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  confirm: [File]
}>()

type RatioOption = { label: string; value: number | undefined }
const FREE_RATIO: RatioOption = { label: '自由', value: undefined }
const RATIOS: RatioOption[] = [
  FREE_RATIO,
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
]

const selectedRatio = ref<RatioOption>(FREE_RATIO)
const imgRef = ref<HTMLImageElement | null>(null)
let cropperInstance: Cropper | null = null

function initCropper() {
  if (!imgRef.value) return
  cropperInstance?.destroy()
  cropperInstance = new Cropper(imgRef.value, {
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.8,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    aspectRatio: selectedRatio.value.value ?? NaN,
  })
}

function destroyCropper() {
  cropperInstance?.destroy()
  cropperInstance = null
}

watch(
  () => props.open,
  (val) => {
    if (!val) {
      destroyCropper()
      selectedRatio.value = FREE_RATIO
    }
  },
)

watch(selectedRatio, (ratio) => {
  cropperInstance?.setAspectRatio(ratio.value ?? NaN)
})

function close() {
  emit('update:open', false)
}

function onConfirm() {
  if (!cropperInstance) return
  const canvas = cropperInstance.getCroppedCanvas()
  if (!canvas) return
  const mime = props.mimeType ?? 'image/jpeg'
  canvas.toBlob(
    (blob) => {
      if (!blob) return
      const file = new File([blob], props.fileName ?? 'image.jpg', { type: mime })
      emit('confirm', file)
    },
    mime,
    0.92,
  )
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && close()">
    <DialogContent class="sm:max-w-2xl gap-4">
      <DialogHeader>
        <DialogTitle>画像をクロップ</DialogTitle>
      </DialogHeader>

      <div class="flex gap-1.5 flex-wrap">
        <Button
          v-for="ratio in RATIOS"
          :key="ratio.label"
          :variant="selectedRatio.label === ratio.label ? 'default' : 'outline'"
          size="sm"
          class="h-7 px-3 text-xs"
          @click="selectedRatio = ratio"
        >
          {{ ratio.label }}
        </Button>
      </div>

      <div class="cropper-host">
        <img
          v-if="open && imageSrc"
          ref="imgRef"
          :src="imageSrc"
          alt="crop target"
          style="display: block; max-width: 100%;"
          @load="initCropper"
        >
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="close">キャンセル</Button>
        <Button
          v-if="originalFile"
          variant="secondary"
          @click="emit('confirm', originalFile)"
        >
          そのまま使用
        </Button>
        <Button @click="onConfirm">クロップして使用</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style>
@import 'cropperjs/dist/cropper.css';
</style>

<style scoped>
.cropper-host {
  height: 360px;
  max-height: 50vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  background: #111;
}
</style>
