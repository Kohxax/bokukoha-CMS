<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { CheckCircle, ChevronDown, ChevronRight, Eye, EyeOff, MessageSquare, MoreHorizontal, Pin, PinOff, Send, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface Comment {
  articleId: string
  commentId: string
  authorName?: string
  authorId?: string
  content?: string
  parentId?: string | null
  status: string
  isAdmin?: boolean
  pinned?: boolean
  filterScore?: number
  filterReasons?: string[]
  moderationReason?: string
  createdAt: string
  replies?: Comment[]
}

const props = defineProps<{ articleId: string }>()

const loading = ref(true)
const comments = ref<Comment[]>([])
const processing = ref(false)

const showHideDialog = ref(false)
const showDeleteDialog = ref(false)
const dialogTarget = ref<Comment | null>(null)

async function load() {
  loading.value = true
  try {
    const flat = await $fetch<Comment[]>('/api/admin/comments', {
      params: { articleId: props.articleId },
    })
    comments.value = buildTree(flat)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function buildTree(items: Comment[]): Comment[] {
  const map = new Map<string, Comment>()
  for (const item of items) map.set(item.commentId, { ...item, replies: [] })
  const roots: Comment[] = []
  for (const item of map.values()) {
    if (item.parentId) {
      const parent = map.get(item.parentId)
      if (parent) { parent.replies!.push(item); continue }
    }
    roots.push(item)
  }
  return roots.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })
}

async function approve(comment: Comment) {
  try {
    await $fetch(`/api/admin/comments/${comment.commentId}`, {
      method: 'PATCH',
      body: { articleId: comment.articleId, status: 'approved' },
    })
    toast.success('承認しました')
    await load()
  } catch { toast.error('承認に失敗しました') }
}

function openHide(comment: Comment) {
  dialogTarget.value = comment
  showHideDialog.value = true
}

async function confirmHide() {
  if (!dialogTarget.value) return
  processing.value = true
  showHideDialog.value = false
  try {
    await $fetch(`/api/admin/comments/${dialogTarget.value.commentId}`, {
      method: 'PATCH',
      body: { articleId: dialogTarget.value.articleId, status: 'deleted' },
    })
    toast.success('非表示にしました')
    await load()
  } catch { toast.error('操作に失敗しました') }
  finally { processing.value = false; dialogTarget.value = null }
}

async function restore(comment: Comment) {
  try {
    await $fetch(`/api/admin/comments/${comment.commentId}`, {
      method: 'PATCH',
      body: { articleId: comment.articleId, status: 'approved' },
    })
    toast.success('再表示しました')
    await load()
  } catch { toast.error('操作に失敗しました') }
}

async function togglePin(comment: Comment) {
  const next = !comment.pinned
  try {
    await $fetch(`/api/admin/comments/${comment.commentId}`, {
      method: 'PATCH',
      body: { articleId: comment.articleId, pinned: next },
    })
    comment.pinned = next
    toast.success(next ? 'ピン止めしました' : 'ピン止めを解除しました')
    await load()
  } catch { toast.error('操作に失敗しました') }
}

function openDelete(comment: Comment) {
  dialogTarget.value = comment
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!dialogTarget.value) return
  processing.value = true
  showDeleteDialog.value = false
  try {
    await $fetch(
      `/api/admin/comments/${dialogTarget.value.commentId}?articleId=${encodeURIComponent(dialogTarget.value.articleId)}`,
      { method: 'DELETE' },
    )
    toast.success('削除しました')
    await load()
  } catch { toast.error('削除に失敗しました') }
  finally { processing.value = false; dialogTarget.value = null }
}

// ── Reply form ────────────────────────────────────────────────────────────────

const replyingTo = ref<string | null>(null)
const replyContent = ref('')
const submitting = ref(false)

function openReply(commentId: string) {
  replyingTo.value = replyingTo.value === commentId ? null : commentId
  replyContent.value = ''
}

async function submitReply(comment: Comment) {
  if (!replyContent.value.trim()) return
  submitting.value = true
  try {
    await $fetch('/api/admin/comments', {
      method: 'POST',
      body: { articleId: props.articleId, content: replyContent.value, parentId: comment.commentId },
    })
    replyingTo.value = null
    replyContent.value = ''
    toast.success('返信しました')
    await load()
  } catch { toast.error('返信に失敗しました') }
  finally { submitting.value = false }
}

// ── Top-level post ────────────────────────────────────────────────────────────

const postContent = ref('')
const posting = ref(false)
const postExpanded = ref(false)

async function submitPost() {
  if (!postContent.value.trim()) return
  posting.value = true
  try {
    await $fetch('/api/admin/comments', {
      method: 'POST',
      body: { articleId: props.articleId, content: postContent.value },
    })
    postContent.value = ''
    postExpanded.value = false
    toast.success('投稿しました')
    await load()
  } catch { toast.error('投稿に失敗しました') }
  finally { posting.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const expandedIds = ref<Set<string>>(new Set())
function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedIds.value = next
}

const countAll = (list: Comment[]): number =>
  list.reduce((a, c) => a + 1 + countAll(c.replies ?? []), 0)
const total = computed(() => countAll(comments.value))
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between bg-surface-container px-4 py-2">
      <span class="text-xs text-muted-foreground">
        {{ loading ? '読込中...' : `${total}件` }}
      </span>
      <Button size="sm" variant="ghost" class="h-7 text-xs" @click="load">再読込</Button>
    </div>

    <!-- Admin post form -->
    <div class="shrink-0 bg-surface-container px-4 py-3">
      <div>
        <textarea
          v-model="postContent"
          rows="1"
          placeholder="管理者として投稿..."
          class="m3-text-field w-full text-xs placeholder:text-muted-foreground/70 resize-none overflow-hidden"
          @focus="postExpanded = true"
          @input="(e) => { const el = e.target as HTMLTextAreaElement; el.style.height='auto'; el.style.height=el.scrollHeight+'px' }"
        />
      </div>
      <div v-if="postExpanded" class="flex justify-end gap-2 mt-2">
        <button class="text-xs text-muted-foreground hover:text-foreground" @click="postExpanded=false; postContent=''">
          キャンセル
        </button>
        <Button size="sm" class="h-6 text-xs" :disabled="!postContent.trim() || posting" @click="submitPost">
          <Send class="size-3 mr-1" />{{ posting ? '送信中...' : '投稿' }}
        </Button>
      </div>
    </div>

    <!-- Comment list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 3" :key="i" class="h-12 bg-muted/20 animate-pulse rounded" />
      </div>

      <div v-else-if="comments.length === 0" class="flex items-center justify-center h-32 text-xs text-muted-foreground">
        コメントがありません
      </div>

      <div v-else class="space-y-2 p-2">
        <template v-for="comment in comments" :key="comment.commentId">
          <!-- Root comment -->
          <article class="group rounded-2xl bg-surface-container p-3 transition-colors hover:bg-surface-container-high focus-within:bg-surface-container-high focus-within:ring-[3px] focus-within:ring-ring">
            <div class="flex items-start gap-2">
              <!-- Expand toggle -->
              <button class="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground" @click="toggleExpand(comment.commentId)">
                <component :is="expandedIds.has(comment.commentId) ? ChevronDown : ChevronRight" class="size-3.5" />
              </button>

              <div class="min-w-0 flex-1">
                <!-- Meta -->
                <div class="flex items-center gap-1.5 flex-wrap mb-1">
                  <span
                    v-if="comment.isAdmin"
                    class="inline-flex items-center gap-0.5 rounded-full bg-primary-container px-1.5 py-0.5 text-[10px] font-medium text-primary-container-foreground"
                  >管理者</span>
                  <span class="text-xs font-medium">{{ comment.authorName ?? '名無しさん' }}</span>
                  <CommentStatusChip :status="comment.status" class="h-4.5 px-1.5 text-[10px]" />
                  <Pin v-if="comment.pinned" class="size-3 shrink-0 text-warning" aria-label="ピン止め済み" />
                  <span class="text-[11px] text-muted-foreground ml-auto">{{ formatDate(comment.createdAt) }}</span>
                </div>

                <!-- Content preview -->
                <p class="line-clamp-2 text-xs leading-relaxed text-foreground">{{ comment.content }}</p>

                <!-- Expanded content + actions -->
                <template v-if="expandedIds.has(comment.commentId)">
                  <p class="text-xs leading-relaxed mt-1 whitespace-pre-wrap">{{ comment.content }}</p>

                  <div v-if="comment.filterReasons?.length" class="flex flex-wrap gap-1 mt-1">
                    <span v-for="r in comment.filterReasons" :key="r" class="rounded-full bg-error-container px-1.5 py-0.5 text-[10px] text-error-container-foreground">{{ r }}</span>
                  </div>
                  <p v-if="comment.moderationReason" class="mt-0.5 text-[10px] text-warning">Claude: {{ comment.moderationReason }}</p>

                  <!-- Actions -->
                  <div class="mt-2 flex flex-wrap items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button
                      v-if="comment.status === 'rejected_filter' || comment.status === 'rejected_claude'"
                      size="sm" variant="ghost"
                      class="h-7 px-2 text-[11px] text-primary"
                      :disabled="processing" @click="approve(comment)"
                    >
                      <CheckCircle class="size-3 mr-0.5" />承認
                    </Button>
                    <Button
                      v-if="comment.status === 'deleted'"
                      size="sm" variant="ghost"
                      class="h-7 px-2 text-[11px] text-primary"
                      :disabled="processing" @click="restore(comment)"
                    >
                      <Eye class="size-3 mr-0.5" />再表示
                    </Button>
                    <Button
                      v-if="!comment.parentId && comment.status === 'approved'"
                      size="sm" variant="ghost"
                      class="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      @click="openReply(comment.commentId)"
                    >
                      <MessageSquare class="size-3 mr-0.5" />返信
                    </Button>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button size="icon-sm" variant="ghost" class="size-7 text-muted-foreground" :disabled="processing" aria-label="その他の操作" title="その他の操作">
                          <MoreHorizontal class="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" class="w-44 rounded-xl p-1">
                        <PopoverClose v-if="comment.status === 'approved'" as-child>
                          <Button variant="ghost" class="w-full justify-start px-3 text-xs" @click="openHide(comment)">
                            <EyeOff class="size-4" />非表示
                          </Button>
                        </PopoverClose>
                        <PopoverClose v-if="comment.status === 'approved'" as-child>
                          <Button variant="ghost" class="w-full justify-start px-3 text-xs" @click="togglePin(comment)">
                            <PinOff v-if="comment.pinned" class="size-4" />
                            <Pin v-else class="size-4" />
                            {{ comment.pinned ? 'ピン止めを解除' : 'ピン止め' }}
                          </Button>
                        </PopoverClose>
                        <PopoverClose as-child>
                          <Button variant="ghost" class="w-full justify-start px-3 text-xs text-error hover:text-error" @click="openDelete(comment)">
                            <Trash2 class="size-4" />DBから削除
                          </Button>
                        </PopoverClose>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <!-- Inline reply form -->
                  <div v-if="replyingTo === comment.commentId" class="mt-2 rounded-xl bg-primary-container/25 p-2">
                    <textarea
                      v-model="replyContent"
                      rows="2"
                      placeholder="管理者として返信..."
                      class="m3-text-field min-h-20 w-full rounded-2xl text-xs placeholder:text-muted-foreground/70 resize-none"
                    />
                    <div class="flex justify-end gap-2 mt-1">
                      <button class="text-[11px] text-muted-foreground hover:text-foreground" @click="replyingTo=null; replyContent=''">
                        キャンセル
                      </button>
                      <Button size="sm" class="h-6 text-[11px]" :disabled="!replyContent.trim() || submitting" @click="submitReply(comment)">
                        <Send class="size-3 mr-0.5" />{{ submitting ? '送信中...' : '返信' }}
                      </Button>
                    </div>
                  </div>

                  <!-- Replies -->
                  <div v-if="(comment.replies?.length ?? 0) > 0" class="mt-3 ml-3 space-y-2">
                    <div v-for="reply in comment.replies" :key="reply.commentId" class="group/reply rounded-xl bg-surface-container-high p-2.5">
                      <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span
                          v-if="reply.isAdmin"
                          class="inline-flex items-center rounded-full bg-primary-container px-1.5 py-0.5 text-[10px] font-medium text-primary-container-foreground"
                        >管理者</span>
                        <span class="text-xs font-medium">{{ reply.authorName ?? '名無しさん' }}</span>
                        <CommentStatusChip :status="reply.status" class="h-4.5 px-1.5 text-[10px]" />
                        <span class="text-[11px] text-muted-foreground ml-auto">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                      <p class="text-xs leading-relaxed whitespace-pre-wrap">{{ reply.content }}</p>
                      <div class="mt-1 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/reply:opacity-100 sm:group-focus-within/reply:opacity-100">
                        <Button
                          v-if="reply.status === 'rejected_filter' || reply.status === 'rejected_claude'"
                          size="sm" variant="ghost" class="h-7 px-2 text-[10px] text-primary"
                          :disabled="processing" @click="approve(reply)"
                        ><CheckCircle class="size-2.5 mr-0.5" />承認</Button>
                        <Button
                          v-if="reply.status === 'deleted'"
                          size="sm" variant="ghost" class="h-7 px-2 text-[10px] text-primary"
                          :disabled="processing" @click="restore(reply)"
                        ><Eye class="size-2.5 mr-0.5" />再表示</Button>
                        <Popover>
                          <PopoverTrigger as-child>
                            <Button size="icon-sm" variant="ghost" class="size-7 text-muted-foreground" :disabled="processing" aria-label="その他の操作" title="その他の操作">
                              <MoreHorizontal class="size-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" class="w-44 rounded-xl p-1">
                            <PopoverClose v-if="reply.status === 'approved'" as-child>
                              <Button variant="ghost" class="w-full justify-start px-3 text-xs" @click="openHide(reply)">
                                <EyeOff class="size-4" />非表示
                              </Button>
                            </PopoverClose>
                            <PopoverClose as-child>
                              <Button variant="ghost" class="w-full justify-start px-3 text-xs text-error hover:text-error" @click="openDelete(reply)">
                                <Trash2 class="size-4" />DBから削除
                              </Button>
                            </PopoverClose>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </article>
        </template>
      </div>
    </div>
  </div>

  <Dialog v-model:open="showHideDialog">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>非表示にしますか？</DialogTitle>
        <DialogDescription>DBには残り、後から復元できます。</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showHideDialog = false">キャンセル</Button>
        <Button @click="confirmHide">非表示にする</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>DBから削除しますか？</DialogTitle>
        <DialogDescription>この操作は取り消せません。</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showDeleteDialog = false">キャンセル</Button>
        <Button variant="destructive" @click="confirmDelete">削除する</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
