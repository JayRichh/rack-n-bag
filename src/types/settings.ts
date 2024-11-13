export interface TournamentSettings {
  showCompleted: boolean;
  showUpcoming: boolean;
  highlightMyMatches: boolean;
  lowMotion: boolean;
}

export interface GlobalSettings {
  lowMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export type SettingsUpdatePayload = {
  lowMotion?: boolean;
  theme?: GlobalSettings['theme'];
  notifications?: boolean;
}

export const defaultTournamentSettings: TournamentSettings = {
  showCompleted: true,
  showUpcoming: true,
  highlightMyMatches: true,
  lowMotion: false
};

export const defaultGlobalSettings: GlobalSettings = {
  lowMotion: false,
  theme: 'system',
  notifications: true
};
