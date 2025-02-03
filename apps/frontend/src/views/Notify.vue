<template>
  <div>
    <!--consent /!-->
    <div class="page-header mt-2 py-3">
      <h1 class="page-title mr-2">Notify</h1>
    </div>
    <div class="card">
      <div class="card-body">
        <router-view />
      </div>
      <div
        v-show="$route.name && !$route.name.match('privacy')"
        class="card-footer"
      >
        <div class="d-flex privacy-link">
          <a
            :href="privacyLink"
            class="nav-link"
            target="_blank"
            rel="noopener"
          >
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useMetaTags from "@/composables/useMetaTags";

const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
useMetaTags("Notify", "Get notified on network, node or organization events");
</script>
<style scoped>
.privacy-link {
  justify-content: flex-end;
}
</style>
