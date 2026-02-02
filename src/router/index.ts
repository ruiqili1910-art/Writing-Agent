import { createRouter, createWebHistory } from 'vue-router';

import Dashboard from '@/views/Dashboard.vue';
import EditorWorkbench from '@/views/EditorWorkbench.vue';
import Knowledge from '@/views/Knowledge.vue';
import Publish from '@/views/Publish.vue';
import Sources from '@/views/Sources.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'overview', component: Dashboard },
    { path: '/sources', name: 'sources', component: Sources },
    { path: '/editor', name: 'editor', component: EditorWorkbench },
    { path: '/knowledge', name: 'knowledge', component: Knowledge },
    { path: '/publish', name: 'publish', component: Publish },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

