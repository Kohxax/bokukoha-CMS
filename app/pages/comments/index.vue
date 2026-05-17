<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Check, MessageSquare, X, Trash2, CheckCircle, EyeOff, Eye } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

type Status = 'all' | 'approved' | 'rejected_filter' | 'rejected_claude' | 'deleted'

interface Comment {
  articleId: string
  commentId: string
  authorName?: string
  authorId?: string
  content?: string
  parentId?: string | null
  status: string
  filterScore?: number
  filterReasons?: string[]
  moderationReason?: string
  createdAt: string
}

type Target = Pick<Comment, 'articleId' | 'commentId' | 'status'>

const route = useRoute()
const router = useRouter()

const statusFilter = computed<Status>(() => (route.query.status as Status) || 'all')
const articleIdFilter = computed(() => (route.query.articleId as string) || '')

const comments = ref<Comment[] | null>(null)
const expandedId = ref<string | null>(null)

async function load() {
  comments.value = null
  selected.value = new Set()
  const params: Record<string, string> = {}
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  if (articleIdFilter.value) params.articleId = articleIdFilter.value
  comments.value = await $fetch<Comment[]>('/api/admin/comments', { params })
}

onMounted(load)
watch([statusFilter, articleIdFilter], load)

function setStatus(value: string) {
  router.push({ query: { ...route.query, status: value === 'all' ? undefined : value, articleId: articleIdFilter.value || undefined } })
}

function clearArticleFilter() {
  router.push({ query: { ...route.query, articleId: undefined } })
}

// ── Selection ────────────────────────────────────────────────────────────────

const selected = ref<Set<string>>(new Set())

const allSelected = computed(() =>
  !!comments.value?.length && comments.value.every((c) => selected.value.has(c.commentId)),
)

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(comments.value?.map((c) => c.commentId))
  }
}

function toggleOne(id: string) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}

const selectedComments = computed<Comment[]>(
  () => comments.value?.filter((c) => selected.value.has(c.commentId)) ?? [],
)

// ── Dialogs ──────────────────────────────────────────────────────────────────

const showHideDialog = ref(false)
const showDeleteDialog = ref(false)
const dialogTargets = ref<Target[]>([])
const processing = ref(false)

function openHide(targets: Target[]) {
  const approvable = targets.filter((t) => t.status === 'approved')
  if (!approvable.length) {
    toast.info('非表示にできるのは承認済みコメントのみです')
    return
  }
  dialogTargets.value = approvable
  showHideDialog.value = true
}

function openDelete(targets: Target[]) {
  dialogTargets.value = targets
  showDeleteDialog.value = true
}

async function confirmHide() {
  processing.value = true
  showHideDialog.value = false
  try {
    await Promise.all(
      dialogTargets.value.map((t) =>
        $fetch(`/api/admin/comments/${t.commentId}`, {
          method: 'PATCH',
          body: { articleId: t.articleId, status: 'deleted' },
        }),
      ),
    )
    const ids = new Set(dialogTargets.value.map((t) => t.commentId))
    for (const c of comments.value ?? []) {
      if (ids.has(c.commentId)) c.status = 'deleted'
    }
    selected.value = new Set()
    toast.success(`${dialogTargets.value.length}件を非表示にしました`)
  } catch {
    toast.error('操作に失敗しました')
  } finally {
    processing.value = false
    dialogTargets.value = []
  }
}

async function confirmDelete() {
  processing.value = true
  showDeleteDialog.value = false
  try {
    await Promise.all(
      dialogTargets.value.map((t) =>
        $fetch(`/api/admin/comments/${t.commentId}?articleId=${encodeURIComponent(t.articleId)}`, {
          method: 'DELETE',
        }),
      ),
    )
    const ids = new Set(dialogTargets.value.map((t) => t.commentId))
    comments.value = comments.value?.filter((c) => !ids.has(c.commentId)) ?? []
    selected.value = new Set([...selected.value].filter((id) => !ids.has(id)))
    toast.success(`${dialogTargets.value.length}件を削除しました`)
  } catch {
    toast.error('削除に失敗しました')
  } finally {
    processing.value = false
    dialogTargets.value = []
  }
}

// ── Approve / Restore ────────────────────────────────────────────────────────

async function approve(comment: Comment) {
  try {
    await $fetch(`/api/admin/comments/${comment.commentId}`, {
      method: 'PATCH',
      body: { articleId: comment.articleId, status: 'approved' },
    })
    const item = comments.value?.find((c) => c.commentId === comment.commentId)
    if (item) item.status = 'approved'
    toast.success('承認しました')
  } catch {
    toast.error('承認に失敗しました')
  }
}

async function restore(comment: Comment) {
  try {
    await $fetch(`/api/admin/comments/${comment.commentId}`, {
      method: 'PATCH',
      body: { articleId: comment.articleId, status: 'approved' },
    })
    const item = comments.value?.find((c) => c.commentId === comment.commentId)
    if (item) item.status = 'approved'
    toast.success('再表示しました')
  } catch {
    toast.error('操作に失敗しました')
  }
}

// ── Display helpers ───────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  approved: '承認済み',
  rejected_filter: 'ルール拒否',
  rejected_claude: 'Claude拒否',
  deleted: '非表示',
}

const statusClass: Record<string, string> = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected_filter: 'bg-red-500/15 text-red-400',
  rejected_claude: 'bg-orange-500/15 text-orange-400',
  deleted: 'bg-muted text-muted-foreground',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })

const truncate = (s: string | undefined, n: number) =>
  s && s.length > n ? s.slice(0, n) + '…' : (s ?? '')
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-row items-center gap-2">
        <MessageSquare class="size-5" />
        <h1 class="text-xl font-semibold">Comments</h1>
        <span v-if="comments !== null" class="text-sm text-muted-foreground tabular-nums">
          {{ comments.length }}
        </span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <Select :model-value="statusFilter" @update:model-value="setStatus">
        <SelectTrigger class="w-40 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="approved">承認済み</SelectItem>
          <SelectItem value="rejected_filter">ルール拒否</SelectItem>
          <SelectItem value="rejected_claude">Claude拒否</SelectItem>
          <SelectItem value="deleted">非表示</SelectItem>
        </SelectContent>
      </Select>

      <div v-if="articleIdFilter" class="flex items-center gap-1 rounded-md border border-border px-2 h-8 text-xs text-muted-foreground">
        <span>記事: {{ articleIdFilter }}</span>
        <button @click="clearArticleFilter" class="hover:text-foreground transition-colors">
          <X class="size-3" />
        </button>
      </div>

      <!-- Bulk actions (visible when items selected) -->
      <template v-if="selected.size > 0">
        <span class="text-xs text-muted-foreground ml-1">{{ selected.size }}件選択中</span>
        <Button
          size="sm"
          variant="outline"
          class="h-8 text-xs"
          :disabled="processing"
          @click="openHide(selectedComments)"
        >
          <EyeOff class="size-3 mr-1" />
          非表示にする
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="h-8 text-xs text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/60"
          :disabled="processing"
          @click="openDelete(selectedComments)"
        >
          <Trash2 class="size-3 mr-1" />
          DBから削除
        </Button>
      </template>
    </div>

    <!-- Loaded -->
    <div v-if="comments !== null">
      <div v-if="comments.length > 0" class="space-y-2">
        <!-- Select all -->
        <label class="flex items-center gap-2 px-1 pb-1 cursor-pointer select-none">
          <span class="cms-checkbox" :data-checked="allSelected">
            <input type="checkbox" class="sr-only" :checked="allSelected" @change="toggleAll" />
            <Check v-if="allSelected" class="size-3.5" />
          </span>
          <span class="text-xs text-muted-foreground">すべて選択</span>
        </label>

        <div
          v-for="comment in comments"
          :key="comment.commentId"
          class="rounded-lg border bg-card overflow-hidden transition-colors"
          :class="selected.has(comment.commentId) ? 'border-primary/40' : 'border-border'"
        >
          <div class="flex items-start gap-3 p-3">
            <!-- Checkbox -->
            <label class="mt-1 shrink-0 cursor-pointer">
              <span class="cms-checkbox" :data-checked="selected.has(comment.commentId)">
                <input type="checkbox" class="sr-only" :checked="selected.has(comment.commentId)" @change="toggleOne(comment.commentId)" />
                <Check v-if="selected.has(comment.commentId)" class="size-3.5" />
              </span>
            </label>

            <!-- Status badge -->
            <span
              class="mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="statusClass[comment.status] ?? 'bg-muted text-muted-foreground'"
            >
              {{ statusLabel[comment.status] ?? comment.status }}
            </span>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-sm">{{ comment.authorName ?? '名無しさん' }}</span>
                <span v-if="comment.authorId" class="text-xs text-muted-foreground font-mono">ID:{{ comment.authorId }}</span>
                <button
                  class="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  @click="router.push({ query: { ...route.query, articleId: comment.articleId } })"
                >
                  {{ comment.articleId }}
                </button>
                <span class="text-xs text-muted-foreground ml-auto">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="text-sm mt-1 text-muted-foreground leading-relaxed">
                {{ expandedId === comment.commentId ? comment.content : truncate(comment.content, 120) }}
              </p>
              <button
                v-if="(comment.content?.length ?? 0) > 120"
                class="text-xs text-muted-foreground/60 hover:text-muted-foreground mt-0.5 transition-colors"
                @click="expandedId = expandedId === comment.commentId ? null : comment.commentId"
              >
                {{ expandedId === comment.commentId ? '折りたたむ' : 'もっと見る' }}
              </button>

              <!-- Filter reasons / moderation reason -->
              <div v-if="comment.filterReasons?.length" class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="r in comment.filterReasons"
                  :key="r"
                  class="text-[11px] bg-red-500/10 text-red-400 rounded px-1.5 py-0.5"
                >{{ r }}</span>
                <span class="text-[11px] text-muted-foreground">score: {{ comment.filterScore }}</span>
              </div>
              <p v-if="comment.moderationReason" class="text-[11px] text-orange-400 mt-1">
                Claude: {{ comment.moderationReason }}
              </p>
            </div>

            <!-- Per-row actions -->
            <div class="shrink-0 flex items-center gap-1">
              <!-- Approve (for rejected) -->
              <Button
                v-if="comment.status === 'rejected_filter' || comment.status === 'rejected_claude'"
                size="sm"
                variant="ghost"
                class="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                :disabled="processing"
                @click="approve(comment)"
              >
                <CheckCircle class="size-3 mr-1" />
                承認
              </Button>
              <!-- Hide (for approved only) -->
              <Button
                v-if="comment.status === 'approved'"
                size="sm"
                variant="ghost"
                class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                :disabled="processing"
                @click="openHide([comment])"
                title="非表示にする"
              >
                <EyeOff class="size-3" />
              </Button>
              <!-- Restore (for hidden only) -->
              <Button
                v-if="comment.status === 'deleted'"
                size="sm"
                variant="ghost"
                class="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400"
                :disabled="processing"
                @click="restore(comment)"
                title="再表示する"
              >
                <Eye class="size-3" />
              </Button>
              <!-- DB Delete -->
              <Button
                size="sm"
                variant="ghost"
                class="h-7 px-2 text-xs text-muted-foreground hover:text-red-400"
                :disabled="processing"
                @click="openDelete([comment])"
                title="DBから削除"
              >
                <Trash2 class="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p class="text-sm">コメントがありません</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-else class="space-y-2">
      <div
        v-for="i in 7"
        :key="i"
        class="rounded-lg border border-border bg-card p-3 flex items-start gap-3"
      >
        <span class="cms-checkbox mt-1 shrink-0 pointer-events-none opacity-40" />
        <Skeleton class="h-5 w-16 rounded-full mt-0.5 shrink-0" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-1/4" />
          <Skeleton class="h-3 w-3/4" />
        </div>
      </div>
    </div>
  </div>

  <!-- Hide confirmation dialog -->
  <Dialog v-model:open="showHideDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>非表示にしますか？</DialogTitle>
        <DialogDescription>
          {{ dialogTargets.length }}件のコメントをブログ上で非表示にします。DBには残り、後から復元できます。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showHideDialog = false">キャンセル</Button>
        <Button @click="confirmHide">非表示にする</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- DB delete confirmation dialog -->
  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>DBから削除しますか？</DialogTitle>
        <DialogDescription>
          {{ dialogTargets.length }}件のコメントをDBから完全に削除します。この操作は取り消せません。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showDeleteDialog = false">キャンセル</Button>
        <Button variant="destructive" @click="confirmDelete">削除する</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
