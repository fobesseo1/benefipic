'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function BrowserRedirect() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('external');

    // 인앱 브라우저 체크
    const isInstagramApp = userAgent.includes('instagram');
    const isThreadsApp = userAgent.includes('threads');

    // 인앱 브라우저이고 아직 리다이렉트되지 않은 경우에만
    if ((isInstagramApp || isThreadsApp) && !isRedirected) {
      setShowMessage(true);

      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent:benefipic.vercel.app${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
      } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.location.href = `googlechrome://benefipic.vercel.app${window.location.pathname}`;
      } else {
        window.location.href = `https://benefipic.vercel.app${window.location.pathname}`;
      }
    }
  }, []);

  if (!showMessage) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-5 text-center">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-pulse" />
          <p className="text-xl">Processing...</p>
        </div>
        <h2 className="mb-4 text-xl font-bold">Chrome 또는 Safari로 이동합니다</h2>
        <p className="mb-5">
          전체 기능 이용을 위해
          <br />
          Chrome 또는 Safari에서 열어야 합니다.
          <br />
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}
