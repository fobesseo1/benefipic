// app/main/usePWAInstall.ts
'use client';

// app/main/usePWAInstall.ts
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
      console.log('beforeinstallprompt triggered');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = async () => {
      console.log('App installed event triggered');
      try {
        const { data, error } = await supabase
          .from('userdata')
          .update({
            pwa_installed: true,
            last_install_prompt: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Supabase update error:', error);
        } else {
          console.log('Successfully updated installation status:', data);
        }
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
      console.log('No deferred prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice outcome:', outcome);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        const { data, error } = await supabase
          .from('userdata')
          .update({
            pwa_installed: true,
            last_install_prompt: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Supabase update error:', error);
        } else {
          console.log('Successfully updated installation status:', data);
        }
      } else {
        console.log('User dismissed the install prompt');
        const { error } = await supabase
          .from('userdata')
          .update({
            last_install_prompt: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Supabase update error:', error);
        }
      }
    } catch (error) {
      console.error('Error handling user choice:', error);
    }

    setDeferredPrompt(null);
  };

  return {
    isInstallable,
    promptInstall,
  };
}
