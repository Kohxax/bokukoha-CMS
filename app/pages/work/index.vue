<script setup lang="ts">
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Plus } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const { data: articles } = await useFetch('/api/admin/work', {
  getCachedData: () => undefined,
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Work</h1>
      <Button as-child size="sm">
        <NuxtLink to="/work/new">
          <Plus class="size-4" />
          新規作成
        </NuxtLink>
      </Button>
    </div>

    <div v-if="articles && articles.length > 0" class="space-y-2">
      <NuxtLink
        v-for="article in articles"
        :key="article.slug"
        :to="`/work/${article.slug}`"
        class="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-sm">{{ article.title }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ article.date }} · {{ article.category }}
          </p>
        </div>
        <Badge
          :variant="article.draft ? 'secondary' : 'default'"
          class="ml-4 shrink-0"
        >
          {{ article.draft ? 'Draft' : 'Published' }}
        </Badge>
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <p class="text-sm">記事がありません</p>
      <Button as-child size="sm" variant="outline" class="mt-4">
        <NuxtLink to="/work/new">最初の記事を作成</NuxtLink>
      </Button>
    </div>
  </div>
</template>
