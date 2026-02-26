import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_AVAILABLE") {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 bg-primary px-4 py-2 text-primary-foreground text-sm shadow-lg">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span>Nova versão disponível.</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs"
        onClick={() => window.location.reload()}
      >
        Atualizar Agora
      </Button>
    </div>
  );
}
