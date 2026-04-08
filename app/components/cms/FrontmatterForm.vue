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
  collection: string
  slug: string
}>()

const model = defineModel<Frontmatter>({ required: true })

function field<K extends keyof Frontmatter>(key: K) {
  return computed({
    get: () => model.value[key],
    set: (value: Frontmatter[K]) => {
      model.value = { ...model.value, [key]: value }
    },
  })
}

const title = field('title')
const date = field('date')
const category = field('category')
const coverImage = field('coverImage')
const description = field('description')
const draftModel = field('draft')

// Tags: display as comma-separated string, parse only on blur
const tagsRaw = ref(model.value.tags.join(', '))
watch(() => model.value.tags, (tags) => {
  const joined = (tags ?? []).join(', ')
  if (joined !== tagsRaw.value) tagsRaw.value = joined
})
function applyTags() {
  model.value = {
    ...model.value,
    tags: tagsRaw.value.split(/[,\s]+/).map(t => t.trim()).filter(Boolean),
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- title -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タイトル <span class="text-destructive">*</span></label>
      <Input v-model="title" placeholder="記事タイトル" />
    </div>

    <!-- date + category row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-sm font-medium">日付 <span class="text-destructive">*</span></label>
        <Input v-model="date" type="date" />
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">カテゴリ <span class="text-destructive">*</span></label>
        <Input v-model="category" placeholder="カテゴリ" />
      </div>
    </div>

    <!-- tags -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タグ</label>
      <Input
        v-model="tagsRaw"
        placeholder="タグをカンマ区切りで入力（例: Vue, Nuxt, TypeScript）"
        @blur="applyTags"
      />
    </div>

    <!-- coverImage -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">カバー画像URL <span class="text-destructive">*</span></label>
      <Input v-model="coverImage" placeholder="https://images.bokukoha.dev/..." />
      <ImageUploader
        :collection="props.collection"
        :slug="props.slug"
        @uploaded="coverImage = $event"
      />
    </div>

    <!-- description -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">説明 <span class="text-destructive">*</span></label>
      <Textarea v-model="description" placeholder="記事の説明文" rows="3" />
    </div>

    <!-- draft -->
    <div class="flex items-center gap-3">
      <Switch v-model="draftModel" />
      <label class="text-sm font-medium cursor-pointer select-none">
        下書き{{ model.draft ? '（非公開）' : 'をオフ（公開）' }}
      </label>
    </div>
  </div>
</template>
