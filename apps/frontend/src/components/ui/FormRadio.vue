<template>
  <div class="flex items-center gap-2">
    <input
      type="radio"
      :checked="modelValue === value"
      :name="name"
      :value="value"
      class="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
      @change="onChange"
    />
    <label v-if="$slots.default" class="text-sm text-slate-700">
      <slot />
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: unknown;
  value?: unknown;
  name?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
}>();

function onChange() {
  emit('update:modelValue', props.value);
}
</script>
