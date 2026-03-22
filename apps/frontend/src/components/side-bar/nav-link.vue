<template>
  <div
    v-bind="$attrs"
    :class="classObject"
    role="button"
    tabindex="0"
    class="flex justify-between"
    @click="handleClick"
    @keyup.enter="handleKeyup"
    @keyup.space="handleKeyup"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="w-full flex justify-between items-center">
      <div class="w-full flex flex-col items-stretch">
        <div class="w-full flex items-center">
          <div class="sb-nav-link-icon flex items-center">
            <svg v-if="showDropdownToggle && dropDownShowing" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            <svg v-else-if="showDropdownToggle" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            <svg v-else-if="showIcon && icon === 'info-circle'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg v-else-if="showIcon && icon === 'bullseye'" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
            <svg v-else-if="showIcon && icon === 'building'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <svg v-else-if="showIcon && icon === 'download'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <svg v-else-if="showIcon && icon === 'broadcast'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>
            <svg v-else-if="showIcon && icon === 'plus'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            <svg v-else-if="showIcon && icon === 'gear-wide'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <svg v-else-if="showIcon && icon === 'pencil'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <svg v-else-if="showIcon" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>

          <div class="w-full flex justify-between items-center">
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
        <div v-if="showSubTitle" class="text-gray-500 sub-title">
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
  // Check for Bootstrap data-toggle and data-target attributes
  if (attrs['data-toggle'] === 'modal' && attrs['data-target']) {
    // Extract modal ID from data-target (remove the # prefix)
    const modalId = (attrs['data-target'] as string).replace('#', '');

    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const event = new CustomEvent('show-modal', { detail: { modalId } });
      modalEl.dispatchEvent(event);
    } else {
      // If modal element not found (lazy mount), dispatch global event
      const globalEvent = new CustomEvent('show-modal-global', {
        detail: { modalId },
        bubbles: true,
        composed: true
      });
      document.dispatchEvent(globalEvent);
    }
  }

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

    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const event = new CustomEvent('show-modal', { detail: { modalId } });
      modalEl.dispatchEvent(event);
    } else {
      // If modal element not found (lazy mount), dispatch global event
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
