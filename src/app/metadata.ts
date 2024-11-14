import { Metadata } from 'next';

const defaultMetadata: Metadata = {
  metadataBase: new URL('https://rack-n-bag.vercel.app'),
  title: {
    default: 'Rack \'n\' Bag - Tournament Management',
    template: '%s | Rack \'n\' Bag'
  },
  description: 'Create and manage tournaments with ease. Track scores, standings, and real-time results.',
  keywords: [
    'tournament',
    'tournament management',
    'sports',
    'competition',
    'brackets',
    'scores',
    'standings'
  ],
  authors: [{ name: 'Rack \'n\' Bag' }],
  creator: 'Rack \'n\' Bag',
  publisher: 'Rack \'n\' Bag',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'Rack \'n\' Bag',
    title: 'Rack \'n\' Bag - Tournament Management',
    description: 'Create and manage tournaments with ease. Track scores, standings, and real-time results.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rack \'n\' Bag Tournament Management'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rack \'n\' Bag - Tournament Management',
    description: 'Create and manage tournaments with ease. Track scores, standings, and real-time results.',
    images: ['/og-image.png']
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png'
  }
};

export function generateTournamentMetadata(tournament?: { name: string; teams: any[] }) {
  if (!tournament) return defaultMetadata;

  return {
    ...defaultMetadata,
    title: `${tournament.name} Tournament`,
    description: `Track scores and standings for ${tournament.name} tournament with ${tournament.teams.length} teams.`,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: `${tournament.name} Tournament | Rack 'n' Bag`,
      description: `Track scores and standings for ${tournament.name} tournament with ${tournament.teams.length} teams.`
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: `${tournament.name} Tournament | Rack 'n' Bag`,
      description: `Track scores and standings for ${tournament.name} tournament with ${tournament.teams.length} teams.`
    }
  } as Metadata;
}

export default defaultMetadata;
