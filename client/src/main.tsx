import { createRoot } from "react-dom/client";
import App from "./App";
import TestApp from "./App-test";
import "./index.css";

// Register service worker for PWA - silent mode
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.warn('SW registration failed (continuing without): ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<TestApp />);
