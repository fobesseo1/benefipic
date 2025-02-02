// app/main/PWAInstallAlert.tsx
'use client';

interface PWAInstallAlertProps {
  userId: string;
  lastPromptDate: string | null;
  isInstalled: boolean;
}

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
import { Download, X } from 'lucide-react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallAlertProps {
  userId: string;
  lastPromptDate: string | null;
}

export default function PWAInstallAlert({ userId, lastPromptDate }: PWAInstallAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall(userId);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const shouldShowPrompt = () => {
      if (!lastPromptDate) return true;
      const lastPrompt = new Date(lastPromptDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 3;
    };

    if (isInstallable && shouldShowPrompt()) {
      setShowAlert(true);
    }
  }, [isInstallable, lastPromptDate]);

  const handleClose = async () => {
    console.log('Closing alert, userId:', userId);
    try {
      const { data, error } = await supabase
        .from('userdata')
        .update({ last_install_prompt: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update last prompt date:', error);
      } else {
        console.log('Successfully updated last prompt date:', data);
      }
    } catch (error) {
      console.error('Failed to update last prompt date:', error);
    }
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <AlertDialog open={showAlert}>
      <AlertDialogContent className="max-w-md text-center">
        <div className="relative pt-12 pb-6">
          <div
            className="absolute right-0 top-0 rounded-full bg-gray-50 p-2 shadow-sm flex items-center justify-center gap-1"
            onClick={handleClose}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            <p className="text-sm font-medium text-gray-400">닫기</p>
          </div>

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

          <AlertDialogHeader className="space-y-3 tracking-tighter">
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              앱 설치하고 더 편하게!
            </AlertDialogTitle>
            <hr />
            <AlertDialogDescription className="text-gray-600 pt-6">
              <p className="text-base leading-relaxed">홈 화면에서 바로 실행하고</p>
              <p className="text-xl font-semibold text-gray-800">더 빠르게 기록해보세요 📱</p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col space-y-4 mt-8">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
            >
              나중에 하기
            </Button>
            <Button
              onClick={promptInstall}
              className="shadow-md py-6 text-white bg-gray-900 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
            >
              <Download className="w-5 h-5 mr-2" />앱 설치하기
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
