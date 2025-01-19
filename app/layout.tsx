//app/layout.tsx

import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import MysticSymbolsEffect from './Layout-component/BubbleEffect/MysticSymbolsEffect';
import StoreInitializer from './Layout-component/StoreInitializer';
import { getUser } from '@/lib/supabse/server';
import { headers } from 'next/headers';
import { CheckCircleNavigation } from './CheckCircleNavigation';
import { InstallPWA } from '@/components/InstallPWA';
import AnalyticsTracker from './components/analyticsTracker/AnalyticsTracker';
import MobileDetector from './MobileDetector';
import BrowserRedirect from './components/BrowserRedirect';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Benefipic - 찍으면 끝나는 식단관리',
  description: '찍는 순간 시작되는 내 몸의 변화',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    title: 'benefipic',
    statusBarStyle: 'default',
    capable: true,
  },
  applicationName: 'benefipic',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Benefipic',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getUser();
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const hiddenNavPaths = ['/start', '/question'];
  const shouldShowNav = !hiddenNavPaths.includes(pathname);

  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MobileDetector>
          <div className="min-h-screen w-full bg-white">
            <div className="relative min-h-screen w-full flex flex-col">
              {children}
              <StoreInitializer currentUser={currentUser} />
              <MysticSymbolsEffect />
              {shouldShowNav && <CheckCircleNavigation currentUser={currentUser} />}
            </div>
          </div>
          <BrowserRedirect />
        </MobileDetector>
        <AnalyticsTracker currentUser={currentUser} />
        <SpeedInsights />
      </body>
    </html>
  );
}
