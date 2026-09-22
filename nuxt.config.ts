import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'NeNepOS — Quản lý nề nếp học sinh',
      htmlAttrs: { lang: 'vi' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'theme-color', content: '#faf9f6' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Hỗ trợ Cloudflare Workers (mặc định) hoặc Node.js server (VPS / Docker) qua NITRO_PRESET
  nitro: {
    preset: process.env.NITRO_PRESET || 'cloudflare-module',
    cloudflare: {
      nodeCompat: true,
    },
    minify: true,
  },

  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET || 'dev-secret-change-me-in-production',
    libsqlUrl: process.env.LIBSQL_URL || process.env.TURSO_URL || '',
    libsqlAuthToken: process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '',
    public: {
      appName: 'NeNepOS',
    },
  },

  routeRules: {
    '/admin/**': { ssr: false },
    '/print/**': { ssr: false },
  },
})
