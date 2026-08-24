<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  SwitchRoot,
  SwitchThumb,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"] }>()

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    v-bind="forwarded"
    :class="cn(
      'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-container-highest inline-flex h-6 w-10 shrink-0 items-center rounded-full border-2 border-transparent shadow-none outline-none transition-colors focus-visible:ring-ring focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-[0.38]',
      props.class,
    )"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn('bg-foreground data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0')"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
