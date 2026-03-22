<template>
  <div>
    <!-- Bar 1: Brand + Actions -->
    <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div class="mx-auto flex h-14 w-full max-w-content items-center justify-between px-4">
        <!-- Left: Logo + Brand -->
        <router-link
          :to="{ name: 'network-dashboard' }"
          class="flex items-center gap-2"
        >
          <img
            rel="preload"
            src="@/assets/logo.svg"
            class="h-7 w-7"
            :alt="brandLogo ? brandLogo.alt : undefined"
          />
          <span class="text-[15px] font-bold tracking-tight text-gray-900">{{ brandName }}</span>
        </router-link>

        <!-- Right: Network selector + GitHub + Mail + Mobile toggle -->
        <div class="flex items-center gap-2">
          <nav-network-selector />
          <a
            href="https://github.com/withObsrvr/stellarbeat"
            class="prism-icon-btn hidden sm:flex items-center justify-center h-9 w-9 flex-shrink-0 p-0 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            target="_blank"
            rel="noopener"
            title="GitHub"
          >
            <github class="h-4 w-4" />
          </a>
          <a
            :href="`mailto:${store.appConfig.brandEmail}`"
            class="prism-icon-btn hidden sm:flex items-center justify-center h-9 w-9 flex-shrink-0 p-0 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            target="_blank"
            rel="noopener"
            title="Mail"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </a>
          <button
            class="flex lg:hidden items-center justify-center h-9 w-9 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            type="button"
            aria-label="Toggle navigation"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Bar 2: Navigation -->
    <NavCollapse
      :mobile-open="mobileNavOpen"
      :api-doc-url="apiDocUrl"
      :blog-url="blogUrl"
      :github-url="githubUrl"
      :mail-to="mailTo"
      :include-organizations="includeOrganizations"
      :include-notify="includeNotify"
      :include-contact-us="includeContactUs"
      :include-faq="includeFAQ"
      :faq-route="faqRoute"
      :brand-name="brandName"
      :brand-tagline="brandTagline"
      :brand-logo="brandLogo"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, type PropType } from "vue";
import NavNetworkSelector from "@/components/layout/NavNetworkSelector.vue";
import NavCollapse from "@/components/layout/NavCollapse.vue";
import Github from "@/components/organization/logo/github.vue";
import useStore from "@/store/useStore";

export interface BrandLogo {
  src: string;
  alt: string;
}

defineProps({
  faqRoute: {
    type: String,
    required: false,
    default: undefined,
  },
  brandName: {
    type: String,
    required: true,
  },
  brandTagline: {
    type: String,
    required: true,
  },
  includeOrganizations: {
    type: Boolean,
    default: true,
  },
  includeNotify: {
    type: Boolean,
    default: false,
  },
  includeContactUs: {
    type: Boolean,
    default: false,
  },
  includeFAQ: {
    type: Boolean,
    default: false,
  },
  apiDocUrl: {
    type: String,
    default: undefined,
  },
  blogUrl: {
    type: String,
    default: undefined,
  },
  githubUrl: {
    type: String,
    default: undefined,
  },
  mailTo: {
    type: String,
    default: undefined,
  },
  brandLogo: {
    type: Object as PropType<BrandLogo>,
    required: false,
    default: undefined,
  },
});
const store = useStore();
const mobileNavOpen = ref(false);
</script>

<style>
/* Override Bootstrap styles on Prism icon buttons */
.prism-icon-btn,
.prism-icon-btn:hover,
.prism-icon-btn:focus {
  padding: 0 !important;
  text-decoration: none !important;
  box-sizing: border-box !important;
  min-width: 0 !important;
  max-width: 2.25rem !important;
  max-height: 2.25rem !important;
}

/* Reset Bootstrap link color in header */
header a {
  text-decoration: none;
}
</style>
