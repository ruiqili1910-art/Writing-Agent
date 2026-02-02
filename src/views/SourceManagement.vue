<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertCircle, Pause, Play, Plus, Search, Settings2, Trash2 } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import AppDataTable from '@/components/ui/AppDataTable.vue';

type Platform = '微信' | '博主' | '官网' | 'RSS';
type Frequency = '5min' | '30min' | '1h' | '6h' | '1d';
type Status = 'active' | 'paused' | 'error';

type Source = {
  id: number;
  name: string;
  platform: Platform;
  frequency: Frequency;
  lastSync: string;
  successRate: number; // 0-1
  status: Status;
  count: number; // 今日贡献
};

// 模拟信源数据
const sources = ref<Source[]>([
  {
    id: 1,
    name: '新华网时政',
    platform: '官网',
    frequency: '5min',
    lastSync: '2026-02-02 17:05',
    status: 'active',
    count: 142,
    successRate: 0.98,
  },
  {
    id: 2,
    name: '九章云极（博主）',
    platform: '博主',
    frequency: '30min',
    lastSync: '2026-02-02 16:30',
    status: 'active',
    count: 12,
    successRate: 0.92,
  },
  {
    id: 3,
    name: 'TechCrunch AI',
    platform: 'RSS',
    frequency: '1h',
    lastSync: '2026-02-01 23:00',
    status: 'error',
    count: 0,
    successRate: 0.0,
  },
  {
    id: 4,
    name: '某公众号（微信）',
    platform: '微信',
    frequency: '6h',
    lastSync: '2026-02-02 09:40',
    status: 'paused',
    count: 0,
    successRate: 0.84,
  },
]);

const query = ref('');
const platformFilter = ref<Platform | '全部'>('全部');
const frequencyFilter = ref<Frequency | '全部'>('全部');
const statusFilter = ref<'全部' | 'active' | 'paused'>('全部');

const columns = [
  { key: 'name', title: '信源名称', width: '28%' },
  { key: 'platform', title: '平台', width: '12%' },
  { key: 'frequency', title: '监听频率', width: '12%' },
  { key: 'lastSync', title: '最后抓取', width: '16%' },
  { key: 'successRate', title: '成功率', width: '12%', align: 'right' as const },
  { key: 'actions', title: '操作', width: '20%', align: 'right' as const },
];

const stats = computed(() => {
  const total = sources.value.length;
  const active = sources.value.filter((s) => s.status === 'active').length;
  const alerts = sources.value.filter((s) => s.status === 'error').length;
  const today = sources.value.reduce((sum, s) => sum + (s.count ?? 0), 0);
  return { total, active, alerts, today };
});

const filteredSources = computed(() => {
  const q = query.value.trim().toLowerCase();
  return sources.value.filter((s) => {
    const matchQuery = !q || s.name.toLowerCase().includes(q);
    const matchPlatform = platformFilter.value === '全部' || s.platform === platformFilter.value;
    const matchFreq = frequencyFilter.value === '全部' || s.frequency === frequencyFilter.value;
    const matchStatus = statusFilter.value === '全部' || s.status === statusFilter.value;
    return matchQuery && matchPlatform && matchFreq && matchStatus;
  });
});

const platformLabel = (p: Platform) => p;

const frequencyLabel = (f: Frequency) => {
  if (f === '5min') return '5 分钟';
  if (f === '30min') return '30 分钟';
  if (f === '1h') return '1 小时';
  if (f === '6h') return '6 小时';
  return '每日';
};

const statusText = (s: Status) => {
  if (s === 'active') return '监听中';
  if (s === 'paused') return '已暂停';
  return '告警';
};

const statusDotClass = (s: Status) => {
  if (s === 'active') return 'bg-blue-600 ring-2 ring-blue-600/20';
  if (s === 'paused') return 'bg-slate-200';
  return 'bg-amber-500 ring-2 ring-amber-500/20';
};

const toggleStatus = (row: Source) => {
  if (row.status === 'error') return;
  row.status = row.status === 'active' ? 'paused' : 'active';
};

const deleteSource = (row: Source) => {
  sources.value = sources.value.filter((s) => s.id !== row.id);
};

const startAll = () => {
  sources.value = sources.value.map((s) => (s.status === 'paused' ? { ...s, status: 'active' as const } : s));
};

const pauseAll = () => {
  sources.value = sources.value.map((s) => (s.status === 'active' ? { ...s, status: 'paused' as const } : s));
};
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-6 xl:px-10 min-[1920px]:px-40 py-8">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">信源管理</h1>
        <p class="text-slate-600 mt-2 text-base leading-relaxed">管理 24h 自动化监听的公开数据源与爬取规则。</p>
      </div>
      <AppButton>
        <Plus :size="18" class="mr-2" />
        新增监听信源
      </AppButton>
    </div>

    <!-- 信源概览（Status Cards） -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div class="text-slate-500 text-xs mb-1 uppercase font-bold tracking-wider">活跃监听中</div>
        <div class="text-2xl font-bold text-slate-900">
          {{ stats.active }}
          <span class="text-sm font-normal text-slate-400">/ {{ stats.total }}</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div class="text-slate-500 text-xs mb-1 uppercase font-bold tracking-wider">今日采集条数</div>
        <div class="text-2xl font-bold text-blue-600">{{ stats.today.toLocaleString() }}</div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
        <div class="text-slate-500 text-xs mb-1 uppercase font-bold tracking-wider">告警信源</div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold text-amber-600">{{ stats.alerts }}</div>
          <div class="inline-flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle :size="16" class="text-amber-500" />
            反爬/异常
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选与搜索（Filter Bar） -->
    <div class="bg-white rounded-t-lg border border-slate-200 border-b-0 p-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
      <div class="flex flex-col sm:flex-row gap-3 flex-1">
        <div class="relative w-full sm:w-96">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
          <input
            v-model="query"
            type="text"
            placeholder="搜索信源名称或 URL..."
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <select
          v-model="platformFilter"
          class="w-full sm:w-44 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="全部">平台：全部</option>
          <option value="微信">平台：微信</option>
          <option value="博主">平台：博主</option>
          <option value="官网">平台：官网</option>
          <option value="RSS">平台：RSS</option>
        </select>

        <select
          v-model="frequencyFilter"
          class="w-full sm:w-44 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="全部">频率：全部</option>
          <option value="5min">频率：5min</option>
          <option value="30min">频率：30min</option>
          <option value="1h">频率：1h</option>
          <option value="6h">频率：6h</option>
          <option value="1d">频率：1d</option>
        </select>

        <select
          v-model="statusFilter"
          class="w-full sm:w-44 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="全部">状态：全部</option>
          <option value="active">状态：监听中</option>
          <option value="paused">状态：已暂停</option>
        </select>
      </div>

      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" @click="startAll">全部启动</AppButton>
        <AppButton variant="secondary" size="sm" @click="pauseAll">全部暂停</AppButton>
      </div>
    </div>

    <!-- 信源列表（Data Table） -->
    <div class="bg-white rounded-b-lg border border-slate-200 overflow-hidden">
      <AppDataTable :columns="columns" :data="filteredSources" rowKey="id">
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2 h-2 rounded-full" :class="statusDotClass(row.status)"></span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ row.name }}</p>
              <p class="text-xs text-slate-500 mt-1">ID：{{ row.id }}</p>
            </div>
          </div>
        </template>

        <template #cell-platform="{ row }">
          <span class="text-sm text-slate-700">{{ platformLabel(row.platform) }}</span>
        </template>

        <template #cell-frequency="{ row }">
          <span class="text-sm text-slate-700">{{ frequencyLabel(row.frequency) }}</span>
        </template>

        <template #cell-successRate="{ row }">
          <span class="text-sm text-slate-700 tabular-nums">{{ Math.round(row.successRate * 100) }}%</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              class="text-slate-400 hover:text-blue-600 transition-colors"
              :aria-label="row.status === 'active' ? '暂停' : '启动'"
              @click="toggleStatus(row)"
            >
              <component :is="row.status === 'active' ? Pause : Play" :size="16" />
            </button>
            <button
              type="button"
              class="text-slate-400 hover:text-blue-600 transition-colors"
              aria-label="配置规则"
            >
              <Settings2 :size="16" />
            </button>
            <button
              type="button"
              class="text-slate-400 hover:text-red-500 transition-colors"
              aria-label="删除"
              @click="deleteSource(row)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </template>

        <template #cell-status="{ row }">
          <div class="flex items-center gap-2 justify-start">
            <span class="w-2 h-2 rounded-full" :class="statusDotClass(row.status)"></span>
            <span class="text-sm text-slate-700">{{ statusText(row.status) }}</span>
          </div>
        </template>

        <template #cell-count="{ row }">
          <span class="text-sm text-slate-700 tabular-nums">{{ row.count }}</span>
        </template>
      </AppDataTable>
    </div>
  </div>
</template>

