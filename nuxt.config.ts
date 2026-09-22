export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'src/',
  dir: { pages: 'views' },
  components: [{ path: '~/components', pathPrefix: false }],
  devtools: { enabled: false },
  css: ['~/assets/styles/main.css'],
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:3000/api/v1',
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
      privacyVersion: process.env.NUXT_PUBLIC_PRIVACY_VERSION || 'pendiente-validacion'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      titleTemplate: '%s · AsoQuímica UVG',
      meta: [
        { name: 'description', content: 'Sitio de la Asociación de Estudiantes de Química de la Universidad del Valle de Guatemala.' },
        { name: 'theme-color', content: '#2d4a2b' }
      ]
    }
  },
  typescript: { strict: true },
  modules: []
})
