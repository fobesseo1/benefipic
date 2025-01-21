// app/main/usePWAInstall.ts
'use client';

import { useState, useEffect } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function usePWAInstall(userId: string) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = async () => {
      // PWA가 설치되면 Supabase 업데이트
      try {
        await supabase
          .from('userdata')
          .update({
            pwa_installed: true,
            last_install_prompt: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Failed to update installation status:', error);
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [userId]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // 사용자가 설치를 수락했을 때의 처리
      await supabase
        .from('userdata')
        .update({
          pwa_installed: true,
          last_install_prompt: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // 사용자가 설치를 거부했을 때의 처리
      await supabase
        .from('userdata')
        .update({
          last_install_prompt: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    setDeferredPrompt(null);
  };

  return {
    isInstallable,
    promptInstall,
  };
}
