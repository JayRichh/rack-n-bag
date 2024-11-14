'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { typography } from '../../lib/design-system';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useSyncContext } from '../SyncContext';
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
  Loader2,
  AlertCircle,
  X,
  Signal,
  GitBranch,
  RotateCcw
} from 'lucide-react';
import { Tournament } from '@/types/tournament';

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


function ConnectionDetails({ syncState, tournament }: { syncState: any; tournament: Tournament }) {
  const getIceStateInfo = () => {
    switch (syncState.iceConnectionState) {
      case 'connected':
        return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'checking':
        return { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'failed':
        return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  };

  const getSignalingStateInfo = () => {
    switch (syncState.signalingState) {
      case 'stable':
        return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'have-local-offer':
      case 'have-remote-offer':
        return { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'closed':
        return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  };

  const getTournamentInfo = () => {
    switch (tournament.phase) {
      case 'SWISS_SYSTEM':
        return {
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: `Round ${tournament.progress?.currentRound || 1} of ${tournament.progress?.totalRounds || 1}`
        };
      case 'SINGLE_ELIMINATION':
        return {
          color: 'text-purple-500',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: tournament.progress?.bracketStage || 'Bracket Stage'
        };
      default:
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'Round Robin'
        };
    }
  };

  const iceInfo = getIceStateInfo();
  const signalingInfo = getSignalingStateInfo();
  const tournamentInfo = getTournamentInfo();

  return (
    <div className="mt-4 space-y-2 text-sm">
      {syncState.iceConnectionState && (
        <div className={`flex items-center gap-2 px-2 py-1 rounded ${iceInfo.color} ${iceInfo.bg}`}>
          <Signal className="w-4 h-4" />
          <span>ICE: {syncState.iceConnectionState}</span>
        </div>
      )}
      {syncState.signalingState && (
        <div className={`flex items-center gap-2 px-2 py-1 rounded ${signalingInfo.color} ${signalingInfo.bg}`}>
          <Signal className="w-4 h-4" />
          <span>Signaling: {syncState.signalingState}</span>
        </div>
      )}
      <div className={`flex items-center gap-2 px-2 py-1 rounded ${tournamentInfo.color} ${tournamentInfo.bg}`}>
        <Signal className="w-4 h-4" />
        <span>Tournament: {tournamentInfo.text}</span>
      </div>
    </div>
  );
}

export function TournamentSync({ tournament }: { tournament: Tournament }) {
  const { 
    createSyncSession, 
    joinSyncSession,
    cleanup,
    isHost, 
    syncState 
  } = useSyncContext();

  const getStatusInfo = () => {
    if (syncState.error) {
      return {
        color: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Error',
        iconBg: 'bg-red-100 dark:bg-red-900/30'
      };
    }
    
    switch (syncState.status) {
      case 'connected':
        return {
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          icon: <Wifi className="w-4 h-4" />,
          text: 'Connected',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30'
        };
      case 'host':
        return {
          color: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: <Crown className="w-4 h-4" />,
          text: 'Hosting',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'connecting':
        return {
          color: 'text-yellow-500 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Connecting',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      default:
        return {
          color: 'text-gray-500 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Not Connected',
          iconBg: 'bg-gray-100 dark:bg-gray-900/30'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isTransitioning = syncState.status === 'connecting';
  const isConnected = syncState.status === 'connected' || syncState.status === 'host';
  const showDisconnectButton = syncState.status !== 'disconnected' || syncState.error;

  const handleCleanup = async () => {
    try {
      await cleanup();
    } catch (error) {
      console.error('Cleanup failed:', error);
      // Force a page reload if cleanup fails
      window.location.reload();
    }
  };

  const getFormatSpecificInfo = () => {
    switch (tournament.phase) {
      case 'SWISS_SYSTEM':
        return {
          title: 'Swiss System Tournament',
          description: 'All participants will receive updates about pairings, Buchholz scores, and round progression.',
          icon: <Signal className="w-5 h-5" />
        };
      case 'SINGLE_ELIMINATION':
        return {
          title: 'Single Elimination Tournament',
          description: 'Updates include bracket progression, consolation matches, and elimination status.',
          icon: <GitBranch className="w-5 h-5" />
        };
      default:
        return {
          title: 'Round Robin Tournament',
          description: 'Match results and standings will be synced in real-time.',
          icon: <RotateCcw className="w-5 h-5" />
        };
    }
  };

  const formatInfo = getFormatSpecificInfo();

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Globe className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
              Real-time Sync
            </h2>
            <p className="text-sm text-gray-500">
              {formatInfo.title}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showDisconnectButton && (
            <motion.div
              key="disconnect-button"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2"
            >
              <motion.button
                onClick={handleCleanup}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-5 h-5" />
                <span className="font-medium">
                  {isConnected ? 'Disconnect' : isTransitioning ? 'Cancel' : 'Close'}
                </span>
              </motion.button>
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
              {syncState.status !== 'disconnected' || syncState.error ? (
                <>
                  <div className={`p-2 rounded-full ${statusInfo.iconBg}`}>
                    {statusInfo.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {syncState.error ? (
                        syncState.error
                      ) : syncState.connectedPeers > 0 ? (
                        `${syncState.connectedPeers} connected participant${syncState.connectedPeers !== 1 ? 's' : ''}`
                      ) : (
                        'Waiting for participants to join...'
                      )}
                    </p>
                    {(isConnected || syncState.status === 'connecting') && (
                      <ConnectionDetails syncState={syncState} tournament={tournament} />
                    )}
                  </div>
                  {!syncState.error && syncState.lastSync && (
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

        {/* Format-specific Info */}
        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
          <div className="flex gap-3">
            {formatInfo.icon}
            <div className="space-y-2 text-sm">
              <p className="font-medium text-accent">{formatInfo.title}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {formatInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        {syncState.status === 'disconnected' && !syncState.error && (
          <SyncSection
            title="Start Syncing"
            icon={Link}
            tooltip="Create a new sync session or join an existing one"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={createSyncSession}
                  disabled={isTransitioning}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  whileHover={isTransitioning ? {} : { scale: 1.02 }}
                  whileTap={isTransitioning ? {} : { scale: 0.98 }}
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
                  disabled={isTransitioning}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  whileHover={isTransitioning ? {} : { scale: 1.02 }}
                  whileTap={isTransitioning ? {} : { scale: 0.98 }}
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

        {/* Error Message */}
        {syncState.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-red-600 dark:text-red-300">
                <p>
                  {syncState.error}
                </p>
                <p>
                  Please try disconnecting and connecting again. If the problem persists,
                  try refreshing the page.
                </p>
              </div>
            </div>
          </div>
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
