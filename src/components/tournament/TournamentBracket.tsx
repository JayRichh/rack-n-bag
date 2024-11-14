'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tournament, Team, Fixture, BracketPosition } from '../../types/tournament';
import { ResultsEntryModal } from './ResultsEntryModal';
import { Trophy, Shield, ChevronRight } from 'lucide-react';

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdateResult?: (
    fixture: Fixture,
    homeScore: number | undefined,
    awayScore: number | undefined,
    winnerId?: string
  ) => void;
}

interface BracketNode {
  fixture?: Fixture;
  round: number;
  position: number;
  nextPosition?: number;
  bracket: BracketPosition;
}

const generateBracketStructure = (tournament: Tournament): BracketNode[] => {
  const nodes: BracketNode[] = [];
  const { fixtures } = tournament;
  
  // Group fixtures by round and bracket
  const roundFixtures = fixtures.reduce((acc, fixture) => {
    const round = fixture.round || 1;
    const bracket = fixture.bracket || 'WINNERS';
    if (!acc[bracket]) acc[bracket] = {};
    if (!acc[bracket][round]) acc[bracket][round] = [];
    acc[bracket][round].push(fixture);
    return acc;
  }, {} as Record<BracketPosition, Record<number, Fixture[]>>);

  // Create nodes for each bracket and round
  Object.entries(roundFixtures).forEach(([bracket, rounds]) => {
    Object.entries(rounds).forEach(([round, fixtures]) => {
      fixtures.forEach((fixture, index) => {
        const roundNum = parseInt(round);
        const position = index;
        const nextPosition = Math.floor(index / 2);

        nodes.push({
          fixture,
          round: roundNum,
          position,
          nextPosition: roundNum < Math.max(...Object.keys(rounds).map(Number)) ? nextPosition : undefined,
          bracket: bracket as BracketPosition
        });
      });
    });
  });

  return nodes;
};

const getBracketStage = (round: number, totalRounds: number, bracket: BracketPosition): string => {
  if (bracket === 'CONSOLATION') {
    if (round === totalRounds) return 'Consolation Final';
    if (round === totalRounds - 1) return 'Consolation Semi-Final';
    if (round === totalRounds - 2) return 'Consolation Quarter-Final';
    return `Consolation Round ${round}`;
  }

  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  return `Round ${round}`;
};

const BracketMatch: React.FC<{
  node: BracketNode;
  tournament: Tournament;
  totalRounds: number;
  onSelect: (fixture: Fixture, homeTeam: Team, awayTeam: Team) => void;
}> = ({ node, tournament, totalRounds, onSelect }) => {
  if (!node.fixture) return null;

  const homeTeam = tournament.teams.find(t => t.id === node.fixture?.homeTeamId);
  const awayTeam = tournament.teams.find(t => t.id === node.fixture?.awayTeamId);
  const isPlayable = tournament.progress?.currentRound === node.round;
  const isWinnersBracket = node.bracket === 'WINNERS';

  const handleClick = () => {
    if (!homeTeam || !awayTeam || !isPlayable) return;
    onSelect(node.fixture!, homeTeam, awayTeam);
  };

  const stage = getBracketStage(node.round, totalRounds, node.bracket);

  return (
    <motion.div
      className={`
        relative p-4 border rounded-lg shadow-sm cursor-pointer
        ${isWinnersBracket 
          ? 'bg-background hover:bg-accent/5' 
          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        ${node.fixture.played ? 'border-accent' : 'border-border'}
        ${!isPlayable ? 'opacity-50 cursor-not-allowed' : ''}
        transition-colors
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
    >
      {/* Bracket Icon */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2">
        {isWinnersBracket ? (
          <Trophy className="w-4 h-4 text-amber-500" />
        ) : (
          <Shield className="w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* Connection Lines */}
      {node.nextPosition !== undefined && (
        <>
          {/* Horizontal line */}
          <div className="absolute right-0 top-1/2 w-8 h-px bg-border" />
          {/* Arrow */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-border">
            <ChevronRight className="w-4 h-4" />
          </div>
        </>
      )}

      <div className="space-y-2">
        {/* Home Team */}
        <div className={`
          flex justify-between items-center gap-4
          ${node.fixture.winner === homeTeam?.id ? 'font-bold text-accent' : ''}
          ${homeTeam?.status === 'ELIMINATED' ? 'line-through opacity-50' : ''}
        `}>
          <span className="truncate">{homeTeam?.name || 'TBD'}</span>
          {node.fixture.played && (
            <span>{node.fixture.homeScore}</span>
          )}
        </div>

        {/* Away Team */}
        <div className={`
          flex justify-between items-center gap-4
          ${node.fixture.winner === awayTeam?.id ? 'font-bold text-accent' : ''}
          ${awayTeam?.status === 'ELIMINATED' ? 'line-through opacity-50' : ''}
        `}>
          <span className="truncate">{awayTeam?.name || 'TBD'}</span>
          {node.fixture.played && (
            <span>{node.fixture.awayScore}</span>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{stage}</span>
        {!node.fixture.played && isPlayable && (
          <span className="text-accent">Click to enter result</span>
        )}
      </div>
    </motion.div>
  );
};

export function TournamentBracket({ tournament, onUpdateResult }: TournamentBracketProps) {
  const [selectedFixture, setSelectedFixture] = useState<{
    fixture: Fixture;
    homeTeam: Team;
    awayTeam: Team;
  } | null>(null);

  const bracketNodes = generateBracketStructure(tournament);
  const rounds = Math.max(...bracketNodes.map(n => n.round));
  
  // Group nodes by bracket and round
  const groupedNodes = bracketNodes.reduce((acc, node) => {
    const key = `${node.bracket}-${node.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(node);
    return acc;
  }, {} as Record<string, BracketNode[]>);

  const handleFixtureSelect = (fixture: Fixture, homeTeam: Team, awayTeam: Team) => {
    setSelectedFixture({ fixture, homeTeam, awayTeam });
  };

  const handleSaveResult = (homeScore: number | undefined, awayScore: number | undefined, winnerId?: string) => {
    if (!selectedFixture || !onUpdateResult) return;
    onUpdateResult(selectedFixture.fixture, homeScore, awayScore, winnerId);
    setSelectedFixture(null);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {/* Winners Bracket */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Winners Bracket
          </h3>
          <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${rounds}, 1fr)` }}>
            {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
              <div key={round} className="space-y-4">
                <div className="text-sm font-medium text-gray-500 mb-4">
                  {getBracketStage(round, rounds, 'WINNERS')}
                </div>
                <div className="space-y-12">
                  {groupedNodes[`WINNERS-${round}`]?.map(node => (
                    <BracketMatch
                      key={node.fixture?.id || `${round}-${node.position}`}
                      node={node}
                      tournament={tournament}
                      totalRounds={rounds}
                      onSelect={handleFixtureSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consolation Bracket */}
        {tournament.teams.some(t => t.bracket === 'CONSOLATION') && (
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Consolation Bracket
            </h3>
            <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${rounds}, 1fr)` }}>
              {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
                <div key={round} className="space-y-4">
                  <div className="text-sm font-medium text-gray-500 mb-4">
                    {getBracketStage(round, rounds, 'CONSOLATION')}
                  </div>
                  <div className="space-y-12">
                    {groupedNodes[`CONSOLATION-${round}`]?.map(node => (
                      <BracketMatch
                        key={node.fixture?.id || `${round}-${node.position}`}
                        node={node}
                        tournament={tournament}
                        totalRounds={rounds}
                        onSelect={handleFixtureSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Entry Modal */}
      {selectedFixture && (
        <ResultsEntryModal
          isOpen={true}
          onClose={() => setSelectedFixture(null)}
          onSave={handleSaveResult}
          homeTeam={selectedFixture.homeTeam}
          awayTeam={selectedFixture.awayTeam}
          fixture={selectedFixture.fixture}
          tournament={tournament}
        />
      )}
    </div>
  );
}
