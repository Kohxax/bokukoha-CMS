<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import FrontmatterForm from '~/components/cms/FrontmatterForm.vue'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import MarkdownEditor from '~/components/editor/MarkdownEditor.vue'
import MarkdownPreview from '~/components/editor/MarkdownPreview.vue'
import { AlignLeft } from 'lucide-vue-next'
import { useEventListener } from '@vueuse/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const slug = route.params.slug as string

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
    $fetch(`/api/admin/work/${slug}`).catch(() => null),
    $fetch('/api/admin/work').catch(() => [] as any[]),
  ])
  if (!article) {
    await navigateTo('/work')
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
    await $fetch(`/api/admin/work/${slug}`, {
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
    await $fetch(`/api/admin/work/${slug}`, { method: 'DELETE' })
    toast.success('削除しました')
    await navigateTo('/work')
  } catch (e: any) {
    toast.error(e?.data?.message ?? '削除に失敗しました')
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3rem)]">
    <div class="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/work"><AlignLeft />一覧</NuxtLink>
      </Button>
      <span class="text-sm text-muted-foreground truncate">{{ slug }}</span>
      <span v-if="isDirty" class="text-amber-400 text-xs leading-none" title="未保存の変更があります">●</span>
      <span class="text-xs text-muted-foreground tabular-nums flex-1">{{ charCount }}文字</span>
      <Button variant="destructive" size="sm" @click="showDeleteDialog = true">削除</Button>
      <Button size="sm" :disabled="saving" :class="isDirty && !saving ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''" @click="save">
        {{ saving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <div v-if="loaded" class="flex flex-1 overflow-hidden">
      <!-- sidebar: frontmatter (desktop only) -->
      <aside class="hidden md:block w-72 shrink-0 border-r border-border overflow-y-auto p-4">
        <FrontmatterForm v-model="frontmatter" collection="work" :slug="slug" :category-suggestions="categorySuggestions" />
      </aside>

      <div class="hidden md:flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden p-3 min-w-0">
          <MarkdownEditor v-model="body" collection="work" :slug="slug" />
        </div>
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownPreview :content="body" :frontmatter="frontmatter" />
        </div>
      </div>

      <!-- mobile: 3 tabs -->
      <div class="flex md:hidden flex-1 overflow-hidden">
        <Tabs default-value="editor" class="flex flex-col flex-1 overflow-hidden">
          <TabsList class="mx-3 mt-2 shrink-0">
            <TabsTrigger value="frontmatter" class="flex-1">設定</TabsTrigger>
            <TabsTrigger value="editor" class="flex-1">エディタ</TabsTrigger>
            <TabsTrigger value="preview" class="flex-1">プレビュー</TabsTrigger>
          </TabsList>
          <TabsContent value="frontmatter" class="flex-1 overflow-y-auto p-3 mt-0">
            <FrontmatterForm v-model="frontmatter" collection="work" :slug="slug" :category-suggestions="categorySuggestions" />
          </TabsContent>
          <TabsContent value="editor" class="flex-1 overflow-hidden p-3 mt-0 min-w-0">
            <MarkdownEditor v-model="body" collection="work" :slug="slug" />
          </TabsContent>
          <TabsContent value="preview" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownPreview :content="body" :frontmatter="frontmatter" />
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
