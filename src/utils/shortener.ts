import { Tournament, Team, Fixture, ScoringType, PointsConfig } from '../types/tournament';

// Simple base64 encoding with URL-safe chars
function encode(obj: any): string {
  try {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error('Encode error:', error);
    throw new Error('Failed to encode data');
  }
}

function decode(str: string): any {
  try {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return JSON.parse(atob(str));
  } catch (error) {
    console.error('Decode error:', error);
    throw new Error('Failed to decode data');
  }
}

function compactTournament(t: Tournament): any {
  // Super compact format - single letter keys
  return {
    v: 6, // version
    i: t.id,
    n: t.name,
    p: t.phase === 'SINGLE' ? 0 : 1,
    s: t.pointsConfig.type === 'WIN_LOSS' ? [t.pointsConfig.win, t.pointsConfig.loss] :
         [t.pointsConfig.win, t.pointsConfig.loss, t.pointsConfig.draw],
    t: t.teams.map(team => [
      team.id,
      team.name,
      team.status === 'ACTIVE' ? 1 : 0,
      team.played,
      team.won
    ]),
    f: t.fixtures.map(fix => {
      const base = [
        fix.id,
        fix.homeTeamId,
        fix.awayTeamId,
        fix.played ? 1 : 0,
        fix.phase === 'HOME' ? 0 : 1
      ];
      if (t.pointsConfig.type === 'POINTS') {
        return [...base, fix.homeScore, fix.awayScore];
      }
      return [...base, fix.winner];
    })
  };
}

function expandTournament(c: any): Tournament {
  if (!c || typeof c !== 'object' || c.v !== 6) {
    throw new Error('Invalid tournament data');
  }

  const now = new Date().toISOString();
  const isPoints = c.s.length > 2;
  
  const pointsConfig: PointsConfig = isPoints ? {
    type: 'POINTS',
    win: c.s[0],
    loss: c.s[1],
    draw: c.s[2]
  } : {
    type: 'WIN_LOSS',
    win: c.s[0],
    loss: c.s[1]
  };

  const teams: Team[] = c.t.map((t: any) => ({
    id: t[0],
    name: t[1],
    status: t[2] === 1 ? 'ACTIVE' : 'WITHDRAWN',
    played: t[3],
    won: t[4],
    lost: t[3] - t[4],
    points: calculatePoints(t[4], t[3], pointsConfig)
  }));

  const fixtures: Fixture[] = c.f.map((f: any) => {
    const base = {
      id: f[0],
      homeTeamId: f[1],
      awayTeamId: f[2],
      played: f[3] === 1,
      phase: f[4] === 0 ? 'HOME' : 'AWAY',
      datePlayed: now,
      date: now
    };

    if (isPoints) {
      return {
        ...base,
        homeScore: f[5],
        awayScore: f[6]
      };
    }
    return {
      ...base,
      winner: f[5]
    };
  });

  return {
    id: c.i,
    name: c.n,
    phase: c.p === 0 ? 'SINGLE' : 'HOME_AND_AWAY',
    pointsConfig,
    teams,
    fixtures,
    dateCreated: now,
    dateModified: now
  };
}

function calculatePoints(wins: number, played: number, config: PointsConfig): number {
  const losses = played - wins;
  
  if (config.type === 'WIN_LOSS') {
    return wins * config.win + losses * config.loss;
  }
  
  const draws = config.draw !== undefined ? 
    played - wins - losses : 0;
  
  return wins * config.win + 
         losses * config.loss + 
         (config.draw ? draws * config.draw : 0);
}

export function encodeTournament(tournament: Tournament): string {
  try {
    const compact = compactTournament(tournament);
    return encode(compact);
  } catch (error) {
    console.error('Tournament encode error:', error);
    throw new Error('Failed to encode tournament data');
  }
}

export function decodeTournament(code: string): Tournament {
  try {
    const data = decode(code);
    return expandTournament(data);
  } catch (error) {
    console.error('Tournament decode error:', error);
    throw new Error('Failed to decode tournament data');
  }
}
