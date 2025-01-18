'use client';

import { useEffect } from 'react';
import InAppSpy from 'inapp-spy';

export default function BrowserRedirect() {
  useEffect(() => {
    const { appKey } = InAppSpy();
    const isInAppBrowser = appKey === 'instagram' || appKey === 'threads' || appKey === 'facebook';

    // 세션 스토리지에 인앱브라우저 상태 저장
    if (isInAppBrowser) {
      sessionStorage.setItem('isInAppBrowser', 'true');
      sessionStorage.setItem('appKey', appKey);
    } else {
      // 인앱브라우저가 아닐 경우 기존 데이터 삭제
      sessionStorage.removeItem('isInAppBrowser');
      sessionStorage.removeItem('appKey');
    }
  }, []);

  return null;
}
