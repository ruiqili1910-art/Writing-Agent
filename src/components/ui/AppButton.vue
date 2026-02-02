<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  },
);

const base =
  'inline-flex items-center justify-center rounded-md font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClass = computed(() => {
  if (props.variant === 'secondary') {
    return 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
  }
  return 'bg-blue-600 text-white hover:bg-blue-500';
});

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'px-3 py-2 text-sm';
  return 'px-4 py-2 text-sm';
});
</script>

<template>
  <button :type="props.type" :disabled="props.disabled || props.loading" :class="[base, variantClass, sizeClass]">
    <span v-if="props.loading" class="mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
    <slot />
  </button>
</template>

