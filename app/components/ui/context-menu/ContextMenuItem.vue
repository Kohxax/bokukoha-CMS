<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  ContextMenuItem,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<ContextMenuItemProps & {
  class?: HTMLAttributes["class"]
  inset?: boolean
  variant?: "default" | "destructive"
}>(), {
  variant: "default",
})
const emits = defineEmits<ContextMenuItemEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwarded"
    :class="cn(
      'focus:bg-primary-container focus:text-primary-container-foreground data-[variant=destructive]:text-error data-[variant=destructive]:focus:bg-error-container data-[variant=destructive]:focus:text-error-container-foreground data-[variant=destructive]:*:[svg]:!text-error [&_svg:not([class*=\'text-\'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[0.38] data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
      props.class,
    )"
  >
    <slot />
  </ContextMenuItem>
</template>
