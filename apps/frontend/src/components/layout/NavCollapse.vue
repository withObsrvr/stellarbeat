<template>
  <div id="nav_collapse" class="bg-white border-b border-gray-100" :class="{ 'hidden lg:block': !mobileOpen }">
      <div class="mx-auto w-full max-w-content px-4">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <!-- Nav links -->
          <nav class="flex flex-col lg:flex-row lg:items-stretch lg:h-10 lg:-ml-3 text-[13px] font-medium text-gray-500">
            <router-link
              :to="{
                name: 'network-dashboard',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass(homeActiveClass.active)"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Home
            </router-link>
            <router-link
              :to="{
                name: 'nodes',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass($route.name === 'nodes' || $route.name === 'node-dashboard')"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="1"/></svg>
              Nodes
            </router-link>
            <router-link
              v-if="includeOrganizations"
              :to="{
                name: 'organizations',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass($route.name === 'organizations' || $route.name === 'organization-dashboard')"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Organizations
            </router-link>
            <router-link
              v-if="
                includeNotify &&
                !store.isLoading &&
                !store.fetchingDataFailed &&
                store.networkId === 'public' &&
                !store.isSimulation
              "
              :to="{
                name: 'subscribe',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass($route.name === 'subscribe')"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Notify
            </router-link>
            <router-link
              v-if="
                includeContactUs &&
                !store.isLoading &&
                !store.fetchingDataFailed &&
                store.networkId === 'public' &&
                !store.isSimulation
              "
              :to="{
                name: 'contact-form',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass($route.name === 'contact-form')"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Contact Us
            </router-link>
            <a
              v-if="blogUrl"
              :class="navClass(false)"
              target="_blank"
              :href="blogUrl"
              rel="noopener"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              Blog
            </a>
            <a
              v-if="apiDocUrl"
              :class="navClass(false)"
              target="_blank"
              :href="apiDocUrl"
              rel="noopener"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              API
            </a>
            <router-link
              :to="{
                name: 'faq',
                query: { view: $route.query.view, network: $route.query.network, at: $route.query.at },
              }"
              :class="navClass($route.name === 'faq')"
            >
              <svg class="mr-1.5 h-3.5 w-3.5 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              FAQ
            </router-link>
          </nav>

          <!-- Search -->
          <div class="py-2 lg:py-0 lg:ml-auto lg:w-72">
            <form class="input-icon">
              <Search v-if="!store.isLoading && !store.fetchingDataFailed" />
            </form>
          </div>
        </div>

        <!-- Mobile: network selector -->
        <div class="lg:hidden pb-2">
          <NavNetworkSelector />
        </div>
      </div>
  </div>
</template>
<script setup lang="ts">
import { computed, type PropType } from "vue";
import useStore from "@/store/useStore";
import { useRoute } from "vue-router";
import { type BrandLogo } from "@/components/layout/Navbar.vue";
import NavNetworkSelector from "@/components/layout/NavNetworkSelector.vue";
import Search from "@/components/search.vue";

defineProps({
  mobileOpen: {
    type: Boolean,
    default: false,
  },
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
const route = useRoute();

const homeActiveClass = computed(() => {
  return {
    active:
      route.name === "network-dashboard" ||
      route.name === "node-dashboard" ||
      route.name === "organization-dashboard",
  };
});

function navClass(isActive: boolean) {
  const base = 'relative flex items-center transition-colors';
  const layout = 'px-4 py-2.5 lg:px-3 lg:py-0 lg:h-full';
  if (isActive) {
    return `${base} ${layout} text-gray-900 font-semibold bg-gray-50 lg:bg-transparent border-l-2 border-gray-900 lg:border-l-0 lg:border-b-2 lg:border-b-gray-900 lg:-mb-px`;
  }
  return `${base} ${layout} text-gray-500 hover:text-gray-900 hover:bg-gray-50 lg:hover:bg-transparent border-l-2 border-transparent lg:border-l-0 lg:border-b-2 lg:border-b-transparent lg:-mb-px`;
}
</script>

<style>
/* Nav link colors */
#nav_collapse a,
#nav_collapse a:hover,
#nav_collapse a:focus {
  text-decoration: none;
}

#nav_collapse nav a {
  color: #6B7280;
}

#nav_collapse nav a:hover {
  color: #111827;
}

#nav_collapse nav a.router-link-active,
#nav_collapse nav a[class*="font-semibold"] {
  color: #111827;
}
</style>
