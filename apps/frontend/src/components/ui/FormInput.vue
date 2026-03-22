<template>
  <input
    :type="type"
    :class="inputClasses"
    :value="modelValue"
    :placeholder="placeholder"
    :id="id"
    :required="required"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  id?: string;
  state?: boolean | null;
  required?: boolean;
  trim?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputClasses = computed(() => {
  const base = 'block w-full rounded-md border px-3 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary';

  if (props.state === true) return [base, 'border-success bg-white'];
  if (props.state === false) return [base, 'border-danger bg-white'];
  return [base, 'border-slate-300 bg-white'];
});

function onInput(e: Event) {
  let value = (e.target as HTMLInputElement).value;
  if (props.trim) value = value.trim();
  emit('update:modelValue', value);
}
</script>
