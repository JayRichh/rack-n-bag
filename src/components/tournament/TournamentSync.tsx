import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentSync } from '../../hooks/useTournamentSync';
import { typography } from '../../lib/design-system';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Globe,
  Link,
  Info,
  Users,
  Wifi,
  WifiOff,
  ArrowRight,
  Crown,
  Clock,
  Loader2
} from 'lucide-react';

interface SyncSectionProps {
  title: string;
  icon: any;
  children: React.ReactNode;
  tooltip?: string;
}

function SyncSection({ title, icon: Icon, children, tooltip }: SyncSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>
            {title}
          </h3>
        </div>
        {tooltip && (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Info className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="z-[100] bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs border border-gray-200 dark:border-gray-700"
                  sideOffset={5}
                >
                  {tooltip}
                  <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>
      {children}
    </div>
  );
}

export function TournamentSync({ tournamentId }: { tournamentId: string }) {
  const { createSyncSession, joinSyncSession, isHost, syncState } = useTournamentSync(tournamentId);

  const getStatusColor = () => {
    switch (syncState.status) {
      case 'connected':
        return 'emerald';
      case 'host':
        return 'blue';
      case 'connecting':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case 'connected':
        return 'Connected';
      case 'host':
        return 'Hosting';
      case 'connecting':
        return 'Connecting';
      default:
        return 'Not Connected';
    }
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'host':
        return <Crown className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Globe className="w-6 h-6 text-accent" />
          </div>
          <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
            Real-time Sync
          </h2>
        </div>

        <AnimatePresence>
          {syncState.status !== 'disconnected' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-2 text-${getStatusColor()}-500 dark:text-${getStatusColor()}-400 bg-${getStatusColor()}-50 dark:bg-${getStatusColor()}-900/20 px-3 py-1.5 rounded-lg`}
            >
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-8">
        {/* Connection Status */}
        <SyncSection
          title="Connection Status"
          icon={Users}
          tooltip="Current sync status and connection information"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              {syncState.status !== 'disconnected' ? (
                <>
                  <div className={`p-2 rounded-full bg-${getStatusColor()}-100 dark:bg-${getStatusColor()}-900/30`}>
                    {getStatusIcon()}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-${getStatusColor()}-600 dark:text-${getStatusColor()}-400`}>
                      {getStatusText()}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {syncState.connectedPeers > 0 ? (
                        `${syncState.connectedPeers} connected participant${syncState.connectedPeers !== 1 ? 's' : ''}`
                      ) : (
                        'Waiting for participants to join...'
                      )}
                    </p>
                  </div>
                  {syncState.lastSync && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Last sync: {new Date(syncState.lastSync).toLocaleTimeString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <WifiOff className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Not Connected
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create or join a sync session to enable real-time updates
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </SyncSection>

        {/* Sync Controls */}
        {syncState.status === 'disconnected' && (
          <SyncSection
            title="Start Syncing"
            icon={Link}
            tooltip="Create a new sync session or join an existing one"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={createSyncSession}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Crown className="w-5 h-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium group-hover:text-accent">Create Session</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Start a new sync group as host
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  onClick={joinSyncSession}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link className="w-5 h-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium group-hover:text-accent">Join Session</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Connect to existing host
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>
            </div>
          </SyncSection>
        )}

        {/* Help Text */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
              <p>
                Real-time sync allows instant updates between all connected participants.
                Your connection will be maintained even if you close and reopen the app.
              </p>
              <p>
                To get started, either create a new sync session as a host or join an existing host's session.
                All tournament updates will automatically sync between connected participants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}