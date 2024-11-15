<template>
  <div>
    <div id="sticky">
      <transition name="fade" mode="out-in">
        <div :key="stickyKey">
          <div
            class="card-header sb-card-header d-flex inverted d-flex align-items-start"
          >
            <div class="d-flex align-items-start">
              <div class="d-flex flex-column">
                <h3 class="card-title sb-card-title">
                  {{
                    federatedVotingStore.selectedNodeId
                      ? federatedVotingStore.network.getNodeByPublicKey(
                          federatedVotingStore.selectedNodeId,
                        ).displayName
                      : "Federated voting"
                  }}
                </h3>
                <h6 class="sb-card-subtitle">
                  <slot name="sub-title" />
                </h6>
              </div>
            </div>
          </div>
          <div class="card-body px-4 pt-1">
            <div class="sb-nav-bar">
              <h6 class="sb-navbar-heading">Explore</h6>
              <div class="overflow">
                <div></div>
              </div>
              <h6 class="sb-navbar-heading mt-4">Tools</h6>
              <ul class="sb-nav-list"></ul>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import Vue, { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { BIconHouse, BIconBullseye, BIconInfoCircle } from "bootstrap-vue";

Vue.component("BIconBullseye", BIconBullseye);
Vue.component("BIconHouse", BIconHouse);
Vue.component("BIconInfoCircle", BIconInfoCircle);

defineProps({
  stickyKey: {
    type: String,
    required: false,
    default: undefined,
  },
});

const icon = computed(() => {
  return federatedVotingStore.selectedNodeId ? "bullseye" : "building";
});
</script>
<style scoped>
.overflow {
  overflow-y: auto;
  max-height: calc(100vh - 22rem);
}

.sb-card-header {
  border: none !important;
  margin-top: 18px;
  margin-bottom: 0;
  margin-left: 0;
  padding-left: 21px !important;
}

.sb-card-title {
  line-height: 1 !important;
  margin-bottom: 2px !important;
}

.title-icon {
  font-size: 2rem;
  margin-bottom: 0;
}

.sb-card-subtitle {
  opacity: 0.7;
  font-weight: 500;
  margin-bottom: 0;
}

.sb-nav-bar {
  list-style: none;
  flex: 0 0 220px;
}

.sb-nav-list {
  padding-left: 0;
}

.info-title {
  font-weight: 600;
}

#sticky {
  position: sticky;
  top: 0;
}
</style>
