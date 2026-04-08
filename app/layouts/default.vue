<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Toaster } from '~/components/ui/sonner'
import { BookText, Briefcase, LogOut, Rocket } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const { clear: clearSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}

const deploying = ref(false)
async function deploy() {
  deploying.value = true
  try {
    await $fetch('/api/admin/deploy', { method: 'POST' })
    toast.success('デプロイをトリガーしました')
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'デプロイに失敗しました')
  } finally {
    deploying.value = false
  }
}

const navItems = [
  { title: 'Blog', url: '/blog', icon: BookText },
  { title: 'Work', url: '/work', icon: Briefcase },
]
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <NuxtLink to="/">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                  K
                </div>
                <div class="leading-tight">
                  <span class="truncate text-lg font-semibold">ぼくこは.cms</span>
                </div>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>コンテンツ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navItems" :key="item.title">
                <SidebarMenuButton
                  as-child
                  :data-active="route.path.startsWith(item.url)"
                >
                  <NuxtLink :to="item.url">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton :disabled="deploying" @click="deploy">
              <Rocket />
              <span>{{ deploying ? 'Deploying...' : 'Deploy' }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton @click="logout">
              <LogOut />
              <span>ログアウト</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

    <SidebarInset>
      <header class="flex h-12 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger class="-ml-1" />
        <div class="flex-1" />
        <Button
          class="md:hidden"
          size="sm"
          variant="outline"
          :disabled="deploying"
          @click="deploy"
        >
          <Rocket class="size-4" />
          <span>{{ deploying ? '...' : 'Deploy' }}</span>
        </Button>
      </header>
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>

  <ClientOnly>
    <Toaster position="bottom-right" />
  </ClientOnly>
</template>
