import { defineStore } from 'pinia';
import { ref } from 'vue';
import { router } from '@/router';

export const useEditorStore = defineStore('editor', () => {
  const currentArticle = ref<{ title: string; content: string }>({ title: '', content: '' });
  const lastSeedPrompt = ref<string>('');

  const setArticle = (data: Partial<typeof currentArticle.value>) => {
    currentArticle.value = { ...currentArticle.value, ...data };
  };

  /**
   * 从 Dashboard 建议启动写作工作流：
   * 1) 切换到「创作工作台」
   * 2) 填充标题与提示词（Prompt）
   */
  const startFromSuggestion = (payload: { title: string; prompt: string }) => {
    router.push('/editor');

    lastSeedPrompt.value = payload.prompt;
    setArticle({
      title: payload.title,
      content: payload.prompt,
    });
  };

  return { currentArticle, lastSeedPrompt, setArticle, startFromSuggestion };
});

