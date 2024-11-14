export interface TournamentSettings {
  // Display preferences
  showCompleted: boolean;
  showUpcoming: boolean;
  highlightMyMatches: boolean;
  lowMotion: boolean;

  // Round Robin preferences
  showRoundNumbers: boolean;

  // Swiss System preferences
  showBuchholzScores: boolean;
  autoAdvanceRounds: boolean;
  showPairings: boolean;

  // Single Elimination preferences
  showConsolationBracket: boolean;
  showBracketPreview: boolean;
  showSeeds: boolean;

  // Format-specific preferences
  showDraws: boolean;
  showPoints: boolean;
  showForm: boolean;
  showStreak: boolean;
}

export const defaultTournamentSettings: TournamentSettings = {
  // Display preferences
  showCompleted: true,
  showUpcoming: true,
  highlightMyMatches: true,
  lowMotion: false,

  // Round Robin preferences
  showRoundNumbers: true,

  // Swiss System preferences
  showBuchholzScores: true,
  autoAdvanceRounds: true,
  showPairings: true,

  // Single Elimination preferences
  showConsolationBracket: true,
  showBracketPreview: true,
  showSeeds: true,

  // Format-specific preferences
  showDraws: true,
  showPoints: true,
  showForm: true,
  showStreak: true
};

export interface GlobalSettings {
  theme: 'light' | 'dark' | 'system';
  lowMotion: boolean;
}

export const defaultGlobalSettings: GlobalSettings = {
  theme: 'system',
  lowMotion: false
};
