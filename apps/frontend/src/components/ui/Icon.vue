<template>
  <i :class="`bi bi-${name}`"></i>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>
