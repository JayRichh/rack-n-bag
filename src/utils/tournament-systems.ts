'use client';

import { 
  Tournament, 
  Team, 
  Fixture, 
  TournamentPhase,
  SwissRound,
  BracketPosition,
  SwissSystemConfig
} from '../types/tournament';

const generateFixtureId = () => Math.random().toString(36).substr(2, 9);

export const generateRoundRobinFixtures = (teams: Team[]): Fixture[] => {
  const fixtures: Fixture[] = [];
  const n = teams.length;
  const actualTeams = n % 2 === 0 ? teams : [...teams, { id: 'BYE', name: 'BYE' } as Team];
  const rounds = actualTeams.length - 1;
  const halfSize = actualTeams.length / 2;
  const teamIds = actualTeams.map(team => team.id);
  
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teamIds[i];
      const away = teamIds[teamIds.length - 1 - i];
      
      if (home !== 'BYE' && away !== 'BYE') {
        fixtures.push({
          id: generateFixtureId(),
          homeTeamId: home,
          awayTeamId: away,
          round: round + 1,
          played: false,
          datePlayed: new Date().toISOString()
        });
      }
    }
    teamIds.splice(1, 0, teamIds.pop()!);
  }
  
  return fixtures;
};

export const generateSwissPairings = (
  teams: Team[], 
  round: number, 
  previousFixtures: Fixture[],
  config: SwissSystemConfig
): Fixture[] => {
  const sortedTeams = [...teams]
    .filter(team => team.status === 'ACTIVE')
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.buchholzScore !== a.buchholzScore) return b.buchholzScore! - a.buchholzScore!;
      return b.wins - a.wins;
    });

  const fixtures: Fixture[] = [];
  const paired = new Set<string>();

  for (let i = 0; i < sortedTeams.length; i++) {
    if (paired.has(sortedTeams[i].id)) continue;

    let pairedOpponent = false;
    for (let j = i + 1; j < sortedTeams.length; j++) {
      if (paired.has(sortedTeams[j].id)) continue;

      const hasPlayed = previousFixtures.some(
        f => (f.homeTeamId === sortedTeams[i].id && f.awayTeamId === sortedTeams[j].id) ||
             (f.homeTeamId === sortedTeams[j].id && f.awayTeamId === sortedTeams[i].id)
      );

      if (!hasPlayed) {
        fixtures.push({
          id: generateFixtureId(),
          homeTeamId: sortedTeams[i].id,
          awayTeamId: sortedTeams[j].id,
          round,
          played: false,
          datePlayed: new Date().toISOString()
        });
        
        paired.add(sortedTeams[i].id);
        paired.add(sortedTeams[j].id);
        pairedOpponent = true;
        break;
      }
    }

    if (!pairedOpponent && !paired.has(sortedTeams[i].id)) {
      const team = teams.find(t => t.id === sortedTeams[i].id);
      if (team) {
        team.points += config.byePoints;
        paired.add(team.id);
      }
    }
  }

  return fixtures;
};

export const generateEliminationBracket = (teams: Team[], round: number = 1, totalRounds: number): Fixture[] => {
  const fixtures: Fixture[] = [];
  const matchCount = Math.floor(teams.length / 2);
  
  const getBracketStage = (currentRound: number, totalRounds: number): string => {
    if (currentRound === totalRounds) return 'Final';
    if (currentRound === totalRounds - 1) return 'Semi Final';
    if (currentRound === totalRounds - 2) return 'Quarter Final';
    return `Round ${currentRound}`;
  };

  for (let i = 0; i < matchCount; i++) {
    fixtures.push({
      id: generateFixtureId(),
      homeTeamId: teams[i * 2].id,
      awayTeamId: teams[i * 2 + 1].id,
      round,
      played: false,
      datePlayed: new Date().toISOString(),
      bracket: 'WINNERS',
      significance: getBracketStage(round, totalRounds)
    });
  }

  return fixtures;
};

export const generateConsolationBracket = (teams: Team[], round: number, totalRounds: number): Fixture[] => {
  return generateEliminationBracket(teams, round, totalRounds)
    .map(fixture => ({
      ...fixture,
      bracket: 'CONSOLATION' as BracketPosition,
      significance: `Consolation ${fixture.significance}`
    }));
};

export const moveToConsolationBracket = (tournament: Tournament, losingTeamId: string): void => {
  const team = tournament.teams.find(t => t.id === losingTeamId);
  if (team) {
    team.bracket = 'CONSOLATION';
    team.status = 'ELIMINATED';
  }
};

export const calculateBuchholzScore = (team: Team, allTeams: Team[], fixtures: Fixture[]): number => {
  const opponents = fixtures
    .filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id))
    .map(f => f.homeTeamId === team.id ? f.awayTeamId : f.homeTeamId);

  return opponents.reduce((score, oppId) => {
    const opponent = allTeams.find(t => t.id === oppId);
    return score + (opponent?.points || 0);
  }, 0);
};

export const updateTournamentProgress = (tournament: Tournament): void => {
  const { fixtures, phase, teams } = tournament;
  const currentRound = Math.max(...fixtures.map(f => f.round));
  const roundFixtures = fixtures.filter(f => f.round === currentRound);
  const roundComplete = roundFixtures.every(f => f.played);

  let totalRounds: number;
  let bracketStage: string | undefined;

  switch (phase) {
    case 'ROUND_ROBIN_SINGLE':
      totalRounds = teams.length - 1;
      break;
    case 'SWISS_SYSTEM':
      totalRounds = tournament.swissConfig?.maxRounds || Math.ceil(Math.log2(teams.length));
      break;
    case 'SINGLE_ELIMINATION':
      totalRounds = Math.ceil(Math.log2(teams.length));
      const currentFixture = roundFixtures[0];
      bracketStage = currentFixture?.significance;
      break;
    default:
      totalRounds = 0;
  }

  tournament.progress = {
    currentRound,
    totalRounds,
    phase,
    roundComplete,
    requiresNewPairings: roundComplete && phase === 'SWISS_SYSTEM',
    bracketStage
  };
};

export const determineWinner = (tournament: Tournament): Team | null => {
  const { teams, phase, fixtures } = tournament;
  
  switch (phase) {
    case 'ROUND_ROBIN_SINGLE':
      return [...teams]
        .sort((a, b) => b.points - a.points || b.wins - a.wins)
        [0] || null;

    case 'SWISS_SYSTEM':
      return [...teams]
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const tiebreakers = tournament.swissConfig?.tiebreakers || ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'];
          
          for (const tiebreaker of tiebreakers) {
            switch (tiebreaker) {
              case 'BUCHHOLZ':
                const aBuchholz = calculateBuchholzScore(a, teams, fixtures);
                const bBuchholz = calculateBuchholzScore(b, teams, fixtures);
                if (bBuchholz !== aBuchholz) return bBuchholz - aBuchholz;
                break;
              case 'HEAD_TO_HEAD':
                const headToHead = fixtures.find(
                  f => f.played && 
                  ((f.homeTeamId === a.id && f.awayTeamId === b.id) ||
                   (f.homeTeamId === b.id && f.awayTeamId === a.id))
                );
                if (headToHead) {
                  return headToHead.winner === b.id ? 1 : -1;
                }
                break;
              case 'WINS':
                if (b.wins !== a.wins) return b.wins - a.wins;
                break;
            }
          }
          return 0;
        })[0] || null;

    case 'SINGLE_ELIMINATION':
      const finalFixture = fixtures.find(
        f => f.significance === 'Final' && f.bracket === 'WINNERS' && f.played
      );
      return finalFixture ? teams.find(t => t.id === finalFixture.winner) || null : null;

    default:
      return null;
  }
};

export const advanceToNextRound = (tournament: Tournament): void => {
  const { phase, teams, fixtures } = tournament;
  
  switch (phase) {
    case 'SWISS_SYSTEM':
      if (tournament.progress.roundComplete) {
        teams.forEach(team => {
          team.buchholzScore = calculateBuchholzScore(team, teams, fixtures);
        });
        
        const newFixtures = generateSwissPairings(
          teams,
          tournament.progress.currentRound + 1,
          fixtures,
          tournament.swissConfig!
        );
        tournament.fixtures.push(...newFixtures);
      }
      break;

    case 'SINGLE_ELIMINATION':
      if (tournament.progress.roundComplete) {
        const roundFixtures = fixtures.filter(
          f => f.round === tournament.progress.currentRound
        );
        
        roundFixtures.forEach(fixture => {
          if (fixture.played && fixture.winner) {
            const loserId = fixture.winner === fixture.homeTeamId 
              ? fixture.awayTeamId 
              : fixture.homeTeamId;
            if (fixture.bracket === 'WINNERS') {
              moveToConsolationBracket(tournament, loserId);
            }
          }
        });
        
        const nextRound = tournament.progress.currentRound + 1;
        const totalRounds = Math.ceil(Math.log2(teams.length));
        
        const remainingWinners = teams.filter(t => t.bracket === 'WINNERS' && t.status === 'ACTIVE');
        const consolationTeams = teams.filter(t => t.bracket === 'CONSOLATION' && t.status === 'ACTIVE');
        
        if (remainingWinners.length > 1) {
          const newWinnerFixtures = generateEliminationBracket(remainingWinners, nextRound, totalRounds);
          tournament.fixtures.push(...newWinnerFixtures);
        }
        
        if (consolationTeams.length > 1) {
          const newConsolationFixtures = generateConsolationBracket(consolationTeams, nextRound, totalRounds);
          tournament.fixtures.push(...newConsolationFixtures);
        }
      }
      break;
  }
  
  updateTournamentProgress(tournament);
};

export const initializeTournament = (
  name: string,
  teams: Team[],
  phase: TournamentPhase,
  config?: {
    swissConfig?: SwissSystemConfig;
    seedMethod?: 'RANDOM' | 'MANUAL' | 'RANKING';
  }
): Tournament => {
  let fixtures: Fixture[] = [];
  const totalRounds = Math.ceil(Math.log2(teams.length));
  
  switch (phase) {
    case 'ROUND_ROBIN_SINGLE':
      fixtures = generateRoundRobinFixtures(teams);
      break;
    case 'SWISS_SYSTEM':
      const defaultSwissConfig: SwissSystemConfig = {
        maxRounds: Math.ceil(Math.log2(teams.length)),
        byeHandling: 'RANDOM',
        tiebreakers: ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
        byePoints: 3
      };
      fixtures = generateSwissPairings(teams, 1, [], config?.swissConfig || defaultSwissConfig);
      break;
    case 'SINGLE_ELIMINATION':
      fixtures = generateEliminationBracket(teams, 1, totalRounds);
      teams.forEach(team => {
        team.bracket = 'WINNERS';
        team.status = 'ACTIVE';
      });
      break;
  }

  const tournament: Tournament = {
    id: generateFixtureId(),
    name,
    phase,
    teams,
    fixtures,
    pointsConfig: {
      type: 'POINTS',
      win: 3,
      loss: 0,
      draw: 1,
      byePoints: 3
    },
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    progress: {
      currentRound: 1,
      totalRounds: 0,
      phase,
      roundComplete: false,
      requiresNewPairings: false
    },
    ...config
  };

  updateTournamentProgress(tournament);
  return tournament;
};
