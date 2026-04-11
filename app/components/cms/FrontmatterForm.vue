<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Badge } from '~/components/ui/badge'
import ImageUploader from '~/components/cms/ImageUploader.vue'
import CategoryInput from '~/components/cms/CategoryInput.vue'
import { X, Upload } from 'lucide-vue-next'

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
  categorySuggestions?: string[]
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
const imageUploader = ref<InstanceType<typeof ImageUploader>>()
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

function removeTag(index: number) {
  const newTags = model.value.tags.filter((_, i) => i !== index)
  model.value = { ...model.value, tags: newTags }
  tagsRaw.value = newTags.join(', ')
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
        <CategoryInput v-model="category" :suggestions="props.categorySuggestions" />
      </div>
    </div>

    <!-- tags -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">タグ</label>
      <Input
        v-model="tagsRaw"
        placeholder="タグ(カンマ区切り)"
        @blur="applyTags"
      />
      <div v-if="model.tags.length > 0" class="flex flex-wrap gap-1.5 pt-0.5">
        <Badge
          v-for="(tag, i) in model.tags"
          :key="tag"
          variant="secondary"
          class="gap-1 pr-1"
        >
          {{ tag }}
          <button
            type="button"
            class="rounded-full hover:bg-foreground/20 transition-colors p-0.5 -mr-0.5"
            @click="removeTag(i)"
          >
            <X class="size-2.5" />
          </button>
        </Badge>
      </div>
    </div>

    <!-- coverImage -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">カバー画像URL <span class="text-destructive">*</span></label>
      <Input v-model="coverImage" placeholder="URL" />
      <div v-if="coverImage" class="relative">
        <img
          :src="coverImage"
          alt="カバー画像プレビュー"
          class="w-full h-32 object-cover rounded-md border border-border"
        />
        <div class="absolute top-1.5 right-1.5 flex gap-1">
          <button
            type="button"
            class="flex items-center justify-center size-7 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
            title="再アップロード"
            @click="imageUploader?.openPicker()"
          >
            <Upload class="size-3.5" />
          </button>
          <button
            type="button"
            class="flex items-center justify-center size-7 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
            title="クリア"
            @click="coverImage = ''"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>
      <ImageUploader
        v-show="!coverImage"
        ref="imageUploader"
        :collection="props.collection"
        :slug="props.slug"
        @uploaded="coverImage = $event"
      />
    </div>

    <!-- description -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">説明 <span class="text-destructive">*</span></label>
      <Textarea v-model="description" placeholder="説明文" rows="3" />
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
