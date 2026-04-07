<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import ImageUploader from '~/components/cms/ImageUploader.vue'

export interface Frontmatter {
  title: string
  date: string
  category: string
  tags: string[]
  coverImage: string
  draft: boolean
  description: string
}

const props = defineProps<{
  modelValue: Frontmatter
  collection: string
  slug: string
}>()
const emit = defineEmits<{ 'update:modelValue': [Frontmatter] }>()

function update<K extends keyof Frontmatter>(key: K, value: Frontmatter[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// tags stored as array, input/output as comma-separated string
const tagsInput = computed({
  get: () => props.modelValue.tags.join(', '),
  set: (val: string) => {
    const tags = val
      .split(/[,\s]+/)
      .map(t => t.trim())
      .filter(Boolean)
    update('tags', tags)
  },
})
</script>

<template>
  <div class="space-y-4">
    <!-- title -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タイトル <span class="text-destructive">*</span></label>
      <Input
        :value="modelValue.title"
        placeholder="記事タイトル"
        @input="update('title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- date + category row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-sm font-medium">日付 <span class="text-destructive">*</span></label>
        <Input
          type="date"
          :value="modelValue.date"
          @input="update('date', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">カテゴリ <span class="text-destructive">*</span></label>
        <Input
          :value="modelValue.category"
          placeholder="カテゴリ"
          @input="update('category', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- tags -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タグ</label>
      <Input
        v-model="tagsInput"
        placeholder="タグをカンマ区切りで入力（例: Vue, Nuxt, TypeScript）"
      />
    </div>

    <!-- coverImage -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">カバー画像URL <span class="text-destructive">*</span></label>
      <Input
        :value="modelValue.coverImage"
        placeholder="https://images.bokukoha.dev/..."
        @input="update('coverImage', ($event.target as HTMLInputElement).value)"
      />
      <ImageUploader
        :collection="collection"
        :slug="slug"
        @uploaded="update('coverImage', $event)"
      />
    </div>

    <!-- description -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">説明 <span class="text-destructive">*</span></label>
      <Textarea
        :value="modelValue.description"
        placeholder="記事の説明文"
        rows="3"
        @input="update('description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <!-- draft -->
    <div class="flex items-center gap-3">
      <Switch
        :checked="modelValue.draft"
        @update:checked="update('draft', $event)"
      />
      <label class="text-sm font-medium cursor-pointer select-none">
        下書き{{ modelValue.draft ? '（非公開）' : 'をオフ（公開）' }}
      </label>
    </div>
  </div>
</template>
