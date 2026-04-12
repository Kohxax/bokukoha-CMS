<script setup lang="ts">
import {
  ImageIcon,
  BoldIcon,
  ItalicIcon,
  CodeIcon,
  SquareCodeIcon,
  StrikethroughIcon,
  LinkIcon,
  QuoteIcon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  PuzzleIcon,
  ChevronDownIcon,
} from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import ImageInsertModal from '~/components/editor/ImageInsertModal.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '~/components/ui/context-menu'

const props = defineProps<{
  modelValue: string
  collection?: string
  slug?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const editorRef = ref<HTMLElement>()
let view: any = null
const showModal = ref(false)
const showComponentMenu = ref(false)
const componentMenuRef = ref<HTMLElement>()

onMounted(async () => {
  const { EditorView, basicSetup } = await import('codemirror')
  const { scrollPastEnd } = await import('@codemirror/view')
  const { markdown } = await import('@codemirror/lang-markdown')
  const { oneDark } = await import('@codemirror/theme-one-dark')
  const { EditorState } = await import('@codemirror/state')

  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue || '',
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        EditorView.lineWrapping,
        scrollPastEnd(),
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%', width: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', overflowX: 'hidden', fontFamily: "'Fira Code', 'Consolas', monospace" },
          '.cm-content': { maxWidth: '100%' },
        }),
      ],
    }),
    parent: editorRef.value!,
  })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (newVal !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: newVal ?? '' },
      })
    }
  },
)

function insertAtCursor(text: string) {
  if (!view) return
  const from = view.state.selection.main.head
  view.dispatch({
    changes: { from, to: from, insert: text },
    selection: { anchor: from + text.length },
  })
  view.focus()
}

function wrapSelection(before: string, after: string) {
  if (!view) return
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  const insert = before + selected + after
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + before.length, head: from + before.length + selected.length },
  })
  view.focus()
}

function toggleLinePrefix(prefix: string) {
  if (!view) return
  const { from, to } = view.state.selection.main
  const startLine = view.state.doc.lineAt(from)
  const endLine = view.state.doc.lineAt(to)
  const changes: { from: number; to: number; insert: string }[] = []

  const allHavePrefix = Array.from({ length: endLine.number - startLine.number + 1 }, (_, i) => {
    return view.state.doc.line(startLine.number + i)
  }).every((line: any) => line.text.startsWith(prefix))

  for (let n = startLine.number; n <= endLine.number; n++) {
    const line = view.state.doc.line(n)
    if (allHavePrefix) {
      changes.push({ from: line.from, to: line.from + prefix.length, insert: '' })
    } else {
      changes.push({ from: line.from, to: line.from, insert: prefix })
    }
  }

  view.dispatch({ changes })
  view.focus()
}

// カーソル位置にコンポーネントを挿入してカーソルを編集すべき箇所に移動
// selectLength を指定するとカーソル位置から指定文字数を選択状態にする
function insertComponent(snippet: string, cursorOffset: number, selectLength?: number) {
  if (!view) return
  showComponentMenu.value = false
  const from = view.state.selection.main.head
  // 行頭でなければ改行を前に入れる
  const line = view.state.doc.lineAt(from)
  const prefix = from !== line.from ? '\n' : ''
  const insert = prefix + snippet
  const anchor = from + prefix.length + cursorOffset
  view.dispatch({
    changes: { from, to: from, insert },
    selection: selectLength ? { anchor, head: anchor + selectLength } : { anchor },
  })
  view.focus()
}

const componentSnippets = [
  {
    label: 'Alert',
    description: '警告・注意ボックス',
    snippet: '::Alert\nここにテキスト\n::',
    // "::Alert\n" の後ろにカーソル
    cursorOffset: '::Alert\n'.length,
  },
  {
    label: 'Gallery',
    description: '画像ギャラリー（スライダー）',
    snippet: '::Gallery{:images=\'["https://", "https://"]\' }\n::',
    cursorOffset: '::Gallery{:images=\'["'.length,
  },
  {
    label: 'VideoPlayer',
    description: 'YouTube / ニコニコ / 動画ファイル',
    snippet: '::VideoPlayer{src="https://"}\n::',
    cursorOffset: '::VideoPlayer{src="'.length,
  },
]

// クリック外でメニューを閉じる
onClickOutside(componentMenuRef, () => {
  showComponentMenu.value = false
})

const toolbarActions = [
  { icon: BoldIcon, title: '太字', action: () => wrapSelection('**', '**') },
  { icon: ItalicIcon, title: '斜体', action: () => wrapSelection('*', '*') },
  { icon: StrikethroughIcon, title: '取り消し線', action: () => wrapSelection('~~', '~~') },
  { icon: CodeIcon, title: 'インラインコード', action: () => wrapSelection('`', '`') },
  { icon: SquareCodeIcon, title: 'コードブロック', action: () => insertComponent('```js [filename]\ncode here\n```', 3, 2) },
  { separator: true },
  { icon: Heading2Icon, title: '見出し2', action: () => toggleLinePrefix('## ') },
  { icon: Heading3Icon, title: '見出し3', action: () => toggleLinePrefix('### ') },
  { separator: true },
  { icon: QuoteIcon, title: '引用', action: () => toggleLinePrefix('> ') },
  { icon: ListIcon, title: '箇条書き', action: () => toggleLinePrefix('- ') },
  { icon: ListOrderedIcon, title: '番号付きリスト', action: () => toggleLinePrefix('1. ') },
  { separator: true },
  {
    icon: LinkIcon,
    title: 'リンク',
    action: () => insertLink(),
  },
]

function insertLink() {
  if (!view) return
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  const insert = `[${selected || 'テキスト'}](url)`
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length - 4, head: from + insert.length - 1 },
  })
  view.focus()
}

defineExpose({ insertAtCursor })
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden rounded-md border border-border">
    <!-- toolbar -->
    <div class="flex items-center gap-0.5 border-b border-border px-2 py-1 shrink-0 bg-card flex-wrap">
      <template v-for="(item, i) in toolbarActions" :key="i">
        <div v-if="'separator' in item" class="w-px h-4 bg-border mx-1" />
        <button
          v-else
          type="button"
          class="inline-flex items-center justify-center rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          :title="item.title"
          @click="item.action()"
        >
          <component :is="item.icon" class="size-4" />
        </button>
      </template>

      <!-- セパレータ -->
      <div class="w-px h-4 bg-border mx-1" />

      <!-- カスタムコンポーネント挿入 -->
      <div ref="componentMenuRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs"
          title="コンポーネントを挿入"
          @click="showComponentMenu = !showComponentMenu"
        >
          <PuzzleIcon class="size-4" />
          <ChevronDownIcon class="size-3" />
        </button>

        <div
          v-show="showComponentMenu"
          class="absolute top-full right-0 mt-1 z-50 min-w-44 rounded-md border border-border bg-card shadow-md py-1"
        >
          <button
            v-for="comp in componentSnippets"
            :key="comp.label"
            type="button"
            class="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            @click="insertComponent(comp.snippet, comp.cursorOffset)"
          >
            <div class="font-medium text-foreground">{{ comp.label }}</div>
            <div class="text-xs text-muted-foreground">{{ comp.description }}</div>
          </button>
        </div>
      </div>

      <!-- 画像 -->
      <div class="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        class="inline-flex items-center justify-center rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="画像を挿入"
        @click="showModal = true"
      >
        <ImageIcon class="size-4" />
      </button>
    </div>

    <ContextMenu>
      <ContextMenuTrigger as-child>
        <div ref="editorRef" class="flex-1 overflow-hidden min-w-0" />
      </ContextMenuTrigger>
      <ContextMenuContent class="w-56">
        <ContextMenuLabel class="text-xs text-muted-foreground">書式</ContextMenuLabel>
        <ContextMenuItem @click="wrapSelection('**', '**')">
          <BoldIcon class="size-4 mr-2" />太字
        </ContextMenuItem>
        <ContextMenuItem @click="wrapSelection('*', '*')">
          <ItalicIcon class="size-4 mr-2" />斜体
        </ContextMenuItem>
        <ContextMenuItem @click="wrapSelection('~~', '~~')">
          <StrikethroughIcon class="size-4 mr-2" />取り消し線
        </ContextMenuItem>
        <ContextMenuItem @click="wrapSelection('`', '`')">
          <CodeIcon class="size-4 mr-2" />インラインコード
        </ContextMenuItem>
        <ContextMenuItem @click="insertComponent('```js [filename]\ncode here\n```', 3, 2)">
          <SquareCodeIcon class="size-4 mr-2" />コードブロック
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuLabel class="text-xs text-muted-foreground">挿入</ContextMenuLabel>
        <ContextMenuItem @click="showModal = true">
          <ImageIcon class="size-4 mr-2" />画像
        </ContextMenuItem>
        <ContextMenuItem @click="insertLink">
          <LinkIcon class="size-4 mr-2" />リンク
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <PuzzleIcon class="size-4 mr-2" />コンポーネント
          </ContextMenuSubTrigger>
          <ContextMenuSubContent class="w-52">
            <ContextMenuItem
              v-for="comp in componentSnippets"
              :key="comp.label"
              @click="insertComponent(comp.snippet, comp.cursorOffset)"
            >
              <div>
                <div class="font-medium">{{ comp.label }}</div>
                <div class="text-xs text-muted-foreground">{{ comp.description }}</div>
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>

    <ImageInsertModal
      v-model:open="showModal"
      :collection="collection ?? ''"
      :slug="slug ?? ''"
      @insert="insertAtCursor"
    />
  </div>
</template>
