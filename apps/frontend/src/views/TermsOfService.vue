<template>
  <div class="container mt-4 mb-5">
    <div class="card">
      <div class="card-header">
        <h1>Terms of Service</h1>
        <p class="text-muted mb-0">Effective: December 29, 2025</p>
        <p class="small mt-2 mb-0">
          These Terms of Service consist of the Obsrvr Master Terms (applicable to
          all Obsrvr services) and the Radar Product Addendum (specific to Obsrvr Radar).
        </p>
      </div>
      <div class="card-body">
        <!-- Master Terms -->
        <ObsrvrMasterTerms />

        <!-- Divider -->
        <div class="section-divider my-5">
          <hr class="thick-divider" />
          <p class="text-center text-muted my-3">
            <strong>End of Master Terms | Beginning of Radar Product Addendum</strong>
          </p>
          <hr class="thick-divider" />
        </div>

        <!-- Radar Product Addendum -->
        <RadarProductAddendum />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ObsrvrMasterTerms from './legal/ObsrvrMasterTerms.vue';
import RadarProductAddendum from './legal/RadarProductAddendum.vue';
</script>

<style scoped>
.card-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.section-divider {
  margin: 3rem 0;
}

.thick-divider {
  border-top: 3px solid #dee2e6;
}
</style>
