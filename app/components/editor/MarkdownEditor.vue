<script setup lang="ts">
import {
  ImageIcon,
  BoldIcon,
  ItalicIcon,
  CodeIcon,
  StrikethroughIcon,
  LinkIcon,
  QuoteIcon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
} from 'lucide-vue-next'
import ImageInsertModal from '~/components/editor/ImageInsertModal.vue'

const props = defineProps<{
  modelValue: string
  collection?: string
  slug?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const editorRef = ref<HTMLElement>()
let view: any = null
const showModal = ref(false)

onMounted(async () => {
  const { EditorView, basicSetup } = await import('codemirror')
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

// 選択テキストをマーカーで囲む（選択なしなら空のマーカーを挿入してカーソルを中に置く）
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

// 行頭にプレフィックスを付ける（すでに付いてたらトグルで外す）
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

const toolbarActions = [
  {
    icon: BoldIcon,
    title: '太字 (Ctrl+B)',
    action: () => wrapSelection('**', '**'),
  },
  {
    icon: ItalicIcon,
    title: '斜体 (Ctrl+I)',
    action: () => wrapSelection('*', '*'),
  },
  {
    icon: StrikethroughIcon,
    title: '取り消し線',
    action: () => wrapSelection('~~', '~~'),
  },
  {
    icon: CodeIcon,
    title: 'インラインコード',
    action: () => wrapSelection('`', '`'),
  },
  { separator: true },
  {
    icon: Heading2Icon,
    title: '見出し2',
    action: () => toggleLinePrefix('## '),
  },
  {
    icon: Heading3Icon,
    title: '見出し3',
    action: () => toggleLinePrefix('### '),
  },
  { separator: true },
  {
    icon: QuoteIcon,
    title: '引用',
    action: () => toggleLinePrefix('> '),
  },
  {
    icon: ListIcon,
    title: '箇条書き',
    action: () => toggleLinePrefix('- '),
  },
  {
    icon: ListOrderedIcon,
    title: '番号付きリスト',
    action: () => toggleLinePrefix('1. '),
  },
  { separator: true },
  {
    icon: LinkIcon,
    title: 'リンク',
    action: () => {
      if (!view) return
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const insert = `[${selected || 'テキスト'}](url)`
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length - 4, head: from + insert.length - 1 },
      })
      view.focus()
    },
  },
]

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

      <!-- 画像は末尾 -->
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

    <div ref="editorRef" class="flex-1 overflow-hidden min-w-0" />

    <ImageInsertModal
      v-model:open="showModal"
      :collection="collection ?? ''"
      :slug="slug ?? ''"
      @insert="insertAtCursor"
    />
  </div>
</template>
