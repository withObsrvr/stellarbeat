<template>
  <div>
    <!-- Introduction Section -->
    <div class="mb-4">
      <h3>Professional Validator Services for Stellar Network</h3>
      <p class="lead">
        We offer enterprise-grade validator hosting and setup assistance for
        organizations running validators on the Stellar network. Whether you
        need help setting up your first validator or want us to manage your
        infrastructure, we're here to help.
      </p>

      <div class="mt-3">
        <h5>Why Choose Obsrvr for Validator Services?</h5>
        <ul>
          <li>99.99% uptime SLA for hosted validators</li>
          <li>Expert setup assistance and configuration review</li>
          <li>24/7 monitoring and alerting</li>
          <li>Secure, compliant infrastructure</li>
          <li>Multi-region redundancy options</li>
          <li>Professional support from Stellar network experts</li>
        </ul>
      </div>
    </div>

    <hr class="my-4" />

    <!-- Contact Form -->
    <div v-if="submitting">
      <h4>Sending your message...</h4>
      <div>
        <div class="loader"></div>
      </div>
    </div>
    <div v-else>
      <h4>Get in Touch</h4>
      <p class="text-muted mb-3">
        Tell us about your validator needs and we'll get back to you within 24
        hours.
      </p>

      <b-form
        novalidate
        :validated="validated"
        @submit.prevent="onSubmit"
        @reset="onReset"
      >
        <b-alert variant="success" :show="submitted">
          <strong>Thank you for contacting us!</strong><br />
          We've received your inquiry and will respond within 24 hours. Check
          your email for a confirmation.
        </b-alert>

        <b-alert variant="danger" :show="submitError">
          <strong>Something went wrong submitting your request.</strong><br />
          Please try again or contact us directly at
          {{ contactEmail }}
        </b-alert>

        <!-- Name and Email (two columns on desktop) -->
        <div class="row">
          <div class="col-md-6">
            <b-form-group
              id="name-group"
              label="Name"
              label-for="name-input"
              description="Your full name"
            >
              <b-form-input
                id="name-input"
                v-model="name"
                :state="nameState"
                placeholder="Enter your name"
                required
                trim
              ></b-form-input>
            </b-form-group>
          </div>

          <div class="col-md-6">
            <b-form-group
              id="email-group"
              label="Email"
              label-for="email-input"
              description="Your email address"
            >
              <b-form-input
                id="email-input"
                v-model="emailAddress"
                type="email"
                :state="emailAddressState"
                placeholder="Enter your email"
                required
                trim
              ></b-form-input>
            </b-form-group>
          </div>
        </div>

        <!-- Company (optional) -->
        <b-form-group
          id="company-group"
          label="Company/Organization (Optional)"
          label-for="company-input"
          description="Your company or organization name"
        >
          <b-form-input
            id="company-input"
            v-model="company"
            placeholder="Enter your company or organization"
            trim
          ></b-form-input>
        </b-form-group>

        <!-- Service Interest -->
        <b-form-group
          id="service-interest-group"
          label="Service Interest"
          label-for="service-interest-select"
          description="What are you interested in?"
        >
          <b-form-select
            id="service-interest-select"
            v-model="serviceInterest"
            :state="serviceInterestState"
            :options="serviceOptions"
            required
          ></b-form-select>
        </b-form-group>

        <!-- Message -->
        <b-form-group
          id="message-group"
          label="Message"
          label-for="message-input"
          description="Tell us about your validator needs"
        >
          <b-form-textarea
            id="message-input"
            v-model="message"
            :state="messageState"
            placeholder="Describe your requirements..."
            :rows="5"
            required
            trim
          ></b-form-textarea>
        </b-form-group>

        <!-- Consent Checkbox -->
        <b-form-group id="consent-group">
          <b-form-checkbox
            id="consent-checkbox"
            v-model="consented"
            name="consent-checkbox"
          >
            I have read, understood, and agree to be bound by the
            <a :href="termsLink" target="_blank">Terms and Conditions</a>
            and our
            <a :href="privacyLink" target="_blank">Privacy Policy</a>
          </b-form-checkbox>
        </b-form-group>

        <!-- Submit and Reset Buttons -->
        <button
          type="submit"
          class="btn-primary btn"
          role="button"
          :disabled="!isFormValid"
        >
          Submit Contact Request
        </button>
        <button class="btn btn-secondary ml-3" type="reset">Clear form</button>
      </b-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BAlert,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
} from "@/components/bootstrap-compat";
import { computed, ref } from "vue";

// Form data
const name = ref("");
const emailAddress = ref("");
const company = ref("");
const serviceInterest = ref("");
const message = ref("");
const consented = ref(false);

// State flags
const submitting = ref(false);
const submitted = ref(false);
const submitError = ref(false);
const validated = ref(false);

// Config
const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
const termsLink = import.meta.env.VUE_APP_TERMS_LINK;
const contactEmail =
  import.meta.env.VUE_APP_CONTACT_EMAIL || "hello@withobsrvr.com";

// Service options for dropdown
const serviceOptions = [
  { value: "", text: "-- Please select --", disabled: true },
  { value: "host-validator", text: "Host my validator" },
  { value: "help-setup", text: "Help me set up" },
  { value: "both", text: "Both hosting and setup" },
  { value: "general", text: "General inquiry" },
];

// Validation states (for display purposes - returns null if not yet validated)
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

// Form validity check (for enabling submit button - doesn't require validated flag)
const isFormValid = computed(() => {
  const nameValid = name.value.trim().length > 0;
  const emailValid =
    emailAddress.value !== "" &&
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      emailAddress.value.toLowerCase()
    );
  const serviceInterestValid = serviceInterest.value !== "";
  const messageValid = message.value.trim().length > 0;
  const consentValid = consented.value;

  return (
    nameValid &&
    emailValid &&
    serviceInterestValid &&
    messageValid &&
    consentValid
  );
});

// Form handlers
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

  // Validate form
  if (!isFormValid.value) return;

  try {
    submitting.value = true;

    const response = await fetch(
      import.meta.env.VUE_APP_PUBLIC_API_URL + "/v1/contact",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.value,
          emailAddress: emailAddress.value,
          company: company.value || undefined,
          serviceInterest: serviceInterest.value,
          message: message.value,
        }),
      }
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

<style scoped>
.lead {
  font-size: 1.1rem;
  color: #6c757d;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1997c6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
