<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Sparkles } from 'lucide-vue-next';

type Segment = { ragId?: number; text: string };

const props = withDefaults(
  defineProps<{
    segments: Segment[];
    speedMs?: number;
  }>(),
  { speedMs: 18 },
);

const emit = defineEmits<{
  (e: 'cite-start', ragId: number): void;
  (e: 'cite-end', ragId: number): void;
  (e: 'segment', index: number): void;
  (e: 'done', fullText: string): void;
}>();

const output = ref('');

let timer: number | null = null;
let segIdx = 0;
let charIdx = 0;

const clear = () => {
  if (timer) window.clearInterval(timer);
  timer = null;
};

const start = () => {
  clear();
  output.value = '';
  segIdx = 0;
  charIdx = 0;

  const nextTick = () => {
    const seg = props.segments[segIdx];
    if (!seg) {
      clear();
      emit('done', output.value);
      return;
    }

    if (charIdx === 0) {
      emit('segment', segIdx);
      if (seg.ragId != null) emit('cite-start', seg.ragId);
    }

    output.value += seg.text[charIdx] ?? '';
    charIdx += 1;

    if (charIdx >= seg.text.length) {
      if (seg.ragId != null) emit('cite-end', seg.ragId);
      segIdx += 1;
      charIdx = 0;
      output.value += '\n';
    }
  };

  timer = window.setInterval(nextTick, props.speedMs);
};

onMounted(start);
onBeforeUnmount(clear);
</script>

<template>
  <div class="w-full">
    <div class="mb-3 inline-flex items-center gap-2 text-xs text-blue-600">
      <Sparkles :size="16" class="animate-pulse" />
      <span class="font-medium">AI 正在生成</span>
    </div>

    <div class="whitespace-pre-wrap text-lg leading-relaxed text-slate-800">
      {{ output }}<span class="inline-block align-text-bottom ml-0.5 h-5 w-2 bg-blue-600 animate-pulse"></span>
    </div>
  </div>
</template>

