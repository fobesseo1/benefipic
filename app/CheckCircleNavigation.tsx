'use client';

import { usePathname } from 'next/navigation';
import CircleButtonWithAlert from './components/shared/CircleButtonWithAlert';
import Link from 'next/link';
import {
  Camera,
  House,
  X,
  Pizza,
  Dumbbell,
  MenuSquare,
  FileQuestion,
  MailQuestion,
  Salad,
  ReceiptText,
} from 'lucide-react';
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
      <div className="z-50 lg:max-w-lg w-full fixed left-1/2 -translate-x-1/2 bottom-0 pointer-events-none">
        <div className="relative w-full">
          <div className="absolute bottom-40 right-4 z-50 pointer-events-auto">
            <div
              className="bg-black w-16 h-16 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
              style={{
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.6)',
              }}
              onClick={() => setShowRouteDialog(true)}
            >
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>

          {/*  <div className="absolute bottom-[168px] right-4 z-50 w-8 h-[2px] bg-gray-400 pointer-events-auto mr-4 shadow-lg"></div>
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
          </div> */}
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
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 flex items-center gap-4 shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                <div className="bg-gray-100 p-4 rounded-full">
                  <Salad className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-xl block">🥄 식사 기록</span>
                  <span className="text-sm text-gray-400">식사 기록 및 칼로리 체크!</span>
                </div>
              </button>
            </Link>

            <Link href="/food-check">
              <button
                onClick={() => setShowRouteDialog(false)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 flex items-center gap-4 shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                <div className="bg-gray-100 p-4 rounded-full">
                  <FileQuestion className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-xl block">🤔 먹을까? 말까?</span>
                  <span className="text-sm text-gray-400">먹을지 말지 딱! 정해드림</span>
                </div>
              </button>
            </Link>

            <Link href="/menu">
              <button
                onClick={() => setShowRouteDialog(false)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 flex items-center gap-4 shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                <div className="bg-gray-100 p-4 rounded-full">
                  <ReceiptText className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-xl block">🍽️ 메뉴 추천</span>
                  <span className="text-sm text-gray-400">메뉴판 찍으면 건강한 메뉴 추천</span>
                </div>
              </button>
            </Link>

            <Link href="/exercise">
              <button
                onClick={() => setShowRouteDialog(false)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 flex items-center gap-4 shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                <div className="bg-gray-100 p-4 rounded-full">
                  <Dumbbell className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-xl block">💪 운동 기록</span>
                  <span className="text-sm text-gray-400">오늘 운동 바로 기록!</span>
                </div>
              </button>
            </Link>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
