// app/components/BrowserRedirect.tsx
'use client';

import { useEffect } from 'react';

export default function BrowserRedirect() {
  useEffect(() => {
    const redirectIfNeeded = () => {
      // URL 파라미터에서 리다이렉트 여부 확인
      const urlParams = new URLSearchParams(window.location.search);
      const redirected = urlParams.get('redirected');

      // 링크를 통해 접속했고 아직 리다이렉트되지 않았다면
      if (document.referrer && !redirected) {
        // 리다이렉트 파라미터를 추가하여 새로운 URL 생성
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('redirected', 'true');

        // 시스템 브라우저로 열기
        window.location.href = newUrl.toString();
      }
    };

    redirectIfNeeded();
  }, []);

  return null;
}
