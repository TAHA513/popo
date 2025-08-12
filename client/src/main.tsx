import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA with detailed logging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ LaaBoBo PWA Service Worker registered successfully:', registration);
      
      // Check PWA installability
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('✅ PWA is installable - beforeinstallprompt fired');
        e.preventDefault();
        // Store the event for later use
        (window as any).deferredPrompt = e;
      });
      
      // Check if already installed
      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA was installed successfully');
      });
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
} else {
  console.warn('⚠️ Service Worker not supported in this browser');
}

createRoot(document.getElementById("root")!).render(<App />);
