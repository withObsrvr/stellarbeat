<template>
  <div id="app" class="page full">
    <div class="flex-fill">
      <navbar
        v-if="!isFederatedVotingRoute"
        :brand-tagline="store.appConfig.brandTagline"
        :brand-name="store.appConfig.brandName"
        :brand-logo="{
          alt: store.appConfig.brandLogoAlt,
          src: store.appConfig.brandLogoSrc,
        }"
        :api-doc-url="store.appConfig.apiDocUrl"
        :blog-url="store.appConfig.blogUrl"
        :include-notify="store.networkContext.enableNotify"
        :include-contact-us="store.networkContext.enableContactUs"
      ></navbar>
      <div class="container-fluid h-100 mt-0 mt-md-2" style="max-width: 1360px">
        <div class="">
          <div v-if="showError" class="alert alert-danger mb-0" role="alert">
            {{ errorMessage }}
          </div>
          <div
            v-if="
              ['fbas', 'fbas2'].includes(store.networkContext.networkId) &&
              !isFederatedVotingRoute
            "
            class="alert alert-info mb-0"
            role="alert"
          >
            Learn more about the demo networks
            <a
              href="https://medium.com/stellarbeatio/stellar-fbas-intuition-5b8018f58f3e"
              target="_blank"
              rel="noopener"
            >
              here!
            </a>
          </div>
        </div>

        <div v-if="store.isLoading" class="d-flex justify-content-center mt-5">
          <div class="loader"></div>
        </div>
        <div v-else>
          <router-view
            v-if="!store.isLoading && !store.fetchingDataFailed"
            :is-loading="store.isLoading"
          />
          <custom-network></custom-network>
        </div>
      </div>
    </div>
    <footer v-if="!store.isLoading" class="footer">
      <div class="container-fluid" style="max-width: 1360px">
        <div class="d-flex justify-content-between mx-4">
          <div class="">
            <a
              class="nav-link"
              :href="termsLink"
              target="_blank"
              rel="noopener"
            >
              Terms and Conditions
            </a>
            <a
              class="nav-link"
              :href="privacyLink"
              target="_blank"
              rel="noopener"
            >
              Privacy Policy
            </a>
          </div>
          <div class="nav-item d-lg-flex pr-0">
            <div class="d-flex">
              <a
                href="https://github.com/withObsrvr/stellarbeat"
                class="btn btn-sm bt btn-secondary gray"
                target="_blank"
                rel="noopener"
              >
                <span style="display: inline-flex; align-items: center;"><github />Github</span></a
              >
              <a
                :href="`mailto:${store.appConfig.brandEmail}`"
                rel="noopener"
                class="btn btn-sm bt btn-secondary gray ml-2"
                target="_blank"
              >
                <b-icon-envelope />
                Mail</a
              >
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/components/layout/Navbar.vue";
import Github from "@/components/organization/logo/github.vue";
import CustomNetwork from "@/components/network/tools/modify-network.vue";
import { isString } from "shared";
import useStore from "@/store/useStore";
import { computed, nextTick, onBeforeMount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import useMetaTags from "@/composables/useMetaTags";
import { BIconEnvelope } from '@/components/bootstrap-compat';

const errorMessage = ref("Could not connect to api, please refresh the page");

const store = useStore();
const showError = store.fetchingDataFailed;
const route = useRoute();

useMetaTags(
  `${store.appConfig.brandTagline}`,
  store.appConfig.brandDescription,
);

const getNetworkIdFromQueryParam = (
  networkQueryParameter: string | null | (string | null)[],
): string | null => {
  if (isString(networkQueryParameter)) return networkQueryParameter;
  return null;
};

const networkId = computed(() => {
  return getNetworkIdFromQueryParam(route.query.network);
});

const timeTravelDate = computed(() => {
  return store.getDateFromParam(route.query.at);
});

const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
const termsLink = import.meta.env.VUE_APP_TERMS_LINK;

const isFederatedVotingRoute = computed(() => {
  return (
    route.name === "federated-voting" ||
    (route.path && route.path.includes("/federated-voting"))
  );
});

onBeforeMount(async () => {
  await store.updateNetwork(networkId.value, timeTravelDate.value);
});

watch(
  [networkId, timeTravelDate],
  async () => {
    if (!store.networkNeedsToBeUpdated(networkId.value, timeTravelDate.value))
      return;

    store.isLoading = true;
    nextTick(async () => {
      //next tick is needed to toggle the loading state. The loading state is needed to clean up the previous gui.
      await store.updateNetwork(networkId.value, timeTravelDate.value);
    });
  },
  { immediate: false, deep: true },
);
</script>

<style scoped>
.full {
  background: #f5f7fb;
}
</style>

<style>
.gray {
  color: #80858a !important;
}
</style>
