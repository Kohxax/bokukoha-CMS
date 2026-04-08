<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import FrontmatterForm from '~/components/cms/FrontmatterForm.vue'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import MarkdownEditor from '~/components/editor/MarkdownEditor.vue'
import MarkdownPreview from '~/components/editor/MarkdownPreview.vue'

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

async function save() {
  if (!slug.value) {
    toast.error('slugを入力してください')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/work', {
      method: 'POST',
      body: { slug: slug.value, ...frontmatter.value, body: body.value },
    })
    toast.success('記事を作成しました')
    await navigateTo(`/work/${slug.value}`)
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
    <div class="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/work">← 一覧</NuxtLink>
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
            placeholder="my-work-slug"
            class="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
        </div>
        <FrontmatterForm v-model="frontmatter" collection="work" :slug="slug" />
      </aside>

      <div class="hidden md:flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownEditor v-model="body" collection="work" :slug="slug" />
        </div>
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownPreview :content="body" />
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
                placeholder="my-work-slug"
                class="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
            </div>
            <FrontmatterForm v-model="frontmatter" collection="work" :slug="slug" />
          </TabsContent>
          <TabsContent value="editor" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownEditor v-model="body" collection="work" :slug="slug" />
          </TabsContent>
          <TabsContent value="preview" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownPreview :content="body" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>
