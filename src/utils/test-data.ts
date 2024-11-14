export const testTournament = {
  id: "ttttest",
  name: "Test Tournament",
  phase: "SINGLE",
  teams: [
    { id: "player1", name: "John Smith", status: "ACTIVE", played: 1, won: 1, lost: 0, points: 1 },
    { id: "player2", name: "Sarah Johnson", status: "ACTIVE", played: 1, won: 0, lost: 1, points: 0 },
    { id: "player3", name: "Mike Davis", status: "ACTIVE", played: 1, won: 0, lost: 1, points: 0 },
    { id: "player4", name: "Emma Wilson", status: "ACTIVE", played: 1, won: 1, lost: 0, points: 1 }
  ],
  fixtures: [
    {
      id: "fix1",
      homeTeamId: "player1",
      awayTeamId: "player2",
      played: true,
      phase: "HOME",
      datePlayed: new Date().toISOString(),
      winner: "player1"  // For WIN_LOSS type
    },
    {
      id: "fix2",
      homeTeamId: "player3",
      awayTeamId: "player4",
      played: true,
      phase: "HOME",
      datePlayed: new Date().toISOString(),
      winner: "player4"  // For WIN_LOSS type
    },
    {
      id: "fix3",
      homeTeamId: "player1",
      awayTeamId: "player3",
      played: false,
      phase: "HOME",
      datePlayed: new Date().toISOString()
    },
    {
      id: "fix4",
      homeTeamId: "player2",
      awayTeamId: "player4",
      played: false,
      phase: "HOME",
      datePlayed: new Date().toISOString()
    }
  ],
  pointsConfig: {
    type: "WIN_LOSS",
    win: 1,
    loss: 0
  },
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString()
};
