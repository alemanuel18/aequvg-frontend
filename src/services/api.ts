import type { ApiError } from '~/types/api'

export class PublicApiError extends Error {
  constructor(message: string, public readonly code = 'REQUEST_FAILED', public readonly fields?: Record<string, string>) { super(message) }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl
  return async <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    try { return await $fetch<T>(path, { baseURL, ...options }) }
    catch (error) {
      const data = (error as { data?: ApiError }).data
      throw new PublicApiError(data?.error?.message ?? 'No pudimos comunicarnos con el servicio. Intenta nuevamente.', data?.error?.code, data?.error?.details)
    }
  }
}
