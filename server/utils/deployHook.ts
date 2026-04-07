export function triggerDeploy() {
  const config = useRuntimeConfig()
  const url = config.cfDeployHookUrl

  if (!url) return

  // Fire-and-forget — do not await
  fetch(url, { method: 'POST' }).catch((err) => {
    console.warn('[deployHook] Failed to trigger deploy:', err)
  })
}
