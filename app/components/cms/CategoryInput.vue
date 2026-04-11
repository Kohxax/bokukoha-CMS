<script setup lang="ts">
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import { Input } from '~/components/ui/input'
import { Check } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<{
  suggestions?: string[]
}>()

const model = defineModel<string>({ required: true })
const open = ref(false)

const filtered = computed(() => {
  if (!props.suggestions?.length) return []
  const q = model.value.trim().toLowerCase()
  if (!q) return props.suggestions
  return props.suggestions.filter(c => c.toLowerCase().includes(q))
})

function onFocus() {
  if (filtered.value.length > 0) open.value = true
}

function onInput() {
  open.value = filtered.value.length > 0
}

function select(cat: string) {
  model.value = cat
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverAnchor as-child>
      <Input
        v-model="model"
        placeholder="カテゴリ"
        @focus="onFocus"
        @input="onInput"
      />
    </PopoverAnchor>
    <PopoverContent
      class="p-0"
      :side-offset="4"
      align="start"
      style="width: var(--reka-popover-trigger-width)"
    >
      <Command :filter-function="() => true">
        <CommandList>
          <CommandEmpty>候補なし</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="cat in filtered"
              :key="cat"
              :value="cat"
              @select="select(cat)"
            >
              <Check :class="cn('size-4', model === cat ? 'opacity-100' : 'opacity-0')" />
              {{ cat }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
