<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
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
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

const stencilProps = computed(() =>
  selectedRatio.value.value !== undefined
    ? { aspectRatio: selectedRatio.value.value }
    : {},
)

function close() {
  selectedRatio.value = FREE_RATIO
  emit('update:open', false)
}

function onConfirm() {
  if (!cropperRef.value) return
  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return
  const mime = props.mimeType ?? 'image/jpeg'
  canvas.toBlob(
    (blob) => {
      if (!blob) return
      const file = new File([blob], props.fileName ?? 'image.jpg', { type: mime })
      emit('confirm', file)
      selectedRatio.value = FREE_RATIO
    },
    mime,
    0.92,
  )
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && close()">
    <DialogContent class="sm:max-w-2xl gap-4 max-h-[90vh] overflow-y-auto">
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
        <Cropper
          ref="cropperRef"
          :key="imageSrc"
          :src="imageSrc"
          :stencil-props="stencilProps"
          style="height: 100%; width: 100%;"
        />
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="close">キャンセル</Button>
        <Button @click="onConfirm">クロップして使用</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cropper-host {
  height: 360px;
  max-height: 50vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.cropper-host :deep(.vue-advanced-cropper) {
  height: 100%;
  width: 100%;
}
</style>
