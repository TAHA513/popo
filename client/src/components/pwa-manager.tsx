import { PWAInstallPrompt } from './pwa-install-prompt';
import { OfflineIndicator } from './offline-indicator';
import { PWAUpdatePrompt } from './pwa-update-prompt';

export function PWAManager() {
  return (
    <>
      <PWAInstallPrompt />
      <OfflineIndicator />
      <PWAUpdatePrompt />
    </>
  );
}