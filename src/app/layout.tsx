import './globals.css';
import { Inter } from 'next/font/google';
import defaultMetadata from './metadata';
import { ClientLayout } from '../components/ClientLayout';

import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] });

export const metadata = defaultMetadata;
export { viewport } from './viewport';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Script to set initial theme before page load to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('current-theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
                  const theme = settings.theme || 'system';
                  
                  // Determine the effective theme
                  let effectiveTheme = 'light';
                  if (theme === 'system') {
                    effectiveTheme = systemTheme;
                  } else if (theme === 'dark' || theme === 'light') {
                    effectiveTheme = theme;
                  }

                  // Apply theme immediately
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(effectiveTheme);
                  document.documentElement.setAttribute('data-theme', effectiveTheme);
                } catch (e) {
                  console.warn('Failed to set initial theme', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-100`} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>

        <div id="pwa-install-prompt" className="hidden fixed bottom-4 left-4 z-50" />

        <Analytics />
      </body>
    </html>
  );
}
