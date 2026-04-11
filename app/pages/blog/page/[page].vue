<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Plus, ImageIcon, BookText } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const PAGE_SIZE = 7
type SortOrder = 'newest' | 'oldest' | 'updated'
type DraftFilter = 'all' | 'draft' | 'published'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => {
  const p = Number(route.params.page)
  return Number.isFinite(p) && p > 0 ? p : 1
})
const sortOrder = computed<SortOrder>(() => (route.query.sort as SortOrder) || 'newest')
const categoryFilter = computed(() => (route.query.category as string) || 'all')
const draftFilter = computed<DraftFilter>(() => (route.query.draft as DraftFilter) || 'all')

const articles = ref<any[] | null>(null)
onMounted(async () => {
  articles.value = await $fetch<any[]>('/api/admin/blog')
})

const categories = computed(() => {
  if (!articles.value) return []
  return [...new Set(articles.value.map((a) => a.category))].sort()
})

const filteredArticles = computed(() => {
  if (!articles.value) return []
  return articles.value.filter((a) => {
    if (categoryFilter.value !== 'all' && a.category !== categoryFilter.value) return false
    if (draftFilter.value === 'draft' && !a.draft) return false
    if (draftFilter.value === 'published' && a.draft) return false
    return true
  })
})

const sortedArticles = computed(() => {
  return [...filteredArticles.value].sort((a, b) => {
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

function buildQuery(overrides: Record<string, string>) {
  const q: Record<string, string> = {}
  if (sortOrder.value !== 'newest') q.sort = sortOrder.value
  if (categoryFilter.value !== 'all') q.category = categoryFilter.value
  if (draftFilter.value !== 'all') q.draft = draftFilter.value
  return { ...q, ...overrides }
}

function pageLink(page: number) {
  return { path: `/blog/page/${page}`, query: buildQuery({}) }
}

function setSort(value: string) {
  const q = buildQuery(value !== 'newest' ? { sort: value } : {})
  delete q.sort
  if (value !== 'newest') q.sort = value
  router.push({ path: '/blog/page/1', query: q })
}

function setCategory(value: string) {
  const q = buildQuery(value !== 'all' ? { category: value } : {})
  delete q.category
  if (value !== 'all') q.category = value
  router.push({ path: '/blog/page/1', query: q })
}

function setDraft(value: string) {
  const q = buildQuery(value !== 'all' ? { draft: value } : {})
  delete q.draft
  if (value !== 'all') q.draft = value
  router.push({ path: '/blog/page/1', query: q })
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
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-row items-center gap-2">
        <BookText />
        <h1 class="text-xl font-semibold">Blog</h1>
        <span v-if="articles !== null" class="text-sm text-muted-foreground tabular-nums">
          {{ categoryFilter === 'all' && draftFilter === 'all' ? articles.length : sortedArticles.length }}
        </span>
      </div>
      <Button as-child size="sm">
        <NuxtLink to="/blog/new">
          <Plus class="size-4" />
          新規作成
        </NuxtLink>
      </Button>
    </div>

    <div v-if="articles !== null">
      <div class="flex gap-2 mb-3">
        <Select :model-value="sortOrder" @update:model-value="setSort">
          <SelectTrigger class="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">新しい順</SelectItem>
            <SelectItem value="oldest">古い順</SelectItem>
            <SelectItem value="updated">最終更新順</SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="categoryFilter" @update:model-value="setCategory">
          <SelectTrigger class="w-36 h-8 text-xs">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリ</SelectItem>
            <SelectItem v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="draftFilter" @update:model-value="setDraft">
          <SelectTrigger class="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div v-if="sortedArticles.length > 0" class="space-y-2">
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

      <div v-else class="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p class="text-sm">条件に一致する記事がありません</p>
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

    <div v-else class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <p class="text-sm">記事がありません</p>
      <Button as-child size="sm" variant="outline" class="mt-4">
        <NuxtLink to="/blog/new">最初の記事を作成</NuxtLink>
      </Button>
    </div>
  </div>
</template>
