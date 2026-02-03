/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 企业品牌蓝：blue-600 = #2581ED（同时补齐 blue-50 ~ blue-900 映射）
      colors: {
        blue: {
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#91CAFF',
          300: '#69B1FF',
          400: '#4096FF',
          500: '#3A8DF0',
          600: '#2581ED',
          700: '#0958D9',
          800: '#003EB3',
          900: '#002C8C',
          950: '#001D66',
        },
        // Dashboard Hero 叠色层：#8AC8F8 @ 20%
        brandTint: '#8AC8F8',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

