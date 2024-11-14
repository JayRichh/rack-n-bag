'use client';

import { TournamentList } from '../components/TournamentList';
import { containers, typography, spacing, layout } from '../lib/design-system';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BackgroundShapes } from '../components/BackgroundShapes';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { memo } from 'react';

const MemoizedTournamentList = memo(TournamentList);

const HeroContent = memo(() => (
  <div className="max-w-4xl mx-auto w-full">
    <div className="bg-white/[0.02] dark:bg-black/[0.02]">
      <div className="flex flex-col items-center text-center sm:text-left sm:items-start">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28"
          >
            <Image
              src="/corn-logo.png"
              alt="Rack 'n' Bag Logo"
              fill
              className="object-contain dark:invert"
              priority
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl text-black/95 dark:text-white/95 font-black tracking-tighter [text-shadow:_0_1px_2px_rgba(0,0,0,0.15)]"
          >
            <span className="tracking-tighter">Rack</span>
            <span className="mx-1 text-red-500/90 dark:text-red-500/90 font-black">'n'</span>
            <span className="tracking-tighter">Bag</span>
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xl mb-4 text-black/80 dark:text-white/80 font-semibold tracking-tight sm:text-left w-full"
        >
          Tournament Management Platform
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="max-w-2xl mb-8 text-black/75 dark:text-white/75 font-medium tracking-wide [text-shadow:_0_1px_1px_rgba(0,0,0,0.1)] leading-relaxed sm:text-left"
        >
          Create and manage tournaments with multiple formats, track scores in real-time, and sync instantly with participants. Perfect for cornhole, table tennis, and other competitive events.
        </motion.p>
      </div>
    </div>
  </div>
));

HeroContent.displayName = 'HeroContent';

const QuickTipsSection = memo(() => (
  <section className={`${layout.sectionSpacing} relative`}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        viewport={{ once: true }}
        className={`${containers.card} group hover:border-primary/20 transition-all duration-150`}
      >
        <h3 className={`${typography.h3} mb-4 group-hover:text-primary transition-colors duration-150`}>Tournament Formats</h3>
        <ul className={`${spacing.sm} text-muted-foreground`}>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Single Round-Robin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Swiss System with Buchholz scoring</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Single Elimination with Consolation</span>
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        viewport={{ once: true }}
        className={`${containers.card} group hover:border-primary/20 transition-all duration-150`}
      >
        <h3 className={`${typography.h3} mb-4 group-hover:text-primary transition-colors duration-150`}>Advanced Features</h3>
        <div className={`${spacing.sm} text-muted-foreground`}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Points or win/loss scoring systems</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Automatic bracket progression</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Format-specific statistics</span>
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        viewport={{ once: true }}
        className={`${containers.card} group hover:border-primary/20 transition-all duration-150`}
      >
        <h3 className={`${typography.h3} mb-4 group-hover:text-primary transition-colors duration-150`}>Real-time Features</h3>
        <div className={`${spacing.sm} text-muted-foreground`}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Instant peer-to-peer sync</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Live standings and brackets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Format-specific preferences</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  </section>
));

QuickTipsSection.displayName = 'QuickTipsSection';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="relative border-b border-border bg-gradient-to-b from-background to-muted/5">
        <div className="absolute inset-0 overflow-hidden">
          <ErrorBoundary>
            <BackgroundShapes />
          </ErrorBoundary>
        </div>

        <div className={`${containers.wrapper} relative z-10`}>
          <div className="min-h-[400px] py-12 flex flex-col justify-center">
            <ErrorBoundary>
              <HeroContent />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className={`${containers.wrapper} py-12`}>
          <ErrorBoundary>
            <MemoizedTournamentList />
          </ErrorBoundary>

          <ErrorBoundary>
            <QuickTipsSection />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
