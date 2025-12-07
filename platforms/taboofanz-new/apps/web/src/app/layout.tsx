import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontDisplay = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'TabooFanz - Enter the Taboo',
    template: '%s | TabooFanz',
  },
  description:
    'The dark, alt, underground adult creator platform. A safe, consent-first home for boundary-pushing creators and fans with alternative, fetish-adjacent, and underground aesthetics.',
  keywords: [
    'adult creator platform',
    'alternative',
    'goth',
    'punk',
    'cyberpunk',
    'underground',
    'creator economy',
    'content creators',
  ],
  authors: [{ name: 'FANZ Ecosystem' }],
  creator: 'TabooFanz',
  publisher: 'FANZ Ecosystem',
  robots: {
    index: false, // Adult content - no public indexing
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://taboofanz.com',
    siteName: 'TabooFanz',
    title: 'TabooFanz - Enter the Taboo',
    description:
      'The dark, alt, underground adult creator platform for boundary-pushing creators and fans.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TabooFanz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TabooFanz - Enter the Taboo',
    description:
      'The dark, alt, underground adult creator platform for boundary-pushing creators.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen bg-taboo-bg font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
