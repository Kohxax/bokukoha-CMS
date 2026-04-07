<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import ImageUploader from '~/components/cms/ImageUploader.vue'

const props = defineProps<{
  open: boolean
  collection: string
  slug: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'insert': [markdown: string]
}>()

function onUploaded(url: string) {
  const filename = url.split('/').pop() ?? 'image'
  const alt = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
  emit('insert', `![${alt}](${url})`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>画像を挿入</DialogTitle>
      </DialogHeader>
      <ImageUploader
        :collection="collection"
        :slug="slug"
        @uploaded="onUploaded"
      />
    </DialogContent>
  </Dialog>
</template>
