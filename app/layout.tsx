import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import MysticSymbolsEffect from './Layout-component/BubbleEffect/MysticSymbolsEffect';
import StoreInitializer from './Layout-component/StoreInitializer';
import { getUser } from '@/lib/supabse/server';
import { headers } from 'next/headers';
import { CheckCircleNavigation } from './CheckCircleNavigation';
import { InstallPWA } from '@/components/InstallPWA';

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
        <div className="mx-auto relative lg:shadow-[0_0_15px_rgba(0,0,0,0.1)] lg:max-w-lg">
          <div className="relative min-h-screen w-full lg:max-w-lg mx-auto bg-white">
            {children}
            <StoreInitializer currentUser={currentUser} />
            <MysticSymbolsEffect />
            <CheckCircleNavigation currentUser={currentUser} />
            {/* <InstallPWA /> */}
          </div>
        </div>
      </body>
    </html>
  );
}
