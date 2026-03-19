import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global unhandled error/rejection handlers for resilience
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Unhandled Promise Rejection]", event.reason);
  // Prevent the browser from showing an error in some cases
  // but don't swallow it — just log
});

window.addEventListener("error", (event) => {
  console.error("[Unhandled Error]", event.error || event.message);
});

createRoot(document.getElementById("root")!).render(<App />);
