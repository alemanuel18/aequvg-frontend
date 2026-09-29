export default defineNuxtPlugin((nuxtApp) => {
  const logger = useAppLogger()

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    logger.error('vue_error', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      info,
    })
  })

  nuxtApp.hook('app:error', (error) => {
    logger.error('app_error', { errorName: error instanceof Error ? error.name : 'UnknownError' })
  })
})
