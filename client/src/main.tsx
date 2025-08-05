import { createRoot } from "react-dom/client";
import App from "./App";
import SimpleApp from "./App-simple";
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

// Use simple app for now to test premium albums
createRoot(document.getElementById("root")!).render(<SimpleApp />);
