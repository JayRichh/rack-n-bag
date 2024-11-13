export const testTournament = {
  id: "ttttest",
  name: "Test Tournament",
  phase: "SINGLE",
  teams: [
    { id: "player1", name: "John Smith", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "player2", name: "Sarah Johnson", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "player3", name: "Mike Davis", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "player4", name: "Emma Wilson", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 }
  ],
  fixtures: [
    {
      id: "fix1",
      homeTeamId: "player1",
      awayTeamId: "player2",
      played: false,
      phase: "HOME",
      datePlayed: new Date().toISOString()
    },
    {
      id: "fix2",
      homeTeamId: "player3",
      awayTeamId: "player4",
      played: false,
      phase: "HOME",
      datePlayed: new Date().toISOString()
    }
  ],
  pointsConfig: {
    win: 3,
    loss: 0,
    draw: 1
  },
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString()
};
