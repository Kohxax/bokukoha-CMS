<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Plus, ImageIcon, BookText } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const PAGE_SIZE = 7
type SortOrder = 'newest' | 'oldest' | 'updated'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => {
  const p = Number(route.params.page)
  return Number.isFinite(p) && p > 0 ? p : 1
})
const sortOrder = computed<SortOrder>(() => (route.query.sort as SortOrder) || 'newest')

const { data: articles } = await useFetch<any[]>('/api/admin/blog', { server: false })

const sortedArticles = computed(() => {
  if (!articles.value) return []
  return [...articles.value].sort((a, b) => {
    if (sortOrder.value === 'newest') return a.date < b.date ? 1 : -1
    if (sortOrder.value === 'oldest') return a.date > b.date ? 1 : -1
    return a.updatedAt < b.updatedAt ? 1 : -1
  })
})

const totalPages = computed(() =>
  sortedArticles.value.length ? Math.ceil(sortedArticles.value.length / PAGE_SIZE) : 1,
)

const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedArticles.value.slice(start, start + PAGE_SIZE)
})

watch([totalPages, articles], () => {
  if (articles.value && currentPage.value > totalPages.value) {
    router.replace(pageLink(totalPages.value))
  }
})

function sortQuery(order: SortOrder) {
  return order !== 'newest' ? { sort: order } : {}
}

function setSortOrder(order: SortOrder) {
  router.push({ path: '/blog/page/1', query: sortQuery(order) })
}

function pageLink(page: number) {
  return { path: `/blog/page/${page}`, query: sortQuery(sortOrder.value) }
}

const displayPages = computed(() => {
  const pages = new Set<number>([
    1,
    totalPages.value,
    currentPage.value,
    currentPage.value - 1,
    currentPage.value + 1,
  ])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages.value).sort((a, b) => a - b)
  const result: (number | string)[] = []
  let prev: number | null = null
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push('…')
    result.push(p)
    prev = p
  }
  return result
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
          @click="setSortOrder(opt.value)"
        >{{ opt.label }}</button>
      </div>

      <div class="space-y-2">
        <NuxtLink
          v-for="article in pagedArticles"
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

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-6">
        <template v-for="item in displayPages" :key="item">
          <span v-if="item === '…'" class="px-1 text-sm text-muted-foreground select-none">…</span>
          <Button
            v-else
            :variant="item === currentPage ? 'default' : 'ghost'"
            size="icon"
            @click="router.push(pageLink(Number(item)))"
          >
            {{ item }}
          </Button>
        </template>
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
