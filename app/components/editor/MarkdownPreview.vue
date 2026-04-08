<script setup lang="ts">
import { CalendarIcon, ClockIcon } from 'lucide-vue-next'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import PreviewToc from '~/components/editor/PreviewToc.vue'

const props = defineProps<{
  content: string
  frontmatter?: Frontmatter
}>()

// Slugify: matches Nuxt Content's heading ID generation
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

type TocLink = {
  id: string
  depth: number
  text: string
  children: TocLink[]
}

// Extract TOC links from markdown headings (h2–h4)
const tocLinks = computed<TocLink[]>(() => {
  if (!props.content) return []
  const regex = /^(#{2,4})\s+(.+)$/gm
  const links: TocLink[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(props.content)) !== null) {
    const depth = match[1]!.length
    const text = match[2]!.trim()
    const id = slugify(text)
    const link: TocLink = { id, depth, text, children: [] }

    if (depth === 2) {
      links.push(link)
    } else if (depth === 3) {
      const parent = links[links.length - 1]
      if (parent) parent.children.push(link)
      else links.push(link)
    } else {
      const parent = links[links.length - 1]
      if (parent) {
        const child = parent.children[parent.children.length - 1]
        if (child) child.children.push(link)
        else parent.children.push(link)
      } else {
        links.push(link)
      }
    }
  }

  return links
})

// MDCパース結果（クライアントのみ）
const parsedContent = ref<Awaited<ReturnType<typeof parseMarkdown>> | null>(null)

watchEffect(async () => {
  if (!import.meta.client) return
  if (!props.content) {
    parsedContent.value = null
    return
  }
  parsedContent.value = await parseMarkdown(props.content)
})

// Reading time (characters-based, same as blog)
const readingMin = computed(() =>
  Math.max(1, Math.ceil((props.content?.length ?? 0) / 800)),
)

const containerRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-auto rounded-md bg-background">
    <div class="max-w-3xl mx-auto">
      <Card class="overflow-hidden rounded-md">
        <!-- Cover image -->
        <div v-if="frontmatter?.coverImage" class="relative">
          <img
            :src="frontmatter.coverImage"
            :alt="frontmatter.title"
            class="w-full aspect-video object-cover rounded-t-lg"
          />
        </div>

        <!-- Header -->
        <CardHeader class="pt-2 px-5" v-if="frontmatter">
          <div v-if="frontmatter.category" class="mb-2">
            <span class="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-6 py-2 text-sm font-medium">
              {{ frontmatter.category }}
            </span>
          </div>
          <CardTitle class="text-3xl font-extrabold leading-tight mt-0">
            {{ frontmatter.title || '（タイトル未設定）' }}
          </CardTitle>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm mt-2">
            <div class="flex items-center space-x-1">
              <CalendarIcon class="h-4 w-4" />
              <span>{{ frontmatter.date }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <ClockIcon class="h-4 w-4" />
              <span>読了時間: {{ readingMin }}分</span>
            </div>
            <div v-if="frontmatter.tags?.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                v-for="tag in frontmatter.tags"
                :key="tag"
                class="text-base whitespace-nowrap"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </CardHeader>

        <!-- TOC -->
        <div v-if="tocLinks.length > 0" class="px-5">
          <PreviewToc :links="tocLinks" :container-ref="containerRef" />
        </div>

        <!-- Body -->
        <CardContent class="prose prose-invert max-w-none px-5 pb-8 preview-content">
          <MDCRenderer v-if="parsedContent" :body="parsedContent.body" :data="parsedContent.data" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  margin-left: -1.2rem;
  border-left: 4px solid var(--color-foreground);
  padding-left: 1rem;
  scroll-margin-top: 80px;
}

.prose :deep(h1) {
  font-size: 2rem;
  display: flow-root;
  margin-top: 2rem !important;
}

.prose :deep(h2) {
  font-size: 1.7rem;
  margin-top: 0;
}

.prose :deep(h3) {
  font-size: 1.4rem;
  margin-top: 0;
}

.prose :deep(h4) {
  font-size: 1.1rem;
  margin-top: 1rem;
}

.prose :deep(p) {
  font-size: 1.13rem;
  line-height: 1.7;
}

/* Code blocks */
.prose :deep(pre) {
  background-color: var(--color-background) !important;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow-x: auto;
}

/* Inline code */
.prose :deep(code:not(pre code)) {
  background-color: var(--color-background);
  border-radius: 0.25rem;
  padding: 0.1em 0.25em;
  color: var(--color-foreground);
  font-weight: 500;
}

.prose :deep(code)::before,
.prose :deep(code)::after {
  content: none !important;
}

/* Blockquote */
.prose :deep(blockquote) {
  border-inline-start-color: #71717a;
}

/* Images */
.prose :deep(figure) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.prose :deep(figure img) {
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  margin-left: auto;
  margin-right: auto;
}

.prose :deep(figcaption) {
  text-align: center;
  color: var(--color-muted-foreground);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
