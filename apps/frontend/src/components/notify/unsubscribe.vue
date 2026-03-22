<template>
  <div v-if="!error">
    <div v-if="unsubscribing">
      <h4>Unsubscribing</h4>
      <div>
        <div class="loader"></div>
      </div>
    </div>
    <div>
      <UiAlert variant="success" show>Unsubscribed</UiAlert>
    </div>
  </div>
  <div v-else>
    <h4>{{ errorMessage }}</h4>
    <button role="button" class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors" @click="confirm">
      Try again
    </button>
  </div>
</template>

<script setup lang="ts">

import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const unsubscribing = ref(true);
const error = ref(true);
const errorMessage = ref("Something went wrong");

async function confirm() {
  error.value = false;
  unsubscribing.value = true;
  const subscriberRef = route.params.subscriberRef;
  try {
    const response = await fetch(
      import.meta.env.VUE_APP_PUBLIC_API_URL +
        "/v1/subscription/" +
        subscriberRef,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      error.value = true;
      errorMessage.value = "Something went wrong";
    }
  } catch (e) {
    error.value = true;
    if (e instanceof Error && e.message === "404") {
      errorMessage.value = "No subscription found";
    } else {
      errorMessage.value = "Something went wrong";
    }
  }

  unsubscribing.value = false;
}
onMounted(() => {
  confirm();
});
</script>

<style scoped></style>
