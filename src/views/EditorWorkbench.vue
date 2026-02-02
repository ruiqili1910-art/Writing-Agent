<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  AlertTriangle,
  Copy,
  Database,
  Image as ImageIcon,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import { useEditorStore } from '@/stores/useEditorStore';

const editor = useEditorStore();
const { currentArticle, lastSeedPrompt } = storeToRefs(editor);

const editorTextarea = ref<HTMLTextAreaElement | null>(null);
watch(
  () => lastSeedPrompt.value,
  async () => {
    await nextTick();
    editorTextarea.value?.focus();
  },
);

// 1) 模拟 RAG 检索数据
const ragResults = ref([
  {
    id: 1,
    title: '2026 半导体协定全文',
    content: '协定第三章明确了关于出口管制的豁免条款...',
    similarity: 0.94,
  },
  {
    id: 2,
    title: '博主：科技观察家',
    content: '这次协定本质上是全球供应链的重新洗牌...',
    similarity: 0.88,
  },
]);

// 2) 模拟 AI 自动生成的配图（占位）
const generatedImages = ref([
  { id: 1, url: 'https://placehold.co/400x300/e2e8f0/64748b?text=AI+Image+1' },
  { id: 2, url: 'https://placehold.co/400x300/e2e8f0/64748b?text=AI+Image+2' },
]);

// 3) 模拟审核结果
const auditResults = ref({
  score: 95,
  issues: [{ type: 'warning', text: '“绝对领先”一词可能存在合规风险', position: '第 2 段' }],
});

</script>

<template>
  <div class="h-screen flex flex-col bg-white">
    <header class="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
      <div class="flex items-center gap-4 min-w-0">
        <span class="text-slate-400 text-sm shrink-0">草稿箱 /</span>
        <input
          v-model="currentArticle.title"
          class="font-medium text-slate-900 border-none focus:ring-0 w-96 max-w-full"
        />
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400 hidden sm:inline">上次保存：14:20:05</span>

        <AppButton variant="secondary">存草稿</AppButton>
        <AppButton variant="primary">发布文章</AppButton>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <!-- 左栏：溯源 / RAG（背景 Slate-50） -->
      <aside class="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 class="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <Database :size="16" class="text-blue-600" />
            RAG 知识库
          </h2>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            aria-label="刷新检索结果"
          >
            <RefreshCcw :size="14" class="transition-transform duration-500 hover:rotate-180" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            v-for="item in ragResults"
            :key="item.id"
            class="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-200 transition-colors group cursor-pointer"
          >
            <div class="flex justify-between items-center mb-2">
              <span
                class="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md"
              >
                {{ (item.similarity * 100).toFixed(0) }}% 相关
              </span>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md p-1 text-slate-300 group-hover:text-blue-600 transition-colors"
                aria-label="复制片段"
              >
                <Copy :size="12" />
              </button>
            </div>
            <h4 class="text-xs font-semibold text-slate-800 mb-1">
              {{ item.title }}
            </h4>
            <p class="text-xs text-slate-500 leading-relaxed">
              {{ item.content }}
            </p>
          </div>
        </div>
      </aside>

      <!-- 中栏：编辑器（纯白、无边框） -->
      <section class="flex-1 overflow-y-auto bg-white flex justify-center py-12">
        <div class="w-full max-w-[800px] px-8">
          <textarea
            ref="editorTextarea"
            v-model="currentArticle.content"
            placeholder="输入热点信息，或使用 AI 辅助生成..."
            class="w-full min-h-[600px] border-none focus:ring-0 text-lg leading-relaxed text-slate-800 placeholder-slate-300 resize-none"
          ></textarea>

          <div
            class="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between"
          >
            <div class="flex items-center gap-2 text-blue-700 text-sm">
              <Sparkles :size="18" />
              <span>选中文字以调用 AI 文风修改功能</span>
            </div>
            <button type="button" class="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
              了解更多
            </button>
          </div>
        </div>
      </section>

      <!-- 右栏：配图 + 审核（卡片间距 gap-6 = 24px） -->
      <aside class="w-80 border-l border-slate-200 bg-white overflow-y-auto">
        <div class="p-6 flex flex-col gap-6">
          <section class="border border-slate-200 rounded-lg shadow-sm">
            <div class="p-6 border-b border-slate-200">
              <h3 class="text-sm font-semibold flex items-center gap-2 text-slate-900">
                <ImageIcon :size="16" class="text-blue-600" />
                自动化配图
              </h3>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="img in generatedImages"
                  :key="img.id"
                  class="relative group aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                >
                  <img :src="img.url" class="w-full h-full object-cover" />
                  <div
                    class="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <button type="button" class="text-white text-xs font-medium hover:text-white">
                      采用
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="w-full mt-4 py-2 text-xs border border-slate-200 text-slate-700 rounded-md hover:border-blue-200 hover:text-blue-600 hover:bg-white transition-colors"
              >
                重新生成全部配图
              </button>
            </div>
          </section>

          <section class="border border-slate-200 rounded-lg shadow-sm">
            <div class="p-6 border-b border-slate-200">
              <h3 class="text-sm font-semibold flex items-center gap-2 text-slate-900">
                <ShieldCheck :size="16" class="text-emerald-500" />
                内容质量审核
              </h3>
            </div>

            <div class="p-6">
              <div class="bg-slate-50 rounded-lg p-4 mb-4">
                <div class="text-xs text-slate-500 mb-1">合规得分</div>
                <div class="text-3xl font-bold text-emerald-500">{{ auditResults.score }}</div>
              </div>

              <div class="space-y-3">
                <div
                  v-for="issue in auditResults.issues"
                  :key="issue.text"
                  class="flex gap-3 p-3 bg-amber-50 rounded-md border border-amber-100"
                >
                  <AlertTriangle :size="14" class="text-amber-500 shrink-0" />
                  <div>
                    <p class="text-xs font-medium text-amber-900">{{ issue.text }}</p>
                    <p class="text-[10px] text-amber-600 mt-1">建议修改：{{ issue.position }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </main>
  </div>
</template>

