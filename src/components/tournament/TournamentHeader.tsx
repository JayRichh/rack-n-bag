'use client';

import { motion } from 'framer-motion';
import { Tournament } from '../../types/tournament';
import { ParticipantSelector } from '../ParticipantSelector';
import { Settings, ArrowLeft, Edit, Grid, BarChart2, Table2, Sliders, Eye, Cog, Globe, Wifi } from 'lucide-react';
import { typography } from '../../lib/design-system';
import * as Tooltip from '@radix-ui/react-tooltip';

export type ViewMode = 'STATS' | 'GRID' | 'TABLE';

export interface TournamentHeaderProps {
  tournament: Tournament;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSettingsToggle: () => void;
  onPreferencesToggle: () => void;
  onSyncToggle: () => void;
  showSettings: boolean;
  showPreferences: boolean;
  showSync: boolean;
  onEdit: () => void;
  onBack: () => void;
  selectedPlayerId: string;
  onParticipantSelect: (playerId: string) => void;
}

export function TournamentHeader({
  tournament,
  viewMode,
  onViewModeChange,
  onSettingsToggle,
  onPreferencesToggle,
  onSyncToggle,
  showSettings,
  showPreferences,
  showSync,
  onEdit,
  onBack,
  selectedPlayerId,
  onParticipantSelect
}: TournamentHeaderProps) {
  const ViewButton = ({ mode, icon: Icon, label, tooltip }: { mode: ViewMode; icon: any; label: string; tooltip: string }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.button
          onClick={() => onViewModeChange(mode)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            ${viewMode === mode 
              ? 'bg-accent text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            transition-colors
          `}
          whileHover={{ scale: 1.00 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-4 h-4" />
          {label}
        </motion.button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
          sideOffset={5}
        >
          {tooltip}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );

  const ActionButton = ({ 
    icon: Icon, 
    label,
    onClick, 
    isActive,
    tooltip 
  }: { 
    icon: any;
    label: string;
    onClick: () => void; 
    isActive?: boolean;
    tooltip: string;
  }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.button
          onClick={onClick}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            ${isActive 
              ? 'bg-accent text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            transition-colors
          `}
          whileHover={{ scale: 1.00 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </motion.button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
          sideOffset={5}
        >
          {tooltip}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );

  return (
    <div className="py-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                onClick={onBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                sideOffset={5}
              >
                Return to tournament list
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <h1 className={`${typography.h2} text-black/90 dark:text-white/90`}>
            {tournament.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            icon={Globe}
            label="Real-time Sync"
            onClick={onSyncToggle}
            isActive={showSync}
            tooltip="Enable real-time sync with other participants"
          />

          <ActionButton
            icon={Eye}
            label="View Options"
            onClick={onPreferencesToggle}
            isActive={showPreferences}
            tooltip="Customize how tournament data is displayed"
          />

          <ActionButton
            icon={Cog}
            label="Tournament Settings"
            onClick={onSettingsToggle}
            isActive={showSettings}
            tooltip="Configure tournament rules and manage data"
          />

          <ActionButton
            icon={Edit}
            label="Edit Details"
            onClick={onEdit}
            tooltip="Modify tournament name, players, and point system"
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ViewButton 
            mode="STATS" 
            icon={BarChart2} 
            label="Performance Stats" 
            tooltip="View detailed player performance statistics"
          />
          <ViewButton 
            mode="GRID" 
            icon={Grid} 
            label="Results Grid" 
            tooltip="View and update match results in a grid format"
          />
          <ViewButton 
            mode="TABLE" 
            icon={Table2} 
            label="Player Rankings" 
            tooltip="View tournament standings and player rankings"
          />
        </div>

        <div className="w-64">
          <ParticipantSelector
            tournament={tournament}
            onSelect={onParticipantSelect}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
}
