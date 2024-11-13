'use client';

import React, { Suspense, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Tournament } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers } from '../lib/design-system';

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 20,
      mass: 1
    }
  }
};

const TournamentCard = forwardRef<HTMLDivElement, { tournament: Tournament; onClick: () => void }>(
  ({ tournament, onClick }, ref) => {
    const completedMatches = tournament.fixtures.filter(f => f.played).length;
    const totalMatches = tournament.fixtures.length;
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return (
      <motion.div
        ref={ref}
        layout
        layoutId={tournament.id}
        variants={item}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
        className={`${containers.card} cursor-pointer hover:shadow-lg group aspect-[16/9] flex flex-col bg-white/50 dark:bg-black/50`}
        onClick={onClick}
      >
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-[calc(100vw*0.01)]">
            <div className="flex justify-between items-start">
              <h3 className={`${typography.h3} text-black/90 dark:text-white/90 group-hover:text-accent transition-colors duration-200 font-medium tracking-wide [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}>
                {tournament.name}
              </h3>
              <motion.div 
                className="bg-accent/10 dark:bg-accent/20 text-accent px-2 py-1 rounded-full text-sm font-medium tracking-wide"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {tournament.teams.length} Teams
              </motion.div>
            </div>

            <div className="flex items-center gap-4">
              <motion.span 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="badge badge-secondary font-medium tracking-wide"
              >
                {tournament.phase === 'SINGLE' ? 'Single Round' : 'Home & Away'}
              </motion.span>
            </div>
          </div>

          <div className="space-y-[calc(100vw*0.01)]">
            <div className="flex justify-between text-sm font-medium text-black/70 dark:text-white/70">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted/20 dark:bg-muted/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.2
                }}
              />
            </div>
          </div>

          <p className="text-sm font-medium text-black/60 dark:text-white/60 mt-auto">
            Last modified: {new Date(tournament.dateModified).toLocaleDateString()}
          </p>
        </div>
      </motion.div>
    );
  }
);

TournamentCard.displayName = 'TournamentCard';

function LoadingCard() {
  return (
    <motion.div
      variants={item}
      className={`${containers.card} animate-pulse aspect-[16/9]`}
    >
      <div className="space-y-[calc(100vw*0.01)]">
        <div className="h-6 bg-muted/20 dark:bg-muted/10 rounded w-3/4"></div>
        <div className="flex gap-4">
          <div className="h-5 bg-muted/20 dark:bg-muted/10 rounded w-20"></div>
          <div className="h-5 bg-muted/20 dark:bg-muted/10 rounded w-24"></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted/20 dark:bg-muted/10 rounded w-16"></div>
            <div className="h-4 bg-muted/20 dark:bg-muted/10 rounded w-8"></div>
          </div>
          <div className="h-2 bg-muted/20 dark:bg-muted/10 rounded-full w-full"></div>
        </div>
        <div className="h-4 bg-muted/20 dark:bg-muted/10 rounded w-1/2"></div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const router = useRouter();
  
  return (
    <motion.div 
      variants={item}
      className={`${containers.card} col-span-full flex flex-col items-center justify-center text-center aspect-[21/9] bg-white/50 dark:bg-black/50`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2 
        }}
        className="space-y-[calc(100vw*0.01)]"
      >
        <h3 className={`${typography.h3} text-black/90 dark:text-white/90 font-medium tracking-wide [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}>
          No Tournaments Yet
        </h3>
        <p className="text-black/70 dark:text-white/70 max-w-md font-medium">
          Create your first tournament to get started tracking scores and standings.
        </p>
        <motion.button
          whileHover={{ 
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
          onClick={() => router.push('/tournament/new')}
          className="btn btn-accent font-medium tracking-wide"
        >
          Create Tournament
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function TournamentList() {
  const router = useRouter();
  const tournaments = storage.getTournaments();

  return (
    <div className="space-y-[calc(100vw*0.02)]">
      <div className="flex justify-between items-center">
        <motion.h2 
          variants={item}
          className={`${typography.h2} text-black/95 dark:text-white/95 font-bold tracking-tight [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}
        >
          Your Tournaments
        </motion.h2>
        <motion.button
          variants={item}
          whileHover={{ 
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
          onClick={() => router.push('/tournament/new')}
          className="btn btn-accent font-medium tracking-wide shadow-lg hover:shadow-xl"
        >
          Create New Tournament
        </motion.button>
      </div>

      <Suspense fallback={
        <motion.div 
          variants={list}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[calc(100vw*0.02)]"
        >
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </motion.div>
      }>
        <motion.div 
          variants={list}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[calc(100vw*0.02)]"
        >
          <AnimatePresence mode="popLayout">
            {tournaments.length === 0 ? (
              <EmptyState />
            ) : (
              tournaments.map(tournament => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onClick={() => router.push(`/tournament/${tournament.id}?view=STATS`)}
                />
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </Suspense>
    </div>
  );
}
