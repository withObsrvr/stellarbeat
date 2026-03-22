<template>
  <select
    :class="selectClasses"
    :value="modelValue"
    :id="id"
    :required="required"
    v-bind="$attrs"
    @change="onChange"
  >
    <option v-for="opt in normalizedOptions" :key="opt.value" :value="opt.value">
      {{ opt.text }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string | number;
  options?: (string | { value: string | number; text: string })[];
  id?: string;
  state?: boolean | null;
  required?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const normalizedOptions = computed(() =>
  (props.options || []).map(opt =>
    typeof opt === 'string' ? { value: opt, text: opt } : opt
  )
);

const selectClasses = computed(() => {
  const base = 'block w-full rounded-md border px-3 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary';

  if (props.state === true) return [base, 'border-success bg-white'];
  if (props.state === false) return [base, 'border-danger bg-white'];
  return [base, 'border-slate-300 bg-white'];
});

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value);
}
</script>
