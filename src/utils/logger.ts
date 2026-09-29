export type FrontendLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'
type LogContext = Record<string, boolean | number | string | null | undefined>

const priorities: Record<Exclude<FrontendLogLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export const useAppLogger = () => {
  const configured = useRuntimeConfig().public.logLevel as FrontendLogLevel
  const level: FrontendLogLevel = configured in priorities || configured === 'silent' ? configured : 'warn'

  const write = (candidate: Exclude<FrontendLogLevel, 'silent'>, event: string, context: LogContext = {}) => {
    if (level === 'silent' || priorities[candidate] < priorities[level]) return

    const entry = { timestamp: new Date().toISOString(), level: candidate, service: 'aequvg-frontend', event, ...context }
    if (import.meta.server) {
      const output = JSON.stringify(entry)
      if (candidate === 'error') console.error(output)
      else if (candidate === 'warn') console.warn(output)
      else if (candidate === 'info') console.info(output)
      else console.debug(output)
      return
    }

    const method = candidate === 'debug' ? console.debug : candidate === 'info' ? console.info : candidate === 'warn' ? console.warn : console.error
    method(`[AEQUVG] ${event}`, context)
  }

  return {
    debug: (event: string, context?: LogContext) => write('debug', event, context),
    info: (event: string, context?: LogContext) => write('info', event, context),
    warn: (event: string, context?: LogContext) => write('warn', event, context),
    error: (event: string, context?: LogContext) => write('error', event, context),
  }
}
