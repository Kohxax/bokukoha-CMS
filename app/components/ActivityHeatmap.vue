<script setup lang="ts">
import { Skeleton } from '~/components/ui/skeleton'
import { useSidebar } from '~/components/ui/sidebar'

const WEEK_COUNT = 13

const { open } = useSidebar()
const { data, pending } = useFetch('/api/admin/activity', { server: false })

const weeks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())

  const start = new Date(sunday)
  start.setDate(sunday.getDate() - (WEEK_COUNT - 1) * 7)

  const countMap = new Map<string, number>()
  for (const d of data.value?.days ?? []) {
    countMap.set(d.date, d.count)
  }

  return Array.from({ length: WEEK_COUNT }, (_, w) => {
    return Array.from({ length: 7 }, (_, d) => {
      const cell = new Date(start)
      cell.setDate(start.getDate() + w * 7 + d)

      const yyyy = cell.getFullYear()
      const mm = String(cell.getMonth() + 1).padStart(2, '0')
      const dd = String(cell.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      const count = countMap.get(dateStr) ?? 0

      return {
        dateStr,
        count,
        label: count === 0 ? `${yyyy}/${mm}/${dd}` : `${yyyy}/${mm}/${dd} — ${count}件の活動`,
      }
    })
  })
})

function cellClass(count: number) {
  if (count === 0) return 'bg-muted'
  if (count === 1) return 'bg-emerald-900'
  if (count === 2) return 'bg-emerald-700'
  if (count === 3) return 'bg-emerald-500'
  return 'bg-emerald-400'
}
</script>

<template>
  <div
    class="px-2 pt-1 pb-2 overflow-hidden transition-opacity duration-150"
    :class="open ? 'opacity-100 delay-200' : 'opacity-0 h-0 py-0 pointer-events-none'"
  >
    <p class="text-xs text-muted-foreground mb-1">アクティビティ</p>
    <Skeleton v-if="pending" class="w-full rounded" style="height: 75px" />
    <div v-else class="flex gap-[0.3vw]">
      <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[0.3vw]">
        <div
          v-for="cell in week"
          :key="cell.dateStr"
          class="w-3 h-3 cells transition-colors hover:opacity-80"
          :class="cellClass(cell.count)"
          :title="cell.label"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cells {
  border-radius: 2px;
}
</style>
