<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Plus, ImageIcon, Briefcase } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth',
  validate: (route) => {
    const n = Number(route.params.page)
    return Number.isInteger(n) && n >= 1
  },
})

const PAGE_SIZE = 7
type SortOrder = 'newest' | 'oldest' | 'updated'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Number(route.params.page))
const sortOrder = computed<SortOrder>(() => (route.query.sort as SortOrder) || 'newest')

const articles = ref<any[] | null>(null)

onMounted(async () => {
  articles.value = await $fetch<any[]>('/api/admin/work')
})

const sortedArticles = computed(() => {
  if (!articles.value) return null
  return [...articles.value].sort((a, b) => {
    if (sortOrder.value === 'newest') return a.date < b.date ? 1 : -1
    if (sortOrder.value === 'oldest') return a.date > b.date ? 1 : -1
    return a.updatedAt < b.updatedAt ? 1 : -1
  })
})

const totalPages = computed(() => {
  if (!sortedArticles.value) return 1
  return Math.max(1, Math.ceil(sortedArticles.value.length / PAGE_SIZE))
})

const pagedArticles = computed(() => {
  if (!sortedArticles.value) return null
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedArticles.value.slice(start, start + PAGE_SIZE)
})

watch([totalPages, articles], () => {
  if (articles.value && currentPage.value > totalPages.value) {
    navigateTo(pageLink(totalPages.value), { replace: true })
  }
})

function sortQuery(order: SortOrder) {
  return order !== 'newest' ? { sort: order } : {}
}

function setSortOrder(order: SortOrder) {
  router.push({ path: '/work/1', query: sortQuery(order) })
}

function pageLink(page: number) {
  return { path: `/work/${page}`, query: sortQuery(sortOrder.value) }
}

const pageButtons = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 1) return []

  const pages: (number | '...')[] = [1]

  if (cur - 1 > 2) pages.push('...')

  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }

  if (cur + 1 < total - 1) pages.push('...')

  if (total > 1) pages.push(total)

  return pages
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
      <div class="flex-row flex items-center gap-2">
        <Briefcase />
        <h1 class="text-xl font-semibold">Work</h1>
      </div>
      <Button as-child size="sm">
        <NuxtLink to="/work/new">
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
          :to="`/work/${article.slug}`"
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

      <div v-if="pageButtons.length > 0" class="flex items-center justify-center gap-1 mt-6">
        <template v-for="(btn, i) in pageButtons" :key="i">
          <span v-if="btn === '...'" class="px-1 text-sm text-muted-foreground">…</span>
          <Button
            v-else
            :variant="btn === currentPage ? 'default' : 'ghost'"
            size="icon"
            as-child
          >
            <NuxtLink :to="pageLink(btn)">{{ btn }}</NuxtLink>
          </Button>
        </template>
      </div>
    </div>

    <div v-else-if="articles !== null" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <p class="text-sm">記事がありません</p>
      <Button as-child size="sm" variant="outline" class="mt-4">
        <NuxtLink to="/work/new">最初の記事を作成</NuxtLink>
      </Button>
    </div>
  </div>
</template>
