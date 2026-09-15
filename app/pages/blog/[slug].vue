<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import FrontmatterForm from '~/components/cms/FrontmatterForm.vue'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import MarkdownEditor from '~/components/editor/MarkdownEditor.vue'
import MarkdownPreview from '~/components/editor/MarkdownPreview.vue'
import { AlignLeft, MessageSquare } from 'lucide-vue-next'
import { useEventListener } from '@vueuse/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import ArticleComments from '~/components/cms/ArticleComments.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const slug = route.params.slug as string
const articleId = `blog_${slug}`
const asideTab = ref<'settings' | 'comments'>('settings')

const backLink = computed(() => {
  const page = Number(route.query.page)
  if (!page || page <= 1) return '/blog'
  const q: Record<string, string> = {}
  if (route.query.sort) q.sort = route.query.sort as string
  if (route.query.category) q.category = route.query.category as string
  if (route.query.draft) q.draft = route.query.draft as string
  return { path: `/blog/page/${page}`, query: q }
})

const loaded = ref(false)
const categorySuggestions = ref<string[]>([])
const frontmatter = ref<Frontmatter>({
  title: '',
  date: '',
  category: '',
  tags: [],
  coverImage: '',
  draft: true,
  description: '',
})
const body = ref('')
const saving = ref(false)
const showDeleteDialog = ref(false)
const isDirty = ref(false)
const charCount = computed(() => body.value.length.toLocaleString())

let dirtyEnabled = false
watch([frontmatter, body], () => {
  if (dirtyEnabled) isDirty.value = true
}, { deep: true })

const { showLeaveDialog, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!saving.value) save()
  }
})

onMounted(async () => {
  const [article, articles] = await Promise.all([
    $fetch(`/api/admin/blog/${slug}`).catch(() => null),
    $fetch('/api/admin/blog').catch(() => [] as any[]),
  ])
  if (!article) {
    await navigateTo('/blog')
    return
  }
  categorySuggestions.value = [...new Set((articles as any[]).map((a: any) => a.category).filter(Boolean))]
  frontmatter.value = {
    title: article.title,
    date: article.date,
    category: article.category,
    tags: article.tags ?? [],
    coverImage: article.coverImage,
    draft: article.draft,
    description: article.description ?? '',
  }
  body.value = article.body ?? ''
  loaded.value = true
  await nextTick()
  dirtyEnabled = true
})

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/admin/blog/${slug}`, {
      method: 'PUT',
      body: { ...frontmatter.value, body: body.value },
    })
    isDirty.value = false
    toast.success('保存しました')
  } catch (e: any) {
    const msg = e?.data?.data?.issues?.map((i: any) => i.message).join(', ')
      ?? e?.data?.message
      ?? '保存に失敗しました'
    toast.error(msg)
  } finally {
    saving.value = false
  }
}

async function deleteArticle() {
  try {
    await $fetch(`/api/admin/blog/${slug}`, { method: 'DELETE' })
    toast.success('削除しました')
    await navigateTo('/blog')
  } catch (e: any) {
    toast.error(e?.data?.message ?? '削除に失敗しました')
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <!-- toolbar -->
    <div class="flex shrink-0 items-center gap-3 bg-surface-container-low px-4 py-2">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink :to="backLink"><AlignLeft />一覧</NuxtLink>
      </Button>
      <span class="text-sm text-muted-foreground truncate">{{ slug }}</span>
      <span v-if="isDirty" class="text-amber-400 text-xs leading-none" title="未保存の変更があります">●</span>
      <span class="text-xs text-muted-foreground tabular-nums flex-1">{{ charCount }}文字</span>
      <Button variant="text" size="sm" class="text-destructive" @click="showDeleteDialog = true">削除</Button>
      <Button size="sm" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <div v-if="loaded" class="flex flex-1 gap-3 overflow-hidden bg-background p-3">
      <!-- sidebar: frontmatter / comments (desktop only) -->
      <Tabs v-model="asideTab" class="hidden w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-container-low md:flex">
        <TabsList class="mx-3 mt-3 w-auto shrink-0">
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare class="size-3.5" />コメント
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings" class="mt-0 flex-1 overflow-y-auto p-4">
          <FrontmatterForm v-model="frontmatter" collection="blog" :slug="slug" :category-suggestions="categorySuggestions" />
        </TabsContent>
        <TabsContent value="comments" class="mt-0 flex-1 overflow-hidden">
          <ArticleComments :article-id="articleId" />
        </TabsContent>
      </Tabs>

      <!-- editor + preview -->
      <!-- desktop: 2-pane -->
      <div class="hidden min-w-0 flex-1 gap-3 overflow-hidden md:flex">
        <div class="min-w-0 flex-1 overflow-hidden rounded-2xl bg-surface-container-low">
          <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
        </div>
        <div class="flex-1 overflow-hidden rounded-2xl bg-surface-container-low">
          <MarkdownPreview :content="body" :frontmatter="frontmatter" />
        </div>
      </div>

      <!-- mobile: 4 tabs -->
      <div class="flex md:hidden flex-1 overflow-hidden">
        <Tabs default-value="editor" class="flex flex-col flex-1 overflow-hidden">
          <TabsList class="w-full shrink-0">
            <TabsTrigger value="frontmatter" class="flex-1">設定</TabsTrigger>
            <TabsTrigger value="editor" class="flex-1">エディタ</TabsTrigger>
            <TabsTrigger value="preview" class="flex-1">プレビュー</TabsTrigger>
            <TabsTrigger value="comments" class="flex-1">コメント</TabsTrigger>
          </TabsList>
          <TabsContent value="frontmatter" class="mt-3 flex-1 overflow-y-auto rounded-2xl bg-surface-container-low p-4">
            <FrontmatterForm v-model="frontmatter" collection="blog" :slug="slug" :category-suggestions="categorySuggestions" />
          </TabsContent>
          <TabsContent value="editor" class="mt-3 min-w-0 flex-1 overflow-hidden rounded-2xl bg-surface-container-low">
            <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
          </TabsContent>
          <TabsContent value="preview" class="mt-3 flex-1 overflow-hidden rounded-2xl bg-surface-container-low">
            <MarkdownPreview :content="body" :frontmatter="frontmatter" />
          </TabsContent>
          <TabsContent value="comments" class="mt-3 flex-1 overflow-hidden rounded-2xl bg-surface-container-low">
            <ArticleComments :article-id="articleId" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>

  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>記事を削除しますか？</DialogTitle>
        <DialogDescription>
          「{{ slug }}」を削除します。この操作は取り消せません。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showDeleteDialog = false">キャンセル</Button>
        <Button variant="destructive" @click="deleteArticle">削除する</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="showLeaveDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>保存せずに移動しますか？</DialogTitle>
        <DialogDescription>
          未保存の変更があります。移動すると変更が失われます。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="cancelLeave">キャンセル</Button>
        <Button variant="destructive" @click="confirmLeave">移動する</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
