<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import FrontmatterForm from '~/components/cms/FrontmatterForm.vue'
import type { Frontmatter } from '~/components/cms/FrontmatterForm.vue'
import MarkdownEditor from '~/components/editor/MarkdownEditor.vue'
import MarkdownPreview from '~/components/editor/MarkdownPreview.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const slug = route.params.slug as string

const { data: article } = await useFetch(`/api/admin/blog/${slug}`)

if (!article.value) {
  await navigateTo('/blog')
}

const frontmatter = ref<Frontmatter>({
  title: article.value?.title ?? '',
  date: article.value?.date ?? '',
  category: article.value?.category ?? '',
  tags: article.value?.tags ?? [],
  coverImage: article.value?.coverImage ?? '',
  draft: article.value?.draft ?? true,
  description: article.value?.description ?? '',
})
const body = ref(article.value?.body ?? '')
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/admin/blog/${slug}`, {
      method: 'PUT',
      body: { ...frontmatter.value, body: body.value },
    })
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
  if (!confirm('この記事を削除しますか？')) return
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
  <div class="flex flex-col h-[calc(100vh-3rem)]">
    <!-- toolbar -->
    <div class="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/blog">← 一覧</NuxtLink>
      </Button>
      <span class="text-sm text-muted-foreground flex-1 truncate">{{ slug }}</span>
      <Button variant="destructive" size="sm" @click="deleteArticle">削除</Button>
      <Button size="sm" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- sidebar: frontmatter -->
      <aside class="w-72 shrink-0 border-r border-border overflow-y-auto p-4">
        <FrontmatterForm v-model="frontmatter" collection="blog" :slug="slug" />
      </aside>

      <!-- editor + preview -->
      <!-- desktop: 2-pane -->
      <div class="hidden md:flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
        </div>
        <div class="flex-1 overflow-hidden p-3">
          <MarkdownPreview :content="body" />
        </div>
      </div>

      <!-- mobile: tabs -->
      <div class="flex md:hidden flex-1 overflow-hidden">
        <Tabs default-value="editor" class="flex flex-col flex-1 overflow-hidden">
          <TabsList class="mx-3 mt-2 shrink-0">
            <TabsTrigger value="editor" class="flex-1">エディタ</TabsTrigger>
            <TabsTrigger value="preview" class="flex-1">プレビュー</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownEditor v-model="body" collection="blog" :slug="slug" />
          </TabsContent>
          <TabsContent value="preview" class="flex-1 overflow-hidden p-3 mt-0">
            <MarkdownPreview :content="body" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>
