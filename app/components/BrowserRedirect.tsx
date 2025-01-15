'use client';

import { useEffect, useState } from 'react';
import MainLoading from '../Mainloading';
import { LoaderCircle } from 'lucide-react';

export default function BrowserRedirect() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('external');

    if (document.referrer && !isRedirected) {
      setShowMessage(true);

      // Android인 경우
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent:benefipic.vercel.app${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
      }
      // iOS인 경우
      else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.location.href = `googlechrome://benefipic.vercel.app${window.location.pathname}`;
      }
      // 기타 경우
      else {
        window.location.href = `https://benefipic.vercel.app${window.location.pathname}`;
      }
    }
  }, []);

  if (!showMessage) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-5 text-center">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-spin" />
          <p className="text-xl">Processing...</p>
        </div>
        <h2 className="mb-4 text-xl font-bold">Chrome 또는 Safari로 이동합니다</h2>
        <p className="mb-5">
          전체 기능 이용을 위해
          <br />
          Chrome 또는 Safari에서 열어야 합니다.
          <br />이 창은 닫으셔도 됩니다.
        </p>
        <button
          onClick={() => window.close()}
          className="px-8 py-4 bg-black text-white rounded text-base"
        >
          창 닫기
        </button>
      </div>
    </div>
  );
}
