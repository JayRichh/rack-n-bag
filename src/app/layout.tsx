import './globals.css';
import { Inter } from 'next/font/google';
import defaultMetadata from './metadata';
import { ClientLayout } from '../components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E63946" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-100`} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>

        <div id="pwa-install-prompt" className="hidden fixed bottom-4 left-4 z-50" />
      </body>
    </html>
  );
}
