import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light', // 'light' | 'dark'
  }),
  actions: {
    init() {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.setTheme('dark');
      } else {
        this.setTheme('light');
      }

      // sync across tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'theme' && e.newValue) this.setTheme(e.newValue);
      });
    },

    setTheme(value) {
      this.theme = value;
      try {
        localStorage.setItem('theme', value);
      } catch (e) {
        // ignore localStorage errors (private mode)
      }
      document.documentElement.classList.toggle('dark', value === 'dark');
    },

    toggle() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    },
  },
});
