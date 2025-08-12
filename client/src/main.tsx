import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker مسجل بنجاح:', registration);
        
        // التحقق من التحديثات
        registration.addEventListener('updatefound', () => {
          console.log('🔄 تحديث Service Worker متاح');
        });
      })
      .catch((registrationError) => {
        console.error('❌ فشل تسجيل Service Worker:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
