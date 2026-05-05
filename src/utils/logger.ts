const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogType = 'ui' | 'network' | 'auth' | 'business' | 'runtime' | 'browser';
type LogMeta = Record<string, unknown> | undefined;

const SESSION_STORAGE_KEY = 'tiptop-frontend-session-id';
const DEDUPE_WINDOW_MS = 750;
const recentFingerprints = new Map<string, number>();
const installedRuntimeLoggerFlag = '__tiptopRuntimeLoggingInstalled';

const SENSITIVE_KEY_PATTERN = /(email|phone|address|token|password|secret|authorization|cookie|csrf|session|refresh|raw|payload|response|request|customer|user|order)/i;
const SUMMARY_KEY_PATTERN = /(customer|user|order|payment|address|profile|auth|response|request|payload)/i;

const getSessionId = () => {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return 'browser';
  }
};

const getCurrentRoute = () => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  return window.location.pathname || 'unknown';
};

const toEventName = (message: string) =>
  message
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 80) || 'APP_EVENT';

const summarizeEntity = (key: string, value: Record<string, unknown>) => {
  if (key === 'order' || key === 'orders') {
    return {
      _id: value._id,
      id: value.id,
      orderId: value.orderId,
      status: value.status,
      orderType: value.orderType,
      itemCount: value.itemCount,
      total: value.total,
      pricing: value.pricing ? { finalAmount: (value.pricing as Record<string, unknown>).finalAmount } : undefined,
    };
  }

  if (key === 'customer' || key === 'user' || key === 'profile') {
    return {
      _id: value._id,
      id: value.id,
      role: value.role,
      status: value.status,
      isActive: value.isActive,
    };
  }

  if (key === 'address') {
    return { hasAddress: true };
  }

  if (key === 'response' || key === 'payload' || key === 'request') {
    return { type: key, keys: Object.keys(value).slice(0, 8) };
  }

  return value;
};

const sanitizeValue = (value: unknown, key = ''): unknown => {
  if (value == null) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: isDev ? value.stack : undefined,
    };
  }

  if (Array.isArray(value)) {
    if (value.length > 10) {
      return { type: 'array', length: value.length };
    }

    return value.map((item) => sanitizeValue(item, key));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (SUMMARY_KEY_PATTERN.test(key)) {
      return summarizeEntity(key, record);
    }

    const sanitized: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(record)) {
      if (SENSITIVE_KEY_PATTERN.test(nestedKey)) {
        sanitized[nestedKey] = '[REDACTED]';
        continue;
      }

      sanitized[nestedKey] = sanitizeValue(nestedValue, nestedKey);
    }

    return sanitized;
  }

  if (typeof value === 'string' && SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }

  return value;
};

const sanitizeMeta = (meta?: LogMeta) => {
  if (!meta) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key, sanitizeValue(value, key)])
  );
};

const shouldEmit = (level: LogLevel) => {
  if (level === 'debug') {
    return isDev;
  }

  return true;
};

const shouldDedupe = (level: LogLevel, logType: LogType, event: string, message: string, route: string) => {
  const fingerprint = `${level}|${logType}|${event}|${message}|${route}`;
  const now = Date.now();
  const lastSeen = recentFingerprints.get(fingerprint);

  if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentFingerprints.set(fingerprint, now);

  if (recentFingerprints.size > 250) {
    for (const [entryKey, entryAt] of recentFingerprints.entries()) {
      if (now - entryAt > DEDUPE_WINDOW_MS) {
        recentFingerprints.delete(entryKey);
      }
    }
  }

  return false;
};

const emit = (
  level: LogLevel,
  logType: LogType,
  event: string,
  message: string,
  meta?: LogMeta,
) => {
  if (!shouldEmit(level)) {
    return;
  }

  const route = (meta?.route as string | undefined) || getCurrentRoute();
  if (shouldDedupe(level, logType, event, message, route)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    logType,
    event,
    message,
    route,
    source: (meta?.source as string | undefined) || 'app',
    sessionId: getSessionId(),
    requestId: meta?.requestId,
    component: meta?.component,
    action: meta?.action,
    userId: meta?.userId,
    status: meta?.status,
    durationMs: meta?.durationMs,
    statusCode: meta?.statusCode,
    metadata: sanitizeMeta(meta),
  };

  const consoleMethod = console[level] || console.info;
  consoleMethod.call(console, payload);
};

const emitStructured = (
  level: LogLevel,
  logType: LogType,
  event: string,
  message: string,
  meta?: LogMeta,
) => emit(level, logType, event, message, meta);

const normalizeLegacyArgs = (message: string, meta?: LogMeta) => ({
  event: toEventName(message),
  message,
  meta,
});

export const logger = {
  debug: (message: string, meta?: LogMeta) => {
    const { event, message: normalizedMessage, meta: normalizedMeta } = normalizeLegacyArgs(message, meta);
    emitStructured('debug', 'runtime', event, normalizedMessage, normalizedMeta);
  },
  info: (message: string, meta?: LogMeta) => {
    const { event, message: normalizedMessage, meta: normalizedMeta } = normalizeLegacyArgs(message, meta);
    emitStructured('info', 'runtime', event, normalizedMessage, normalizedMeta);
  },
  warn: (message: string, meta?: LogMeta) => {
    const { event, message: normalizedMessage, meta: normalizedMeta } = normalizeLegacyArgs(message, meta);
    emitStructured('warn', 'runtime', event, normalizedMessage, normalizedMeta);
  },
  error: (message: string, meta?: LogMeta) => {
    const { event, message: normalizedMessage, meta: normalizedMeta } = normalizeLegacyArgs(message, meta);
    emitStructured('error', 'runtime', event, normalizedMessage, normalizedMeta);
  },
  ui: (event: string, message: string, meta?: LogMeta) => emitStructured('info', 'ui', event, message, meta),
  network: (event: string, message: string, meta?: LogMeta) => emitStructured('info', 'network', event, message, meta),
  auth: (event: string, message: string, meta?: LogMeta) => emitStructured('info', 'auth', event, message, meta),
  business: (event: string, message: string, meta?: LogMeta) => emitStructured('info', 'business', event, message, meta),
  runtime: (event: string, message: string, meta?: LogMeta) => emitStructured('error', 'runtime', event, message, meta),
};

export const installBrowserRuntimeLogging = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const runtimeWindow = window as Window & { [installedRuntimeLoggerFlag]?: boolean };
  if (runtimeWindow[installedRuntimeLoggerFlag]) {
    return;
  }

  runtimeWindow[installedRuntimeLoggerFlag] = true;

  window.addEventListener('error', (event) => {
    logger.runtime('WINDOW_ERROR', 'Browser runtime error', {
      source: 'browser',
      component: 'window',
      action: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.runtime('UNHANDLED_REJECTION', 'Browser unhandled promise rejection', {
      source: 'browser',
      component: 'window',
      action: 'unhandledrejection',
      reason: event.reason,
    });
  });
};

export const devOnly = (fn: () => void) => {
  if (isDev) fn();
};
