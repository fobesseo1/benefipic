'use client';

import { Camera, Dumbbell, Plus, ScanBarcode, SquareMenu, SquarePen, X } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';

export default function CircleButtonWithAlert() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <div
          className="bg-gray-800 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
          style={{
            boxShadow: '0px 4px 6px rgba(255, 160, 122, 0.5)', // 녹색 그림자 예시
          }}
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-8 h-8 text-white" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md ">
        <div className="flex justify-end ">
          <Button
            variant="ghost"
            className="w-6 h-6 p-0 border-[1px] border-gray-400 rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/food" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <Camera className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">사진입력</p>
            </div>
          </Link>
          {/* <Link href="/barcode" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <ScanBarcode className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">바코드</p>
            </div>
          </Link> */}
          <Link href="/food-description" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <SquarePen className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">직접입력</p>
            </div>
          </Link>
          <Link href="/menu" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <SquareMenu className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">메뉴추천</p>
            </div>
          </Link>
          <Link href="/exercise" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <Dumbbell className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">운동입력</p>
            </div>
          </Link>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
