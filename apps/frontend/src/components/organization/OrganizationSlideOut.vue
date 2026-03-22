<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 bg-black/8 backdrop-blur-[1px] z-40"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div
        v-if="visible && organization"
        class="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] z-50 bg-white border-l border-gray-200 shadow-2xl overflow-y-auto"
      >
        <!-- Sticky header -->
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            @click="$emit('close')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            class="text-gray-400 hover:text-gray-900 transition-colors"
            @click="$emit('close')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5">
          <!-- Identity -->
          <div class="mb-1">
            <span class="text-lg font-bold text-gray-900">{{ organization.name }}</span>
          </div>

          <!-- Badges -->
          <div class="flex items-center gap-2 mt-2 mb-5">
            <UiBadge
              v-if="isFailing"
              variant="red"
            >{{ isBlocked ? 'Blocked' : 'Failing' }}</UiBadge>
            <UiBadge
              v-else-if="failAt === 1"
              variant="amber"
            >Warning</UiBadge>
            <UiBadge v-else variant="emerald">Healthy</UiBadge>
            <UiBadge v-if="organization.hasReliableUptime" variant="gray" tier="meta">
              Reliable Uptime
            </UiBadge>
          </div>

          <!-- Quick stats (2 across) -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
              <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">24H Avail.</div>
              <div class="text-lg font-bold tabular" :class="availColor(organization.subQuorum24HoursAvailability)">
                {{ organization.subQuorum24HoursAvailability }}%
              </div>
            </div>
            <div class="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
              <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">30D Avail.</div>
              <div class="text-lg font-bold tabular" :class="availColor(organization.subQuorum30DaysAvailability)">
                {{ organization.subQuorum30DaysAvailability }}%
              </div>
            </div>
          </div>

          <!-- Organization Details -->
          <div class="mb-5">
            <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Details</h3>
            <div class="rounded-xl border border-gray-200 overflow-hidden text-sm">
              <div v-if="organization.url" class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Website</span>
                <a :href="organization.url" target="_blank" rel="noopener" class="text-gray-700 hover:text-emerald-700 transition-colors truncate ml-4">
                  {{ organization.url }}
                </a>
              </div>
              <div v-if="organization.officialEmail" class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Email</span>
                <a :href="'mailto:' + organization.officialEmail" class="text-gray-700">{{ organization.officialEmail }}</a>
              </div>
              <div v-if="organization.keybase" class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Keybase</span>
                <a :href="'https://keybase.io/' + organization.keybase" target="_blank" rel="noopener" class="text-gray-700">{{ organization.keybase }}</a>
              </div>
              <div v-if="organization.github" class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">GitHub</span>
                <a :href="'https://github.com/' + organization.github" target="_blank" rel="noopener" class="text-gray-700">{{ organization.github }}</a>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5">
                <span class="text-gray-400">Fail tolerance</span>
                <span class="font-semibold tabular" :class="failAt <= 0 ? 'text-red-500' : failAt === 1 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ failAt <= 0 ? 'Failing' : failAt + ' validator(s) can fail' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Validators -->
          <div class="mb-6">
            <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Validators ({{ validators.length }})
            </h3>
            <div class="rounded-xl border border-gray-200 overflow-hidden text-sm">
              <div
                v-for="(validator, i) in validators"
                :key="validator.publicKey"
                :class="[
                  'flex items-center justify-between px-4 py-2.5',
                  i < validators.length - 1 ? 'border-b border-gray-100' : '',
                ]"
              >
                <div class="flex items-center gap-2">
                  <UiStatusDot :color="validator.isValidating ? 'emerald' : 'red'" />
                  <router-link
                    :to="{
                      name: 'node-dashboard',
                      params: { publicKey: validator.publicKey },
                      query: { center: '1', ...routeQuery },
                    }"
                    class="font-medium text-gray-900 hover:text-emerald-700 transition-colors"
                    @click="$emit('close')"
                  >{{ validator.displayName }}</router-link>
                  <UiBadge
                    v-if="network.isNodeFailing(validator)"
                    variant="danger"
                  >{{ network.getNodeFailingReason(validator).label }}</UiBadge>
                </div>
                <span class="text-xs text-gray-500 tabular">
                  {{ validator.statistics.has30DayStats ? validator.statistics.validating30DaysPercentage + '%' : 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <router-link
            :to="{
              name: 'organization-dashboard',
              params: { organizationId: organization.id },
              query: routeQuery,
            }"
            class="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            @click="$emit('close')"
          >
            Open Full Page
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </router-link>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Organization, Node } from 'shared';
import useStore from '@/store/useStore';
import { useRoute } from 'vue-router';

const props = defineProps<{
  organization: Organization | null;
  visible: boolean;
}>();

defineEmits<{
  close: [];
}>();

const store = useStore();
const network = store.network;
const route = useRoute();

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

const isFailing = computed(() =>
  props.organization ? network.isOrganizationFailing(props.organization) : false,
);

const isBlocked = computed(() =>
  props.organization ? network.isOrganizationBlocked(props.organization) : false,
);

const failAt = computed(() =>
  props.organization ? store.getOrganizationFailAt(props.organization) : 0,
);

const validators = computed(() => {
  if (!props.organization) return [];
  return props.organization.validators
    .map((pk) => network.getNodeByPublicKey(pk))
    .filter((n) => n && !n.unknown)
    .sort((a: Node, b: Node) => a.displayName.localeCompare(b.displayName));
});

function availColor(pct: number) {
  if (pct >= 99) return 'text-emerald-600';
  if (pct >= 90) return 'text-amber-600';
  return 'text-red-500';
}

watch(() => props.visible, (v) => {
  document.body.style.overflow = v ? 'hidden' : '';
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 250ms ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
