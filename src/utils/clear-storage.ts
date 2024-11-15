import { storage } from './storage';

export function clearAllStoredData(): void {
  storage.resetToDefaults();
  window.location.reload();
}

export function clearAbsolutelyAllData(): void {
  Object.keys(window.localStorage).forEach(key => {
    window.localStorage.removeItem(key);
  });
  window.location.reload();
}
