<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { ImageIcon } from 'lucide-vue-next'

interface ArticleSummary {
  slug: string
  title: string
  date?: string
  category?: string
  body?: string
  coverImage?: string
  draft?: boolean
}

defineProps<{
  article: ArticleSummary
  to: RouteLocationRaw
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="m3-interactive-card group grid min-h-22 grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 rounded-2xl bg-surface-container-low p-3 shadow-none sm:grid-cols-[minmax(0,1fr)_7rem] sm:gap-4 sm:p-4"
  >
    <div class="min-w-0">
      <div class="flex items-start gap-2">
        <p class="line-clamp-2 min-w-0 flex-1 text-[15px] font-medium leading-5 sm:text-base">
          {{ article.title }}
        </p>
        <span
          class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="article.draft
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-emerald-500/15 text-emerald-400'"
        >
          {{ article.draft ? 'Draft' : 'Published' }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span v-if="article.date">{{ article.date }}</span>
        <span v-if="article.category">{{ article.category }}</span>
        <span v-if="article.body !== undefined" class="tabular-nums">{{ article.body.length.toLocaleString() }}文字</span>
      </div>
    </div>

    <div class="flex h-16 w-20 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high sm:h-20 sm:w-28">
      <img
        v-if="article.coverImage"
        :src="article.coverImage"
        alt=""
        class="h-full w-full object-cover"
      />
      <ImageIcon v-else class="size-5 text-muted-foreground/40" />
    </div>
  </NuxtLink>
</template>
