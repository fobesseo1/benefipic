// app/components/analyticsTracker/AnalyticsTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import createSupabaseBrowserClient from '@/lib/supabse/client';

const getOrCreateSessionId = () => {
  let sessionId = sessionStorage.getItem('analyticsSessionId');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analyticsSessionId', sessionId);
  }
  return sessionId;
};

export default function AnalyticsTracker({ currentUser }: { currentUser?: any }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const trackPageView = async () => {
    try {
      const parser = new UAParser(); // UAParser 사용
      const result = parser.getResult();

      const pageView = {
        user_id: currentUser?.id || null,
        path: pathname,
        page_title: document.title,
        referrer: document.referrer,
        device_type: result.device.type || 'desktop',
        device_model: result.device.model || '',
        browser_name: result.browser.name || '',
        browser_version: result.browser.version || '',
        os_name: result.os.name || '',
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        session_id: getOrCreateSessionId(),
      };

      const { error } = await supabase.from('analytics_benefipic').insert([pageView]);

      if (error) throw error;
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  useEffect(() => {
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
