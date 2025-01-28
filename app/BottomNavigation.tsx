'use client';

import {
  BicepsFlexed,
  Camera,
  Dumbbell,
  FileQuestion,
  Gauge,
  Goal,
  Home,
  House,
  Menu,
  Mic,
  Pen,
  PersonStanding,
  ReceiptText,
  Salad,
  SquareMenu,
  SquarePen,
  Utensils,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSpeechStore } from '@/app/store/speechStore';

export default function BottomNavigation() {
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const setSpeechAnalyzer = useSpeechStore((state) => state.setSpeechAnalyzer);
  return (
    <div className="z-50 fixed bottom-0 w-full h-16 bg-gradient-to-b from-gray-200 to-gray-50 grid grid-cols-5 px-4 pt-3 gap-4 rounded-t-2xl">
      <Link href="/main">
        <div className="col-span-1   flex flex-col items-center gap-[2px]">
          <div className="w-8 h-8 flex items-center justify-center ">
            <Home className="w-7 h-7 text-gray-600 " />
          </div>
          <p className="text-gray-600 text-xs font-semibold">홈</p>
        </div>
      </Link>
      <div
        className="col-span-1   flex flex-col items-center gap-[2px]"
        onClick={() => setShowRouteDialog(true)}
      >
        <div className="w-8 h-8 flex items-center justify-center ">
          <Camera className="w-8 h-8 text-gray-600 " />
        </div>
        <p className="text-gray-600 text-xs font-semibold">사진</p>
      </div>
      <Link href="/main">
        <div
          className="col-span-1 flex flex-col items-center gap-[2px]"
          onClick={() => setSpeechAnalyzer(true, true)}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Pen className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-600 text-xs font-semibold">텍스트</p>
        </div>
      </Link>
      <Link href="/main">
        <div
          className="col-span-1 flex flex-col items-center gap-[2px]"
          onClick={() => setSpeechAnalyzer(true, true)} // 'voice' 모드로 설정
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Mic className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-600 text-xs font-semibold">음성</p>
        </div>
      </Link>

      <div
        className="col-span-1   flex flex-col items-center gap-[2px]"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-8 h-8 flex items-center justify-center ">
          <Menu className="w-7 h-7 text-gray-600 " />
        </div>
        <p className="text-gray-600 text-xs font-semibold">메뉴</p>
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

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
                <Link href="/food-check" onClick={() => setIsOpen(false)}>
                  <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                    <Camera className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                    <p className="text-sm text-gray-900 font-bold tracking-tighter whitespace-pre-line">{`먹을까?\n말까?`}</p>
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
                    <Camera className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                    <p className="text-sm text-gray-900 font-bold">사진입력</p>
                  </div>
                </Link>
                <Link href="/exercise-description" onClick={() => setIsOpen(false)}>
                  <div className="w-full h-full flex gap-2 items-center justify-between border border-gray-200 rounded-lg py-2 px-7 ">
                    <SquarePen className="w-8 h-8 text-gray-900 " strokeWidth={1} />
                    <p className="text-sm text-gray-900 font-bold">직접입력</p>
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
            <Button className="w-full my-6 p-6 bg-gray-200 text-gray-600 " variant={'outline'}>
              <House className="w-8 h-8 " />
              <p>홈으로</p>
            </Button>
          </Link>

          <p className="text-gray-400 text-center text-sm">문의/제안 : benefiboard@gmail.com</p>

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
    </div>
  );
}
