'use client';

import { usePathname } from 'next/navigation';
import CircleButtonWithAlert from './components/shared/CircleButtonWithAlert';
import Link from 'next/link';
import { Camera, House, X, Pizza, Dumbbell } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CheckCircleNavigation({ currentUser }: { currentUser: any }) {
  const pathname = usePathname();
  const hiddenNavPaths = ['/start', '/question'];
  const shouldShowNav = !hiddenNavPaths.includes(pathname);
  const [showRouteDialog, setShowRouteDialog] = useState(false);

  if (!shouldShowNav) return null;

  return (
    <>
      <div className="lg:max-w-lg w-full fixed left-1/2 -translate-x-1/2 bottom-0 pointer-events-none">
        <div className="relative w-full">
          <div className="absolute bottom-44 right-4 z-50 pointer-events-auto">
            <div
              className="bg-rose-600 w-16 h-16 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
              style={{
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.6)',
              }}
              onClick={() => setShowRouteDialog(true)}
            >
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute bottom-[168px] right-4 z-50 w-8 h-[2px] bg-gray-400 pointer-events-auto mr-4 shadow-lg"></div>
          <div className="absolute bottom-24 right-4 z-50 pointer-events-auto">
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

      <AlertDialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <AlertDialogContent className="sm:max-w-md py-8">
          <AlertDialogHeader className="relative flex justify-end ">
            <div className="absolute -top-4 right-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <button onClick={() => setShowRouteDialog(false)} className="p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Link href="/food">
              <button
                onClick={() => setShowRouteDialog(false)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50"
              >
                <div className="bg-gray-100 p-4 rounded-full">
                  <Pizza className="h-8 w-8 text-gray-600" />
                </div>
                <span className="flex-1 text-left font-medium text-xl">음식 사진 입력</span>
              </button>
            </Link>
            <Link href="/exercise">
              <button
                onClick={() => setShowRouteDialog(false)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50"
              >
                <div className="bg-gray-100  p-4 rounded-full">
                  <Dumbbell className="h-8 w-8 text-gray-600" />
                </div>
                <span className="flex-1 text-left font-medium text-xl">운동 사진 입력</span>
              </button>
            </Link>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
