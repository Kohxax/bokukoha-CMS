import { useEventListener } from '@vueuse/core'
import type { Ref, ComputedRef } from 'vue'

export function useUnsavedChanges(isDirty: Ref<boolean> | ComputedRef<boolean>) {
  const showLeaveDialog = ref(false)
  let resolveLeave: ((value: boolean) => void) | null = null
  let confirmedLeave = false

  onBeforeRouteLeave(async () => {
    if (!isDirty.value || confirmedLeave) return true
    showLeaveDialog.value = true
    return new Promise<boolean>(resolve => {
      resolveLeave = resolve
    })
  })

  useEventListener('beforeunload', (e) => {
    if (isDirty.value) {
      e.preventDefault()
    }
  })

  function confirmLeave() {
    confirmedLeave = true
    showLeaveDialog.value = false
    resolveLeave?.(true)
  }

  function cancelLeave() {
    showLeaveDialog.value = false
    resolveLeave?.(false)
  }

  return { showLeaveDialog, confirmLeave, cancelLeave }
}
