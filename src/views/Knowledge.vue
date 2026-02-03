<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Database,
  Folder,
  FolderOpen,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-vue-next';

type Dataset = {
  id: string;
  name: string;
  count: number;
};

type DocStatus = 'ready' | 'parsing' | 'error';

type Document = {
  id: number;
  name: string;
  status: DocStatus;
  chunks: number;
  size: string;
  time: string;
  error?: string;
};

const datasets = ref<Dataset[]>([
  { id: 'ds-1', name: '时政点评文风库', count: 120 },
  { id: 'ds-2', name: '2026 政策汇编', count: 45 },
]);

const currentDsId = ref('ds-1');
const isLocalSidebarCollapsed = ref(false);

const documents = ref<Document[]>([
  {
    id: 1,
    name: '2026_半导体出口政策解读.pdf',
    status: 'ready',
    chunks: 128,
    size: '2.4MB',
    time: '2026-02-03 10:15',
  },
  {
    id: 2,
    name: '全球供应链安全报告.docx',
    status: 'parsing',
    chunks: 0,
    size: '1.1MB',
    time: '2026-02-03 10:20',
  },
  {
    id: 3,
    name: '博主_科技观察家_观点合集.md',
    status: 'error',
    chunks: 0,
    size: '45KB',
    time: '2026-02-02 18:00',
    error: 'DOM解析异常',
  },
]);

const currentDsName = computed(
  () => datasets.value.find((d) => d.id === currentDsId.value)?.name ?? '知识库'
);

function getStatusClass(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    parsing: 'bg-blue-50 text-blue-600 border-blue-100',
    error: 'bg-red-50 text-red-600 border-red-100',
  };
  return map[status];
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <aside
      :class="[
        isLocalSidebarCollapsed ? 'w-0 opacity-0 -ml-1' : 'w-60 opacity-100',
        'bg-white border-r border-slate-200 transition-all duration-300 flex flex-col relative',
      ]"
    >
      <div
        class="h-16 px-4 border-b border-slate-100 flex items-center justify-between"
      >
        <span class="text-sm font-bold text-slate-800 tracking-tight"
          >数据集目录</span
        >
        <button type="button" class="text-slate-400 hover:text-blue-600">
          <Plus :size="16" />
        </button>
      </div>

      <div class="p-3">
        <div class="relative">
          <Search
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            :size="14"
          />
          <input
            type="text"
            placeholder="搜索知识库..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-md text-xs focus:ring-2 focus:ring-blue-600/10 outline-none"
          />
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 space-y-0.5">
        <div
          v-for="ds in datasets"
          :key="ds.id"
          role="button"
          tabindex="0"
          @click="currentDsId = ds.id"
          @keydown.enter="currentDsId = ds.id"
          :class="[
            currentDsId === ds.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50',
            'flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors group',
          ]"
        >
          <component
            :is="currentDsId === ds.id ? FolderOpen : Folder"
            :size="16"
          />
          <span class="text-sm truncate">{{ ds.name }}</span>
          <span
            class="ml-auto text-[10px] text-slate-400 group-hover:text-blue-400"
            >{{ ds.count }}</span
          >
        </div>
      </nav>

      <button
        type="button"
        @click="isLocalSidebarCollapsed = !isLocalSidebarCollapsed"
        class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-10"
      >
        <ChevronLeft v-if="!isLocalSidebarCollapsed" :size="14" />
        <ChevronRight v-else :size="14" />
      </button>
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <header
        class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <button
            v-if="isLocalSidebarCollapsed"
            type="button"
            @click="isLocalSidebarCollapsed = false"
            class="p-1 hover:bg-slate-100 rounded text-blue-600 mr-2"
          >
            <Database :size="18" />
          </button>
          <h2 class="text-lg font-semibold text-slate-900">{{ currentDsName }}</h2>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-500 transition-all"
          >
            上传文档
          </button>
        </div>
      </header>

      <div class="flex-1 p-8 overflow-y-auto">
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
              >
                批量重新解析
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-red-50 hover:text-red-600 text-slate-600"
              >
                批量删除
              </button>
            </div>
            <div class="text-xs text-slate-400">
              当前数据集已占用 15.4MB 存储空间
            </div>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
          >
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                <tr>
                  <th class="px-6 py-4 w-10">
                    <input type="checkbox" class="rounded border-slate-300" />
                  </th>
                  <th class="px-6 py-4">文档名称</th>
                  <th class="px-6 py-4">解析状态</th>
                  <th class="px-6 py-4 text-center">切片数量</th>
                  <th class="px-6 py-4">更新时间</th>
                  <th class="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="doc in documents"
                  :key="doc.id"
                  class="hover:bg-slate-50/50 transition-colors group"
                >
                  <td class="px-6 py-4">
                    <input type="checkbox" class="rounded border-slate-300" />
                  </td>
                  <td class="px-6 py-4 flex items-center gap-3">
                    <FileText
                      :size="18"
                      class="text-slate-400 group-hover:text-blue-600 transition-colors"
                    />
                    <div>
                      <div class="font-medium text-slate-700">{{ doc.name }}</div>
                      <div class="text-[10px] text-slate-400">{{ doc.size }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div
                      :class="[
                        getStatusClass(doc.status),
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider',
                      ]"
                    >
                      <CheckCircle2 v-if="doc.status === 'ready'" :size="12" />
                      <Loader2
                        v-else-if="doc.status === 'parsing'"
                        :size="12"
                        class="animate-spin"
                      />
                      <AlertCircle v-else :size="12" />
                      {{
                        doc.status === 'ready'
                          ? 'Ready'
                          : doc.status === 'parsing'
                            ? 'Parsing'
                            : 'Error'
                      }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      v-if="doc.status === 'ready'"
                      class="text-blue-600 font-mono font-medium hover:underline cursor-pointer"
                      >{{ doc.chunks }}</span
                    >
                    <span v-else class="text-slate-300">-</span>
                  </td>
                  <td class="px-6 py-4 text-slate-400 text-xs">{{ doc.time }}</td>
                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      class="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <MoreHorizontal :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
