import { createRoot } from "react-dom/client";
import App from "./App";
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

// Global error handler to suppress known WebSocket connection issues from external libraries
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const filename = event.filename || '';
  
  // Suppress known external WebSocket errors that don't affect functionality
  if (
    message.includes('Failed to construct \'WebSocket\'') ||
    message.includes('WebSocket connection') ||
    (message.includes('localhost:undefined') && filename.includes('client')) ||
    message.includes('Unexpected response code: 400')
  ) {
    console.warn('Suppressed external WebSocket error (app continues normally):', message);
    event.preventDefault();
    return false;
  }
});

// Also handle unhandled promise rejections from WebSocket connections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason || '';
  
  if (
    typeof reason === 'string' && (
      reason.includes('WebSocket') ||
      reason.includes('wss://') ||
      reason.includes('localhost:undefined')
    )
  ) {
    console.warn('Suppressed WebSocket promise rejection (app continues normally):', reason);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
