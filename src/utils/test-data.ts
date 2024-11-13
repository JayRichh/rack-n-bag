export const testTournament = {
  id: "ttttest",
  name: "Test Tournament",
  phase: "SINGLE",
  teams: [
    { id: "team1", name: "Team 1", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "team2", name: "Team 2", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "team3", name: "Team 3", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 },
    { id: "team4", name: "Team 4", status: "ACTIVE", played: 0, won: 0, lost: 0, points: 0 }
  ],
  fixtures: [
    {
      id: "fix1",
      homeTeamId: "team1",
      awayTeamId: "team2",
      played: false,
      phase: "HOME",
      datePlayed: new Date().toISOString()
    },
    {
      id: "fix2",
      homeTeamId: "team3",
      awayTeamId: "team4",
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
