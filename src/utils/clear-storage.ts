import { storage } from './storage';

export function clearAllStoredData(): void {
  storage.resetToDefaults();
  window.location.reload();
}
