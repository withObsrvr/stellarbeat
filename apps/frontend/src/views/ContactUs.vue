<template>
  <div>
    <div class="page-header mt-2 py-3">
      <h1 class="page-title mr-2">Contact Us</h1>
    </div>
    <div class="card">
      <div class="card-body">
        <router-view />
      </div>
      <div class="card-footer">
        <div class="d-flex privacy-link">
          <a
            :href="privacyLink"
            class="nav-link"
            target="_blank"
            rel="noopener noreferrer"
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
useMetaTags(
  "Contact Us",
  "Get in touch about validator hosting and setup services"
);
</script>

<style scoped>
.privacy-link {
  justify-content: flex-end;
}
</style>
