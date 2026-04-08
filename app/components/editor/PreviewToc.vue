<script setup lang="ts">
import { Hash, Minus, Plus } from 'lucide-vue-next'

type TocLink = {
  id: string
  depth: number
  text: string
  children: TocLink[]
}

const props = defineProps<{
  links: TocLink[]
  containerRef?: HTMLElement | null
}>()

const isOpen = ref(true)
const activeId = ref('')

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      root: props.containerRef ?? null,
      rootMargin: '-80px 0px -60% 0px',
    },
  )

  document.querySelectorAll('.preview-content h2, .preview-content h3, .preview-content h4').forEach((h) => {
    observer.observe(h)
  })

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<template>
  <Card class="w-full border-none bg-muted/30 shadow-none">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 px-4 py-3">
      <CardTitle class="text-foreground flex flex-row gap-2 items-center">
        <Hash class="h-4 w-4 text-primary" />
        <span class="text-base font-medium tracking-tight">目次</span>
      </CardTitle>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
        @click="isOpen = !isOpen"
        title="目次の開閉"
      >
        <Minus v-if="isOpen" class="h-4 w-4" />
        <Plus v-else class="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent v-show="isOpen" class="pb-4 px-4">
      <nav v-if="links.length > 0">
        <ul class="space-y-2 text-sm">
          <li v-for="(link, i) in links" :key="link.id">
            <a
              :href="`#${link.id}`"
              @click.prevent="scrollToHeading(link.id)"
              class="group flex items-start gap-1 py-1 transition-colors hover:text-primary relative pl-2 border-l-2"
              :class="[
                activeId === link.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground',
              ]"
            >
              <span
                class="mt-0.5 min-w-6 text-sm font-mono group-hover:text-primary/70"
                :class="activeId === link.id ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ i + 1 }}.
              </span>
              <span class="leading-relaxed">{{ link.text }}</span>
            </a>

            <ul v-if="link.children.length > 0" class="mt-2 space-y-2 pl-2">
              <li v-for="(child, j) in link.children" :key="child.id">
                <a
                  :href="`#${child.id}`"
                  @click.prevent="scrollToHeading(child.id)"
                  class="group flex items-start gap-1 py-0.5 transition-colors hover:text-primary relative pl-2 border-l-2"
                  :class="[
                    activeId === child.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground',
                  ]"
                >
                  <span
                    class="mt-0.5 min-w-8 text-xs font-mono group-hover:text-primary/70"
                    :class="activeId === child.id ? 'text-primary' : 'text-muted-foreground/70'"
                  >
                    {{ i + 1 }}.{{ j + 1 }}.
                  </span>
                  <span class="leading-relaxed">{{ child.text }}</span>
                </a>

                <ul v-if="child.children.length > 0" class="mt-1 space-y-1 pl-2">
                  <li v-for="(grand, k) in child.children" :key="grand.id">
                    <a
                      :href="`#${grand.id}`"
                      @click.prevent="scrollToHeading(grand.id)"
                      class="group flex items-start gap-2 py-0.5 transition-colors hover:text-primary relative pl-2 border-l-2"
                      :class="[
                        activeId === grand.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground/80',
                      ]"
                    >
                      <span
                        class="mt-0.5 min-w-10 text-[10px] font-mono group-hover:text-primary/70"
                        :class="activeId === grand.id ? 'text-primary' : 'text-muted-foreground/60'"
                      >
                        {{ i + 1 }}.{{ j + 1 }}.{{ k + 1 }}.
                      </span>
                      <span class="leading-relaxed">{{ grand.text }}</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div v-else class="text-sm text-muted-foreground">目次はありません</div>
    </CardContent>
  </Card>
</template>
