<script setup lang="ts">
import { CalendarIcon, ClockIcon, Rocket } from 'lucide-vue-next'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import PreviewToc from '~/components/editor/PreviewToc.vue'

type TocLink = {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

const props = withDefaults(
  defineProps<{
    content: string
    frontmatter?: Frontmatter
    collection?: 'blog' | 'work'
  }>(),
  {
    collection: 'blog',
  },
)

const parsedContent = ref<Awaited<ReturnType<typeof parseMarkdown>> | null>(null)
let parseRequest = 0

watch(
  () => props.content,
  async (content) => {
    const request = ++parseRequest

    if (!import.meta.client || !content) {
      parsedContent.value = null
      return
    }

    try {
      const parsed = await parseMarkdown(content, {
        toc: { depth: 3, searchDepth: 4 },
      })
      if (request === parseRequest) parsedContent.value = parsed
    } catch {
      if (request === parseRequest) parsedContent.value = null
    }
  },
  { immediate: true },
)

const tocLinks = computed<TocLink[]>(() => parsedContent.value?.toc?.links ?? [])

const readingMin = computed(() =>
  Math.max(1, Math.ceil((props.content?.length ?? 0) / 800)),
)

const containerRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div
    ref="containerRef"
    class="site-preview h-full w-full overflow-auto rounded-md bg-background text-foreground"
  >
    <div class="h-full w-full min-w-0">
      <article
        class="flex min-h-full w-full flex-col gap-4 overflow-hidden rounded-3xl border border-transparent bg-surface-container pb-4 text-card-foreground shadow-none"
      >
        <div v-if="frontmatter?.coverImage" class="relative">
          <img
            :src="frontmatter.coverImage"
            :alt="frontmatter.title"
            class="aspect-video w-full rounded-t-3xl object-cover"
          />
        </div>

        <CardHeader v-if="frontmatter" class="px-5 pt-2">
          <span
            v-if="frontmatter.category"
            class="mb-2 inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full bg-primary-container px-6 py-2 text-sm font-medium text-primary-container-foreground"
          >
            {{ frontmatter.category }}
          </span>
          <CardTitle class="mt-0 text-3xl font-extrabold leading-tight">
            {{ frontmatter.title || '（タイトル未設定）' }}
          </CardTitle>
          <div
            class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
          >
            <div class="flex items-center space-x-1">
              <Rocket v-if="collection === 'work'" class="h-4 w-4" />
              <CalendarIcon v-else class="h-4 w-4" />
              <span>{{ frontmatter.date }}</span>
            </div>
            <div v-if="collection === 'blog'" class="flex items-center space-x-1">
              <ClockIcon class="h-4 w-4" />
              <span>読了時間 {{ readingMin }}分</span>
            </div>
            <div
              v-if="frontmatter.tags?.length"
              class="flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <span
                v-for="tag in frontmatter.tags"
                :key="tag"
                class="whitespace-nowrap text-base"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </CardHeader>

        <div v-if="tocLinks.length > 0" class="mb-6 px-5">
          <PreviewToc :links="tocLinks" :container-ref="containerRef" />
        </div>

        <CardContent class="prose article-prose max-w-none px-5 pb-4">
          <MDCRenderer
            v-if="parsedContent"
            :body="parsedContent.body"
            :data="parsedContent.data"
          />
        </CardContent>
      </article>
    </div>
  </div>
</template>
