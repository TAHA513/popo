import { useState, useEffect, useCallback } from 'react';

interface SyncItem {
  id: string;
  type: 'message' | 'notification' | 'media';
  data: any;
  timestamp: number;
  retries: number;
}

export function useBackgroundSync() {
  const [pendingSync, setPendingSync] = useState<SyncItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending sync items from localStorage
    loadPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      processPendingSync();
    }
  }, [isOnline, pendingSync]);

  const loadPendingSync = () => {
    try {
      const saved = localStorage.getItem('laabolive-pending-sync');
      if (saved) {
        setPendingSync(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load pending sync items:', error);
    }
  };

  const savePendingSync = (items: SyncItem[]) => {
    try {
      localStorage.setItem('laabolive-pending-sync', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save pending sync items:', error);
    }
  };

  const addToSync = useCallback((type: SyncItem['type'], data: any) => {
    const syncItem: SyncItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    setPendingSync(prev => {
      const updated = [...prev, syncItem];
      savePendingSync(updated);
      return updated;
    });

    // Try to register background sync if available
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        (registration as any).sync.register(`background-sync-${type}`);
      }).catch(error => {
        console.log('Background sync registration failed:', error);
      });
    }

    return syncItem.id;
  }, []);

  const processPendingSync = async () => {
    if (!isOnline || pendingSync.length === 0) return;

    const itemsToProcess = [...pendingSync];
    const failedItems: SyncItem[] = [];

    for (const item of itemsToProcess) {
      try {
        const success = await syncItem(item);
        if (!success) {
          if (item.retries < 3) {
            failedItems.push({ ...item, retries: item.retries + 1 });
          }
        }
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        if (item.retries < 3) {
          failedItems.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    setPendingSync(failedItems);
    savePendingSync(failedItems);
  };

  const syncItem = async (item: SyncItem): Promise<boolean> => {
    switch (item.type) {
      case 'message':
        return await syncMessage(item.data);
      case 'notification':
        return await syncNotification(item.data);
      case 'media':
        return await syncMedia(item.data);
      default:
        return false;
    }
  };

  const syncMessage = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const syncNotification = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const syncMedia = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data, // FormData
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const removeFromSync = useCallback((id: string) => {
    setPendingSync(prev => {
      const updated = prev.filter(item => item.id !== id);
      savePendingSync(updated);
      return updated;
    });
  }, []);

  const clearAllSync = useCallback(() => {
    setPendingSync([]);
    localStorage.removeItem('laabolive-pending-sync');
  }, []);

  return {
    pendingSync,
    isOnline,
    addToSync,
    removeFromSync,
    clearAllSync,
    hasPendingItems: pendingSync.length > 0
  };
}