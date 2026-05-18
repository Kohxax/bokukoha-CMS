export function useCommentNotifications() {
  const lastSeenAt = ref<string | null>(null)
  const unreadCount = ref(0)
  let pollTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchLastSeen() {
    try {
      const res = await $fetch<{ value: string | null }>('/api/admin/settings/last-seen-comments')
      if (res.value) {
        lastSeenAt.value = res.value
      } else {
        // 初回: 現在時刻を保存して既存コメントは既読扱いにする
        await markAsRead()
      }
    } catch {
      // サーバーエラーは無視
    }
  }

  async function fetchUnreadCount() {
    if (!lastSeenAt.value) return
    try {
      const res = await $fetch<{ count: number }>('/api/admin/comments/new-count', {
        query: { since: lastSeenAt.value },
      })
      unreadCount.value = res.count
    } catch {
      // DynamoDB unavailable — keep previous count
    }
  }

  async function markAsRead() {
    const now = new Date().toISOString()
    try {
      await $fetch('/api/admin/settings/last-seen-comments', {
        method: 'PATCH',
        body: { value: now },
      })
      lastSeenAt.value = now
      unreadCount.value = 0
    } catch {
      // best-effort
    }
  }

  function startPolling() {
    const tick = async () => {
      await fetchUnreadCount()
      pollTimer = setTimeout(tick, 60_000)
    }
    tick()
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  onMounted(async () => {
    await fetchLastSeen()
    startPolling()
  })

  onUnmounted(stopPolling)

  return { unreadCount, markAsRead }
}
