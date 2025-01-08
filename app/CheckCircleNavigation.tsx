'use client';
import { usePathname } from 'next/navigation';
import CircleButtonWithAlert from './components/shared/CircleButtonWithAlert';
import Link from 'next/link';
import { House } from 'lucide-react';

// Navigation 컴포넌트 생성
export function CheckCircleNavigation({ currentUser }: { currentUser: any }) {
  const pathname = usePathname();
  const hiddenNavPaths = ['/start', '/question'];
  const shouldShowNav = !hiddenNavPaths.includes(pathname);

  if (!shouldShowNav) return null;

  return (
    <>
      <div className="fixed bottom-[168px] right-6 z-50 ml-auto w-fit flex items-center justify-center">
        <CircleButtonWithAlert />
      </div>
      <div className="fixed bottom-28 right-6 z-50 ml-auto w-fit flex items-center justify-center">
        <Link href="/main">
          <div
            className="bg-gray-400 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
            style={{
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.6)',
            }}
          >
            <House className="w-7 h-7 text-white" />
          </div>
        </Link>
      </div>
    </>
  );
}
