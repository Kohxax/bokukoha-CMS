<script setup lang="ts">
definePageMeta({ layout: false })

const { loggedIn, fetch: refreshSession } = useUserSession()

if (loggedIn.value) {
  await navigateTo('/')
}

const isDev = import.meta.dev

const password = ref('')
const totpToken = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value, totpToken: totpToken.value || undefined },
    })
    await refreshSession()
    await navigateTo('/')
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 429) {
      error.value = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください'
    } else {
      error.value = 'パスワードまたは認証コードが正しくありません'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="w-full max-w-sm space-y-6 p-8 rounded-3xl border border-transparent bg-surface-container-low shadow-[var(--elevation-2)]">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          ぼくこは.cms
        </h1>
        <p class="text-sm text-muted-foreground">管理者パスワードを入力してください</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <template v-if="!isDev">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground" for="password">
              パスワード
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="m3-text-field text-sm text-foreground placeholder:text-muted-foreground/70"
            >
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground" for="totp">
              認証コード
            </label>
            <input
              id="totp"
              v-model="totpToken"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="000000"
              class="m3-text-field text-sm text-foreground placeholder:text-muted-foreground/70 tracking-widest"
            >
          </div>
        </template>

        <p v-if="isDev" class="text-xs text-muted-foreground text-center">
          dev モード — 認証スキップ
        </p>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {{ loading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </form>
    </div>
  </div>
</template>
