'use client';

import { motion } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { TournamentSettings } from '../../types/settings';
import { Switch } from '../ui/switch';
import { X, Eye, Target, Moon, Zap } from 'lucide-react';

export interface TournamentPreferencesProps {
  settings: TournamentSettings;
  onSettingChange: (key: keyof TournamentSettings) => void;
  showSettings: boolean;
  onClose: () => void;
}

export function TournamentPreferences({ settings, onSettingChange, showSettings, onClose }: TournamentPreferencesProps) {
  const handleDarkModeChange = () => {
    // Immediately update dark mode
    onSettingChange('darkMode');
  };

  return (
    <div className="py-4 space-y-4">
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Completed Matches
            </label>
          </div>
          <Switch
            checked={settings.showCompleted}
            onCheckedChange={() => onSettingChange('showCompleted')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Upcoming Matches
            </label>
          </div>
          <Switch
            checked={settings.showUpcoming}
            onCheckedChange={() => onSettingChange('showUpcoming')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Highlight My Matches
            </label>
          </div>
          <Switch
            checked={settings.highlightMyMatches}
            onCheckedChange={() => onSettingChange('highlightMyMatches')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark Mode
            </label>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={handleDarkModeChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reduce Motion
            </label>
          </div>
          <Switch
            checked={settings.lowMotion}
            onCheckedChange={() => onSettingChange('lowMotion')}
          />
        </div>
      </div>
    </div>
  );
}
