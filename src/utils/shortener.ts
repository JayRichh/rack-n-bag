import { Tournament, Team, Fixture, ScoringType, PointsConfig, TournamentPhase, SwissSystemConfig, BracketPosition } from '../types/tournament';
import { compressNumber, decompressNumber, compressString, decompressString, compressArray, decompressArray } from './hash';

const CURRENT_VERSION = 7;
type SeedMethod = 'RANDOM' | 'MANUAL' | 'RANKING';

function validateSeedMethod(method: string | undefined): SeedMethod | undefined {
  if (!method) return undefined;
  return ['RANDOM', 'MANUAL', 'RANKING'].includes(method) ? method as SeedMethod : undefined;
}

function compressTeam(team: Team): string {
  return [
    compressString(team.id),
    compressString(team.name),
    team.status === 'ACTIVE' ? '1' : '0',
    compressNumber(team.played),
    compressNumber(team.wins),
    compressNumber(team.losses),
    compressNumber(team.points),
    team.buchholzScore ? compressNumber(team.buchholzScore) : '',
    team.bracket || '',
    team.seed ? compressNumber(team.seed) : ''
  ].join(',');
}

function decompressTeam(s: string): Team {
  const [id, name, status, played, wins, losses, points, buchholz, bracket, seed] = s.split(',');
  return {
    id: decompressString(id),
    name: decompressString(name),
    status: status === '1' ? 'ACTIVE' : 'ELIMINATED',
    played: decompressNumber(played),
    wins: decompressNumber(wins),
    losses: decompressNumber(losses),
    points: decompressNumber(points),
    ...(buchholz && { buchholzScore: decompressNumber(buchholz) }),
    ...(bracket && { bracket: bracket as BracketPosition }),
    ...(seed && { seed: decompressNumber(seed) })
  };
}

function compressFixture(fixture: Fixture): string {
  return [
    compressString(fixture.id),
    compressString(fixture.homeTeamId),
    compressString(fixture.awayTeamId),
    fixture.played ? '1' : '0',
    compressNumber(fixture.round),
    compressString(fixture.datePlayed),
    fixture.homeScore !== undefined ? compressNumber(fixture.homeScore) : '',
    fixture.awayScore !== undefined ? compressNumber(fixture.awayScore) : '',
    fixture.winner || '',
    fixture.bracket || '',
    fixture.significance || ''
  ].join(',');
}

function decompressFixture(s: string): Fixture {
  const [id, homeId, awayId, played, round, date, homeScore, awayScore, winner, bracket, significance] = s.split(',');
  return {
    id: decompressString(id),
    homeTeamId: decompressString(homeId),
    awayTeamId: decompressString(awayId),
    played: played === '1',
    round: decompressNumber(round),
    datePlayed: decompressString(date),
    ...(homeScore && { homeScore: decompressNumber(homeScore) }),
    ...(awayScore && { awayScore: decompressNumber(awayScore) }),
    ...(winner && { winner }),
    ...(bracket && { bracket: bracket as BracketPosition }),
    ...(significance && { significance })
  };
}

function compressPointsConfig(config: PointsConfig): string {
  return [
    config.type,
    compressNumber(config.win),
    compressNumber(config.loss),
    config.draw !== undefined ? compressNumber(config.draw) : '',
    config.byePoints !== undefined ? compressNumber(config.byePoints) : ''
  ].join(',');
}

function decompressPointsConfig(s: string): PointsConfig {
  const [type, win, loss, draw, byePoints] = s.split(',');
  return {
    type: type as ScoringType,
    win: decompressNumber(win),
    loss: decompressNumber(loss),
    ...(draw && { draw: decompressNumber(draw) }),
    ...(byePoints && { byePoints: decompressNumber(byePoints) })
  };
}

function compressSwissConfig(config: SwissSystemConfig): string {
  return [
    compressNumber(config.maxRounds),
    config.byeHandling,
    config.tiebreakers.join('|'),
    compressNumber(config.byePoints)
  ].join(',');
}

function decompressSwissConfig(s: string): SwissSystemConfig {
  const [maxRounds, byeHandling, tiebreakers, byePoints] = s.split(',');
  return {
    maxRounds: decompressNumber(maxRounds),
    byeHandling: byeHandling as 'RANDOM' | 'LOWEST_RANKED',
    tiebreakers: tiebreakers.split('|') as SwissSystemConfig['tiebreakers'],
    byePoints: decompressNumber(byePoints)
  };
}

function compressProgress(tournament: Tournament): string {
  return [
    compressNumber(tournament.progress.currentRound),
    compressNumber(tournament.progress.totalRounds),
    tournament.progress.phase,
    tournament.progress.roundComplete ? '1' : '0',
    tournament.progress.requiresNewPairings ? '1' : '0',
    tournament.progress.bracketStage || ''
  ].join(',');
}

function decompressProgress(s: string, phase: TournamentPhase): Tournament['progress'] {
  const [current, total, progressPhase, complete, newPairings, bracketStage] = s.split(',');
  return {
    currentRound: decompressNumber(current),
    totalRounds: decompressNumber(total),
    phase,
    roundComplete: complete === '1',
    requiresNewPairings: newPairings === '1',
    ...(bracketStage && { bracketStage })
  };
}

function compressTournament(tournament: Tournament): string {
  return [
    CURRENT_VERSION,
    compressString(tournament.id),
    compressString(tournament.name),
    tournament.phase,
    compressPointsConfig(tournament.pointsConfig),
    compressArray(tournament.teams, compressTeam),
    compressArray(tournament.fixtures, compressFixture),
    compressString(tournament.dateCreated),
    compressString(tournament.dateModified),
    compressProgress(tournament),
    tournament.swissConfig ? compressSwissConfig(tournament.swissConfig) : '',
    tournament.seedMethod || ''
  ].join('|');
}

function decompressTournament(s: string): Tournament {
  const [
    version,
    id,
    name,
    phase,
    pointsConfig,
    teams,
    fixtures,
    created,
    modified,
    progress,
    swissConfig,
    seedMethod
  ] = s.split('|');

  if (decompressNumber(version) !== CURRENT_VERSION) {
    throw new Error('Incompatible tournament version');
  }

  const validatedSeedMethod = validateSeedMethod(seedMethod);

  return {
    id: decompressString(id),
    name: decompressString(name),
    phase: phase as TournamentPhase,
    pointsConfig: decompressPointsConfig(pointsConfig),
    teams: decompressArray(teams, decompressTeam),
    fixtures: decompressArray(fixtures, decompressFixture),
    dateCreated: decompressString(created),
    dateModified: decompressString(modified),
    progress: decompressProgress(progress, phase as TournamentPhase),
    ...(swissConfig && { swissConfig: decompressSwissConfig(swissConfig) }),
    ...(validatedSeedMethod && { seedMethod: validatedSeedMethod })
  };
}

export function encodeTournament(tournament: Tournament): string {
  try {
    return compressTournament(tournament);
  } catch (error) {
    console.error('Tournament encode error:', error);
    throw new Error('Failed to encode tournament data');
  }
}

export function decodeTournament(code: string): Tournament {
  try {
    return decompressTournament(code);
  } catch (error) {
    console.error('Tournament decode error:', error);
    throw new Error('Failed to decode tournament data');
  }
}
