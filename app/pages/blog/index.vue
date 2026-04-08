<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Plus, ImageIcon, BookText } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

type SortOrder = 'newest' | 'oldest' | 'updated'

const articles = ref<any[] | null>(null)
const sortOrder = ref<SortOrder>('newest')

onMounted(async () => {
  articles.value = await $fetch<any[]>('/api/admin/blog')
})

const sortedArticles = computed(() => {
  if (!articles.value) return null
  return [...articles.value].sort((a, b) => {
    if (sortOrder.value === 'newest') return a.date < b.date ? 1 : -1
    if (sortOrder.value === 'oldest') return a.date > b.date ? 1 : -1
    return a.updatedAt < b.updatedAt ? 1 : -1
  })
})

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: '新しい順' },
  { value: 'oldest', label: '古い順' },
  { value: 'updated', label: '最終更新順' },
]
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-row items-center gap-2">
        <BookText />
        <h1 class="text-xl font-semibold">Blog</h1>
      </div>
      <Button as-child size="sm">
        <NuxtLink to="/blog/new">
          <Plus class="size-4" />
          新規作成
        </NuxtLink>
      </Button>
    </div>

    <div v-if="articles && articles.length > 0">
      <div class="flex gap-1 mb-3">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          class="px-2.5 py-1 text-xs rounded-md transition-colors"
          :class="sortOrder === opt.value
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'"
          @click="sortOrder = opt.value"
        >{{ opt.label }}</button>
      </div>
      <div class="space-y-2">
      <NuxtLink
        v-for="article in sortedArticles"
        :key="article.slug"
        :to="`/blog/${article.slug}`"
        class="flex items-center gap-3 rounded-lg border border-border bg-card p-2 hover:bg-accent transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-sm">{{ article.title }}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <p class="text-xs text-muted-foreground">{{ article.date }} · {{ article.category }}</p>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
              :class="article.draft
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'"
            >
              {{ article.draft ? 'Draft' : 'Published' }}
            </span>
          </div>
        </div>
        <div class="shrink-0 w-24 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          <img
            v-if="article.coverImage"
            :src="article.coverImage"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
          <ImageIcon v-else class="size-5 text-muted-foreground/40" />
        </div>
      </NuxtLink>
      </div>
    </div>

    <div v-else-if="articles !== null" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <p class="text-sm">記事がありません</p>
      <Button as-child size="sm" variant="outline" class="mt-4">
        <NuxtLink to="/blog/new">最初の記事を作成</NuxtLink>
      </Button>
    </div>
  </div>
</template>
