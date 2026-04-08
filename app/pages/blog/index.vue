<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Plus, ImageIcon } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const { data: articles, refresh } = await useFetch('/api/admin/blog', {
  getCachedData: () => undefined,
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Blog</h1>
      <Button as-child size="sm">
        <NuxtLink to="/blog/new">
          <Plus class="size-4" />
          新規作成
        </NuxtLink>
      </Button>
    </div>

    <div v-if="articles && articles.length > 0" class="space-y-2">
      <NuxtLink
        v-for="article in articles"
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
      <p class="text-sm">記事がありません</p>
      <Button as-child size="sm" variant="outline" class="mt-4">
        <NuxtLink to="/blog/new">最初の記事を作成</NuxtLink>
      </Button>
    </div>
  </div>
</template>
