<template>
  <textarea
    :class="textareaClasses"
    :value="modelValue"
    :rows="rows"
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
  modelValue?: string;
  rows?: number;
  placeholder?: string;
  id?: string;
  state?: boolean | null;
  required?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const textareaClasses = computed(() => {
  const base = 'block w-full rounded-md border px-3 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary';

  if (props.state === true) return [base, 'border-success bg-white'];
  if (props.state === false) return [base, 'border-danger bg-white'];
  return [base, 'border-slate-300 bg-white'];
});

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}
</script>
