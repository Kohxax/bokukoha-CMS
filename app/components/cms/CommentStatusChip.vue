<script setup lang="ts">
import { Badge } from '~/components/ui/badge'

const props = defineProps<{ status: string }>()

const statusLabel: Record<string, string> = {
  approved: '承認済み',
  rejected_filter: 'ルール拒否',
  rejected_claude: 'Claude拒否',
  deleted: '非表示',
}

const statusClass: Record<string, string> = {
  approved: 'bg-primary-container text-primary-container-foreground',
  rejected_filter: 'bg-error-container text-error-container-foreground',
  rejected_claude: 'bg-warning-container text-warning-container-foreground',
  deleted: 'bg-surface-container-highest text-muted-foreground',
}
</script>

<template>
  <Badge
    variant="secondary"
    class="h-5 px-2 text-[11px] font-medium"
    :class="statusClass[props.status] ?? 'bg-surface-container-highest text-muted-foreground'"
  >
    {{ statusLabel[props.status] ?? props.status }}
  </Badge>
</template>
