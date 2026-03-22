<template>
  <div>
    <!-- Introduction -->
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Professional Validator Services</h3>
      <p class="text-sm text-gray-500 mb-4">
        We offer enterprise-grade validator hosting and setup assistance for
        organizations running validators on the Stellar network.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          99.99% uptime SLA
        </div>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Expert setup assistance
        </div>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          24/7 monitoring and alerting
        </div>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Multi-region redundancy
        </div>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Secure, compliant infrastructure
        </div>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Stellar network experts
        </div>
      </div>
    </div>

    <div class="border-t border-gray-100 my-6"></div>

    <!-- Form -->
    <div v-if="submitting" class="flex flex-col items-center py-8">
      <div class="loader"></div>
      <p class="text-sm text-gray-500 mt-3">Sending your message...</p>
    </div>
    <div v-else>
      <h3 class="text-lg font-bold text-gray-900 mb-1">Get in Touch</h3>
      <p class="text-sm text-gray-400 mb-5">
        Tell us about your validator needs and we'll get back to you within 24 hours.
      </p>

      <form novalidate @submit.prevent="onSubmit" @reset="onReset">
        <UiAlert variant="success" :show="submitted">
          <strong>Thank you for contacting us!</strong> We've received your inquiry and will respond within 24 hours.
        </UiAlert>
        <UiAlert variant="danger" :show="submitError">
          <strong>Something went wrong.</strong> Please try again or contact us at {{ contactEmail }}
        </UiAlert>

        <!-- Name + Email (two columns) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label for="name-input" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="name-input"
              v-model.trim="name"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              :class="{ 'border-red-300 ring-1 ring-red-200': nameState === false }"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label for="email-input" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email-input"
              v-model.trim="emailAddress"
              type="email"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              :class="{ 'border-red-300 ring-1 ring-red-200': emailAddressState === false }"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <!-- Company -->
        <div class="mb-4">
          <label for="company-input" class="block text-sm font-medium text-gray-700 mb-1">Company / Organization <span class="text-gray-400 font-normal">(optional)</span></label>
          <input
            id="company-input"
            v-model.trim="company"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            placeholder="Your company or organization"
          />
        </div>

        <!-- Service Interest -->
        <div class="mb-4">
          <label for="service-select" class="block text-sm font-medium text-gray-700 mb-1">Service Interest</label>
          <select
            id="service-select"
            v-model="serviceInterest"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
            :class="{ 'border-red-300 ring-1 ring-red-200': serviceInterestState === false }"
            required
          >
            <option value="" disabled>-- Please select --</option>
            <option value="host-validator">Host my validator</option>
            <option value="help-setup">Help me set up</option>
            <option value="both">Both hosting and setup</option>
            <option value="general">General inquiry</option>
          </select>
        </div>

        <!-- Message -->
        <div class="mb-4">
          <label for="message-input" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            id="message-input"
            v-model.trim="message"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            :class="{ 'border-red-300 ring-1 ring-red-200': messageState === false }"
            placeholder="Describe your requirements..."
            rows="5"
            required
          ></textarea>
        </div>

        <!-- Consent -->
        <div class="mb-6">
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input
              v-model="consented"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 mt-0.5"
            />
            <span class="text-gray-600">
              I have read, understood, and agree to be bound by the
              <a :href="termsLink" target="_blank" class="text-gray-900 underline">Terms and Conditions</a>
              and our
              <a :href="privacyLink" target="_blank" class="text-gray-900 underline">Privacy Policy</a>
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            type="submit"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
            :disabled="!isFormValid"
          >Submit Contact Request</button>
          <button
            type="reset"
            class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >Clear form</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const name = ref("");
const emailAddress = ref("");
const company = ref("");
const serviceInterest = ref("");
const message = ref("");
const consented = ref(false);

const submitting = ref(false);
const submitted = ref(false);
const submitError = ref(false);
const validated = ref(false);

const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
const termsLink = import.meta.env.VUE_APP_TERMS_LINK;
const contactEmail =
  import.meta.env.VUE_APP_CONTACT_EMAIL || "hello@withobsrvr.com";

const nameState = computed(() => {
  if (!validated.value) return null;
  return name.value.trim().length > 0;
});

const emailAddressState = computed(() => {
  if (emailAddress.value === "") return null;
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(emailAddress.value.toLowerCase());
});

const serviceInterestState = computed(() => {
  if (!validated.value) return null;
  return serviceInterest.value !== "";
});

const messageState = computed(() => {
  if (!validated.value) return null;
  return message.value.trim().length > 0;
});

const isFormValid = computed(() => {
  return (
    name.value.trim().length > 0 &&
    emailAddressState.value === true &&
    serviceInterest.value !== "" &&
    message.value.trim().length > 0 &&
    consented.value
  );
});

function onReset(event: Event) {
  event.preventDefault();
  resetForm();
}

function resetForm() {
  name.value = "";
  emailAddress.value = "";
  company.value = "";
  serviceInterest.value = "";
  message.value = "";
  consented.value = false;
  validated.value = false;
  submitted.value = false;
  submitError.value = false;
}

async function onSubmit(event: Event) {
  validated.value = true;
  event.preventDefault();
  submitError.value = false;
  submitted.value = false;
  if (!isFormValid.value) return;

  try {
    submitting.value = true;
    const response = await fetch(
      import.meta.env.VUE_APP_PUBLIC_API_URL + "/v1/contact",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value,
          emailAddress: emailAddress.value,
          company: company.value || undefined,
          serviceInterest: serviceInterest.value,
          message: message.value,
        }),
      },
    );
    if (!response.ok) {
      submitting.value = false;
      submitError.value = true;
      return;
    }
    submitted.value = true;
    submitting.value = false;
    resetForm();
  } catch (e) {
    submitting.value = false;
    submitError.value = true;
  }
}
</script>
