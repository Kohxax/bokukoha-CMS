<script setup lang="ts">
import { Hash, Minus, Plus } from 'lucide-vue-next'

type TocLink = {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

const props = defineProps<{
  links: TocLink[]
  containerRef?: HTMLElement | null
}>()

const activeId = ref('')
const isOpen = ref(true)
let observer: IntersectionObserver | null = null

function findHeading(id: string) {
  if (!props.containerRef) return null
  return Array.from(props.containerRef.querySelectorAll<HTMLElement>('h2, h3, h4')).find(
    (heading) => heading.id === id,
  )
}

function scrollToHeading(id: string) {
  findHeading(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function observeHeadings() {
  observer?.disconnect()
  observer = null

  if (!props.containerRef) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeId.value = entry.target.id
      }
    },
    {
      root: props.containerRef,
      rootMargin: '-16px 0px -66% 0px',
    },
  )

  props.containerRef
    .querySelectorAll('h2, h3, h4')
    .forEach((heading) => observer?.observe(heading))
}

watch(
  [() => props.containerRef, () => props.links],
  () => nextTick(observeHeadings),
  { immediate: true, deep: true },
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="w-full rounded-3xl border-0 bg-surface-container-high shadow-none">
    <div class="flex flex-row items-center justify-between px-4 pb-2 pt-4">
      <div class="flex flex-row items-center gap-2 text-foreground">
        <Hash class="h-4 w-4 text-primary" />
        <span class="text-base font-medium tracking-tight">目次</span>
      </div>
      <button
        type="button"
        class="m3-state-layer inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-expanded="isOpen"
        aria-label="目次の開閉"
        @click="isOpen = !isOpen"
      >
        <Minus v-if="isOpen" class="h-4 w-4" />
        <Plus v-else class="h-4 w-4" />
      </button>
    </div>
    <div v-show="isOpen" class="px-4 pb-4">
      <nav v-if="links.length > 0" aria-label="目次">
        <ul class="space-y-2 text-sm">
          <li v-for="(link, i) in links" :key="link.id">
            <a
              :href="`#${link.id}`"
              class="group relative flex items-start gap-1 border-l-2 py-1 pl-2 transition-colors hover:text-primary"
              :class="
                activeId === link.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              "
              @click.prevent="scrollToHeading(link.id)"
            >
              <span
                class="mt-0.5 min-w-6 font-mono text-sm group-hover:text-primary/70"
                :class="activeId === link.id ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ i + 1 }}.
              </span>
              <span class="leading-relaxed">{{ link.text }}</span>
            </a>

            <ul v-if="link.children?.length" class="mt-2 space-y-2 pl-2">
              <li v-for="(child, j) in link.children" :key="child.id">
                <a
                  :href="`#${child.id}`"
                  class="group relative flex items-start gap-1 border-l-2 py-0.5 pl-2 transition-colors hover:text-primary"
                  :class="
                    activeId === child.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground'
                  "
                  @click.prevent="scrollToHeading(child.id)"
                >
                  <span
                    class="mt-0.5 min-w-8 font-mono text-xs group-hover:text-primary/70"
                    :class="
                      activeId === child.id ? 'text-primary' : 'text-muted-foreground/70'
                    "
                  >
                    {{ i + 1 }}.{{ j + 1 }}.
                  </span>
                  <span class="leading-relaxed">{{ child.text }}</span>
                </a>

                <ul v-if="child.children?.length" class="mt-1 space-y-1 pl-2">
                  <li v-for="(grand, k) in child.children" :key="grand.id">
                    <a
                      :href="`#${grand.id}`"
                      class="group relative flex items-start gap-2 border-l-2 py-0.5 pl-2 transition-colors hover:text-primary"
                      :class="
                        activeId === grand.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground/80'
                      "
                      @click.prevent="scrollToHeading(grand.id)"
                    >
                      <span
                        class="mt-0.5 min-w-10 font-mono text-[10px] group-hover:text-primary/70"
                        :class="
                          activeId === grand.id
                            ? 'text-primary'
                            : 'text-muted-foreground/60'
                        "
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
    </div>
  </section>
</template>
