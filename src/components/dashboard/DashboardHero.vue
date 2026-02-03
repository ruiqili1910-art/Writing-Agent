<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import { useEditorStore } from '@/stores/useEditorStore';
import heroBgUrl from '@/assets/dashboard-hero-bg.png';

const editor = useEditorStore();

const suggestions = [
  {
    key: 'semi',
    tag: '热点解读',
    title: '生成 1 篇关于“半导体协定”的点评',
    articleTitle: '点评：2026 全球半导体贸易协定对产业链的影响',
    prompt:
      '请基于“2026 全球半导体贸易协定”生成一篇结构清晰的深度点评：先用 3 句概述要点，再从“行业影响/供应链重构/风险与对策”三方面展开，最后给出可执行建议。语气客观克制，避免夸张表述。',
  },
  {
    key: 'policy',
    tag: '政策追踪',
    title: '将「政策与市场联动」写成可发布的日报',
    articleTitle: '日报：政策与市场联动观察（含关键结论与风险提示）',
    prompt:
      '请以“政策与市场联动观察”为题生成日报：列出今日 5 条关键信号（含来源类型与时间），给出 3 条市场影响判断，并附 2 条风险提示与 2 条后续跟踪点。保持企业报告风格。',
  },
  {
    key: 'brief',
    tag: '快讯整理',
    title: '把最新会议要点整理成 1 页简报',
    articleTitle: '简报：会议要点梳理（1 页版）',
    prompt:
      '请将最新会议要点整理成 1 页简报：用“背景/要点/影响/下一步”四段结构，每段不超过 4 行；结尾给出 3 条可行动的跟进清单。',
  },
];

const handleStart = (s: (typeof suggestions)[number]) => {
  editor.startFromSuggestion({ title: s.articleTitle, prompt: s.prompt });
};
</script>

<template>
  <section class="mx-auto max-w-[1600px] px-6 xl:px-10 min-[1920px]:px-40 mb-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 主任务锚点 -->
      <div
        class="lg:col-span-12 h-full rounded-xl px-6 py-4 shadow-[0_1px_2px_0_rgb(0_0_0_/_.03)] relative overflow-hidden"
      >
        <!-- 背景图（放大）+ 叠色层 -->
        <div aria-hidden="true" class="absolute inset-0 pointer-events-none">
          <div
            class="absolute inset-0 bg-[length:100%_100%] bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${heroBgUrl})` }"
          />
          <div class="absolute inset-0 bg-brandTint/20" />
        </div>

        <div class="relative z-10">
          <h2 class="text-xl font-medium mb-4 flex items-center gap-2 text-slate-900">
            <Sparkles :size="20" />
            AI 内容官建议
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="s in suggestions"
              :key="s.key"
              type="button"
              class="text-left bg-white/70 hover:bg-white/80 p-4 rounded-lg cursor-pointer transition-colors border border-white/60 backdrop-blur-sm group"
              @click="handleStart(s)"
            >
              <div class="text-slate-500 text-xs mb-1">{{ s.tag }}</div>
              <div class="font-medium leading-relaxed text-slate-900">{{ s.title }}</div>
              <div class="mt-2 text-xs text-blue-600 group-hover:text-blue-500 transition-colors">
                立即开始 →
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

