<template>
  <code class="rounded-md bg-surface-container-highest px-1.5 py-0.5 font-medium text-foreground">
    <slot />
  </code>
</template>

<style scoped>
code::before,
code::after {
  content: none !important;
}
</style>
