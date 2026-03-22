<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-1">Notify</h1>
    <p class="text-sm text-gray-500 mb-6">Get notified on network, node, or organization events.</p>
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="p-6">
        <router-view />
      </div>
      <div
        v-show="$route.name && typeof $route.name === 'string' && !$route.name.match('privacy')"
        class="border-t border-gray-100 px-6 py-3 flex justify-end"
      >
        <a
          :href="privacyLink"
          class="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          target="_blank"
          rel="noopener"
        >Privacy policy</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useMetaTags from "@/composables/useMetaTags";

const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
useMetaTags("Notify", "Get notified on network, node or organization events");
</script>
