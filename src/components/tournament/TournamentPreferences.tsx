'use client';

import { motion } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { TournamentSettings } from '../../types/settings';
import { Tournament } from '../../types/tournament';
import { Switch } from '../ui/switch';
import { 
  X, Eye, Target, Moon, Zap, Info, Sun, Monitor, 
  GitBranch, Signal, RotateCcw, Calculator, Hash,
  Trophy, Medal, Activity, TrendingUp, BarChart2
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';

export interface TournamentPreferencesProps {
  tournament: Tournament;
  settings: TournamentSettings;
  onSettingChange: (key: keyof TournamentSettings) => void;
  showSettings: boolean;
  onClose: () => void;
}

interface PreferenceItemProps {
  icon: any;
  label: string;
  tooltip: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function PreferenceItem({ icon: Icon, label, tooltip, checked, onChange, disabled }: PreferenceItemProps) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Info className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-[100] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs"
                sideOffset={5}
              >
                {tooltip}
                {disabled && (
                  <div className="mt-1 text-xs text-amber-500">
                    Not available in current tournament format
                  </div>
                )}
                <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className={`${typography.h4} text-gray-900 dark:text-gray-100 mb-4`}>
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export function TournamentPreferences({ tournament, settings, onSettingChange, showSettings, onClose }: TournamentPreferencesProps) {
  const { settings: globalSettings, updateSettings } = useGlobalSettings();
  const isPointBased = tournament.pointsConfig.type === 'POINTS';

  const renderFormatSpecificPreferences = () => {
    switch (tournament.phase) {
      case 'SWISS_SYSTEM':
        return (
          <PreferenceSection title="Swiss System Preferences">
            <PreferenceItem
              icon={Calculator}
              label="Show Buchholz Scores"
              tooltip="Display Buchholz tiebreak scores in standings"
              checked={settings.showBuchholzScores}
              onChange={() => onSettingChange('showBuchholzScores')}
            />
            <PreferenceItem
              icon={Signal}
              label="Auto-advance Rounds"
              tooltip="Automatically advance to next round when all matches are complete"
              checked={settings.autoAdvanceRounds}
              onChange={() => onSettingChange('autoAdvanceRounds')}
            />
            <PreferenceItem
              icon={Activity}
              label="Show Pairings"
              tooltip="Display upcoming match pairings for the current round"
              checked={settings.showPairings}
              onChange={() => onSettingChange('showPairings')}
            />
          </PreferenceSection>
        );

      case 'SINGLE_ELIMINATION':
        return (
          <PreferenceSection title="Bracket Preferences">
            <PreferenceItem
              icon={GitBranch}
              label="Show Consolation Bracket"
              tooltip="Display the consolation bracket for eliminated players"
              checked={settings.showConsolationBracket}
              onChange={() => onSettingChange('showConsolationBracket')}
            />
            <PreferenceItem
              icon={Eye}
              label="Show Bracket Preview"
              tooltip="Display upcoming matches in the bracket"
              checked={settings.showBracketPreview}
              onChange={() => onSettingChange('showBracketPreview')}
            />
            <PreferenceItem
              icon={Hash}
              label="Show Seeds"
              tooltip="Display player seeds in the bracket"
              checked={settings.showSeeds}
              onChange={() => onSettingChange('showSeeds')}
            />
          </PreferenceSection>
        );

      case 'ROUND_ROBIN_SINGLE':
        return (
          <PreferenceSection title="Round Robin Preferences">
            <PreferenceItem
              icon={RotateCcw}
              label="Show Round Numbers"
              tooltip="Display round numbers in the match grid"
              checked={settings.showRoundNumbers}
              onChange={() => onSettingChange('showRoundNumbers')}
            />
          </PreferenceSection>
        );
    }
  };

  return (
    <div className="py-4 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>
          Display Preferences
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-8">
        {/* Format-specific preferences */}
        {renderFormatSpecificPreferences()}

        {/* Statistics Preferences */}
        <PreferenceSection title="Statistics Display">
          <PreferenceItem
            icon={Medal}
            label="Show Points"
            tooltip="Display points in standings and results"
            checked={settings.showPoints}
            onChange={() => onSettingChange('showPoints')}
          />
          <PreferenceItem
            icon={TrendingUp}
            label="Show Form"
            tooltip="Display recent match results"
            checked={settings.showForm}
            onChange={() => onSettingChange('showForm')}
          />
          <PreferenceItem
            icon={BarChart2}
            label="Show Streak"
            tooltip="Display current winning/losing streak"
            checked={settings.showStreak}
            onChange={() => onSettingChange('showStreak')}
          />
          <PreferenceItem
            icon={Trophy}
            label="Show Draws"
            tooltip="Display draw results in statistics"
            checked={settings.showDraws}
            onChange={() => onSettingChange('showDraws')}
            disabled={!isPointBased}
          />
        </PreferenceSection>

        {/* General preferences */}
        <PreferenceSection title="General Preferences">
          <PreferenceItem
            icon={Eye}
            label="Show Completed Games"
            tooltip="Display games that have already been played and their results"
            checked={settings.showCompleted}
            onChange={() => onSettingChange('showCompleted')}
          />
          <PreferenceItem
            icon={Eye}
            label="Show Upcoming Games"
            tooltip="Display games that haven't been played yet"
            checked={settings.showUpcoming}
            onChange={() => onSettingChange('showUpcoming')}
          />
          <PreferenceItem
            icon={Target}
            label="Highlight My Games"
            tooltip="Make your games more visible in the results grid and rankings"
            checked={settings.highlightMyMatches}
            onChange={() => onSettingChange('highlightMyMatches')}
          />
          <PreferenceItem
            icon={Zap}
            label="Reduce Animations"
            tooltip="Minimize motion effects for better accessibility"
            checked={settings.lowMotion}
            onChange={() => onSettingChange('lowMotion')}
          />
        </PreferenceSection>

        {/* Theme selection */}
        <div className="space-y-4">
          <h4 className={`${typography.h4} text-gray-900 dark:text-gray-100 mb-4`}>
            Theme
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`
                flex items-center justify-center gap-2 p-4 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'light'
                  ? 'bg-accent text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                transition-colors
              `}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`
                flex items-center justify-center gap-2 p-4 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'dark'
                  ? 'bg-accent text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                transition-colors
              `}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
            <button
              onClick={() => updateSettings({ theme: 'system' })}
              className={`
                flex items-center justify-center gap-2 p-4 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'system'
                  ? 'bg-accent text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                transition-colors
              `}
            >
              <Monitor className="w-4 h-4" />
              System
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These preferences are saved locally and will persist across sessions.
        </p>
      </div>
    </div>
  );
}
