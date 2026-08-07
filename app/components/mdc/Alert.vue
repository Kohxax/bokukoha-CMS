<script setup lang="ts">
import { AlertTriangle, CircleX, Info } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    type?: 'warning' | 'info' | 'error'
  }>(),
  {
    type: 'warning',
  },
)

const variants = {
  warning: {
    icon: AlertTriangle,
    class: 'border-warning/35 bg-warning-container text-warning-container-foreground',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    class: 'border-info/35 bg-info-container text-info-container-foreground',
    iconClass: 'text-info',
  },
  error: {
    icon: CircleX,
    class: 'border-error/35 bg-error-container text-error-container-foreground',
    iconClass: 'text-error',
  },
} as const

const variant = computed(() => variants[props.type])
</script>

<template>
  <div
    :class="['mb-6 flex items-start rounded-2xl border p-4', variant.class]"
    :role="type === 'info' ? 'status' : 'alert'"
  >
    <component
      :is="variant.icon"
      :class="['mr-3 mt-0.5 size-5 shrink-0', variant.iconClass]"
      aria-hidden="true"
    />
    <div class="grow text-base font-medium leading-relaxed">
      <slot mdc-unwrap="p" />
    </div>
  </div>
</template>
