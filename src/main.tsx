import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalHandlers } from "./lib/errorHandler";

// Setup global error interceptors
setupGlobalHandlers();

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
