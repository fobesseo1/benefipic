'use client';
import { usePathname } from 'next/navigation';
import CircleButtonWithAlert from './components/shared/CircleButtonWithAlert';
import Link from 'next/link';
import { House } from 'lucide-react';

export function CheckCircleNavigation({ currentUser }: { currentUser: any }) {
  const pathname = usePathname();
  const hiddenNavPaths = ['/start', '/question'];
  const shouldShowNav = !hiddenNavPaths.includes(pathname);

  if (!shouldShowNav) return null;

  return (
    <div className="lg:max-w-lg w-full fixed left-1/2 -translate-x-1/2 bottom-0 pointer-events-none">
      <div className="relative w-full">
        <div className="absolute bottom-20 right-4 z-50 pointer-events-auto">
          <CircleButtonWithAlert />
        </div>
        <div className="absolute bottom-6 right-4 z-50 pointer-events-auto">
          <Link href="/main">
            <div
              className="bg-gray-400 w-16 h-16 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
              style={{
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.6)',
              }}
            >
              <House className="w-7 h-7 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
