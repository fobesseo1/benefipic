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
import { Chrome, Download } from 'lucide-react';

export default function MetaInAppAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowAlert(false); // 설치 성공 시 알림창 닫기
    }
  };

  if (!showAlert) return null;

  return (
    <AlertDialog open={showAlert}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold mb-2">
            원활한 서비스 이용을 위해 필요합니다
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Meta(Instagram, Facebook, Threads) 브라우저에서는
              <br />
              사진 촬영과 업로드 기능 이용이 제한됩니다.
            </p>
            <p className="font-medium text-black">아래 두 가지 방법 중 하나를 선택해주세요:</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
          <Button
            onClick={openInChrome}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 py-6"
          >
            <Chrome className="w-5 h-5" />
            Chrome 브라우저로 열기
          </Button>
          <Button
            onClick={handleInstallClick}
            className="w-full gap-2 bg-gray-900 hover:bg-gray-800 py-6"
            disabled={!isInstallable}
          >
            <Download className="w-5 h-5" />앱 설치하기
            <span className="text-sm">(1회만 설치하면 됩니다)</span>
          </Button>
          {showError && (
            <p className="text-sm text-red-500 text-center mt-2">
              이미 설치되어 있거나 현재 브라우저에서는 설치할 수 없습니다.
              <br />
              Chrome으로 이동해서 다시 시도해주세요.
            </p>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
