<script setup lang="ts">
type Column = {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
};

const props = defineProps<{
  columns: Column[];
  data: Array<Record<string, unknown>>;
  rowKey?: string;
}>();

const getAlignClass = (align?: Column['align']) => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse">
      <thead class="bg-slate-50">
        <tr class="border-b border-slate-200">
          <th
            v-for="col in props.columns"
            :key="col.key"
            class="px-6 py-3 text-xs font-semibold text-slate-500 tracking-wide"
            :class="getAlignClass(col.align)"
            :style="col.width ? { width: col.width } : undefined"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>

      <tbody class="bg-white">
        <tr
          v-for="row in props.data"
          :key="props.rowKey ? String(row[props.rowKey] ?? '') : JSON.stringify(row)"
          class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
        >
          <td
            v-for="col in props.columns"
            :key="col.key"
            class="px-6 py-4 align-middle"
            :class="getAlignClass(col.align)"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              <span class="text-sm text-slate-700">
                {{ row[col.key] as any }}
              </span>
            </slot>
          </td>
        </tr>

        <tr v-if="props.data.length === 0">
          <td :colspan="props.columns.length" class="px-6 py-10 text-center">
            <p class="text-sm text-slate-500">暂无数据</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

