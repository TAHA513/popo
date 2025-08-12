import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enhanced PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('SW registered: ', registration);
      console.log('تم تحميل جميع الخطوط بنجاح');
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('New PWA content available');
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });
      
      // Check for waiting service worker
      if (registration.waiting) {
        console.log('New PWA content available');
        window.dispatchEvent(new CustomEvent('sw-update-available'));
      }
      
      // Periodic sync registration (if supported)
      if ('periodicSync' in registration) {
        try {
          await (registration as any).periodicSync.register('background-sync', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log('Periodic background sync registered');
        } catch (error) {
          console.log('Periodic background sync not available:', error);
        }
      }
      
    } catch (registrationError) {
      console.warn('SW registration failed (continuing without): ', registrationError);
    }
  });
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('Cache updated:', event.data.payload);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
