<template>
  <div class="space-y-1">
    <slot v-if="$slots.default" />
    <template v-else>
      <UiFormRadio
        v-for="opt in normalizedOptions"
        :key="String(opt.value)"
        :model-value="modelValue"
        :value="opt.value"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
      >
        {{ opt.text }}
      </UiFormRadio>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: unknown;
  options?: (string | { value: unknown; text: string })[];
  name?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
}>();

const normalizedOptions = computed(() =>
  (props.options || []).map(opt =>
    typeof opt === 'string' ? { value: opt, text: opt } : opt
  )
);
</script>
