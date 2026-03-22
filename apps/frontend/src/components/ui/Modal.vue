<template>
  <Teleport to="body">
    <template v-if="lazy ? isVisible : true">
      <div v-show="!lazy || isVisible">
        <!-- Backdrop -->
        <div
          v-show="isVisible"
          class="fixed inset-0 z-[10100] bg-black/50"
          @click="onBackdropClick"
        />
        <!-- Dialog -->
        <div
          v-show="isVisible"
          class="fixed inset-0 z-[10200] overflow-y-auto"
          @keydown.esc="close"
          tabindex="-1"
        >
          <div class="flex min-h-full items-center justify-center p-4">
            <div :class="['relative w-full rounded-xl bg-white shadow-xl', sizeClass]">
              <!-- Header -->
              <div
                v-if="!hideHeader"
                class="flex items-center justify-between border-b border-gray-200 px-4 py-3"
              >
                <slot name="modal-header" :close="close">
                  <h5 class="text-lg font-semibold text-gray-900">
                    <slot name="title">{{ title }}</slot>
                  </h5>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    @click="close"
                    aria-label="Close"
                  >
                    <span class="text-2xl leading-none">&times;</span>
                  </button>
                </slot>
              </div>

              <!-- Body -->
              <div class="px-4 py-4">
                <slot />
              </div>

              <!-- Footer -->
              <div
                v-if="!hideFooter"
                class="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3"
              >
                <slot name="modal-footer" :ok="handleOk" :cancel="handleCancel">
                  <button
                    v-if="!okOnly"
                    type="button"
                    class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    @click="handleCancel"
                  >
                    {{ cancelTitle }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                    @click="handleOk"
                  >
                    {{ okTitle }}
                  </button>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';

const props = withDefaults(defineProps<{
  id?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideFooter?: boolean;
  hideHeader?: boolean;
  noCloseOnBackdrop?: boolean;
  okOnly?: boolean;
  okTitle?: string;
  cancelTitle?: string;
  lazy?: boolean;
  modelValue?: boolean;
}>(), {
  okTitle: 'OK',
  cancelTitle: 'Cancel',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  ok: [];
  cancel: [];
  hidden: [];
  shown: [];
}>();

const isVisible = ref(props.modelValue || false);

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };
  return sizes[props.size || 'md'];
});

watch(() => props.modelValue, (val) => {
  if (val !== undefined) {
    isVisible.value = val;
    if (val) onShow();
    else onHide();
  }
});

watch(isVisible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

function onShow() {
  emit('shown');
}

function onHide() {
  emit('hidden');
}

function showModal() {
  isVisible.value = true;
  emit('update:modelValue', true);
  onShow();
}

function close() {
  isVisible.value = false;
  emit('update:modelValue', false);
  onHide();
}

function handleOk() {
  emit('ok');
  close();
}

function handleCancel() {
  emit('cancel');
  close();
}

function onBackdropClick() {
  if (!props.noCloseOnBackdrop) {
    close();
  }
}

// Listen for global show-modal events (v-b-modal directive compatibility)
let handleGlobalEvent: ((e: Event) => void) | null = null;

onMounted(() => {
  if (props.id) {
    handleGlobalEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.modalId === props.id) {
        showModal();
      }
    };
    document.addEventListener('show-modal-global', handleGlobalEvent);
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  if (handleGlobalEvent) {
    document.removeEventListener('show-modal-global', handleGlobalEvent);
  }
});
</script>
