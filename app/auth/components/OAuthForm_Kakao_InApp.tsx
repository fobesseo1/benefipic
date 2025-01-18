//app/auth/components/OAuthForm_Kakao.tsx

'use client';

import { createBrowserClient } from '@supabase/ssr';
import React, { useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { Button } from '@/components/ui/button';

export default function KakaoButtonInApp() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loginWithKakao = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }, [supabase.auth]);

  return (
    <div
      onClick={loginWithKakao}
      className="w-full h-16 flex gap-2 bg-yellow-400 text-gray-900 rounded-2xl items-center justify-center shadow-md"
    >
      <RiKakaoTalkFill size={32} fill="#111" />
      <p className="font-bold">카카오로 3초만에 시작하기</p>
    </div>
  );
}
