<script setup>
import { AlertTriangle } from 'lucide-vue-next'
</script>

<template>
  <div class="flex items-center p-3 rounded-xl bg-muted/30 text-forground mb-6 border-yellow-300">
    <AlertTriangle class="h-5 w-5 mr-3 shrink-0 text-yellow-300" />

    <div class="grow text-md font-bold">
      <slot mdc-unwrap="p" />
    </div>
  </div>
</template>

<style scoped></style>
