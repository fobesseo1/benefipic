//app/main/MetaInAppAlert.tsx

'use client';

import { useEffect, useState } from 'react';
import InAppSpy from 'inapp-spy';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FaChrome } from 'react-icons/fa';
import { InfoIcon, X } from 'lucide-react';

export default function MetaInAppAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // 개발 중에는 로컬 스토리지 체크를 건너뛰고 항상 알림창이 보이도록 함

    const hideUntil = localStorage.getItem('hideMetaAlertUntil');
    const now = new Date().getTime();

    if (hideUntil && parseInt(hideUntil) > now) {
      setShowAlert(false);
      return;
    }

    const { appKey } = InAppSpy();
    const isMetaInApp = appKey === 'instagram' || appKey === 'threads' || appKey === 'facebook';
    setShowAlert(isMetaInApp);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const openInChrome = () => {
    if (/android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      window.location.href = `googlechrome://${window.location.host}${window.location.pathname}`;
    }
  };

  // 창 닫기 핸들러
  const handleClose = () => {
    setShowAlert(false);
  };

  // 오늘 하루 안보기 핸들러
  const handleHideToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    localStorage.setItem('hideMetaAlertUntil', tomorrow.getTime().toString());
    setShowAlert(false);
  };

  // 개발 중에는 이 조건을 제거
  if (!showAlert) return null;

  return (
    <AlertDialog open={showAlert}>
      <AlertDialogContent className="max-w-md  text-center  ">
        <div className="relative pt-12 pb-6">
          <div
            className="absolute right-0 top-0 rounded-full  bg-gray-100 p-2 shadow-sm flex items-center justify-center gap-1"
            onClick={handleClose}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            <p className="text-sm font-medium text-gray-400">닫기</p>
          </div>
          {/* 상단 이모티콘 */}
          <div className="flex justify-center mb-6">
            <div className="relative ">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 text-red-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
              </div>
              {/* 작은 원 장식들 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-200 rounded-full" />
              <div className="absolute bottom-0 -left-2 w-4 h-4 bg-red-100 rounded-full" />
            </div>
          </div>

          <AlertDialogHeader className="space-y-3 tracking-tighter">
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              앗, 잠시만요!
            </AlertDialogTitle>
            <hr />
            <AlertDialogDescription className="text-gray-600 pt-6">
              <p className="text-base leading-relaxed">지금 브라우저에서는</p>
              <p className=" text-xl font-semibold text-gray-800">
                사진 기능이 제한될 수 있어요 📸
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col space-y-4 mt-8">
            <Button
              onClick={handleHideToday}
              variant="outline"
              className="flex-1 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
            >
              알았어! 오늘은 그냥 쓸게
            </Button>
            {/* 메인 버튼 */}
            <Button
              onClick={openInChrome}
              className="shadow-md py-6 text-white hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
            >
              <FaChrome className="w-5 h-5" />
              Chrome으로 열기
            </Button>

            {/* 보조 버튼들 */}
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
