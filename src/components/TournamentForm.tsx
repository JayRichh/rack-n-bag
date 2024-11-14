'use client';

import React, { useState, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Team, TournamentPhase, TeamStatus, ScoringType, SwissSystemConfig } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers, spacing, layout } from '../lib/design-system';
import { initializeTournament } from '../utils/tournament-systems';

export interface TournamentFormProps {
  tournament?: Tournament;
  onSave: () => void;
  onCancel: () => void;
}

const formVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.15,
      staggerChildren: 0.03,
      when: "beforeChildren"
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15
    }
  }
};

const teamVariants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.1
    }
  }
};

export function TournamentForm({ tournament, onSave, onCancel }: TournamentFormProps) {
  const [name, setName] = useState(tournament?.name || '');
  const [teams, setTeams] = useState<Team[]>(tournament?.teams || []);
  const [phase, setPhase] = useState<TournamentPhase>(tournament?.phase || 'ROUND_ROBIN_SINGLE');
  const [scoringType, setScoringType] = useState<ScoringType>(tournament?.pointsConfig.type || 'POINTS');
  const [pointsConfig, setPointsConfig] = useState(tournament?.pointsConfig || {
    type: 'POINTS' as ScoringType,
    win: 3,
    loss: 0,
    draw: 1,
    byePoints: 3
  });
  const [newTeamName, setNewTeamName] = useState('');
  const [seedMethod, setSeedMethod] = useState(tournament?.seedMethod || 'RANDOM');
  const defaultSwissConfig: SwissSystemConfig = {
    maxRounds: tournament?.swissConfig?.maxRounds || 0,
    byeHandling: tournament?.swissConfig?.byeHandling || 'RANDOM',
    tiebreakers: tournament?.swissConfig?.tiebreakers || ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
    byePoints: tournament?.swissConfig?.byePoints || pointsConfig.byePoints || 3
  };
  const [swissConfig, setSwissConfig] = useState<SwissSystemConfig>(defaultSwissConfig);

  const handleScoringTypeChange = (type: ScoringType) => {
    setScoringType(type);
    const newPointsConfig = {
      type,
      win: type === 'WIN_LOSS' ? 1 : 3,
      loss: 0,
      draw: type === 'POINTS' ? 1 : undefined,
      byePoints: type === 'POINTS' ? 3 : 1
    };
    setPointsConfig(newPointsConfig);
    
    // Update Swiss config bye points to match
    if (phase === 'SWISS_SYSTEM') {
      setSwissConfig(prev => ({
        ...prev,
        byePoints: newPointsConfig.byePoints || 3
      }));
    }
  };

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      const newTeam: Team = {
        id: uuidv4(),
        name: newTeamName.trim(),
        status: 'ACTIVE' as TeamStatus,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        seed: teams.length + 1
      };
      setTeams([...teams, newTeam]);
      setNewTeamName('');
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    setTeams(teams.filter(team => team.id !== teamId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || teams.length < 2) return;

    // Ensure Swiss config has proper maxRounds and byePoints
    let finalSwissConfig: SwissSystemConfig | undefined;
    if (phase === 'SWISS_SYSTEM') {
      finalSwissConfig = {
        ...swissConfig,
        maxRounds: swissConfig.maxRounds || Math.ceil(Math.log2(teams.length)),
        byePoints: pointsConfig.byePoints || 3
      };
    }

    const tournamentData = initializeTournament(
      name.trim(),
      teams,
      phase,
      {
        swissConfig: finalSwissConfig,
        seedMethod: phase === 'SINGLE_ELIMINATION' ? seedMethod : undefined
      }
    );

    storage.saveTournament(tournamentData);
    onSave();
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        className={`${containers.card} max-w-4xl mx-auto`}
        variants={formVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h2 
          className={`${typography.h2} text-gray-900 dark:text-gray-100 mb-8`}
          variants={sectionVariants}
        >
          {tournament ? 'Edit Tournament' : 'Create New Tournament'}
        </motion.h2>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-8"
          variants={formVariants}
        >
          <Suspense fallback={<div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded" />}>
            {/* Tournament Name */}
            <motion.div variants={sectionVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Name
              </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="Enter tournament name"
          required
        />

        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as TournamentPhase)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:border-transparent"
        >
                <option value="ROUND_ROBIN_SINGLE">Single Round-Robin</option>
                <option value="SWISS_SYSTEM">Swiss System</option>
                <option value="SINGLE_ELIMINATION">Single Elimination with Consolation</option>
        </select>
            </motion.div>

            {/* Format-specific Configuration */}
            {phase === 'SWISS_SYSTEM' && (
              <motion.div variants={sectionVariants}>
                <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Swiss System Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Rounds
                    </label>
                    <input
                      type="number"
                      value={swissConfig.maxRounds}
                      onChange={(e) => setSwissConfig(prev => ({
                        ...prev,
                        maxRounds: parseInt(e.target.value)
                      }))}
                      className="form-input"
                      min={0}
                      placeholder="Leave 0 for automatic"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bye Handling
                    </label>
                    <select
                      value={swissConfig.byeHandling}
                      onChange={(e) => setSwissConfig(prev => ({
                        ...prev,
                        byeHandling: e.target.value as 'RANDOM' | 'LOWEST_RANKED'
                      }))}
                      className="form-select"
                    >
                      <option value="RANDOM">Random Assignment</option>
                      <option value="LOWEST_RANKED">Assign to Lowest Ranked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tiebreakers (in order)
                    </label>
                    <div className="space-y-2">
                      {swissConfig.tiebreakers.map((tiebreaker, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            value={tiebreaker}
                            onChange={(e) => {
                              const newTiebreakers = [...swissConfig.tiebreakers];
                              newTiebreakers[index] = e.target.value as any;
                              setSwissConfig(prev => ({
                                ...prev,
                                tiebreakers: newTiebreakers
                              }));
                            }}
                            className="form-select"
                          >
                            <option value="BUCHHOLZ">Buchholz Score</option>
                            <option value="HEAD_TO_HEAD">Head-to-Head</option>
                            <option value="WINS">Total Wins</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'SINGLE_ELIMINATION' && (
              <motion.div variants={sectionVariants}>
                <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Bracket Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seeding Method
                  </label>
                  <select
                    value={seedMethod}
                    onChange={(e) => setSeedMethod(e.target.value as 'RANDOM' | 'MANUAL' | 'RANKING')}
                    className="form-select"
                  >
                    <option value="RANDOM">Random Seeding</option>
                    <option value="MANUAL">Manual Seeding</option>
                    <option value="RANKING">Use Current Rankings</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Points Configuration */}
            <motion.div variants={sectionVariants}>
              <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Scoring System</h3>
              
              {/* Scoring Type Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => handleScoringTypeChange('WIN_LOSS')}
          className={`
            p-4 rounded-lg border-2 text-center transition-colors
            ${scoringType === 'WIN_LOSS'
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-gray-200 dark:border-gray-700 hover:border-accent/50'
            }
          `}
        >
                  <div className="font-medium">Win/Loss</div>
                  <div className="text-xs text-gray-500 mt-1">Simple tracking</div>
        </button>

                <button
                  type="button"
                  onClick={() => handleScoringTypeChange('POINTS')}
                  className={`
                    p-4 rounded-lg border-2 text-center transition-colors
                    ${scoringType === 'POINTS'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }
                  `}
                >
                  <div className="font-medium">Points Based</div>
                  <div className="text-xs text-gray-500 mt-1">Custom points</div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Win Points
                  </label>
                  <input
                    type="number"
                    value={pointsConfig.win}
                    onChange={(e) => setPointsConfig({ ...pointsConfig, win: parseInt(e.target.value) })}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                {scoringType === 'POINTS' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Draw Points
                      </label>
                      <input
                        type="number"
                        value={pointsConfig.draw}
                        onChange={(e) => setPointsConfig({ ...pointsConfig, draw: parseInt(e.target.value) })}
                        className="form-input"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bye Points
                      </label>
                      <input
                        type="number"
                        value={pointsConfig.byePoints}
                        onChange={(e) => setPointsConfig({ ...pointsConfig, byePoints: parseInt(e.target.value) })}
                        className="form-input"
                        min="0"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loss Points
                  </label>
                  <input
                    type="number"
                    value={pointsConfig.loss}
                    onChange={(e) => setPointsConfig({ ...pointsConfig, loss: parseInt(e.target.value) })}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Players */}
            <motion.div variants={sectionVariants}>
              <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Players</h3>
              
              {/* Add Player */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="form-input flex-grow"
                  placeholder="Enter player name"
                />
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="btn btn-secondary"
                  disabled={!newTeamName.trim()}
                >
                  Add Player
                </button>
              </div>

              {/* Player List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      variants={teamVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="text-gray-900 dark:text-gray-100">{team.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(team.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {teams.length < 2 && (
                  <motion.p 
                    className="text-sm text-red-500 dark:text-red-400 mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    Add at least 2 players to create a tournament
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Form Actions */}
            <motion.div 
              className="flex justify-end gap-4 pt-6"
              variants={sectionVariants}
            >
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!name.trim() || teams.length < 2}
        >
          {tournament ? 'Save Changes' : 'Create Tournament'}
        </button>
            </motion.div>
          </Suspense>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
