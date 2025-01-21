'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, X, Gift } from 'lucide-react';

export default function NewUserWelcomeAlert() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem('hideNewUserAlertUntil');
    const now = new Date().getTime();

    if (hideUntil && parseInt(hideUntil) > now) {
      setShowAlert(false);
      return;
    }

    setShowAlert(true);

    // 3초 후 자동으로 닫히는 타이머 설정
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 3000);

    // 컴포넌트가 언마운트되면 타이머 정리
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowAlert(false);
  };

  const handleHideToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    localStorage.setItem('hideNewUserAlertUntil', tomorrow.getTime().toString());
    setShowAlert(false);
  };

  const handleThreeDay = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);
    localStorage.setItem('hideNewUserAlertUntil', nextWeek.getTime().toString());
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <AlertDialog open={showAlert}>
      <AlertDialogContent className="max-w-md text-center">
        <div className="relative pt-12 pb-6">
          {/* 닫기 버튼 */}
          <div
            className="absolute right-0 top-0 rounded-full bg-emerald-50 p-2 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            onClick={handleClose}
          >
            <X className="h-4 w-4 text-emerald-400 hover:text-emerald-600" />
            <p className="text-sm font-medium text-emerald-400">닫기</p>
          </div>

          {/* 상단 이모티콘 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <Gift className="w-12 h-12 text-emerald-500" />
              </div>
              {/* 장식 요소들 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-200 rounded-full" />
              <div className="absolute bottom-0 -left-2 w-4 h-4 bg-emerald-100 rounded-full" />
              <div className="absolute top-2 -right-3 w-4 h-4 bg-pink-100 rounded-full" />
            </div>
          </div>

          <AlertDialogHeader className="space-y-3 tracking-tighter">
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              환영합니다! 🎉
            </AlertDialogTitle>
            <hr />
            <AlertDialogDescription className="text-gray-600 pt-6 space-y-2">
              <p className="text-base leading-relaxed">새로운 회원님을 위한</p>
              <p className="text-xl font-semibold text-emerald-800">2주간 완전 무료 특별 혜택</p>
              <p className="text-sm text-gray-500 mt-2">
                광고 시청 없이 무제한으로 서비스를
                <br />
                즐기실 수 있어요! ✨
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="w-full flex-col space-y-4 mt-8 flex justify-center items-center">
            {/* <Button
              onClick={handleHideToday}
              variant="outline"
              className="flex-1 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
            >
              오늘은 그만 보기
            </Button> */}
            <button
              onClick={handleHideToday}
              className="shadow-md py-3 w-3/4 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl "
            >
              <div className="flex flex-col items-center justify-center text-lg font-semibold gap-1">
                <p>좋아요! 시작! </p>
                <p className="text-xs">(오늘은 그만 보기)</p>
              </div>
            </button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
