
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { 
      scope: '/',
      updateViaCache: 'none' // تجنب مشاكل الكاش
    })
      .then((registration) => {
        console.log('✅ Service Worker مسجل بنجاح:', registration.scope);
        
        // التحقق من التحديثات كل 30 ثانية
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // التعامل مع التحديثات
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('🔄 تحديث Service Worker متاح');
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 إصدار جديد متاح، سيتم التحديث تلقائياً');
                // إشعار المستخدم أو تحديث تلقائي
                if (confirm('يتوفر تحديث جديد للتطبيق. هل تريد إعادة التحميل؟')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.error('❌ فشل تسجيل Service Worker:', registrationError);
      });
    
    // الاستماع لرسائل Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('📱 Service Worker تم تحديثه');
      }
    });
    
    // فحص حالة الـ PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 التطبيق يعمل في وضع PWA');
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
