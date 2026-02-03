<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { useEditorStore } from '@/stores/useEditorStore';

const editor = useEditorStore();

const props = withDefaults(
  defineProps<{
    tasks: Array<{ id: string; title: string; meta: string }>;
  }>(),
  { tasks: () => [] }
);

const emit = defineEmits<{ continue: [title: string] }>();

const handleContinue = (title: string) => {
  editor.startFromSuggestion({
    title: `${title}（续写）`,
    prompt: `请继续完成当前草稿“${title}”：补充要点与依据，并新增“下一步跟踪清单”3 条。`,
  });
  emit('continue', title);
};
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-slate-900">进行中的任务</h2>
      <span class="text-xs text-slate-400">{{ props.tasks.length }} 个任务处理中</span>
    </div>
    <ul class="space-y-3">
      <li
        v-for="t in props.tasks"
        :key="t.id"
        class="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">{{ t.title }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ t.meta }}</p>
        </div>
        <AppButton size="sm" @click="handleContinue(t.title)">继续编写</AppButton>
      </li>
    </ul>
  </div>
</template>

