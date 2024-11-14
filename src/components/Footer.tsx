'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import { typography, containers } from '../lib/design-system';

export function Footer() {
  const { settings } = useGlobalSettings();
  const currentYear = new Date().getFullYear();

  const content = (
    <footer className="w-full border-t border-border bg-gradient-to-b from-background to-muted/5 shrink-0">
      <div className={`${containers.wrapper} h-16`}>
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex space-x-6">
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
            >
              Home
            </Link>
            <Link 
              href="/tournament/new" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
            >
              New Tournament
            </Link>
          </nav>

          <p className={`${typography.small} text-muted-foreground`}>
            © {currentYear} Rack 'n' Bag
          </p>
        </div>
      </div>
    </footer>
  );

  if (settings.lowMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="shrink-0"
    >
      {content}
    </motion.div>
  );
}
