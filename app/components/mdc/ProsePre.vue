<template>
  <div class="relative my-4 overflow-hidden rounded-lg border border-border bg-background">
    <div
      class="flex items-center justify-between border-b border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
    >
      <span v-if="filename" class="font-medium select-none">
        {{ filename }}
      </span>
      <span v-else class="select-none opacity-50">
        {{ language }}
      </span>

      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        :class="{ 'text-emerald-500': isCopied, 'text-muted-foreground': !isCopied }"
        aria-label="Copy code"
        @click="handleCopy"
      >
        <CheckIcon v-if="isCopied" :size="14" />
        <CopyIcon v-else :size="14" />
      </button>
    </div>

    <pre :class="[$props.class, 'mt-0! mb-0! rounded-none! bg-background! p-4!']"><slot /></pre>
  </div>
</template>

<script setup lang="ts">
import { CopyIcon, CheckIcon } from 'lucide-vue-next'

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: null,
  },
  filename: {
    type: String,
    default: null,
  },
  highlights: {
    type: Array as () => number[],
    default: () => [],
  },
  meta: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: null,
  },
})

const isCopied = ref(false)

async function handleCopy() {
  if (!props.code) return
  try {
    await navigator.clipboard.writeText(props.code)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch {
    // clipboard unavailable
  }
}
</script>

<style>
pre code .line {
  display: block;
  min-height: 1rem;
}
</style>
