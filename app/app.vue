<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page' }" />
  </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.page-leave-active {
  position: absolute;
  inset: 0;
}
</style>
