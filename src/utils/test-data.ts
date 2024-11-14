import { Tournament } from '../types/tournament';

// 5-Player Round Robin Tournament
export const smallRoundRobin: Tournament = {
  id: "small_round_robin",
  name: "Corn Slam Mini",
  phase: "ROUND_ROBIN_SINGLE",
  teams: [
    { id: "p1", name: "John Smith", status: "ACTIVE", played: 4, wins: 3, losses: 1, points: 9 },
    { id: "p2", name: "Sarah Johnson", status: "ACTIVE", played: 4, wins: 2, losses: 2, points: 6 },
    { id: "p3", name: "Mike Davis", status: "ACTIVE", played: 4, wins: 2, losses: 2, points: 6 },
    { id: "p4", name: "Emma Wilson", status: "ACTIVE", played: 4, wins: 2, losses: 2, points: 6 },
    { id: "p5", name: "Alex Brown", status: "ACTIVE", played: 4, wins: 1, losses: 3, points: 3 }
  ],
  fixtures: [
    {
      id: "r1m1",
      homeTeamId: "p1",
      awayTeamId: "p2",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 19
    },
    {
      id: "r1m2",
      homeTeamId: "p3",
      awayTeamId: "p4",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:30:00Z",
      homeScore: 21,
      awayScore: 15
    },
    {
      id: "r2m1",
      homeTeamId: "p1",
      awayTeamId: "p3",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 21,
      awayScore: 18
    },
    {
      id: "r2m2",
      homeTeamId: "p2",
      awayTeamId: "p5",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:30:00Z",
      homeScore: 21,
      awayScore: 12
    },
    {
      id: "r3m1",
      homeTeamId: "p1",
      awayTeamId: "p4",
      played: true,
      round: 3,
      datePlayed: "2024-01-01T12:00:00Z",
      homeScore: 21,
      awayScore: 16
    },
    {
      id: "r3m2",
      homeTeamId: "p2",
      awayTeamId: "p3",
      played: true,
      round: 3,
      datePlayed: "2024-01-01T12:30:00Z",
      homeScore: 15,
      awayScore: 21
    }
  ],
  pointsConfig: {
    type: "POINTS",
    win: 3,
    loss: 0,
    draw: 1
  },
  dateCreated: "2024-01-01T09:00:00Z",
  dateModified: "2024-01-01T12:30:00Z",
  progress: {
    currentRound: 3,
    totalRounds: 5,
    phase: "ROUND_ROBIN_SINGLE",
    roundComplete: true,
    requiresNewPairings: false
  }
};

// 8-Player Swiss System Tournament
export const mediumSwiss: Tournament = {
  id: "medium_swiss",
  name: "Corn Slam Swiss Open",
  phase: "SWISS_SYSTEM",
  teams: [
    { id: "p1", name: "John Smith", status: "ACTIVE", played: 3, wins: 3, losses: 0, points: 9, buchholzScore: 15 },
    { id: "p2", name: "Sarah Johnson", status: "ACTIVE", played: 3, wins: 2, losses: 1, points: 6, buchholzScore: 12 },
    { id: "p3", name: "Mike Davis", status: "ACTIVE", played: 3, wins: 2, losses: 1, points: 6, buchholzScore: 12 },
    { id: "p4", name: "Emma Wilson", status: "ACTIVE", played: 3, wins: 2, losses: 1, points: 6, buchholzScore: 9 },
    { id: "p5", name: "Alex Brown", status: "ACTIVE", played: 3, wins: 1, losses: 2, points: 3, buchholzScore: 9 },
    { id: "p6", name: "Lisa Chen", status: "ACTIVE", played: 3, wins: 1, losses: 2, points: 3, buchholzScore: 6 },
    { id: "p7", name: "Tom White", status: "ACTIVE", played: 3, wins: 1, losses: 2, points: 3, buchholzScore: 6 },
    { id: "p8", name: "Maria Garcia", status: "ACTIVE", played: 3, wins: 0, losses: 3, points: 0, buchholzScore: 3 }
  ],
  fixtures: [
    {
      id: "r1m1",
      homeTeamId: "p1",
      awayTeamId: "p5",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 15
    },
    {
      id: "r1m2",
      homeTeamId: "p2",
      awayTeamId: "p6",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 18
    },
    {
      id: "r1m3",
      homeTeamId: "p3",
      awayTeamId: "p7",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 12
    },
    {
      id: "r1m4",
      homeTeamId: "p4",
      awayTeamId: "p8",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 10
    },
    {
      id: "r2m1",
      homeTeamId: "p1",
      awayTeamId: "p2",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 21,
      awayScore: 19
    },
    {
      id: "r2m2",
      homeTeamId: "p3",
      awayTeamId: "p4",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 21,
      awayScore: 17
    },
    {
      id: "r2m3",
      homeTeamId: "p5",
      awayTeamId: "p6",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 15,
      awayScore: 21
    },
    {
      id: "r2m4",
      homeTeamId: "p7",
      awayTeamId: "p8",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 21,
      awayScore: 14
    }
  ],
  pointsConfig: {
    type: "POINTS",
    win: 3,
    loss: 0,
    draw: 1,
    byePoints: 3
  },
  swissConfig: {
    maxRounds: 4,
    byeHandling: "RANDOM",
    tiebreakers: ["BUCHHOLZ", "HEAD_TO_HEAD", "WINS"],
    byePoints: 3
  },
  dateCreated: "2024-01-01T09:00:00Z",
  dateModified: "2024-01-01T11:00:00Z",
  progress: {
    currentRound: 2,
    totalRounds: 4,
    phase: "SWISS_SYSTEM",
    roundComplete: true,
    requiresNewPairings: true
  }
};

// 16-Player Single Elimination Tournament
export const largeSingleElim: Tournament = {
  id: "large_single_elim",
  name: "Corn Slam Championship",
  phase: "SINGLE_ELIMINATION",
  teams: [
    { id: "p1", name: "John Smith", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p2", name: "Sarah Johnson", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p3", name: "Mike Davis", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p4", name: "Emma Wilson", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p5", name: "Alex Brown", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p6", name: "Lisa Chen", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p7", name: "Tom White", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p8", name: "Maria Garcia", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p9", name: "David Lee", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p10", name: "Anna Park", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p11", name: "James Kim", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p12", name: "Lucy Wang", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p13", name: "Ryan Chen", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p14", name: "Sofia Cruz", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" },
    { id: "p15", name: "Kevin Patel", status: "ACTIVE", played: 1, wins: 1, losses: 0, points: 3, bracket: "WINNERS" },
    { id: "p16", name: "Maya Singh", status: "ELIMINATED", played: 1, wins: 0, losses: 1, points: 0, bracket: "CONSOLATION" }
  ],
  fixtures: [
    {
      id: "qf1",
      homeTeamId: "p1",
      awayTeamId: "p2",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 15,
      bracket: "WINNERS",
      significance: "Quarter Final"
    },
    {
      id: "qf2",
      homeTeamId: "p3",
      awayTeamId: "p4",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 12,
      bracket: "WINNERS",
      significance: "Quarter Final"
    },
    {
      id: "qf3",
      homeTeamId: "p5",
      awayTeamId: "p6",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 18,
      bracket: "WINNERS",
      significance: "Quarter Final"
    },
    {
      id: "qf4",
      homeTeamId: "p7",
      awayTeamId: "p8",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 16,
      bracket: "WINNERS",
      significance: "Quarter Final"
    },
    {
      id: "sf1",
      homeTeamId: "p1",
      awayTeamId: "p3",
      played: false,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      bracket: "WINNERS",
      significance: "Semi Final"
    },
    {
      id: "sf2",
      homeTeamId: "p5",
      awayTeamId: "p7",
      played: false,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      bracket: "WINNERS",
      significance: "Semi Final"
    },
    {
      id: "cqf1",
      homeTeamId: "p2",
      awayTeamId: "p4",
      played: false,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      bracket: "CONSOLATION",
      significance: "Consolation Quarter Final"
    },
    {
      id: "cqf2",
      homeTeamId: "p6",
      awayTeamId: "p8",
      played: false,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      bracket: "CONSOLATION",
      significance: "Consolation Quarter Final"
    }
  ],
  pointsConfig: {
    type: "WIN_LOSS",
    win: 1,
    loss: 0
  },
  seedMethod: "RANDOM",
  dateCreated: "2024-01-01T09:00:00Z",
  dateModified: "2024-01-01T10:00:00Z",
  progress: {
    currentRound: 2,
    totalRounds: 4,
    phase: "SINGLE_ELIMINATION",
    roundComplete: false,
    requiresNewPairings: false,
    bracketStage: "Semi Finals"
  }
};

// 2v2 Team Tournament
export const teamRoundRobin: Tournament = {
  id: "team_round_robin",
  name: "Corn Slam 2v2",
  phase: "ROUND_ROBIN_SINGLE",
  teams: [
    { id: "team1", name: "Power Duo", status: "ACTIVE", played: 3, wins: 3, losses: 0, points: 9 },
    { id: "team2", name: "Dynamic Pair", status: "ACTIVE", played: 3, wins: 2, losses: 1, points: 6 },
    { id: "team3", name: "Perfect Partners", status: "ACTIVE", played: 3, wins: 1, losses: 2, points: 3 },
    { id: "team4", name: "Dream Team", status: "ACTIVE", played: 3, wins: 0, losses: 3, points: 0 }
  ],
  fixtures: [
    {
      id: "r1m1",
      homeTeamId: "team1",
      awayTeamId: "team2",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 18
    },
    {
      id: "r1m2",
      homeTeamId: "team3",
      awayTeamId: "team4",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:30:00Z",
      homeScore: 21,
      awayScore: 15
    },
    {
      id: "r2m1",
      homeTeamId: "team1",
      awayTeamId: "team3",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      homeScore: 21,
      awayScore: 16
    },
    {
      id: "r2m2",
      homeTeamId: "team2",
      awayTeamId: "team4",
      played: true,
      round: 2,
      datePlayed: "2024-01-01T11:30:00Z",
      homeScore: 21,
      awayScore: 14
    },
    {
      id: "r3m1",
      homeTeamId: "team1",
      awayTeamId: "team4",
      played: true,
      round: 3,
      datePlayed: "2024-01-01T12:00:00Z",
      homeScore: 21,
      awayScore: 12
    },
    {
      id: "r3m2",
      homeTeamId: "team2",
      awayTeamId: "team3",
      played: true,
      round: 3,
      datePlayed: "2024-01-01T12:30:00Z",
      homeScore: 21,
      awayScore: 19
    }
  ],
  pointsConfig: {
    type: "POINTS",
    win: 3,
    loss: 0,
    draw: 1
  },
  dateCreated: "2024-01-01T09:00:00Z",
  dateModified: "2024-01-01T12:30:00Z",
  progress: {
    currentRound: 3,
    totalRounds: 3,
    phase: "ROUND_ROBIN_SINGLE",
    roundComplete: true,
    requiresNewPairings: false
  }
};

// 1v1 Best of 3 Tournament
export const oneVsOne: Tournament = {
  id: "one_vs_one",
  name: "Corn Slam 1v1",
  phase: "SINGLE_ELIMINATION",
  teams: [
    { id: "p1", name: "John Smith", status: "ACTIVE", played: 2, wins: 2, losses: 0, points: 2, bracket: "WINNERS" },
    { id: "p2", name: "Sarah Johnson", status: "ELIMINATED", played: 2, wins: 0, losses: 2, points: 0, bracket: "CONSOLATION" }
  ],
  fixtures: [
    {
      id: "m1",
      homeTeamId: "p1",
      awayTeamId: "p2",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:00:00Z",
      homeScore: 21,
      awayScore: 15,
      bracket: "WINNERS",
      significance: "Match 1"
    },
    {
      id: "m2",
      homeTeamId: "p2",
      awayTeamId: "p1",
      played: true,
      round: 1,
      datePlayed: "2024-01-01T10:30:00Z",
      homeScore: 18,
      awayScore: 21,
      bracket: "WINNERS",
      significance: "Match 2"
    },
    {
      id: "m3",
      homeTeamId: "p1",
      awayTeamId: "p2",
      played: false,
      round: 2,
      datePlayed: "2024-01-01T11:00:00Z",
      bracket: "WINNERS",
      significance: "Match 3 (if needed)"
    }
  ],
  pointsConfig: {
    type: "WIN_LOSS",
    win: 1,
    loss: 0
  },
  seedMethod: "RANDOM",
  dateCreated: "2024-01-01T09:00:00Z",
  dateModified: "2024-01-01T10:30:00Z",
  progress: {
    currentRound: 2,
    totalRounds: 2,
    phase: "SINGLE_ELIMINATION",
    roundComplete: false,
    requiresNewPairings: false,
    bracketStage: "Final Match"
  }
};

// Export all test tournaments
export const testTournaments = {
  smallRoundRobin,
  mediumSwiss,
  largeSingleElim,
  teamRoundRobin,
  oneVsOne
};

// Default test tournament for backward compatibility
export const testTournament = smallRoundRobin;
