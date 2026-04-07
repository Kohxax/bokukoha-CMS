import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ['shadcn-nuxt', 'nuxt-auth-utils'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    sessionSecret: '',
    adminPasswordHash: '',
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
