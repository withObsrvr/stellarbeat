<template>
  <div class="flex items-center gap-2">
    <input
      type="checkbox"
      :checked="isChecked"
      :name="name"
      :value="value"
      class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
      @change="onChange"
    />
    <label v-if="$slots.default" class="text-sm text-slate-700">
      <slot />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: boolean | unknown[];
  value?: unknown;
  name?: string;
  uncheckedValue?: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
}>();

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value);
  }
  return !!props.modelValue;
});

function onChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (Array.isArray(props.modelValue)) {
    const newValue = checked
      ? [...props.modelValue, props.value]
      : props.modelValue.filter(v => v !== props.value);
    emit('update:modelValue', newValue);
  } else {
    emit('update:modelValue', checked ? true : (props.uncheckedValue ?? false));
  }
}
</script>
