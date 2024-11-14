import { testTournament } from './test-data';

export function clearAllStoredData() {
  if (typeof window === 'undefined') return;

  try {
    // Clear main data stores
    localStorage.removeItem('tournaments');
    localStorage.removeItem('settings');
    localStorage.removeItem('current-theme');

    // Clear all tournament-specific data
    const keysToRemove: string[] = [];
    
    // Collect all keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('participant_team_') || 
        key.startsWith('tournament_settings_')
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove collected keys
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Immediately load test data
    localStorage.setItem('tournaments', JSON.stringify([testTournament]));
    localStorage.setItem('settings', JSON.stringify({
      lowMotion: false,
      theme: 'system',
      notifications: true
    }));

    console.log('All stored data cleared and test data loaded successfully');
  } catch (error) {
    console.error('Failed to clear stored data:', error);
  }
}
