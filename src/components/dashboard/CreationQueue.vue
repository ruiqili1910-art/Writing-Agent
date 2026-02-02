<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { useEditorStore } from '@/stores/useEditorStore';

const editor = useEditorStore();

const props = defineProps<{
  countText: string;
}>();

const handleContinue = () => {
  editor.startFromSuggestion({
    title: '日报：政策与市场联动观察（续写）',
    prompt:
      '请继续完成当前草稿：补充“行业影响”段落，加入 2 条可验证的数据/事实依据（不编造具体数字，可用“据公开报道/机构观点”表述），并新增“下一步跟踪清单”3 条。',
  });
};
</script>

<template>
  <div class="bg-white rounded-lg border-2 border-blue-100 shadow-sm p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-slate-900">进行中的创作任务</h2>
      <span class="text-xs text-slate-400">{{ props.countText }}</span>
    </div>

    <div class="p-4 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-slate-900 truncate">今日要闻：政策与市场联动观察</p>
        <p class="mt-1 text-xs text-slate-500">草稿 · 已关联 RAG 片段 2 条 · 待补充结论段</p>
      </div>
      <AppButton size="sm" @click="handleContinue">继续编写</AppButton>
    </div>
  </div>
</template>

