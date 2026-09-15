<script setup lang="ts">
import { Skeleton } from '~/components/ui/skeleton'
</script>

<template>
  <div class="grid min-h-22 grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 rounded-2xl bg-surface-container-low p-3 sm:grid-cols-[minmax(0,1fr)_7rem] sm:gap-4 sm:p-4">
    <div class="min-w-0 space-y-3">
      <Skeleton class="h-5 w-2/3" />
      <div class="flex gap-3">
        <Skeleton class="h-3 w-20" />
        <Skeleton class="h-3 w-16" />
        <Skeleton class="hidden h-3 w-14 sm:block" />
      </div>
    </div>
    <Skeleton class="h-16 w-20 rounded-xl sm:h-20 sm:w-28" />
  </div>
</template>
