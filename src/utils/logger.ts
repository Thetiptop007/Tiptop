const isDev = import.meta.env.DEV;

type LogMeta = Record<string, unknown> | undefined;

const logWithMeta = (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: LogMeta) => {
  const payload = meta ? [message, meta] : [message];

  switch (level) {
    case 'debug':
      // Only emit debug noise in development.
      if (isDev) {
        console.debug(...payload);
      }
      return;
    case 'info':
      if (isDev) {
        console.info(...payload);
      }
      return;
    case 'warn':
      // Warn in all environments, but keep message concise.
      console.warn(...payload);
      return;
    case 'error':
      // Errors should always be visible.
      console.error(...payload);
      return;
    default:
      return;
  }
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => logWithMeta('debug', message, meta),
  info: (message: string, meta?: LogMeta) => logWithMeta('info', message, meta),
  warn: (message: string, meta?: LogMeta) => logWithMeta('warn', message, meta),
  error: (message: string, meta?: LogMeta) => logWithMeta('error', message, meta),
};

export const devOnly = (fn: () => void) => {
  if (isDev) fn();
};
