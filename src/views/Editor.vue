<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Copy,
  Database,
  Image as ImageIcon,
  ListTree,
  Lightbulb,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import StreamingOutput from '@/components/editor/StreamingOutput.vue';
import { useEditorStore } from '@/stores/useEditorStore';

const editor = useEditorStore();
const { currentArticle, lastSeedPrompt } = storeToRefs(editor);

type StepKey = 'topic' | 'outline' | 'content' | 'audit';
type PlatformRag = { id: number; title: string; content: string; similarity: number };
type OutlineItem = { id: string; text: string };

const steps: Array<{ key: StepKey; label: string; icon: unknown }> = [
  { key: 'topic', label: '热点输入', icon: Lightbulb },
  { key: 'outline', label: '大纲生成', icon: ListTree },
  { key: 'content', label: '正文创作', icon: ArrowRight },
  { key: 'audit', label: '配图/审核', icon: CheckCircle },
];

const stepIndex = (k: StepKey) => steps.findIndex((s) => s.key === k);

const currentStep = ref<StepKey>('topic');
const maxUnlocked = ref(0);

const currentStepIndex = computed(() => stepIndex(currentStep.value));
const canGoStep = (k: StepKey) => stepIndex(k) <= maxUnlocked.value;
const goStep = (k: StepKey) => {
  if (!canGoStep(k)) return;
  currentStep.value = k;
};

// Step 1: 热点输入
const topicInput = ref('');
const hotTopics = ['半导体贸易协定', '低碳能源政策', 'AI 伦理法案'];

// RAG 数据（示例）
const ragLoading = ref(false);
const ragResults = ref<PlatformRag[]>([
  { id: 1, title: '2026 半导体协定全文', content: '协定第三章明确了关于出口管制的豁免条款...', similarity: 0.94 },
  { id: 2, title: '博主：科技观察家', content: '这次协定本质上是全球供应链的重新洗牌...', similarity: 0.88 },
]);

const simulateRagFetch = (topic: string) => {
  ragLoading.value = true;
  selectedRagId.value = null;
  window.setTimeout(() => {
    const base = topic.trim() || '热点话题';
    ragResults.value = [
      {
        id: 1,
        title: `${base} · 公开资料摘要`,
        content: '基于公开来源的关键段落摘要（示例），用于快速构建论点与证据链。',
        similarity: 0.93,
      },
      {
        id: 2,
        title: `${base} · 观点与解读`,
        content: '行业观察/观点摘录（示例），建议用于补充角度与反方论证。',
        similarity: 0.86,
      },
    ];
    ragLoading.value = false;
  }, 700);
};

// 右栏示例数据
const generatedImages = ref([
  { id: 1, url: 'https://placehold.co/400x300/e2e8f0/64748b?text=AI+Image+1' },
  { id: 2, url: 'https://placehold.co/400x300/e2e8f0/64748b?text=AI+Image+2' },
]);

type AuditItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  tone: 'danger' | 'warning';
};

const auditReport = ref<{
  sensitive: AuditItem[];
  factual: AuditItem[];
}>({
  sensitive: [
    {
      id: 's1',
      title: '“大屠杀”',
      description: '检测到严重暴力倾向词汇，建议拦截。',
      tag: '暴恐违规',
      tone: 'danger',
    },
    {
      id: 's2',
      title: '“傻瓜社区”',
      description: '可能构成人身攻击，建议替换为中性表述。',
      tag: '人身攻击',
      tone: 'danger',
    },
    {
      id: 's3',
      title: '“绝对领先”',
      description: '夸大/绝对化表述存在合规风险，建议降级语气或补充依据。',
      tag: '夸大表述',
      tone: 'danger',
    },
  ],
  factual: [
    {
      id: 'f1',
      title: '“GDP 15.5%”',
      description: '与公开统计口径对比：去年实际值约为 5.2%，该数据存在虚假夸大风险。',
      tag: '数据存疑',
      tone: 'warning',
    },
    {
      id: 'f2',
      title: '“伦敦峰会”',
      description: '最近一次峰会在纽约，而非伦敦，信息存在时效/地点偏差。',
      tag: '信息过时',
      tone: 'warning',
    },
  ],
});

const auditCounts = computed(() => ({
  sensitive: auditReport.value.sensitive.length,
  factual: auditReport.value.factual.length,
}));

const toneRowClass = (tone: AuditItem['tone']) => {
  if (tone === 'danger') return 'bg-red-50 border-red-100';
  return 'bg-amber-50 border-amber-100';
};

const toneLeftBarClass = (tone: AuditItem['tone']) => {
  if (tone === 'danger') return 'border-l-red-500';
  return 'border-l-amber-500';
};

const toneBadgeClass = (tone: AuditItem['tone']) => {
  if (tone === 'danger') return 'bg-red-100 text-red-600';
  return 'bg-amber-100 text-amber-700';
};

// 编辑器（极简 contenteditable）
const editorSurface = ref<HTMLDivElement | null>(null);

const isEmpty = computed(() => (currentArticle.value.content ?? '').trim().length === 0);

// RAG 激活态：selected / citing / cited
const selectedRagId = ref<number | null>(null);
const citingRagId = ref<number | null>(null);
const citedRagIds = ref<Set<number>>(new Set());

const ragCardClass = (id: number) => {
  if (citingRagId.value === id) return 'border-blue-600 ring-2 ring-blue-600/20';
  if (citedRagIds.value.has(id)) return 'border-blue-200 ring-1 ring-blue-600/10';
  if (selectedRagId.value === id) return 'border-blue-600';
  return 'border-slate-200 hover:border-blue-200';
};

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
};

const handleSurfaceInput = () => {
  if (!editorSurface.value) return;
  editor.setArticle({ content: editorSurface.value.innerText });
};

const syncSurfaceFromStore = () => {
  const el = editorSurface.value;
  if (!el) return;
  const next = currentArticle.value.content ?? '';
  const cur = el.innerText ?? '';
  if (cur !== next) el.innerText = next;
};

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

watch(
  () => currentArticle.value.content,
  () => {
    if (document.activeElement === editorSurface.value) return;
    syncSurfaceFromStore();
  },
);

watch(
  () => lastSeedPrompt.value,
  async () => {
    await nextTick();
    // Dashboard 建议：将 prompt 作为“热点输入”带入工作流
    const seed = (currentArticle.value.content ?? '').trim();
    if (seed) {
      topicInput.value = seed;
      editor.setArticle({ content: '' });
      outline.value = [];
      outlineConfirmed.value = false;
      outlineStreaming.value = false;
      bodyStreaming.value = false;
      maxUnlocked.value = 0;
      currentStep.value = 'topic';
      simulateRagFetch(seed);
    }
  },
);

// 切换到正文/配图步骤时，将 store 内容同步到当前正文栏
watch(
  () => currentStep.value,
  (step) => {
    if (step === 'content' || step === 'audit') {
      nextTick(() => syncSurfaceFromStore());
    }
  },
);

// Step 2: 大纲生成（先流式输出，再进入“块编辑”）
const outline = ref<OutlineItem[]>([]);
const outlineConfirmed = ref(false);
const outlineStreaming = ref(false);
const outlineStreamKey = ref(0);
const outlineSegments = ref<Array<{ ragId?: number; text: string }>>([]);
const refiningId = ref<string | null>(null);

const buildOutlineSegments = (topic: string) => {
  const r1 = ragResults.value[0];
  const r2 = ragResults.value[1];

  return [
    {
      ragId: r1?.id,
      text:
        `## 基于「${topic}」的写作大纲\n` +
        `1) 事件概述：关键条款/信号与变化点\n` +
        `2) 背景脉络：政策目标与产业链约束\n` +
        `3) 影响分析：供应链、成本与竞争格局\n` +
        `4) 风险与对策：合规、反爬/数据风险与替代路径\n` +
        `5) 后续跟踪：关键时间点与监测指标\n\n` +
        `【引用】${r1?.title ?? 'RAG 片段'}：${r1?.content ?? ''}\n`,
    },
    {
      ragId: r2?.id,
      text: `【补充】${r2?.title ?? 'RAG 片段'}：${r2?.content ?? ''}`,
    },
  ];
};

const generateOutline = () => {
  const topic = topicInput.value.trim();
  if (!topic) return;

  simulateRagFetch(topic);
  editor.setArticle({ content: '' });
  outline.value = [];
  outlineConfirmed.value = false;

  maxUnlocked.value = Math.max(maxUnlocked.value, 1);
  currentStep.value = 'outline';

  outlineStreaming.value = true;
  outlineStreamKey.value += 1;
  citedRagIds.value = new Set();
  citingRagId.value = null;
  outlineSegments.value = buildOutlineSegments(topic);
};

const onStreamCiteStart = (id: number) => {
  citingRagId.value = id;
  citedRagIds.value.add(id);
};
const onStreamCiteEnd = (id: number) => {
  if (citingRagId.value === id) citingRagId.value = null;
};
const onOutlineDone = (fullText: string) => {
  outlineStreaming.value = false;
  // 进入块编辑：构建可编辑条目（示例）
  outline.value = [
    { id: 'o1', text: '事件概述：关键条款/信号与变化点' },
    { id: 'o2', text: '背景脉络：政策目标与产业链约束' },
    { id: 'o3', text: '影响分析：供应链重构、成本与竞争格局' },
    { id: 'o4', text: '风险与对策：合规、反爬与替代路径' },
    { id: 'o5', text: '后续跟踪：时间点与监测指标清单' },
  ];
  // 大纲阶段不写入正文，避免“像 Word”一样提前铺满内容
  void fullText;
};

const refineOutlineItem = (item: OutlineItem) => {
  if (refiningId.value) return;
  refiningId.value = item.id;
  window.setTimeout(() => {
    item.text = `${item.text}（细化：给出 2 个论点 + 1 个数据/事实依据）`;
    refiningId.value = null;
  }, 650);
};

const confirmOutlineAndStartBody = () => {
  if (outline.value.length === 0) return;
  outlineConfirmed.value = true;
  maxUnlocked.value = Math.max(maxUnlocked.value, 2);
  currentStep.value = 'content';
  startBodyStreaming();
};

// Step 3: 正文流式生成（按大纲逐段生成，并高亮当前条目）
const bodyStreaming = ref(false);
const bodyStreamKey = ref(0);
const bodySegments = ref<Array<{ ragId?: number; text: string }>>([]);
const activeOutlineIndex = ref(0);

const buildBodySegments = () => {
  const r1 = ragResults.value[0];
  const r2 = ragResults.value[1];
  const topic = topicInput.value.trim() || currentArticle.value.title || '热点话题';

  return outline.value.map((it, idx) => {
    const ragId = idx % 2 === 0 ? r1?.id : r2?.id;
    const title = it.text.replace(/（.*?）$/, '').trim();
    const body =
      `### ${title}\n` +
      `围绕「${topic}」，本段聚焦：${title}。建议按“事实依据 → 影响判断 → 可执行建议”的结构展开。\n` +
      `- 事实依据：结合公开资料与已抓取信源进行交叉验证。\n` +
      `- 影响判断：给出 2-3 条行业/市场影响结论。\n` +
      `- 可执行建议：列出 3 条跟踪清单（时间点/指标/触发条件）。\n`;
    return { ragId, text: body };
  });
};

const startBodyStreaming = () => {
  bodyStreaming.value = true;
  bodyStreamKey.value += 1;
  activeOutlineIndex.value = 0;
  citedRagIds.value = new Set();
  citingRagId.value = null;
  bodySegments.value = buildBodySegments();
};

const onBodySegment = (idx: number) => {
  activeOutlineIndex.value = idx;
};

const onBodyDone = async (fullText: string) => {
  bodyStreaming.value = false;
  editor.setArticle({ content: fullText.trim() });
  maxUnlocked.value = Math.max(maxUnlocked.value, 3);
  await nextTick();
  syncSurfaceFromStore();
  editorSurface.value?.focus();
  if (editorSurface.value) placeCaretAtEnd(editorSurface.value);
  // 创作完成后自动跳转到第 4 步（配图/审核）
  currentStep.value = 'audit';
  await nextTick();
  syncSurfaceFromStore();
};

// “灵感球”：跟随光标
const orb = ref({
  open: false,
  top: 0,
  left: 0,
});
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const updateOrb = () => {
  const el = editorSurface.value;
  if (!el) return;
  if (currentStep.value !== 'content') return;
  if (bodyStreaming.value) return;
  if (document.activeElement !== el) {
    orb.value.open = false;
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    orb.value.open = true;
    const r = el.getBoundingClientRect();
    orb.value.top = r.top + 16;
    orb.value.left = r.left + 16;
    return;
  }

  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const within = el.contains(container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement);
  if (!within) {
    orb.value.open = false;
    return;
  }

  // 折叠光标位置
  const caretRange = range.cloneRange();
  caretRange.collapse(true);
  const rect = caretRange.getClientRects()[0] ?? caretRange.getBoundingClientRect();

  orb.value.open = true;
  const orbW = 40;
  orb.value.top = rect.top - 6;
  orb.value.left = clamp(rect.right + 12, 12, window.innerWidth - orbW - 12);
};

const onOrbClick = () => {
  const prompt = '\n\n【灵感】请给出 5 个更好的切入角度，并各写 1 句核心观点（企业报告风格）。';
  editor.setArticle({ content: `${currentArticle.value.content}${prompt}` });
  nextTick(() => {
    syncSurfaceFromStore();
    editorSurface.value?.focus();
    if (editorSurface.value) placeCaretAtEnd(editorSurface.value);
  });
};

onMounted(() => {
  syncSurfaceFromStore();
  document.addEventListener('selectionchange', updateOrb);
  window.addEventListener('scroll', updateOrb, true);
  window.addEventListener('resize', updateOrb);
});
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', updateOrb);
  window.removeEventListener('scroll', updateOrb, true);
  window.removeEventListener('resize', updateOrb);
});
</script>

<template>
  <div class="h-screen flex flex-col bg-white">
    <header class="border-b border-slate-200 px-6 py-4">
      <div class="flex items-center justify-between gap-6">
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
      </div>

      <!-- Workflow Stepper：热点输入 → 大纲生成 → 正文创作 → 配图/审核 -->
      <div class="mt-4 w-full flex items-center justify-center flex-wrap">
        <div v-for="(s, i) in steps" :key="s.key" class="flex items-center">
          <button
            type="button"
            class="flex items-center gap-2 text-sm transition-colors"
            :class="[
              i <= currentStepIndex ? 'text-blue-600' : i <= maxUnlocked ? 'text-slate-700' : 'text-slate-400',
              i <= maxUnlocked ? 'cursor-pointer' : 'cursor-not-allowed',
            ]"
            :disabled="i > maxUnlocked"
            @click="goStep(s.key)"
          >
            <span
              class="w-6 h-6 rounded-full border flex items-center justify-center text-xs"
              :class="i <= currentStepIndex ? 'border-blue-600 bg-blue-50' : i <= maxUnlocked ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white'"
            >
              {{ i + 1 }}
            </span>
            <span class="hidden sm:inline font-medium">{{ s.label }}</span>
          </button>
          <div
            v-if="i < steps.length - 1"
            class="w-10 h-[2px] mx-3"
            :class="i < currentStepIndex ? 'bg-blue-600' : 'bg-slate-200'"
          />
        </div>
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
          <div v-if="ragLoading" class="space-y-3 animate-pulse">
            <div class="h-20 bg-white border border-slate-200 rounded-lg" />
            <div class="h-20 bg-white border border-slate-200 rounded-lg" />
            <div class="h-20 bg-white border border-slate-200 rounded-lg" />
          </div>

          <div
            v-else
            v-for="item in ragResults"
            :key="item.id"
            class="rag-card p-3 bg-white border rounded-lg group cursor-pointer transition-all duration-300 hover:translate-x-1"
            :class="ragCardClass(item.id)"
            @click="selectedRagId = item.id"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                {{ (item.similarity * 100).toFixed(0) }}% 相关
              </span>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md p-1 text-slate-300 group-hover:text-blue-600 transition-colors"
                aria-label="复制片段"
                @click.stop="handleCopy(item.content)"
              >
                <Copy :size="12" />
              </button>
            </div>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="text-xs font-semibold text-slate-800 mb-1">
                  {{ item.title }}
                </h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  {{ item.content }}
                </p>
              </div>
              <span
                v-if="citingRagId === item.id"
                class="shrink-0 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md"
              >
                引用中
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中栏：极简纸张模式（不做 Word UI） -->
      <section class="flex-1 overflow-y-auto bg-white flex justify-center py-12 relative">
        <div class="w-full max-w-[720px] px-8 relative">
          <!-- Step 1: 热点输入 -->
          <div v-if="currentStep === 'topic'" class="min-h-[640px]">
            <div class="text-center mt-10">
              <h2 class="text-2xl font-semibold text-slate-900">今天想聊聊什么？</h2>
              <p class="mt-2 text-base leading-relaxed text-slate-600">
                输入热点新闻或话题，或点击下方标签快速开始。
              </p>
            </div>

            <div class="mt-8 bg-white border border-slate-100 rounded-lg p-6">
              <div class="relative">
                <input
                  v-model="topicInput"
                  type="text"
                  placeholder="输入热点新闻或话题..."
                  class="w-full px-4 py-3 rounded-md border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none text-base transition-colors"
                />
                <div class="mt-4 flex justify-end">
                  <AppButton :disabled="!topicInput.trim()" @click="generateOutline">
                    <Sparkles :size="18" class="mr-2" />
                    生成大纲
                  </AppButton>
                </div>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap justify-center gap-2">
              <button
                v-for="tag in hotTopics"
                :key="tag"
                type="button"
                class="px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors"
                @click="
                  topicInput = tag;
                  simulateRagFetch(tag);
                "
              >
                # {{ tag }}
              </button>
            </div>
          </div>

          <!-- Step 2: 大纲生成（流式输出 → 块编辑） -->
          <div v-else-if="currentStep === 'outline'" class="min-h-[640px]">
            <div class="bg-white border border-slate-100 rounded-lg p-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-medium text-slate-900 flex items-center gap-2">
                  <ListTree :size="18" class="text-blue-600" />
                  AI 生成的大纲
                </h3>
                <button
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-500 transition-colors inline-flex items-center gap-1"
                  @click="generateOutline"
                >
                  <Sparkles :size="14" />
                  重新规划
                </button>
              </div>

              <div v-if="outlineStreaming" class="mt-6">
                <StreamingOutput
                  :key="outlineStreamKey"
                  :segments="outlineSegments"
                  @cite-start="onStreamCiteStart"
                  @cite-end="onStreamCiteEnd"
                  @done="onOutlineDone"
                />
              </div>

              <div v-else class="mt-6">
                <div class="space-y-2">
                  <div
                    v-for="(item, idx) in outline"
                    :key="item.id"
                    class="group flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <span class="text-slate-300 font-mono text-sm w-6 shrink-0">{{ String(idx + 1).padStart(2, '0') }}</span>
                    <input
                      v-model="item.text"
                      class="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm"
                    />
                    <button
                      type="button"
                      class="text-slate-300 group-hover:text-blue-600 transition-colors"
                      :aria-label="'AI 修改条目 ' + (idx + 1)"
                      @click="refineOutlineItem(item)"
                    >
                      <Sparkles :size="16" :class="refiningId === item.id ? 'animate-spin text-blue-600' : ''" />
                    </button>
                  </div>
                </div>

                <div class="mt-6">
                  <button
                    type="button"
                    class="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 transition-colors active:scale-95 inline-flex items-center justify-center gap-2"
                    :disabled="outline.length === 0"
                    @click="confirmOutlineAndStartBody"
                  >
                    构思完毕，开始生成正文
                    <ArrowRight :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: 正文创作（流式输出 + 大纲联动高亮） -->
          <div v-else-if="currentStep === 'content'" class="min-h-[640px]">
            <div class="bg-white border border-slate-100 rounded-lg p-6">
              <div v-if="bodyStreaming" class="grid grid-cols-12 gap-4">
                <div class="col-span-4">
                  <div class="text-xs text-slate-500 font-semibold mb-2">大纲</div>
                  <div class="space-y-2">
                    <div
                      v-for="(item, idx) in outline"
                      :key="item.id"
                      class="px-3 py-2 rounded-md border text-xs leading-relaxed"
                      :class="idx === activeOutlineIndex ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-200 text-slate-600'"
                    >
                      {{ idx + 1 }}. {{ item.text }}
                    </div>
                  </div>
                </div>
                <div class="col-span-8">
                  <StreamingOutput
                    :key="bodyStreamKey"
                    :segments="bodySegments"
                    @segment="onBodySegment"
                    @cite-start="onStreamCiteStart"
                    @cite-end="onStreamCiteEnd"
                    @done="onBodyDone"
                  />
                </div>
              </div>

              <div v-else>
                <div class="relative">
                  <div
                    ref="editorSurface"
                    contenteditable="true"
                    spellcheck="false"
                    class="editor-surface w-full min-h-[640px] text-lg leading-relaxed text-slate-800 outline-none whitespace-pre-wrap"
                    @input="handleSurfaceInput"
                    @keyup="updateOrb"
                    @mouseup="updateOrb"
                    @focus="updateOrb"
                  ></div>
                  <div
                    v-if="isEmpty"
                    class="pointer-events-none absolute left-0 top-0 text-slate-300 text-lg leading-relaxed"
                  >
                    在这里继续编辑正文...
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: 配图 / 审核（中间保留正文栏，右侧为配图+审核） -->
          <div v-else class="min-h-[640px]">
            <div class="bg-white border border-slate-100 rounded-lg p-6">
              <div
                v-if="currentStep === 'audit'"
                class="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100"
              >
                <div class="flex items-center gap-2 text-slate-900">
                  <CheckCircle :size="18" class="text-blue-600" />
                  <h3 class="text-base font-medium">配图 / 审核</h3>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors active:scale-95"
                    aria-label="灵感球"
                    @click="onOrbClick"
                  >
                    <Lightbulb :size="18" />
                  </button>
                  <AppButton variant="secondary" size="sm" @click="goStep('content')">
                    返回正文
                  </AppButton>
                </div>
              </div>
              <div class="relative">
                <div
                  ref="editorSurface"
                  contenteditable="true"
                  spellcheck="false"
                  class="editor-surface w-full min-h-[640px] text-lg leading-relaxed text-slate-800 outline-none whitespace-pre-wrap"
                  @input="handleSurfaceInput"
                  @keyup="updateOrb"
                  @mouseup="updateOrb"
                  @focus="updateOrb"
                ></div>
                <div
                  v-if="isEmpty"
                  class="pointer-events-none absolute left-0 top-0 text-slate-300 text-lg leading-relaxed"
                >
                  在这里继续编辑正文...
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 右栏：配图 + 审核（仅步骤 4 配图/审核 时显示） -->
      <aside
        v-if="currentStep === 'audit'"
        class="w-80 border-l border-slate-200 bg-white overflow-y-auto shrink-0"
      >
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
                    <button type="button" class="text-white text-xs font-medium hover:text-white">采用</button>
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
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Zap :size="18" class="text-amber-500" />
                  自动审核报告
                </h3>
                <span class="text-xs text-slate-500">实时同步正文内容</span>
              </div>
            </div>
            <div class="p-6">
              <!-- 敏感词语检测 -->
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-slate-700">敏感词语检测</p>
                <p class="text-xs font-semibold text-red-500">发现 {{ auditCounts.sensitive }} 处</p>
              </div>

              <div class="mt-4 space-y-3">
                <div
                  v-for="item in auditReport.sensitive"
                  :key="item.id"
                  class="rounded-lg border border-l-4 p-4"
                  :class="[toneRowClass(item.tone), toneLeftBarClass(item.tone)]"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-red-600">{{ item.title }}</p>
                      <p class="mt-2 text-xs text-slate-600 leading-relaxed">
                        {{ item.description }}
                      </p>
                    </div>
                    <span
                      class="shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold"
                      :class="toneBadgeClass(item.tone)"
                    >
                      {{ item.tag }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="my-6 border-t border-slate-100" />

              <!-- 事实错误检查 -->
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-slate-700">事实错误检查</p>
                <p class="text-xs font-semibold text-amber-600">可疑 {{ auditCounts.factual }} 处</p>
              </div>

              <div class="mt-4 space-y-3">
                <div
                  v-for="item in auditReport.factual"
                  :key="item.id"
                  class="rounded-lg border border-l-4 p-4"
                  :class="[toneRowClass(item.tone), toneLeftBarClass(item.tone)]"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-amber-700">{{ item.title }}</p>
                      <p class="mt-2 text-xs text-slate-600 leading-relaxed">
                        {{ item.description }}
                      </p>
                    </div>
                    <span
                      class="shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold"
                      :class="toneBadgeClass(item.tone)"
                    >
                      {{ item.tag }}
                    </span>
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
