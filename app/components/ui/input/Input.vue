<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="cn(
      'file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground min-h-11 w-full min-w-0 rounded-xl border border-border/70 bg-transparent px-3 py-2.5 text-base shadow-none outline-none transition-[border-color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[0.38] md:text-sm',
      'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
      'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
      props.class,
    )"
  >
</template>
