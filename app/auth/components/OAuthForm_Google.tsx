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
    // Instagram/Threads 내장 브라우저 체크
    const isInAppBrowser = /Instagram|Threads/.test(navigator.userAgent);

    if (isInAppBrowser) {
      // 외부 브라우저에서 인증 페이지 열기
      window.location.href = `${location.origin}/auth`;
      return;
    }

    // 일반 브라우저에서는 기존 로직대로 진행
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        skipBrowserRedirect: false, // 브라우저 리다이렉트 허용
      },
    });
  }, [supabase.auth]);

  return (
    <Button onClick={loginWithGoogle} className="w-full flex gap-2">
      <FaGoogle size="1.6rem" fill="#eee" />
      Sign in with Google
    </Button>
  );
}
