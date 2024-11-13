'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TournamentForm } from '../../../../components/TournamentForm';
import { storage } from '../../../../utils/storage';
import { Tournament } from '../../../../types/tournament';
import { containers } from '../../../../lib/design-system';
import { motion } from 'framer-motion';

export default function EditTournament() {
  const router = useRouter();
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const tournamentData = storage.getTournament(params.id as string);
    if (!tournamentData) {
      router.push('/');
      return;
    }
    setTournament(tournamentData);
  }, [params.id, router]);

  if (!tournament) {
    return (
      <div className={containers.content}>
        <div className={`${containers.section} flex items-center justify-center min-h-[50vh]`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    router.push(`/tournament/${tournament.id}?view=STATS`);
  };

  const handleCancel = () => {
    router.push(`/tournament/${tournament.id}?view=STATS`);
  };

  return (
    <motion.div 
      className={containers.content}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TournamentForm
        tournament={tournament}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
