import { useState, useEffect, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import { onAppError, type AppError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";

export function ErrorToast() {
  const [errors, setErrors] = useState<(AppError & { id: number })[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    let counter = 0;
    return onAppError((error) => {
      const id = ++counter;
      setErrors((prev) => [...prev.slice(-4), { ...error, id }]);

      // Auto-dismiss after 15s
      setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== id));
      }, 15000);
    });
  }, []);

  const dismiss = useCallback((id: number) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const copyLog = useCallback(async (error: AppError & { id: number }) => {
    const log = `${error.prefix} ${error.title}\n${error.detail}\n\nTimestamp: ${error.timestamp}\n\nStack:\n${error.stack || "N/A"}`;
    await navigator.clipboard.writeText(log);
    setCopied(error.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className="rounded-lg border border-destructive/30 bg-card p-3 shadow-xl animate-in slide-in-from-right-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-destructive">
                {error.prefix}
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {error.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-all">
                {error.detail}
              </p>
            </div>
            <button
              onClick={() => dismiss(error.id)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs gap-1"
              onClick={() => copyLog(error)}
            >
              {copied === error.id ? (
                <><Check className="h-3 w-3" /> Copiado</>
              ) : (
                <><Copy className="h-3 w-3" /> Copiar Log</>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
