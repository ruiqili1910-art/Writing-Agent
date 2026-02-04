<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logoUrl from '@/assets/logo.svg?url';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  LayoutDashboard,
  PenTool,
  Send,
  Settings,
  Sparkles,
} from 'lucide-vue-next';

type MenuItem = {
  key: string;
  name: string;
  icon: unknown;
  path: string;
  badge?: string;
};

// 导航显示开关：调试时把某页设为 false 即可在侧栏隐藏
const navVisible: Record<string, boolean> = {
  overview: false,
  sources: false,
  knowledge: false,
  editor: false,
  publish: false,
  writingAssistant: true,
};

// 导航配置
const menuItems: MenuItem[] = [
  { key: 'overview', name: '概览', icon: LayoutDashboard, path: '/' },
  { key: 'sources', name: '信源管理', icon: Globe, path: '/sources' },
  { key: 'knowledge', name: 'RAG 知识库', icon: Database, path: '/knowledge' },
  { key: 'editor', name: '创作工作台', icon: PenTool, path: '/editor' },
  { key: 'publish', name: '内容分发', icon: Send, path: '/publish' },
  { key: 'writingAssistant', name: '写作助手', icon: Sparkles, path: '/writing-assistant' },
];

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => navVisible[item.key] !== false)
);

// 侧边栏：1920px 下默认展开
const userCollapsed = ref(false);
const autoCollapsed = ref(false);
const isCollapsed = computed(() => (autoCollapsed.value ? true : userCollapsed.value));

let mq: MediaQueryList | null = null;
let onMqChange: ((e: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  mq = window.matchMedia('(max-width: 1439px)');
  autoCollapsed.value = mq.matches;

  onMqChange = (e: MediaQueryListEvent) => {
    autoCollapsed.value = e.matches;
  };

  // Safari < 14 fallback
  if ('addEventListener' in mq) mq.addEventListener('change', onMqChange);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (mq as any).addListener(onMqChange);
});

onBeforeUnmount(() => {
  if (!mq || !onMqChange) return;
  if ('removeEventListener' in mq) mq.removeEventListener('change', onMqChange);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (mq as any).removeListener(onMqChange);
});

const route = useRoute();
const router = useRouter();

const isActive = (path: string) => route.path === path;
const go = (path: string) => router.push(path);
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex">
    <aside
      :class="[
        isCollapsed ? 'w-20' : 'w-64',
        'h-screen sticky top-0 bg-white text-slate-700 flex flex-col transition-all duration-300 border-r border-slate-200',
      ]"
    >
      <div class="h-20 flex items-center px-6 gap-3 overflow-hidden">
        <img
          :src="logoUrl"
          alt="AutoWriter AI"
          class="w-8 h-8 rounded-md flex-shrink-0 object-contain"
        />
        <span v-if="!isCollapsed" class="text-slate-900 font-semibold text-lg whitespace-nowrap">
          AutoWriter AI
        </span>
      </div>

      <nav class="flex-1 px-3 space-y-1 py-4">
        <div
          v-for="item in visibleMenuItems"
          :key="item.name"
          @click="go(item.path)"
          :class="[
            isActive(item.path) ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 hover:text-slate-900',
            'group flex items-center px-3 py-3 rounded-md cursor-pointer transition-colors relative',
          ]"
        >
          <component :is="item.icon" :size="20" class="flex-shrink-0" />
          <span v-if="!isCollapsed" class="ml-3 font-medium transition-opacity">
            {{ item.name }}
          </span>

          <span
            v-if="!isCollapsed && item.badge"
            class="ml-auto bg-red-500 text-[10px] text-white px-1.5 py-0.5 rounded-md"
          >
            {{ item.badge }}
          </span>

          <div
            v-if="isCollapsed"
            class="hidden group-hover:block absolute left-full ml-4 px-2 py-1 bg-white text-slate-900 text-xs rounded-md border border-slate-200 shadow-sm whitespace-nowrap z-50"
          >
            {{ item.name }}
          </div>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-200 space-y-2">
        <div v-if="!isCollapsed" class="px-2 mb-4">
          <div class="flex justify-between text-[10px] mb-1 text-slate-500 uppercase">
            AI Node Load
          </div>
          <div class="w-full bg-slate-200 h-1 rounded overflow-hidden">
            <div class="bg-blue-500 h-full w-[35%]"></div>
          </div>
        </div>

        <div class="flex items-center px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
          <Settings :size="20" />
          <span v-if="!isCollapsed" class="ml-3 text-sm">系统设置</span>
        </div>

        <div
          @click="userCollapsed = !userCollapsed"
          class="flex items-center px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors text-slate-500"
        >
          <component :is="isCollapsed ? ChevronRight : ChevronLeft" :size="20" />
          <span v-if="!isCollapsed" class="ml-3 text-sm">收起导航</span>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>

