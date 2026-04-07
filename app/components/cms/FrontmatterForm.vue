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

// Local copy to avoid controlled-input re-render issues (cursor jump / dropped chars)
const local = reactive({ ...props.modelValue })

watch(local, () => emit('update:modelValue', { ...local }), { deep: true })

// Sync from parent only when value actually differs (prevents overwriting local state)
watch(() => props.modelValue, (v) => {
  for (const k in v) {
    const key = k as keyof Frontmatter
    if (JSON.stringify(v[key]) !== JSON.stringify(local[key])) {
      (local as any)[key] = v[key]
    }
  }
}, { deep: true })

// Tags: display as comma-separated string, parse only on blur to avoid mid-type transforms
const tagsRaw = ref(local.tags.join(', '))
watch(() => local.tags, (tags) => {
  const joined = tags.join(', ')
  if (joined !== tagsRaw.value) tagsRaw.value = joined
})
function onTagsBlur() {
  local.tags = tagsRaw.value
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
}
</script>

<template>
  <div class="space-y-4">
    <!-- title -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タイトル <span class="text-destructive">*</span></label>
      <Input
        v-model="local.title"
        placeholder="記事タイトル"
      />
    </div>

    <!-- date + category row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-sm font-medium">日付 <span class="text-destructive">*</span></label>
        <Input
          v-model="local.date"
          type="date"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">カテゴリ <span class="text-destructive">*</span></label>
        <Input
          v-model="local.category"
          placeholder="カテゴリ"
        />
      </div>
    </div>

    <!-- tags -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タグ</label>
      <Input
        v-model="tagsRaw"
        placeholder="タグをカンマ区切りで入力（例: Vue, Nuxt, TypeScript）"
        @blur="onTagsBlur"
      />
    </div>

    <!-- coverImage -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">カバー画像URL <span class="text-destructive">*</span></label>
      <Input
        v-model="local.coverImage"
        placeholder="https://images.bokukoha.dev/..."
      />
      <ImageUploader
        :collection="collection"
        :slug="slug"
        @uploaded="local.coverImage = $event"
      />
    </div>

    <!-- description -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">説明 <span class="text-destructive">*</span></label>
      <Textarea
        v-model="local.description"
        placeholder="記事の説明文"
        rows="3"
      />
    </div>

    <!-- draft -->
    <div class="flex items-center gap-3">
      <Switch
        :checked="local.draft"
        @update:checked="local.draft = $event"
      />
      <label class="text-sm font-medium cursor-pointer select-none">
        下書き{{ local.draft ? '（非公開）' : 'をオフ（公開）' }}
      </label>
    </div>
  </div>
</template>
