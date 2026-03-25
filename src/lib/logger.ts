type LogLevel = "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  path?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error
        ? { error: String(error) }
        : {}),
  };

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // Dev: readable format
  const ctx = context
    ? ` [${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(" ")}]`
    : "";
  const err = error instanceof Error ? ` — ${error.message}` : error ? ` — ${error}` : "";
  return `[${entry.timestamp}] ${level.toUpperCase()} ${message}${ctx}${err}`;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(formatLog("error", message, context, error));
  },
};
