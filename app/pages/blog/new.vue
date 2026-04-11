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

const today = new Date().toISOString().slice(0, 10)

const frontmatter = ref<Frontmatter>({
  title: '',
  date: today,
  category: '',
  tags: [],
  coverImage: '',
  draft: true,
  description: '',
})
const slug = ref('')
const body = ref('')
const saving = ref(false)

const isDirty = computed(() =>
  slug.value !== ''
  || body.value !== ''
  || frontmatter.value.title !== ''
  || frontmatter.value.category !== ''
  || frontmatter.value.description !== ''
  || frontmatter.value.tags.length > 0
  || frontmatter.value.coverImage !== '',
)

const { showLeaveDialog, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!saving.value) save()
  }
})

async function save() {
  if (!slug.value) {
    toast.error('slugを入力してください')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/blog', {
      method: 'POST',
      body: { slug: slug.value, ...frontmatter.value, body: body.value },
    })
    toast.success('記事を作成しました')
    await navigateTo(`/blog/${slug.value}`)
  } catch (e: any) {
    const msg = e?.data?.data?.issues?.map((i: any) => i.message).join(', ')
      ?? e?.data?.message
      ?? '保存に失敗しました'
    toast.error(msg)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3rem)]">
    <!-- toolbar -->
    <div class="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/blog"><AlignLeft />一覧</NuxtLink>
      </Button>
      <span class="text-sm text-muted-foreground flex-1">新規作成</span>
      <Button size="sm" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- sidebar: frontmatter (desktop only) -->
      <aside class="hidden md:flex flex-col w-72 shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium">slug <span class="text-destructive">*</span></label>
          <input
            v-model="slug"
            placeholder="my-article-slug"
            class="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
        </div>
        <FrontmatterForm v-model="frontmatter" collection="blog" :slug="slug" />
      </aside>

      <!-- editor + preview -->
      <!-- desktop: 2-pane -->
      <div class="hidden md:flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
        </div>
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownPreview :content="body" :frontmatter="frontmatter" />
        </div>
      </div>

      <!-- mobile: 3 tabs -->
      <div class="flex md:hidden flex-1 overflow-hidden">
        <Tabs default-value="frontmatter" class="flex flex-col flex-1 overflow-hidden">
          <TabsList class="mx-3 mt-2 shrink-0">
            <TabsTrigger value="frontmatter" class="flex-1">設定</TabsTrigger>
            <TabsTrigger value="editor" class="flex-1">エディタ</TabsTrigger>
            <TabsTrigger value="preview" class="flex-1">プレビュー</TabsTrigger>
          </TabsList>
          <TabsContent value="frontmatter" class="flex-1 overflow-y-auto p-3 mt-0 space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium">slug <span class="text-destructive">*</span></label>
              <input
                v-model="slug"
                placeholder="my-article-slug"
                class="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
            </div>
            <FrontmatterForm v-model="frontmatter" collection="blog" :slug="slug" />
          </TabsContent>
          <TabsContent value="editor" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
          </TabsContent>
          <TabsContent value="preview" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownPreview :content="body" :frontmatter="frontmatter" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>

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
