<template>
  <div class="text-slate-900">
    <!-- 1. Page Header -->
    <header
      class="mx-auto max-w-[1600px] px-6 xl:px-10 min-[1920px]:px-40 py-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">概览</h1>
        <p class="text-base leading-relaxed text-slate-600 mt-2">
          聚焦可行动的写作目标：从热点到成稿只需一步。
        </p>
      </div>

      <AppButton variant="primary" @click="handleNewCreation">
        <PenTool :size="18" class="mr-2" />
        开始新创作
      </AppButton>
    </header>

    <!-- 2. Primary Action Anchor + AI Insight -->
    <DashboardHero />

    <!-- 3. Actionable Stats -->
    <main class="mx-auto max-w-[1600px] px-6 xl:px-10 min-[1920px]:px-40">
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ActionableStat
          v-for="card in actionableStats"
          :key="card.key"
          :label="card.label"
          :value="card.value"
          :helper="card.helper"
          :icon="card.icon"
          :iconClass="card.iconClass"
          :statusText="card.statusText"
          :statusToneClass="card.statusToneClass"
          :actionText="card.actionText"
          @action="card.onAction"
        />
      </section>

      <!-- 4. 两行两列：创作队列 | 实时热点 | 待处理任务 | 信源监听（下排对齐） -->
      <section class="grid grid-cols-12 gap-6 pb-12">
        <!-- 左上：进行中的任务（与实时热点情报对齐） -->
        <div class="col-span-12 lg:col-span-7">
          <CreationQueue :tasks="inProgressTasks" />
        </div>
        <!-- 右上：实时热点情报 -->
        <div class="col-span-12 lg:col-span-5">
          <article class="bg-white border border-slate-200 rounded-lg shadow-sm p-6 h-full">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-slate-900">实时热点情报</h2>
              <button type="button" class="text-sm text-blue-600 hover:text-blue-500 transition-colors">
                查看全部
              </button>
            </div>
            <div v-if="isHotLoading" class="mt-6 space-y-3 animate-pulse">
              <div class="h-4 bg-slate-100 rounded" />
              <div class="h-4 bg-slate-100 rounded w-5/6" />
              <div class="h-4 bg-slate-100 rounded w-4/6" />
            </div>
            <ul v-else class="mt-4 divide-y divide-slate-100">
              <li v-for="item in hotItems" :key="item.id" class="py-4">
                <button type="button" class="w-full text-left group" @click="handleStartHot(item.title)">
                  <div class="flex items-start gap-3">
                    <div class="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-white p-2 group-hover:border-blue-200 transition-colors">
                      <TrendingUp class="h-5 w-5 text-slate-700" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ item.title }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.source }} · {{ item.time }}</p>
                      <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ item.summary }}</p>
                      <p class="mt-2 text-xs text-blue-600 group-hover:text-blue-500 transition-colors">生成解读 →</p>
                    </div>
                  </div>
                </button>
              </li>
            </ul>
          </article>
        </div>
        <!-- 左下：待处理任务 -->
        <div class="col-span-12 lg:col-span-7">
          <article class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-slate-900">待处理任务</h2>
              <span class="text-xs text-slate-400">按优先级排序</span>
            </div>
            <div class="mt-4 grid gap-3">
              <div
                v-for="task in writingQueue"
                :key="task.id"
                class="rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ task.title }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ task.meta }}</p>
                  </div>
                  <span
                    class="shrink-0 inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-xs"
                    :class="task.statusTone"
                  >
                    {{ task.status }}
                  </span>
                </div>
                <div v-if="task.risk" class="mt-3 border-l-4 border-amber-500 bg-white pl-3">
                  <p class="text-xs text-slate-600 leading-relaxed">
                    <span class="font-medium text-slate-900">风险提示：</span>{{ task.risk }}
                  </p>
                </div>
                <div class="mt-4 flex items-center justify-end">
                  <button
                    type="button"
                    class="text-xs text-blue-600 hover:text-blue-500 transition-colors"
                    @click="handleStartTask(task.title)"
                  >
                    继续处理 →
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
        <!-- 右下：信源监听 -->
        <div class="col-span-12 lg:col-span-5">
          <article class="bg-white border border-slate-200 rounded-lg shadow-sm p-6 h-full">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-slate-900">信源监听</h2>
              <div class="shrink-0 rounded-md border border-slate-200 bg-white p-2">
                <Radio class="h-5 w-5 text-slate-700" />
              </div>
            </div>
            <ul class="mt-4 space-y-3">
              <li
                v-for="s in sources"
                :key="s.id"
                class="rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ s.name }}</p>
                    <p class="mt-1 text-xs text-slate-500">更新：{{ s.lastSeen }}</p>
                  </div>
                  <span
                    class="shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    :class="tonePillClass(s.state)"
                  >
                    <component :is="toneIcon(s.state)" class="h-3.5 w-3.5" />
                    {{ toneLabel(s.state) }}
                  </span>
                </div>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import {
  CheckCircle2,
  XCircle,
  Radio,
  ShieldAlert,
  TrendingUp,
  Activity,
  PenTool,
} from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import ActionableStat from '@/components/dashboard/ActionableStat.vue';
import CreationQueue from '@/components/dashboard/CreationQueue.vue';
import DashboardHero from '@/components/dashboard/DashboardHero.vue';
import { useEditorStore } from '@/stores/useEditorStore';
import { router } from '@/router';

type SourceState = 'ok' | 'warn' | 'down';

const isHotLoading = false;

const editor = useEditorStore();

const handleNewCreation = () => {
  router.push('/editor');
  editor.setArticle({ title: '', content: '' });
};

const actionableStats: Array<{
  key: string;
  label: string;
  value: string;
  helper?: string;
  icon: Component;
  iconClass?: string;
  statusText: string;
  statusToneClass: string;
  actionText: string;
  onAction: () => void;
}> = [
  {
    key: 'ingest',
    label: '今日抓取',
    value: '128',
    helper: '已完成主流信源的增量抓取与去重。',
    icon: Activity,
    iconClass: 'text-slate-600',
    statusText: '运行良好',
    statusToneClass: 'text-emerald-600',
    actionText: '查看报告',
    onAction: () => router.push('/sources'),
  },
  {
    key: 'hot',
    label: '热点池',
    value: '24',
    helper: '可直接一键生成解读与点评。',
    icon: TrendingUp,
    iconClass: 'text-slate-600',
    statusText: '待处理',
    statusToneClass: 'text-amber-600',
    actionText: '立即分配 (3)',
    onAction: () => {
      editor.startFromSuggestion({
        title: '点评：热点快速解读（按优先级）',
        prompt: '请从当前热点池中选择 1 个最具传播潜力的话题，生成 600-900 字点评：开头 3 句给结论，中段给事实依据与影响，结尾给 3 条可行动建议。',
      });
    },
  },
  {
    key: 'kb',
    label: '知识库就绪率',
    value: '98%',
    helper: '索引与向量库状态正常，检索可用。',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    statusText: '运行良好',
    statusToneClass: 'text-emerald-600',
    actionText: '处理异常 (2)',
    onAction: () => router.push('/knowledge'),
  },
  {
    key: 'sources',
    label: '信源在线率',
    value: '15/16',
    helper: '对异常信源建议进行重试与告警。',
    icon: Radio,
    iconClass: 'text-slate-600',
    statusText: '发现异常',
    statusToneClass: 'text-amber-600',
    actionText: '处理异常 (1)',
    onAction: () => router.push('/sources'),
  },
];

const hotItems = [
  {
    id: 'h1',
    title: '多部门联合发布最新宏观政策解读',
    summary: '围绕稳增长与扩大内需，市场关注政策落地节奏与行业边际改善。',
    source: '权威媒体',
    time: '10:32',
  },
  {
    id: 'h2',
    title: '重点地区推动产业链协同创新',
    summary: '多地提出关键环节补链强链，关注政策支持方向与项目进度。',
    source: '地方公告',
    time: '09:58',
  },
];

/** 进行中的任务（左上，与实时热点情报同行） */
const inProgressTasks = [
  { id: 'p1', title: '今日要闻：政策与市场联动观察', meta: '草稿 · 已关联 RAG 片段 2 条 · 待补充结论段' },
  { id: 'p2', title: '专题：产业链协同创新的三条线索', meta: '撰写中 · 预计 5 分钟完成 · 已生成提纲' },
  { id: 'p3', title: '快讯：国际会议要点梳理', meta: '草稿 · 待补充引用来源核验' },
  { id: 'p4', title: '点评：半导体协定对产业链影响', meta: '撰写中 · 已抓取 3 条信源 · 待润色' },
];

/** 待处理任务（左下，与信源监听同行） */
const writingQueue = [
  {
    id: 'w1',
    title: '今日要闻：政策与市场联动观察',
    meta: '草稿 · 预计 3 分钟完成',
    status: '进行中',
    statusTone: 'bg-white text-blue-600 border-blue-200',
    risk: '存在高频敏感词，建议在发布前进行替换与语义改写。',
  },
  {
    id: 'w2',
    title: '专题：产业链协同创新的三条线索',
    meta: '待开始 · 资料已就绪',
    status: '待开始',
    statusTone: 'bg-white text-slate-700 border-slate-200',
    risk: '',
  },
];

const sources: Array<{ id: string; name: string; lastSeen: string; state: SourceState }> = [
  { id: 's1', name: '央媒快讯流', lastSeen: '2 分钟前', state: 'ok' },
  { id: 's2', name: '地方政务公告', lastSeen: '6 分钟前', state: 'ok' },
  { id: 's3', name: '国际通讯社', lastSeen: '12 分钟前', state: 'warn' },
];

function toneLabel(state: SourceState) {
  if (state === 'ok') return '正常';
  if (state === 'warn') return '波动';
  return '离线';
}

function toneIcon(state: SourceState): Component {
  if (state === 'ok') return CheckCircle2;
  if (state === 'warn') return ShieldAlert;
  return XCircle;
}

function tonePillClass(state: SourceState) {
  if (state === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-600';
  if (state === 'warn') return 'border-amber-200 bg-amber-50 text-amber-600';
  return 'border-red-200 bg-red-50 text-red-600';
}

function handleStartHot(title: string) {
  editor.startFromSuggestion({
    title: `解读：${title}`,
    prompt: `请针对“${title}”生成一篇解读：先用 3 句概述事件，再从“背景/影响/关注点”三段展开，结尾给出 3 条可跟踪线索。语气客观克制，避免夸张表述。`,
  });
}

function handleStartTask(title: string) {
  editor.startFromSuggestion({
    title,
    prompt: `请继续完善“${title}”：补齐结构（要点/证据/影响/风险/下一步），并给出 3 条可执行的跟踪清单。`,
  });
}
</script>
