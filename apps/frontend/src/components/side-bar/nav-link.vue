<template>
  <div
    v-bind="$attrs"
    :class="classObject"
    role="button"
    tabindex="0"
    class="d-flex justify-content-between"
    @click="handleClick"
    @keyup.enter="handleKeyup"
    @keyup.space="handleKeyup"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div
      class="w-100 d-flex flex-row justify-content-between align-items-center"
    >
      <div class="w-100 d-flex flex-column align-items-stretch">
        <div class="w-100 d-flex align-items-center align-content-center">
          <div class="sb-nav-link-icon align-content-center">
            <b-icon
              v-if="showDropdownToggle"
              :icon="chevronDirection"
              scale="0.8"
            />
            <b-icon v-else-if="showIcon" :icon="icon" scale="0.8" />
          </div>

          <div
            class="w-100 d-flex justify-content-between align-content-center"
          >
            <nav-title
              :title="title"
              :classes="'w-100 pb-0 m-height ' + (secondary ? 'secondary' : '')"
              :has-warnings="hasWarnings"
              :warnings="warnings"
              :has-danger="hasDanger"
              :complete-danger="completeDanger"
              :danger="dangers"
            />
          </div>
        </div>
        <div v-if="showSubTitle" class="text-muted sub-title">
          {{ subTitle }}
        </div>
      </div>
      <div class="action mr-1">
        <div v-show="hover" :class="dropdownClass">
          <slot name="action-dropdown" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import NavTitle from "@/components/side-bar/nav-title.vue";

// Components registered globally in app.ts, no need to register here

const props = defineProps({
  title: { type: String, required: true },
  showSubTitle: { type: Boolean, default: false },
  subTitle: { type: String, default: "" },
  showDropdownToggle: { type: Boolean, default: false },
  dropDownShowing: { type: Boolean, default: false },
  isLinkInDropdown: { type: Boolean, default: false },
  hasWarnings: { type: Boolean, default: false },
  warnings: { type: String, default: "" },
  hasDanger: { type: Boolean, default: false },
  completeDanger: { type: Boolean, default: true },
  dangers: { type: String, default: "" },
  showIcon: { type: Boolean, default: false },
  icon: { type: String, default: "" },
  secondary: { type: Boolean, default: false },
});

const hover = ref(false);

const chevronDirection = computed(() => {
  if (props.dropDownShowing) return "chevron-down";
  else return "chevron-right";
});

const classObject = computed(() => {
  return {
    "sb-nav-dropdown-toggle": false,
    "sb-nav-link": !props.isLinkInDropdown,
    "sb-nav-dropdown-link": props.isLinkInDropdown,
  };
});

const dropdownClass = computed(() => {
  return {
    "right-end": !props.showDropdownToggle,
    right: props.showDropdownToggle,
  };
});

const emit = defineEmits(['click']);

const attrs = useAttrs();

function handleClick() {
  // Check if v-b-modal directive was used by looking for the modal ID in attrs
  const vBModalAttr = Object.keys(attrs).find(key => key === 'v-b-modal' || key.startsWith('v-b-modal.'));

  if (vBModalAttr) {
    // Extract modal ID from v-b-modal.modalId or from the attribute value
    let modalId;
    if (vBModalAttr.startsWith('v-b-modal.')) {
      // v-b-modal.modalId syntax
      modalId = vBModalAttr.substring('v-b-modal.'.length);
    } else {
      // v-b-modal="modalId" syntax
      modalId = attrs[vBModalAttr];
    }

    console.log('[nav-link] Triggering modal:', modalId);
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const event = new CustomEvent('show-modal', { detail: { modalId } });
      modalEl.dispatchEvent(event);
    } else {
      // If modal element not found (lazy mount), dispatch global event
      console.log('[nav-link] Modal element not found, dispatching global event for', modalId);
      const globalEvent = new CustomEvent('show-modal-global', {
        detail: { modalId },
        bubbles: true,
        composed: true
      });
      document.dispatchEvent(globalEvent);
    }
  }

  emit('click');
}

function handleKeyup() {
  emit('click');
}
</script>
<style scoped>
.action {
  min-width: 20px;
}

.sub-title {
  margin-left: 20px;
  font-size: 12px;
  margin-top: -5px;
}

.sb-alert {
  color: orange;
  position: relative;
  left: 0px;
  top: 0px;
}

.sb-nav-link {
  padding: 1px 4px 1px 4px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.55);
  font-weight: 600;
  outline: 0;
}

.sb-nav-link:hover {
  background-color: #f8f9fa;
}

.sb-nav-link-icon {
  font-size: 1rem;
  width: 1rem;
  height: 1rem;
  display: block;
  line-height: 0.99;
  margin-right: 5px;
  min-width: 10px;
  opacity: 0.6;
}

.sb-nav-dropdown-toggle {
  margin-bottom: 0px;
}

.sb-nav-dropdown-toggle::after {
  content: "";
  display: inline-block;
  vertical-align: 0.272em;
  width: 0.32em;
  height: 0.32em;
  border-bottom: 1px solid;
  border-bottom-color: currentcolor;
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-left: 1px solid;
  border-left-color: currentcolor;
  border-left-style: solid;
  border-left-width: 1px;
  transform: rotate(-45deg);
  margin-left: auto;
  margin-right: 5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s ease;
}

.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.sb-nav-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.55);
  width: 100%;
  font-weight: 400;
  font-size: 90%;
  padding: 1px 4px 1px 4px;
}

.sb-nav-dropdown-link:hover {
  background-color: #f8f9fa;
}
</style>
