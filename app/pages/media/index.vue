<script setup lang="ts">
import { Images, Copy, Trash2, Upload, X, ChevronsUpDown, Check } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

type MediaItem = {
  key: string
  url: string
  size: number
  lastModified: string
  collection: string
  articleSlug: string  // "my-post"（collectionなし）
  articleKey: string   // "blog/my-post"（collection付き、フィルタのキー）
}

type SortOrder = 'newest' | 'oldest'

// 画像一覧・記事一覧を並行取得
const [{ data: mediaData, refresh, pending }, { data: blogArticles }, { data: workArticles }] =
  await Promise.all([
    useFetch<{ items: Array<{ key: string; url: string; size: number; lastModified: string }> }>(
      '/api/admin/media',
      { server: false },
    ),
    useFetch<Array<{ slug: string; title: string }>>('/api/admin/blog', { server: false }),
    useFetch<Array<{ slug: string; title: string }>>('/api/admin/work', { server: false }),
  ])

// slug → title マップ（"blog/my-post" → "記事タイトル"）
const titleMap = computed(() => {
  const map = new Map<string, string>()
  for (const a of blogArticles.value ?? []) map.set(`blog/${a.slug}`, a.title)
  for (const a of workArticles.value ?? []) map.set(`work/${a.slug}`, a.title)
  return map
})

// key を分解して各フィールドを付与
const items = computed<MediaItem[]>(() =>
  (mediaData.value?.items ?? []).map((item) => {
    const parts = item.key.split('/')
    const collection = parts[0] ?? ''
    const articleSlug = parts.length >= 3 ? parts.slice(1, -1).join('/') : ''
    const articleKey = articleSlug ? `${collection}/${articleSlug}` : collection
    return { ...item, collection, articleSlug, articleKey }
  }),
)

// フィルタ・ソート状態
const sortOrder = ref<SortOrder>('newest')
const collectionFilter = ref('all')
const articleFilter = ref('all')
const comboOpen = ref(false)

// collection リスト
const collections = computed(() =>
  [...new Set(items.value.map((i) => i.collection))].filter(Boolean).sort(),
)

// 記事候補リスト（コレクションで絞り込み済み、重複除去）
const articleOptions = computed(() => {
  const base = collectionFilter.value === 'all'
    ? items.value
    : items.value.filter((i) => i.collection === collectionFilter.value)
  const seen = new Set<string>()
  const opts: Array<{ key: string; label: string }> = []
  for (const item of base) {
    if (!item.articleSlug || seen.has(item.articleKey)) continue
    seen.add(item.articleKey)
    opts.push({
      key: item.articleKey,
      label: titleMap.value.get(item.articleKey) ?? item.articleSlug,
    })
  }
  return opts.sort((a, b) => a.label.localeCompare(b.label, 'ja'))
})

const selectedArticleLabel = computed(() => {
  if (articleFilter.value === 'all') return '記事名で絞り込み'
  return titleMap.value.get(articleFilter.value) ?? articleFilter.value
})

// collection 変更時に記事フィルタをリセット
watch(collectionFilter, () => { articleFilter.value = 'all' })

function selectArticle(key: string) {
  articleFilter.value = articleFilter.value === key ? 'all' : key
  comboOpen.value = false
}

const filteredItems = computed(() => {
  let result = items.value
  if (collectionFilter.value !== 'all') {
    result = result.filter((i) => i.collection === collectionFilter.value)
  }
  if (articleFilter.value !== 'all') {
    result = result.filter((i) => i.articleKey === articleFilter.value)
  }
  return [...result].sort((a, b) => {
    const ta = new Date(a.lastModified).getTime()
    const tb = new Date(b.lastModified).getTime()
    return sortOrder.value === 'newest' ? tb - ta : ta - tb
  })
})

const isFiltered = computed(
  () => collectionFilter.value !== 'all' || articleFilter.value !== 'all' || sortOrder.value !== 'newest',
)

function clearFilters() {
  sortOrder.value = 'newest'
  collectionFilter.value = 'all'
  articleFilter.value = 'all'
}

function fileName(key: string) {
  return key.split('/').pop() ?? key
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

// 画像ロード状態
const loadedKeys = reactive<Record<string, boolean>>({})

function onImgLoad(key: string) { loadedKeys[key] = true }
function onImgError(key: string) { loadedKeys[key] = true }

// イメージビューアー
const { $imageViewer } = useNuxtApp()

watch(filteredItems, (items) => {
  $imageViewer.images.value = items.map((i) => ({ src: i.url, alt: i.key }))
}, { immediate: true })

function openViewer(url: string) {
  $imageViewer.open(url)
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  toast.success('URLをコピーしました')
}

// 削除
const deleteTarget = ref<MediaItem | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/media?key=${encodeURIComponent(deleteTarget.value.key)}`, {
      method: 'DELETE',
    })
    toast.success('削除しました')
    deleteTarget.value = null
    await refresh()
  } catch (e: any) {
    toast.error(e?.data?.message ?? '削除に失敗しました')
  } finally {
    deleting.value = false
  }
}

// アップロード
const uploadCollection = ref('')
const uploadSlug = ref('')
const uploadFile = ref<File | null>(null)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  uploadFile.value = target.files?.[0] ?? null
}

async function upload() {
  if (!uploadFile.value || !uploadCollection.value || !uploadSlug.value) {
    toast.error('ファイル、コレクション、スラッグをすべて入力してください')
    return
  }
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', uploadFile.value)
    form.append('collection', uploadCollection.value)
    form.append('slug', uploadSlug.value)
    const res = await $fetch<{ url: string }>('/api/admin/media', { method: 'POST', body: form })
    toast.success('アップロードしました')
    await navigator.clipboard.writeText(res.url).catch(() => {})
    uploadFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    await refresh()
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'アップロードに失敗しました')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <Images />
      <h1 class="text-xl font-semibold">Media</h1>
      <span v-if="!pending" class="text-sm text-muted-foreground tabular-nums">
        {{ collectionFilter === 'all' && articleFilter === 'all' ? items.length : filteredItems.length }}
      </span>
    </div>

    <!-- アップロードフォーム -->
    <div class="mb-6 rounded-lg border border-border bg-card p-4 space-y-3">
      <p class="text-sm font-medium flex items-center gap-2"><Upload class="size-4" /> アップロード</p>
      <div class="flex flex-wrap gap-2">
        <Select v-model="uploadCollection">
          <SelectTrigger class="h-8 text-xs w-28">
            <SelectValue placeholder="collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">blog</SelectItem>
            <SelectItem value="work">work</SelectItem>
          </SelectContent>
        </Select>
        <Input
          v-model="uploadSlug"
          placeholder="slug"
          class="h-9 text-xs w-44"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          @change="onFileChange"
        />
        <Button
          variant="outline"
          size="default"
          class="h-8 text-xs"
          @click="fileInput?.click()"
        >
          {{ uploadFile ? uploadFile.name : 'ファイルを選択' }}
        </Button>
        <Button
          size="default"
          class="h-8 text-xs"
          :disabled="uploading || !uploadFile || !uploadCollection || !uploadSlug"
          @click="upload"
        >
          {{ uploading ? 'アップロード中...' : 'アップロード' }}
        </Button>
      </div>
    </div>

    <!-- フィルタ・ソートバー -->
    <div class="flex flex-wrap gap-2 mb-4">
      <Select v-model="sortOrder">
        <SelectTrigger class="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">新しい順</SelectItem>
          <SelectItem value="oldest">古い順</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="collectionFilter">
        <SelectTrigger class="w-32 h-8 text-xs">
          <SelectValue placeholder="コレクション" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem v-for="col in collections" :key="col" :value="col">{{ col }}</SelectItem>
        </SelectContent>
      </Select>

      <!-- 記事コンボボックス -->
      <Popover v-model:open="comboOpen">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            size="default"
            role="combobox"
            :aria-expanded="comboOpen"
            class="w-56 justify-between text-xs font-normal"
            :class="articleFilter !== 'all' ? 'text-foreground' : 'text-muted-foreground'"
          >
            <span class="truncate">{{ selectedArticleLabel }}</span>
            <ChevronsUpDown class="ml-2 size-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-72 p-0">
          <Command>
            <CommandInput placeholder="記事名で検索..." class="h-9 text-xs" />
            <CommandList>
              <CommandEmpty class="text-xs py-3">該当する記事がありません</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  class="text-xs"
                  @select="selectArticle('all')"
                >
                  <Check
                    class="mr-2 size-3"
                    :class="articleFilter === 'all' ? 'opacity-100' : 'opacity-0'"
                  />
                  すべての記事
                </CommandItem>
                <CommandItem
                  v-for="opt in articleOptions"
                  :key="opt.key"
                  :value="opt.label"
                  class="text-xs"
                  @select="selectArticle(opt.key)"
                >
                  <Check
                    class="mr-2 size-3"
                    :class="articleFilter === opt.key ? 'opacity-100' : 'opacity-0'"
                  />
                  {{ opt.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        v-if="isFiltered"
        variant="ghost"
        size="sm"
        class="h-8 px-2 text-xs text-muted-foreground"
        @click="clearFilters"
      >
        <X class="size-3 mr-1" />
        クリア
      </Button>
    </div>

    <!-- 画像グリッド -->
    <div
      v-if="!pending"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <div
        v-for="item in filteredItems"
        :key="item.key"
        class="rounded-lg border border-border bg-card overflow-hidden"
      >
        <div class="relative aspect-square bg-muted cursor-zoom-in" @click="openViewer(item.url)">
          <img
            :src="item.url"
            :alt="fileName(item.key)"
            class="w-full h-full object-cover"
            loading="lazy"
            @load="onImgLoad(item.key)"
            @error="onImgError(item.key)"
          />
          <Skeleton v-if="!loadedKeys[item.key]" class="absolute inset-0 rounded-none" />
        </div>
        <div class="p-2 space-y-1">
          <p class="text-[11px] text-foreground truncate" :title="item.key">
            {{ fileName(item.key) }}
          </p>
          <p class="text-[10px] text-muted-foreground truncate" :title="item.articleKey">
            {{ titleMap.get(item.articleKey) ?? item.articleSlug }}
          </p>
          <p class="text-[10px] text-muted-foreground">{{ formatSize(item.size) }}</p>
          <div class="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              :title="item.url"
              @click="copyUrl(item.url)"
            >
              <Copy class="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-destructive hover:text-destructive"
              @click="deleteTarget = item"
            >
              <Trash2 class="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- ローディング -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <div v-for="i in 12" :key="i" class="rounded-lg border border-border overflow-hidden">
        <Skeleton class="aspect-square w-full" />
        <div class="p-2 space-y-2">
          <Skeleton class="h-3 w-3/4" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </div>
    </div>

    <div
      v-if="!pending && filteredItems.length === 0"
      class="flex flex-col items-center justify-center py-24 text-muted-foreground"
    >
      <Images class="size-12 mb-3 opacity-30" />
      <p class="text-sm">{{ items.length === 0 ? '画像がありません' : '条件に一致する画像がありません' }}</p>
    </div>
  </div>

  <!-- 削除確認ダイアログ -->
  <Dialog :open="!!deleteTarget" @update:open="(v) => { if (!v) deleteTarget = null }">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>削除しますか？</DialogTitle>
        <DialogDescription>
          {{ deleteTarget?.key }} を R2 から削除します。この操作は取り消せません。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="deleteTarget = null">キャンセル</Button>
        <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? '削除中...' : '削除する' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ImageViewer />
</template>
