<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Upload, ImageIcon } from 'lucide-vue-next'

const props = defineProps<{
  collection: string
  slug: string
}>()

const emit = defineEmits<{ uploaded: [url: string] }>()

const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

const cropOpen = ref(false)
const cropSrc = ref('')
const cropMimeType = ref('image/jpeg')
const cropFileName = ref('')

function openCrop(file: File) {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = URL.createObjectURL(file)
  cropMimeType.value = file.type
  cropFileName.value = file.name
  cropOpen.value = true
}

function onCropCancel() {
  cropOpen.value = false
  URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = ''
}

async function onCropConfirm(file: File) {
  cropOpen.value = false
  URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = ''
  await uploadFile(file)
}

async function uploadFile(file: File) {
  if (!props.slug) {
    toast.error('先にslugを入力してください')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('collection', props.collection)
    formData.append('slug', props.slug)
    const { url } = await $fetch<{ url: string }>('/api/admin/media', {
      method: 'POST',
      body: formData,
    })
    emit('uploaded', url)
    toast.success('アップロードしました')
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'アップロードに失敗しました')
  } finally {
    uploading.value = false
  }
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) openCrop(file)
  ;(event.target as HTMLInputElement).value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) openCrop(file)
}

function openPicker() {
  fileInput.value?.click()
}

defineExpose({ openPicker })
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-5 transition-colors"
    :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
    @dragenter.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/jpeg,image/png,image/webp,image/gif"
      @change="onFileChange"
    >

    <ImageIcon class="size-6 text-muted-foreground" />
    <p class="text-xs text-muted-foreground text-center">
      ドラッグ&ドロップ、または
    </p>
    <Button
      type="button"
      size="sm"
      variant="outline"
      :disabled="uploading"
      @click="openPicker"
    >
      <Upload class="size-3.5" />
      {{ uploading ? 'アップロード中...' : 'ファイルを選択' }}
    </Button>
    <p class="text-xs text-muted-foreground">JPEG / PNG / WebP / GIF, 最大 10MB</p>
  </div>

  <ImageCropDialog
    :open="cropOpen"
    :image-src="cropSrc"
    :mime-type="cropMimeType"
    :file-name="cropFileName"
    @confirm="onCropConfirm"
    @update:open="(v) => { cropOpen = v; if (!v) onCropCancel() }"
  />
</template>
