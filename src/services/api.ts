import type { ApiError } from '~/types/api'

export class PublicApiError extends Error {
  constructor(message: string, public readonly code = 'REQUEST_FAILED', public readonly fields?: Record<string, string>) { super(message) }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const logger = useAppLogger()
  const baseURL = import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl
  return async <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    try { return await $fetch<T>(path, { baseURL, ...options }) }
    catch (error) {
      const apiError = error as { data?: ApiError; status?: number; statusCode?: number }
      const data = apiError.data
      logger.warn('api_request_failed', {
        path,
        method: String(options.method ?? 'GET'),
        status: apiError.statusCode ?? apiError.status ?? null,
        code: data?.error?.code ?? 'REQUEST_FAILED',
      })
      throw new PublicApiError(data?.error?.message ?? 'No pudimos comunicarnos con el servicio. Intenta nuevamente.', data?.error?.code, data?.error?.details)
    }
  }
}
