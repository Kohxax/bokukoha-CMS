<script setup lang="ts">
import { ImageIcon } from 'lucide-vue-next'
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
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace" },
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

defineExpose({ insertAtCursor })
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden rounded-md border border-border">
    <!-- toolbar -->
    <div class="flex items-center gap-1 border-b border-border px-2 py-1 shrink-0 bg-card">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="画像を挿入"
        @click="showModal = true"
      >
        <ImageIcon class="size-4" />
      </button>
    </div>

    <div ref="editorRef" class="flex-1 overflow-hidden" />

    <ImageInsertModal
      v-model:open="showModal"
      :collection="collection ?? ''"
      :slug="slug ?? ''"
      @insert="insertAtCursor"
    />
  </div>
</template>
