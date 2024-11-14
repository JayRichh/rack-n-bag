'use client';

import { useParams } from 'next/navigation';
import { TournamentView } from '../../../components/TournamentView';
import { storage } from '../../../utils/storage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tournament } from '../../../types/tournament';
import { containers } from '../../../lib/design-system';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { SyncProvider } from '../../../components/SyncContext';

const pageVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      when: "beforeChildren"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn",
      when: "afterChildren"
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

function TournamentPageContent() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadTournament = () => {
      try {
        const tournamentData = storage.getTournament(params.id as string);
        if (!tournamentData) {
          setError('Tournament not found');
          return;
        }
        setTournament(tournamentData);
      } catch (err) {
        setError('Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [params.id, isMounted]);

  if (!isMounted || isLoading) {
    return (
      <motion.div 
        className={`${containers.content} flex items-center justify-center min-h-[50vh]`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Loader2 className="w-8 h-8 text-accent" />
        </motion.div>
      </motion.div>
    );
  }

  if (error || !tournament) {
    return (
      <motion.div 
        className={`${containers.content} flex flex-col items-center justify-center min-h-[50vh] text-center`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <h2 className="text-2xl font-bold mb-4">Tournament Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {error || "The tournament you're looking for doesn't exist or has been deleted."}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Return Home
        </button>
      </motion.div>
    );
  }

  return (
    <SyncProvider tournamentId={tournament.id}>
      <motion.div 
        variants={pageVariants}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        <motion.div variants={contentVariants}>
          <TournamentView
            tournament={tournament}
            onEdit={() => router.push(`/tournament/${tournament.id}/edit`)}
            onBack={() => router.push('/')}
          />
        </motion.div>
      </motion.div>
    </SyncProvider>
  );
}

export default function TournamentPage() {
  return (
    <ErrorBoundary>
      <TournamentPageContent />
    </ErrorBoundary>
  );
}
