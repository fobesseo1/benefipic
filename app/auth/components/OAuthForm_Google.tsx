'use client';

import { createBrowserClient } from '@supabase/ssr';
import React, { useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

export default function GoogleButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loginWithGoogle = useCallback(async () => {
    const isInAppBrowser = /Instagram|Threads/.test(navigator.userAgent);

    if (isInAppBrowser) {
      // 1. 새 창에서 열기 시도
      const newWindow = window.open(
        `${location.origin}/auth`,
        '_blank',
        'toolbar=yes,scrollbars=yes,resizable=yes,width=600,height=700'
      );

      // 2. 팝업이 차단되었거나 실패한 경우
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // 3. 시스템 브라우저로 강제 이동
        window.location.href = `${location.origin}/auth`;
      }
      return;
    }

    // 일반 브라우저에서는 기존 로직 실행
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      // 에러 발생 시 외부 브라우저로 리다이렉트
      window.location.href = `${location.origin}/auth`;
    }
  }, [supabase.auth]);

  return (
    <Button onClick={loginWithGoogle} className="w-full flex gap-2">
      <FaGoogle size="1.6rem" fill="#eee" />
      Sign in with Google
    </Button>
  );
}
