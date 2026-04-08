import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['@codemirror/state', '@codemirror/view'],
    },
    optimizeDeps: {
      include: [
        'codemirror',
        '@codemirror/lang-markdown',
        '@codemirror/theme-one-dark',
        'lucide-vue-next',
        'class-variance-authority',
        'reka-ui',
        '@vueuse/core',
        'clsx',
        'tailwind-merge',
        'marked',
        'vue-sonner',
      ],
    },
  },

  modules: ['shadcn-nuxt', 'nuxt-auth-utils'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    sessionSecret: '',
    adminPasswordHash: '',
    session: {
      password: '',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: '',
    r2PublicUrl: 'https://images.bokukoha.dev',
    dbPath: '/app/data/cms.db',
    cfDeployHookUrl: '',
  },

  future: {
    compatibilityVersion: 4,
  },
})
