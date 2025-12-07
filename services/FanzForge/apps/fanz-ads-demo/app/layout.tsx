import './globals.css';
import { FanzAdsProvider } from '@fanz/ads-client';

export const metadata = {
  title: 'FANZ Ads Demo - Cross-Platform Ad System',
  description: 'Demonstration of the FANZ cross-platform ad system with live placements',
  robots: 'noindex,nofollow', // Demo only
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const adsApiUrl = process.env.NEXT_PUBLIC_ADS_API || 'http://localhost:4000';
  const platform = (process.env.NEXT_PUBLIC_PLATFORM as any) || 'boyfanz';

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <FanzAdsProvider baseUrl={adsApiUrl} platform={platform}>
          {children}
        </FanzAdsProvider>
      </body>
    </html>
  );
}