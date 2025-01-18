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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FaChrome } from 'react-icons/fa';

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
      <AlertDialogContent className="max-w-md py-16">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold tracking-tighter">
            원활한 서비스 이용을 위해 알려드립니다
          </AlertDialogTitle>
          <hr />
          <AlertDialogDescription className="space-y-2 py-8">
            <p className="leading-relaxed">
              Meta(Instagram, Facebook, Threads) 브라우저
              <br />
              <span className="text-xl font-bold text-gray-900 ">사진 촬영과 업로드</span>
              <br />
              <span className="font-bold text-gray-600">일부 기능이 제한될 수 있습니다.</span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
          <Button onClick={openInChrome} className="w-full gap-2 bg-black py-8">
            <FaChrome />
            Chrome 브라우저로 열기
          </Button>
          <div className="flex w-full gap-2 mt-12 border-t border-gray-200 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1 py-6 bg-gray-200">
              닫기
            </Button>
            <Button onClick={handleHideToday} variant="outline" className="flex-1 py-6 bg-gray-200">
              오늘 하루 보지 않기
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
