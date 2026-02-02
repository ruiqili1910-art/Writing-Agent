import { createRouter, createWebHistory } from 'vue-router';

import Dashboard from '@/views/Dashboard.vue';
import Editor from '@/views/Editor.vue';
import Knowledge from '@/views/Knowledge.vue';
import Publish from '@/views/Publish.vue';
import SourceManagement from '@/views/SourceManagement.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'overview', component: Dashboard },
    { path: '/sources', name: 'sources', component: SourceManagement },
    { path: '/editor', name: 'editor', component: Editor },
    { path: '/knowledge', name: 'knowledge', component: Knowledge },
    { path: '/publish', name: 'publish', component: Publish },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

