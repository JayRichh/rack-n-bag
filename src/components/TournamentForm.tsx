'use client';

import React, { useState, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Team, TournamentPhase, TeamStatus } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers, spacing, layout } from '../lib/design-system';

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
  const [phase, setPhase] = useState<TournamentPhase>(tournament?.phase || 'SINGLE');
  const [pointsConfig, setPointsConfig] = useState(tournament?.pointsConfig || {
    win: 3,
    draw: 1,
    loss: 0
  });
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      const newTeam: Team = {
        id: uuidv4(),
        name: newTeamName.trim(),
        status: 'ACTIVE' as TeamStatus,
        played: 0,
        won: 0,
        lost: 0,
        points: 0
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

    const tournamentData: Tournament = {
      id: tournament?.id || uuidv4(),
      name: name.trim(),
      teams,
      phase,
      pointsConfig,
      fixtures: tournament?.fixtures || [],
      dateCreated: tournament?.dateCreated || new Date().toISOString(),
      dateModified: new Date().toISOString()
    };

    storage.saveTournament(tournamentData);
    onSave();
  };

  return (
    <motion.div 
      className={`${layout.maxWidth} ${layout.contentPadding} py-8`}
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
                className="form-input"
                placeholder="Enter tournament name"
                required
              />
            </motion.div>

            {/* Tournament Phase */}
            <motion.div variants={sectionVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Format
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as TournamentPhase)}
                className="form-select"
              >
                <option value="SINGLE">Single Round</option>
                <option value="HOME_AND_AWAY">Home and Away</option>
              </select>
            </motion.div>

            {/* Points Configuration */}
            <motion.div variants={sectionVariants}>
              <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Points System</h3>
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

            {/* Teams */}
            <motion.div variants={sectionVariants}>
              <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>Teams</h3>
              
              {/* Add Team */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="form-input flex-grow"
                  placeholder="Enter team name"
                />
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="btn btn-secondary"
                  disabled={!newTeamName.trim()}
                >
                  Add Team
                </button>
              </div>

              {/* Team List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {teams.map(team => (
                    <motion.div
                      key={team.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      variants={teamVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                    >
                      <span className="text-gray-900 dark:text-gray-100">{team.name}</span>
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
                    Add at least 2 teams to create a tournament
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
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
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
