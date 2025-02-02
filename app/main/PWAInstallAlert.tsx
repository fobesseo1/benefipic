// app/main/PWAInstallAlert.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallAlertProps {
  userId: string;
  lastPromptDate: string | null;
  isInstalled: boolean;
}

export default function PWAInstallAlert({
  userId,
  lastPromptDate,
  isInstalled,
}: PWAInstallAlertProps) {
  const { promptInstall } = usePWAInstall(userId);

  // PWA가 설치됐는지만 체크
  if (isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="max-w-md mx-auto text-center relative pt-32 pb-6">
        {/* 상단 이모티콘 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
              <Download className="w-12 h-12 text-pink-400" />
            </div>
            {/* 작은 원 장식들 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-200 rounded-full" />
            <div className="absolute bottom-0 -left-2 w-4 h-4 bg-pink-100 rounded-full" />
          </div>
        </div>

        <div className="space-y-3 tracking-tighter p-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">서비스 설치하고</h2>
            <h2 className="text-2xl font-bold text-gray-800">모든 기능 이용</h2>
          </div>
          <hr />
          <div className="text-gray-600 pt-6">
            <p className="text-base leading-relaxed">홈 화면에서 바로 실행하고</p>
            <p className="text-xl font-semibold text-gray-800">더 빠르게 기록해보세요 📱</p>
          </div>
        </div>

        <div className="flex-col space-y-4 mt-6 py-4 px-8">
          <Button
            onClick={promptInstall}
            className="w-full shadow-md py-6 text-white bg-gray-900 hover:bg-gray-800 rounded-xl text-base tracking-tighter"
          >
            <Download className="w-5 h-5 mr-2" />
            서비스 설치 후 이용하기
          </Button>
        </div>
      </div>
    </div>
  );
}
