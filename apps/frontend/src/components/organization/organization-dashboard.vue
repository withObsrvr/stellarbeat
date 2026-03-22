<template>
  <div>
    <portal-target name="simulate-node-modal"> </portal-target>
    <div v-if="organization">
      <UiAlert
        :show="network.isOrganizationFailing(organization)"
        variant="danger"
      >
        {{ store.getOrganizationFailingReason(organization) }}
      </UiAlert>
      <UiAlert
        :show="
          OrganizationWarningDetector.organizationHasWarnings(
            organization,
            store.network,
          )
        "
        variant="warning"
      >
        <strong>Detected warning(s)</strong>
        <ul class="pl-3 ml-0">
          <li
            v-for="reason in OrganizationWarningDetector.getOrganizationWarningReasons(
              organization,
              network,
            )"
            :key="reason"
          >
            {{ reason }}.
          </li>
        </ul>
      </UiAlert>
      <div v-if="!store.isSimulation" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="lg:col-span-2">
          <organization-profile :organization="organization" />
        </div>
        <div v-if="!store.isSimulation" class="">
          <OrganizationStatisticsSubQuorum24hAvailability
            :organization="organization"
          />
          <OrganizationStatisticsSubQuorum30DAvailability
            :organization="organization"
          />
        </div>
        <div v-if="!store.isSimulation" class="">
          <history-card
            :subject="'Availability history'"
            :entity-id="organization.id"
            :fetch-day-measurements="fetchDayMeasurements"
            :fetch-measurements="
              (organizationId, from, to) =>
                organizationMeasurementStore.getStatistics(
                  organizationId,
                  from,
                  to,
                )
            "
            :day-measurement-property="'isSubQuorumAvailableCount'"
            :measurement-property="'isSubQuorumAvailable'"
          >
          </history-card>
        </div>
      </div>

      <div class="mt-4">
        <div>
          <organization-validators :organization="organization" />
        </div>
      </div>
      <div v-if="!store.isSimulation" class="mt-4">
        <div v-if="!store.isSimulation">
          <organization-latest-updates :organization="organization" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import HistoryCard from "@/components/charts/history-card.vue";
import OrganizationProfile from "@/components/organization/organization-cards/organization-profile.vue";
import OrganizationValidators from "@/components/organization/organization-cards/organization-validators.vue";
import OrganizationStatisticsSubQuorum24hAvailability from "@/components/organization/organization-cards/statistics/organization-statistics-subquorum-24h-availability.vue";
import OrganizationStatisticsSubQuorum30DAvailability from "@/components/organization/organization-cards/statistics/organization-statistics-subquorum-30D-availability.vue";
import OrganizationLatestUpdates from "@/components/organization/organization-cards/organization-latest-updates.vue";
import useStore from "@/store/useStore";
import useOrganizationMeasurementsStore from "@/store/useOrganizationMeasurementsStore";
import { OrganizationWarningDetector } from "@/services/OrganizationWarningDetector";
import { type StatisticsAggregation } from "@/store/StatisticsStore";

const store = useStore();
const organizationMeasurementStore = useOrganizationMeasurementsStore();
const network = store.network;

const organization = computed(() => {
  if (!store.selectedOrganization) throw new Error("No organization selected");
  return store.selectedOrganization;
});

const fetchDayMeasurements = (id: string, from: Date, to: Date) => {
  return organizationMeasurementStore.getDayStatistics(id, from, to) as Promise<
    StatisticsAggregation[]
  >;
};
</script>
