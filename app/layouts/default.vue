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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Toaster } from '~/components/ui/sonner'
import { BookText, Briefcase, Images, LogOut, Rocket } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Avatar from '~/components/ui/avatar/Avatar.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const route = useRoute()
const { clear: clearSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}

const deploying = ref(false)
const showDeployDialog = ref(false)

async function confirmDeploy() {
  showDeployDialog.value = false
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

const { data: counts } = useAsyncData(
  'counts',
  () => $fetch('/api/admin/counts').catch(() => null),
  { server: false },
)

const navItems = [
  { title: 'Blog', url: '/blog', icon: BookText, countKey: 'blog' as const },
  { title: 'Work', url: '/work', icon: Briefcase, countKey: 'work' as const },
]

const mediaItem = { title: 'Media', url: '/media', icon: Images, countKey: 'media' as const }
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <NuxtLink to="/blog">
                <Avatar class="flex aspect-square size-8 items-center justify-center">
                  <NuxtImg src="icon_glass.webp" alt="koha" />
                </Avatar>
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
                <SidebarMenuBadge v-if="counts">{{ counts[item.countKey] }}</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :data-active="route.path.startsWith(mediaItem.url)"
                >
                  <NuxtLink :to="mediaItem.url">
                    <component :is="mediaItem.icon" />
                    <span>{{ mediaItem.title }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
                <SidebarMenuBadge v-if="counts">{{ counts[mediaItem.countKey] }}</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton :disabled="deploying" @click="showDeployDialog = true">
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
          @click="showDeployDialog = true"
        >
          <Rocket class="size-4" />
          <span>{{ deploying ? '...' : 'Deploy' }}</span>
        </Button>
      </header>
      <main class="relative flex-1 overflow-auto">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>

  <ClientOnly>
    <Toaster position="bottom-right" />
  </ClientOnly>

  <Dialog v-model:open="showDeployDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>デプロイしますか？</DialogTitle>
        <DialogDescription>
          Cloudflare Pages のビルドをトリガーします。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showDeployDialog = false">キャンセル</Button>
        <Button @click="confirmDeploy">デプロイする</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
