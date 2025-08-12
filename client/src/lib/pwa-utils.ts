// PWA Utility functions for LaaBoBo

export interface PWAInfo {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  installPrompt?: BeforeInstallPromptEvent;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Check if app is running in standalone mode (installed as PWA)
export function isAppInstalled(): boolean {
  // Check different methods for different platforms
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  const isInWebAppChrome = document.referrer.includes('android-app://');
  
  return isInStandaloneMode || isInWebAppiOS || isInWebAppChrome;
}

// Check if browser supports PWA installation
export function canInstallPWA(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window &&
         'caches' in window;
}

// Get PWA capabilities info
export function getPWACapabilities() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window && 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype,
    caching: 'caches' in window,
    offlineCapable: 'serviceWorker' in navigator && 'caches' in window,
    installable: canInstallPWA(),
    installed: isAppInstalled(),
  };
}

// Cache management utilities
export class PWACacheManager {
  static async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;
    
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const clone = response.clone();
            const blob = await clone.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
  
  static async clearOldCaches(): Promise<void> {
    if (!('caches' in window)) return;
    
    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => !name.includes('v2.0'));
      
      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );
      
      console.log(`Cleared ${oldCaches.length} old caches`);
    } catch (error) {
      console.error('Error clearing old caches:', error);
    }
  }
  
  static async getCacheStats() {
    if (!('caches' in window)) return null;
    
    try {
      const cacheNames = await caches.keys();
      const stats = {
        totalCaches: cacheNames.length,
        cacheSize: await this.getCacheSize(),
        cacheNames: cacheNames,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

// Network status utilities
export class NetworkManager {
  private static listeners: ((isOnline: boolean) => void)[] = [];
  
  static isOnline(): boolean {
    return navigator.onLine;
  }
  
  static addNetworkListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  static async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Performance utilities for PWA
export class PWAPerformance {
  static measurePageLoad() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
      };
    }
    return null;
  }
  
  private static getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  
  private static getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }
  
  static logPerformanceMetrics() {
    const metrics = this.measurePageLoad();
    if (metrics) {
      console.log('📊 PWA Performance Metrics:', {
        'DOM Content Loaded': `${metrics.domContentLoaded}ms`,
        'Page Load Complete': `${metrics.load}ms`,
        'DOM Complete': `${metrics.domComplete}ms`,
        'First Paint': metrics.firstPaint ? `${metrics.firstPaint}ms` : 'N/A',
        'First Contentful Paint': metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint}ms` : 'N/A',
      });
    }
  }
}

// App state management for PWA
export class PWAStateManager {
  private static readonly STORAGE_KEY = 'laabolive-pwa-state';
  
  static saveState(key: string, value: any): void {
    try {
      const state = this.getState();
      state[key] = value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving PWA state:', error);
    }
  }
  
  static getState(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting PWA state:', error);
      return {};
    }
  }
  
  static clearState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static getInstallPromptState() {
    const state = this.getState();
    return {
      dismissed: state.installPromptDismissed || false,
      lastShown: state.installPromptLastShown || 0,
      remindLater: state.installPromptRemindLater || 0,
    };
  }
  
  static setInstallPromptDismissed(dismissed: boolean): void {
    this.saveState('installPromptDismissed', dismissed);
  }
  
  static setInstallPromptRemindLater(): void {
    this.saveState('installPromptRemindLater', Date.now());
  }
}