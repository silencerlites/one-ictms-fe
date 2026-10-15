<template>
  <header class="auth-heading q-mb-lg">
    <h1 class="auth-heading__title">{{ title || 'ONE ICTMS' }}</h1>
    <p class="auth-heading__subtitle">{{ subtitle }}</p>
  </header>
</template>
<script setup lang="ts">
defineProps<{ title?: string; subtitle: string; eyebrow?: string }>()
</script>
