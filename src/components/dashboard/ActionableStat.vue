<script setup lang="ts">
import type { Component } from 'vue';

const props = defineProps<{
  label: string;
  value: string;
  helper?: string;
  icon: Component;
  iconClass?: string;
  statusText: string;
  statusToneClass: string;
  actionText: string;
}>();

const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <span class="text-sm text-slate-500">{{ props.label }}</span>
      <component :is="props.icon" :size="16" :class="props.iconClass ?? 'text-slate-600'" />
    </div>

    <div class="text-2xl font-semibold text-slate-900 mb-2">{{ props.value }}</div>
    <p v-if="props.helper" class="text-sm text-slate-600 leading-relaxed">{{ props.helper }}</p>

    <div class="pt-3 border-t border-slate-50 flex justify-between items-center mt-4">
      <span class="text-xs font-medium" :class="props.statusToneClass">
        ● {{ props.statusText }}
      </span>
      <button
        type="button"
        class="text-xs text-blue-600 hover:text-blue-500 hover:underline transition-colors"
        @click="emit('action')"
      >
        {{ props.actionText }}
      </button>
    </div>
  </div>
</template>

