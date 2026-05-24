import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'ぼくこは.cms',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },

  css: ['~/assets/css/main.css', 'vue-sonner/style.css'],

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

  modules: ['shadcn-nuxt', 'nuxt-auth-utils', '@nuxt/image', '@nuxtjs/mdc', '@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ぼくこは.cms',
      short_name: 'こは.cms',
      description: 'ぼくこは.dev ヘッドレスCMS',
      theme_color: '#09090b',
      background_color: '#09090b',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\//,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },

  mdc: {
    headings: {
      anchorLinks: false,
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    sessionSecret: '',
    adminPasswordHash: '',
    totpSecret: '',
    session: {
      password: '',
      maxAge: 60 * 60 * 24 * 30, // 30日
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
    dynamodbRegion: 'ap-northeast-1',
    dynamodbAccessKeyId: '',
    dynamodbSecretAccessKey: '',
    dynamodbTable: 'bokukoha-comments',
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.bokukoha.dev blob:; connect-src 'self'; font-src 'self' data:; worker-src 'self'; frame-ancestors 'none';",
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },
})