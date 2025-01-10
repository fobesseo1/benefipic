'use client';

import {
  BicepsFlexed,
  Camera,
  Dumbbell,
  Gauge,
  Goal,
  Menu,
  PersonStanding,
  Plus,
  ScanBarcode,
  SquareMenu,
  SquarePen,
  Utensils,
  X,
} from 'lucide-react';
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
          className="bg-gray-600 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer shadow-xl"
          style={{
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.6)', // 더 진한 검은색 그림자, spread 반경 증가
          }}
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-7 h-7 text-white" />
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

        <div className="flex flex-col gap-12 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 border-b-2 border-gray-200 pb-1">
              <div className="w-8 h-8 p-[6px] rounded-full border-2 border-gray-600 flex items-center justify-center">
                <Utensils size={16} className="text-gray-800" />
              </div>
              <h2 className="text-xl font-bold tracking-tighter text-gray-900">
                음식 <span className="text-xs ">관련 카테고리</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/food" onClick={() => setIsOpen(false)}>
                <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                  <Camera className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                  <p className="text-sm text-gray-900 font-bold">사진입력</p>
                </div>
              </Link>
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
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 border-b-2 border-gray-200 pb-1">
              <div className="w-8 h-8 p-[6px] rounded-full border-2 border-gray-600 flex items-center justify-center">
                <BicepsFlexed size={20} className="text-gray-800" />
              </div>
              <h2 className="text-xl font-bold tracking-tighter text-gray-900">
                운동 <span className="text-xs ">관련 카테고리</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/exercise" onClick={() => setIsOpen(false)}>
                <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                  <Dumbbell className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                  <p className="text-sm text-gray-900 font-bold">운동입력</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 border-b-2 border-gray-200 pb-1">
              <div className="w-8 h-8 p-[4px] rounded-full border-2 border-gray-600 flex items-center justify-center">
                <PersonStanding size={24} className="text-gray-800" />
              </div>
              <h2 className="text-xl font-bold tracking-tighter text-gray-900">
                신체 <span className="text-xs ">관련 카테고리</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/weight-tracker" onClick={() => setIsOpen(false)}>
                <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                  <Gauge className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                  <p className="text-sm text-gray-900 font-bold">체중입력</p>
                </div>
              </Link>
              <Link href="/health-info" onClick={() => setIsOpen(false)}>
                <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                  <Goal className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                  <p className="text-sm text-gray-900 font-bold">목표입력</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <Link href="/main" onClick={() => setIsOpen(false)} className="w-full col-span-1 ">
          <Button className="w-full my-6 p-6 bg-gray-100 " variant={'outline'}>
            홈으로
          </Button>
        </Link>

        {/* <div className="grid grid-cols-2 gap-2">
          <Link href="/food" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <Camera className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">사진입력</p>
            </div>
          </Link>
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
          <Link href="/weight-tracker" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <Gauge className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">체중입력</p>
            </div>
          </Link>
          <Link href="/health-info" onClick={() => setIsOpen(false)}>
            <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
              <Goal className="w-8 h-8 text-gray-900 " strokeWidth={1} />
              <p className="text-sm text-gray-900 font-bold">목표입력</p>
            </div>
          </Link>
        </div> */}
      </AlertDialogContent>
    </AlertDialog>
  );
}
