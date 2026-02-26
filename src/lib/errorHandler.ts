export interface AppError {
  prefix: string;
  title: string;
  detail: string;
  stack?: string;
  timestamp: string;
}

type ErrorListener = (error: AppError) => void;

const listeners: ErrorListener[] = [];

export function onAppError(listener: ErrorListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify(error: AppError) {
  listeners.forEach((fn) => fn(error));
}

function classify(error: unknown, context?: string): AppError {
  const timestamp = new Date().toISOString();
  const raw = error instanceof Error ? error : new Error(String(error));
  const msg = raw.message || String(error);
  const stack = raw.stack || "";

  // Supabase / Postgres errors
  if (
    msg.includes("relation") ||
    msg.includes("column") ||
    msg.includes("violates") ||
    msg.includes("duplicate key") ||
    msg.includes("PGRST") ||
    (error as any)?.code?.startsWith?.("2") // Postgres error codes
  ) {
    return {
      prefix: "[Erro BD]",
      title: context ? `Falha ao ${context}` : "Erro de banco de dados",
      detail: msg,
      stack,
      timestamp,
    };
  }

  // HTTP / API errors
  const statusMatch = msg.match(/(\d{3})/);
  if (
    msg.toLowerCase().includes("fetch") ||
    msg.toLowerCase().includes("timeout") ||
    msg.toLowerCase().includes("network") ||
    statusMatch
  ) {
    const code = statusMatch?.[1] || "???";
    return {
      prefix: `[Erro API ${code}]`,
      title: context ? `Falha ao ${context}` : "Erro de comunicação",
      detail: msg,
      stack,
      timestamp,
    };
  }

  // Render / Interface errors
  if (
    msg.includes("render") ||
    msg.includes("React") ||
    msg.includes("component") ||
    msg.includes("Cannot read properties")
  ) {
    return {
      prefix: "[Erro Interface]",
      title: context ? `Falha ao renderizar ${context}` : "Erro de interface",
      detail: msg,
      stack,
      timestamp,
    };
  }

  // Generic
  return {
    prefix: "[Erro]",
    title: context || "Erro inesperado",
    detail: msg,
    stack,
    timestamp,
  };
}

export function captureError(error: unknown, context?: string) {
  const appError = classify(error, context);
  console.error(`${appError.prefix} ${appError.title}:`, appError.detail);
  notify(appError);
}

export function setupGlobalHandlers() {
  window.onerror = (_msg, _src, _line, _col, error) => {
    captureError(error || _msg, undefined);
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    captureError(event.reason, undefined);
  };
}
