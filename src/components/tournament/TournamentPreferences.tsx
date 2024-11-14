'use client';

import { motion } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { TournamentSettings } from '../../types/settings';
import { Switch } from '../ui/switch';
import { X, Eye, Target, Moon, Zap, Info, Sun, Monitor } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';

export interface TournamentPreferencesProps {
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
}

function PreferenceItem({ icon: Icon, label, tooltip, checked, onChange }: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
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
                className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs"
                sideOffset={5}
              >
                {tooltip}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function TournamentPreferences({ settings, onSettingChange, showSettings, onClose }: TournamentPreferencesProps) {
  const { settings: globalSettings, updateSettings } = useGlobalSettings();

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

        <div className="py-2">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Info className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs"
                    sideOffset={5}
                  >
                    Choose your preferred color theme
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`
                flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'light'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'dark'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium
                ${globalSettings.theme === 'system'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                transition-colors
              `}
            >
              <Monitor className="w-4 h-4" />
              System
            </button>
          </div>
        </div>

        <PreferenceItem
          icon={Zap}
          label="Reduce Animations"
          tooltip="Minimize motion effects for better accessibility"
          checked={settings.lowMotion}
          onChange={() => onSettingChange('lowMotion')}
        />
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These preferences are saved locally and will persist across sessions.
        </p>
      </div>
    </div>
  );
}
