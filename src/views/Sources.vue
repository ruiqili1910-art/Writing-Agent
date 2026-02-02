<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-6 xl:px-10 min-[1920px]:px-40 py-8">
    <div class="flex items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">信源管理</h1>
        <p class="mt-2 text-base leading-relaxed text-slate-600">管理 24h 监听的公开数据源。</p>
      </div>
      <AppButton>新增信源</AppButton>
    </div>

    <div class="mt-6 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <p class="text-base leading-relaxed text-slate-600">该模块页面示例待完善。</p>
    </div>
  </div>
</template>

