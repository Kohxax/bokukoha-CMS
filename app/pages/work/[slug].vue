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

const { data: article } = await useFetch(`/api/admin/work/${slug}`)

if (!article.value) {
  await navigateTo('/work')
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
    await $fetch(`/api/admin/work/${slug}`, {
      method: 'PUT',
      body: { ...frontmatter.value, body: body.value },
    })
    toast.success('保存しました')
  } catch (e: any) {
    toast.error(e?.data?.message ?? '保存に失敗しました')
  } finally {
    saving.value = false
  }
}

async function deleteArticle() {
  if (!confirm('この記事を削除しますか？')) return
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
        <NuxtLink to="/work">← 一覧</NuxtLink>
      </Button>
      <span class="text-sm text-muted-foreground flex-1 truncate">{{ slug }}</span>
      <Button variant="destructive" size="sm" @click="deleteArticle">削除</Button>
      <Button size="sm" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-72 shrink-0 border-r border-border overflow-y-auto p-4">
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

      <div class="flex md:hidden flex-1 overflow-hidden">
        <Tabs default-value="editor" class="flex flex-col flex-1 overflow-hidden">
          <TabsList class="mx-3 mt-2 shrink-0">
            <TabsTrigger value="editor" class="flex-1">エディタ</TabsTrigger>
            <TabsTrigger value="preview" class="flex-1">プレビュー</TabsTrigger>
          </TabsList>
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
