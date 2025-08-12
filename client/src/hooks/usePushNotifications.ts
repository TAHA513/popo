import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // This should come from environment variables

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    subscription: null,
  });

  useEffect(() => {
    checkNotificationSupport();
    checkExistingSubscription();
  }, []);

  const checkNotificationSupport = () => {
    const isSupported = 
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setState(prev => ({
      ...prev,
      permission: Notification.permission,
      isSupported,
    }));
  };

  const checkExistingSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
      }));
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    if (state.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    const hasPermission = await requestPermission();
    if (!hasPermission) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key
      const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [state.isSupported, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return false;

    try {
      const success = await state.subscription.unsubscribe();
      
      if (success) {
        // Remove subscription from server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: state.subscription.endpoint,
          }),
        });

        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null,
        }));
      }

      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }, [state.subscription]);

  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      console.warn('Not subscribed to push notifications');
      return;
    }

    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [state.isSubscribed]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    canSubscribe: state.isSupported && state.permission === 'granted' && !state.isSubscribed,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}