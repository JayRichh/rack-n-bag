'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TournamentForm } from '../../../components/TournamentForm';
import { containers } from '../../../lib/design-system';

export default function NewTournament() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <motion.div 
      className={containers.content}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <TournamentForm
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
